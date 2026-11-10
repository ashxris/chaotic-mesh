// All export sizes look into the same landscape composition.
export const LANDSCAPE_WIDTH = 3840;
export const LANDSCAPE_HEIGHT = 2160;

export function getLandscapeCrop(width, height) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new RangeError("Crop dimensions must be greater than zero.");
  }
  const scale = Math.max(width / LANDSCAPE_WIDTH, height / LANDSCAPE_HEIGHT);
  const cropWidth = width / scale;
  const cropHeight = height / scale;
  return {
    x: (LANDSCAPE_WIDTH - cropWidth) / 2,
    y: (LANDSCAPE_HEIGHT - cropHeight) / 2,
    width: cropWidth,
    height: cropHeight,
    scaleX: LANDSCAPE_WIDTH / cropWidth,
    scaleY: LANDSCAPE_HEIGHT / cropHeight,
  };
}

export function frameLandscape(renderer, width, height) {
  const crop = getLandscapeCrop(width, height);
  // Reset the original camera, geometry, and noise coordinates to landscape.
  renderer.setCanvasSize(LANDSCAPE_WIDTH, LANDSCAPE_HEIGHT, false);
  const { canvas, gl, commonUniforms } = renderer.minigl;
  // Change only the output framebuffer and its viewing window. Keeping the
  // shader's landscape resolution prevents the mesh from being regenerated
  // or compressed when the export aspect ratio changes.
  canvas.width = width;
  canvas.height = height;
  gl.viewport(0, 0, width, height);
  const projection = commonUniforms.projectionMatrix.value;
  projection[0] *= crop.scaleX;
  projection[5] *= crop.scaleY;
  // Projection clipping renders the crop directly at the requested resolution;
  // it does not enlarge a low-resolution screenshot or allocate a larger image.
}
