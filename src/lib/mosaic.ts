import { deltaE00, rgbToLab } from "./color";
import { getPalette, type PaletteName } from "./palette";

export const STUD_SIZES = [32, 48, 64, 96] as const;
export type StudSize = (typeof STUD_SIZES)[number];

export const BASEPLATE = 48; // studs per official LEGO baseplate edge
export const STUD_MM = 8; // 1x1 stud pitch in millimetres

export interface MosaicAdjust {
  brightness: number; // -1..1, 0 neutral
  contrast: number; // -1..1
  saturation: number; // -1..1
}

export const NEUTRAL_ADJUST: MosaicAdjust = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
};

export const POP_ADJUST: MosaicAdjust = {
  brightness: 0.04,
  contrast: 0.32,
  saturation: 0.42,
};

export interface MosaicRequest {
  width: number; // grid width in studs
  height: number; // grid height in studs
  pixels: Uint8ClampedArray; // RGBA, width*height*4, already downscaled
  paletteName: PaletteName;
  dither: boolean;
  adjust: MosaicAdjust;
}

export interface MosaicResult {
  width: number;
  height: number;
  paletteName: PaletteName;
  indices: Uint16Array; // palette index per cell, row-major
  counts: number[]; // pieces per palette index
}

function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

export function applyAdjust(
  r: number,
  g: number,
  b: number,
  a: MosaicAdjust,
): [number, number, number] {
  const br = a.brightness * 128;
  r += br;
  g += br;
  b += br;

  const C = a.contrast * 128;
  const f = (259 * (C + 255)) / (255 * (259 - C));
  r = f * (r - 128) + 128;
  g = f * (g - 128) + 128;
  b = f * (b - 128) + 128;

  const s = 1 + a.saturation;
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  r = luma + (r - luma) * s;
  g = luma + (g - luma) * s;
  b = luma + (b - luma) * s;

  return [clamp255(r), clamp255(g), clamp255(b)];
}

// The heart: downscaled pixels -> nearest LEGO color per cell (LAB / CIEDE2000),
// with optional Floyd-Steinberg error diffusion (matched in LAB, diffused in RGB).
export function computeMosaic(req: MosaicRequest): MosaicResult {
  const { width, height, pixels, paletteName, dither, adjust } = req;
  const palette = getPalette(paletteName);
  const pal = palette.map((c) => ({ rgb: c.rgb, lab: c.lab }));
  const n = width * height;

  const indices = new Uint16Array(n);
  const counts = new Array<number>(palette.length).fill(0);

  const er = dither ? new Float32Array(n) : null;
  const eg = dither ? new Float32Array(n) : null;
  const eb = dither ? new Float32Array(n) : null;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const p = i * 4;

      let [r, g, b] = applyAdjust(pixels[p], pixels[p + 1], pixels[p + 2], adjust);
      if (dither) {
        r = clamp255(r + er![i]);
        g = clamp255(g + eg![i]);
        b = clamp255(b + eb![i]);
      }

      const lab = rgbToLab(r, g, b);
      let best = 0;
      let bestD = Infinity;
      for (let k = 0; k < pal.length; k++) {
        const d = deltaE00(lab, pal[k].lab);
        if (d < bestD) {
          bestD = d;
          best = k;
        }
      }
      indices[i] = best;
      counts[best]++;

      if (dither) {
        const cr = pal[best].rgb;
        const dr = r - cr[0];
        const dg = g - cr[1];
        const db = b - cr[2];
        // Floyd-Steinberg kernel
        if (x + 1 < width) {
          const j = i + 1;
          er![j] += (dr * 7) / 16;
          eg![j] += (dg * 7) / 16;
          eb![j] += (db * 7) / 16;
        }
        if (y + 1 < height) {
          if (x > 0) {
            const j = i + width - 1;
            er![j] += (dr * 3) / 16;
            eg![j] += (dg * 3) / 16;
            eb![j] += (db * 3) / 16;
          }
          const j = i + width;
          er![j] += (dr * 5) / 16;
          eg![j] += (dg * 5) / 16;
          eb![j] += (db * 5) / 16;
          if (x + 1 < width) {
            const k = i + width + 1;
            er![k] += (dr * 1) / 16;
            eg![k] += (dg * 1) / 16;
            eb![k] += (db * 1) / 16;
          }
        }
      }
    }
  }

  return { width, height, paletteName, indices, counts };
}

// --- Sizing helpers ---------------------------------------------------------

export function baseplatesFor(width: number, height: number): {
  cols: number;
  rows: number;
  total: number;
} {
  const cols = Math.ceil(width / BASEPLATE);
  const rows = Math.ceil(height / BASEPLATE);
  return { cols, rows, total: cols * rows };
}

export function finishedSize(width: number, height: number): {
  wCm: number;
  hCm: number;
  wIn: number;
  hIn: number;
} {
  const wMm = width * STUD_MM;
  const hMm = height * STUD_MM;
  return {
    wCm: wMm / 10,
    hCm: hMm / 10,
    wIn: wMm / 25.4,
    hIn: hMm / 25.4,
  };
}

// Brick-budget: largest square stud size whose piece count fits the cap.
export function fitGridToBudget(maxPieces: number, aspect = 1): StudSize {
  let chosen: StudSize = STUD_SIZES[0];
  for (const s of STUD_SIZES) {
    const w = s;
    const h = Math.round(s * aspect);
    if (w * h <= maxPieces) chosen = s;
  }
  return chosen;
}
