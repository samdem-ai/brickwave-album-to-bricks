import type { Bom } from "./bom";
import type { MosaicResult } from "./mosaic";
import type { LegoColor } from "./palette";
import { renderMosaicCanvas } from "./exports";
import type { TileShape } from "./render";

const W = 1200;
const H = 630;

export function generateShareCard(
  result: MosaicResult,
  palette: LegoColor[],
  bom: Bom,
  shape: TileShape = "square",
): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;

  // background
  ctx.fillStyle = "#161311";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  for (let y = 14; y < H; y += 26) {
    for (let x = 14; x < W; x += 26) {
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // mosaic thumbnail (cover-fit into a square frame)
  const thumb = renderMosaicCanvas(result, palette, 8, shape);
  const box = 470;
  const bx = 50;
  const by = (H - box) / 2;
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.fillRect(bx - 6, by - 6, box + 12, box + 12);
  const r = Math.max(box / thumb.width, box / thumb.height);
  const dw = thumb.width * r;
  const dh = thumb.height * r;
  ctx.beginPath();
  ctx.rect(bx, by, box, box);
  ctx.clip();
  ctx.drawImage(thumb, bx + (box - dw) / 2, by + (box - dh) / 2, dw, dh);
  ctx.restore();

  // text column
  const tx = bx + box + 60;
  ctx.fillStyle = "#ffcd00";
  ctx.font = "800 30px Arial";
  ctx.fillText("BRICKWAVE", tx, 130);

  ctx.fillStyle = "#e7d8b5";
  ctx.font = "700 34px Arial";
  ctx.fillText("This cover =", tx, 230);

  ctx.fillStyle = "#f6eedc";
  ctx.font = "900 130px Arial";
  ctx.fillText(bom.totalPieces.toLocaleString(), tx, 350);

  ctx.fillStyle = "#e3000b";
  ctx.font = "900 64px Arial";
  ctx.fillText("BRICKS", tx, 420);

  ctx.fillStyle = "#a0a5a9";
  ctx.font = "600 30px Arial";
  ctx.fillText(`across ${bom.colorsUsed} colors`, tx, 470);
  ctx.fillText(
    `${bom.size.wCm.toFixed(0)} × ${bom.size.hCm.toFixed(0)} cm  ·  ${
      bom.width
    }×${bom.height} studs`,
    tx,
    512,
  );

  // accent stud row
  const accents = ["#e3000b", "#ffcd00", "#0055bf", "#00852b", "#812e9e"];
  accents.forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(tx + 22 + i * 54, 565, 20, 0, Math.PI * 2);
    ctx.fill();
  });

  return c;
}

export function shareCardBlob(
  result: MosaicResult,
  palette: LegoColor[],
  bom: Bom,
  shape: TileShape = "square",
): Promise<Blob | null> {
  const c = generateShareCard(result, palette, bom, shape);
  return new Promise((res) => c.toBlob((b) => res(b), "image/png"));
}
