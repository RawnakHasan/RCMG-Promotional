import { useState } from "react";
import { CARD_BACK_NAMES, CARD_BACK_STORAGE_KEY, getCardBackImage } from "@/cards/cardBacks";

/* -------------------------------------------------------------------------- */
/* Data: public/cards/Card_Backs/Card_Back_01_Mercy_Oval.svg ... 11_Bolt.svg   */
/* -------------------------------------------------------------------------- */

const pad = (i: number) => String(i + 1).padStart(2, "0");

function readSavedBack(): number {
  try {
    const saved = Number(localStorage.getItem(CARD_BACK_STORAGE_KEY));
    return Number.isInteger(saved) && saved >= 0 && saved < CARD_BACK_NAMES.length ? saved : 0;
  } catch {
    return 0;
  }
}

function saveBack(index: number) {
  try {
    localStorage.setItem(CARD_BACK_STORAGE_KEY, String(index));
  } catch {
    // storage unavailable: the pick just won't persist
  }
}

/* -------------------------------------------------------------------------- */
/* Pieces                                                                      */
/* -------------------------------------------------------------------------- */

function BackImage({ index, className = "" }: { index: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const name = CARD_BACK_NAMES[index];

  return (
    <div
      className={`aspect-150/216 overflow-hidden shadow-[0_0_0_1px_var(--line),0_14px_28px_rgba(0,0,0,0.3)] ${className}`}
      style={{ borderRadius: "9.667% / 6.713%" }}
    >
      {failed ? (
        <div className="grid size-full place-items-center border-2 border-line bg-card p-2 text-center text-sm font-bold text-card-foreground">
          {name}
        </div>
      ) : (
        <img
          src={getCardBackImage(index)}
          alt={`${name} card back`}
          loading="lazy"
          onError={() => setFailed(true)}
          className="block size-full object-contain"
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function Backs() {
  const [selected, setSelected] = useState(readSavedBack);

  const choose = (index: number) => {
    setSelected(index);
    saveBack(index);
  };

  return (
    <section aria-labelledby="backs-heading" className="mx-auto max-w-6xl px-7 py-14">
      <h1 id="backs-heading" className="text-4xl leading-tight font-bold sm:text-5xl">
        Card backs
      </h1>
      <p className="mt-3 mb-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        Eleven backs to choose from. Click one to use it. Your pick is remembered in this browser.
      </p>

      <div className="mb-10 flex flex-wrap items-center gap-9 rounded-3xl border border-line bg-card p-7 text-card-foreground">
        <BackImage key={selected} index={selected} className="w-48 flex-none sm:w-60" />
        <div aria-live="polite">
          <p className="text-sm font-semibold text-muted-foreground">Your back</p>
          <h2 className="mt-1.5 mb-4 text-3xl font-bold sm:text-4xl">
            {CARD_BACK_NAMES[selected]}
          </h2>
          <p className="max-w-sm text-lg leading-relaxed text-muted-foreground">
            This back goes on every card in the deck.
          </p>
        </div>
      </div>

      <ul className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] justify-items-center gap-x-5 gap-y-7">
        {CARD_BACK_NAMES.map((name, i) => {
          const isSelected = i === selected;
          return (
            <li key={name} className="text-center">
              <button
                type="button"
                aria-pressed={isSelected}
                aria-label={`Use ${name} back`}
                onClick={() => choose(i)}
                className="group block rounded-2xl transition-transform hover:-translate-y-1.5 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-focus"
              >
                <BackImage
                  index={i}
                  className={`w-36 ${
                    isSelected ? "ring-4 ring-green ring-offset-4 ring-offset-background" : ""
                  }`}
                />
              </button>
              <p
                className={`mt-3 text-[15px] font-semibold ${
                  isSelected ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {pad(i)} {name}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
