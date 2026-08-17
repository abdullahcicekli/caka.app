import { Link } from "react-router";

import { logoBlackText } from "~/assets/brand";
import { SocialIcon } from "~/components/icons/social";
import type { LandingContent } from "~/content/landing";

const LINK_CLASS = "text-[15px] text-murekkep hover:opacity-70";

/**
 * Uygulama içi route'lar client-side gezinir; anchor ve `mailto:` hedefleri
 * düz `<a>` kalır.
 */
function FooterLink({ href, label }: { href: string; label: string }) {
  if (href.startsWith("/")) {
    return (
      <Link to={href} className={LINK_CLASS}>
        {label}
      </Link>
    );
  }
  return (
    <a href={href} className={LINK_CLASS}>
      {label}
    </a>
  );
}

/**
 * Public sayfaların ortak footer'ı (kullanıcı profil sayfaları hariç).
 * Üst köşeleri yuvarlak beyaz kart, bir üstteki renk bloğunun üzerine biner.
 */
export function SiteFooter({ footer }: { footer: LandingContent["footer"] }) {
  return (
    <footer className="relative -mt-8 rounded-t-[2.5rem] bg-white">
      <div className="mx-auto max-w-7xl px-6 pt-14 pb-10 sm:px-10">
        {/* Sütun sayısı içerikten gelir (bugün iki sütun); sabit grid yerine
            wrap eden esnek yerleşim, sütun eklenip çıktığında boş track
            bırakmaz. */}
        <div className="flex flex-wrap gap-x-16 gap-y-10 sm:gap-x-24">
          {footer.columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 className="text-xs font-medium tracking-widest text-murekkep/50 uppercase">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink href={link.href} label={link.label} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <hr className="mt-12 border-sinir" />

        <div className="mt-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" aria-label="Caka ana sayfa">
              <img src={logoBlackText} alt="Caka" className="h-6 w-auto" />
            </Link>
            <span className="text-sm text-murekkep/50">{footer.copyright}</span>
          </div>
          <div className="flex items-center gap-3">
            {footer.social.map((item) => (
              <a
                key={item.platform}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
                className="flex size-10 items-center justify-center rounded-full bg-murekkep text-white transition-opacity hover:opacity-80"
              >
                <SocialIcon platform={item.platform} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
