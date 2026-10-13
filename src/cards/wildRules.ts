import { StandardWildKinds, WildKinds, type WildKind } from "@/cards/types";

export type WildGroup = "Draw" | "Hands" | "Roulette" | "Defense";
export type StackRule = "yes" | "no" | "counter" | "out-of-turn";

export const FILTERS = ["all", "Draw", "Hands", "Roulette", "Defense"] as const;
export type Filter = (typeof FILTERS)[number];

export const STACK_LABEL: Record<StackRule, string> = {
  yes: "Stackable",
  no: "Not stackable",
  counter: "Counters a stack",
  "out-of-turn": "Played out of turn",
};

export const WILD_RULES: Record<WildKind, { text: string; group: WildGroup; stack: StackRule }> = {
  reverse_draw_4: {
    text: "Reverse direction. The next player in the new direction draws 4.",
    group: "Draw",
    stack: "yes",
  },
  draw_6: { text: "Next player draws 6.", group: "Draw", stack: "yes" },
  draw_10: { text: "Next player draws 10.", group: "Draw", stack: "yes" },
  color_roulette: {
    text: "Name a color. The next player draws until they get that color.",
    group: "Roulette",
    stack: "no",
  },
  random_player_color_roulette: {
    text: "Name a color. A random player is chosen and must draw until they get that color.",
    group: "Roulette",
    stack: "no",
  },
  random_swapper: {
    text: "Choose two players (you may choose yourself). They swap hands.",
    group: "Hands",
    stack: "no",
  },
  draw_target: { text: "Choose any player. They draw 4.", group: "Draw", stack: "no" },
  draw_everyone: { text: "All other players draw 2.", group: "Draw", stack: "no" },
  gift: {
    text: "Give any 3 cards from your hand to a player of your choice.",
    group: "Hands",
    stack: "no",
  },
  pickpocket: {
    text: "Take 2 random cards from any player's hand.",
    group: "Hands",
    stack: "no",
  },
  reflect: {
    text: "Play on a stacked Draw penalty. The entire stack goes to the player who started it.",
    group: "Defense",
    stack: "counter",
  },
  lifeline: {
    text: "Play out of turn when you hold 20+ cards. Discard random cards until you have 10 left.",
    group: "Defense",
    stack: "out-of-turn",
  },
  spyglass: {
    text: "Look at any player's hand. Choose one card from it to discard.",
    group: "Hands",
    stack: "no",
  },
  hand_shuffle: {
    text: "Collect all hands, shuffle them together, and deal back evenly. Leftover cards go to the draw pile.",
    group: "Hands",
    stack: "no",
  },
  color_ban: {
    text: "Name a color. Anyone who plays that color until the turn returns to you draws 2.",
    group: "Defense",
    stack: "no",
  },
  number_roulette: {
    text: "Next player draws until they get a number card. Action and Wild cards don't count.",
    group: "Roulette",
    stack: "no",
  },
  dice_draw: {
    text: "Roll two dice. The next player draws the total.",
    group: "Draw",
    stack: "yes",
  },
  double_or_nothing: {
    text: "Flip a coin. Heads: next player draws 8. Tails: you draw 4.",
    group: "Draw",
    stack: "no",
  },
};

export const WILD_POINTS = 50;

export const isCore = (kind: WildKind) => (StandardWildKinds as readonly WildKind[]).includes(kind);

export { WildKinds };
