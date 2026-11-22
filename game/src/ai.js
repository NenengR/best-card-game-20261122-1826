// The Hollow Warden's readable intent planner. Its next move is always shown face up,
// with the exact damage it will deal, before the Weaver acts.
import { FINISHER_IDS } from './config.js';

const PATTERNS = {
  rend:   { id: 'rend',   name: 'Rending Claw',    element: 'ember', dmg: 8, text: 'A clean, brutal strike.' },
  siphon: { id: 'siphon', name: 'Siphon Shroud',   element: 'void',  dmg: 6, drain: 6, text: 'It feeds on what it takes.' },
  guard:  { id: 'guard',  name: 'Hollow Bulwark',  element: 'stone', ward: 9, text: 'It withdraws into its shell.' },
  crush:  { id: 'crush',  name: 'Crushing Dread',  element: 'tide',  dmg: 11, text: 'The loom groans under weight.' },
  verdict:{ id: 'verdict',name: 'Hollow Verdict',  element: 'void',  dmg: 14, text: 'FINISHER — the killing word.' },
  shelter:{ id: 'shelter',name: 'Ashen Shelter',   element: 'ember', ward: 10, heal: 5, text: 'It mends its ragged weave.' },
};

const CYCLE = ['rend', 'siphon', 'guard', 'crush'];

export function planIntent(state) {
  const r = state.rng;
  const p = state.player.life;
  const w = state.warden.life;
  let key;

  // A wounded Warden protects itself; a nearly defeated Weaver faces a finisher.
  if (w <= 11 && (state.warden.ward || 0) < 5) key = 'shelter';
  else if (p <= 10 && state.turn >= 3 && r.chance(0.66)) key = 'verdict';
  else key = CYCLE[(state.turn - 1 + state.aiOffset) % CYCLE.length];

  const base = PATTERNS[key];
  const intent = { ...base, dmg: base.dmg || 0, ward: base.ward || 0, heal: base.heal || 0, drain: base.drain || 0 };
  // Small readable scaling as the duel deepens, always visible on the card.
  if (intent.dmg && state.turn >= 5) {
    intent.dmg += 1 + (state.turn >= 8 ? 1 : 0);
    intent.name = intent.name.replace('Rending', 'Savage').replace('Crushing', 'Relentless');
  }
  return intent;
}

export function describeIntent(intent) {
  const bits = [];
  if (intent.dmg) bits.push(`${intent.dmg} DMG`);
  if (intent.ward) bits.push(`${intent.ward} WARD`);
  if (intent.heal) bits.push(`HEAL ${intent.heal}`);
  if (intent.drain) bits.push(`DRAIN ${intent.drain}`);
  return bits.join(' · ') || 'NO EFFECT';
}

export function isFinisherIntent(intent) { return intent.id === 'verdict'; }

export function wardenFinisherReady(state) {
  return FINISHER_IDS.length > 0 && state.warden.life > 0;
}
