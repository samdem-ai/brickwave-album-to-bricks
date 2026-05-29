// Procedural "album covers" so the app demos itself without shipping
// copyrighted art. Each is drawn on a canvas and cached as a data URL.

export interface Preset {
  name: string;
  dataUrl: string;
}

let cache: Preset[] | null = null;

function canvas(size = 640): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return [c, c.getContext("2d")!];
}

function sunburst(): string {
  const [c, ctx] = canvas();
  const s = c.width;
  ctx.fillStyle = "#1c1410";
  ctx.fillRect(0, 0, s, s);
  const cx = s / 2;
  const cy = s * 0.46;
  const rays = 24;
  const colors = ["#ffcd00", "#f57c00", "#e3000b"];
  for (let i = 0; i < rays; i++) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const a0 = (i / rays) * Math.PI * 2;
    const a1 = ((i + 0.5) / rays) * Math.PI * 2;
    ctx.arc(cx, cy, s, a0, a1);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = "#fff03a";
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1c1410";
  ctx.fillRect(0, s * 0.8, s, s * 0.2);
  ctx.fillStyle = "#f6eedc";
  ctx.font = `bold ${s * 0.1}px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.fillText("SOLAR", cx, s * 0.92);
  return c.toDataURL("image/png");
}

function neonGrid(): string {
  const [c, ctx] = canvas();
  const s = c.width;
  const g = ctx.createLinearGradient(0, 0, 0, s);
  g.addColorStop(0, "#0a0a23");
  g.addColorStop(1, "#3f1d5e");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = "#36aebf";
  ctx.lineWidth = 2;
  const horizon = s * 0.55;
  for (let i = 0; i <= 12; i++) {
    const x = (i / 12) * s;
    ctx.beginPath();
    ctx.moveTo(x, horizon);
    ctx.lineTo(s / 2 + (x - s / 2) * 4, s);
    ctx.stroke();
  }
  for (let i = 1; i <= 8; i++) {
    const y = horizon + Math.pow(i / 8, 2) * (s - horizon);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(s, y);
    ctx.stroke();
  }
  ctx.fillStyle = "#e95da2";
  ctx.beginPath();
  ctx.arc(s / 2, horizon - s * 0.08, s * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffcd00";
  ctx.font = `bold ${s * 0.09}px Arial`;
  ctx.textAlign = "center";
  ctx.fillText("NIGHTDRIVE", s / 2, s * 0.2);
  return c.toDataURL("image/png");
}

function prism(): string {
  const [c, ctx] = canvas();
  const s = c.width;
  ctx.fillStyle = "#05131d";
  ctx.fillRect(0, 0, s, s);
  const bands = ["#e3000b", "#f57c00", "#ffcd00", "#00852b", "#0055bf", "#812e9e"];
  ctx.save();
  ctx.translate(s / 2, s / 2);
  ctx.rotate(-Math.PI / 4);
  const bw = (s * 1.6) / bands.length;
  bands.forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.fillRect(-s * 0.8 + i * bw, -s, bw + 1, s * 2);
  });
  ctx.restore();
  // dark triangle "prism"
  ctx.fillStyle = "#0b0b0b";
  ctx.beginPath();
  ctx.moveTo(s * 0.5, s * 0.2);
  ctx.lineTo(s * 0.78, s * 0.7);
  ctx.lineTo(s * 0.22, s * 0.7);
  ctx.closePath();
  ctx.fill();
  return c.toDataURL("image/png");
}

function bloom(): string {
  const [c, ctx] = canvas();
  const s = c.width;
  const g = ctx.createRadialGradient(
    s * 0.5,
    s * 0.5,
    s * 0.05,
    s * 0.5,
    s * 0.5,
    s * 0.7,
  );
  g.addColorStop(0, "#fc97ac");
  g.addColorStop(0.5, "#e3000b");
  g.addColorStop(1, "#1c1410");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  const petals = 8;
  for (let i = 0; i < petals; i++) {
    ctx.save();
    ctx.translate(s / 2, s / 2);
    ctx.rotate((i / petals) * Math.PI * 2);
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.22, s * 0.07, s * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = "#ffcd00";
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s * 0.08, 0, Math.PI * 2);
  ctx.fill();
  return c.toDataURL("image/png");
}

export function getPresets(): Preset[] {
  if (cache) return cache;
  cache = [
    { name: "Solar", dataUrl: sunburst() },
    { name: "Nightdrive", dataUrl: neonGrid() },
    { name: "Prism", dataUrl: prism() },
    { name: "Bloom", dataUrl: bloom() },
  ];
  return cache;
}
