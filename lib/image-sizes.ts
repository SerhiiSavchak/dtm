/** Dest width from a Next `sizes` string for the current viewport. */
export function slotWidthFromSizes(sizes: string, viewportWidth: number): number {
  const parts = sizes.split(",").map((part) => part.trim());
  for (const part of parts) {
    const mq = part.match(/^\(max-width:\s*(\d+)px\)\s+(.+)$/);
    if (mq) {
      if (viewportWidth <= Number(mq[1])) return lengthToPx(mq[2], viewportWidth);
      continue;
    }
    return lengthToPx(part, viewportWidth);
  }
  return viewportWidth;
}

function lengthToPx(expr: string, vw: number): number {
  const value = expr.trim();
  const min = value.match(/^min\(\s*(.+?)\s*,\s*(.+?)\s*\)$/);
  if (min) return Math.min(lengthToPx(min[1], vw), lengthToPx(min[2], vw));
  const max = value.match(/^max\(\s*(.+?)\s*,\s*(.+?)\s*\)$/);
  if (max) return Math.max(lengthToPx(max[1], vw), lengthToPx(max[2], vw));
  if (value.endsWith("vw")) return (Number.parseFloat(value) / 100) * vw;
  if (value.endsWith("rem")) return Number.parseFloat(value) * 16;
  if (value.endsWith("px")) return Number.parseFloat(value);
  if (value === "100vw") return vw;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : vw;
}
