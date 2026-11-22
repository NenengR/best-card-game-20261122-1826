// All vector illustration for EMBERWEAVE: element sigils, card faces and card backs.
// No images, no fonts and no network calls: every shape is drawn with canvas paths.
import { ELEMENTS } from './config.js';

export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function polygon(ctx, x, y, r, sides, rotation = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = rotation + (Math.PI * 2 * i) / sides;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export function star(ctx, x, y, outer, inner, points = 5, rotation = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rotation + (Math.PI * i) / points;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

// A distinct silhouette AND colour per suit, so the element reads at a glance.
export function drawSigil(ctx, id, x, y, r, alpha = 1) {
  const el = ELEMENTS[id];
  if (!el) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.shadowColor = el.color;
  ctx.shadowBlur = r * 0.6;

  if (el.shape === 'flame') {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.bezierCurveTo(x + r * 0.95, y - r * 0.2, x + r * 0.8, y + r * 0.85, x, y + r);
    ctx.bezierCurveTo(x - r * 0.8, y + r * 0.85, x - r * 0.95, y - r * 0.2, x, y - r);
    ctx.fillStyle = el.color; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y - r * 0.35);
    ctx.bezierCurveTo(x + r * 0.48, y + r * 0.1, x + r * 0.35, y + r * 0.7, x, y + r * 0.72);
    ctx.bezierCurveTo(x - r * 0.35, y + r * 0.7, x - r * 0.48, y + r * 0.1, x, y - r * 0.35);
    ctx.fillStyle = el.light; ctx.fill();
  } else if (el.shape === 'wave') {
    for (let i = -1; i <= 1; i++) {
      const yy = y + i * r * 0.5;
      ctx.beginPath();
      ctx.moveTo(x - r, yy);
      ctx.bezierCurveTo(x - r * 0.5, yy - r * 0.55, x - r * 0.15, yy + r * 0.55, x + r * 0.25, yy);
      ctx.bezierCurveTo(x + r * 0.6, yy - r * 0.45, x + r * 0.8, yy + r * 0.2, x + r, yy - r * 0.1);
      ctx.strokeStyle = i === 0 ? el.light : el.color;
      ctx.lineWidth = r * (i === 0 ? 0.28 : 0.18);
      ctx.stroke();
    }
  } else if (el.shape === 'spiral') {
    ctx.beginPath();
    for (let i = 0; i <= 90; i++) {
      const t = i / 90;
      const a = t * Math.PI * 3.6;
      const rr = r * (0.08 + 0.9 * t);
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = el.light; ctx.lineWidth = r * 0.24; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r * 1.02, -0.4, 2.1);
    ctx.strokeStyle = el.color; ctx.lineWidth = r * 0.12; ctx.stroke();
  } else if (el.shape === 'hex') {
    polygon(ctx, x, y, r, 6);
    ctx.fillStyle = el.color; ctx.fill();
    ctx.shadowBlur = 0;
    polygon(ctx, x, y, r * 0.58, 6);
    ctx.strokeStyle = el.dark; ctx.lineWidth = r * 0.16; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - r * 0.62, y); ctx.lineTo(x + r * 0.62, y);
    ctx.moveTo(x, y - r * 0.62); ctx.lineTo(x, y + r * 0.62);
    ctx.strokeStyle = el.light; ctx.lineWidth = r * 0.1; ctx.stroke();
  } else if (el.shape === 'star') {
    star(ctx, x, y, r, r * 0.42, 5);
    ctx.fillStyle = el.color; ctx.fill();
    ctx.shadowBlur = 0;
    star(ctx, x, y, r * 0.52, r * 0.2, 5);
    ctx.fillStyle = el.dark; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r * 0.14, 0, Math.PI * 2);
    ctx.fillStyle = el.light; ctx.fill();
  }
  ctx.restore();
}

export function drawCardBack(ctx, x, y, w, h, index = 0, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  roundRect(ctx, x, y, w, h, 10);
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, '#1a1430'); g.addColorStop(0.5, '#0e1024'); g.addColorStop(1, '#241536');
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = '#6d5594'; ctx.lineWidth = 1.6; ctx.stroke();
  roundRect(ctx, x + 5, y + 5, w - 10, h - 10, 7);
  ctx.strokeStyle = 'rgba(190,160,255,0.25)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(index * 0.4);
  star(ctx, 0, 0, Math.min(w, h) * 0.28, Math.min(w, h) * 0.11, 8);
  ctx.strokeStyle = 'rgba(190,150,255,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();
  drawSigil(ctx, 'void', x + w / 2, y + h / 2, Math.min(w, h) * 0.13, 0.8);
  ctx.restore();
}

// The face of a playable card: cost gem, sigil illustration, name, value and rules text.
export function drawCardFace(ctx, slot, x, y, w, h, opts = {}) {
  const card = slot.card;
  const el = ELEMENTS[card.element];
  const { playable = true, resonance = false, alpha = 1, mini = false } = opts;
  ctx.save();
  ctx.globalAlpha *= alpha;

  if (!playable) { ctx.shadowColor = '#000'; ctx.shadowBlur = 8; }

  roundRect(ctx, x, y, w, h, 11);
  const bg = ctx.createLinearGradient(x, y, x + w * 0.3, y + h);
  bg.addColorStop(0, el.dark);
  bg.addColorStop(0.45, '#0c0d1c');
  bg.addColorStop(1, '#05070f');
  ctx.fillStyle = bg; ctx.fill();
  ctx.save(); ctx.clip();
  // Woven threads inside the card.
  ctx.globalAlpha *= 0.12;
  ctx.strokeStyle = el.light; ctx.lineWidth = 1;
  for (let i = -h; i < w + h; i += 13) {
    ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i + h, y + h); ctx.stroke();
  }
  ctx.restore();

  roundRect(ctx, x, y, w, h, 11);
  ctx.strokeStyle = playable ? el.color : '#44485c';
  ctx.lineWidth = resonance ? 2.6 : 1.7;
  ctx.shadowBlur = resonance ? 18 : (playable ? 8 : 0);
  ctx.shadowColor = el.color;
  ctx.stroke();
  ctx.shadowBlur = 0;

  const cx = x + w / 2;
  // Cost gem.
  const gemR = mini ? 10 : 14;
  ctx.beginPath();
  ctx.moveTo(x + gemR + 5, y + 4);
  ctx.lineTo(x + gemR * 2 + 5, y + 4 + gemR);
  ctx.lineTo(x + gemR + 5, y + 4 + gemR * 2);
  ctx.lineTo(x + 5, y + 4 + gemR);
  ctx.closePath();
  ctx.fillStyle = '#121a33'; ctx.fill();
  ctx.strokeStyle = '#8ad7ff'; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.fillStyle = '#d8f3ff';
  ctx.font = `bold ${mini ? 12 : 16}px Georgia, serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(String(card.cost), x + gemR + 5, y + 4 + gemR + 0.5);

  // Illustration chamber.
  const artY = y + h * 0.14, artH = h * 0.47;
  roundRect(ctx, x + 8, artY, w - 16, artH, 7);
  const ag = ctx.createRadialGradient(cx, artY + artH / 2, 2, cx, artY + artH / 2, w * 0.6);
  ag.addColorStop(0, el.color + '55'); ag.addColorStop(1, 'rgba(5,7,15,0)');
  ctx.fillStyle = ag; ctx.fill();
  drawSigil(ctx, card.element, cx, artY + artH / 2, mini ? artH * 0.32 : artH * 0.38, playable ? 1 : 0.45);

  if (card.kind === 'finisher') {
    ctx.fillStyle = '#ffe7a0'; ctx.font = `bold ${mini ? 8 : 10}px Georgia, serif`;
    ctx.fillText('✦ FINISHER ✦', cx, artY + artH - 6);
  }

  // Name plate.
  const plateY = artY + artH + 2;
  roundRect(ctx, x + 6, plateY, w - 12, mini ? 16 : 22, 4);
  ctx.fillStyle = 'rgba(6,9,18,0.88)'; ctx.fill();
  ctx.strokeStyle = el.color + '99'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = playable ? el.light : '#8b90a4';
  ctx.font = `bold ${mini ? 9 : 13}px Georgia, serif`;
  ctx.fillText(card.name.toUpperCase(), cx, plateY + (mini ? 8 : 11));

  if (!mini) {
    // Effect value badge + rules text.
    ctx.fillStyle = '#f4f7ff';
    ctx.font = 'bold 14px "Trebuchet MS", sans-serif';
    const parts = [];
    if (card.dmg) parts.push(`${card.dmg} DMG`);
    if (card.ward) parts.push(`${card.ward} WARD`);
    if (card.heal) parts.push(`HEAL ${card.heal}`);
    if (card.drain) parts.push(`DRAIN ${card.drain}`);
    if (card.draw) parts.push(`DRAW ${card.draw}`);
    if (card.aether) parts.push('+1 AETHER');
    ctx.fillText(parts.join('  '), cx, y + h - 48);
    ctx.fillStyle = '#9aa4bd';
    ctx.font = '11px "Trebuchet MS", sans-serif';
    const words = card.text.split(' ');
    let line = '', lines = [];
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > w - 22 && line) { lines.push(line); line = word; }
      else line = test;
    }
    if (line) lines.push(line);
    lines.slice(0, 2).forEach((ln, i) => ctx.fillText(ln, cx, y + h - 29 + i * 13));
  }
  ctx.restore();
}

export function drawIntentCard(ctx, intent, x, y, w, h, time = 0) {
  const el = ELEMENTS[intent.element];
  ctx.save();
  roundRect(ctx, x, y, w, h, 12);
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, el.dark); g.addColorStop(0.6, '#0a0b17'); g.addColorStop(1, '#05060d');
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = el.color; ctx.lineWidth = 2.2;
  ctx.shadowColor = el.color; ctx.shadowBlur = 14 + Math.sin(time * 3) * 4; ctx.stroke();
  ctx.shadowBlur = 0;
  drawSigil(ctx, intent.element, x + w / 2, y + h * 0.34, h * 0.16, 0.95);
  ctx.fillStyle = '#f6e9ff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 13px Georgia, serif';
  const words = intent.name.toUpperCase().split(' ');
  words.forEach((word, i) => ctx.fillText(word, x + w / 2, y + h * 0.6 + i * 14));
  if (intent.dmg) {
    roundRect(ctx, x + w / 2 - 34, y + h - 42, 68, 28, 8);
    ctx.fillStyle = '#c2322b'; ctx.fill();
    ctx.strokeStyle = '#ffb3a0'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#fff5ec'; ctx.font = 'bold 17px "Trebuchet MS", sans-serif';
    ctx.fillText(`${intent.dmg} DMG`, x + w / 2, y + h - 27);
  } else {
    ctx.fillStyle = '#bfe9ff'; ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    ctx.fillText(`${intent.ward || 0} WARD`, x + w / 2, y + h - 27);
  }
  ctx.restore();
}
