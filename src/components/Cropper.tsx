"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CropRect } from "@/lib/image";

interface Props {
  src: string;
  aspect?: number; // w / h, default 1 (square)
  onChange: (crop: CropRect) => void;
}

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

export default function Cropper({ src, aspect = 1, onChange }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [vp, setVp] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const initialized = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStart = useRef<{ dist: number; zoom: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null,
  );

  // Load natural size
  useEffect(() => {
    initialized.current = false;
    const img = new Image();
    img.onload = () => setNat({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [src]);

  // Measure viewport
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setVp({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setVp({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const baseScale =
    nat && vp.w && vp.h ? Math.max(vp.w / nat.w, vp.h / nat.h) : 1;
  const scale = baseScale * zoom;

  const clampOffset = useCallback(
    (x: number, y: number, s: number) => {
      if (!nat) return { x, y };
      const dispW = nat.w * s;
      const dispH = nat.h * s;
      return {
        x: clamp(x, vp.w - dispW, 0),
        y: clamp(y, vp.h - dispH, 0),
      };
    },
    [nat, vp.w, vp.h],
  );

  const emit = useCallback(
    (s: number, o: { x: number; y: number }) => {
      if (!nat) return;
      const crop: CropRect = {
        x: clamp(-o.x / s, 0, nat.w),
        y: clamp(-o.y / s, 0, nat.h),
        w: clamp(vp.w / s, 1, nat.w),
        h: clamp(vp.h / s, 1, nat.h),
      };
      onChangeRef.current(crop);
    },
    [nat, vp.w, vp.h],
  );

  // Center on first ready / when source changes
  useEffect(() => {
    if (!nat || !vp.w || !vp.h) return;
    if (initialized.current) {
      // keep zoom, re-clamp to new viewport
      const o = clampOffset(off.x, off.y, scale);
      if (o.x !== off.x || o.y !== off.y) setOff(o);
      emit(scale, o);
      return;
    }
    const s = baseScale; // zoom 1
    const o = {
      x: (vp.w - nat.w * s) / 2,
      y: (vp.h - nat.h * s) / 2,
    };
    setZoom(1);
    setOff(o);
    initialized.current = true;
    emit(s, o);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nat, vp.w, vp.h]);

  const applyZoom = useCallback(
    (nextZoom: number, center?: { x: number; y: number }) => {
      if (!nat) return;
      const z = clamp(nextZoom, 1, 8);
      const s2 = baseScale * z;
      const cx = center?.x ?? vp.w / 2;
      const cy = center?.y ?? vp.h / 2;
      // keep the point under the cursor stable
      const sourceX = (cx - off.x) / scale;
      const sourceY = (cy - off.y) / scale;
      const o = clampOffset(cx - sourceX * s2, cy - sourceY * s2, s2);
      setZoom(z);
      setOff(o);
      emit(s2, o);
    },
    [nat, baseScale, scale, off, vp.w, vp.h, clampOffset, emit],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      dragStart.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y };
    } else if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      pinchStart.current = {
        dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
        zoom,
      };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size >= 2 && pinchStart.current) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const rect = viewportRef.current?.getBoundingClientRect();
      const mid = {
        x: (pts[0].x + pts[1].x) / 2 - (rect?.left ?? 0),
        y: (pts[0].y + pts[1].y) / 2 - (rect?.top ?? 0),
      };
      applyZoom((dist / pinchStart.current.dist) * pinchStart.current.zoom, mid);
      return;
    }

    if (dragStart.current) {
      const o = clampOffset(
        dragStart.current.ox + (e.clientX - dragStart.current.x),
        dragStart.current.oy + (e.clientY - dragStart.current.y),
        scale,
      );
      setOff(o);
      emit(scale, o);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) dragStart.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    const center = {
      x: e.clientX - (rect?.left ?? 0),
      y: e.clientY - (rect?.top ?? 0),
    };
    applyZoom(zoom * (e.deltaY < 0 ? 1.12 : 0.89), center);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = 16;
    if (e.key === "ArrowLeft") setOffEmit(off.x + step, off.y);
    else if (e.key === "ArrowRight") setOffEmit(off.x - step, off.y);
    else if (e.key === "ArrowUp") setOffEmit(off.x, off.y + step);
    else if (e.key === "ArrowDown") setOffEmit(off.x, off.y - step);
    else if (e.key === "+" || e.key === "=") applyZoom(zoom * 1.12);
    else if (e.key === "-" || e.key === "_") applyZoom(zoom * 0.89);
    else return;
    e.preventDefault();
  };

  const setOffEmit = (x: number, y: number) => {
    const o = clampOffset(x, y, scale);
    setOff(o);
    emit(scale, o);
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={viewportRef}
        role="application"
        aria-label="Crop the image. Drag to pan, scroll or pinch to zoom, arrow keys to nudge."
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onKeyDown={onKeyDown}
        className="relative w-full cursor-grab touch-none overflow-hidden rounded-brick border-2 border-ink-700 bg-ink-950 shadow-frame active:cursor-grabbing focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brick-yellow/50"
        style={{ aspectRatio: String(aspect) }}
      >
        {nat && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            draggable={false}
            className="pointer-events-none absolute left-0 top-0 max-w-none select-none"
            style={{
              width: nat.w * scale,
              height: nat.h * scale,
              transform: `translate(${off.x}px, ${off.y}px)`,
            }}
          />
        )}
        {/* rule-of-thirds guides */}
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute left-1/3 top-0 h-full w-px bg-white/30" />
          <div className="absolute left-2/3 top-0 h-full w-px bg-white/30" />
          <div className="absolute left-0 top-1/3 h-px w-full bg-white/30" />
          <div className="absolute left-0 top-2/3 h-px w-full bg-white/30" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="label-cap shrink-0">Zoom</span>
        <input
          type="range"
          className="brick-range w-full"
          min={1}
          max={8}
          step={0.01}
          value={zoom}
          aria-label="Zoom"
          onChange={(e) => applyZoom(parseFloat(e.target.value))}
        />
        <button
          type="button"
          className="btn-ghost shrink-0 px-3 py-1.5 text-xs"
          onClick={() => {
            if (!nat) return;
            const s = baseScale;
            const o = {
              x: (vp.w - nat.w * s) / 2,
              y: (vp.h - nat.h * s) / 2,
            };
            setZoom(1);
            setOff(o);
            emit(s, o);
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
