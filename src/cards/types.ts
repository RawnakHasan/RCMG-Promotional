export const NumberCards = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export const CardColorList = ["red", "blue", "green", "yellow"] as const;
export const CustomActionKinds = [
  "reverse_draw_2",
  "draw_3",
  "double_skip",
  "color_pull",
  "trade_one",
  "number_dump",
  "lucky_flip",
  "roulette",
] as const;
export const StandardActionKinds = [
  "skip",
  "skip_all",
  "reverse",
  "draw_2",
  "draw_4",
  "discard_all",
] as const;
export const StandardWildKinds = ["reverse_draw_4", "draw_6", "draw_10", "color_roulette"] as const;
export const CustomWildKinds = [
  "random_player_color_roulette",
  "random_swapper",
  "draw_target",
  "draw_everyone",
  "gift",
  "pickpocket",
  "reflect",
  "lifeline",
  "spyglass",
  "hand_shuffle",
  "color_ban",
  "number_roulette",
  "dice_draw",
  "double_or_nothing",
] as const;

export const ActionKinds = [...StandardActionKinds, ...CustomActionKinds] as const;
export const WildKinds = [...StandardWildKinds, ...CustomWildKinds] as const;

export const MinorWords = ["or", "of", "the", "a", "to"] as const;

export type NumberValue = (typeof NumberCards)[number];
export type CardColors = (typeof CardColorList)[number];
export type WildCardColors = "wild";
export type ActionKind = (typeof ActionKinds)[number];
export type WildKind = (typeof WildKinds)[number];
type MinorWord = (typeof MinorWords)[number];

type Word<W extends string> = W extends MinorWord ? W : Capitalize<W>;
type Rest<S extends string> = S extends `${infer Head}_${infer Tail}`
  ? `${Word<Head>} ${Rest<Tail>}`
  : Word<S>;

export type TitleCase<S extends string> = S extends `${infer Head}_${infer Tail}`
  ? `${Capitalize<Head>} ${Rest<Tail>}`
  : Capitalize<S>;

export type NumberCardName = `${CardColors}_${NumberValue}`;
export type NumberCardDisplayName = TitleCase<NumberCardName>;

export type ActionCardName = `${CardColors}_${ActionKind}`;
export type ActionCardDisplayName = TitleCase<ActionCardName>;

export type WildCardName = `${WildCardColors}_${WildKind}`;
export type WildCardDisplayName = TitleCase<WildCardName>;

export type NumberCardType = {
  kind: "number";
  id: string;
  displayName: NumberCardDisplayName;
  name: NumberCardName;
  value: NumberValue;
  color: CardColors;
  image: string;
  description: string;
};

export type ActionCardType = {
  kind: "action";
  id: string;
  displayName: ActionCardDisplayName;
  name: ActionCardName;
  power: ActionKind;
  color: CardColors;
  image: string;
  description: string;
};

export type WildCardType = {
  kind: "wild";
  id: string;
  displayName: WildCardDisplayName;
  name: WildCardName;
  power: WildKind;
  selectedColor: CardColors | null;
  image: string;
  description: string;
};

export type Card = NumberCardType | ActionCardType | WildCardType;

export type CardKind = Card["kind"];
export type CardName = Card["name"];
export type CardDisplayName = Card["displayName"];

/**
 * Card counts.
 *
 * Number and action counts are copies PER COLOUR (each of the four colours
 * gets this many). Wild counts are copies in the whole deck.
 * Typed as Records so adding a new kind above forces you to give it a count.
 */
export const NUMBER_CARD_COUNT: Record<NumberValue, number> = {
  0: 2,
  1: 2,
  2: 2,
  3: 2,
  4: 2,
  5: 2,
  6: 2,
  7: 2,
  8: 2,
  9: 2,
};

export const ACTION_CARD_COUNT: Record<ActionKind, number> = {
  skip: 2,
  skip_all: 2,
  reverse: 2,
  draw_2: 2,
  draw_3: 2,
  draw_4: 2,
  reverse_draw_2: 2,
  discard_all: 2,
  double_skip: 2,
  color_pull: 2,
  trade_one: 2,
  number_dump: 2,
  lucky_flip: 2,
  roulette: 2,
};

export const WILD_CARD_COUNT: Record<WildKind, number> = {
  // standard No Mercy wilds
  reverse_draw_4: 8,
  draw_6: 8,
  draw_10: 8,
  color_roulette: 8,
  // custom wilds
  random_player_color_roulette: 4,
  random_swapper: 4,
  draw_target: 4,
  draw_everyone: 4,
  gift: 4,
  pickpocket: 4,
  reflect: 4,
  lifeline: 4,
  spyglass: 4,
  hand_shuffle: 4,
  color_ban: 4,
  number_roulette: 4,
  dice_draw: 4,
  double_or_nothing: 4,
};

const sum = (counts: Record<string, number>): number =>
  Object.values(counts).reduce((total, n) => total + n, 0);

/** Number + action cards in a single colour (20 + 26 = 46 with the defaults). */
export const CARDS_PER_COLOR = sum(NUMBER_CARD_COUNT) + sum(ACTION_CARD_COUNT);
/** All wild cards in the deck (18 kinds x 2 = 36 with the defaults). */
export const WILD_CARD_TOTAL = sum(WILD_CARD_COUNT);
/** Whole deck (46 x 4 + 36 = 220 with the defaults). */
export const DECK_SIZE = CARDS_PER_COLOR * CardColorList.length + WILD_CARD_TOTAL;

export function toTitleCase<S extends string>(name: S): TitleCase<S> {
  return name
    .split("_")
    .map((word, i) =>
      i > 0 && (MinorWords as readonly string[]).includes(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ") as TitleCase<S>;
}

// Game rule, not card data
export const MERCY_LIMIT = 25;
