"use client";

import { useState } from "react";
import type { Bom } from "@/lib/bom";
import { bricklinkUrl, readableOn } from "@/lib/palette";

interface Props {
  bom: Bom;
  onCsv: () => void;
  onSound?: () => void;
}

export default function BillOfMaterials({ bom, onCsv, onSound }: Props) {
  const [copied, setCopied] = useState(false);
  const max = bom.entries[0]?.count ?? 1;

  const copyList = async () => {
    onSound?.();
    const text = bom.entries
      .map((e) => `${e.count}\t${e.color.name}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="panel flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl font-extrabold text-paper">
            Here&apos;s your shopping list.
          </h3>
          <p className="text-sm text-paper-dim">
            Every brick you need, sorted by how many.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost" onClick={copyList}>
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              onSound?.();
              onCsv();
            }}
          >
            CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="chip">
          <strong className="text-paper">{bom.totalPieces.toLocaleString()}</strong>{" "}
          pieces
        </span>
        <span className="chip">
          <strong className="text-paper">{bom.colorsUsed}</strong> colors
        </span>
        <span className="chip">
          <strong className="text-paper">{bom.baseplates.total}</strong>{" "}
          baseplate{bom.baseplates.total > 1 ? "s" : ""}
        </span>
        <span className="chip">
          {bom.size.wCm.toFixed(0)}×{bom.size.hCm.toFixed(0)} cm
        </span>
        <span className="chip">~${bom.approxCost.toFixed(2)}</span>
      </div>

      <ul className="flex max-h-[26rem] flex-col gap-1 overflow-y-auto pr-1">
        {bom.entries.map((e) => (
          <li
            key={e.color.id}
            className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-ink-800"
          >
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md font-mono text-[0.65rem] font-bold shadow-brick-sm ring-1 ring-black/30"
              style={{
                background: e.color.hex,
                color: readableOn(e.color.rgb),
              }}
              aria-hidden
            >
              {String(e.code).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <a
                href={bricklinkUrl(e.color.id)}
                target="_blank"
                rel="noreferrer"
                className="block truncate font-display text-sm font-bold text-paper hover:text-brick-yellow"
                title={`Buy ${e.color.name} 1x1 round tiles on BrickLink`}
              >
                {e.color.name}
              </a>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(e.count / max) * 100}%`,
                    background: e.color.hex,
                  }}
                />
              </div>
            </div>
            <span className="shrink-0 text-right">
              <span className="block font-mono text-sm font-bold text-paper">
                {e.count.toLocaleString()}
              </span>
              <span className="block font-mono text-[0.65rem] text-paper-dim">
                {(e.pct * 100).toFixed(1)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
