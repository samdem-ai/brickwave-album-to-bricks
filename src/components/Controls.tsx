"use client";

import { STUD_SIZES } from "@/lib/mosaic";
import { ASPECTS, gridFromSettings, type Settings } from "@/lib/settings";

interface Props {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onPop: () => void;
  onResetAdjust: () => void;
  onSound?: () => void;
}

function Segmented<T extends string | number>({
  label,
  value,
  options,
  onPick,
  disabled,
}: {
  label: string;
  value: T;
  options: { label: string; value: T }[];
  onPick: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="label-cap">{label}</span>
      <div
        className={[
          "flex flex-wrap gap-1 rounded-brick border border-ink-700 bg-ink-900 p-1",
          disabled ? "pointer-events-none opacity-40" : "",
        ].join(" ")}
        role="group"
        aria-label={label}
      >
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={String(o.value)}
              type="button"
              aria-pressed={active}
              onClick={() => onPick(o.value)}
              className={[
                "flex-1 rounded-[10px] px-3 py-2 font-display text-sm font-bold transition-all duration-150 ease-spring",
                active
                  ? "bg-brick-yellow text-ink-950 shadow-brick-sm"
                  : "text-paper-dim hover:bg-ink-800 hover:text-paper",
              ].join(" ")}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="label-cap">{label}</span>
        <span className="font-mono text-xs text-paper-dim">
          {value > 0 ? "+" : ""}
          {Math.round(value * 100)}
        </span>
      </div>
      <input
        type="range"
        className="brick-range w-full"
        min={-1}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-label={label}
      />
    </div>
  );
}

function Toggle({
  label,
  hint,
  on,
  onToggle,
}: {
  label: string;
  hint?: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="flex items-center justify-between gap-3 rounded-brick border border-ink-700 bg-ink-900 px-3 py-2.5 text-left transition-colors hover:bg-ink-800"
    >
      <span>
        <span className="block font-display text-sm font-bold text-paper">
          {label}
        </span>
        {hint && <span className="block text-xs text-paper-dim">{hint}</span>}
      </span>
      <span
        className={[
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
          on ? "bg-brick-green" : "bg-ink-600",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow-brick-sm transition-all duration-200 ease-spring",
            on ? "left-[22px]" : "left-0.5",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

export default function Controls({
  settings,
  onChange,
  onPop,
  onResetAdjust,
  onSound,
}: Props) {
  const grid = gridFromSettings(settings);
  const click = () => onSound?.();

  return (
    <div className="flex flex-col gap-5">
      <Segmented
        label="Size (studs)"
        value={settings.studSize}
        disabled={settings.budgetOn}
        options={STUD_SIZES.map((s) => ({ label: `${s}²`, value: s }))}
        onPick={(v) => {
          click();
          onChange({ studSize: v });
        }}
      />

      <Segmented
        label="Shape"
        value={settings.aspect}
        options={ASPECTS}
        onPick={(v) => {
          click();
          onChange({ aspect: v });
        }}
      />

      <Segmented
        label="Palette"
        value={settings.paletteName}
        options={[
          { label: "16 essentials", value: "essentials" as const },
          { label: "Full", value: "full" as const },
        ]}
        onPick={(v) => {
          click();
          onChange({ paletteName: v });
        }}
      />

      <Segmented
        label="Tile"
        value={settings.tileShape}
        options={[
          { label: "Square", value: "square" as const },
          { label: "Round", value: "round" as const },
        ]}
        onPick={(v) => {
          click();
          onChange({ tileShape: v });
        }}
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="label-cap">Adjust</span>
          <button
            type="button"
            onClick={onResetAdjust}
            className="font-mono text-xs text-paper-dim underline-offset-2 hover:text-paper hover:underline"
          >
            reset
          </button>
        </div>
        <Slider
          label="Brightness"
          value={settings.adjust.brightness}
          onChange={(v) =>
            onChange({ adjust: { ...settings.adjust, brightness: v } })
          }
        />
        <Slider
          label="Contrast"
          value={settings.adjust.contrast}
          onChange={(v) =>
            onChange({ adjust: { ...settings.adjust, contrast: v } })
          }
        />
        <Slider
          label="Saturation"
          value={settings.adjust.saturation}
          onChange={(v) =>
            onChange({ adjust: { ...settings.adjust, saturation: v } })
          }
        />
        <button
          type="button"
          onClick={() => {
            click();
            onPop();
          }}
          className="btn-brick mt-1 self-start bg-brick-pink py-2 text-sm"
        >
          ✦ Pop preset
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <Toggle
          label="Dithering"
          hint="Smoother gradients — great for photos"
          on={settings.dither}
          onToggle={() => {
            click();
            onChange({ dither: !settings.dither });
          }}
        />
        <Toggle
          label="Brick budget"
          hint="Cap the piece count, auto-pick the size"
          on={settings.budgetOn}
          onToggle={() => {
            click();
            onChange({ budgetOn: !settings.budgetOn });
          }}
        />
        {settings.budgetOn && (
          <div className="flex flex-col gap-1 rounded-brick border border-ink-700 bg-ink-900 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="label-cap">Max pieces</span>
              <span className="font-mono text-xs text-paper-dim">
                {settings.maxPieces.toLocaleString()} → {grid.w}×{grid.h}
              </span>
            </div>
            <input
              type="range"
              className="brick-range w-full"
              min={256}
              max={9216}
              step={64}
              value={settings.maxPieces}
              onChange={(e) =>
                onChange({ maxPieces: parseInt(e.target.value, 10) })
              }
              aria-label="Maximum pieces"
            />
          </div>
        )}
      </div>
    </div>
  );
}
