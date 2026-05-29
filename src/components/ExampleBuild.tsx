"use client";

import { useEffect, useState } from "react";
import { computeMosaic, NEUTRAL_ADJUST } from "@/lib/mosaic";
import { getPalette } from "@/lib/palette";
import { drawMosaicStatic } from "@/lib/render";
import { centeredCrop, downscaleToGrid } from "@/lib/image";
import { buildBom } from "@/lib/bom";

interface Props {
  onTry: (dataUrl: string) => void;
  onSound?: () => void;
}

// Worked example: the DAMN. cover run through the real pipeline at the app's
// default settings (48 studs, full palette), so the "after" is honest.
const SRC = "/presets/damn.jpg";
const GRID = 48;

export default function ExampleBuild({ onTry, onSound }: Props) {
  const [after, setAfter] = useState<string | null>(null);
  const [stats, setStats] = useState<{ pieces: number; colors: number } | null>(
    null,
  );

  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.onload = () => {
      if (!alive) return;
      const crop = centeredCrop(img.naturalWidth, img.naturalHeight, 1);
      const pixels = downscaleToGrid(img, crop, GRID, GRID);
      const result = computeMosaic({
        width: GRID,
        height: GRID,
        pixels,
        paletteName: "full",
        dither: false,
        adjust: NEUTRAL_ADJUST,
      });
      const palette = getPalette(result.paletteName);
      const cellPx = 9;
      const c = document.createElement("canvas");
      c.width = GRID * cellPx;
      c.height = GRID * cellPx;
      drawMosaicStatic(c.getContext("2d")!, result, palette, cellPx, {
        shape: "square",
      });
      const bom = buildBom(result, palette);
      setAfter(c.toDataURL("image/png"));
      setStats({ pieces: bom.totalPieces, colors: bom.colorsUsed });
    };
    img.src = SRC;
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="panel p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="label-cap">See it in action</span>
          <h3 className="font-display text-xl font-extrabold text-paper">
            DAMN. <span className="text-paper-dim">becomes</span> bricks
          </h3>
        </div>
        {stats && (
          <span className="chip">
            {stats.pieces.toLocaleString()} pcs · {stats.colors} colors
          </span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <figure className="flex flex-col gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SRC}
            alt="DAMN. album cover"
            className="aspect-square w-full rounded-lg border-2 border-ink-700 object-cover shadow-brick-sm"
          />
          <figcaption className="label-cap text-center">Cover</figcaption>
        </figure>

        <span className="font-display text-2xl font-extrabold text-brick-yellow">
          →
        </span>

        <figure className="flex flex-col gap-1.5">
          {after ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={after}
              alt="DAMN. rebuilt as a LEGO mosaic"
              className="aspect-square w-full rounded-lg border-2 border-ink-700 object-cover shadow-brick-sm"
            />
          ) : (
            <div className="aspect-square w-full animate-pulse rounded-lg border-2 border-ink-700 bg-ink-800" />
          )}
          <figcaption className="label-cap text-center">Mosaic</figcaption>
        </figure>
      </div>

      <button
        type="button"
        className="btn-brick mt-4 w-full bg-brick-yellow py-2.5 text-sm"
        onClick={() => {
          onSound?.();
          onTry(SRC);
        }}
      >
        Build this one →
      </button>
    </div>
  );
}
