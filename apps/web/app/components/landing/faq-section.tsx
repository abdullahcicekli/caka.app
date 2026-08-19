import { NavArrowDown } from "iconoir-react";
import { Link } from "react-router";

import type { LegalDocumentId } from "@caka/shared";
import type { LandingContent } from "~/content/landing";
import { useHref } from "~/lib/locale";

/**
 * SSS: solda etiket sütunu, sağda ince çizgilerle ayrılmış akordeon.
 *
 * Akordeon `<details>/<summary>` — açılıp kapanması, klavye erişimi ve
 * sayfa-içi arama (Ctrl+F) tarayıcının kendi işi; JS yok.
 *
 * `publishedLegal` loader'dan gelir: cevabın dayandığı hukuki belge yayına
 * hazır değilse bağlantı gösterilmez (kapı prod'da 404 veriyor). Cevabın metni
 * bağlantısız da tam okunur.
 */
export function FaqSection({
  faq,
  publishedLegal,
}: {
  faq: LandingContent["faq"];
  publishedLegal: readonly LegalDocumentId[];
}) {
  const localize = useHref();
  return (
    <section id="sss" className="lp-section lp-shell">
      <div className="lp-faq">
        <div>
          <p className="lp-eyebrow">{faq.label}</p>
          <h2 className="lp-h3 mt-3">{faq.title}</h2>
        </div>
        <div>
          {faq.items.map((item) => {
            const link =
              item.link &&
              (!item.link.legalDocument ||
                publishedLegal.includes(item.link.legalDocument))
                ? item.link
                : null;
            return (
              <details key={item.question} className="lp-faq-item">
                <summary>
                  {item.question}
                  <NavArrowDown aria-hidden width={20} height={20} />
                </summary>
                <p className="lp-faq-answer">
                  {item.answer}
                  {link ? (
                    <>
                      {" "}
                      <Link
                        to={localize(link.href)}
                        className="font-medium text-murekkep underline underline-offset-4 hover:opacity-70"
                      >
                        {link.label}
                      </Link>
                    </>
                  ) : null}
                </p>
              </details>
            );
          })}
        </div>
      </div>
    </section>
  );
}
