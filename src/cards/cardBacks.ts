import { CARD_IMAGE_BASE } from "@/cards/helpers";

export const CARD_BACK_NAMES = [
  "Mercy Oval",
  "Quarter Wheel",
  "Skull",
  "Stripes",
  "Starburst",
  "Checker",
  "Halftone",
  "Bullseye",
  "Inferno",
  "Fan Emblem",
  "Bolt",
] as const;

export type CardBackName = (typeof CARD_BACK_NAMES)[number];

export const CARD_BACK_STORAGE_KEY = "mercy-card-back";

const pad = (i: number) => String(i + 1).padStart(2, "0");

export const getCardBackImage = (index: number) =>
  `${CARD_IMAGE_BASE}/Card_Backs/Card_Back_${pad(index)}_${CARD_BACK_NAMES[index].replace(/ /g, "_")}.svg`;
