import LZString from "lz-string";
import type { PaletteName } from "./palette";
import type { StudSize } from "./mosaic";
import type { MosaicAdjust } from "./mosaic";
import type { TileShape } from "./render";

export interface ShareState {
  studSize: StudSize;
  paletteName: PaletteName;
  dither: boolean;
  adjust: MosaicAdjust;
  aspect: number;
  budgetOn: boolean;
  maxPieces: number;
  tileShape?: TileShape;
  hasImage: boolean;
}

const IMG_KEY = "brickwave:image";

export function encodeState(s: ShareState): string {
  return LZString.compressToEncodedURIComponent(JSON.stringify(s));
}

export function decodeState(str: string): ShareState | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(str);
    if (!json) return null;
    return JSON.parse(json) as ShareState;
  } catch {
    return null;
  }
}

export function buildShareUrl(s: ShareState): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin + window.location.pathname
      : "";
  return `${base}#m=${encodeState(s)}`;
}

export function parseShareUrl(): ShareState | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  const m = hash.match(/m=([^&]+)/);
  if (!m) return null;
  return decodeState(m[1]);
}

// The image is too large for a URL, so we stash it locally and the link
// restores settings (and the image too, on the same device/browser).
export function saveImageLocal(dataUrl: string) {
  try {
    localStorage.setItem(IMG_KEY, dataUrl);
  } catch {
    /* quota or disabled storage — settings still shareable */
  }
}

export function loadImageLocal(): string | null {
  try {
    return localStorage.getItem(IMG_KEY);
  } catch {
    return null;
  }
}
