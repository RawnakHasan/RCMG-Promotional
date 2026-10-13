/* eslint-disable react-refresh/only-export-components */

/**
 * MercyCards.jsx
 * The Mercy Deck card faces as React components + the data for every card the
 * homepage shows. Pure SVG + Tailwind v4 utilities, no dangerouslySetInnerHTML.
 *
 * Colours inside cards are fixed brand colours (they do not change with the
 * light/dark theme). Colored cards pass their colour down as the CSS variable
 * `--k`, which the cut-out card shapes inside icons use for their fill.
 */

import type { CSSProperties, ReactNode } from "react";

export const INK = "#1d2a24";
const CREAM = "#FFF6E3";
const FONT = "Fredoka, system-ui, sans-serif";
export const COLORS = ["red", "yellow", "green", "blue"] as const;
export type CardColor = (typeof COLORS)[number];
export const HEX: Record<CardColor, string> = {
  red: "#FF5A4D",
  yellow: "#FFC43D",
  green: "#2FB67C",
  blue: "#4C9BFF",
};
const WHEEL = `conic-gradient(${HEX.red} 0 25%, ${HEX.yellow} 0 50%, ${HEX.green} 0 75%, ${HEX.blue} 0)`;

/** Tailwind class: fill with the card's own colour (so shapes look cut out). */
const F = "fill-(--k)";

type CardFace = {
  corner: ReactNode;
  center: ReactNode;
  badge?: ReactNode;
  centerBg?: string;
};

export type CardItem =
  | {
      id: string;
      kind: "color";
      group: "num" | "classic" | "new";
      name: string;
      desc: string;
      face: CardFace;
      stack?: string;
      copies?: number;
      core?: boolean;
    }
  | {
      id: string;
      kind: "wild";
      name: string;
      desc: string;
      face: CardFace;
      stack?: string;
      copies?: number;
      core?: boolean;
    }
  | {
      id: string;
      kind: "back";
      index: number;
      name: string;
      art: ReactNode;
    };

const asCSSVar = (value: string): CSSProperties & { [key: string]: string } => ({
  ["--k" as string]: value,
});

/* ------------------------------------------------------------------ */
/* SVG helpers                                                         */
/* ------------------------------------------------------------------ */

/** 64x64 line-icon canvas. `w`/`h` set the rendered size, `sw` the stroke. */
function Glyph({
  sw = 6,
  w = 24,
  h = w,
  vb = "0 0 64 64",
  className = "",
  style,
  children,
}: {
  sw?: number;
  w?: number;
  h?: number;
  vb?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox={vb}
      width={w}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`block overflow-visible ${className}`}
      style={style}
    >
      {children}
    </svg>
  );
}

/** 100x100 full-colour art canvas used by the wild specials (88px in a card). */
function Art({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width="88"
      height="88"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="block overflow-visible"
    >
      {children}
    </svg>
  );
}

/** Small card shapes piled up in a 106px canvas (core wilds). */
function Pile({
  w,
  h,
  s,
  cards,
}: {
  w: number;
  h: number;
  s: number;
  cards: Array<[number, number, number, string, string?]>;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width="106"
      height="106"
      aria-hidden="true"
      className="relative z-[1] block overflow-visible"
    >
      {cards.map(([x, y, r, fill, edge], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
          <rect
            x={-w / 2}
            y={-h / 2}
            width={w}
            height={h}
            rx="4.5"
            fill={fill}
            stroke={edge ?? INK}
            strokeWidth="2.5"
          />
          <circle r={+(w * 0.26).toFixed(1)} fill={CREAM} stroke={INK} strokeWidth="1.8" />
        </g>
      ))}
    </svg>
  );
}

/** Fanned stack of card outlines used by the Draw cards (92x90 in a card). */
function Stack({ angles, className = "" }: { angles: number[]; className?: string }) {
  return (
    <Glyph vb="0 0 48 44" sw={2} w={92} h={90} className={className}>
      {angles.map((a) => (
        <rect
          key={a}
          className={F}
          x="16"
          y="8"
          width="16"
          height="24"
          rx="3.5"
          transform={`rotate(${a} 24 40)`}
        />
      ))}
    </Glyph>
  );
}

/** Number text. 6 and 9 get the underline so they read the right way up. */
function Num({ n, small = false }: { n: number; small?: boolean }) {
  if (n !== 6 && n !== 9) return <>{n}</>;
  return (
    <span
      className={`block border-ink leading-[.8] ${small ? "border-b-[3px] pb-[3px]" : "border-b-[6px] pb-1.5"}`}
    >
      {n}
    </span>
  );
}

const REVERSE = "M12 40L40 12M26 12H40V26M52 24L24 52M24 38V52H38";

/** Same icon in the corner (24px) and the centre (64px) at different strokes. */
const icon = (cornerSw: number, centerSw: number, paths: ReactNode) => ({
  corner: <Glyph sw={cornerSw}>{paths}</Glyph>,
  center: (
    <Glyph sw={centerSw} w={64}>
      {paths}
    </Glyph>
  ),
});

const drawFace = (n: number, angles: number[]) => ({
  corner: `+${n}`,
  center: <Stack angles={angles} />,
});

/* ------------------------------------------------------------------ */
/* Procedural art                                                      */
/* ------------------------------------------------------------------ */

const polar = (cx: number, cy: number, r: number, a: number): [number, number] => [
  cx + r * Math.cos(a),
  cy + r * Math.sin(a),
];
const f1 = (n: number) => n.toFixed(1);

/** Colour roulette wheel (106px, sits on an ink-coloured centre). */
function Wheel() {
  const wedges = Array.from({ length: 8 }, (_, k) => {
    const a1 = -Math.PI / 2 + (k * Math.PI) / 4;
    const [x1, y1] = polar(50, 50, 36, a1);
    const [x2, y2] = polar(50, 50, 36, a1 + Math.PI / 4);
    return (
      <path
        key={k}
        d={`M50 50L${f1(x1)} ${f1(y1)}A36 36 0 0 1 ${f1(x2)} ${f1(y2)}Z`}
        fill={HEX[COLORS[k % 4]]}
        stroke={INK}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    );
  });
  const dots = Array.from({ length: 16 }, (_, k) => polar(50, 50, 44.5, (k * Math.PI) / 8));
  return (
    <svg
      viewBox="0 0 100 100"
      width="106"
      height="106"
      aria-hidden="true"
      className="block overflow-visible"
    >
      <circle cx="50" cy="50" r="52" fill={INK} />
      {dots.map(([x, y], i) => (
        <circle key={i} cx={f1(x)} cy={f1(y)} r="1.8" fill={CREAM} />
      ))}
      {wedges}
      <circle cx="50" cy="50" r="17" fill={INK} />
      <circle cx="50" cy="50" r="12" fill={CREAM} />
      <circle cx="50" cy="50" r="4.5" fill={HEX.red} />
      <circle cx="62.7" cy="26.2" r="4.5" fill="#fff" stroke={INK} strokeWidth="2" />
      <path
        d="M50 15L43.5 3H56.5Z"
        fill={CREAM}
        stroke={INK}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const WHEEL_CORNER = (
  <Glyph sw={7}>
    <path d="M32 32V8A24 24 0 0 1 56 32Z" fill={HEX.red} />
    <path d="M32 32H56A24 24 0 0 1 32 56Z" fill={HEX.yellow} />
    <path d="M32 32V56A24 24 0 0 1 8 32Z" fill={HEX.green} />
    <path d="M32 32H8A24 24 0 0 1 32 8Z" fill={HEX.blue} />
    <circle cx="32" cy="32" r="6" fill={CREAM} />
  </Glyph>
);

/** Angry-face cards for the alt-art roulette. `big` = the grey foreground trio. */
const FACE = {
  sm: {
    w: 24,
    h: 28,
    rx: 5.3,
    ex: 6,
    ey: -1,
    er: 2,
    sw: 1.7,
    brow: "M-9.6 -3.4L-3.6 -6.5M3.6 -6.5L9.6 -3.4M-6.0 6.5Q0 1.9 6.0 6.5",
  },
  lg: {
    w: 30,
    h: 34,
    rx: 6.6,
    ex: 7.5,
    ey: -1.2,
    er: 2.6,
    sw: 2.1,
    brow: "M-12.0 -4.2L-4.5 -8.1M4.5 -8.1L12.0 -4.2M-7.5 8.1Q0 2.4 7.5 8.1",
  },
};
function MadCard({
  x,
  y,
  r,
  fill,
  big = false,
}: {
  x: number;
  y: number;
  r: number;
  fill: string;
  big?: boolean;
}) {
  const f = big ? FACE.lg : FACE.sm;
  const line = big ? CREAM : INK;
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <rect
        x={-f.w / 2}
        y={-f.h / 2}
        width={f.w}
        height={f.h}
        rx={f.rx}
        fill={fill}
        stroke={line}
        strokeWidth="2.5"
      />
      <circle cx={-f.ex} cy={f.ey} r={f.er} fill={line} />
      <circle cx={f.ex} cy={f.ey} r={f.er} fill={line} />
      <path d={f.brow} stroke={line} strokeWidth={f.sw} strokeLinecap="round" fill="none" />
    </g>
  );
}

/** Two three-card hands for the Random Swapper. */
function Hand({ cx, colors }: { cx: number; colors: string[] }) {
  return [-18, 0, 18].map((a, i) => (
    <g key={a} transform={`rotate(${a} ${cx} 75.8) translate(${cx} 52)`}>
      <rect
        x="-9"
        y="-14"
        width="18"
        height="28"
        rx="4"
        fill={colors[i]}
        stroke={INK}
        strokeWidth="3.5"
      />
      <circle r="4.3" fill={CREAM} stroke={INK} strokeWidth="2" />
    </g>
  ));
}

/** Arrow with an ink outline and a coloured core. */
function Arrow({ d, head, color }: { d: string; head: string; color: string }) {
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth="11" />
      <path d={head} fill={INK} stroke={INK} strokeWidth="5" />
      <path d={d} fill="none" stroke={color} strokeWidth="6" />
      <path d={head} fill={color} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Card data                                                           */
/* ------------------------------------------------------------------ */

const NUM_DESC = "Play on a matching color or number.";

const PASS_BADGE = (
  <Glyph sw={7}>
    <path d="M14.4 24.9A19 19 0 0 1 48.1 21.9" />
    <path d="M53.9 31.3L55.3 17.4L40.9 26.4Z" fill="currentColor" strokeWidth="2" />
    <path d="M49.6 39.1A19 19 0 0 1 15.9 42.1" />
    <path d="M10.1 32.7L8.7 46.6L23.1 37.6Z" fill="currentColor" strokeWidth="2" />
  </Glyph>
);
const SWAP_BADGE = (
  <Glyph sw={7}>
    <path d="M10 22H50M40 12L50 22L40 32M54 42H14M24 32L14 42L24 52" />
  </Glyph>
);

const NUM_SPECIAL: Record<number, [string, string, ReactNode]> = {
  0: ["0 · Pass", "When played, every hand is passed along in the direction of play.", PASS_BADGE],
  7: ["7 · Swap", "Swap hands with another player.", SWAP_BADGE],
};

/** 0-9. Index in the array = the number. */
export const NUMBERS: CardItem[] = Array.from({ length: 10 }, (_, n) => {
  const [name, extra, badge] = NUM_SPECIAL[n] ?? [String(n), "", undefined];
  return {
    id: `n${n}`,
    kind: "color",
    group: "num",
    name,
    desc: extra ? `${NUM_DESC} ${extra}` : NUM_DESC,
    face: { corner: <Num n={n} small />, center: <Num n={n} />, badge },
  };
});

const classic = (id: string, name: string, desc: string, face: CardFace): CardItem => ({
  id,
  kind: "color",
  group: "classic",
  name,
  desc,
  face,
});

export const CLASSIC = [
  classic(
    "skip",
    "Skip",
    "The next player loses their turn.",
    icon(
      7,
      5,
      <>
        <circle cx="32" cy="32" r="23" />
        <path d="M16 16L48 48" />
      </>,
    ),
  ),
  classic("skip-all", "Skip All", "Every other player loses a turn, and you play again.", {
    corner: (
      <Glyph sw={6}>
        <path d="M46.3 9.1A27 27 0 1 1 16.5 9.9" />
        <path d="M25.5 3.6L11.6 2.9L21.4 16.8Z" fill="currentColor" strokeWidth="2" />
      </Glyph>
    ),
    center: (
      <Glyph sw={5} w={64}>
        <path d="M46.3 9.1A27 27 0 1 1 16.5 9.9" />
        <path d="M25.5 3.6L11.6 2.9L21.4 16.8Z" fill="currentColor" strokeWidth="2" />
      </Glyph>
    ),
  }),
  classic("reverse", "Reverse", "Reverse the direction of play.", icon(7, 5, <path d={REVERSE} />)),
  classic("draw-2", "Draw 2", "Next player draws 2.", drawFace(2, [-12, 12])),
  classic("draw-4", "Draw 4", "Next player draws 4.", drawFace(4, [-23, -7.7, 7.7, 23])),
  classic(
    "discard-all",
    "Discard All",
    "Discard every card of this card's color from your hand.",
    icon(
      6,
      4,
      <>
        {[-28, 0, 28].map((a) => (
          <rect
            key={a}
            className={F}
            x="24"
            y="5"
            width="16"
            height="26"
            rx="3.5"
            transform={`rotate(${a} 32 40)`}
          />
        ))}
        <path d="M32 40V55M24 47L32 55L40 47M14 60H50" />
      </>,
    ),
  ),
];

const action = (
  id: string,
  name: string,
  desc: string,
  stack: string,
  face: CardFace,
): CardItem => ({
  id,
  kind: "color",
  group: "new",
  name,
  desc,
  stack,
  face,
});

const PULL_ARCH = "M16 26A16 16 0 0 1 48 26M16 26V38M48 26V38";
const TRADE_ARROW = (
  <>
    <path d="M20 14Q32 0 44 14" />
    <path d="M43 6.5L44 14L36.5 11.5" />
  </>
);

/** The seven new action types, in deck order. */
export const NEW_ACTIONS = [
  action("draw-3", "Draw 3", "Next player draws 3.", "Yes", drawFace(3, [-18, 0, 18])),
  action(
    "reverse-draw-2",
    "Reverse Draw 2",
    "Reverse direction. The next player in the new direction draws 2.",
    "Yes",
    {
      corner: "+2",
      center: (
        <>
          <Glyph sw={6} w={104} className="absolute top-1/2 left-1/2 -mt-[52px] -ml-[52px]">
            <path d={REVERSE} />
          </Glyph>
          <Stack angles={[-12, 12]} className="relative z-[1]" />
        </>
      ),
    },
  ),
  action("double-skip", "Double Skip", "Skip the next two players.", "No", {
    corner: (
      <Glyph sw={6}>
        <circle cx="22" cy="22" r="15" />
        <circle cx="40" cy="40" r="17" fill={CREAM} />
        <path d="M29 29L51 51" />
      </Glyph>
    ),
    center: (
      <Glyph sw={5} w={84}>
        <circle cx="24" cy="24" r="17" className={F} />
        <path d="M12 12L36 36" />
        <circle cx="40" cy="40" r="19" fill={CREAM} />
        <path d="M26.5 26.5L53.5 53.5" />
      </Glyph>
    ),
  }),
  action(
    "color-pull",
    "Color Pull",
    "Every other player gives you 1 card of this color. Players with none draw 1.",
    "No",
    {
      corner: (
        <Glyph sw={8}>
          <path d={PULL_ARCH} />
          <path d="M16 46V54M48 46V54" strokeWidth="6" />
        </Glyph>
      ),
      center: (
        <Glyph sw={5} w={64}>
          <path d={PULL_ARCH} strokeWidth="16" />
          <path d={PULL_ARCH} strokeWidth="9" style={{ stroke: "var(--k)" }} />
          <path d="M16 32V38M48 32V38" strokeWidth="9" stroke={CREAM} />
          {[
            [14, 54, -14],
            [32, 56, 0],
            [50, 54, 14],
          ].map(([x, y, r]) => (
            <rect
              key={x}
              className={F}
              x="-6"
              y="-8"
              width="12"
              height="16"
              rx="2.5"
              strokeWidth="2.5"
              transform={`translate(${x} ${y}) rotate(${r})`}
            />
          ))}
        </Glyph>
      ),
    },
  ),
  action(
    "trade-one",
    "Trade One",
    "Swap 1 card from your hand with 1 random card from any player.",
    "No",
    {
      corner: (
        <Glyph sw={6}>
          <rect x="3" y="18" width="16" height="28" rx="4" />
          <rect x="45" y="18" width="16" height="28" rx="4" />
          <path d="M24 27H40M35 22L40 27L35 32M40 38H24M29 33L24 38L29 43" strokeWidth="4.5" />
        </Glyph>
      ),
      center: (
        <Glyph sw={5} w={80}>
          <rect className={F} x="5" y="19" width="22" height="26" rx="4" />
          <rect x="37" y="19" width="22" height="26" rx="4" fill={INK} />
          <text
            x="48"
            y="38"
            textAnchor="middle"
            fontFamily={FONT}
            fontWeight="700"
            fontSize="20"
            fill={CREAM}
            stroke="none"
          >
            ?
          </text>
          {TRADE_ARROW}
          <g transform="rotate(180 32 32)">{TRADE_ARROW}</g>
        </Glyph>
      ),
    },
  ),
  action(
    "number-dump",
    "Number Dump",
    "Name a number. Discard all cards of that number from your hand.",
    "No",
    {
      corner: (
        <Glyph sw={6}>
          <path d="M10 16H54M22 16V8H42V16M14 16L18 58H46L50 16M26 28V46M38 28V46" />
        </Glyph>
      ),
      center: (
        <Glyph sw={5} w={64}>
          {[
            [14, 38, -14],
            [20, 34, -4],
            [26, 30, 8],
          ].map(([x, y, r]) => (
            <rect
              key={x}
              className={F}
              x="-10"
              y="-14"
              width="20"
              height="28"
              rx="4"
              transform={`translate(${x} ${y}) rotate(${r})`}
            />
          ))}
          <text
            x="26"
            y="36"
            textAnchor="middle"
            fontFamily={FONT}
            fontWeight="700"
            fontSize="17"
            fill="currentColor"
            stroke="none"
            transform="rotate(8 26 30)"
          >
            7
          </text>
          <path d="M40 34H60M46 34V29H54V34M42 34L44 58H56L58 34" />
          <path d="M26 12Q46 4 50 21M44 16L50 22L55 16" />
        </Glyph>
      ),
    },
  ),
  action(
    "lucky-flip",
    "Lucky Flip",
    "Flip the top card of the draw pile. If it matches this card's color, the next player draws 4. Otherwise they draw 1. Put the flipped card at the bottom of the pile.",
    "No",
    {
      corner: (
        <Glyph sw={6}>
          <g fill="currentColor" stroke="none">
            {[
              [22.5, 20.5],
              [41.5, 20.5],
              [22.5, 39.5],
              [41.5, 39.5],
            ].map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="10" />
            ))}
          </g>
          <path d="M32 34Q34 48 24 58" />
        </Glyph>
      ),
      center: (
        <Glyph sw={5} w={80}>
          <rect
            className={F}
            x="-14"
            y="-20"
            width="28"
            height="40"
            rx="5"
            transform="translate(32 32) rotate(-14)"
          />
          <g transform="translate(32 32) rotate(-14)" fill={INK} stroke="none">
            {[
              [-5.225, -8.225],
              [5.225, -8.225],
              [-5.225, 2.225],
              [5.225, 2.225],
            ].map(([x, y]) => (
              <circle key={`${x}${y}`} cx={x} cy={y} r="5.5" />
            ))}
          </g>
          <path d="M0 3Q0 10 -4 14" transform="translate(32 32) rotate(-14)" strokeWidth="3" />
          <path d="M2.5 26.8A30 30 0 0 1 42.3 3.8" />
          <path d="M51.7 7.2L45.0 -3.7L39.5 11.3Z" fill="currentColor" strokeWidth="2" />
          <path d="M61.5 37.2A30 30 0 0 1 21.7 60.2" />
          <path d="M12.3 56.8L19.0 67.7L24.5 52.7Z" fill="currentColor" strokeWidth="2" />
        </Glyph>
      ),
    },
  ),
];

const wild = (
  id: string,
  name: string,
  desc: string,
  stack: string,
  extra: { core?: boolean; copies?: number },
  face: CardFace,
): CardItem => ({
  id,
  kind: "wild",
  name,
  desc,
  stack,
  ...extra,
  face,
});

/** The five core wilds. */
export const CORE_WILDS = [
  wild(
    "wild-reverse-draw-4",
    "Wild Reverse Draw 4",
    "Reverse direction. The next player in the new direction draws 4.",
    "Yes",
    { core: true },
    {
      corner: "+4",
      center: (
        <>
          <Pile
            w={38}
            h={54}
            s={0.63}
            cards={[
              [44, 57, -16, HEX.yellow],
              [58, 55, 14, HEX.green],
              [46, 43, 9, HEX.blue],
              [56, 45, -10, HEX.red],
            ]}
          />
          <svg
            viewBox="0 0 64 64"
            width="112"
            height="112"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -mt-14 -ml-14"
          >
            <path d={REVERSE} stroke={INK} strokeWidth="14" />
            <path d={REVERSE} stroke={CREAM} strokeWidth="7" />
          </svg>
        </>
      ),
    },
  ),
  wild(
    "wild-draw-6",
    "Wild Draw 6",
    "Next player draws 6.",
    "Yes",
    { core: true },
    {
      corner: "+6",
      center: (
        <Pile
          w={32}
          h={46}
          s={0.87}
          cards={[
            [34, 34, -13, HEX.yellow],
            [66, 33, 11, HEX.green],
            [33, 62, 8, HEX.blue],
            [67, 64, -12, HEX.red],
            [50, 70, 15, INK, "#fff6e3"],
            [50, 46, -5, INK, "#fff6e3"],
          ]}
        />
      ),
    },
  ),
  wild(
    "wild-draw-10",
    "Wild Draw 10",
    "Next player draws 10.",
    "Yes",
    { core: true },
    {
      corner: "+10",
      center: (
        <Pile
          w={27}
          h={39}
          s={0.88}
          cards={[
            [26.6, 36.5, -15, HEX.blue],
            [50, 23, 9, HEX.green],
            [73.4, 36.5, 17, HEX.blue],
            [73.4, 63.5, -12, HEX.red],
            [50, 77, 11, HEX.yellow],
            [26.6, 63.5, -18, HEX.green],
            [42.2, 42.2, 7, INK, "#fff6e3"],
            [57.8, 42.2, -10, HEX.red],
            [57.8, 57.8, -6, HEX.yellow],
            [42.2, 57.8, 13, INK, "#fff6e3"],
          ]}
        />
      ),
    },
  ),
  wild(
    "wild-color-roulette",
    "Wild Color Roulette",
    "Name a color. The next player draws until they get that color.",
    "No",
    { core: true },
    {
      corner: WHEEL_CORNER,
      center: <Wheel />,
      centerBg: "bg-ink",
    },
  ),
  wild(
    "wild-color-roulette-alt",
    "Wild Color Roulette (alt art)",
    "Name a color. The next player draws until they get that color.",
    "No",
    { core: true },
    {
      corner: (
        <Glyph sw={6}>
          <rect x="8" y="8" width="48" height="48" rx="12" />
          <circle cx="21" cy="29" r="4.5" fill="currentColor" stroke="none" />
          <circle cx="43" cy="29" r="4.5" fill="currentColor" stroke="none" />
          <path strokeWidth="5" d="M13 22L25 16M39 16L51 22M22 46Q32 36 42 46" />
        </Glyph>
      ),
      center: (
        <svg
          viewBox="0 0 100 100"
          width="106"
          height="106"
          aria-hidden="true"
          className="relative z-[1] block overflow-visible"
        >
          <MadCard x={28} y={28} r={-18} fill={HEX.red} />
          <MadCard x={72} y={28} r={16} fill={HEX.yellow} />
          <MadCard x={72} y={72} r={-14} fill={HEX.green} />
          <MadCard x={28} y={72} r={18} fill={HEX.blue} />
          <MadCard big x={44} y={47} r={-14} fill="#6b7a73" />
          <MadCard big x={57} y={49} r={12} fill="#44524b" />
          <MadCard big x={50} y={57} r={-3} fill={INK} />
        </svg>
      ),
    },
  ),
];

/** The first six wild specials (the ones the homepage shows). */
export const WILD_SPECIALS = [
  wild(
    "wild-random-player-roulette",
    "Wild Random Player Color Roulette",
    "Name a color. A random player is chosen and must draw until they get that color.",
    "No",
    { copies: 2 },
    {
      corner: (
        <Glyph sw={6}>
          <path d="M28 38V16A22 22 0 0 1 50 38Z" fill={HEX.red} />
          <path d="M28 38H50A22 22 0 0 1 28 60Z" fill={HEX.yellow} />
          <path d="M28 38V60A22 22 0 0 1 6 38Z" fill={HEX.green} />
          <path d="M28 38H6A22 22 0 0 1 28 16Z" fill={HEX.blue} />
          <rect x="34" y="4" width="26" height="26" rx="7" fill={CREAM} />
          <circle cx="47" cy="17" r="3.2" fill="currentColor" stroke="none" />
        </Glyph>
      ),
      center: (
        <Art>
          <path d="M44 62L44 28A34 34 0 0 1 78 62Z" fill={HEX.red} />
          <path d="M44 62L78 62A34 34 0 0 1 44 96Z" fill={HEX.yellow} />
          <path d="M44 62L44 96A34 34 0 0 1 10 62Z" fill={HEX.green} />
          <path d="M44 62L10 62A34 34 0 0 1 44 28Z" fill={HEX.blue} />
          <path d="M44 28V96M10 62H78" stroke={INK} strokeWidth="3" />
          <circle cx="44" cy="62" r="34" fill="none" stroke={INK} strokeWidth="3.5" />
          <g transform="translate(68 30) rotate(14)">
            <rect
              x="-18"
              y="-18"
              width="36"
              height="36"
              rx="7.9"
              fill={CREAM}
              stroke={INK}
              strokeWidth="3.5"
            />
            {[
              [-9.7, -9.7],
              [9.7, -9.7],
              [0, 0],
              [-9.7, 9.7],
              [9.7, 9.7],
            ].map(([x, y]) => (
              <circle key={`${x}${y}`} cx={x} cy={y} r="2.7" fill={INK} />
            ))}
          </g>
        </Art>
      ),
    },
  ),
  wild(
    "wild-random-swapper",
    "Wild Random Swapper",
    "Choose two players (you may choose yourself). They swap hands.",
    "No",
    { copies: 1 },
    {
      corner: (
        <Glyph sw={7}>
          <path d="M10 22H50M40 12L50 22L40 32M54 42H14M24 32L14 42L24 52" />
        </Glyph>
      ),
      center: (
        <Art>
          <Hand cx={27} colors={[HEX.yellow, HEX.red, HEX.blue]} />
          <Hand cx={73} colors={[HEX.green, HEX.blue, HEX.red]} />
          <Arrow
            d="M17.2 27.1A40 40 0 0 1 82.8 27.1"
            head="M90.2 37.7L90.1 21.9L75.4 32.2Z"
            color={HEX.yellow}
          />
          <Arrow
            d="M82.8 72.9A40 40 0 0 1 17.2 72.9"
            head="M9.8 62.3L9.9 78.1L24.6 67.8Z"
            color={HEX.green}
          />
        </Art>
      ),
    },
  ),
  wild(
    "wild-draw-target",
    "Wild Draw Target",
    "Choose any player. They draw 4.",
    "No",
    { copies: 2 },
    {
      corner: (
        <Glyph sw={7}>
          <circle cx="32" cy="32" r="18" />
          <path d="M32 6V18M32 46V58M6 32H18M46 32H58" />
          <circle cx="32" cy="32" r="3.5" fill="currentColor" stroke="none" />
        </Glyph>
      ),
      center: (
        <Art>
          <g transform="translate(50 52) rotate(-8)">
            <rect
              x="-20"
              y="-28"
              width="40"
              height="56"
              rx="4"
              fill={HEX.blue}
              stroke={INK}
              strokeWidth="3.5"
            />
            <circle r="9.6" fill={CREAM} stroke={INK} strokeWidth="2" />
          </g>
          <g fill="none" stroke={INK} strokeWidth="10">
            <circle cx="50" cy="52" r="30" />
            <path d="M50 12V30M50 74V92M10 52H28M72 52H90" />
          </g>
          <g fill="none" stroke={HEX.red} strokeWidth="5">
            <circle cx="50" cy="52" r="30" />
            <path d="M50 12V30M50 74V92M10 52H28M72 52H90" />
          </g>
          <circle cx="50" cy="52" r="4" fill={HEX.red} stroke={INK} strokeWidth="2" />
        </Art>
      ),
    },
  ),
  wild(
    "wild-draw-everyone",
    "Wild Draw Everyone",
    "All other players draw 2.",
    "No",
    { copies: 2 },
    {
      corner: (
        <Glyph sw={7}>
          <path d="M46 32L60 32M41.9 41.9L51.8 51.8M32 46L32 60M22.1 41.9L12.2 51.8M18 32L4 32M22.1 22.1L12.2 12.2M32 18L32 4M41.9 22.1L51.8 12.2" />
          <circle cx="32" cy="32" r="6" fill="currentColor" stroke="none" />
        </Glyph>
      ),
      center: (
        <Art>
          {Array.from({ length: 8 }, (_, k) => (
            <rect
              key={k}
              x="-7.5"
              y="-11"
              width="15"
              height="22"
              rx="4"
              fill={HEX[COLORS[k % 4]]}
              stroke={INK}
              strokeWidth="3.5"
              transform={`rotate(${k * 45} 50 50) translate(50 19)`}
            />
          ))}
          <circle cx="50" cy="50" r="12" fill={CREAM} stroke={INK} strokeWidth="3.5" />
          <text
            x="50"
            y="56"
            textAnchor="middle"
            fontFamily={FONT}
            fontWeight="700"
            fontSize="16"
            fill={INK}
          >
            +2
          </text>
        </Art>
      ),
    },
  ),
  wild(
    "wild-gift",
    "Wild Gift",
    "Give any 3 cards from your hand to a player of your choice.",
    "No",
    { copies: 2 },
    {
      corner: (
        <Glyph sw={6}>
          <rect x="12" y="32" width="40" height="24" rx="3" />
          <rect x="8" y="23" width="48" height="10" rx="3" />
          <path d="M32 23V56M32 23C20 23 18 8 26 8C32 8 32 15 32 23C32 15 32 8 38 8C46 8 44 23 32 23Z" />
        </Glyph>
      ),
      center: (
        <Art>
          <g stroke={INK} strokeWidth="3.5">
            <rect x="20" y="48" width="60" height="42" rx="5" fill={HEX.blue} />
            <rect x="14" y="36" width="72" height="16" rx="5" fill={HEX.blue} />
            <rect x="43" y="36" width="14" height="54" fill={HEX.yellow} />
            <ellipse
              cx="38"
              cy="27"
              rx="14"
              ry="9"
              transform="rotate(-25 38 27)"
              fill={HEX.yellow}
            />
            <ellipse
              cx="62"
              cy="27"
              rx="14"
              ry="9"
              transform="rotate(25 62 27)"
              fill={HEX.yellow}
            />
            <circle cx="50" cy="32" r="6.5" fill={HEX.red} />
          </g>
        </Art>
      ),
    },
  ),
  wild(
    "wild-pickpocket",
    "Wild Pickpocket",
    "Take 2 random cards from any player's hand.",
    "No",
    { copies: 2 },
    {
      corner: (
        <Glyph sw={7}>
          <path d="M21 30V12Q21 8 25 8H39Q43 8 43 12V30" />
          <path d="M8 30H56V42C56 52 46 58 32 58C18 58 8 52 8 42Z" />
        </Glyph>
      ),
      center: (
        <Art>
          <g transform="translate(50 34) rotate(10)">
            <rect
              x="-14"
              y="-20"
              width="28"
              height="40"
              rx="4"
              fill={HEX.green}
              stroke={INK}
              strokeWidth="3.5"
            />
            <circle r="6.7" fill={CREAM} stroke={INK} strokeWidth="2" />
          </g>
          <g fill={CREAM} stroke={INK} strokeWidth="3.5">
            {[30, 42, 54].map((x) => (
              <rect key={x} x={x} y="44" width="12" height="38" rx="6" />
            ))}
            <rect x="20" y="50" width="12" height="30" rx="6" transform="rotate(35 26 70)" />
            <rect x="26" y="70" width="50" height="26" rx="13" />
          </g>
        </Art>
      ),
    },
  ),
];

/* ---------- card backs ---------- */

function BackSvg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 144 210" width="144" height="210" aria-hidden="true" className="block">
      {children}
    </svg>
  );
}

const back = (index: number, name: string, art: ReactNode): CardItem => ({
  id: `back-${index}`,
  kind: "back",
  index,
  name,
  art,
});

/** `index` is the card's position in the full set of 11 backs (what the site stores as the chosen back). */
export const BACKS = [
  back(
    0,
    "Mercy Oval",
    <BackSvg>
      <rect width="144" height="210" fill={INK} />
      <rect
        x="8"
        y="8"
        width="128"
        height="194"
        rx="10"
        fill="none"
        stroke={CREAM}
        strokeWidth="2.5"
      />
      <circle cx="22" cy="22" r="5" fill={HEX.red} />
      <circle cx="122" cy="22" r="5" fill={HEX.yellow} />
      <circle cx="22" cy="188" r="5" fill={HEX.green} />
      <circle cx="122" cy="188" r="5" fill={HEX.blue} />
      <ellipse
        cx="72"
        cy="105"
        rx="50"
        ry="78"
        fill={HEX.red}
        stroke={CREAM}
        strokeWidth="4"
        transform="rotate(24 72 105)"
      />
      <g transform="rotate(24 72 105)">
        <text
          x="72"
          y="101"
          textAnchor="middle"
          fontFamily={FONT}
          fontWeight="700"
          fontSize="30"
          fill={CREAM}
          stroke={INK}
          strokeWidth="5"
          paintOrder="stroke"
          strokeLinejoin="round"
        >
          NO
        </text>
        <text
          x="72"
          y="132"
          textAnchor="middle"
          fontFamily={FONT}
          fontWeight="700"
          fontSize="27"
          fill={CREAM}
          stroke={INK}
          strokeWidth="5"
          paintOrder="stroke"
          strokeLinejoin="round"
        >
          MERCY
        </text>
      </g>
    </BackSvg>,
  ),
  back(
    2,
    "Skull",
    <BackSvg>
      <rect width="144" height="210" fill={INK} />
      <circle cx="72" cy="105" r="66" fill={HEX.red} stroke={CREAM} strokeWidth="4" />
      <g fill={CREAM} stroke={INK} strokeWidth="3">
        <rect x="57" y="112" width="30" height="26" rx="7" />
        <circle cx="72" cy="94" r="32" />
      </g>
      <rect x="58.5" y="108" width="27" height="8" fill={CREAM} />
      <g fill={INK}>
        <circle cx="61" cy="96" r="8" />
        <circle cx="83" cy="96" r="8" />
        <path d="M72 106L67 116H77Z" />
      </g>
      <path
        d="M65 124V137M72 124V137M79 124V137"
        stroke={INK}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </BackSvg>,
  ),
  back(
    4,
    "Starburst",
    <BackSvg>
      <rect width="144" height="210" fill={INK} />
      {Array.from({ length: 16 }, (_, k) => {
        const a1 = -Math.PI / 2 + (k * Math.PI) / 8;
        const [x1, y1] = polar(72, 105, 160, a1);
        const [x2, y2] = polar(72, 105, 160, a1 + Math.PI / 8);
        return (
          <path
            key={k}
            d={`M72 105L${f1(x1)} ${f1(y1)}A160 160 0 0 1 ${f1(x2)} ${f1(y2)}Z`}
            fill={k % 2 ? INK : HEX[COLORS[(k / 2) % 4]]}
          />
        );
      })}
      <circle cx="72" cy="105" r="44" fill={INK} stroke={CREAM} strokeWidth="4" />
      <text
        x="72"
        y="101"
        textAnchor="middle"
        fontFamily={FONT}
        fontWeight="700"
        fontSize="21"
        fill={CREAM}
      >
        NO
      </text>
      <text
        x="72"
        y="123"
        textAnchor="middle"
        fontFamily={FONT}
        fontWeight="700"
        fontSize="18"
        fill={CREAM}
      >
        MERCY
      </text>
    </BackSvg>,
  ),
  back(
    10,
    "Bolt",
    <BackSvg>
      <rect width="144" height="210" fill={INK} />
      <circle cx="72" cy="105" r="70" fill={HEX.red} stroke={CREAM} strokeWidth="4" />
      <polygon
        points="82,40 44,112 68,112 58,172 102,96 78,96"
        fill={HEX.yellow}
        stroke={INK}
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </BackSvg>,
  ),
];

/* ------------------------------------------------------------------ */
/* Card component                                                      */
/* ------------------------------------------------------------------ */

const SHADOW =
  "shadow-[0_0_0_1px_var(--line),0_14px_28px_rgba(29,42,36,.18)] dark:shadow-[0_0_0_1px_var(--line),0_18px_36px_rgba(0,0,0,.5)]";

function Corner({ flip, children }: { flip?: boolean; children: ReactNode }) {
  return (
    <span
      className={`absolute flex flex-col items-center text-[28px] leading-none ${
        flip ? "right-3 bottom-2.5 rotate-180" : "top-2.5 left-3"
      }`}
    >
      {children}
    </span>
  );
}

function Badge({ flip, children }: { flip?: boolean; children: ReactNode }) {
  return (
    <span
      className={`absolute flex size-9 items-center justify-center rounded-full border-[3px] border-ink bg-[#FFF6E3] ${
        flip ? "bottom-[9px] left-[9px] rotate-180" : "top-[9px] right-[9px]"
      }`}
    >
      {children}
    </span>
  );
}

/**
 * Renders one card at its natural 150x216 size.
 * `item` comes from the arrays above; `color` is red | yellow | green | blue
 * (ignored by wilds and backs).
 */
export function Card({
  item,
  color = "red",
  className = "",
}: {
  item: CardItem;
  color?: CardColor;
  className?: string;
}) {
  const base = `relative h-[216px] w-[150px] flex-none rounded-2xl border-[3px] border-ink font-bold text-ink ${SHADOW} ${className}`;

  if (item.kind === "back") {
    return (
      <div className={`${base} overflow-hidden bg-ink`} style={asCSSVar(INK)}>
        {item.art}
      </div>
    );
  }

  const isWild = item.kind === "wild";
  const { corner, center, badge, centerBg = "bg-[#FFF6E3]" } = item.face;

  return (
    <div
      className={`${base} ${isWild ? "" : "bg-(--k)"}`}
      style={
        isWild
          ? ({ "--k": INK, background: WHEEL } as CSSProperties)
          : ({ "--k": HEX[color] } as CSSProperties)
      }
    >
      <Corner>{corner}</Corner>
      <Corner flip>{corner}</Corner>
      {badge && (
        <>
          <Badge>{badge}</Badge>
          <Badge flip>{badge}</Badge>
        </>
      )}
      <span
        className={`absolute top-1/2 left-1/2 flex size-[112px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-[3px] rounded-full border-[3px] border-ink text-center text-[82px] leading-none ${
          isWild ? "shadow-[0_0_0_5px_#1d2a24]" : ""
        } ${centerBg}`}
      >
        {center}
      </span>
    </div>
  );
}

/* ---------- labels used by the details dialog ---------- */

export function kindLabel(item: CardItem) {
  if (item.kind === "back") return "Card back";
  if (item.kind === "wild") return item.core ? "Core wild" : "Wild special";
  return item.group === "new"
    ? "New action"
    : item.group === "classic"
      ? "Classic action"
      : "Number";
}

export function metaLine(item: CardItem) {
  if (item.kind === "back") return "";

  const isColor = item.kind === "color";

  return [
    item.copies
      ? `${item.copies} cop${item.copies === 1 ? "y" : "ies"}`
      : isColor && item.group === "new"
        ? "1 per color"
        : "",
    item.stack ? `Stackable: ${item.stack}` : "",
    item.core || item.copies ? "50 pts" : isColor && item.group === "new" ? "20 pts" : "",
  ]
    .filter(Boolean)
    .join(" · ");
}
