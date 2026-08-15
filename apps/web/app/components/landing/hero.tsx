import { ClaimForm } from "./claim-form";
import { Showcase } from "./showcase";
import type { LandingContent } from "~/content/landing";

/** Lime renk bloğu: başlık + adres formu solda, vitrin kartları sağda. */
export function Hero({ hero }: { hero: LandingContent["hero"] }) {
  return (
    <section className="bg-kirec">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 pt-14 pb-16 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-20 lg:pb-24">
        <div className="flex flex-col justify-center">
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
        <Showcase items={hero.showcase} />
      </div>
    </section>
  );
}
