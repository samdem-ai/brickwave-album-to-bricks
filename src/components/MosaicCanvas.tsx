"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import type { MosaicResult } from "@/lib/mosaic";
import type { LegoColor } from "@/lib/palette";
import {
  BASEPLATE_BG,
  buildSpriteCache,
  drawBaseplateSeams,
  drawMosaicStatic,
  easeOutBack,
  type TileShape,
} from "@/lib/render";

interface Props {
  result: MosaicResult | null;
  palette: LegoColor[];
  playToken: number;
  shape?: TileShape;
  onDone?: () => void;
  className?: string;
}

function cellPxFor(maxDim: number): number {
  const target = 1100;
  return Math.max(6, Math.min(40, Math.floor(target / maxDim)));
}

const MosaicCanvas = forwardRef<HTMLCanvasElement, Props>(function MosaicCanvas(
  { result, palette, playToken, shape = "square", onDone, className },
  ref,
) {
  const innerRef = useRef<HTMLCanvasElement>(null);
  useImperativeHandle(ref, () => innerRef.current as HTMLCanvasElement, []);
  const lastPlay = useRef(playToken);
  const rafRef = useRef<number | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const cellPx = result
    ? cellPxFor(Math.max(result.width, result.height))
    : 12;

  const sprites = useMemo(
    () => buildSpriteCache(palette, cellPx, shape),
    [palette, cellPx, shape],
  );

  useEffect(() => {
    const canvas = innerRef.current;
    if (!canvas || !result) return;
    const { width, height } = result;
    canvas.width = width * cellPx;
    canvas.height = height * cellPx;
    const ctx = canvas.getContext("2d")!;

    const play = playToken !== lastPlay.current;
    lastPlay.current = playToken;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!play || reduce) {
      drawMosaicStatic(ctx, result, palette, cellPx, { sprites });
      if (play) onDoneRef.current?.();
      return;
    }

    // Staggered diagonal cascade with a touch of randomness.
    const w = width;
    const h = height;
    const maxIdx = w + h;
    const spread = Math.min(900, 250 + Math.max(w, h) * 7);
    const POP = 320;
    const total = spread + POP;
    const jitter = new Float32Array(w * h);
    for (let i = 0; i < jitter.length; i++) jitter[i] = Math.random() * 90;

    const start = performance.now();
    const loop = (now: number) => {
      const elapsed = now - start;
      ctx.fillStyle = BASEPLATE_BG;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          const delay = ((x + y) / maxIdx) * spread + jitter[i];
          const t = (elapsed - delay) / POP;
          if (t <= 0) continue;
          const s = easeOutBack(t);
          const sz = cellPx * s;
          const ox = x * cellPx + (cellPx - sz) / 2;
          const oy = y * cellPx + (cellPx - sz) / 2;
          ctx.drawImage(sprites[result.indices[i]], ox, oy, sz, sz);
        }
      }
      drawBaseplateSeams(ctx, w, h, cellPx);
      if (elapsed < total) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        drawMosaicStatic(ctx, result, palette, cellPx, { sprites });
        onDoneRef.current?.();
      }
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [result, playToken, cellPx, palette, sprites]);

  return (
    <canvas
      ref={innerRef}
      className={className}
      role="img"
      aria-label={
        result
          ? `LEGO mosaic, ${result.width} by ${result.height} studs`
          : "Mosaic preview"
      }
    />
  );
});

export default MosaicCanvas;
