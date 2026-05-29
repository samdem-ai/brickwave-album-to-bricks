"use client";

import { useEffect, useState } from "react";
import { getPresets, type Preset } from "@/lib/presets";

interface Props {
  onPick: (dataUrl: string) => void;
  onSound?: () => void;
}

export default function Presets({ onPick, onSound }: Props) {
  const [presets, setPresets] = useState<Preset[]>([]);

  useEffect(() => {
    // generated on the client (needs canvas)
    setPresets(getPresets());
  }, []);

  if (!presets.length) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className="label-cap">Or try one of these</span>
      <div className="grid grid-cols-4 gap-2">
        {presets.map((p, i) => (
          <button
            key={p.name}
            type="button"
            onClick={() => {
              onSound?.();
              onPick(p.dataUrl);
            }}
            className="group relative aspect-square overflow-hidden rounded-lg border-2 border-ink-700 shadow-brick-sm transition-all duration-150 ease-spring hover:-translate-y-1 hover:border-brick-yellow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brick-yellow/50"
            style={{ rotate: `${(i % 2 ? 1 : -1) * 1.5}deg` }}
            aria-label={`Use preset cover: ${p.name}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.dataUrl}
              alt={p.name}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
            <span className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-center font-display text-[0.6rem] font-bold uppercase tracking-wider text-paper">
              {p.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
