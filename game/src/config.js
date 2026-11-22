// EMBERWEAVE: constants, element identities, the card library and the deck recipe.
export const WIDTH = 1280;
export const HEIGHT = 720;
export const START_LIFE = 30;
export const AETHER_PER_TURN = 3;
export const HAND_SIZE = 5;
export const DECK_SIZE = 41;

export const ELEMENTS = {
  ember: { id: 'ember', name: 'Ember', color: '#ff7a45', light: '#ffd7a0', dark: '#5d1c0e', shape: 'flame', motif: 'Flame' },
  tide:  { id: 'tide',  name: 'Tide',  color: '#39a9f0', light: '#b4ecff', dark: '#0a2f50', shape: 'wave',  motif: 'Wave' },
  gale:  { id: 'gale',  name: 'Gale',  color: '#4ad693', light: '#caffdf', dark: '#0b4030', shape: 'spiral', motif: 'Spiral' },
  stone: { id: 'stone', name: 'Stone', color: '#e8c158', light: '#fff3bd', dark: '#4c3810', shape: 'hex',   motif: 'Hex' },
  void:  { id: 'void',  name: 'Void',  color: '#ac76ff', light: '#e8d0ff', dark: '#2e1550', shape: 'star',  motif: 'Star' },
};
export const ELEMENT_ORDER = ['ember', 'tide', 'gale', 'stone', 'void'];

// A card's effects are resolved by game.js. dmg and ward receive the Resonance bonus.
export const CARDS = [
  { id: 'ember_lash',    name: 'Ember Lash',    element: 'ember', cost: 1, dmg: 4,  kind: 'attack',   text: 'A lash of living flame.' },
  { id: 'tide_surge',    name: 'Tide Surge',    element: 'tide',  cost: 1, dmg: 4,  kind: 'attack',   text: 'A rising wall of water.' },
  { id: 'gale_slash',    name: 'Gale Slash',    element: 'gale',  cost: 1, dmg: 4,  kind: 'attack',   text: 'Cutting winds, swift and sure.' },
  { id: 'stone_fist',    name: 'Stone Fist',    element: 'stone', cost: 1, dmg: 4,  kind: 'attack',   text: 'A blow forged from the loom.' },
  { id: 'void_ray',      name: 'Void Ray',      element: 'void',  cost: 1, dmg: 4,  kind: 'attack',   text: 'Light bent into absence.' },
  { id: 'cinder_lance',  name: 'Cinder Lance',  element: 'ember', cost: 2, dmg: 7,  kind: 'attack',   text: 'A spear of hot cinders.' },
  { id: 'undertow',      name: 'Undertow',      element: 'tide',  cost: 2, dmg: 5, ward: 3, kind: 'attack', text: 'Drag them down; hold your ground.' },
  { id: 'tempest',       name: 'Tempest',       element: 'gale',  cost: 2, dmg: 6, draw: 1, kind: 'attack', text: 'The storm reveals a new thread.' },
  { id: 'boulder_fall',  name: 'Boulder Fall',  element: 'stone', cost: 2, dmg: 6, ward: 4, kind: 'attack', text: 'Gravity, made loyal.' },
  { id: 'void_rift',     name: 'Void Rift',     element: 'void',  cost: 2, dmg: 6, drain: 3, kind: 'attack', text: 'Their loss becomes your strength.' },
  { id: 'loom_weave',    name: 'Loom Weave',    element: 'gale',  cost: 1, draw: 2, kind: 'weave',   text: 'Draw two threads from the deck.' },
  { id: 'mending_thread',name: 'Mending Thread',element: 'tide',  cost: 1, heal: 5, ward: 2, kind: 'weave', text: 'Stitch your wounds closed.' },
  { id: 'aegis_sigil',   name: 'Aegis Sigil',   element: 'stone', cost: 1, ward: 7, kind: 'guard',   text: 'A shield of patient granite.' },
  { id: 'siphon',        name: 'Siphon',        element: 'void',  cost: 2, dmg: 5, drain: 5, kind: 'attack', text: 'Drink the light you steal.' },
  { id: 'quickening',    name: 'Quickening',    element: 'gale',  cost: 0, draw: 1, aether: 1, kind: 'weave', text: 'Draw one. Gain 1 Aether.' },
  { id: 'pyre_nova',     name: 'Pyre Nova',     element: 'ember', cost: 3, dmg: 12, kind: 'finisher', text: 'A dying star, briefly yours.' },
  { id: 'skyfall',       name: 'Skyfall',       element: 'gale',  cost: 3, dmg: 9, ward: 5, draw: 1, kind: 'finisher', text: 'The heavens answer the weave.' },
  { id: 'eclipse',       name: 'Eclipse',       element: 'void',  cost: 3, dmg: 13, heal: 5, kind: 'finisher', text: 'Even the Warden must blink.' },
  { id: 'ashen_veil',    name: 'Ashen Veil',    element: 'ember', cost: 1, dmg: 2, ward: 4, kind: 'guard', text: 'Hide inside the smoke.' },
  { id: 'ripple',        name: 'Ripple',        element: 'tide',  cost: 0, dmg: 2, draw: 1, kind: 'weave', text: 'A small wave with a long reach.' },
  { id: 'gravel_guard',  name: 'Gravel Guard',  element: 'stone', cost: 2, ward: 10, kind: 'guard', text: 'Let them break on you.' },
];

export const CARD_BY_ID = Object.fromEntries(CARDS.map(c => [c.id, c]));

// 41 cards drawn from all 21 unique cards.
export const DECK_RECIPE = {
  ember_lash: 4, tide_surge: 4, gale_slash: 4, stone_fist: 4, void_ray: 4,
  cinder_lance: 2, undertow: 2, tempest: 2, boulder_fall: 2, void_rift: 2,
  loom_weave: 1, mending_thread: 1, aegis_sigil: 1, siphon: 1, quickening: 1,
  pyre_nova: 1, skyfall: 1, eclipse: 1,
  ashen_veil: 1, ripple: 1, gravel_guard: 1,
};

export const FINISHER_IDS = ['pyre_nova', 'skyfall', 'eclipse'];
