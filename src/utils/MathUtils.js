export function remap(v, a1, b1, a2, b2) {
  return a2 + ((v - a1) * (b2 - a2)) / (b1 - a1);
}

export function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

export function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function lerpColor(colorA, colorB, t, targetColor) {
  targetColor.r = colorA.r + (colorB.r - colorA.r) * t;
  targetColor.g = colorA.g + (colorB.g - colorA.g) * t;
  targetColor.b = colorA.b + (colorB.b - colorA.b) * t;
  return targetColor;
}
