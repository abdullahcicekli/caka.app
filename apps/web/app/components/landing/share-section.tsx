import { PillLink } from "./pill-button";
import type { LandingContent } from "~/content/landing";
import { useHref } from "~/lib/locale";

/** Cam renk bloğu: solda seftali başlık + CTA, sağda kart görseli. */
export function ShareSection({ share }: { share: LandingContent["share"] }) {
  const localize = useHref();
  return (
    <section className="bg-cam">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-20 sm:px-8 lg:grid-cols-2 lg:gap-10 lg:py-28">
        <div>
          <h2 className="text-5xl leading-[1.02] font-bold tracking-tight whitespace-pre-line text-seftali sm:text-6xl">
            {share.title}
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-cam-acik sm:text-xl">
            {share.body}
          </p>
          <PillLink to={localize(share.cta.href)} variant="seftali" className="mt-9">
            {share.cta.label}
          </PillLink>
        </div>
        <div>
          <img
            src={share.image}
            alt=""
            loading="lazy"
            className="mx-auto w-full max-w-[520px]"
          />
        </div>
      </div>
    </section>
  );
}