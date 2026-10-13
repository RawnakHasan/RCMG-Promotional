import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  BACKS,
  CLASSIC,
  COLORS,
  CORE_WILDS,
  HEX,
  NEW_ACTIONS,
  NUMBERS,
  WILD_SPECIALS,
  Card,
  type CardColor,
  kindLabel,
  metaLine,
  type CardItem,
} from "./MercyCards";
import {
  ActionKinds,
  CardColorList,
  CustomActionKinds,
  CustomWildKinds,
  MERCY_LIMIT,
  NumberCards,
} from "@/cards/types";
import { Link } from "react-router";

const ROUTES = {
  deck: "/deck",
  actions: "/actions",
  wilds: "/wilds",
  rules: "/rules",
  backs: "/backs",
};

const BACK_KEY = "zb"; // same localStorage key as the original site

const readBack = () => {
  try {
    return Math.min(10, Math.max(0, Number(localStorage.getItem(BACK_KEY)) || 0));
  } catch {
    return 0;
  }
};

/* ------------------------------------------------------------------ */
/* Static content                                                      */
/* ------------------------------------------------------------------ */

type FanCard = {
  item: CardItem;
  color: CardColor;
  x: number;
  y: number;
  r: number;
  z: number;
};

const FAN: FanCard[] = [
  { item: NEW_ACTIONS[1], color: "yellow", x: 0, y: 60, r: -22, z: 1 },
  { item: NUMBERS[7], color: "red", x: 92, y: 22, r: -11, z: 2 },
  { item: CORE_WILDS[3], color: "red", x: 184, y: 8, r: 0, z: 5 },
  { item: NEW_ACTIONS[0], color: "blue", x: 276, y: 22, r: 11, z: 3 },
  { item: NEW_ACTIONS[6], color: "green", x: 368, y: 60, r: 22, z: 4 },
];

const STATS = [
  {
    n: CardColorList.length,
    label: `colors, ${NumberCards.length + ActionKinds.length} card types each`,
    tone: "text-red",
  },
  { n: CustomWildKinds.length, label: "new Wild specials", tone: "text-yellow" },
  { n: CustomActionKinds.length, label: "new action types, in every color", tone: "text-green" },
  { n: MERCY_LIMIT, label: "cards in hand and you are out", tone: "text-blue" },
];

const PANELS = [
  [
    "Stacking",
    "Answer a stackable draw card with another and the penalty moves on to the next player, bigger. A Wild Reflect sends the whole stack back to the player who started it.",
    "bg-red",
  ],
  [
    "7 swaps, 0 passes",
    "Play a 7 to swap hands with another player. Play a 0 and every hand is passed along in the direction of play.",
    "bg-yellow",
  ],
  [
    "The Mercy Rule",
    "Reach 25 or more cards in your hand and you are out. Hold 20+ and a Wild Lifeline lets you play out of turn and drop to 10 cards.",
    "bg-green",
  ],
  [
    "Wilds choose the color",
    "Unless a card says otherwise, the player who plays a Wild also chooses the next color.",
    "bg-blue",
  ],
];

/* ------------------------------------------------------------------ */
/* Small UI pieces                                                     */
/* ------------------------------------------------------------------ */

const FOCUS = "focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-focus";

const btnBase =
  "inline-block rounded-[14px] border-2 font-bold transition-transform hover:-translate-y-0.5 motion-reduce:transition-none";
const btnSize = { md: "px-6 py-[13px] text-[17px]", sm: "px-4 py-[9px] text-[15px]" } as const;
const btnTone = {
  primary: "border-primary bg-primary text-primary-foreground",
  outline: "border-line text-foreground",
} as const;
const btn = (tone: keyof typeof btnTone = "outline", size: keyof typeof btnSize = "md") =>
  `${btnBase} ${btnSize[size]} ${btnTone[tone]} ${FOCUS}`;

function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-[1384px] px-7 ${className}`}>{children}</div>;
}

function Heading({
  eyebrow,
  title,
  sub,
  tone,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  tone: string;
}) {
  return (
    <>
      <div className={`text-sm font-bold tracking-[.16em] uppercase ${tone}`}>{eyebrow}</div>
      <h2 className="mt-2 mb-2.5 text-[length:clamp(30px,4vw,44px)] leading-[1.08] font-bold">
        {title}
      </h2>
      {sub && (
        <p className="mb-[30px] max-w-[680px] text-lg leading-normal text-muted-foreground">
          {sub}
        </p>
      )}
    </>
  );
}

const RowLabel = ({ children }: { children: ReactNode }) => (
  <div className="mt-[30px] mb-3 text-sm font-bold tracking-[.12em] text-muted-foreground uppercase">
    {children}
  </div>
);

const Row = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-wrap gap-4">{children}</div>
);

function CardButton({
  item,
  color,
  onOpen,
  className = "",
}: {
  item: CardItem;
  color?: CardColor;
  onOpen: (item: CardItem, color: CardColor) => void;
  className?: string;
}) {
  const resolvedColor = color ?? "red";

  return (
    <button
      type="button"
      aria-label={item.name}
      onClick={() => onOpen(item, resolvedColor)}
      className={`block rounded-2xl transition-transform hover:-translate-y-1.5 motion-reduce:transition-none ${FOCUS} ${className}`}
    >
      <Card item={item} color={resolvedColor} />
    </button>
  );
}

function CountUp({ to }: { to: number }) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [n, setN] = useState(() => (prefersReducedMotion ? to : 0));

  useEffect(() => {
    if (prefersReducedMotion) return;
    const step = Math.max(1, Math.ceil(to / 18));
    let i = 0;
    const t = setInterval(() => {
      i = Math.min(to, i + step);
      setN(i);
      if (i >= to) clearInterval(t);
    }, 45);
    return () => clearInterval(t);
  }, [prefersReducedMotion, to]);

  return <>{n}</>;
}

/* ------------------------------------------------------------------ */
/* Card details dialog                                                 */
/* ------------------------------------------------------------------ */

type DialogSelection = { item: CardItem; color: CardColor } | null;

function CardDialog({
  sel,
  setSel,
  chooseBack,
}: {
  sel: DialogSelection;
  setSel: Dispatch<SetStateAction<DialogSelection>>;
  chooseBack: (index: number) => void;
}) {
  const ref = useRef<HTMLDialogElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (sel && dialog && !dialog.open) dialog.showModal();
    document.body.style.overflow = sel ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sel]);

  const close = () => {
    ref.current?.close();
    setCopied(false);
  };
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable (insecure context); nothing to do */
    }
  };

  const item = sel?.item;
  const isBack = item?.kind === "back";
  const meta = item && !isBack ? metaLine(item) : "";

  return (
    <dialog
      ref={ref}
      aria-label="Card details"
      onClose={() => setSel(null)}
      onClick={(e) => e.target === ref.current && close()}
      className="m-auto max-h-[calc(100dvh-40px)] w-[calc(100%-40px)] max-w-[860px] rounded-[28px] border border-line bg-background p-0 text-foreground shadow-[0_30px_80px_rgba(0,0,0,.5)] backdrop:bg-[#050807]/70"
    >
      {item && (
        <div className="relative p-7">
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className={`absolute top-4 right-4 grid size-11 place-items-center rounded-xl border-2 border-line ${FOCUS}`}
          >
            <svg
              viewBox="0 0 24 24"
              className="size-[22px] fill-none stroke-current stroke-[2.4]"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>

          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="h-[389px] w-[270px] flex-none max-[820px]:h-[311px] max-[820px]:w-[216px]">
              <div className="w-[150px] origin-top-left scale-[1.8] max-[820px]:scale-[1.44]">
                <Card item={item} color={sel.color} />
              </div>
            </div>

            <div className="min-w-60 flex-1">
              <div className="text-sm font-bold tracking-[.16em] text-muted-foreground uppercase">
                {kindLabel(item)}
              </div>
              <h3 className="mt-1.5 mb-2 text-[32px] leading-tight font-bold">{item.name}</h3>
              <p className="mb-3.5 text-lg leading-normal text-foreground/80">
                {item.kind === "back" ? "Shared back for every card in the deck." : item.desc}
              </p>

              {item.kind === "color" && (
                <div role="group" aria-label="Color" className="my-3.5 flex gap-2.5">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={c[0].toUpperCase() + c.slice(1)}
                      aria-pressed={c === sel.color}
                      onClick={() => setSel({ ...sel, color: c })}
                      style={{ background: HEX[c] }}
                      className={`size-[34px] rounded-full border-[3px] border-line aria-pressed:border-foreground ${FOCUS}`}
                    />
                  ))}
                </div>
              )}

              {meta && (
                <div className="text-[13px] leading-snug font-semibold text-muted-foreground">
                  {meta}
                </div>
              )}

              <div className="mt-3">
                {isBack ? (
                  <button
                    type="button"
                    onClick={() => {
                      chooseBack(item.index);
                      close();
                    }}
                    className={btn("primary")}
                  >
                    Use this back
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => copy(`${item.name}: ${item.desc}`)}
                    className={btn("outline", "sm")}
                  >
                    {copied ? "Copied" : "Copy rules text"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Home() {
  const [sel, setSel] = useState<DialogSelection>(null); // { item, color } shown in the dialog
  const [back, setBack] = useState(readBack);

  const open = (item: CardItem, color: CardColor) => setSel({ item, color });
  const chooseBack = (index: number) => {
    setBack(index);
    try {
      localStorage.setItem(BACK_KEY, String(index));
    } catch {
      /* storage blocked; the choice just won't persist */
    }
  };

  return (
    <div className="overflow-x-clip pb-10">
      {/* Hero */}
      <Container>
        <div className="grid min-h-[620px] grid-cols-[minmax(0,1fr)_600px] items-center gap-5 max-[980px]:min-h-0 max-[980px]:grid-cols-1 max-[980px]:py-10">
          <div>
            <div className="text-sm font-bold tracking-[.16em] text-red uppercase">
              A custom card game
            </div>
            <h1 className="mt-3 mb-3.5 text-[length:clamp(40px,6vw,72px)] leading-none font-bold">
              <span className="text-red">Stack it.</span>{" "}
              <span className="text-yellow">Swap it.</span>{" "}
              <span className="text-green">Survive 25.</span>
            </h1>
            <p className="mb-[30px] max-w-[560px] text-[22px] leading-normal text-muted-foreground">
              A fast, aggressive card game with stacking draw penalties, hand swaps and a Mercy
              Rule: hit 25 cards and you are out.
            </p>
            <div className="flex flex-wrap gap-3.5">
              <Link to={ROUTES.deck} className={btn("primary")}>
                Browse the cards
              </Link>
              <Link to={ROUTES.rules} className={btn("outline")}>
                Read the rules
              </Link>
            </div>
          </div>

          <div className="relative mx-auto h-[470px] w-[560px] [--spread:1] hover:[--spread:1.12] max-[980px]:mt-[70px] max-[980px]:h-[340px] max-[980px]:origin-top max-[980px]:scale-[.7] max-[520px]:mt-[60px] max-[520px]:ml-[calc(50%_-_280px)] max-[520px]:h-[260px] max-[520px]:scale-[.52]">
            {FAN.map(({ item, color, x, y, r, z }) => (
              <button
                key={item.id}
                type="button"
                aria-label={item.name}
                onClick={() => open(item, color)}
                style={{
                  ["--x" as string]: `${x}px`,
                  ["--y" as string]: `${y}px`,
                  ["--r" as string]: `${r}deg`,
                  ["--z" as string]: z,
                }}
                className={`absolute top-(--y) left-[calc(var(--x)_*_var(--spread))] z-(--z) block origin-bottom rounded-2xl transition-[left,transform] duration-300 [transform:rotate(var(--r))_scale(1.28)] hover:z-10 hover:[transform:rotate(var(--r))_scale(1.4)_translateY(-14px)] motion-reduce:transition-none ${FOCUS}`}
              >
                <Card item={item} color={color} />
              </button>
            ))}
          </div>
        </div>
      </Container>

      {/* Stats band */}
      <div className="border-y border-line bg-card">
        <Container className="grid grid-cols-4 gap-5 py-[34px] text-center max-[980px]:grid-cols-2">
          {STATS.map(({ n, label, tone }) => (
            <div key={label}>
              <b className={`block text-[54px] leading-none ${tone}`}>
                <CountUp to={n} />
              </b>
              <span className="text-base font-semibold text-muted-foreground">{label}</span>
            </div>
          ))}
        </Container>
      </div>

      {/* The deck */}
      <Container className="pt-[72px]">
        <Heading
          eyebrow="The deck"
          title="Every card, built to be read at a glance"
          sub="Bold icons, one color per suit, and a corner mark that never changes."
          tone="text-red"
        />
        <RowLabel>Numbers</RowLabel>
        <Row>
          {NUMBERS.map((item) => (
            <CardButton key={item.id} item={item} color="red" onOpen={open} />
          ))}
        </Row>
        <RowLabel>Classic actions</RowLabel>
        <Row>
          {CLASSIC.map((item, j) => (
            <CardButton key={item.id} item={item} color={COLORS[j % 4]} onOpen={open} />
          ))}
        </Row>
        <RowLabel>Core wilds</RowLabel>
        <Row>
          {CORE_WILDS.map((item) => (
            <CardButton key={item.id} item={item} onOpen={open} />
          ))}
        </Row>
        <p className="mt-7">
          <Link to={ROUTES.deck} className={btn()}>
            See the full deck
          </Link>
        </p>
      </Container>

      {/* New actions */}
      <section className="mt-[72px] bg-muted py-[72px]">
        <Container>
          <Heading
            eyebrow="New in this deck"
            title="Seven action cards, every color"
            sub="Each one is playable on its color or on the same card type."
            tone="text-yellow"
          />
          <Row>
            {NEW_ACTIONS.map((item, j) => (
              <CardButton key={item.id} item={item} color={COLORS[j % 4]} onOpen={open} />
            ))}
          </Row>
          <p className="mt-7">
            <Link to={ROUTES.actions} className={btn()}>
              All new actions
            </Link>
          </p>
        </Container>
      </section>

      {/* Wild specials */}
      <Container className="pt-[72px]">
        <Heading
          eyebrow="Wild specials"
          title="Fourteen ways to wreck a table"
          sub="All worth 50 points."
          tone="text-green"
        />
        <Row>
          {WILD_SPECIALS.map((item) => (
            <CardButton key={item.id} item={item} onOpen={open} />
          ))}
        </Row>
        <p className="mt-7">
          <Link to={ROUTES.wilds} className={btn()}>
            All wilds
          </Link>
        </p>
      </Container>

      {/* How it plays */}
      <section className="mt-[72px] bg-muted py-[72px]">
        <Container>
          <Heading eyebrow="How it plays" title="Four rules to remember" tone="text-blue" />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
            {PANELS.map(([title, text, bar]) => (
              <div key={title} className="rounded-[20px] border border-line bg-card p-6">
                <span className={`mb-4 block h-1.5 w-11 rounded-[3px] ${bar}`} />
                <h3 className="mb-2 text-[22px] font-bold">{title}</h3>
                <p className="text-base leading-normal text-foreground/80">{text}</p>
              </div>
            ))}
          </div>
          <p className="mt-7">
            <Link to={ROUTES.rules} className={btn()}>
              All the rules
            </Link>
          </p>
        </Container>
      </section>

      {/* Card backs */}
      <Container className="pt-[72px]">
        <Heading
          eyebrow="Card backs"
          title="Pick your back"
          sub="Eleven designs. Choose one and it follows you around the site."
          tone="text-red"
        />
        <Row>
          {BACKS.map((item) => {
            const selected = item.kind === "back" && item.index === back;
            return (
              <div key={item.id} className="text-center">
                <CardButton
                  item={item}
                  onOpen={open}
                  className={selected ? "outline-3 outline-offset-[5px] outline-green" : ""}
                />
                <small
                  className={`mt-2.5 block text-[15px] font-semibold ${selected ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {item.name}
                </small>
              </div>
            );
          })}
        </Row>
        <p className="mt-7">
          <Link to={ROUTES.backs} className={btn()}>
            See all backs
          </Link>
        </p>
      </Container>

      <CardDialog sel={sel} setSel={setSel} chooseBack={chooseBack} />
    </div>
  );
}
