// EMBERWEAVE bootstrap: canvas, state, deterministic shots, input and the frame loop.
import { WIDTH, HEIGHT } from './config.js';
import { createGame, startDuel, restart, toTitle, playCard, endTurn, tickGame, statusLine } from './game.js';
import { updateFX, drainEvents } from './animate.js';
import { render } from './render.js';
import { bindInput, begin, performPlay, performEnd } from './input.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
const statusEl = document.getElementById('status');
canvas.width = WIDTH;
canvas.height = HEIGHT;

const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const rawSeed = Number.parseInt(params.get('seed') || '', 10);
const seed = Number.isFinite(rawSeed) ? rawSeed : (Date.now() % 1000000) + 1;
const state = createGame(seed);

if (shotName) applyShot(state, shotName, seed);

bindInput(canvas, state, statusEl);

const SHOT_TIME = 9.75;
let last = performance.now();
let elapsed = 0;
let frames = 0;

function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  elapsed += dt;
  frames++;
  if (!state.shotMode) {
    tickGame(state, dt);
    updateFX(state, dt);
  }
  drainEvents(state);
  render(ctx, state, state.shotMode ? SHOT_TIME : elapsed);
  if (statusEl && frames % 12 === 0) statusEl.textContent = statusLine(state);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// A small inspection surface for play-testing and deterministic screenshot capture.
window.__EMBER = {
  state,
  frames: () => frames,
  begin: () => begin(state),
  play: (i) => performPlay(state, i),
  end: () => performEnd(state),
  restart: () => restart(state),
  title: () => toTitle(state),
  rawPlay: (i) => playCard(state, i),
  rawEnd: () => endTurn(state),
  startDuel: (s) => startDuel(state, s),
  shot: (name) => { applyShot(state, name, seed); },
};
