export type Ctx = CanvasRenderingContext2D;

export const INK = "#241c16";

export function pix(ctx: Ctx, x: number, y: number, color: string | undefined) {
  if (!color) return;
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, 1, 1);
}

export function rect(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  if (w <= 0 || h <= 0) return;
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
}

export function hline(ctx: Ctx, x: number, y: number, w: number, color: string) {
  rect(ctx, x, y, w, 1, color);
}

export function vline(ctx: Ctx, x: number, y: number, h: number, color: string) {
  rect(ctx, x, y, 1, h, color);
}

/** Whole-pixel ellipse. Center may sit between pixels; the test uses pixel centers. */
export function fillEllipse(
  ctx: Ctx,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string,
) {
  if (rx <= 0 || ry <= 0) return;
  const x0 = Math.floor(cx - rx - 1);
  const x1 = Math.ceil(cx + rx + 1);
  const y0 = Math.floor(cy - ry - 1);
  const y1 = Math.ceil(cy + ry + 1);
  const invRx = 1 / rx;
  const invRy = 1 / ry;
  ctx.fillStyle = color;
  for (let y = y0; y < y1; y++) {
    const dy = (y + 0.5 - cy) * invRy;
    const dy2 = dy * dy;
    if (dy2 > 1) continue;
    for (let x = x0; x < x1; x++) {
      const dx = (x + 0.5 - cx) * invRx;
      if (dx * dx + dy2 <= 1) ctx.fillRect(x, y, 1, 1);
    }
  }
}

/** 1px ring between r-0.6 and r+0.55, whole pixels only. */
export function ring(ctx: Ctx, cx: number, cy: number, r: number, color: string, arc: "full" | "top" = "full") {
  const r0 = Math.max(0, r - 0.65);
  const r1 = r + 0.55;
  const x0 = Math.floor(cx - r1 - 1);
  const x1 = Math.ceil(cx + r1 + 1);
  const y0 = Math.floor(cy - r1 - 1);
  const y1 = Math.ceil(cy + r1 + 1);
  ctx.fillStyle = color;
  for (let y = y0; y <= y1; y++) {
    if (arc === "top" && y > cy - 2) continue;
    for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d >= r0 && d <= r1) ctx.fillRect(x, y, 1, 1);
    }
  }
}

export function paint(
  ctx: Ctx,
  rows: readonly string[],
  palette: Record<string, string>,
  ox = 0,
  oy = 0,
) {
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const color = palette[row[x]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  }
}

export function mirrorRows(rows: readonly string[]): string[] {
  return rows.map((row) => [...row].reverse().join(""));
}

/** Trapezoid centered on cx, wider toward the bottom. Left edge is lit. */
export function robe(
  ctx: Ctx,
  cx: number,
  top: number,
  topW: number,
  botW: number,
  h: number,
  hi: string,
  mid: string,
  lo: string,
) {
  for (let row = 0; row < h; row++) {
    const t = h <= 1 ? 1 : row / (h - 1);
    const w = Math.max(1, Math.round(topW + (botW - topW) * t));
    const x = Math.round(cx - w / 2);
    const color = t < 0.3 ? hi : t < 0.68 ? mid : lo;
    rect(ctx, x, top + row, w, 1, color);
    pix(ctx, x, top + row, hi);
    if (w > 1) pix(ctx, x + w - 1, top + row, lo);
  }
}

export function shadedBox(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  hi: string,
  mid: string,
  lo: string,
) {
  rect(ctx, x, y, w, h, mid);
  if (h > 1) hline(ctx, x, y, w, hi);
  if (w > 1) vline(ctx, x, y, h, hi);
  if (w > 1) vline(ctx, x + w - 1, y, h, lo);
  if (h > 1) hline(ctx, x, y + h - 1, w, lo);
}

/** Three-tone head. Light sits up-left. */
export function head(
  ctx: Ctx,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  hi: string,
  mid: string,
  lo: string,
) {
  fillEllipse(ctx, cx + rx * 0.08, cy + ry * 0.1, rx, ry, lo);
  fillEllipse(ctx, cx - rx * 0.08, cy - ry * 0.06, rx * 0.94, ry * 0.9, mid);
  fillEllipse(ctx, cx - rx * 0.28, cy - ry * 0.32, rx * 0.58, ry * 0.46, hi);
}

export function dither(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  a: string,
  b: string,
) {
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      pix(ctx, x + xx, y + yy, ((xx + yy) & 1) === 0 ? a : b);
    }
  }
}

export function hexRgb(hex: string): [number, number, number, number] {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) : 255;
  return [r, g, b, a];
}

/** Silhouette outline on transparent neighbors. Cardinal only, so corners stay crisp. */
export function outline(ctx: Ctx, w: number, h: number, color: string) {
  const img = ctx.getImageData(0, 0, w, h);
  const src = new Uint8ClampedArray(img.data);
  const [r, g, b, a] = hexRgb(color);
  const stride = w * 4;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * stride + x * 4;
      if (src[i + 3] > 24) continue;
      let touch = false;
      const neighbors = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
      for (const [dx, dy] of neighbors) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        if (src[ny * stride + nx * 4 + 3] > 40) {
          touch = true;
          break;
        }
      }
      if (touch) {
        img.data[i] = r;
        img.data[i + 1] = g;
        img.data[i + 2] = b;
        img.data[i + 3] = a;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

export function desaturate(ctx: Ctx, w: number, h: number, amount: number) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const y = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    const dull = y * 0.82;
    d[i] = Math.round(d[i] + (dull - d[i]) * amount);
    d[i + 1] = Math.round(d[i + 1] + (dull - d[i + 1]) * amount);
    d[i + 2] = Math.round(d[i + 2] + (dull - d[i + 2]) * amount);
  }
  ctx.putImageData(img, 0, 0);
}

const DIGITS: Record<string, string[]> = {
  "0": ["###", "#.#", "#.#", "#.#", "###"],
  "1": [".#.", "##.", ".#.", ".#.", "###"],
  "2": ["###", "..#", "###", "#..", "###"],
  "3": ["###", "..#", "###", "..#", "###"],
  "4": ["#.#", "#.#", "###", "..#", "..#"],
  "5": ["###", "#..", "###", "..#", "###"],
};

export function digit(ctx: Ctx, x: number, y: number, value: string, color: string) {
  const rows = DIGITS[value];
  if (!rows) return;
  for (let row = 0; row < rows.length; row++) {
    for (let col = 0; col < rows[row].length; col++) {
      if (rows[row][col] === "#") pix(ctx, x + col, y + row, color);
    }
  }
}

export function hash(x: number, y: number): number {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return (n ^ (n >>> 16)) >>> 0;
}
