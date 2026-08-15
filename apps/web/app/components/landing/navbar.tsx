import { Link } from "react-router";

import { logoBlackText } from "~/assets/brand";
import { PillLink } from "./pill-button";
import type { Cta, NavItem } from "~/content/landing";

interface NavbarProps {
  items: readonly NavItem[];
  login: Cta;
  cta: Cta;
}

/** Lime hero'nun üstünde yüzen beyaz hap navbar. */
export function Navbar({ items, login, cta }: NavbarProps) {
  return (
    <header className="relative z-10 px-4 pt-6 sm:px-8">
      <nav className="mx-auto flex max-w-7xl items-center gap-8 rounded-full bg-white py-3 pr-3 pl-6 shadow-sm">
        <Link to="/" className="shrink-0" aria-label="Caka ana sayfa">
          <img src={logoBlackText} alt="Caka" className="h-7 w-auto" />
        </Link>

        <ul className="hidden items-center gap-7 md:flex">
          {items.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="text-base font-medium text-murekkep hover:opacity-70"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-3">
          <PillLink to={login.href} variant="soft" className="hidden sm:inline-flex">
            {login.label}
          </PillLink>
          <PillLink to={cta.href} variant="ink">
            {cta.label}
          </PillLink>
        </div>
      </nav>
    </header>
  );
}
