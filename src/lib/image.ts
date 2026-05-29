export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export function centeredCrop(iw: number, ih: number, aspect = 1): CropRect {
  // Largest rect of the given aspect that fits, centered.
  let w = iw;
  let h = iw / aspect;
  if (h > ih) {
    h = ih;
    w = ih * aspect;
  }
  return { x: (iw - w) / 2, y: (ih - h) / 2, w, h };
}

// Downscale a cropped region of the source into a gw x gh grid of pixels.
// One grid cell == one LEGO piece. Browser filtering area-averages for us.
export function downscaleToGrid(
  img: CanvasImageSource,
  crop: CropRect,
  gw: number,
  gh: number,
): Uint8ClampedArray {
  const canvas = document.createElement("canvas");
  canvas.width = gw;
  canvas.height = gh;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("No 2D context");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, gw, gh);
  return ctx.getImageData(0, 0, gw, gh).data;
}
