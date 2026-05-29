"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  computeMosaic,
  type MosaicRequest,
  type MosaicResult,
} from "./mosaic";

type Done = (r: MosaicResult) => void;

export function useMosaicWorker() {
  const workerRef = useRef<Worker | null>(null);
  const jobRef = useRef(0);
  const cbRef = useRef<Done | null>(null);
  const [result, setResult] = useState<MosaicResult | null>(null);
  const [computing, setComputing] = useState(false);

  useEffect(() => {
    let w: Worker | null = null;
    try {
      w = new Worker(new URL("../worker/mosaic.worker.ts", import.meta.url));
      w.onmessage = (e: MessageEvent<{ jobId: number; result: MosaicResult }>) => {
        if (e.data.jobId !== jobRef.current) return; // stale, drop
        setResult(e.data.result);
        setComputing(false);
        cbRef.current?.(e.data.result);
        cbRef.current = null;
      };
      workerRef.current = w;
    } catch {
      workerRef.current = null; // fall back to main thread
    }
    return () => {
      w?.terminate();
      workerRef.current = null;
    };
  }, []);

  const compute = useCallback((req: MosaicRequest, onDone?: Done) => {
    const id = ++jobRef.current;
    setComputing(true);
    cbRef.current = onDone ?? null;
    const w = workerRef.current;
    if (w) {
      w.postMessage({ jobId: id, ...req }, [req.pixels.buffer]);
    } else {
      // Synchronous fallback (keeps app working if worker fails to load).
      const res = computeMosaic(req);
      if (id === jobRef.current) {
        setResult(res);
        setComputing(false);
        onDone?.(res);
      }
    }
  }, []);

  return { result, computing, compute };
}
