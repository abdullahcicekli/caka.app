import { Link } from "react-router";

import type { LegalDocumentId } from "@caka/shared";
import { logoBlackText } from "~/assets/brand";
import { SocialIcon } from "~/components/icons/social";
import { LocaleSelect } from "~/components/locale-select";
import type { LandingContent, LegalAwareLink } from "~/content/landing";
import { ayarlarCatalog } from "~/content/ayarlar";
import { useCatalog, useHref } from "~/lib/locale";

/**
 * Uygulama içi route'lar client-side gezinir; anchor ve `mailto:` hedefleri
 * düz `<a>` kalır.
 */
function FooterLink({
  href,
  label,
  className = "lp-footer-link",
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
 * Üst köşeleri yuvarlak beyaz kart.
 *
 * `publishedLegal` loader'dan gelir: yayına hazır olmayan hukuki belgeye giden
 * bağlantılar (R33 kapısı onları prod'da 404'lüyor) gösterilmez.
 *
 * Referanstaki bülten aboneliği hap formu BURADA YOK: Caka'nın bülteni yok ve
 * olmayan bir akışın formunu koymak sahte özellik olurdu. Bir üstteki koyu
 * blokta zaten gerçek dönüşüm formu (adres kapma) duruyor; aynı formu iki kez
 * arka arkaya göstermek de gürültü olurdu.
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
    <footer className="lp-footer">
      <div className="lp-shell pt-14 pb-10">
        <div className="lp-footer-grid">
          <div>
            <Link to={localizeHome("/")} aria-label="Caka">
              <img src={logoBlackText} alt="Caka" width={92} height={24} />
            </Link>
            <p className="lp-body mt-4 max-w-[28ch] text-[14px]">
              {footer.tagline}
            </p>
          </div>

          {footer.columns.map((column) => {
            const links = column.links.filter(isVisible);
            // Tek bağlantısı da yayında değilse sütun başlığı tek başına
            // kalmasın (bugün "Yasal" için mümkün).
            if (links.length === 0) return null;
            return (
              <nav key={column.title} className="lp-footer-col" aria-label={column.title}>
                <h3>{column.title}</h3>
                <ul>
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
        <ul className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-2">
          {footer.trust.filter(isVisible).map((item) => (
            <li key={item.label}>
              <FooterLink
                href={item.href}
                label={item.label}
                className="text-sm text-murekkep/55 underline decoration-sinir underline-offset-4 hover:text-murekkep"
              />
            </li>
          ))}
        </ul>

        <hr className="mt-8 border-sinir" />

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <span className="text-sm text-murekkep/50">{footer.copyright}</span>
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
