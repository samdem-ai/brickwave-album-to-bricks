// Color science: sRGB -> CIELAB and CIEDE2000 (Delta-E 2000).
// Naive RGB distance produces muddy matches, so we work in LAB.

export type Lab = readonly [number, number, number];
export type Rgb = readonly [number, number, number];

const D65 = { Xn: 95.047, Yn: 100.0, Zn: 108.883 };
const EPS = 216 / 24389; // 0.008856
const KAPPA = 24389 / 27; // 903.3

function srgbToLinear(c: number): number {
  const cs = c / 255;
  return cs <= 0.04045 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}

export function rgbToLab(r: number, g: number, b: number): Lab {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  // linear sRGB -> XYZ (D65), scaled to 0..100
  const X = (lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375) * 100;
  const Y = (lr * 0.2126729 + lg * 0.7151522 + lb * 0.072175) * 100;
  const Z = (lr * 0.0193339 + lg * 0.119192 + lb * 0.9503041) * 100;

  const fx = pivot(X / D65.Xn);
  const fy = pivot(Y / D65.Yn);
  const fz = pivot(Z / D65.Zn);

  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function pivot(t: number): number {
  return t > EPS ? Math.cbrt(t) : (KAPPA * t + 16) / 116;
}

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

// CIEDE2000. kL = kC = kH = 1.
export function deltaE00(lab1: Lab, lab2: Lab): number {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;

  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cbar = (C1 + C2) / 2;

  const Cbar7 = Math.pow(Cbar, 7);
  const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + 6103515625))); // 25^7

  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);

  const h1p = hueAngle(b1, a1p);
  const h2p = hueAngle(b2, a2p);

  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  let dhp: number;
  if (C1p * C2p === 0) {
    dhp = 0;
  } else {
    const diff = h2p - h1p;
    if (Math.abs(diff) <= 180) dhp = diff;
    else if (diff > 180) dhp = diff - 360;
    else dhp = diff + 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * DEG) / 2);

  const Lbarp = (L1 + L2) / 2;
  const Cbarp = (C1p + C2p) / 2;

  let hbarp: number;
  if (C1p * C2p === 0) {
    hbarp = h1p + h2p;
  } else if (Math.abs(h1p - h2p) <= 180) {
    hbarp = (h1p + h2p) / 2;
  } else if (h1p + h2p < 360) {
    hbarp = (h1p + h2p + 360) / 2;
  } else {
    hbarp = (h1p + h2p - 360) / 2;
  }

  const T =
    1 -
    0.17 * Math.cos((hbarp - 30) * DEG) +
    0.24 * Math.cos(2 * hbarp * DEG) +
    0.32 * Math.cos((3 * hbarp + 6) * DEG) -
    0.2 * Math.cos((4 * hbarp - 63) * DEG);

  const dTheta = 30 * Math.exp(-(((hbarp - 275) / 25) ** 2));
  const Cbarp7 = Math.pow(Cbarp, 7);
  const Rc = 2 * Math.sqrt(Cbarp7 / (Cbarp7 + 6103515625));
  const Sl =
    1 + (0.015 * (Lbarp - 50) ** 2) / Math.sqrt(20 + (Lbarp - 50) ** 2);
  const Sc = 1 + 0.045 * Cbarp;
  const Sh = 1 + 0.015 * Cbarp * T;
  const Rt = -Math.sin(2 * dTheta * DEG) * Rc;

  const dLterm = dLp / Sl;
  const dCterm = dCp / Sc;
  const dHterm = dHp / Sh;

  return Math.sqrt(
    dLterm * dLterm +
      dCterm * dCterm +
      dHterm * dHterm +
      Rt * dCterm * dHterm,
  );
}

function hueAngle(b: number, ap: number): number {
  if (ap === 0 && b === 0) return 0;
  let h = Math.atan2(b, ap) * RAD;
  if (h < 0) h += 360;
  return h;
}
