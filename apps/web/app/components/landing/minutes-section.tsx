import { PhoneIllustration } from "./phone-illustration";
import { PillLink } from "./pill-button";
import type { LandingContent } from "~/content/landing";
import { useHref } from "~/lib/locale";

/** Mavi renk bloğu: solda telefon illüstrasyonu, sağda kireç başlık + CTA. */
export function MinutesSection({ minutes }: { minutes: LandingContent["minutes"] }) {
  const localize = useHref();
  return (
    <section id="urun" className="bg-mavi">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-20 sm:px-8 lg:grid-cols-2 lg:gap-10 lg:py-28">
        <div className="order-2 lg:order-1">
          <PhoneIllustration />
        </div>
        <div className="order-1 lg:order-2">
          <h2 className="text-5xl leading-[1.02] font-bold tracking-tight whitespace-pre-line text-kirec sm:text-6xl">
            {minutes.title}
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-zemin/90 sm:text-xl">
            {minutes.body}
          </p>
          <PillLink to={localize(minutes.cta.href)} variant="lime" className="mt-9">
            {minutes.cta.label}
          </PillLink>
        </div>
      </div>
    </section>
  );
}
