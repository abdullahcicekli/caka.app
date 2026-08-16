import { ClaimForm } from "./claim-form";
import type { LandingContent } from "~/content/landing";

/** Kapanış CTA'sı: mor renk bloğu, lila başlık, adres formu + lime buton. */
export function CtaSection({ cta }: { cta: LandingContent["closingCta"] }) {
  return (
    <section className="bg-mor">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 pt-20 pb-28 text-center sm:px-8">
        <h2 className="text-4xl leading-[1.05] font-bold tracking-tight whitespace-pre-line text-mor-acik sm:text-5xl">
          {cta.title}
        </h2>
        <div className="mt-10 w-full max-w-xl">
          <ClaimForm claim={cta.claim} buttonVariant="lime" />
        </div>
      </div>
    </section>
  );
}
