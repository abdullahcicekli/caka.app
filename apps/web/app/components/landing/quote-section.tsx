import type { LandingContent } from "~/content/landing";

/** Beyaz zemin: ortalanmış yatay oval avatar, alıntı ve isim/unvan. */
export function QuoteSection({ quote }: { quote: LandingContent["quote"] }) {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-8 lg:py-28">
        <div className="mx-auto aspect-[520/300] w-full max-w-[520px] overflow-hidden rounded-full">
          <img
            src={quote.image}
            alt={quote.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
        <h2 className="mx-auto mt-9 max-w-2xl text-3xl leading-[1.15] font-bold tracking-tight text-murekkep sm:text-4xl">
          {quote.quote}
        </h2>
        <p className="mt-5 text-[15px] text-murekkep/60">
          {quote.name}
          <br />
          {quote.role}
        </p>
      </div>
    </section>
  );
}