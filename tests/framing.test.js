import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { frameLandscape, getLandscapeCrop } from "../src/lib/utils/framing.js";

const near = (actual, expected) =>
  assert.ok(
    Math.abs(actual - expected) < 1e-8,
    `${actual} should equal ${expected}`,
  );

function fakeRenderer() {
  const canvas = { width: 0, height: 0 };
  const sizes = [];
  const viewports = [];
  const uniforms = {
    projectionMatrix: { value: [] },
    resolution: { value: [] },
  };
  const renderer = {
    sizes,
    viewports,
    minigl: {
      canvas,
      commonUniforms: uniforms,
      gl: {
        MAX_VIEWPORT_DIMS: "viewport",
        MAX_RENDERBUFFER_SIZE: "buffer",
        getParameter: (name) => (name === "viewport" ? [8192, 8192] : 8192),
        isContextLost: () => false,
        viewport: (...args) => viewports.push(args),
      },
    },
    setCanvasSize(width, height, topology) {
      sizes.push([width, height, topology]);
      canvas.width = width;
      canvas.height = height;
      uniforms.resolution.value = [width, height];
      uniforms.projectionMatrix.value = [
        2 / 1024,
        0,
        0,
        0,
        0,
        2 / 600,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1,
      ];
    },
  };
  return renderer;
}

test("4K portrait takes the center slice of the 16:9 landscape", () => {
  const crop = getLandscapeCrop(2160, 3840);
  near(crop.x, 1312.5);
  near(crop.y, 0);
  near(crop.width, 1215);
  near(crop.height, 2160);
  near(crop.scaleX, 256 / 81);
  near(crop.scaleY, 1);
});

test("landscape sizes preserve the whole composition; square and ultrawide crop instead of distorting", () => {
  for (const [width, height] of [
    [3840, 2160],
    [1920, 1080],
    [7680, 4320],
  ]) {
    assert.deepEqual(getLandscapeCrop(width, height), {
      x: 0,
      y: 0,
      width: 3840,
      height: 2160,
      scaleX: 1,
      scaleY: 1,
    });
  }
  const square = getLandscapeCrop(3000, 3000);
  near(square.x, 840);
  near(square.y, 0);
  near(square.width, 2160);
  near(square.height, 2160);
  const wide = getLandscapeCrop(4200, 1800);
  near(wide.x, 0);
  assert.ok(wide.y > 0);
  near(wide.width, 3840);
  assert.throws(() => getLandscapeCrop(0, 3840), RangeError);
});

test("native-resolution framing keeps circles circular and restores landscape after portrait", () => {
  const renderer = fakeRenderer();
  for (const [width, height] of [
    [2160, 3840],
    [3000, 3000],
    [1536, 1024],
    [4200, 1800],
    [3840, 2160],
  ]) {
    frameLandscape(renderer, width, height);
    const matrix = renderer.minigl.commonUniforms.projectionMatrix.value;
    const xScale = matrix[0] / (2 / 1024);
    const yScale = matrix[5] / (2 / 600);
    // A 100-unit circle in the reference landscape must have equal pixel radii.
    const radiusX = (100 / 3840) * xScale * width;
    const radiusY = (100 / 2160) * yScale * height;
    near(radiusX, radiusY);
    assert.deepEqual(
      renderer.minigl.commonUniforms.resolution.value,
      [3840, 2160],
    );
    assert.equal(renderer.minigl.canvas.width, width);
    assert.equal(renderer.minigl.canvas.height, height);
    assert.deepEqual(renderer.viewports.at(-1), [0, 0, width, height]);
  }
  assert.ok(
    renderer.sizes.every(
      (size) => size[0] === 3840 && size[1] === 2160 && size[2] === false,
    ),
  );
  near(renderer.minigl.commonUniforms.projectionMatrix.value[0], 2 / 1024);
  near(renderer.minigl.commonUniforms.projectionMatrix.value[5], 2 / 600);
});

test("preview/export renderer produces center-cropped pixels rather than a squeezed full landscape", async (t) => {
  // A deterministic software field substitutes for WebGL, allowing the full
  // adapter/compositing path to be checked without browser or graphics access.
  const renderer = fakeRenderer();
  const canvas = renderer.minigl.canvas;
  renderer.initGradient = () => {};
  renderer.changeGradientColors = () => {};
  renderer.changePosition = (seed) => (renderer.seed = seed);
  renderer.reGenerateCanvas = () => {
    const { projectionMatrix, resolution } = renderer.minigl.commonUniforms;
    const xScale = projectionMatrix.value[0] / (2 / 1024);
    const yScale = projectionMatrix.value[5] / (2 / 600);
    canvas.data = new Uint8ClampedArray(canvas.width * canvas.height * 4);
    for (let y = 0; y < canvas.height; y++)
      for (let x = 0; x < canvas.width; x++) {
        const offset = (y * canvas.width + x) * 4;
        const nx = (((2 * (x + 0.5)) / canvas.width - 1) / xScale + 1) / 2;
        const ny = (((2 * (y + 0.5)) / canvas.height - 1) / yScale + 1) / 2;
        canvas.data.set(
          [
            Math.round(((nx * resolution.value[0]) / 3840) * 255),
            Math.round(((ny * resolution.value[1]) / 2160) * 255),
            renderer.seed,
            255,
          ],
          offset,
        );
      }
  };
  const previousDocument = globalThis.document;
  const previousImageData = globalThis.ImageData;
  globalThis.__cropTestGradient = renderer;
  globalThis.ImageData = class {
    constructor(data, width, height) {
      Object.assign(this, { data, width, height });
    }
  };
  globalThis.document = {
    getElementById: () => canvas,
    createElement: () => {
      const surface = { width: 0, height: 0, data: null };
      surface.getContext = () => ({
        drawImage: (source) => (surface.data = source.data.slice()),
        getImageData: () => ({ data: surface.data.slice() }),
        putImageData: (image) => (surface.data = image.data.slice()),
      });
      return surface;
    },
  };
  t.after(() => {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
    if (previousImageData === undefined) delete globalThis.ImageData;
    else globalThis.ImageData = previousImageData;
    delete globalThis.__cropTestGradient;
  });
  let source = await readFile(
    new URL("../src/lib/utils/renderer.js", import.meta.url),
    "utf8",
  );
  source = source.replace(
    'import { gradient } from "../../core";',
    "const gradient = globalThis.__cropTestGradient;",
  );
  for (const name of ["grain", "framing"])
    source = source.replace(
      `from "./${name}"`,
      `from ${JSON.stringify(new URL(`../src/lib/utils/${name}.js`, import.meta.url).href)}`,
    );
  const { renderGradient } = await import(
    "data:text/javascript;base64," + Buffer.from(source).toString("base64")
  );
  const settings = {
    width: 160,
    height: 90,
    colors: ["#eb75b6", "#ddf3ff", "#6e3deb", "#c92f3c"],
    seed: 81,
    grain: 0,
  };
  renderGradient(settings);
  const portrait = renderGradient({ ...settings, width: 90, height: 160 });
  assert.equal(portrait.width, 90);
  assert.equal(portrait.height, 160);
  for (let y = 0; y < 160; y++)
    for (let x = 0; x < 90; x++) {
      const offset = (y * 90 + x) * 4;
      const expectedX = 1312.5 + ((x + 0.5) / 90) * 1215;
      assert.equal(portrait.data[offset], Math.round((expectedX / 3840) * 255));
      assert.equal(
        portrait.data[offset + 1],
        Math.round(((y + 0.5) / 160) * 255),
      );
      assert.equal(portrait.data[offset + 2], 81);
      assert.equal(portrait.data[offset + 3], 255);
    }
  const landscape = renderGradient(settings);
  assert.equal(landscape.width, 160);
  assert.equal(landscape.height, 90);
  assert.equal(landscape.data[0], 1);
  assert.equal(landscape.data[(160 - 1) * 4], 254);
});
