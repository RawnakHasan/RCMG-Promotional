import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  ACTION_CARD_COUNT,
  MERCY_LIMIT,
  WILD_CARD_COUNT,
  WildKinds,
  toTitleCase,
} from "@/cards/types";
import { isCore, WILD_POINTS, WILD_RULES, type StackRule } from "@/cards/wildRules";
import { ACTION_POINTS, NEW_ACTION_ORDER, NEW_ACTION_RULES } from "@/cards/actionRules";

/* -------------------------------------------------------------------------- */
/* Data                                                                        */
/* -------------------------------------------------------------------------- */

const LIFELINE_AT = 20;
const LIFELINE_DROPS_TO = 10;
const METER_MAX = MERCY_LIMIT + 5;

const RULES: { title: string; text: string }[] = [
  {
    title: "Match to play",
    text: "Play a card that matches the top card's color, or the same card type (the same number or symbol).",
  },
  {
    title: "Wilds choose the color",
    text: "Unless a card says otherwise, the player who plays a Wild also chooses the next color.",
  },
  {
    title: "Points",
    text: `Wilds are worth ${WILD_POINTS} points. Colored action cards are worth ${ACTION_POINTS} points each.`,
  },
  {
    title: "Stacking",
    text: "Answer a stackable draw card with another and the penalty moves on to the next player, bigger. A Wild Reflect sends the whole stack back to the player who started it.",
  },
  {
    title: "7 swaps, 0 passes",
    text: "Play a 7 to swap hands with another player. Play a 0 and every hand is passed along in the direction of play.",
  },
  {
    title: "The Mercy Rule",
    text: `Reach ${MERCY_LIMIT} or more cards in your hand and you are out. Hold ${LIFELINE_AT}+ and a Wild Lifeline lets you play out of turn and drop to ${LIFELINE_DROPS_TO} cards.`,
  },
];

type MeterLevel = "safe" | "danger" | "out";

const METER: Record<MeterLevel, { bar: string; text: string; message: string }> = {
  safe: {
    bar: "bg-green",
    text: "text-green",
    message: "Safe. Keep an eye on the pile as the stacks grow.",
  },
  danger: {
    bar: "bg-yellow",
    text: "text-yellow",
    message: `Danger zone. A Wild Lifeline can be played out of turn to drop you to ${LIFELINE_DROPS_TO} cards.`,
  },
  out: {
    bar: "bg-red",
    text: "text-red",
    message: `Eliminated. ${MERCY_LIMIT} or more cards and you are out.`,
  },
};

const STACK_SHORT: Record<StackRule, string> = {
  yes: "Yes",
  no: "No",
  counter: "Counters",
  "out-of-turn": "Out of turn",
};

function buildRulesText(): string {
  const rules = RULES.map((r) => `${r.title}\n${r.text}`).join("\n\n");
  const actions = NEW_ACTION_ORDER.map(
    (k) => `- ${toTitleCase(k)}: ${NEW_ACTION_RULES[k].text}`,
  ).join("\n");
  const wilds = WildKinds.map((k) => `- ${toTitleCase(`wild_${k}`)}: ${WILD_RULES[k].text}`).join(
    "\n",
  );

  return [
    "MERCY DECK - RULES",
    rules,
    `NEW ACTION CARDS (${ACTION_POINTS} pts)\n${actions}`,
    `WILD CARDS (${WILD_POINTS} pts)\n${wilds}`,
  ].join("\n\n");
}

function downloadText(fileName: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 600);
}

/* -------------------------------------------------------------------------- */
/* Pieces                                                                      */
/* -------------------------------------------------------------------------- */

function Accordion() {
  const [open, setOpen] = useState<Set<number>>(() => new Set([0]));

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div>
      {RULES.map((rule, i) => {
        const isOpen = open.has(i);
        return (
          <div
            key={rule.title}
            className="mb-3 rounded-2xl border border-line bg-card text-card-foreground"
          >
            <h3>
              <button
                type="button"
                id={`rule-trigger-${i}`}
                aria-expanded={isOpen}
                aria-controls={`rule-panel-${i}`}
                onClick={() => toggle(i)}
                className="flex w-full items-center justify-between gap-4 rounded-2xl px-6 py-5 text-left text-xl font-bold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
              >
                {rule.title}
                <ChevronDown
                  aria-hidden="true"
                  className={`size-5 shrink-0 text-muted-foreground transition-transform duration-300 ease-in-out motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
            </h3>
            <div
              id={`rule-panel-${i}`}
              role="region"
              aria-labelledby={`rule-trigger-${i}`}
              aria-hidden={!isOpen}
              className={`grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-5 text-[17px] leading-relaxed text-foreground/80">
                  {rule.text}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MercyMeter() {
  const [cards, setCards] = useState(10);
  const level: MeterLevel = cards >= MERCY_LIMIT ? "out" : cards >= LIFELINE_AT ? "danger" : "safe";
  const { bar, text, message } = METER[level];

  return (
    <div className="rounded-3xl border border-line bg-card p-7 text-card-foreground">
      <label htmlFor="mercy-meter" className="font-bold">
        Cards in your hand: <span>{cards}</span>
      </label>
      <input
        id="mercy-meter"
        type="range"
        min={0}
        max={METER_MAX}
        value={cards}
        onChange={(e) => setCards(Number(e.target.value))}
        className="mt-3 block w-full accent-primary"
      />

      <div className="relative mt-5 mb-9 h-3.5 rounded-full bg-line">
        <div
          className={`h-full rounded-full transition-[width,background-color] duration-200 ${bar}`}
          style={{ width: `${(cards / METER_MAX) * 100}%` }}
        />
        {[
          { at: LIFELINE_AT, label: `${LIFELINE_AT} Lifeline` },
          { at: MERCY_LIMIT, label: `${MERCY_LIMIT} Out` },
        ].map((m) => (
          <div
            key={m.at}
            className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
            style={{ left: `${(m.at / METER_MAX) * 100}%` }}
          >
            <span className="h-3.5 w-0.5 bg-foreground/50" />
            <span className="mt-1 text-xs font-semibold whitespace-nowrap text-muted-foreground">
              {m.label}
            </span>
          </div>
        ))}
      </div>

      <p role="status" className={`text-lg font-semibold ${text}`}>
        {message}
      </p>
    </div>
  );
}

function RefTable({ title, rows }: { title: string; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[15px]">
        <thead>
          <tr className="text-xs font-semibold text-muted-foreground">
            <th scope="col" className="border-b border-line px-2 py-3 text-left">
              {title}
            </th>
            {["Copies", "Points", "Stack"].map((h) => (
              <th key={h} scope="col" className="border-b border-line px-2 py-3 text-right">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>
              <th scope="row" className="border-b border-line px-2 py-3 text-left font-bold">
                {row[0]}
              </th>
              {row.slice(1).map((cell, i) => (
                <td key={i} className="border-b border-line px-2 py-3 text-right font-semibold">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function Rules() {
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 2200);
    return () => clearTimeout(t);
  }, [notice]);

  const wildRows = WildKinds.filter((k) => !isCore(k)).map((k) => [
    toTitleCase(`wild_${k}`),
    WILD_CARD_COUNT[k],
    WILD_POINTS,
    STACK_SHORT[WILD_RULES[k].stack],
  ]);

  const actionRows = NEW_ACTION_ORDER.map((k) => [
    toTitleCase(k),
    ACTION_CARD_COUNT[k] * 4,
    ACTION_POINTS,
    NEW_ACTION_RULES[k].stackable ? "Yes" : "No",
  ]);

  return (
    <section aria-labelledby="rules-heading" className="mx-auto max-w-6xl px-7 py-14">
      <h1 id="rules-heading" className="text-4xl leading-tight font-bold sm:text-5xl">
        How the deck plays
      </h1>
      <p className="mt-3 mb-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        Six things to know before the first hand.
      </p>

      <Accordion />

      <h2 className="mt-12 mb-4 text-2xl font-bold">Mercy meter</h2>
      <MercyMeter />

      <h2 className="mt-12 mb-4 text-2xl font-bold">Quick reference</h2>
      <div className="grid gap-8 md:grid-cols-2">
        <RefTable title="Wild specials" rows={wildRows} />
        <RefTable title="New actions (all colors)" rows={actionRows} />
      </div>

      <div className="mt-10 flex items-center gap-4">
        <button
          type="button"
          onClick={() => {
            downloadText("mercy-deck-rules.txt", buildRulesText());
            setNotice("Rules downloaded");
          }}
          className="rounded-2xl border-2 border-primary bg-primary px-6 py-3 text-lg font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
        >
          Download rules (.txt)
        </button>
        <p role="status" className="font-semibold text-muted-foreground">
          {notice}
        </p>
      </div>
    </section>
  );
}
