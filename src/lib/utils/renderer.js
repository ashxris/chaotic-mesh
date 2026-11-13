import { gradient } from "../../core";
import { applyGrain } from "./grain";
import { frameLandscape } from "./framing";

export const MAX_PIXELS = 60_000_000;
export const MAX_SIDE = 10240;
let baseKey = "";
let basePixels;
let surface;
let context;
let ready = false;
let previousColors = "";
let hardwareLimit = MAX_SIDE;

export function initializeRenderer() {
  if (ready) return;
  const colors = ["#eb75b6", "#ddf3ff", "#6e3deb", "#c92f3c"];
  gradient.initGradient("#gradient-canvas", colors);
  if (!gradient.minigl?.gl)
    throw new Error(
      "Your browser could not start WebGL. Please enable hardware acceleration and reload.",
    );
  const gl = gradient.minigl.gl;
  const viewport = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
  hardwareLimit = Math.min(
    MAX_SIDE,
    gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
    viewport[0],
    viewport[1],
  );
  previousColors = JSON.stringify(colors);
  surface = document.createElement("canvas");
  context = surface.getContext("2d", { willReadFrequently: true });
  if (!context)
    throw new Error("Your browser could not create an image canvas.");
  ready = true;
}

export function validateSize(width, height) {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1
  )
    return "Enter a whole number greater than zero for each dimension.";
  if (width > hardwareLimit || height > hardwareLimit)
    return `Each side can be up to ${hardwareLimit.toLocaleString()} px on this device.`;
  if (width * height > MAX_PIXELS)
    return `Choose a size up to ${MAX_PIXELS / 1_000_000} megapixels to keep exports reliable.`;
  return "";
}

export function renderGradient({ width, height, colors, seed, grain }) {
  initializeRenderer();
  const error = validateSize(width, height);
  if (error) throw new Error(error);
  const nextColors = JSON.stringify(colors);
  const key = JSON.stringify([width, height, colors, seed]);
  if (key !== baseKey) {
    if (previousColors !== nextColors) {
      gradient.changeGradientColors(colors);
      previousColors = nextColors;
    }
    frameLandscape(gradient, width, height);
    gradient.changePosition(seed);
    gradient.reGenerateCanvas();
    const gl = gradient.minigl.gl;
    if (gl.isContextLost())
      throw new Error(
        "The graphics context was lost. Reload the page and try a smaller size.",
      );
    surface.width = width;
    surface.height = height;
    context.drawImage(document.getElementById("gradient-canvas"), 0, 0);
    basePixels = context.getImageData(0, 0, width, height);
    baseKey = key;
  }
  const pixels = new ImageData(
    new Uint8ClampedArray(basePixels.data),
    width,
    height,
  );
  applyGrain(pixels.data, grain, seed);
  context.putImageData(pixels, 0, 0);
  return surface;
}

export function releaseRenderer() {
  gradient.disconnect();
}

// Render real preset previews with the existing engine, then restore the editor.
export function renderPresetThumbnails(presets, settings) {
  const thumbnail = document.createElement("canvas");
  thumbnail.width = 480;
  thumbnail.height = 270;
  const thumbnailContext = thumbnail.getContext("2d");
  if (!thumbnailContext) return [];
  try {
    return presets.map((preset) => {
      const image = renderGradient({
        width: 3840,
        height: 2160,
        colors: preset.meshColors,
        seed: preset.meshId,
        grain: 0,
      });
      thumbnailContext.drawImage(image, 0, 0, 480, 270);
      return thumbnail.toDataURL("image/webp", 0.85);
    });
  } finally {
    renderGradient(settings);
  }
}
