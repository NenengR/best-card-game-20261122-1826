// Deck construction, drawing and recycling of the discard pile.
import { DECK_RECIPE, CARD_BY_ID, DECK_SIZE, HAND_SIZE } from './config.js';
import { shuffle } from './rng.js';

let uidCounter = 0;

export function createDeck(rng) {
  const list = [];
  for (const [id, count] of Object.entries(DECK_RECIPE)) {
    for (let i = 0; i < count; i++) list.push({ uid: `c${++uidCounter}`, id, card: CARD_BY_ID[id] });
  }
  if (list.length !== DECK_SIZE) throw new Error('deck recipe does not total DECK_SIZE');
  return shuffle(list, rng);
}

export function recycle(state) {
  if (state.deck.length === 0 && state.discard.length > 0) {
    state.deck = shuffle(state.discard, state.rng);
    state.discard = [];
    state.log.unshift('The discard pile is rewoven into the deck.');
  }
}

export function draw(state, count) {
  const drawn = [];
  for (let i = 0; i < count; i++) {
    recycle(state);
    const card = state.deck.pop();
    if (!card) break;
    state.hand.push(card);
    drawn.push(card);
  }
  return drawn;
}

export function fillHand(state) {
  const need = Math.max(0, HAND_SIZE - state.hand.length);
  return draw(state, need);
}

export function discardHand(state) {
  while (state.hand.length) state.discard.push(state.hand.shift());
}
