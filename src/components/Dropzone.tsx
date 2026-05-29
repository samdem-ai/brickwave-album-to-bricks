"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fileToDataUrl } from "@/lib/image";

interface Props {
  onImage: (dataUrl: string) => void;
  onSound?: () => void;
  compact?: boolean;
}

export default function Dropzone({ onImage, onSound, compact }: Props) {
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setError("That's not an image — try a PNG or JPG.");
        return;
      }
      setError(null);
      const dataUrl = await fileToDataUrl(file);
      onSound?.();
      onImage(dataUrl);
    },
    [onImage, onSound],
  );

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const it of items) {
        if (it.type.startsWith("image/")) {
          handleFile(it.getAsFile());
          break;
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleFile]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload an image: drop a file, click to browse, or paste from clipboard"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDrag(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
      className={[
        "group relative flex w-full cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-brick border-4 border-dashed text-center transition-all duration-200 ease-spring focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brick-yellow/50",
        compact ? "p-6" : "p-10 sm:p-14",
        drag
          ? "scale-[1.02] border-brick-yellow bg-brick-yellow/10 shadow-frame"
          : "border-ink-600 bg-ink-850/70 hover:border-paper/40 hover:bg-ink-800",
      ].join(" ")}
    >
      <div className="stud-grid-bg pointer-events-none absolute inset-0 opacity-30" />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div
        className={[
          "pointer-events-none relative grid grid-cols-2 gap-1.5 transition-transform duration-300 ease-spring",
          drag ? "rotate-6 scale-110" : "group-hover:-rotate-3",
        ].join(" ")}
      >
        {["#e3000b", "#ffcd00", "#0055bf", "#00852b"].map((c) => (
          <span
            key={c}
            className="h-6 w-6 rounded-md shadow-brick-sm"
            style={{ background: c }}
          />
        ))}
      </div>

      {!compact && (
        <>
          <h2 className="relative font-display text-3xl font-extrabold leading-none text-paper sm:text-4xl">
            {drag ? "Let it go!" : "Drop a cover. Watch it brick."}
          </h2>
          <p className="relative max-w-sm text-sm text-paper-dim">
            Drag an album cover here,{" "}
            <span className="font-bold text-paper">click to browse</span>, or
            paste with{" "}
            <kbd className="rounded bg-ink-700 px-1.5 py-0.5 font-mono text-xs">
              {typeof navigator !== "undefined" &&
              navigator.platform.toLowerCase().includes("mac")
                ? "⌘V"
                : "Ctrl+V"}
            </kbd>
            .
          </p>
        </>
      )}
      {compact && (
        <p className="relative text-sm font-bold text-paper">
          Drop, click, or paste a new image
        </p>
      )}

      {error && (
        <p className="relative text-sm font-bold text-brick-red">{error}</p>
      )}
    </div>
  );
}
