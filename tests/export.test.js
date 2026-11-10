import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { addPrintDensity } from "../src/lib/utils/density.js";
import { applyGrain } from "../src/lib/utils/grain.js";
const text = (value) => new TextEncoder().encode(value);
const join = (...parts) => new Uint8Array(parts.flatMap((part) => [...part]));
function u32(value, little = false) {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value, little);
  return bytes;
}
function crc(bytes) {
  let n = -1;
  for (const b of bytes) {
    n ^= b;
    for (let j = 0; j < 8; j++) n = (n >>> 1) ^ (0xedb88320 & -(n & 1));
  }
  return (n ^ -1) >>> 0;
}
const chunk = (name, data) => {
  const body = join(text(name), data);
  return join(u32(data.length), body, u32(crc(body)));
};
function pngChunks(bytes) {
  const result = [];
  const view = new DataView(bytes.buffer);
  for (let pos = 8; pos < bytes.length;) {
    const size = view.getUint32(pos);
    result.push({
      type: String.fromCharCode(...bytes.slice(pos + 4, pos + 8)),
      data: bytes.slice(pos + 8, pos + 8 + size),
      crc: view.getUint32(pos + 8 + size),
    });
    pos += size + 12;
  }
  return result;
}
const png = join(
  new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", new Uint8Array(13)),
  chunk("pHYs", new Uint8Array(9)),
  chunk("IDAT", new Uint8Array([1, 2, 3])),
  chunk("IEND", new Uint8Array()),
);
test("PNG stores a single valid 300-DPI pHYs chunk before IDAT and preserves image bytes", () => {
  let bytes = addPrintDensity(png, "png", 3840, 2160);
  bytes = addPrintDensity(bytes, "png", 3840, 2160);
  const chunks = pngChunks(bytes);
  const density = chunks.filter((c) => c.type === "pHYs");
  assert.equal(density.length, 1);
  assert.equal(new DataView(density[0].data.buffer).getUint32(0), 11811);
  assert.equal(new DataView(density[0].data.buffer).getUint32(4), 11811);
  assert.equal(density[0].data[8], 1);
  assert.equal(density[0].crc, crc(join(text("pHYs"), density[0].data)));
  assert.ok(
    chunks.findIndex((c) => c.type === "pHYs") <
      chunks.findIndex((c) => c.type === "IDAT"),
  );
  assert.deepEqual(
    chunks.find((c) => c.type === "IDAT").data,
    new Uint8Array([1, 2, 3]),
  );
});
test("JPEG updates existing JFIF density or adds it without changing scan data", () => {
  const original = new Uint8Array([
    255, 216, 255, 224, 0, 16, 74, 70, 73, 70, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0,
    255, 217,
  ]);
  const bytes = addPrintDensity(original, "jpeg", 3840, 2160);
  assert.equal(bytes[13], 1);
  assert.equal(new DataView(bytes.buffer).getUint16(14), 300);
  assert.equal(new DataView(bytes.buffer).getUint16(16), 300);
  assert.deepEqual(bytes.slice(18), original.slice(18));
  assert.equal(original[13], 0);
  const noHeader = addPrintDensity(
    new Uint8Array([255, 216, 255, 217]),
    "jpeg",
    1,
    1,
  );
  assert.equal(noHeader[13], 1);
  assert.deepEqual(noHeader.slice(-2), new Uint8Array([255, 217]));
});
function webpChunks(bytes) {
  const result = [];
  const view = new DataView(bytes.buffer);
  for (let pos = 12; pos < bytes.length;) {
    const size = view.getUint32(pos + 4, true);
    result.push({
      type: String.fromCharCode(...bytes.slice(pos, pos + 4)),
      data: bytes.slice(pos + 8, pos + 8 + size),
    });
    pos += 8 + size + (size % 2);
  }
  return result;
}
test("WebP adds correct VP8X dimensions, EXIF flag, and 300-DPI TIFF without changing image data", () => {
  const image = new Uint8Array([1, 2, 3, 4]);
  const original = join(
    text("RIFF"),
    u32(16, true),
    text("WEBP"),
    text("VP8 "),
    u32(4, true),
    image,
  );
  let result = addPrintDensity(original, "webp", 3840, 2160);
  result = addPrintDensity(result, "webp", 3840, 2160);
  const chunks = webpChunks(result);
  assert.equal(
    new DataView(result.buffer).getUint32(4, true),
    result.length - 8,
  );
  assert.equal(chunks.filter((c) => c.type === "EXIF").length, 1);
  assert.equal(chunks.filter((c) => c.type === "VP8X").length, 1);
  const extended = chunks[0].data;
  assert.equal(extended[0] & 8, 8);
  assert.equal(
    1 + extended[4] + (extended[5] << 8) + (extended[6] << 16),
    3840,
  );
  assert.equal(
    1 + extended[7] + (extended[8] << 8) + (extended[9] << 16),
    2160,
  );
  const exif = new DataView(chunks.find((c) => c.type === "EXIF").data.buffer);
  assert.equal(exif.getUint16(8, true), 3);
  assert.equal(exif.getUint32(50, true), 300);
  assert.equal(exif.getUint32(58, true), 300);
  assert.equal(exif.getUint16(42, true), 2);
  assert.deepEqual(chunks.find((c) => c.type === "VP8 ").data, image);
});
test("Grain at zero preserves every pixel; positive grain is monochrome, repeatable, and leaves alpha intact", () => {
  const original = new Uint8ClampedArray(
    Array.from({ length: 400 }, (_, i) => (i % 4 === 3 ? 255 : 128)),
  );
  assert.deepEqual(applyGrain(original.slice(), 0, 757), original);
  const a = applyGrain(original.slice(), 60, 757),
    b = applyGrain(original.slice(), 60, 757);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, original);
  assert.notDeepEqual(a, applyGrain(original.slice(), 60, 758));
  for (let i = 0; i < a.length; i += 4) {
    assert.equal(a[i], a[i + 1]);
    assert.equal(a[i + 1], a[i + 2]);
    assert.equal(a[i + 3], 255);
  }
});
test("Core generator remains byte-for-byte unchanged", async () => {
  const expected = {
    "src/core/index.js":
      "ca9c39e3b100a79c0219db7fe8e8a8a2a96b9558b03fc66889671f753de766fd",
    "src/core/stripe.gradient.js":
      "cc1cfc3a9376d19592561f3b33368b1ba6f3b37c74cce2f6bfde154bc66209c6",
    "src/core/webgl.js":
      "0853cb06668798e61b2c53d63a3dca1a14f00a4f9de000e2718a9b9c02598564",
  };
  for (const [file, hash] of Object.entries(expected))
    assert.equal(
      createHash("sha256")
        .update(await readFile(new URL("../" + file, import.meta.url)))
        .digest("hex"),
      hash,
      file,
    );
});
