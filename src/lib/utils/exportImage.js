import { addPrintDensity } from "./density";
export async function encodeImage(canvas, format, quality = 95) {
  const mime = `image/${format}`;
  const blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (value) =>
        value
          ? resolve(value)
          : reject(
              new Error("The image could not be encoded. Try a smaller size."),
            ),
      mime,
      quality / 100,
    ),
  );
  if (blob.type !== mime)
    throw new Error(
      `${format.toUpperCase()} export is unavailable in this browser. Please choose PNG or JPEG.`,
    );
  const bytes = addPrintDensity(
    new Uint8Array(await blob.arrayBuffer()),
    format,
    canvas.width,
    canvas.height,
  );
  return new Blob([bytes], { type: mime });
}
export async function downloadImage(canvas, { format, quality, seed }) {
  const blob = await encodeImage(canvas, format, quality);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `chaotic-mesh-${seed}-${canvas.width}x${canvas.height}.${format === "jpeg" ? "jpg" : format}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
