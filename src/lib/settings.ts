import {
  fitGridToBudget,
  NEUTRAL_ADJUST,
  type MosaicAdjust,
  type StudSize,
} from "./mosaic";
import type { PaletteName } from "./palette";
import type { TileShape } from "./render";

export interface Settings {
  studSize: StudSize;
  paletteName: PaletteName;
  dither: boolean;
  adjust: MosaicAdjust;
  aspect: number; // width / height
  budgetOn: boolean;
  maxPieces: number;
  tileShape: TileShape;
}

export const ASPECTS: { label: string; value: number }[] = [
  { label: "Square", value: 1 },
  { label: "4:5", value: 0.8 },
  { label: "5:4", value: 1.25 },
  { label: "16:9", value: 16 / 9 },
];

export const DEFAULT_SETTINGS: Settings = {
  studSize: 48,
  paletteName: "full",
  dither: false,
  adjust: { ...NEUTRAL_ADJUST },
  aspect: 1,
  budgetOn: false,
  maxPieces: 2304,
  tileShape: "square",
};

export function gridFromSettings(s: Settings): { w: number; h: number } {
  if (s.budgetOn) {
    const size = fitGridToBudget(s.maxPieces, 1 / s.aspect);
    return { w: size, h: Math.round(size / s.aspect) };
  }
  return { w: s.studSize, h: Math.round(s.studSize / s.aspect) };
}
