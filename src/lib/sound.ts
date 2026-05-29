// A soft, satisfying brick "click". Off by default; the UI gates this.
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export function playClick(volume = 0.22) {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume();
  const t = c.currentTime;

  const osc = c.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(440, t);
  osc.frequency.exponentialRampToValueAtTime(150, t + 0.05);

  const gain = c.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);

  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.1);
}

export function playPlonk(volume = 0.18) {
  // a deeper double-tap for the big "Build" moment
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume();
  const t = c.currentTime;
  [0, 0.07].forEach((dt, i) => {
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(i ? 330 : 220, t + dt);
    const gain = c.createGain();
    gain.gain.setValueAtTime(volume, t + dt);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.12);
    osc.connect(gain).connect(c.destination);
    osc.start(t + dt);
    osc.stop(t + dt + 0.13);
  });
}
