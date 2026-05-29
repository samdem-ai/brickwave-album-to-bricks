# BRICKWAVE

Turn any album cover into a LEGO® mosaic — with an exact parts list and a printable build guide. Everything runs in your browser; nothing is uploaded.

## What it does

- **Drop a cover** (or pick a sample) and frame it with a pan/zoom cropper.
- **Watch it brick** — the image is rebuilt as a grid of 1×1 LEGO tiles using
  perceptual color matching (CIEDE2000 in LAB space) against real LEGO colors.
- **Tune it** — stud size, palette, aspect ratio, dithering, brightness /
  contrast / saturation, square vs. round tiles, and a piece-count budget.
- **Take it to the table** — export a PNG, a CSV bill of materials, or a
  paint-by-numbers PDF build guide. Share a permalink that restores your setup.

## How it works

The mosaic math lives in a Web Worker so the UI stays smooth:

1. The cropped image is area-averaged down to a stud grid (one cell = one piece).
2. Each cell is matched to the nearest LEGO color using **CIEDE2000**, with
   optional **Floyd–Steinberg** dithering.
3. Tiles are rendered from a cached sprite canvas, with a one-time "pop" cascade.
4. A bill of materials tallies pieces per color, baseplates, finished size, and
   an approximate cost.

No backend, no accounts, no uploads — it's a single client-side Next.js page.

## Tech

- [Next.js](https://nextjs.org) (App Router) + React + TypeScript
- Tailwind CSS
- HTML Canvas + Web Workers (no external image/ML services)

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build    # production build
npm run start    # serve the build
```

## Notes

LEGO® is a trademark of the LEGO Group, which does not sponsor, authorize, or
endorse this project. Sample album art is included for demonstration only.
