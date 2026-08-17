import { ChevronDownIcon } from "lucide-react";
import { Link } from "react-router";

import type { LegalDocumentId } from "@caka/shared";
import type { LandingContent } from "~/content/landing";

/**
 * SSS: erik renk bloğu, ortalanmış başlık + açılır-kapanır soru kartları.
 *
 * `publishedLegal` loader'dan gelir: cevabın dayandığı hukuki belge yayına
 * hazır değilse bağlantı gösterilmez (kapı prod'da 404 veriyor). Cevabın metni
 * bağlantısız da tam okunur.
 */
export function FaqSection({
  faq,
  publishedLegal,
}: {
  faq: LandingContent["faq"];
  publishedLegal: readonly LegalDocumentId[];
}) {
  return (
    <section className="bg-erik">
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-8 lg:py-28">
        <h2 className="text-4xl leading-[1.05] font-bold tracking-tight text-erik-acik sm:text-5xl">
          {faq.title}
        </h2>
        <div className="mx-auto mt-9 flex max-w-2xl flex-col gap-3 text-left">
          {faq.items.map((item) => {
            const link =
              item.link &&
              (!item.link.legalDocument ||
                publishedLegal.includes(item.link.legalDocument))
                ? item.link
                : null;
            return (
              <details
                key={item.question}
                className="group rounded-2xl bg-erik-koyu"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-lg font-semibold text-erik-beyaz">
                  {item.question}
                  <ChevronDownIcon
                    aria-hidden
                    className="size-5 flex-none text-erik-acik transition-transform group-open:rotate-180"
                  />
                </summary>
                <p className="px-6 pb-5 text-[15px] leading-relaxed text-erik-beyaz/80">
                  {item.answer}
                  {link ? (
                    <>
                      {" "}
                      <Link
                        to={link.href}
                        className="font-semibold text-erik-acik underline underline-offset-4 hover:opacity-80"
                      >
                        {link.label}
                      </Link>
                    </>
                  ) : null}
                </p>
              </details>
            );
          })}
        </div>
      </div>
    </section>
  );
}