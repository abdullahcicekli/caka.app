import { Link } from "react-router";

import type { LegalDocumentId } from "@caka/shared";
import { logoBlackText } from "~/assets/brand";
import { SocialIcon } from "~/components/icons/social";
import { LocaleSelect } from "~/components/locale-select";
import type { LandingContent, LegalAwareLink } from "~/content/landing";
import { ayarlarCatalog } from "~/content/ayarlar";
import { useCatalog } from "~/lib/locale";
import { useHref } from "~/lib/locale";

const LINK_CLASS = "text-[15px] text-murekkep hover:opacity-70";

/**
 * Uygulama içi route'lar client-side gezinir; anchor ve `mailto:` hedefleri
 * düz `<a>` kalır.
 */
function FooterLink({
  href,
  label,
  className = LINK_CLASS,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  const localize = useHref();
  if (href.startsWith("/")) {
    return (
      <Link to={localize(href)} className={className}>
        {label}
      </Link>
    );
  }
  // Dış hedefler (http, mailto) düz <a>; yeni sekmede açılanlara rel şart.
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      className={className}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {label}
    </a>
  );
}

/**
 * Public sayfaların ortak footer'ı (kullanıcı profil sayfaları hariç).
 * Üst köşeleri yuvarlak beyaz kart, bir üstteki renk bloğunun üzerine biner.
 *
 * `publishedLegal` loader'dan gelir: yayına hazır olmayan hukuki belgeye giden
 * bağlantılar (R33 kapısı onları prod'da 404'lüyor) gösterilmez.
 */
export function SiteFooter({
  footer,
  publishedLegal,
}: {
  footer: LandingContent["footer"];
  publishedLegal: readonly LegalDocumentId[];
}) {
  const localizeHome = useHref();
  const localeSelectLabel = useCatalog(ayarlarCatalog).language.fieldLabel;
  const isVisible = (link: LegalAwareLink) =>
    !link.legalDocument || publishedLegal.includes(link.legalDocument);

  return (
    <footer className="relative -mt-8 rounded-t-[2.5rem] bg-white">
      <div className="mx-auto max-w-7xl px-6 pt-14 pb-10 sm:px-10">
        {/* Sütun sayısı içerikten gelir (bugün iki sütun); sabit grid yerine
            wrap eden esnek yerleşim, sütun eklenip çıktığında boş track
            bırakmaz. */}
        <div className="flex flex-wrap gap-x-16 gap-y-10 sm:gap-x-24">
          {footer.columns.map((column) => {
            const links = column.links.filter(isVisible);
            // Tek bağlantısı da yayında değilse sütun başlığı tek başına
            // kalmasın (bugün "Yasal" için mümkün).
            if (links.length === 0) return null;
            return (
              <nav key={column.title} aria-label={column.title}>
                <h3 className="text-xs font-medium tracking-widest text-murekkep/50 uppercase">
                  {column.title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <FooterLink href={link.href} label={link.label} />
                    </li>
                  ))}
                </ul>
              </nav>
            );
          })}
        </div>

        {/* Güven alanı: her ifade kanıt sayfasına gider (R50). Rozet gibi
            görünmemesi bilinçli — çerçeve ve ikon yok, düz bağlantı. */}
        <ul className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2">
          {footer.trust.filter(isVisible).map((item) => (
            <li key={item.label}>
              <FooterLink
                href={item.href}
                label={item.label}
                className="text-sm text-murekkep/60 underline decoration-sinir underline-offset-4 hover:text-murekkep"
              />
            </li>
          ))}
        </ul>

        <hr className="mt-8 border-sinir" />

        <div className="mt-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={localizeHome("/")} aria-label="Caka ana sayfa">
              <img src={logoBlackText} alt="Caka" className="h-6 w-auto" />
            </Link>
            <span className="text-sm text-murekkep/50">{footer.copyright}</span>
          </div>
          <div className="flex items-center gap-3">
            {/* L18: oturumsuz ziyaretçinin dili değiştirebileceği tek yer —
                ayarlar sayfası giriş arkasında. */}
            <LocaleSelect
              label={localeSelectLabel}
              className="rounded-full border border-sinir bg-white px-3 py-1.5 text-sm text-murekkep"
            />
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
