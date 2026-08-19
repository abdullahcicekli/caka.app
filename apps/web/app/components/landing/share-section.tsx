import { SplitCard } from "./split-card";
import type { LandingContent } from "~/content/landing";

/** Bölünmüş kart: solda metin, sağda paylaşım kartları illüstrasyonu. */
export function ShareSection({ share }: { share: LandingContent["share"] }) {
  return (
    <section className="lp-section-tight lp-shell">
      <SplitCard
        title={share.title}
        body={share.body}
        cta={share.cta}
        badges={share.badges}
        pill={share.pill}
        media={<img src={share.image} alt="" loading="lazy" decoding="async" />}
      />
    </section>
  );
}
