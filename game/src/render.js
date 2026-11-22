// The renderer: astral loom, both HUDs, the telegraphed intent, the hand, effects and screens.
import { WIDTH, HEIGHT, ELEMENTS, ELEMENT_ORDER, START_LIFE, HAND_SIZE, CARD_BY_ID } from './config.js';
import { makeRNG } from './rng.js';
import { roundRect, drawSigil, drawCardFace, drawCardBack, drawIntentCard } from './cardArt.js';
import { drawParticles, drawFloats, easeOutCubic, clamp01 } from './animate.js';

export const END_TURN_RECT = { x: 1068, y: 488, w: 176, h: 54 };

export function layout(state) {
  const n = state.hand.length;
  const w = n <= 5 ? 132 : Math.max(94, Math.floor(700 / n));
  const h = n <= 5 ? 184 : Math.max(146, Math.floor(w * 184 / 132));
  const gap = 10;
  const total = n * w + Math.max(0, n - 1) * gap;
  const startX = WIDTH / 2 - total / 2;
  const cards = state.hand.map((slot, i) => {
    const baseY = 514;
    const lift = state.hover === i ? 30 : 0;
    return {
      i, slot, w, h,
      x: startX + i * (w + gap),
      y: baseY - lift,
      baseY,
      rot: (i - (n - 1) / 2) * 0.022,
      hovered: state.hover === i,
    };
  });
  return { cards, endTurn: END_TURN_RECT };
}

function text(ctx, str, x, y, size, color, align = 'left', family = 'Georgia, serif', bold = false) {
  ctx.font = `${bold ? 'bold ' : ''}${size}px ${family}`;
  ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.fillStyle = color; ctx.fillText(str, x, y);
}

function stars(state) {
  if (!state._stars) {
    const r = makeRNG((state.seed || 1) * 7919 + 13);
    state._stars = Array.from({ length: 110 }, () => ({
      x: r.next() * WIDTH, y: r.next() * 460,
      s: 0.4 + r.next() * 1.5, a: 0.15 + r.next() * 0.6, p: r.next() * 6.28,
    }));
  }
  return state._stars;
}

export function drawBackground(ctx, state, time) {
  ctx.fillStyle = '#05070f';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const g = ctx.createRadialGradient(640, 330, 20, 640, 360, 760);
  g.addColorStop(0, '#1a1533'); g.addColorStop(0.45, '#0c0c1d'); g.addColorStop(1, '#04050c');
  ctx.fillStyle = g; ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (const s of stars(state)) {
    ctx.globalAlpha = s.a * (0.65 + 0.35 * Math.sin(time * 1.6 + s.p));
    ctx.fillStyle = '#dfe8ff';
    ctx.fillRect(s.x, s.y, s.s, s.s);
  }
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.lineWidth = 1;
  for (let i = 0; i <= 23; i++) {
    const x = i * 58 + Math.sin(time * 0.35 + i * 0.6) * 7;
    ctx.strokeStyle = `rgba(150,130,220,${0.035 + 0.02 * Math.sin(time + i)})`;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 26, HEIGHT); ctx.stroke();
  }
  for (let i = 0; i <= 16; i++) {
    const y = i * 46 + Math.cos(time * 0.3 + i * 0.5) * 5;
    ctx.strokeStyle = `rgba(120,170,220,${0.03 + 0.02 * Math.cos(time + i)})`;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y + 10); ctx.stroke();
  }
  ctx.restore();

  drawParticles(ctx, state);
}

function drawLoom(ctx, state, time) {
  const cx = 640, cy = 352;
  ctx.save();
  const glow = ctx.createRadialGradient(cx, cy, 8, cx, cy, 280);
  glow.addColorStop(0, 'rgba(255,190,120,0.10)');
  glow.addColorStop(1, 'rgba(255,190,120,0)');
  ctx.fillStyle = glow; ctx.fillRect(cx - 300, cy - 200, 600, 400);

  // Warp frame.
  ctx.strokeStyle = 'rgba(214,178,110,0.30)'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 290, cy - 96); ctx.lineTo(cx + 290, cy - 96);
  ctx.lineTo(cx + 330, cy); ctx.lineTo(cx + 290, cy + 96);
  ctx.lineTo(cx - 290, cy + 96); ctx.lineTo(cx - 330, cy); ctx.closePath();
  ctx.stroke();
  for (let i = -10; i <= 10; i++) {
    const x = cx + i * 27;
    ctx.strokeStyle = `rgba(200,170,240,${0.05 + 0.05 * Math.sin(time * 2 + i)})`;
    ctx.beginPath(); ctx.moveTo(x, cy - 94); ctx.lineTo(x, cy + 94); ctx.stroke();
  }
  for (let i = -3; i <= 3; i++) {
    const y = cy + i * 26;
    ctx.strokeStyle = 'rgba(255,205,140,0.09)';
    ctx.beginPath(); ctx.moveTo(cx - 288, y); ctx.lineTo(cx + 288, y); ctx.stroke();
  }
  // Central weave knot.
  ctx.translate(cx, cy);
  ctx.rotate(time * 0.15);
  ctx.strokeStyle = 'rgba(255,220,160,0.45)'; ctx.lineWidth = 1.5;
  starPath(ctx, 0, 0, 30, 12, 4); ctx.stroke();
  ctx.restore();

  // Recent cards laid on the loom.
  const recent = state.lastCards.slice(0, 3);
  recent.forEach((entry, i) => {
    const x = 640 + (i - (recent.length - 1) / 2) * 96 - 42;
    const mini = { card: entry.card };
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.45 * (1 - i * 0.22);
    drawCardFace(ctx, mini, x, cy - 76, 84, 118, { mini: true, resonance: entry.resonance > 0 });
    ctx.restore();
    if (entry.resonance > 0) {
      text(ctx, `+${entry.resonance}`, x + 42, cy + 54, 13, '#ffe7a0', 'center', '"Trebuchet MS", sans-serif', true);
    }
  });

  if (state.chain.length) {
    const counts = {};
    state.chain.forEach(e => counts[e] = (counts[e] || 0) + 1);
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    const el = ELEMENTS[top[0]];
    const label = top[1] > 1 ? `${el.name.toUpperCase()} RESONANCE ×${top[1]}  ·  +${(top[1] - 1) * 2} BONUS` : `${el.name.toUpperCase()} THREAD WOVEN`;
    roundRect(ctx, 475, 452, 330, 28, 14);
    ctx.fillStyle = 'rgba(8,10,20,0.72)'; ctx.fill();
    ctx.strokeStyle = el.color + '88'; ctx.lineWidth = 1; ctx.stroke();
    text(ctx, label, 640, 466, 13, el.light, 'center', '"Trebuchet MS", sans-serif', true);
  } else {
    text(ctx, 'MATCH ELEMENTS IN ONE TURN TO WEAVE RESONANCE', 640, 466, 12, '#59617d', 'center', '"Trebuchet MS", sans-serif');
  }
  drawFloats(ctx, state);
}

function starPath(ctx, x, y, outer, inner, points) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = -Math.PI / 2 + Math.PI * i / points;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}

function lifeBar(ctx, x, y, w, h, value, max, color, label, time) {
  text(ctx, label, x, y - 9, 11, '#a8b2cf', 'left', '"Trebuchet MS", sans-serif', true);
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = '#121626'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1; ctx.stroke();
  const ratio = clamp01(value / max);
  if (ratio > 0) {
    ctx.save();
    roundRect(ctx, x + 2, y + 2, (w - 4) * ratio, h - 4, (h - 4) / 2);
    const grad = ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, color); grad.addColorStop(1, '#fff1c9');
    ctx.fillStyle = grad;
    ctx.shadowColor = color; ctx.shadowBlur = 10 + Math.sin(time * 3) * 3;
    ctx.fill();
    ctx.restore();
  }
  for (let i = 1; i < 6; i++) {
    const px = x + w * i / 6;
    ctx.strokeStyle = 'rgba(4,6,12,0.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px, y + 2); ctx.lineTo(px, y + h - 2); ctx.stroke();
  }
  text(ctx, `${value} / ${max}`, x + w / 2, y + h / 2 + 0.5, 13, '#ffffff', 'center', '"Trebuchet MS", sans-serif', true);
}

function wardBadge(ctx, x, y, value, time) {
  if (!value) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y - 15); ctx.lineTo(x + 14, y - 8); ctx.lineTo(x + 14, y + 7);
  ctx.lineTo(x, y + 16); ctx.lineTo(x - 14, y + 7); ctx.lineTo(x - 14, y - 8); ctx.closePath();
  ctx.fillStyle = 'rgba(60,150,210,0.35)'; ctx.fill();
  ctx.strokeStyle = '#9fe6ff'; ctx.lineWidth = 1.5;
  ctx.shadowColor = '#6fd0ff'; ctx.shadowBlur = 8 + Math.sin(time * 4) * 3;
  ctx.stroke();
  text(ctx, String(value), x, y + 1, 15, '#e8faff', 'center', '"Trebuchet MS", sans-serif', true);
  ctx.restore();
}

function drawWardenHUD(ctx, state, time) {
  roundRect(ctx, 30, 20, 380, 104, 12);
  ctx.fillStyle = 'rgba(8,9,20,0.72)'; ctx.fill();
  ctx.strokeStyle = 'rgba(190,140,255,0.35)'; ctx.lineWidth = 1.4; ctx.stroke();
  drawSigil(ctx, 'void', 62, 52, 16, 0.95);
  text(ctx, 'THE HOLLOW WARDEN', 88, 48, 17, '#e3c8ff', 'left', 'Georgia, serif', true);
  text(ctx, 'Keeper of the unraveling loom', 88, 67, 11, '#8d80aa', 'left', '"Trebuchet MS", sans-serif');
  lifeBar(ctx, 48, 90, 300, 18, state.warden.life, state.warden.maxLife, '#b45cff', 'LIFE', time);
  wardBadge(ctx, 372, 99, state.warden.ward, time);

  text(ctx, 'NEXT MOVE  ·  TELEGRAPHED', 640, 18, 11, '#b8a3d8', 'center', '"Trebuchet MS", sans-serif', true);
  if (state.intent) drawIntentCard(ctx, state.intent, 565, 32, 150, 182, time);

  text(ctx, "WARDEN'S HAND", 805, 52, 11, '#7b6f9c', 'left', '"Trebuchet MS", sans-serif', true);
  state.wardenHand.forEach((c, i) => drawCardBack(ctx, 780 + i * 62, 66, 54, 78, i, 0.92));

  roundRect(ctx, 990, 22, 262, 192, 12);
  ctx.fillStyle = 'rgba(8,9,20,0.66)'; ctx.fill();
  ctx.strokeStyle = 'rgba(150,160,210,0.22)'; ctx.lineWidth = 1; ctx.stroke();
  text(ctx, 'FIELD NOTES', 1006, 40, 11, '#b9c4df', 'left', '"Trebuchet MS", sans-serif', true);
  state.log.slice(0, 4).forEach((line, i) => {
    ctx.save();
    ctx.globalAlpha = 1 - i * 0.18;
    text(ctx, '· ' + line, 1006, 62 + i * 37, 11, '#9aa6c2', 'left', '"Trebuchet MS", sans-serif');
    ctx.restore();
  });
}

function drawPlayerHUD(ctx, state, time) {
  drawSigil(ctx, 'gale', 46, 500, 14, 0.95);
  text(ctx, 'THE WEAVER', 68, 500, 16, '#b6f5d0', 'left', 'Georgia, serif', true);
  lifeBar(ctx, 40, 522, 210, 18, state.player.life, state.player.maxLife, '#43d98d', 'LIFE', time);
  wardBadge(ctx, 272, 531, state.player.ward, time);

  text(ctx, 'AETHER', 320, 484, 11, '#a8d8ff', 'left', '"Trebuchet MS", sans-serif', true);
  for (let i = 0; i < state.maxAether; i++) {
    const x = 385 + i * 30, y = 486;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(Math.PI / 4);
    const filled = i < state.aether;
    ctx.fillStyle = filled ? '#7fd8ff' : 'rgba(80,100,140,0.18)';
    ctx.strokeStyle = filled ? '#d8f4ff' : 'rgba(150,170,210,0.4)';
    ctx.lineWidth = 1.5;
    if (filled) { ctx.shadowColor = '#6fd0ff'; ctx.shadowBlur = 12; }
    ctx.fillRect(-8, -8, 16, 16); ctx.strokeRect(-8, -8, 16, 16);
    ctx.restore();
  }
  text(ctx, `${state.aether} / ${state.maxAether}`, 320, 503, 12, '#d8f4ff', 'left', '"Trebuchet MS", sans-serif', true);

  text(ctx, `DECK ${state.deck.length} · DISCARD ${state.discard.length}`, 1008, 486, 11, '#8e9ab8', 'center', '"Trebuchet MS", sans-serif');
  text(ctx, `TURN ${state.turn}`, 960, 477, 11, '#d6b97a', 'center', '"Trebuchet MS", sans-serif', true);
  text(ctx, `CHAIN ${state.chain.length}`, 960, 497, 11, '#8e9ab8', 'center', '"Trebuchet MS", sans-serif');

  const b = END_TURN_RECT;
  const hot = state.hover === 'end';
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  const bg = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
  bg.addColorStop(0, hot ? '#ffd98a' : '#d9ad5b');
  bg.addColorStop(1, hot ? '#c98e37' : '#8d6427');
  ctx.fillStyle = bg; ctx.fill();
  ctx.strokeStyle = hot ? '#fff4cf' : '#e7c887'; ctx.lineWidth = 1.5;
  ctx.shadowColor = '#e8b45c'; ctx.shadowBlur = hot ? 18 : 8; ctx.stroke(); ctx.shadowBlur = 0;
  text(ctx, 'END TURN', b.x + b.w / 2, b.y + 20, 16, '#231704', 'center', '"Trebuchet MS", sans-serif', true);
  text(ctx, 'SPACE / ENTER', b.x + b.w / 2, b.y + 39, 10, '#4a3410', 'center', '"Trebuchet MS", sans-serif', true);
}

function drawHand(ctx, state) {
  const L = layout(state);
  const order = L.cards.slice().sort((a, b) => (a.hovered ? 1 : 0) - (b.hovered ? 1 : 0));
  for (const c of order) {
    const card = c.slot.card;
    const playable = card.cost <= state.aether && state.screen === 'play';
    ctx.save();
    ctx.translate(c.x + c.w / 2, c.y + c.h);
    ctx.rotate(c.rot);
    ctx.translate(-c.w / 2, -c.h);
    if (c.hovered) { ctx.shadowColor = ELEMENTS[card.element].color; ctx.shadowBlur = 26; }
    drawCardFace(ctx, c.slot, 0, 0, c.w, c.h, { playable, resonance: false, alpha: playable ? 1 : 0.62 });
    ctx.restore();
  }
  if (state.hand.length === 0) text(ctx, 'HAND EMPTY — END TURN TO DRAW', 640, 600, 14, '#6f7893', 'center', '"Trebuchet MS", sans-serif');
}

function frameCorners(ctx, time) {
  ctx.save();
  ctx.strokeStyle = 'rgba(230,190,120,0.35)'; ctx.lineWidth = 2;
  const L = 26, s = 26;
  [[L, L, 1, 1], [WIDTH - L, L, -1, 1], [L, HEIGHT - L, 1, -1], [WIDTH - L, HEIGHT - L, -1, -1]].forEach(([x, y, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(x, y + dy * s); ctx.lineTo(x, y); ctx.lineTo(x + dx * s, y);
    ctx.stroke();
  });
  ctx.restore();
}

function drawTitle(ctx, state, time) {
  ctx.save();
  const g = ctx.createLinearGradient(0, 120, 0, 420);
  g.addColorStop(0, 'rgba(4,6,14,0.1)'); g.addColorStop(1, 'rgba(4,6,14,0.8)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Five sigils in an arc above the title.
  ELEMENT_ORDER.forEach((id, i) => {
    const a = Math.PI * (0.15 + 0.7 * i / 4);
    const x = 640 + Math.cos(a) * 300;
    const y = 210 - Math.sin(a) * 120 + Math.sin(time * 1.2 + i) * 5;
    const el = ELEMENTS[id];
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.arc(x, y, 34, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(8,10,22,0.75)'; ctx.fill();
    ctx.strokeStyle = el.color + '88'; ctx.lineWidth = 1.5; ctx.stroke();
    drawSigil(ctx, id, x, y, 18, 1);
    text(ctx, el.name.toUpperCase(), x, y + 50, 11, el.light, 'center', '"Trebuchet MS", sans-serif', true);
    ctx.restore();
  });

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 92px Georgia, serif';
  const tg = ctx.createLinearGradient(380, 0, 900, 0);
  tg.addColorStop(0, '#ff9a5c'); tg.addColorStop(0.35, '#ffe0a0');
  tg.addColorStop(0.65, '#9fd9ff'); tg.addColorStop(1, '#bf8bff');
  ctx.fillStyle = tg;
  ctx.shadowColor = '#8a5bd0'; ctx.shadowBlur = 34;
  ctx.fillText('EMBERWEAVE', 640, 330);
  ctx.shadowBlur = 0;
  text(ctx, 'T H E   L O O M   R E M E M B E R S   E V E R Y   T H R E A D', 640, 388, 14, '#b9a7d6', 'center', '"Trebuchet MS", sans-serif');

  roundRect(ctx, 390, 430, 500, 154, 16);
  ctx.fillStyle = 'rgba(8,10,22,0.8)'; ctx.fill();
  ctx.strokeStyle = 'rgba(220,180,120,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();
  text(ctx, 'THE WEAVER  vs  THE HOLLOW WARDEN', 640, 460, 16, '#f0dcb4', 'center', 'Georgia, serif', true);
  text(ctx, 'Both begin at 30 Life. Spend 3 Aether each turn.', 640, 493, 13, '#aab6d2', 'center', '"Trebuchet MS", sans-serif');
  text(ctx, 'Play matching elements in one turn to weave RESONANCE.', 640, 516, 13, '#aab6d2', 'center', '"Trebuchet MS", sans-serif');
  text(ctx, 'The Warden always shows its next move and its exact damage.', 640, 539, 13, '#aab6d2', 'center', '"Trebuchet MS", sans-serif');
  text(ctx, 'MOUSE: click cards / END TURN     KEYS: 1-5 play · SPACE end · R restart · M mute', 640, 564, 11, '#7986a5', 'center', '"Trebuchet MS", sans-serif');

  const pulse = 0.6 + 0.4 * Math.sin(time * 3);
  ctx.globalAlpha = pulse;
  text(ctx, '▶  CLICK OR PRESS ENTER TO BEGIN  ◀', 640, 638, 20, '#ffe1a0', 'center', 'Georgia, serif', true);
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawResult(ctx, state, time) {
  const win = state.screen === 'victory';
  ctx.save();
  ctx.fillStyle = win ? 'rgba(20,12,4,0.72)' : 'rgba(10,4,14,0.78)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const cx = 640, cy = 300;
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 18; i++) {
    const a = (Math.PI * 2 * i) / 18 + time * 0.06;
    ctx.strokeStyle = win ? 'rgba(255,190,110,0.045)' : 'rgba(190,100,255,0.05)';
    ctx.lineWidth = 11;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * 700, cy + Math.sin(a) * 700); ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 96px Georgia, serif';
  ctx.fillStyle = win ? '#ffd88a' : '#d79bff';
  ctx.shadowColor = win ? '#ff9d3d' : '#8a3fd0'; ctx.shadowBlur = 40;
  ctx.fillText(win ? 'VICTORY' : 'DEFEAT', cx, 250);
  ctx.shadowBlur = 0;
  text(ctx, win ? 'THE HOLLOW WARDEN IS UNWOVEN' : 'YOUR THREAD HAS RUN OUT', cx, 318, 16, win ? '#d9c2a0' : '#bca7d6', 'center', '"Trebuchet MS", sans-serif');

  roundRect(ctx, 435, 358, 410, 150, 14);
  ctx.fillStyle = 'rgba(6,8,16,0.82)'; ctx.fill();
  ctx.strokeStyle = win ? 'rgba(255,205,130,0.5)' : 'rgba(190,140,255,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
  const stats = [
    ['TURNS SURVIVED', String(state.turn)],
    ['CARDS PLAYED', String(state.stats.cardsPlayed)],
    ['DAMAGE DEALT', String(state.stats.damageDealt)],
    ['BEST RESONANCE', `+${state.stats.bestResonance}`],
  ];
  stats.forEach(([k, v], i) => {
    const x = i % 2 === 0 ? 545 : 735, y = 390 + Math.floor(i / 2) * 52;
    text(ctx, k, x, y, 11, '#8b96b3', 'center', '"Trebuchet MS", sans-serif', true);
    text(ctx, v, x, y + 22, 22, '#f3f1ff', 'center', 'Georgia, serif', true);
  });
  text(ctx, 'R  —  DUEL AGAIN        ESC  —  TITLE', cx, 558, 17, '#e7d5b0', 'center', '"Trebuchet MS", sans-serif', true);
  ctx.restore();
}

export function render(ctx, state, time = 0) {
  ctx.save();
  if (state.shake > 0.1) ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255,230,180,${state.flash * 0.12})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
  drawBackground(ctx, state, time);
  frameCorners(ctx, time);

  if (state.screen === 'title') {
    drawTitle(ctx, state, time);
  } else {
    drawLoom(ctx, state, time);
    drawWardenHUD(ctx, state, time);
    drawPlayerHUD(ctx, state, time);
    drawHand(ctx, state);
    if (state.screen === 'victory' || state.screen === 'defeat') drawResult(ctx, state, time);
  }
  ctx.restore();
}
