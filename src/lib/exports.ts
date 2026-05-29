import type { MosaicResult } from "./mosaic";
import type { LegoColor } from "./palette";
import { drawMosaicStatic, type TileShape } from "./render";
import { bomToCsv, type Bom } from "./bom";

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function renderMosaicCanvas(
  result: MosaicResult,
  palette: LegoColor[],
  cellPx: number,
  shape: TileShape = "square",
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = result.width * cellPx;
  canvas.height = result.height * cellPx;
  const ctx = canvas.getContext("2d")!;
  drawMosaicStatic(ctx, result, palette, cellPx, { seams: true, shape });
  return canvas;
}

export async function exportPng(
  result: MosaicResult,
  palette: LegoColor[],
  filename = "brickwave-mosaic.png",
  cellPx = 24,
  shape: TileShape = "square",
) {
  const canvas = renderMosaicCanvas(result, palette, cellPx, shape);
  const blob: Blob | null = await new Promise((res) =>
    canvas.toBlob((b) => res(b), "image/png"),
  );
  if (blob) downloadBlob(blob, filename);
}

export function exportCsv(bom: Bom, filename = "brickwave-parts.csv") {
  const blob = new Blob([bomToCsv(bom)], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, filename);
}
