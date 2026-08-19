import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Link, useLocation } from "react-router";

import { logoBlackText } from "~/assets/brand";
import { UserMenu, type SessionUser } from "~/components/user-menu";
import { PillLink } from "./pill-button";
import { landingAssets } from "~/content/landing/shared";
import type { NavContent } from "~/content/landing";
import { useHref } from "~/lib/locale";

interface NavbarProps {
  nav: NavContent;
  user?: SessionUser | null;
}

/**
 * Sayfanın üstünde yüzen beyaz hap navbar (`position: sticky`).
 *
 * İki eylem + bir menü düğmesi taşır. Bölüm bağlantıları menü katmanındadır:
 * hap dar ekranda da tek satırda kalsın diye. Navbar hukuki sayfalarda da
 * render edilir, bu yüzden menüdeki çapalar mutlak yolla yazılıdır (`/#urun`).
 */
export function Navbar({ nav, user }: NavbarProps) {
  const localize = useHref();
  const [open, setOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const { pathname, hash } = useLocation();

  // Adres değişince menü kapanır: menüden bir bölüme gidildiğinde katmanın
  // açık kalması hedefi örterdi.
  useEffect(() => {
    setOpen(false);
  }, [pathname, hash]);

  // KARARLI olmak zorunda: katmanın odak efekti buna bağlı, satır içi bir
  // arrow her render'da efekti söküp kurar ve odağı ilk bağlantıya geri
  // zıplatırdı.
  const closeMenu = useCallback(() => {
    setOpen(false);
    burgerRef.current?.focus();
  }, []);

  return (
    <header className="lp-nav">
      <nav className="lp-nav-pill">
        <Link
          to={localize("/")}
          className="lp-nav-brand"
          aria-label="Caka"
        >
          <img src={logoBlackText} alt="Caka" width={92} height={24} />
        </Link>

        <div className="lp-nav-actions">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <PillLink
                to={localize(nav.login.href)}
                variant="soft"
                className="hidden sm:inline-flex"
              >
                {nav.login.label}
              </PillLink>
              <PillLink to={localize(nav.cta.href)} variant="ink">
                {nav.cta.label}
              </PillLink>
            </>
          )}
          <button
            ref={burgerRef}
            type="button"
            className="lp-burger"
            aria-expanded={open}
            // Katman kapaliyken bu id'li ogenin kendisi YOK; kirik bir
            // `aria-controls` birakmak yerine oznitelik hic basilmaz.
            aria-controls={open ? menuId : undefined}
            aria-label={open ? nav.menu.close : nav.menu.open}
            onClick={() => setOpen((value) => !value)}
          >
            <i aria-hidden />
            <i aria-hidden />
          </button>
        </div>
      </nav>

      {open ? (
        <MenuLayer
          id={menuId}
          menu={nav.menu}
          closeRef={burgerRef}
          onClose={closeMenu}
        />
      ) : null}
    </header>
  );
}

const FOCUSABLE = 'a[href], button:not([disabled])';

/**
 * Menü katmanı: solda büyük bağlantı listesi, sağda medya kartı, altta meta
 * satırı.
 *
 * Erişilebilirlik: `role="dialog"` + `aria-modal`, açılışta ilk bağlantıya
 * odak, Tab katmanın içinde döner (odak tuzağı), Escape kapatır ve odağı
 * hamburgere geri verir. Perdeye tıklamak da kapatır.
 */
function MenuLayer({
  id,
  menu,
  closeRef,
  onClose,
}: {
  id: string;
  menu: NavContent["menu"];
  /** Hamburger (acikken carpi): odak dongusune DAHIL — katmanin gorunur
      kapatma denetimi o ve klavyeyle de erisilebilir olmali. */
  closeRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const localize = useHref();
  const panelRef = useRef<HTMLDivElement>(null);

  // Katman acikken gövde kaydirilmaz: modal katmanin arkasindaki sayfanin
  // kaymasi baglami kaybettirir (ve iOS'ta katmani da suruklerdi).
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const first = panel.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      // Kapatma düğmesi de döngüye girer ve DOM SIRASINDA olduğu yere
      // konur: hamburger panelden ÖNCE geliyor. Sona konsaydı ileri yöndeki
      // kenar o olurdu, son bağlantıdan Tab yakalanmaz ve odak perdenin
      // arkasındaki sayfaya kaçardı.
      const items = [
        closeRef.current,
        ...panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ].filter((item): item is HTMLElement => item !== null);
      if (items.length === 0) return;
      const edge = event.shiftKey ? items[0] : items[items.length - 1];
      if (document.activeElement !== edge) return;
      event.preventDefault();
      (event.shiftKey ? items[items.length - 1] : items[0]).focus();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeRef, onClose]);

  return (
    <>
      {/* Perde yalnız kapatma yüzeyi: klavye kullanıcısı Escape'i kullanır,
          bu yüzden ekran okuyucuya kapalı ve odak almaz. */}
      <div className="lp-menu-scrim" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label={menu.label}
        className="lp-menu"
      >
        <div className="lp-menu-grid">
          <ul className="lp-menu-links">
            {menu.links.map((link) => (
              <li key={link.href}>
                <Link to={localize(link.href)} onClick={onClose}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          {/* Dekoratif kart: bağlantı değil, ürünün ne olduğunu gösteren
              tek görsel. Görsel `alt=""` — anlamı yanındaki metin taşıyor. */}
          <div className="lp-menu-card">
            <img src={landingAssets.menuImage} alt="" loading="lazy" />
            <strong>{menu.card.title}</strong>
            <span>{menu.card.body}</span>
          </div>
        </div>
        <p className="lp-menu-meta">
          {menu.meta.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </p>
      </div>
    </>
  );
}
