// EMBERWEAVE rules engine: turns, Aether, Resonance, damage, ward, victory and defeat.
import { WIDTH, HEIGHT, START_LIFE, AETHER_PER_TURN, ELEMENTS, FINISHER_IDS } from './config.js';
import { makeRNG } from './rng.js';
import { createDeck, draw, fillHand, discardHand } from './deck.js';
import { planIntent, isFinisherIntent } from './ai.js';
import { emit, drainEvents, elementColor } from './animate.js';

export function createGame(seed = 1) {
  const state = {
    seed, rng: makeRNG(seed), screen: 'title', turn: 1,
    player: { life: START_LIFE, maxLife: START_LIFE, ward: 0 },
    warden: { life: START_LIFE, maxLife: START_LIFE, ward: 0 },
    aether: AETHER_PER_TURN, maxAether: AETHER_PER_TURN,
    deck: [], discard: [], hand: [],
    chain: [], lastCards: [], intent: null,
    wardenHand: [{ s: 0 }, { s: 1 }, { s: 2 }],
    log: [], events: [], floats: [], particles: [], motes: [], shake: 0,
    muted: false, hover: -1, cardAnim: new Map(),
    stats: { cardsPlayed: 0, damageDealt: 0, bestResonance: 0, finishers: 0 },
    aiOffset: 0, startedAt: Date.now(), flash: 0,
  };
  return state;
}

export function startDuel(state, seed = state.seed) {
  const fresh = createGame(seed);
  fresh.screen = 'play';
  fresh.seed = seed;
  fresh.aiOffset = (seed % 3);
  fresh.deck = createDeck(fresh.rng);
  Object.assign(state, fresh);
  fillHand(state);
  state.intent = planIntent(state);
  note(state, 'The loom awakens. The Hollow Warden shows its intent.');
  return state;
}

export function restart(state) { return startDuel(state, state.seed + 1); }
export function toTitle(state) { state.screen = 'title'; state.floats = []; state.particles = []; }

export function note(state, text) {
  state.log.unshift(text);
  if (state.log.length > 6) state.log.length = 6;
}

export function canPlay(state, index) {
  if (state.screen !== 'play') return { ok: false, reason: 'NOT IN DUEL' };
  const slot = state.hand[index];
  if (!slot) return { ok: false, reason: 'NO CARD' };
  if (slot.card.cost > state.aether) return { ok: false, reason: 'NEED AETHER' };
  return { ok: true, card: slot.card };
}

export function playCard(state, index) {
  const check = canPlay(state, index);
  if (!check.ok) {
    emit(state, { kind: 'text', target: 'hand', label: check.reason, color: '#ff8a6a', size: 20 });
    return check;
  }
  const slot = state.hand.splice(index, 1)[0];
  const card = slot.card;
  const el = ELEMENTS[card.element];
  state.aether -= card.cost;
  state.discard.push(slot);

  const prior = state.chain.filter(e => e === card.element).length;
  const resonance = prior * 2;
  state.chain.push(card.element);
  state.stats.cardsPlayed++;
  if (card.kind === 'finisher') state.stats.finishers++;
  state.stats.bestResonance = Math.max(state.stats.bestResonance, resonance);

  if (resonance > 0) {
    emit(state, { kind: 'resonance', target: 'loom', label: `${el.name.toUpperCase()} RESONANCE ×${prior + 1}  +${resonance}`, color: el.color });
    note(state, `${el.name} resonance! +${resonance} to damage and ward.`);
  }

  const dmg = (card.dmg || 0) + (card.dmg ? resonance : 0);
  const ward = (card.ward || 0) + (card.ward ? resonance : 0);
  const heal = card.heal || 0;
  const drain = card.drain || 0;

  if (ward) {
    state.player.ward += ward;
    emit(state, { kind: 'ward', target: 'player', value: ward, color: '#8fe3ff' });
  }
  if (dmg) {
    const absorbed = Math.min(state.warden.ward, dmg);
    state.warden.ward -= absorbed;
    const through = dmg - absorbed;
    state.warden.life = Math.max(0, state.warden.life - through);
    state.stats.damageDealt += through;
    if (absorbed) note(state, `${absorbed} damage caught by the Warden's ward.`);
    emit(state, { kind: 'damage', target: 'warden', value: through || absorbed, color: el.color });
    if (drain) {
      state.player.life = Math.min(state.player.maxLife, state.player.life + drain);
      emit(state, { kind: 'heal', target: 'player', value: drain, color: '#8affb4' });
    }
  }
  if (heal) {
    state.player.life = Math.min(state.player.maxLife, state.player.life + heal);
    emit(state, { kind: 'heal', target: 'player', value: heal, color: '#8affb4' });
  }
  if (card.aether) state.aether = Math.min(state.maxAether, state.aether + card.aether);
  if (card.draw) {
    const got = draw(state, card.draw);
    emit(state, { kind: 'draw', target: 'hand', value: got.length, color: '#c8d6ff' });
  }

  state.lastCards.unshift({ card, element: card.element, resonance, turn: state.turn });
  if (state.lastCards.length > 5) state.lastCards.length = 5;
  state.cardAnim.set(slot.uid, { t: 0 });
  note(state, `You played ${card.name}${resonance ? ` with +${resonance} resonance` : ''}.`);
  state.flash = 0.3;

  if (state.warden.life <= 0) {
    state.screen = 'victory';
    note(state, 'The Hollow Warden unravels. The loom is yours.');
    emit(state, { kind: 'text', target: 'warden', label: 'UNWOVEN', color: '#ffe7a0', size: 34 });
  }
  drainEvents(state);
  return { ok: true, card, resonance, dmg, ward };
}

export function endTurn(state) {
  if (state.screen !== 'play') return { ok: false, reason: 'NOT IN DUEL' };
  discardHand(state);
  const intent = state.intent;
  note(state, `The Warden uses ${intent.name}.`);

  if (intent.dmg) {
    const absorbed = Math.min(state.player.ward, intent.dmg);
    state.player.ward -= absorbed;
    const through = intent.dmg - absorbed;
    state.player.life = Math.max(0, state.player.life - through);
    emit(state, { kind: 'damage', target: 'player', value: through || absorbed, color: elementColor(intent.element) });
    if (absorbed) note(state, `Your ward absorbs ${absorbed}.`);
  }
  if (intent.ward) {
    state.warden.ward += intent.ward;
    emit(state, { kind: 'ward', target: 'warden', value: intent.ward, color: '#8fe3ff' });
  }
  if (intent.heal) {
    state.warden.life = Math.min(state.warden.maxLife, state.warden.life + intent.heal);
    emit(state, { kind: 'heal', target: 'warden', value: intent.heal, color: '#8affb4' });
  }
  if (intent.drain) {
    state.warden.life = Math.min(state.warden.maxLife, state.warden.life + intent.drain);
    emit(state, { kind: 'heal', target: 'warden', value: intent.drain, color: '#c79bff' });
  }

  drainEvents(state);

  if (state.player.life <= 0) {
    state.screen = 'defeat';
    note(state, isFinisherIntent(intent) ? 'The Hollow Verdict finds its mark.' : 'Your thread runs out.');
    return { ok: true, defeat: true };
  }

  state.turn++;
  state.chain = [];
  state.aether = state.maxAether;
  state.intent = planIntent(state);
  fillHand(state);
  note(state, `Turn ${state.turn}. ${state.aether} Aether. The next intent is revealed.`);
  return { ok: true, defeat: false };
}

export function tickGame(state, dt) {
  state.flash = Math.max(0, state.flash - dt);
  for (const [uid, a] of state.cardAnim) { a.t += dt; if (a.t > 0.6) state.cardAnim.delete(uid); }
}

export function statusLine(state) {
  if (state.screen === 'victory') return 'Victory. The Hollow Warden is unwoven.';
  if (state.screen === 'defeat') return 'Defeat. The Weaver has fallen.';
  if (state.screen === 'title') return 'Emberweave. A tactical elemental duel. Press Enter to begin.';
  const c = state.hand[state.hover];
  return c ? `${c.card.name}, ${c.card.cost} Aether. ${c.card.text}` :
    `Turn ${state.turn}. ${state.aether} Aether. Warden intent: ${state.intent.name}.`;
}
