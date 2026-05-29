"use client";

import type { Bom } from "@/lib/bom";
import type { MosaicResult } from "@/lib/mosaic";
import type { LegoColor } from "@/lib/palette";
import type { TileShape } from "@/lib/render";
import { shareCardBlob } from "@/lib/sharecard";
import { downloadBlob } from "@/lib/exports";

interface Props {
  result: MosaicResult;
  palette: LegoColor[];
  bom: Bom;
  shape?: TileShape;
  onSound?: () => void;
}

export default function ShareCard({
  result,
  palette,
  bom,
  shape = "square",
  onSound,
}: Props) {
  const onClick = async () => {
    onSound?.();
    const blob = await shareCardBlob(result, palette, bom, shape);
    if (!blob) return;
    const file = new File([blob], "brickwave-card.png", { type: "image/png" });
    const nav = navigator as Navigator & {
      canShare?: (d: { files: File[] }) => boolean;
    };
    if (nav.canShare?.({ files: [file] }) && nav.share) {
      try {
        await nav.share({
          files: [file],
          title: "BRICKWAVE",
          text: `This cover = ${bom.totalPieces.toLocaleString()} bricks across ${bom.colorsUsed} colors.`,
        });
        return;
      } catch {
        /* user cancelled — fall through to download */
      }
    }
    downloadBlob(blob, "brickwave-card.png");
  };

  return (
    <button type="button" className="btn-ghost" onClick={onClick}>
      ⧉ Share card
    </button>
  );
}
