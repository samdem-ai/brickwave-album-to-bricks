import { BASEPLATE, type MosaicResult } from "./mosaic";
import type { LegoColor } from "./palette";

export const BASEPLATE_BG = "#211f1c";

export type TileShape = "square" | "round";

// Pre-render one tile sprite. drawImage of a cached sprite is far cheaper
// than rebuilding a gradient per cell per animation frame.
export function makeTileSprite(
  hex: string,
  size: number,
  shape: TileShape,
): HTMLCanvasElement {
  return shape === "round"
    ? makeRoundSprite(hex, size)
    : makeSquareSprite(hex, size);
}

// Flat square mosaic tile with a light bevel + grid edge (matches the guide).
function makeSquareSprite(hex: string, size: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;

  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, size, size);

  // diagonal bevel sheen
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, "rgba(255,255,255,0.26)");
  g.addColorStop(0.5, "rgba(255,255,255,0)");
  g.addColorStop(1, "rgba(0,0,0,0.22)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // top-left highlight chamfer
  const lw = Math.max(1, size * 0.07);
  ctx.lineWidth = lw;
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.beginPath();
  ctx.moveTo(lw / 2, size);
  ctx.lineTo(lw / 2, lw / 2);
  ctx.lineTo(size, lw / 2);
  ctx.stroke();
  // bottom-right shadow chamfer
  ctx.strokeStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.moveTo(size - lw / 2, 0);
  ctx.lineTo(size - lw / 2, size - lw / 2);
  ctx.lineTo(0, size - lw / 2);
  ctx.stroke();

  // crisp grid edge
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = Math.max(1, size * 0.04);
  ctx.strokeRect(0, 0, size, size);

  return c;
}

// Round 1x1 tile (LEGO Art style) — kept as an option.
function makeRoundSprite(hex: string, size: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const cx = size / 2;
  const r = size * 0.47;

  ctx.fillStyle = hex;
  ctx.beginPath();
  ctx.arc(cx, cx, r, 0, Math.PI * 2);
  ctx.fill();

  const g = ctx.createRadialGradient(
    cx - r * 0.4,
    cx - r * 0.4,
    r * 0.1,
    cx,
    cx,
    r,
  );
  g.addColorStop(0, "rgba(255,255,255,0.55)");
  g.addColorStop(0.45, "rgba(255,255,255,0.06)");
  g.addColorStop(1, "rgba(0,0,0,0.28)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cx, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = Math.max(1, size * 0.03);
  ctx.beginPath();
  ctx.arc(cx, cx, r * 0.6, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = Math.max(1, size * 0.04);
  ctx.beginPath();
  ctx.arc(cx, cx, r, 0, Math.PI * 2);
  ctx.stroke();

  return c;
}

export function buildSpriteCache(
  palette: LegoColor[],
  cellPx: number,
  shape: TileShape = "square",
): HTMLCanvasElement[] {
  const size = Math.min(96, Math.max(16, Math.round(cellPx * 1.6)));
  return palette.map((c) => makeTileSprite(c.hex, size, shape));
}

export function drawBaseplateSeams(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cellPx: number,
) {
  if (width <= BASEPLATE && height <= BASEPLATE) return;
  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.lineWidth = Math.max(2, cellPx * 0.18);
  for (let x = BASEPLATE; x < width; x += BASEPLATE) {
    ctx.beginPath();
    ctx.moveTo(x * cellPx, 0);
    ctx.lineTo(x * cellPx, height * cellPx);
    ctx.stroke();
  }
  for (let y = BASEPLATE; y < height; y += BASEPLATE) {
    ctx.beginPath();
    ctx.moveTo(0, y * cellPx);
    ctx.lineTo(width * cellPx, y * cellPx);
    ctx.stroke();
  }
  ctx.restore();
}

export interface DrawOpts {
  seams?: boolean;
  bg?: string;
  sprites?: HTMLCanvasElement[];
  shape?: TileShape;
}

// Full static render (used for export and non-animated redraws).
export function drawMosaicStatic(
  ctx: CanvasRenderingContext2D,
  result: MosaicResult,
  palette: LegoColor[],
  cellPx: number,
  opts: DrawOpts = {},
) {
  const { width, height, indices } = result;
  const sprites =
    opts.sprites ?? buildSpriteCache(palette, cellPx, opts.shape ?? "square");
  ctx.fillStyle = opts.bg ?? BASEPLATE_BG;
  ctx.fillRect(0, 0, width * cellPx, height * cellPx);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = indices[y * width + x];
      ctx.drawImage(sprites[idx], x * cellPx, y * cellPx, cellPx, cellPx);
    }
  }
  if (opts.seams !== false) drawBaseplateSeams(ctx, width, height, cellPx);
}

export function easeOutBack(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const x = t - 1;
  return 1 + c3 * x * x * x + c1 * x * x;
}
