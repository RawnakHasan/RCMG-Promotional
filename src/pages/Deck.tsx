import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { type Card, type CardColors } from "@/cards/types";
import { generateDeck } from "@/cards/helpers";
import { flushSync } from "react-dom";

type Filter = "all" | CardColors | "wild";

type DeckEntry = {
  card: Card;
  /** how many copies of this card are in the full deck */
  copies: number;
};

/* Display order follows the design: red, yellow, green, blue. */
const COLORS: { id: CardColors; label: string; dot: string }[] = [
  { id: "red", label: "Red", dot: "bg-brand-red" },
  { id: "yellow", label: "Yellow", dot: "bg-brand-yellow" },
  { id: "green", label: "Green", dot: "bg-brand-green" },
  { id: "blue", label: "Blue", dot: "bg-brand-blue" },
];

const WILD_DOT =
  "[background:conic-gradient(var(--brand-red)_0deg_90deg,var(--brand-yellow)_90deg_180deg,var(--brand-green)_180deg_270deg,var(--brand-blue)_270deg_360deg)]";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "red", label: "Red" },
  { id: "yellow", label: "Yellow" },
  { id: "green", label: "Green" },
  { id: "blue", label: "Blue" },
  { id: "wild", label: "Wilds" },
];

/** One entry per distinct card (generateDeck returns every copy). */
function buildEntries(): DeckEntry[] {
  const map = new Map<string, DeckEntry>();
  for (const card of generateDeck()) {
    const existing = map.get(card.name);
    if (existing) existing.copies += 1;
    else map.set(card.name, { card, copies: 1 });
  }
  return [...map.values()];
}

/* ------------------------------------------------------------------ *
 *  Card motion
 *  - Hover: card lifts and tilts toward the pointer (spring-smoothed)
 *  - Click: card leaves the grid, spins over (front → back → front) and
 *           lands in the center while the page dims
 *  - Open:  the big card keeps tilting, with a foil glare
 *  - Close: click outside / Esc and it spins back into its slot
 *  No animation library: a small rAF spring + the Web Animations API.
 *
 *  Shadows use filter: drop-shadow and the glare is masked with the card
 *  image itself, so both follow the art's real corners instead of a
 *  guessed border-radius.
 * ------------------------------------------------------------------ */

/** Optional: set to your card-back image. Falls back to a plain CSS back. */
const CARD_BACK_SRC: string | undefined = "/cards/Card_Backs/Card_Back_01_Mercy_Oval.svg";

const LIFT_Y = 8; // px the card rises on hover
const LIFT_SCALE = 0.05; // extra scale on hover
const OPEN_MS = 950;
const CLOSE_MS = 700;
const CAPTION_H = 190; // vertical room reserved under the big card for details
const EASE_FLIGHT = "cubic-bezier(.22,.85,.25,1)";
const EASE_SPIN = "cubic-bezier(.45,.05,.25,1)";

// % radii scale with the card, so the corners match at any size
const RADIUS = "7% / 4.7%";

const GRID_SHADOW =
  "drop-shadow(0 calc(var(--lift,0) * 16px) calc(var(--lift,0) * 12px) rgb(0 0 0 / calc(var(--lift,0) * .28)))";
const MODAL_FILTER =
  "drop-shadow(0 30px 30px rgb(0 0 0 / .45)) drop-shadow(0 8px 9px rgb(0 0 0 / .3))";
const FOIL =
  "linear-gradient(115deg, transparent 18%, rgb(255 119 200 / .6) 34%, rgb(255 232 120 / .6) 42%, rgb(120 255 200 / .6) 50%, rgb(120 190 255 / .6) 58%, transparent 74%)";
const FACE = {
  backfaceVisibility: "hidden",
  WebkitBackfaceVisibility: "hidden",
} as const;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type El = RefObject<HTMLElement | null>;

/**
 * Drives the card's transform and these CSS variables with a small spring:
 *   --mx / --my  pointer position inside the card, in %
 *   --lift       0 → 1 while hovered
 *   --o          glare strength, 0 → 1
 * tiltRef   : element that gets transformed
 * anchorRef : un-transformed element used to measure the card's rect
 * scopeRef  : element that receives the pointer events (default: anchor)
 */
function useTilt(
  tiltRef: El,
  anchorRef: El,
  scopeRef: El | null,
  {
    max = 12,
    enabled = true,
    perspective = 900,
    liftY = 0,
    liftScale = 0,
  }: {
    max?: number;
    enabled?: boolean;
    perspective?: number;
    liftY?: number;
    liftScale?: number;
  } = {},
) {
  // kept in a ref so the card eases back to rest when disabled, not snaps
  const st = useRef({ x: 0, y: 0, l: 0, o: 0 });

  useEffect(() => {
    const el = tiltRef.current;
    const anchor = anchorRef.current;
    const scope = scopeRef?.current ?? anchor;
    if (!el || !anchor || !scope) return;

    const s = st.current;
    let tx = 0;
    let ty = 0;
    let tl = 0;
    let to = 0;
    let raf = 0;

    const paint = () => {
      const resting = Math.abs(s.x) + Math.abs(s.y) + s.l < 0.002;
      // transform stays "none" at rest, so a big grid doesn't hold a GPU layer per card
      el.style.transform = resting
        ? ""
        : `perspective(${perspective}px) translateY(${(-s.l * liftY).toFixed(2)}px) scale(${(1 + s.l * liftScale).toFixed(4)}) rotateX(${(-s.y * max).toFixed(2)}deg) rotateY(${(s.x * max).toFixed(2)}deg)`;
      el.style.setProperty("--mx", `${(50 + s.x * 50).toFixed(1)}%`);
      el.style.setProperty("--my", `${(50 + s.y * 50).toFixed(1)}%`);
      el.style.setProperty("--lift", s.l.toFixed(3));
      el.style.setProperty("--o", s.o.toFixed(3));
      el.style.willChange = resting ? "" : "transform";
    };

    const tick = () => {
      const k = 0.14;
      s.x += (tx - s.x) * k;
      s.y += (ty - s.y) * k;
      s.l += (tl - s.l) * k;
      s.o += (to - s.o) * k;
      paint();
      const settled =
        Math.abs(tx - s.x) < 0.001 &&
        Math.abs(ty - s.y) < 0.001 &&
        Math.abs(tl - s.l) < 0.001 &&
        Math.abs(to - s.o) < 0.001;
      raf = settled ? 0 : requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    if (!enabled || prefersReducedMotion()) {
      if (s.x || s.y || s.l || s.o) kick(); // ease back to rest
      return () => cancelAnimationFrame(raf);
    }

    const move = (e: PointerEvent) => {
      const r = anchor.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width - 0.5) * 2; // -1 … 1
      const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
      tx = Math.max(-1, Math.min(1, nx));
      ty = Math.max(-1, Math.min(1, ny));
      tl = 1;
      to = 1;
      kick();
    };
    const leave = () => {
      tx = ty = tl = to = 0;
      kick();
    };

    scope.addEventListener("pointermove", move);
    scope.addEventListener("pointerleave", leave);
    return () => {
      scope.removeEventListener("pointermove", move);
      scope.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(raf);
    };
  }, [tiltRef, anchorRef, scopeRef, max, enabled, perspective, liftY, liftScale]);
}

/**
 * Glare (and optional holo foil) that follow the pointer via --mx / --my / --o.
 * Pass `mask` (the card image URL) to confine the glare to the art's real
 * shape; without it the glare falls back to the parent's border radius.
 */
function Shine({ foil = false, mask }: { foil?: boolean; mask?: string }) {
  const maskStyle = mask
    ? {
        WebkitMaskImage: `url(${mask})`,
        maskImage: `url(${mask})`,
        WebkitMaskSize: "100% 100%",
        maskSize: "100% 100%",
      }
    : { borderRadius: "inherit" };
  return (
    <>
      {foil && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            ...maskStyle,
            background: FOIL,
            backgroundSize: "260% 260%",
            backgroundPosition: "var(--mx,50%) var(--my,50%)",
            mixBlendMode: "color-dodge",
            opacity: "calc(var(--o,0) * .4)",
          }}
        />
      )}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          ...maskStyle,
          background:
            "radial-gradient(circle at var(--mx,50%) var(--my,50%), rgb(255 255 255 / .6), rgb(255 255 255 / 0) 55%)",
          mixBlendMode: "overlay",
          opacity: "var(--o,0)",
        }}
      />
    </>
  );
}

/* ----------------------------- grid card ---------------------------- */

const CardButton = memo(function CardButton({
  entry,
  hidden,
  onOpen,
}: {
  entry: DeckEntry;
  hidden: boolean;
  onOpen: (entry: DeckEntry, el: HTMLElement) => void;
}) {
  const slot = useRef<HTMLButtonElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  useTilt(tilt, slot, null, {
    max: 12,
    enabled: !hidden,
    liftY: LIFT_Y,
    liftScale: LIFT_SCALE,
  });

  return (
    <button
      ref={slot}
      type="button"
      onClick={() => tilt.current && onOpen(entry, tilt.current)}
      aria-label={`${entry.card.displayName}. Show details`}
      className="block cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      style={{ borderRadius: RADIUS }}
    >
      {/* the slot above never moves; this wrapper is what lifts and tilts.
          While the card is open it is hidden (the slot stays focusable). */}
      <div
        ref={tilt}
        className="relative"
        style={{
          filter: GRID_SHADOW,
          visibility: hidden ? "hidden" : "visible",
        }}
      >
        <img
          src={entry.card.image}
          alt={entry.card.displayName}
          loading="lazy"
          draggable={false}
          className="block h-auto w-full"
        />
        <Shine mask={entry.card.image} />
      </div>
    </button>
  );
});

/* ----------------------------- lightbox ----------------------------- */

/** Where the card is on screen right now (includes any hover lift). */
function measure(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width };
}

/** Final size and position of the big card, centered with room for details. */
function getTarget(el: HTMLElement) {
  const aspect = el.offsetHeight / el.offsetWidth; // layout size ignores transforms
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const room = vh - CAPTION_H - 48;
  const w = Math.max(160, Math.min(320, vw * 0.8, room / aspect));
  const h = w * aspect;
  const top = Math.max(16, (vh - h - CAPTION_H) / 2);
  return { left: (vw - w) / 2, top, w, h };
}

type Target = ReturnType<typeof getTarget>;

function flightFrom(from: ReturnType<typeof measure>, t: Target) {
  const dx = from.cx - (t.left + t.w / 2);
  const dy = from.cy - (t.top + t.h / 2);
  return `translate(${dx}px, ${dy}px) scale(${from.w / t.w})`;
}

const spinAt = (deg: number) => `perspective(1400px) rotateY(${deg}deg)`;

function CardBack() {
  return (
    <div
      className="relative h-full w-full"
      style={{ background: CARD_BACK_SRC ? "transparent" : "#141414" }}
    >
      {CARD_BACK_SRC ? (
        <img src={CARD_BACK_SRC} alt="" draggable={false} className="block h-full w-full" />
      ) : (
        <>
          <div
            className="absolute border border-white/15"
            style={{ inset: "6%", borderRadius: RADIUS }}
          />
          <div
            className="absolute bg-brand-red"
            style={{
              left: "50%",
              top: "50%",
              width: "74%",
              height: "40%",
              borderRadius: "50%",
              transform: "translate(-50%, -50%) rotate(-24deg)",
              boxShadow: "inset 0 0 0 3px rgb(255 255 255 / .18)",
            }}
          />
        </>
      )}
      <Shine mask={CARD_BACK_SRC} />
    </div>
  );
}

function Lightbox({
  entry,
  from,
  onClosed,
}: {
  entry: DeckEntry;
  /** the grid card's tilt wrapper: where the flight starts and ends */
  from: HTMLElement;
  onClosed: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const flyer = useRef<HTMLDivElement>(null);
  const spin = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"opening" | "open" | "closing">("opening");
  const [target] = useState(() => getTarget(from));

  // scope = null → pointer events come from the card itself (flyer),
  // so it only tilts while the cursor is actually on the card
  useTilt(tilt, flyer, null, {
    max: 10,
    perspective: 1000,
    enabled: phase === "open",
  });

  /* open: runs before paint so the card never flashes at its final spot */
  useLayoutEffect(() => {
    const d = dialog.current;
    const f = flyer.current;
    const s = spin.current;
    const b = backdrop.current;
    if (!d || !f || !s || !b) return;
    if (!d.open) d.showModal(); // native modal: focus trap, inert page, top layer

    const reduce = prefersReducedMotion();
    const dur = reduce ? 1 : OPEN_MS;
    const start = flightFrom(measure(from), target);

    const anims = [
      f.animate([{ transform: start }, { transform: "translate(0px, 0px) scale(1)" }], {
        duration: dur,
        easing: EASE_FLIGHT,
        fill: "both",
      }),
      s.animate([{ transform: spinAt(0) }, { transform: spinAt(reduce ? 0 : 360) }], {
        duration: dur,
        easing: EASE_SPIN,
        fill: "both",
      }),
      b.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: reduce ? 1 : 550,
        easing: "ease-out",
        fill: "both",
      }),
    ];
    let alive = true;
    anims[0].finished.then(() => alive && setPhase("open")).catch(() => {});
    return () => {
      alive = false;
      anims.forEach((a) => a.cancel());
    };
  }, [from, target]);

  /* hand control back to the grid, putting focus back on the card's button */
  const finish = useCallback(() => {
    const button = from.closest("button");
    flushSync(onClosed); // unmount + reveal the grid card in the same frame
    button?.focus({ preventScroll: true });
  }, [from, onClosed]);

  /* close: reverse the trip into the (re-measured) grid slot */
  const close = useCallback(() => {
    const f = flyer.current;
    const s = spin.current;
    const b = backdrop.current;
    if (phase !== "open" || !f || !s || !b) return;
    setPhase("closing");

    const reduce = prefersReducedMotion();
    const dur = reduce ? 1 : CLOSE_MS;
    const end = flightFrom(measure(from), target);

    const a = f.animate([{ transform: "translate(0px, 0px) scale(1)" }, { transform: end }], {
      duration: dur,
      easing: "cubic-bezier(.55,0,.25,1)",
      fill: "both",
    });
    s.animate([{ transform: spinAt(0) }, { transform: spinAt(reduce ? 0 : -360) }], {
      duration: dur,
      easing: EASE_SPIN,
      fill: "both",
    });
    b.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: dur,
      easing: "ease-in",
      fill: "both",
    });
    a.finished.then(finish).catch(() => {});
  }, [phase, from, target, finish]);

  /* block page scroll behind the lightbox; snap shut if the window resizes */
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const stop = (e: Event) => e.preventDefault();
    d.addEventListener("wheel", stop, { passive: false });
    d.addEventListener("touchmove", stop, { passive: false });
    window.addEventListener("resize", finish);
    return () => {
      d.removeEventListener("wheel", stop);
      d.removeEventListener("touchmove", stop);
      window.removeEventListener("resize", finish);
    };
  }, [finish]);

  const open = phase === "open";

  return (
    <dialog
      ref={dialog}
      aria-label={entry.card.displayName}
      // Esc: run the closing animation instead of vanishing instantly
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (!(e.target as Element).closest("[data-keep]")) close();
      }}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none overflow-visible border-0 bg-transparent p-0 text-foreground backdrop:bg-transparent"
    >
      <div
        ref={backdrop}
        aria-hidden
        className="absolute inset-0 bg-black/55"
        style={{
          backdropFilter: "grayscale(.85) brightness(.8)",
          WebkitBackdropFilter: "grayscale(.85) brightness(.8)",
        }}
      />

      {/* the drop-shadow filter lives here, on the outermost wrapper: a filter
          on the preserve-3d elements below would flatten the flip */}
      <div
        ref={flyer}
        data-keep
        className="fixed"
        style={{
          left: target.left,
          top: target.top,
          width: target.w,
          height: target.h,
          willChange: "transform",
          filter: MODAL_FILTER,
        }}
      >
        <div
          ref={spin}
          className="absolute inset-0"
          style={{ transformStyle: "preserve-3d", willChange: "transform" }}
        >
          <div ref={tilt} className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
            {/* front face: no clipping, glare masked to the art */}
            <div className="absolute inset-0" style={FACE}>
              <img
                src={entry.card.image}
                alt={entry.card.displayName}
                draggable={false}
                className="block h-full w-full"
              />
              <Shine foil mask={entry.card.image} />
            </div>

            {/* back face: only exists while the card is flying */}
            {phase !== "open" && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{
                  ...FACE,
                  borderRadius: RADIUS,
                  transform: "rotateY(180deg)",
                }}
              >
                <CardBack />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* details fade in once the card has landed */}
      <div
        data-keep
        className="fixed flex flex-col items-center gap-4 rounded-xl border border-line bg-card p-5 text-center text-card-foreground"
        style={{
          left: target.left + target.w / 2,
          top: target.top + target.h + 16,
          width: "min(92vw, 24rem)",
          transform: `translateX(-50%) translateY(${open ? 0 : 8}px)`,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity .25s ease, transform .25s ease",
        }}
      >
        <div>
          <h3 className="text-2xl font-bold">{entry.card.displayName}</h3>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            {entry.copies} {entry.copies === 1 ? "copy" : "copies"} in the deck
          </p>
          <p className="mt-3 text-muted-foreground">{entry.card.description}</p>
        </div>
        <button
          type="button"
          autoFocus
          onClick={close}
          className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground"
        >
          Close
        </button>
      </div>
    </dialog>
  );
}

/* -------------------------------- page ------------------------------ */

const Deck = () => {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<{
    entry: DeckEntry;
    from: HTMLElement;
  } | null>(null);

  const entries = useMemo(() => buildEntries(), []);

  const onOpen = useCallback(
    (entry: DeckEntry, from: HTMLElement) => setSelected({ entry, from }),
    [],
  );
  const onClosed = useCallback(() => setSelected(null), []);

  const q = query.trim().toLowerCase();
  const matches = ({ card }: DeckEntry) =>
    !q || card.displayName.toLowerCase().includes(q) || card.description.toLowerCase().includes(q);

  const sections = COLORS.filter((c) => filter === "all" || filter === c.id)
    .map((c) => ({
      ...c,
      entries: entries.filter((e) => e.card.kind !== "wild" && e.card.color === c.id && matches(e)),
    }))
    .filter((s) => s.entries.length > 0);

  const wilds =
    filter === "all" || filter === "wild"
      ? entries.filter((e) => e.card.kind === "wild" && matches(e))
      : [];

  const grid = "grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8";

  return (
    <main className="mx-auto w-full max-w-6xl px-6 pt-14 pb-24">
      <p className="text-xs font-bold tracking-widest text-primary">THE DECK</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Every card in the deck</h1>
      <p className="mt-2 text-muted-foreground">
        Filter by color or search by name. Click any card for details.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by color">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                filter === f.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-line bg-card text-foreground hover:bg-accent"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cards (e.g. swap, 7, draw)"
          aria-label="Search cards"
          className="w-full rounded-full border border-field bg-card px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground sm:w-72"
        />
      </div>

      {sections.map((s) => (
        <section key={s.id} className="mt-10" aria-labelledby={`h-${s.id}`}>
          <div className="mb-4 flex items-center gap-2">
            <span className={`size-3 rounded-full ${s.dot}`} aria-hidden />
            <h2 id={`h-${s.id}`} className="text-lg font-bold">
              {s.label}
            </h2>
            <span className="text-xs font-semibold text-muted-foreground">
              {s.entries.length} cards
            </span>
          </div>
          <div className={grid}>
            {s.entries.map((e) => (
              <CardButton
                key={e.card.name}
                entry={e}
                hidden={selected?.entry.card.name === e.card.name}
                onOpen={onOpen}
              />
            ))}
          </div>
        </section>
      ))}

      {wilds.length > 0 && (
        <section className="mt-10" aria-labelledby="h-wild">
          <div className="mb-4 flex items-center gap-2">
            <span className={`size-3 rounded-full ${WILD_DOT}`} aria-hidden />
            <h2 id="h-wild" className="text-lg font-bold">
              Wilds
            </h2>
            <span className="text-xs font-semibold text-muted-foreground">
              {wilds.length} cards
            </span>
          </div>
          <div className={grid}>
            {wilds.map((e) => (
              <CardButton
                key={e.card.name}
                entry={e}
                hidden={selected?.entry.card.name === e.card.name}
                onOpen={onOpen}
              />
            ))}
          </div>
        </section>
      )}

      {sections.length === 0 && wilds.length === 0 && (
        <p className="mt-16 text-center text-muted-foreground">
          No cards match “{query}”. Try a different name or number.
        </p>
      )}

      {selected && <Lightbox entry={selected.entry} from={selected.from} onClosed={onClosed} />}
    </main>
  );
};

export default Deck;
