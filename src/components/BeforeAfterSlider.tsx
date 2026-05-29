"use client";

import { useRef, useState } from "react";

interface Props {
  beforeUrl: string;
  afterUrl: string;
  aspect?: number;
}

export default function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  aspect = 1,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);

  const setFromX = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  };

  return (
    <div
      ref={ref}
      className="relative w-full select-none overflow-hidden rounded-brick border-2 border-ink-700 shadow-frame"
      style={{ aspectRatio: String(aspect) }}
      onPointerDown={(e) => {
        dragging.current = true;
        (e.target as Element).setPointerCapture?.(e.pointerId);
        setFromX(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && setFromX(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={beforeUrl}
        alt="Original cover"
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={afterUrl}
        alt="LEGO mosaic version"
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      />

      <span className="absolute left-2 top-2 chip border-none bg-black/55 text-paper">
        Original
      </span>
      <span className="absolute right-2 top-2 chip border-none bg-black/55 text-paper">
        Bricked
      </span>

      {/* divider + handle */}
      <div
        className="absolute top-0 h-full w-0.5 bg-brick-yellow"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brick-yellow text-ink-950 shadow-brick">
          <span className="font-mono text-xs font-bold">↔</span>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Reveal original versus bricked"
        className="absolute inset-x-0 bottom-0 h-8 w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
