import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Link, useLocation } from "react-router";

import { logoBlackText } from "~/assets/brand";
import { ProfileAvatar } from "~/components/profile-avatar";
import { MenuAccountSection, type SessionUser } from "~/components/user-menu";
import { PillLink } from "./pill-button";
import { landingAssets } from "~/content/landing/shared";
import { appCatalog } from "~/content/app";
import type { NavContent } from "~/content/landing";
import { useCatalog, useHref } from "~/lib/locale";

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
 *
 * TEK KATMAN: oturum açıkken avatar da hamburger de AYNI paneli açar, hesap
 * satırları o panelin en üstünde durur. Eskiden avatar kendi Radix
 * dropdown'ını açıyordu; aynı köşeden iki ayrı katman çıkıyor ve kullanıcı
 * aradığı satırın hangisinde olduğunu tetikleyiciden kestiremiyordu.
 */
export function Navbar({ nav, user }: NavbarProps) {
  const localize = useHref();
  const app = useCatalog(appCatalog);
  const [open, setOpen] = useState(false);
  const avatarRef = useRef<HTMLButtonElement>(null);
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
  // zıplatırdı. Odak, katmanı EN SON açan tetikleyiciye döner — kullanıcı
  // avatardan açtıysa hamburgere atlamak yerini kaybettirirdi.
  const openerRef = useRef<RefObject<HTMLButtonElement | null>>(burgerRef);
  const closeMenu = useCallback(() => {
    setOpen(false);
    openerRef.current.current?.focus();
  }, []);
  const toggleFrom = useCallback((ref: RefObject<HTMLButtonElement | null>) => {
    openerRef.current = ref;
    setOpen((value) => !value);
  }, []);

  // Dizi KARARLI olmak zorunda: katmanın odak efektinin bağımlılığı bu.
  // Her render'da yeni bir dizi üretilseydi efekt sökülüp kurulur ve odak
  // ilk bağlantıya geri zıplardı. Bağımlılık `user` değil `hasUser`: `user`
  // nesnesi çağıranda satır içi kuruluyor, kimliği her render'da değişiyor.
  const hasUser = Boolean(user);
  const triggerRefs = useMemo(
    () => (hasUser ? [avatarRef, burgerRef] : [burgerRef]),
    [hasUser],
  );

  // Oturum açıkken "Giriş yap" satırı düşer: kullanıcı zaten girmiş, o satır
  // onu kendi hesabının olmadığı bir sayfaya yollardı. Eleme ADRESE göre,
  // etikete göre değil — etiket beş dilde farklı, adres tek.
  const menuLinks = useMemo(
    () =>
      hasUser
        ? nav.menu.links.filter((link) => link.href !== nav.login.href)
        : nav.menu.links,
    [hasUser, nav.menu.links, nav.login.href],
  );

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
            <button
              ref={avatarRef}
              type="button"
              className="lp-nav-avatar"
              aria-expanded={open}
              aria-controls={open ? menuId : undefined}
              aria-label={app.auth.accountMenu}
              onClick={() => toggleFrom(avatarRef)}
            >
              <ProfileAvatar
                name={user.name}
                avatarUrl={user.avatarUrl}
                className="size-10 text-sm"
              />
            </button>
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
            onClick={() => toggleFrom(burgerRef)}
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
          links={menuLinks}
          user={user ?? null}
          triggerRefs={triggerRefs}
          onClose={closeMenu}
        />
      ) : null}
    </header>
  );
}

const FOCUSABLE = 'a[href], button:not([disabled])';

/**
 * Menü katmanı: solda büyük bağlantı listesi, sağda medya kartı, altta meta
 * satırı. Oturum açıksa bağlantıların ÜSTÜNDE hesap bölümü.
 *
 * Erişilebilirlik: `role="dialog"` + `aria-modal`, açılışta ilk bağlantıya
 * odak, Tab katmanın içinde döner (odak tuzağı), Escape kapatır ve odağı
 * katmanı açan düğmeye geri verir. Perdeye tıklamak da kapatır.
 */
function MenuLayer({
  id,
  menu,
  links,
  user,
  triggerRefs,
  onClose,
}: {
  id: string;
  menu: NavContent["menu"];
  /** Gösterilecek bölüm bağlantıları — `menu.links`in oturuma göre elenmiş
      hâli (bkz. `Navbar`). */
  links: NavContent["menu"]["links"];
  user: SessionUser | null;
  /** Katmani acan hap dugmeleri (avatar, hamburger): odak dongusune DAHIL —
      katmanin gorunur kapatma denetimleri onlar ve klavyeyle de erisilebilir
      olmalilar. */
  triggerRefs: RefObject<HTMLButtonElement | null>[];
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

      // Hap düğmeleri de döngüye girer ve DOM SIRASINDA oldukları yere
      // konur: ikisi de panelden ÖNCE geliyor. Sona konsalardı ileri
      // yöndeki kenar onlar olurdu, son bağlantıdan Tab yakalanmaz ve odak
      // perdenin arkasındaki sayfaya kaçardı.
      const items = [
        ...triggerRefs.map((ref) => ref.current),
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
  }, [triggerRefs, onClose]);

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
          {/* Dekoratif kart SOLDA ve DOM'da da önce: bağlantı taşımadığı
              için okuma sırasını görsel sıraya eşitlemek odak sırasını
              bozmuyor — ilk odak yine listenin ilk bağlantısına gidiyor.
              Görsel `alt=""`, anlamı yanındaki metin taşıyor. */}
          <div className="lp-menu-card">
            <img src={landingAssets.menuImage} alt="" loading="lazy" />
            <strong>{menu.card.title}</strong>
            <span>{menu.card.body}</span>
          </div>
          <div className="lp-menu-col">
            {user ? <MenuAccountSection user={user} onNavigate={onClose} /> : null}
            <ul className="lp-menu-links">
              {links.map((link) => (
                <li key={link.href}>
                  <Link to={localize(link.href)} onClick={onClose}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
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
