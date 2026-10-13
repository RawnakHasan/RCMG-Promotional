/**
 * RCMG brand components (React + Tailwind v4).
 * Needs the tokens in index.css: ink, cream, brand-*, shadow-sticker.
 *
 * Logo size is controlled by font-size: everything is in em, so
 * <Logo className="text-5xl" /> scales the whole lockup.
 */
import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";

const cx = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(" ");

const TILE_COLORS = ["bg-brand-red", "bg-brand-yellow", "bg-brand-green", "bg-brand-blue"];

/* ---------- Logo ---------- */

/** One row of tilted letter cards. Colors cycle red, yellow, green, blue. */
export function LetterTiles({
  text,
  onYellow = false,
  className,
}: {
  text: string;
  /** On a yellow background the yellow tile switches to cream. */
  onYellow?: boolean;
  className?: string;
}) {
  return (
    <span aria-hidden="true" className={cx("inline-flex items-center gap-[.08em]", className)}>
      {Array.from(text).map((char, i) => (
        <span
          key={i}
          className={cx(
            "inline-flex h-[1.7em] w-[1.3em] items-center justify-center rounded-[.28em] border-[.09em] border-ink font-bold leading-none text-ink shadow-[.04em_.05em_0_var(--ink)] odd:-rotate-2 even:translate-y-[.03em] even:rotate-[1.6deg]",
            onYellow && i % 4 === 1 ? "bg-cream" : TILE_COLORS[i % 4],
          )}
        >
          {char}
        </span>
      ))}
    </span>
  );
}

export function Logo({
  variant = "wordmark",
  tagline = false,
  onYellow = false,
  className,
}: {
  variant?: "wordmark" | "mark";
  /** Shows CARD MATCHING GAME under the wordmark. Follows the theme, so it stays readable on dark. */
  tagline?: boolean;
  onYellow?: boolean;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label="Ruthless Card Matching Game"
      className={cx("inline-flex flex-col items-center text-4xl", className)}
    >
      <LetterTiles text={variant === "mark" ? "RCMG" : "RUTHLESS"} onYellow={onYellow} />
      {tagline && variant === "wordmark" && (
        <span
          aria-hidden="true"
          className="mt-[.5em] text-[.45em] font-bold leading-none tracking-[.2em] text-foreground"
        >
          CARD MATCHING GAME
        </span>
      )}
    </span>
  );
}

/* ---------- Buttons ---------- */

const BUTTON_TONES = {
  primary: "bg-primary text-primary-foreground border-ink",
  yellow: "bg-brand-yellow text-ink border-ink",
  plain: "bg-card text-card-foreground border-foreground",
};

export function StickerButton({
  tone = "primary",
  type = "button",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: keyof typeof BUTTON_TONES }) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-[3px] px-6 py-2.5 text-lg font-bold shadow-sticker transition-[transform,box-shadow] motion-reduce:transition-none active:translate-x-[3px] active:translate-y-[4px] active:shadow-none disabled:pointer-events-none disabled:opacity-50",
        BUTTON_TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

/* ---------- Game bits ---------- */

/** Room code shown as letter cards, with a copy button. */
export function RoomCode({ code, className }: { code: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the code stays visible to read out loud */
    }
  }

  return (
    <div className={cx("inline-flex flex-wrap items-center gap-4", className)}>
      <span role="img" aria-label={`Room code ${Array.from(code).join(" ")}`} className="text-3xl">
        <LetterTiles text={code} />
      </span>
      <StickerButton tone="plain" onClick={copy}>
        {copied ? "Copied" : "Copy code"}
      </StickerButton>
      <span role="status" className="sr-only">
        {copied ? "Room code copied" : ""}
      </span>
    </div>
  );
}

export function PlayerPill({
  name,
  index = 0,
  host = false,
}: {
  name: string;
  /** Picks the avatar color: 0 red, 1 yellow, 2 green, 3 blue. */
  index?: number;
  host?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2.5 rounded-full border-2 border-foreground bg-card py-1 pl-1 pr-4 font-semibold text-card-foreground">
      <span
        aria-hidden="true"
        className={cx(
          "grid size-9 place-items-center rounded-full border-[3px] border-ink font-bold text-ink",
          TILE_COLORS[index % 4],
        )}
      >
        {name.charAt(0).toUpperCase()}
      </span>
      {name}
      {host && <span className="text-sm font-medium text-muted-foreground">host</span>}
    </span>
  );
}

/* ---------- Theme ---------- */

/** Put this in <head> as an inline script so the page never flashes the wrong theme. */
export const themeInitScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* storage blocked: the theme just won't persist */
    }
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label="Dark mode"
      className="inline-flex size-11 items-center justify-center rounded-xl border-2 border-foreground bg-card text-card-foreground hover:bg-accent"
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {dark ? (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        )}
      </svg>
    </button>
  );
}

/* ---------- Site chrome ---------- */

export type NavLink = { href: string; label: string; current?: boolean };

/** Uses plain <a>. Swap for your router's Link if you want client-side navigation. */
export function SiteHeader({ links = [], actions }: { links?: NavLink[]; actions?: ReactNode }) {
  return (
    <header className="border-b border-line bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <a href="/" className="rounded-lg">
          <span className="sm:hidden">
            <Logo variant="mark" className="text-xl" />
          </span>
          <span className="hidden sm:inline">
            <Logo className="text-xl" />
          </span>
        </a>
        <div className="flex flex-wrap items-center gap-2">
          <nav aria-label="Main">
            <ul className="flex flex-wrap items-center gap-1">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    aria-current={link.current ? "page" : undefined}
                    className={cx(
                      "inline-flex min-h-11 items-center rounded-lg px-3 font-semibold hover:bg-accent",
                      link.current && "bg-accent",
                    )}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          {actions}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ children }: { children?: ReactNode }) {
  return (
    <footer className="border-t border-line bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8">
        <Logo variant="mark" className="text-lg" />
        <div className="text-sm text-muted-foreground">
          {children ?? "Ruthless Card Matching Game"}
        </div>
      </div>
    </footer>
  );
}
