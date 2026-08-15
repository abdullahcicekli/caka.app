import { ClaimForm } from "./claim-form";
import { HeroMarquee } from "./hero-marquee";
import type { LandingContent } from "~/content/landing";

/**
 * Lime renk bloğu: başlık + adres formu solda, sağda akan vitrin şeridi.
 * Şerit navbar'ın arkasına kadar uzanır (-top), bu yüzden section relative,
 * içerik z-10'da durur.
 */
export function Hero({ hero }: { hero: LandingContent["hero"] }) {
  return (
    <section className="relative bg-kirec">
      {/* Şerit, viewport'a değil ortalanmış içerik konteynerine hizalanır */}
      <div className="pointer-events-none absolute inset-x-0 -top-24 bottom-0">
        <div className="relative mx-auto h-full max-w-7xl">
          <HeroMarquee
            items={hero.marquee.items}
            durationSeconds={hero.marquee.durationSeconds}
          />
        </div>
      </div>
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-14 pb-16 sm:px-8 lg:pt-20 lg:pb-24">
        <div className="flex flex-col justify-center lg:max-w-[54%]">
          <h1 className="text-6xl leading-[0.95] font-bold tracking-tight whitespace-pre-line text-kirec-koyu sm:text-7xl xl:text-8xl">
            {hero.title}
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-kirec-koyu/90 sm:text-xl">
            {hero.body}
          </p>
          <div className="mt-10">
            <ClaimForm claim={hero.claim} />
          </div>
        </div>
      </div>
    </section>
  );
}
