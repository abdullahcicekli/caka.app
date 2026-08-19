import { ClaimForm } from "./claim-form";
import type { LandingContent } from "~/content/landing";

/**
 * Koyu kapanış bloğu: mürekkep zemin, beyaz başlık, kireç vurgulu satır ve
 * adres formu.
 *
 * Referanstaki blokta düz bir hap düğme var; burada onun yerine adres formu
 * duruyor — ziyaretçi tek adımda hem adını seçiyor hem kayda giriyor, bu
 * ürünün gerçek dönüşüm yolu.
 */
export function CtaSection({ cta }: { cta: LandingContent["closingCta"] }) {
  return (
    <section className="lp-section-tight lp-shell">
      <div className="lp-dark">
        <h2 className="lp-h2">{cta.title}</h2>
        <p className="lp-dark-accent">{cta.accent}</p>
        <div className="w-full max-w-xl">
          <ClaimForm claim={cta.claim} buttonVariant="lime" />
        </div>
      </div>
    </section>
  );
}
