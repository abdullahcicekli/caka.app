import { SplitCard } from "./split-card";
import type { LandingContent } from "~/content/landing";

const BAR_HEIGHTS = [
  "30%",
  "52%",
  "40%",
  "66%",
  "54%",
  "78%",
  "62%",
  "88%",
  "70%",
  "96%",
];

/**
 * Analitik görseli tamamen dekoratiftir: ürünün bugün üretmediği hiçbir sayı
 * veya etiket taşımaz (R25). Ekran okuyucuya kapalıdır. Yükseklikler SABİT
 * tablodan gelir — rastgelelik olsaydı sunucu ve istemci çıktısı ayrışırdı.
 */
function AnalyticsIllustration() {
  return (
    <div
      aria-hidden
      className="absolute inset-x-4 top-1/2 flex h-[42%] -translate-y-1/2 items-end gap-[6px] rounded-xl bg-white p-5"
    >
      {BAR_HEIGHTS.map((height, index) => (
        <span
          key={index}
          className="flex-1 rounded-[3px] bg-kirec"
          style={{ height }}
        />
      ))}
    </div>
  );
}

/** Bölünmüş kart: geniş ekranda medya solda (ritim değişsin diye). */
export function AudienceSection({
  audience,
}: {
  audience: LandingContent["audience"];
}) {
  return (
    <section className="lp-section-tight lp-shell">
      <SplitCard
        mediaFirst
        title={audience.title}
        body={audience.body}
        cta={audience.cta}
        badges={audience.badges}
        pill={audience.pill}
        media={<AnalyticsIllustration />}
      />
    </section>
  );
}
