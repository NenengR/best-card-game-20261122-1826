// Mouse and keyboard controls, with canvas-to-logical coordinate mapping.
import { WIDTH, HEIGHT } from './config.js';
import { layout, END_TURN_RECT } from './render.js';
import { startDuel, restart, toTitle, playCard, endTurn, canPlay, statusLine } from './game.js';
import { unlockAudio, toggleMute, sfx } from './audio.js';

function point(canvas, event) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - r.left) / r.width * WIDTH,
    y: (event.clientY - r.top) / r.height * HEIGHT,
  };
}

function inside(p, b) {
  return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
}

function hitTest(state, p) {
  if (state.screen !== 'play') return 'screen';
  if (inside(p, END_TURN_RECT)) return 'end';
  const L = layout(state);
  for (let i = L.cards.length - 1; i >= 0; i--) {
    const c = L.cards[i];
    if (inside(p, { x: c.x - 3, y: c.y - 3, w: c.w + 6, h: c.h + 6 })) return i;
  }
  return -1;
}

export function begin(state) {
  if (state.screen === 'title') {
    startDuel(state, state.seed);
    sfx('start');
  } else if (state.screen === 'victory' || state.screen === 'defeat') {
    restart(state);
    sfx('start');
  }
}

export function performPlay(state, index) {
  if (state.screen !== 'play') return;
  const check = canPlay(state, index);
  if (!check.ok) { sfx('deny'); playCard(state, index); return; }
  const res = playCard(state, index);
  if (res.ok) {
    sfx(res.resonance ? 'resonance' : 'card');
    if (res.dmg) sfx('impact');
    if (res.card.ward || res.card.heal || res.card.drain) sfx(res.card.ward ? 'ward' : 'heal');
    if (res.card.draw) sfx('draw');
    if (state.screen === 'victory') sfx('win');
  }
}

export function performEnd(state) {
  if (state.screen !== 'play') return;
  sfx('end');
  const before = state.screen;
  const res = endTurn(state);
  if (res.ok) sfx(res.defeat ? 'lose' : 'impact');
  if (before === 'play' && state.screen !== 'play') sfx(state.screen === 'victory' ? 'win' : 'lose');
}

export function bindInput(canvas, state, statusEl) {
  canvas.addEventListener('pointermove', (e) => {
    const p = point(canvas, e);
    state.hover = hitTest(state, p);
    canvas.style.cursor = state.hover === 'end' || (typeof state.hover === 'number' && state.hover >= 0)
      ? 'pointer' : 'default';
  });

  canvas.addEventListener('pointerleave', () => { state.hover = -1; });

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    unlockAudio();
    const p = point(canvas, e);
    const hit = hitTest(state, p);
    if (state.screen === 'title' || state.screen === 'victory' || state.screen === 'defeat') { begin(state); return; }
    if (hit === 'end') performEnd(state);
    else if (typeof hit === 'number' && hit >= 0) performPlay(state, hit);
    if (statusEl) statusEl.textContent = statusLine(state);
  });

  window.addEventListener('keydown', (e) => {
    const k = e.key;
    if (k === ' ' || k === 'Enter' || k === 'Spacebar') e.preventDefault();
    if (k === 'm' || k === 'M') { unlockAudio(); toggleMute(); return; }
    if (k === 'Escape') { toTitle(state); return; }
    if (k === 'r' || k === 'R') { unlockAudio(); if (state.screen === 'title') begin(state); else restart(state); sfx('start'); return; }
    if (k === ' ' || k === 'Enter' || k === 'Spacebar') {
      unlockAudio();
      if (state.screen === 'title' || state.screen === 'victory' || state.screen === 'defeat') begin(state);
      else performEnd(state);
    } else if (/^[1-7]$/.test(k)) {
      unlockAudio();
      performPlay(state, Number(k) - 1);
    }
    if (statusEl) statusEl.textContent = statusLine(state);
  });
}
