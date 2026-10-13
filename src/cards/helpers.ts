import {
  ACTION_CARD_COUNT,
  ActionKinds,
  CardColorList,
  NUMBER_CARD_COUNT,
  NumberCards,
  WILD_CARD_COUNT,
  WildKinds,
  toTitleCase,
  type ActionCardName,
  type ActionCardType,
  type ActionKind,
  type Card,
  type CardColors,
  type CardName,
  type NumberCardName,
  type NumberCardType,
  type NumberValue,
  type WildCardName,
  type WildCardType,
  type WildKind,
} from "./types";

/** Folder the SVGs are served from, e.g. public/cards/Blue_Skip.svg */
export const CARD_IMAGE_BASE = "/cards";

/* -------------------------------------------------------------------------- */
/* Images                                                                      */
/* -------------------------------------------------------------------------- */

/** "blue_double_skip" -> "Blue_Double_Skip.svg", "wild_double_or_nothing" -> "Wild_Double_or_Nothing.svg" */
export function toCardFileName(name: CardName): string {
  return `${toTitleCase(name).replace(/ /g, "_")}.svg`;
}

/** "Blue_Double_Skip.svg" -> "Blue" (the first part of the file name is the color folder, or "Wild") */
export function toCardFolder(name: CardName): string {
  const file = toCardFileName(name);
  return file.slice(0, file.indexOf("_"));
}

export function getCardImage(name: CardName): string {
  return `${CARD_IMAGE_BASE}/${toCardFolder(name)}/${toCardFileName(name)}`;
}

/* -------------------------------------------------------------------------- */
/* Descriptions                                                                */
/* -------------------------------------------------------------------------- */

const NUMBER_DESCRIPTIONS: Record<NumberValue, string> = {
  0: "Play on a matching color or a 0. Everyone passes their hand to the next player.",
  1: "Play on a matching color or a 1.",
  2: "Play on a matching color or a 2.",
  3: "Play on a matching color or a 3.",
  4: "Play on a matching color or a 4.",
  5: "Play on a matching color or a 5.",
  6: "Play on a matching color or a 6.",
  7: "Play on a matching color or a 7. Swap hands with a player of your choice.",
  8: "Play on a matching color or an 8.",
  9: "Play on a matching color or a 9.",
};

// DRAFT: the rules for double_skip, color_pull, trade_one, number_dump and
// lucky_flip are guessed from the names/icons. Replace with the real rules.
const ACTION_DESCRIPTIONS: Record<ActionKind, string> = {
  skip: "The next player loses their turn.",
  skip_all: "Every other player is skipped, so you play again.",
  reverse: "Reverse the direction of play.",
  draw_2: "The next player draws 2 cards and loses their turn.",
  draw_3: "The next player draws 3 cards and loses their turn.",
  draw_4: "The next player draws 4 cards and loses their turn.",
  reverse_draw_2: "Reverse the direction of play. The next player draws 2 cards.",
  discard_all: "Discard every card of this color from your hand.",
  double_skip: "The next two players lose their turn.",
  color_pull: "Pull a card of this color from another player's hand.",
  trade_one: "Trade one card from your hand with a player of your choice.",
  number_dump: "Discard every number card of this color from your hand.",
  lucky_flip: "Flip the top card of the draw pile and let luck decide.",
  roulette: "The next player draws until they match a color chosen by the active roulette effect.",
};

// DRAFT: only the first four are the standard No Mercy wilds. The rest are
// custom, so their descriptions are guesses from the names. Replace with the real rules.
const WILD_DESCRIPTIONS: Record<WildKind, string> = {
  reverse_draw_4: "Choose a color and reverse direction. The next player draws 4 cards.",
  draw_6: "Choose a color. The next player draws 6 cards.",
  draw_10: "Choose a color. The next player draws 10 cards.",
  color_roulette:
    "Choose a color. The next player flips cards from the draw pile until that color appears, and keeps them all.",
  random_player_color_roulette:
    "Choose a color. A random player flips cards until that color appears, and keeps them all.",
  random_swapper: "Choose a color. Two random players swap hands.",
  draw_target: "Choose a color and a player. That player draws cards.",
  draw_everyone: "Choose a color. Every other player draws a card.",
  gift: "Choose a color, then give a card from your hand to any player.",
  pickpocket: "Choose a color, then steal a random card from a player of your choice.",
  reflect: "Choose a color. Bounces the next draw penalty back at whoever played it.",
  lifeline: "Choose a color. Saves you from elimination once.",
  spyglass: "Choose a color, then look at another player's hand.",
  hand_shuffle: "Choose a color. Every hand is collected, shuffled and dealt back out.",
  color_ban: "Choose a color to play, and ban another color for a round.",
  number_roulette: "Choose a color. A random number is picked and the next player must answer it.",
  dice_draw: "Choose a color and roll a die. The next player draws that many cards.",
  double_or_nothing:
    "Choose a color. The next player either takes a double penalty or nothing at all.",
};

/* -------------------------------------------------------------------------- */
/* Card factories                                                              */
/* -------------------------------------------------------------------------- */

/** `copy` is 1-based and keeps ids unique when a card appears more than once. */
export function createNumberCard(
  color: CardColors,
  value: NumberValue,
  copy: number,
): NumberCardType {
  const name: NumberCardName = `${color}_${value}`;
  return {
    kind: "number",
    id: `${name}_${copy}`,
    displayName: toTitleCase(name),
    name,
    color,
    value,
    image: getCardImage(name),
    description: NUMBER_DESCRIPTIONS[value],
  };
}

export function createActionCard(
  color: CardColors,
  power: ActionKind,
  copy: number,
): ActionCardType {
  const name: ActionCardName = `${color}_${power}`;
  return {
    kind: "action",
    id: `${name}_${copy}`,
    displayName: toTitleCase(name),
    name,
    power,
    color,
    image: getCardImage(name),
    description: ACTION_DESCRIPTIONS[power],
  };
}

export function createWildCard(power: WildKind, copy: number): WildCardType {
  const name: WildCardName = `wild_${power}`;
  return {
    kind: "wild",
    id: `${name}_${copy}`,
    displayName: toTitleCase(name),
    name,
    power,
    selectedColor: null,
    image: getCardImage(name),
    description: WILD_DESCRIPTIONS[power],
  };
}

/* -------------------------------------------------------------------------- */
/* Deck                                                                        */
/* -------------------------------------------------------------------------- */

/** Builds the full, unshuffled deck from the *_CARD_COUNT tables in cards.types.ts. */
export function generateDeck(): Card[] {
  const deck: Card[] = [];

  for (const color of CardColorList) {
    for (const value of NumberCards) {
      for (let copy = 1; copy <= NUMBER_CARD_COUNT[value]; copy++) {
        deck.push(createNumberCard(color, value, copy));
      }
    }
    for (const power of ActionKinds) {
      for (let copy = 1; copy <= ACTION_CARD_COUNT[power]; copy++) {
        deck.push(createActionCard(color, power, copy));
      }
    }
  }

  for (const power of WildKinds) {
    for (let copy = 1; copy <= WILD_CARD_COUNT[power]; copy++) {
      deck.push(createWildCard(power, copy));
    }
  }

  return deck;
}
