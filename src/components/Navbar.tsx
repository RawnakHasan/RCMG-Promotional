import { useState } from "react";
import { Link, NavLink as RouterNavLink } from "react-router";
import { ModeToggle } from "@/components/ModeToggle";
import { Logo } from "./Brand";

type NavLinkProps = {
  name: string;
  href: string;
};

const NavLinks: NavLinkProps[] = [
  { name: "Home", href: "/" },
  { name: "The deck", href: "/deck" },
  { name: "Actions", href: "/actions" },
  { name: "Wilds", href: "/wilds" },
  { name: "Rules", href: "/rules" },
  { name: "Backs", href: "/backs" },
];

type NavbarProps = {
  onGetDeck?: () => void;
};

const Navbar = ({ onGetDeck }: NavbarProps) => {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-background/88 backdrop-blur-md">
      <div className="mx-auto flex h-19 max-w-[1384px] items-center gap-5 px-7">
        <Link
          to="/"
          aria-label="Mercy Deck home"
          className="flex items-center gap-3 text-[26px] font-bold"
        >
          <Logo variant="mark" className="text-xl" />
          <p className="shimmer">Mercy Deck</p>
        </Link>

        <nav
          aria-label="Main"
          className={`ml-auto flex gap-7.5 text-[17px] font-semibold text-muted-foreground max-[820px]:absolute max-[820px]:inset-x-0 max-[820px]:top-19 max-[820px]:m-0 max-[820px]:flex-col max-[820px]:gap-0 max-[820px]:border-b max-[820px]:border-line max-[820px]:bg-background max-[820px]:px-7 max-[820px]:pt-2 max-[820px]:pb-4 ${
            open ? "" : "max-[820px]:hidden"
          }`}
        >
          {NavLinks.map((link) => (
            <NavLink key={link.href} {...link} onClick={() => setOpen(false)} />
          ))}
        </nav>

        <button
          type="button"
          onClick={onGetDeck}
          className="inline-block cursor-pointer rounded-[14px] border-2 border-primary bg-primary px-4 py-[9px] text-[15px] font-bold text-primary-foreground transition-transform duration-150 hover:-translate-y-0.5 max-[820px]:hidden"
        >
          Get the deck
        </button>

        <div className="max-[820px]:ml-auto">
          <ModeToggle />
        </div>

        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="hidden size-11 cursor-pointer place-items-center rounded-[12px] border-2 border-line bg-transparent text-foreground max-[820px]:grid"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-[22px]"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Navbar;

const NavLink = ({ name, href, onClick }: NavLinkProps & { onClick?: () => void }) => {
  return (
    <RouterNavLink
      to={href}
      end={href === "/"}
      onClick={onClick}
      className={({ isActive }) =>
        `border-b-[3px] py-1.5 max-[820px]:py-3.5 ${
          isActive ? "border-red text-foreground" : "border-transparent hover:text-foreground"
        }`
      }
    >
      {name}
    </RouterNavLink>
  );
};
