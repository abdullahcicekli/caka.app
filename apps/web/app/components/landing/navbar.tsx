import { Link } from "react-router";

import { logoBlackText } from "~/assets/brand";
import { UserMenu, type SessionUser } from "~/components/user-menu";
import { PillLink } from "./pill-button";
import type { Cta } from "~/content/landing";
import { useHref } from "~/lib/locale";

interface NavbarProps {
  login: Cta;
  cta: Cta;
  user?: SessionUser | null;
}

/** Lime hero'nun üstünde yüzen beyaz hap navbar. */
export function Navbar({ login, cta, user }: NavbarProps) {
  const localize = useHref();
  return (
    <header className="relative z-10 px-4 pt-6 sm:px-8">
      <nav className="mx-auto flex max-w-7xl items-center gap-8 rounded-full bg-white py-3 pr-3 pl-6 shadow-sm">
        <Link to={localize("/")} className="shrink-0" aria-label="Caka ana sayfa">
          <img src={logoBlackText} alt="Caka" className="h-7 w-auto" />
        </Link>

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <PillLink to={localize(login.href)} variant="soft" className="hidden sm:inline-flex">
                {login.label}
              </PillLink>
              <PillLink to={localize(cta.href)} variant="ink">
                {cta.label}
              </PillLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
