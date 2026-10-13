import { useState } from "react";
import { getCardImage } from "@/cards/helpers";
import {
  FILTERS,
  STACK_LABEL,
  WILD_POINTS,
  WILD_RULES,
  isCore,
  type Filter,
} from "@/cards/wildRules";
import {
  WILD_CARD_COUNT,
  WildKinds,
  toTitleCase,
  type WildCardName,
  type WildKind,
} from "@/cards/types";

function CardImage({ name, label }: { name: WildCardName; label: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="aspect-150/216 w-24 flex-none overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--line),0_12px_24px_rgba(0,0,0,0.25)]">
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

function WildItem({ kind }: { kind: WildKind }) {
  const rule = WILD_RULES[kind];
  const name = `wild_${kind}` as WildCardName;
  const title = toTitleCase(name);

  return (
    <article className="flex gap-4 rounded-2xl border border-line bg-card p-4 text-card-foreground">
      <CardImage name={name} label={title} />
      <div className="min-w-0 flex-1">
        <h4 className="text-xl leading-tight font-bold">{title}</h4>
        <p className="mt-1.5 text-[15px] leading-snug text-foreground/80">{rule.text}</p>
        <ul className="mt-2.5 flex flex-wrap gap-1.5 text-[13px] font-semibold text-muted-foreground">
          <li className="rounded-full bg-muted px-2.5 py-0.5">{rule.group}</li>
          <li className="rounded-full bg-muted px-2.5 py-0.5">{WILD_CARD_COUNT[kind]} in deck</li>
          <li className="rounded-full bg-muted px-2.5 py-0.5">{STACK_LABEL[rule.stack]}</li>
        </ul>
      </div>
    </article>
  );
}

function WildGroupList({ title, kinds }: { title: string; kinds: WildKind[] }) {
  if (kinds.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="mb-4 text-2xl font-bold">{title}</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {kinds.map((kind) => (
          <WildItem key={kind} kind={kind} />
        ))}
      </div>
    </div>
  );
}

export default function WildCardsRule() {
  const [filter, setFilter] = useState<Filter>("all");

  const visible = WildKinds.filter((k) => filter === "all" || WILD_RULES[k].group === filter);
  const core = visible.filter(isCore);
  const specials = visible.filter((k) => !isCore(k));

  return (
    <section aria-labelledby="wild-rules-heading" className="mx-auto max-w-6xl px-7 py-14">
      <h2 id="wild-rules-heading" className="text-3xl leading-tight font-bold sm:text-4xl">
        Wild cards
      </h2>
      <p className="mt-3 mb-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        Unless a card says otherwise, the player who plays a Wild also chooses the next color. Every
        wild is worth {WILD_POINTS} points.
      </p>

      <div className="flex flex-wrap gap-2.5" role="group" aria-label="Filter wilds by type">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className="rounded-full border-2 border-line px-4.5 py-2 text-base font-semibold transition-colors hover:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background"
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      <WildGroupList title="Core wilds" kinds={core} />
      <WildGroupList title="Wild specials" kinds={specials} />

      {core.length + specials.length === 0 && (
        <p className="mt-8 text-lg text-muted-foreground">No wilds in that group.</p>
      )}
    </section>
  );
}
