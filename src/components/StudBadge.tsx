"use client";

interface Props {
  pieces: number;
  colors: number;
}

export default function StudBadge({ pieces, colors }: Props) {
  return (
    <div className="pointer-events-none absolute -right-3 -top-4 z-20 animate-sticker-pop sm:-right-5 sm:-top-6">
      <div className="relative grid h-24 w-24 place-items-center rounded-full bg-brick-yellow text-ink-950 shadow-sticker ring-4 ring-ink-950 sm:h-28 sm:w-28">
        <span
          className="absolute inset-1 rounded-full border-2 border-dashed border-ink-950/40"
          aria-hidden
        />
        <div className="text-center leading-none">
          <div className="font-display text-2xl font-extrabold sm:text-3xl">
            {pieces.toLocaleString()}
          </div>
          <div className="font-display text-[0.6rem] font-bold uppercase tracking-widest">
            bricks!
          </div>
          <div className="mt-0.5 font-mono text-[0.55rem] font-bold text-ink-800">
            {colors} colors
          </div>
        </div>
      </div>
    </div>
  );
}
