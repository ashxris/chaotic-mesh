// Explicit print-density metadata; browser canvas encoders otherwise use 96 DPI.
const encoder = new TextEncoder();
const ascii = (value) => encoder.encode(value);
const join = (...parts) => {
  const result = new Uint8Array(
    parts.reduce((sum, part) => sum + part.length, 0),
  );
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
};
const uint32 = (value, little = false) => {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value, little);
  return bytes;
};
const read32 = (bytes, offset, little = false) =>
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(
    offset,
    little,
  );
const label = (bytes, offset) =>
  String.fromCharCode(...bytes.slice(offset, offset + 4));
function crc32(bytes) {
  let crc = -1;
  for (const byte of bytes) {
    crc ^= byte;
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ -1) >>> 0;
}
function pngChunk(type, payload) {
  const body = join(ascii(type), payload);
  return join(uint32(payload.length), body, uint32(crc32(body)));
}
function pngDensity(bytes, dpi) {
  const ppm = Math.round(dpi / 0.0254);
  const density = pngChunk(
    "pHYs",
    join(uint32(ppm), uint32(ppm), new Uint8Array([1])),
  );
  const chunks = [bytes.slice(0, 8)];
  let inserted = false;
  for (let offset = 8; offset < bytes.length;) {
    const length = read32(bytes, offset);
    const type = label(bytes, offset + 4);
    if (type === "IDAT" && !inserted) {
      chunks.push(density);
      inserted = true;
    }
    if (type !== "pHYs") chunks.push(bytes.slice(offset, offset + length + 12));
    offset += length + 12;
  }
  return join(...chunks);
}
function jpegDensity(bytes, dpi) {
  // JFIF density uses dots per inch when its unit byte is 1.
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8)
    throw new Error("Invalid JPEG data.");
  const jfif = new Uint8Array([
    0xff,
    0xe0,
    0,
    16,
    74,
    70,
    73,
    70,
    0,
    1,
    1,
    1,
    dpi >>> 8,
    dpi & 255,
    dpi >>> 8,
    dpi & 255,
    0,
    0,
  ]);
  if (bytes[2] === 0xff && bytes[3] === 0xe0 && label(bytes, 6) === "JFIF") {
    const result = bytes.slice();
    result[13] = 1;
    result[14] = result[16] = dpi >>> 8;
    result[15] = result[17] = dpi & 255;
    return result;
  }
  return join(bytes.slice(0, 2), jfif, bytes.slice(2));
}
export function densityTiff(dpi) {
  // TIFF IFD: XResolution, YResolution, ResolutionUnit (inches).
  const result = new Uint8Array(66);
  const view = new DataView(result.buffer);
  result.set([73, 73, 42, 0, 8, 0, 0, 0]);
  view.setUint16(8, 3, true);
  [
    [0x11a, 5, 50],
    [0x11b, 5, 58],
    [0x128, 3, 2],
  ].forEach(([tag, type, value], i) => {
    const pos = 10 + i * 12;
    view.setUint16(pos, tag, true);
    view.setUint16(pos + 2, type, true);
    view.setUint32(pos + 4, 1, true);
    view.setUint32(pos + 8, value, true);
  });
  view.setUint32(50, dpi, true);
  view.setUint32(54, 1, true);
  view.setUint32(58, dpi, true);
  view.setUint32(62, 1, true);
  return result;
}
function webpChunk(type, payload) {
  return join(
    ascii(type),
    uint32(payload.length, true),
    payload,
    new Uint8Array(payload.length % 2),
  );
}
function webpDensity(bytes, dpi, width, height) {
  const chunks = [];
  let extended = false;
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const size = read32(bytes, offset + 4, true);
    const type = label(bytes, offset);
    if (type !== "EXIF") {
      const chunk = bytes.slice(offset, offset + 8 + size + (size % 2));
      if (type === "VP8X") {
        chunk[8] |= 8;
        extended = true;
      }
      chunks.push(chunk);
    }
    offset += 8 + size + (size % 2);
  }
  if (!extended) {
    const payload = new Uint8Array(10);
    payload[0] = 8;
    for (let i = 0; i < 3; i++) {
      payload[4 + i] = ((width - 1) >>> (8 * i)) & 255;
      payload[7 + i] = ((height - 1) >>> (8 * i)) & 255;
    }
    chunks.unshift(webpChunk("VP8X", payload));
  }
  chunks.push(webpChunk("EXIF", densityTiff(dpi)));
  const body = join(ascii("WEBP"), ...chunks);
  return join(ascii("RIFF"), uint32(body.length, true), body);
}
export function addPrintDensity(bytes, format, width, height, dpi = 300) {
  if (format === "png") return pngDensity(bytes, dpi);
  if (format === "jpeg") return jpegDensity(bytes, dpi);
  if (format === "webp") return webpDensity(bytes, dpi, width, height);
  throw new Error("Unsupported image format.");
}
