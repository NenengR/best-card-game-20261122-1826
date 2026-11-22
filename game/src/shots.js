// Deterministic scenes for ?shot=... screenshots. Every value is fixed, so the same
// seed and scene always render exactly the same frame.
import { CARD_BY_ID, FINISHER_IDS } from './config.js';
import { startDuel, toTitle } from './game.js';
import { emit, burst } from './animate.js';

let shotUid = 0;
function slot(id) { return { uid: `shot${++shotUid}`, id, card: CARD_BY_ID[id] }; }

export function applyShot(state, name, seed = 1) {
  shotUid = 0;
  startDuel(state, seed);
  state.shotMode = true;
  state.hover = 2;

  if (name === 'title' || name === 'start') {
    toTitle(state);
    state.shotMode = true;
    return state;
  }

  if (name === 'play') {
    state.player.life = 21;
    state.player.ward = 4;
    state.warden.life = 18;
    state.warden.ward = 3;
    state.aether = 2;
    state.turn = 4;
    state.chain = ['ember', 'ember'];
    state.intent = {
      id: 'rend', name: 'Rending Claw', element: 'ember',
      dmg: 8, ward: 0, heal: 0, drain: 0, text: 'A clean, brutal strike.',
    };
    state.hand = [
      slot('ember_lash'), slot('pyre_nova'), slot('undertow'),
      slot('aegis_sigil'), slot('void_rift'),
    ];
    state.lastCards = [
      { card: CARD_BY_ID.ember_lash, element: 'ember', resonance: 0, turn: 4 },
      { card: CARD_BY_ID.cinder_lance, element: 'ember', resonance: 2, turn: 4 },
      { card: CARD_BY_ID.tide_surge, element: 'tide', resonance: 0, turn: 3 },
    ];
    state.log = [
      'Ember resonance! +2 to damage and ward.',
      'The Warden uses Siphon Shroud.',
      'You played Cinder Lance with +2 resonance.',
      'Turn 4. 3 Aether. The next intent is revealed.',
    ];
    burst(state, 640, 352, '#ffb46b', 16, 110);
  } else if (name === 'win') {
    state.screen = 'victory';
    state.player.life = 14;
    state.player.ward = 6;
    state.warden.life = 0;
    state.warden.ward = 0;
    state.turn = 7;
    state.aether = 1;
    state.intent = {
      id: 'verdict', name: 'Hollow Verdict', element: 'void',
      dmg: 13, ward: 0, heal: 0, drain: 0, text: 'FINISHER — the killing word.',
    };
    state.hand = [slot('gale_slash'), slot('ripple'), slot('mending_thread')];
    state.lastCards = [
      { card: CARD_BY_ID.pyre_nova, element: 'ember', resonance: 4, turn: 7 },
      { card: CARD_BY_ID.cinder_lance, element: 'ember', resonance: 2, turn: 7 },
      { card: CARD_BY_ID.ember_lash, element: 'ember', resonance: 0, turn: 7 },
    ];
    state.chain = ['ember', 'ember', 'ember'];
    state.stats = { cardsPlayed: 19, damageDealt: 38, bestResonance: 4, finishers: 1 };
    burst(state, 640, 268, '#ffd88a', 46, 280);
  } else if (name === 'loss') {
    state.screen = 'defeat';
    state.player.life = 0;
    state.player.ward = 0;
    state.warden.life = 16;
    state.warden.ward = 5;
    state.turn = 6;
    state.aether = 0;
    state.intent = {
      id: 'verdict', name: 'Hollow Verdict', element: 'void',
      dmg: 13, ward: 0, heal: 0, drain: 0, text: 'FINISHER — the killing word.',
    };
    state.hand = [slot('stone_fist'), slot('loom_weave'), slot('ashen_veil')];
    state.lastCards = [
      { card: CARD_BY_ID.void_ray, element: 'void', resonance: 0, turn: 6 },
      { card: CARD_BY_ID.tide_surge, element: 'tide', resonance: 0, turn: 5 },
      { card: CARD_BY_ID.aegis_sigil, element: 'stone', resonance: 0, turn: 5 },
    ];
    state.chain = [];
    state.log = [
      'The Hollow Verdict finds its mark.',
      'The Warden uses Hollow Verdict.',
      'Your ward absorbs 0.',
      'Turn 6. 3 Aether. The next intent is revealed.',
    ];
    state.stats = { cardsPlayed: 14, damageDealt: 19, bestResonance: 2, finishers: 0 };
    burst(state, 640, 566, '#b478ff', 34, 210);
  }
  return state;
}
