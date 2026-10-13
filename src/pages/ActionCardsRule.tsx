import { useState } from "react";
import { getCardImage } from "@/cards/helpers";
import {
  ACTION_POINTS,
  NEW_ORDER,
  NEW_RULES,
  STANDARD_ORDER,
  STANDARD_RULES,
  type ActionRuleKind,
} from "@/cards/actionRules";
import {
  ACTION_CARD_COUNT,
  CardColorList,
  toTitleCase,
  type ActionCardName,
  type CardColors,
} from "@/cards/types";

const COLOR_LABEL: Record<CardColors, string> = {
  red: "Red",
  blue: "Blue",
  green: "Green",
  yellow: "Yellow",
};

type RuleKind = ActionRuleKind;

function CardImage({ name, label }: { name: ActionCardName; label: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="aspect-150/216 w-24 flex-none overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--line),0_12px_24px_rgba(0,0,0,0.25)] sm:w-28">
      {failed ? (
        <div className="grid size-full place-items-center rounded-xl border-2 border-line bg-card p-2 text-center text-sm font-bold text-card-foreground">
          {label}
        </div>
      ) : (
        <img
          src={getCardImage(name)}
          alt={label}
          loading="lazy"
          onError={() => setFailed(true)}
          className="block size-full object-contain"
        />
      )}
    </div>
  );
}

function ActionRow({ kind }: { kind: RuleKind }) {
  const rule =
    kind in STANDARD_RULES
      ? STANDARD_RULES[kind as keyof typeof STANDARD_RULES]
      : NEW_RULES[kind as keyof typeof NEW_RULES];
  const title = toTitleCase(kind);

  return (
    <article className="flex flex-wrap items-center gap-x-9 gap-y-6 rounded-3xl border border-line bg-card p-5 text-card-foreground">
      <div className="min-w-64 flex-1">
        <h3 className="text-2xl leading-tight font-bold">{title}</h3>
        <p className="mt-2 text-lg leading-snug text-foreground/80">{rule.text}</p>
        <ul className="mt-3 flex flex-wrap gap-2 text-sm font-semibold text-muted-foreground">
          <li className="rounded-full bg-muted px-3 py-1">{ACTION_CARD_COUNT[kind]} per color</li>
          <li className="rounded-full bg-muted px-3 py-1">{ACTION_POINTS} points</li>
          <li className="rounded-full bg-muted px-3 py-1">
            {rule.stackable ? "Stackable" : "Not stackable"}
          </li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-3.5">
        {CardColorList.map((color) => (
          <CardImage
            key={color}
            name={`${color}_${kind}` as ActionCardName}
            label={`${COLOR_LABEL[color]} ${title}`}
          />
        ))}
      </div>
    </article>
  );
}

export default function ActionCardsRule() {
  return (
    <section aria-labelledby="action-rules-heading" className="mx-auto max-w-6xl px-7 py-14">
      <h2 id="action-rules-heading" className="text-3xl leading-tight font-bold sm:text-4xl">
        Action cards
      </h2>
      <p className="mt-3 mb-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        Standard action cards and the seven custom actions added to this deck. Play one on a
        matching color or on the same card type. Each is worth {ACTION_POINTS} points unless noted
        otherwise.
      </p>

      <div className="mb-10 flex flex-col gap-4">
        <h3 className="text-2xl leading-tight font-bold">Standard actions</h3>
        {STANDARD_ORDER.map((kind) => (
          <ActionRow key={kind} kind={kind} />
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-2xl leading-tight font-bold">New actions</h3>
        {NEW_ORDER.map((kind) => (
          <ActionRow key={kind} kind={kind} />
        ))}
      </div>
    </section>
  );
}
