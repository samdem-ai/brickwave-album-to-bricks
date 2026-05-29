"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Dropzone from "@/components/Dropzone";
import Presets from "@/components/Presets";
import Cropper from "@/components/Cropper";
import Controls from "@/components/Controls";
import MosaicCanvas from "@/components/MosaicCanvas";
import BillOfMaterials from "@/components/BillOfMaterials";
import StudBadge from "@/components/StudBadge";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import ShareCard from "@/components/ShareCard";
import ExampleBuild from "@/components/ExampleBuild";

import { getPalette } from "@/lib/palette";
import { NEUTRAL_ADJUST, POP_ADJUST } from "@/lib/mosaic";
import { downscaleToGrid, type CropRect } from "@/lib/image";
import {
  DEFAULT_SETTINGS,
  gridFromSettings,
  type Settings,
} from "@/lib/settings";
import { buildBom } from "@/lib/bom";
import { exportCsv, exportPng, renderMosaicCanvas } from "@/lib/exports";
import { buildGuidePdf } from "@/lib/pdf";
import { useMosaicWorker } from "@/lib/useMosaicWorker";
import { playClick, playPlonk } from "@/lib/sound";
import {
  buildShareUrl,
  loadImageLocal,
  parseShareUrl,
  saveImageLocal,
  type ShareState,
} from "@/lib/permalink";

type Phase = "empty" | "staged" | "built";

function makeCroppedDataUrl(
  img: HTMLImageElement,
  crop: CropRect,
  aspect: number,
): string {
  const w = 480;
  const h = Math.round(480 / aspect);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, w, h);
  return c.toDataURL("image/png");
}

export default function Page() {
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [phase, setPhase] = useState<Phase>("empty");
  const [playToken, setPlayToken] = useState(0);
  const [showBadge, setShowBadge] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [compare, setCompare] = useState(false);
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [afterUrl, setAfterUrl] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const { result, computing, compute } = useMosaicWorker();

  const imgRef = useRef<HTMLImageElement | null>(null);
  const cropRef = useRef<CropRect | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const liveEnabled = useRef(false);
  const pendingAutoBuild = useRef(false);

  const resultPalette = useMemo(
    () => getPalette(result ? result.paletteName : settings.paletteName),
    [result, settings.paletteName],
  );
  const bom = useMemo(
    () => (result ? buildBom(result, resultPalette) : null),
    [result, resultPalette],
  );

  const click = useCallback(() => {
    if (soundOn) playClick();
  }, [soundOn]);
  const clickCb = soundOn ? click : undefined;

  // load the working image for downscaling
  useEffect(() => {
    if (!src) {
      imgRef.current = null;
      return;
    }
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      if (pendingAutoBuild.current && cropRef.current) {
        pendingAutoBuild.current = false;
        build();
      }
    };
    img.src = src;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const regenerate = useCallback(
    (cascade: boolean) => {
      const img = imgRef.current;
      const c = cropRef.current;
      const s = settingsRef.current;
      if (!img || !c) return;
      const { w, h } = gridFromSettings(s);
      const pixels = downscaleToGrid(img, c, w, h);
      compute(
        {
          width: w,
          height: h,
          pixels,
          paletteName: s.paletteName,
          dither: s.dither,
          adjust: s.adjust,
        },
        cascade ? () => setPlayToken((t) => t + 1) : undefined,
      );
    },
    [compute],
  );

  const build = useCallback(() => {
    if (soundOn) playPlonk();
    setPhase("built");
    setShowBadge(false);
    setCompare(false);
    liveEnabled.current = false;
    regenerate(true);
  }, [regenerate, soundOn]);

  const onCropChange = useCallback(
    (c: CropRect) => {
      cropRef.current = c;
      setCrop(c);
      if (pendingAutoBuild.current && imgRef.current) {
        pendingAutoBuild.current = false;
        build();
      }
    },
    [build],
  );

  const onImage = useCallback((dataUrl: string) => {
    setSrc(dataUrl);
    setPhase("staged");
    setShowBadge(false);
    setCompare(false);
    liveEnabled.current = false;
    saveImageLocal(dataUrl);
  }, []);

  const patchSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  // live re-render on edits (after the first cascade finishes)
  useEffect(() => {
    if (!liveEnabled.current) return;
    const t = setTimeout(() => regenerate(false), 150);
    return () => clearTimeout(t);
  }, [settings, crop, regenerate]);

  const onAnimDone = useCallback(() => {
    liveEnabled.current = true;
    setShowBadge(true);
  }, []);

  // derived images for compare + export
  useEffect(() => {
    if (phase !== "built" || !result) return;
    setAfterUrl(
      renderMosaicCanvas(result, resultPalette, 12, settings.tileShape).toDataURL(
        "image/png",
      ),
    );
  }, [result, resultPalette, phase, settings.tileShape]);

  useEffect(() => {
    if (phase !== "built" || !imgRef.current || !crop) return;
    setBeforeUrl(makeCroppedDataUrl(imgRef.current, crop, settings.aspect));
  }, [crop, phase, settings.aspect]);

  // restore from a shared link
  useEffect(() => {
    const st = parseShareUrl();
    if (!st) return;
    setSettings((prev) => ({
      ...prev,
      studSize: st.studSize,
      paletteName: st.paletteName,
      dither: st.dither,
      adjust: st.adjust,
      aspect: st.aspect,
      budgetOn: st.budgetOn,
      maxPieces: st.maxPieces,
      tileShape: st.tileShape ?? "square",
    }));
    if (st.hasImage) {
      const img = loadImageLocal();
      if (img) {
        pendingAutoBuild.current = true;
        setSrc(img);
        setPhase("staged");
      }
    }
  }, []);

  const copyLink = useCallback(async () => {
    click();
    const s = settingsRef.current;
    const shareState: ShareState = {
      studSize: s.studSize,
      paletteName: s.paletteName,
      dither: s.dither,
      adjust: s.adjust,
      aspect: s.aspect,
      budgetOn: s.budgetOn,
      maxPieces: s.maxPieces,
      tileShape: s.tileShape,
      hasImage: !!src,
    };
    try {
      await navigator.clipboard.writeText(buildShareUrl(shareState));
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  }, [click, src]);

  const startOver = useCallback(() => {
    click();
    setSrc(null);
    setCrop(null);
    cropRef.current = null;
    setPhase("empty");
    setShowBadge(false);
    setCompare(false);
    liveEnabled.current = false;
  }, [click]);

  const grid = gridFromSettings(settings);

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 pb-20 pt-6 sm:px-6">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-2 gap-1">
            {["#e3000b", "#ffcd00", "#0055bf", "#00852b"].map((c) => (
              <span
                key={c}
                className="h-3.5 w-3.5 rounded-[3px]"
                style={{ background: c }}
              />
            ))}
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold leading-none tracking-tight text-paper">
              BRICKWAVE
            </h1>
            <p className="text-xs text-paper-dim">
              Turn a cover into a LEGO mosaic.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={soundOn}
            aria-label="Toggle sound effects"
            onClick={() => {
              const next = !soundOn;
              setSoundOn(next);
              if (next) playClick();
            }}
            className="btn-ghost"
          >
            {soundOn ? "🔊 Sound on" : "🔇 Sound off"}
          </button>
          {phase !== "empty" && (
            <button type="button" className="btn-ghost" onClick={startOver}>
              Start over
            </button>
          )}
        </div>
      </header>

      {phase === "empty" ? (
        <>
        <section className="grid min-h-[72vh] items-center gap-8 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <h2 className="font-display text-5xl font-extrabold leading-[0.95] text-paper sm:text-6xl">
              Drop a cover.
              <br />
              <span className="text-brick-yellow">Watch it brick.</span>
            </h2>
            <p className="mt-5 max-w-md text-lg text-paper-dim">
              Rebuild any album cover as a LEGO mosaic — then walk away with an
              exact parts list and a printable build guide. All in your browser.
            </p>
            <div className="mt-6">
              <Presets onPick={onImage} onSound={clickCb} />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <Dropzone onImage={onImage} onSound={clickCb} />
          </div>
        </section>
        <section className="mx-auto mt-8 max-w-2xl">
          <ExampleBuild onTry={onImage} onSound={clickCb} />
        </section>
        </>
      ) : (
        <section className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          {/* Preview column */}
          <div className="flex flex-col gap-4">
            {phase === "staged" ? (
              <>
                <div className="panel p-4">
                  <p className="label-cap mb-3">
                    Frame it — drag to pan, scroll to zoom
                  </p>
                  {src && (
                    <Cropper
                      src={src}
                      aspect={settings.aspect}
                      onChange={onCropChange}
                    />
                  )}
                </div>
                <button
                  type="button"
                  className="btn-brick w-full bg-brick-yellow py-4 text-xl"
                  onClick={build}
                  disabled={!crop || computing}
                >
                  {computing ? "Building…" : "Build it →"}
                </button>
              </>
            ) : (
              <>
                {/* Framed artwork */}
                <div className="relative">
                  <div
                    className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 -translate-y-full bg-ink-600"
                    aria-hidden
                  />
                  <div className="rounded-[18px] border-[10px] border-ink-700 bg-ink-950 p-3 shadow-frame">
                    {showBadge && bom && (
                      <StudBadge
                        pieces={bom.totalPieces}
                        colors={bom.colorsUsed}
                      />
                    )}
                    {compare && beforeUrl && afterUrl ? (
                      <BeforeAfterSlider
                        beforeUrl={beforeUrl}
                        afterUrl={afterUrl}
                        aspect={settings.aspect}
                      />
                    ) : (
                      <MosaicCanvas
                        result={result}
                        palette={resultPalette}
                        playToken={playToken}
                        shape={settings.tileShape}
                        onDone={onAnimDone}
                        className="block h-auto w-full rounded-[4px]"
                      />
                    )}
                  </div>
                </div>

                {bom && (
                  <p className="text-center font-display text-lg font-bold text-paper">
                    Your masterpiece —{" "}
                    <span className="text-brick-yellow">
                      {bom.totalPieces.toLocaleString()} studs strong.
                    </span>
                  </p>
                )}

                {/* Action bar */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="btn-brick bg-brick-yellow py-2.5 text-sm"
                    onClick={build}
                    disabled={computing}
                  >
                    ✨ Rebuild
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    aria-pressed={compare}
                    onClick={() => {
                      click();
                      setCompare((v) => !v);
                    }}
                    disabled={!beforeUrl || !afterUrl}
                  >
                    {compare ? "Hide compare" : "Before / after"}
                  </button>
                  <div className="grow" />
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      click();
                      if (result)
                        exportPng(
                          result,
                          resultPalette,
                          undefined,
                          undefined,
                          settings.tileShape,
                        );
                    }}
                  >
                    PNG
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      click();
                      if (result && bom)
                        buildGuidePdf(result, resultPalette, bom);
                    }}
                  >
                    PDF guide
                  </button>
                  {result && bom && (
                    <ShareCard
                      result={result}
                      palette={resultPalette}
                      bom={bom}
                      shape={settings.tileShape}
                      onSound={clickCb}
                    />
                  )}
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={copyLink}
                  >
                    {linkCopied ? "Link copied!" : "Copy link"}
                  </button>
                </div>

                {/* swap image */}
                <Dropzone onImage={onImage} onSound={clickCb} compact />
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            <div className="panel p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-lg font-extrabold text-paper">
                  Tune it
                </h3>
                <span className="chip">
                  {grid.w}×{grid.h} · {(grid.w * grid.h).toLocaleString()} pcs
                </span>
              </div>
              <Controls
                settings={settings}
                onChange={patchSettings}
                onPop={() => patchSettings({ adjust: { ...POP_ADJUST } })}
                onResetAdjust={() =>
                  patchSettings({ adjust: { ...NEUTRAL_ADJUST } })
                }
                onSound={clickCb}
              />
            </div>

            {phase === "built" && bom && (
              <BillOfMaterials
                bom={bom}
                onCsv={() => exportCsv(bom)}
                onSound={clickCb}
              />
            )}
          </div>
        </section>
      )}

      <footer className="mt-16 border-t border-ink-700 pt-6 text-center text-xs text-paper-dim">
        Made for people who love records and LEGO. Everything runs in your
        browser — nothing is uploaded.
      </footer>
    </div>
  );
}
