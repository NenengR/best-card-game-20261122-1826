// All sound is synthesised at run time with the Web Audio API: no files, no requests.
let ctx = null;
let master = null;
let drone = null;
let muted = false;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.17;
  master.connect(ctx.destination);
  startDrone();
  return ctx;
}

export function unlockAudio() {
  const c = ensure();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

export function setMuted(value) {
  muted = value;
  if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 0.17, ctx.currentTime, 0.03);
  return muted;
}

export function toggleMute() { return setMuted(!muted); }
export function isMuted() { return muted; }

function startDrone() {
  if (!ctx || drone) return;
  const bus = ctx.createGain();
  bus.gain.value = 0.11;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.value = 420;
  bus.connect(filter); filter.connect(master);
  const a = ctx.createOscillator(), b = ctx.createOscillator();
  a.type = 'sine'; a.frequency.value = 55;
  b.type = 'triangle'; b.frequency.value = 82.4; b.detune.value = 7;
  a.connect(bus); b.connect(bus);
  const lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
  lfo.frequency.value = 0.09; lfoGain.gain.value = 0.05;
  lfo.connect(lfoGain); lfoGain.connect(bus.gain);
  a.start(); b.start(); lfo.start();
  drone = { a, b, lfo, bus };
}

function tone(freq, dur, type = 'sine', gain = 0.4, delay = 0, endFreq = null) {
  const c = ensure();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t0 + dur);
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(Math.max(0.001, gain), t0 + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(env); env.connect(master);
  osc.start(t0); osc.stop(t0 + dur + 0.03);
}

function noise(dur = 0.2, gain = 0.25, delay = 0) {
  const c = ensure();
  if (!c) return;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource(); src.buffer = buf;
  const filter = c.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 1100;
  const env = c.createGain(); env.gain.value = gain;
  src.connect(filter); filter.connect(env); env.connect(master);
  src.start(c.currentTime + delay);
}

const SCALE = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3, 659.3, 784.0];

export function sfx(name) {
  const c = ensure();
  if (!c) return;
  switch (name) {
    case 'start':
      [0, 1, 2, 4].forEach((n, i) => tone(SCALE[n] * 0.5, 0.5, 'triangle', 0.3, i * 0.09));
      break;
    case 'card':
      tone(420, 0.12, 'triangle', 0.3, 0, 720);
      tone(880, 0.09, 'sine', 0.14, 0.03);
      break;
    case 'impact':
      noise(0.22, 0.42);
      tone(150, 0.28, 'sawtooth', 0.32, 0, 48);
      break;
    case 'resonance':
      [0, 2, 4, 7].forEach((n, i) => tone(SCALE[n] * 2, 0.24, 'sine', 0.18, i * 0.055));
      break;
    case 'ward':
      tone(580, 0.3, 'sine', 0.24, 0, 940);
      tone(1160, 0.18, 'sine', 0.1, 0.05);
      break;
    case 'heal':
      [440, 554, 659].forEach((f, i) => tone(f, 0.3, 'sine', 0.16, i * 0.07));
      break;
    case 'draw':
      tone(660, 0.1, 'triangle', 0.16, 0, 990);
      break;
    case 'deny':
      tone(150, 0.16, 'square', 0.2, 0, 110);
      break;
    case 'end':
      tone(330, 0.22, 'triangle', 0.22, 0, 220);
      break;
    case 'win':
      [0, 2, 4, 5, 7].forEach((n, i) => {
        tone(SCALE[n % SCALE.length] * (n >= 7 ? 2 : 1), 0.62, 'triangle', 0.3, i * 0.13);
        tone(SCALE[n % SCALE.length] * 2, 0.4, 'sine', 0.1, i * 0.13 + 0.02);
      });
      break;
    case 'lose':
      [4, 2, 1, 0].forEach((n, i) => tone(SCALE[n] * 0.5, 0.7, 'sawtooth', 0.2, i * 0.17));
      noise(0.8, 0.12, 0.1);
      break;
  }
}
