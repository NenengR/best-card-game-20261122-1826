// Easing, tweens, particles, floating numbers and screen shake for EMBERWEAVE.
import { ELEMENTS } from './config.js';

export const FOCUS = {
  warden: { x: 640, y: 268 },
  player: { x: 640, y: 566 },
  loom:   { x: 640, y: 392 },
  hand:   { x: 640, y: 646 },
};

export const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
export const easeInOutSine = t => -(Math.cos(Math.PI * t) - 1) / 2;
export const easeOutBack = t => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
export const clamp01 = t => t < 0 ? 0 : t > 1 ? 1 : t;
export const lerp = (a, b, t) => a + (b - a) * t;

export function tween(from, to, t, ease = easeOutCubic) {
  return lerp(from, to, ease(clamp01(t)));
}

export function emit(state, event) {
  state.events.push(event);
}

// Turn abstract game events into visual effects at fixed focus points.
export function drainEvents(state) {
  for (const e of state.events) {
    const at = FOCUS[e.target] || FOCUS.loom;
    const color = e.color || '#ffffff';
    if (e.kind === 'resonance') {
      state.floats.push({ x: at.x, y: at.y - 46, text: e.label, color: '#ffe7a0', life: 1.5, max: 1.5, size: 25, vx: 0, vy: -26 });
      burst(state, at.x, at.y, '#ffcf6e', 18, 130);
    } else if (e.kind === 'text') {
      state.floats.push({ x: at.x, y: at.y, text: e.label, color, life: 1.4, max: 1.4, size: e.size || 22, vx: 0, vy: -34 });
    } else if (e.kind === 'damage') {
      state.floats.push({ x: at.x + (state.rng.next() - 0.5) * 50, y: at.y - 20, text: `-${e.value}`, color: '#ff8a6a', life: 1.25, max: 1.25, size: 34, vx: 0, vy: -58 });
      burst(state, at.x, at.y, color, 22, 190);
      state.shake = Math.max(state.shake, 9);
    } else if (e.kind === 'ward') {
      state.floats.push({ x: at.x, y: at.y - 14, text: `+${e.value} WARD`, color: '#8fe3ff', life: 1.2, max: 1.2, size: 21, vx: 0, vy: -40 });
      burst(state, at.x, at.y, '#8fe3ff', 12, 90);
    } else if (e.kind === 'heal') {
      state.floats.push({ x: at.x, y: at.y - 14, text: `+${e.value} LIFE`, color: '#8affb4', life: 1.2, max: 1.2, size: 21, vx: 0, vy: -40 });
      burst(state, at.x, at.y, '#8affb4', 12, 80);
    } else if (e.kind === 'draw') {
      state.floats.push({ x: at.x, y: at.y, text: `DRAW ${e.value}`, color: '#c8d6ff', life: 1.0, max: 1.0, size: 18, vx: 0, vy: -30 });
    }
  }
  state.events.length = 0;
}

export function burst(state, x, y, color, count = 16, speed = 120) {
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + state.rng.next() * 0.5;
    const s = speed * (0.35 + state.rng.next() * 0.8);
    state.particles.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life: 0.5 + state.rng.next() * 0.5, max: 1,
      color, size: 1.5 + state.rng.next() * 3.5,
    });
  }
}

export function ambientMote(state) {
  state.motes.push({
    x: state.rng.next() * 1280, y: 740,
    vx: (state.rng.next() - 0.5) * 12, vy: -(14 + state.rng.next() * 30),
    life: 4 + state.rng.next() * 4, max: 8,
    color: ['#ff7a45', '#39a9f0', '#4ad693', '#e8c158', '#ac76ff'][state.rng.int(0, 4)],
    size: 1 + state.rng.next() * 2,
  });
}

export function updateFX(state, dt) {
  for (const p of state.particles) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 180 * dt;
    p.vx *= 0.98; p.life -= dt;
  }
  state.particles = state.particles.filter(p => p.life > 0);
  for (const f of state.floats) {
    f.x += f.vx * dt; f.y += f.vy * dt; f.vy *= 0.94; f.life -= dt;
  }
  state.floats = state.floats.filter(f => f.life > 0);
  for (const m of state.motes) { m.x += m.vx * dt; m.y += m.vy * dt; m.life -= dt; }
  state.motes = state.motes.filter(m => m.life > 0 && m.y > -20);
  state.shake = Math.max(0, state.shake - dt * 26);
  if (state.rng.next() < dt * 3) ambientMote(state);
}

export function drawParticles(ctx, state) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const m of state.motes) {
    ctx.globalAlpha = Math.min(0.42, m.life / m.max);
    ctx.fillStyle = m.color;
    ctx.beginPath(); ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2); ctx.fill();
  }
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.6));
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function drawFloats(ctx, state) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const f of state.floats) {
    const t = f.life / f.max;
    ctx.globalAlpha = Math.min(1, t * 2);
    ctx.font = `bold ${f.size}px Georgia, serif`;
    ctx.shadowColor = f.color; ctx.shadowBlur = 18;
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(4,6,14,0.85)';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.restore();
}

export function elementColor(id) { return ELEMENTS[id] ? ELEMENTS[id].color : '#ffffff'; }
