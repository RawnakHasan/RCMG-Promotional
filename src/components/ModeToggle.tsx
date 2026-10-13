import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

type Theme = "light" | "dark" | "system";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Move focus into the menu when it opens (current theme first).
  useEffect(() => {
    if (!open) return;
    const current = OPTIONS.findIndex((o) => o.value === theme);
    itemRefs.current[current >= 0 ? current : 0]?.focus();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (value: Theme) => {
    setTheme(value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
    const index = items.indexOf(document.activeElement as HTMLButtonElement);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(index + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1]?.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
        className="relative inline-flex size-11 items-center justify-center rounded-md border-2 border-line bg-transparent text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <Sun
          strokeWidth={2.4}
          className="size-[22px] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
        />
        <Moon
          strokeWidth={2.4}
          className="absolute size-[22px] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
        />
        <span className="sr-only">Toggle theme</span>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Theme"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 z-50 mt-2 min-w-36 origin-top-right rounded-lg border border-line bg-card p-1 text-card-foreground shadow-lg"
        >
          {OPTIONS.map((option, i) => (
            <button
              key={option.value}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              type="button"
              role="menuitemradio"
              aria-checked={theme === option.value}
              onClick={() => choose(option.value)}
              className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-1.5 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
            >
              {option.label}
              {theme === option.value && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
