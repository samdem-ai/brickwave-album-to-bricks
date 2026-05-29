import {
  baseplatesFor,
  finishedSize,
  type MosaicResult,
} from "./mosaic";
import type { LegoColor } from "./palette";

// Rough per-piece price for a 1x1 round tile (BrickLink avg, USD).
export const PRICE_PER_PIECE = 0.1;

export interface BomEntry {
  color: LegoColor;
  code: number; // paint-by-numbers code, stable with this BOM ordering
  count: number;
  pct: number;
}

export interface Bom {
  width: number;
  height: number;
  entries: BomEntry[];
  totalPieces: number;
  colorsUsed: number;
  baseplates: { cols: number; rows: number; total: number };
  size: { wCm: number; hCm: number; wIn: number; hIn: number };
  approxCost: number;
}

export function buildBom(result: MosaicResult, palette: LegoColor[]): Bom {
  const { width, height, counts } = result;
  const total = width * height;

  const entries: BomEntry[] = palette
    .map((color, i) => ({ color, count: counts[i] }))
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((e, i) => ({
      color: e.color,
      count: e.count,
      code: i + 1,
      pct: e.count / total,
    }));

  return {
    width,
    height,
    entries,
    totalPieces: total,
    colorsUsed: entries.length,
    baseplates: baseplatesFor(width, height),
    size: finishedSize(width, height),
    approxCost: total * PRICE_PER_PIECE,
  };
}

/** Map a palette color id -> its paint-by-numbers code (for the PDF). */
export function codeMap(bom: Bom): Map<number, number> {
  const m = new Map<number, number>();
  for (const e of bom.entries) m.set(e.color.id, e.code);
  return m;
}

export function bomToCsv(bom: Bom): string {
  const lines: string[] = [];
  lines.push("Code,Color,BrickLink Color ID,Part,Count,Percent");
  for (const e of bom.entries) {
    const name = e.color.name.includes(",")
      ? `"${e.color.name}"`
      : e.color.name;
    lines.push(
      [
        e.code,
        name,
        e.color.id,
        "98138",
        e.count,
        (e.pct * 100).toFixed(2) + "%",
      ].join(","),
    );
  }
  lines.push("");
  lines.push(`Total pieces,${bom.totalPieces}`);
  lines.push(`Colors,${bom.colorsUsed}`);
  lines.push(`Baseplates (48x48),${bom.baseplates.total}`);
  lines.push(`Grid,${bom.width}x${bom.height} studs`);
  lines.push(
    `Finished size,${bom.size.wCm.toFixed(1)} x ${bom.size.hCm.toFixed(
      1,
    )} cm`,
  );
  lines.push(`Approx cost (USD),$${bom.approxCost.toFixed(2)}`);
  return lines.join("\n");
}
