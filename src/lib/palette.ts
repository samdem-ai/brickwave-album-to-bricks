import { rgbToLab, type Lab, type Rgb } from "./color";

export interface LegoColor {
  /** BrickLink color id (for part references / shopping). */
  id: number;
  name: string;
  hex: string;
  rgb: Rgb;
  lab: Lab;
}

// Official-ish LEGO solid brick colors with BrickLink color ids + hex values
// taken from the BrickLink color chart. Trans / chrome / glitter excluded.
type Raw = [id: number, name: string, hex: string];

const RAW_FULL: Raw[] = [
  [1, "White", "#FFFFFF"],
  [99, "Very Light Bluish Gray", "#E6E3E0"],
  [86, "Light Bluish Gray", "#A0A5A9"],
  [85, "Dark Bluish Gray", "#6C6E68"],
  [11, "Black", "#05131D"],
  [5, "Red", "#C91A09"],
  [59, "Dark Red", "#720E0F"],
  [4, "Orange", "#FFA70B"],
  [110, "Bright Light Orange", "#F8BB3D"],
  [3, "Yellow", "#F2CD37"],
  [103, "Bright Light Yellow", "#FFF03A"],
  [2, "Tan", "#E4CD9E"],
  [69, "Dark Tan", "#958A73"],
  [28, "Nougat", "#D09168"],
  [150, "Medium Nougat", "#AA7D55"],
  [88, "Reddish Brown", "#582A12"],
  [8, "Brown", "#583927"],
  [120, "Dark Brown", "#352100"],
  [6, "Green", "#237841"],
  [36, "Bright Green", "#4B9F4A"],
  [34, "Lime", "#BBE90B"],
  [80, "Dark Green", "#184632"],
  [48, "Sand Green", "#A0BCAC"],
  [7, "Blue", "#0055BF"],
  [63, "Dark Blue", "#0A3463"],
  [42, "Medium Blue", "#5A93DB"],
  [62, "Light Blue", "#B4D2E3"],
  [55, "Sand Blue", "#6074A1"],
  [153, "Dark Azure", "#078BC9"],
  [156, "Medium Azure", "#36AEBF"],
  [24, "Purple", "#81007B"],
  [89, "Dark Purple", "#3F3691"],
  [154, "Lavender", "#E1D5ED"],
  [157, "Medium Lavender", "#AC78BA"],
  [71, "Magenta", "#923978"],
  [47, "Dark Pink", "#C870A0"],
  [104, "Bright Pink", "#E4ADC8"],
  [23, "Pink", "#FC97AC"],
];

// A balanced, beginner-friendly 16 for graphic covers.
const ESSENTIAL_IDS = new Set([
  1, 11, 86, 85, 5, 4, 3, 2, 28, 88, 6, 36, 7, 63, 153, 71,
]);

function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function build(raw: Raw[]): LegoColor[] {
  return raw.map(([id, name, hex]) => {
    const rgb = hexToRgb(hex);
    return { id, name, hex, rgb, lab: rgbToLab(rgb[0], rgb[1], rgb[2]) };
  });
}

export const FULL_PALETTE: LegoColor[] = build(RAW_FULL);
export const ESSENTIALS_PALETTE: LegoColor[] = FULL_PALETTE.filter((c) =>
  ESSENTIAL_IDS.has(c.id),
);

export type PaletteName = "essentials" | "full";

export function getPalette(name: PaletteName): LegoColor[] {
  return name === "essentials" ? ESSENTIALS_PALETTE : FULL_PALETTE;
}

// The classic LEGO Art piece: 1x1 round tile (BrickLink part 98138).
export const ROUND_TILE_PART = "98138";

export function bricklinkUrl(colorId: number): string {
  return `https://www.bricklink.com/v2/catalog/catalogitem.page?P=${ROUND_TILE_PART}&idColor=${colorId}`;
}

/** Readable text color (black/white) for a swatch background. */
export function readableOn(rgb: Rgb): "#000" | "#fff" {
  const [r, g, b] = rgb;
  // perceived luminance
  const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return l > 0.6 ? "#000" : "#fff";
}
