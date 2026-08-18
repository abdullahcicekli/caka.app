import { PillLink } from "./pill-button";
import type { LandingContent } from "~/content/landing";
import { useHref } from "~/lib/locale";

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
const LIST_WIDTHS = ["88%", "64%", "42%"];
const CELL_OPACITIES = [
  0.25, 0.5, 0.35, 0.85, 0.45, 0.9, 0.3, 0.65, 0.55, 1, 0.4, 0.7,
];

/**
 * Bölümün solundaki analitik görseli tamamen dekoratiftir: ürünün bugün
 * üretmediği hiçbir sayı veya etiket taşımaz (R25). Ekran okuyucuya kapalıdır.
 */
function AnalyticsIllustration() {
  return (
    <div aria-hidden className="order-2 grid grid-cols-2 gap-4 lg:order-1">
      <div className="col-span-2 flex h-[136px] items-end gap-[6px] rounded-2xl bg-selvi p-6">
        {BAR_HEIGHTS.map((height, i) => (
          <span
            key={i}
            className="flex-1 rounded-[3px] bg-kirec"
            style={{ height }}
          />
        ))}
      </div>
      <div className="flex h-[136px] flex-col justify-center gap-3 rounded-2xl bg-erik-acik p-6">
        {LIST_WIDTHS.map((width, i) => (
          <span key={i} className="h-3 rounded-full bg-erik" style={{ width }} />
        ))}
      </div>
      <div className="grid h-[136px] grid-cols-4 content-center gap-2 rounded-2xl bg-mavi p-6">
        {CELL_OPACITIES.map((opacity, i) => (
          <span
            key={i}
            className="aspect-square rounded-[4px] bg-white"
            style={{ opacity }}
          />
        ))}
      </div>
    </div>
  );
}

/** Kum renk bloğu: solda dekoratif analitik görseli, sağda başlık + CTA. */
export function AudienceSection({
  audience,
}: {
  audience: LandingContent["audience"];
}) {
  const localize = useHref();
  return (
    <section className="bg-kum">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-20 sm:px-8 lg:grid-cols-2 lg:gap-10 lg:py-28">
        <AnalyticsIllustration />
        <div className="order-1 lg:order-2">
          <h2 className="text-5xl leading-[1.02] font-bold tracking-tight whitespace-pre-line text-murekkep sm:text-6xl">
            {audience.title}
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-murekkep/70 sm:text-xl">
            {audience.body}
          </p>
          <PillLink to={localize(audience.cta.href)} variant="ink" className="mt-9">
            {audience.cta.label}
          </PillLink>
        </div>
      </div>
    </section>
  );
}
