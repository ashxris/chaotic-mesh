// A separate monochrome finishing pass. The gradient renderer is untouched.
export function applyGrain(pixels, strength, seed) {
  if (!strength) return pixels;
  const amount = Math.max(0, Math.min(100, strength)) * 0.85;
  for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
    let n = Math.imul(p ^ (seed | 0) ^ 0x9e3779b9, 0x45d9f3b);
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    n = (n ^ (n >>> 16)) >>> 0;
    const noise = (n / 4294967295 - 0.5) * amount;
    pixels[i] += noise;
    pixels[i + 1] += noise;
    pixels[i + 2] += noise;
  }
  return pixels;
}
