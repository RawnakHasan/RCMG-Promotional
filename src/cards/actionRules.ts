import { CustomActionKinds, StandardActionKinds, type ActionKind } from "@/cards/types";

/** The six standard colored actions. */
type StandardActionKind = (typeof StandardActionKinds)[number];

/** The seven colored actions new to this deck ("roulette" has no rules yet). */
type NewActionKind = Exclude<(typeof CustomActionKinds)[number], "roulette">;

export const STANDARD_ORDER: StandardActionKind[] = [
  "skip",
  "skip_all",
  "reverse",
  "draw_2",
  "draw_4",
  "discard_all",
];

export const NEW_ORDER: NewActionKind[] = [
  "reverse_draw_2",
  "draw_3",
  "double_skip",
  "color_pull",
  "trade_one",
  "number_dump",
  "lucky_flip",
];

export const ACTION_POINTS = 20;

export const STANDARD_RULES: Record<StandardActionKind, { text: string; stackable: boolean }> = {
  skip: { text: "The next player loses their turn.", stackable: false },
  skip_all: { text: "Every other player loses a turn, and you play again.", stackable: false },
  reverse: { text: "Reverse the direction of play.", stackable: false },
  draw_2: { text: "The next player draws 2.", stackable: true },
  draw_4: { text: "The next player draws 4.", stackable: true },
  discard_all: {
    text: "Discard every card of this card's color from your hand.",
    stackable: false,
  },
};

export const NEW_RULES: Record<NewActionKind, { text: string; stackable: boolean }> = {
  reverse_draw_2: {
    text: "Reverse direction. The next player in the new direction draws 2.",
    stackable: true,
  },
  draw_3: { text: "Next player draws 3.", stackable: true },
  double_skip: { text: "Skip the next two players.", stackable: false },
  color_pull: {
    text: "Every other player gives you 1 card of this color. Players with none draw 1.",
    stackable: false,
  },
  trade_one: {
    text: "Swap 1 card from your hand with 1 random card from any player.",
    stackable: false,
  },
  number_dump: {
    text: "Name a number. Discard all cards of that number from your hand.",
    stackable: false,
  },
  lucky_flip: {
    text: "Flip the top card of the draw pile. If it matches this card's color, the next player draws 4. Otherwise they draw 1. Put the flipped card at the bottom of the pile.",
    stackable: false,
  },
};

export { NEW_ORDER as NEW_ACTION_ORDER, NEW_RULES as NEW_ACTION_RULES };
export type ActionRuleKind = StandardActionKind | NewActionKind;

export const ACTION_RULES = { ...STANDARD_RULES, ...NEW_RULES } as Record<
  ActionKind,
  { text: string; stackable: boolean }
>;
