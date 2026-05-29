/// <reference lib="webworker" />
import { computeMosaic, type MosaicRequest } from "@/lib/mosaic";

type Incoming = MosaicRequest & { jobId: number };

self.onmessage = (e: MessageEvent<Incoming>) => {
  const { jobId, ...req } = e.data;
  const result = computeMosaic(req);
  // Transfer the indices buffer back to avoid a copy.
  (self as unknown as Worker).postMessage(
    { jobId, result },
    [result.indices.buffer],
  );
};

export {};
