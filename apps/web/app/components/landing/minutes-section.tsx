import { useRef, type CSSProperties } from "react";

import { PillLink } from "./pill-button";
import type { LandingContent } from "~/content/landing";
import {
  usePrefersReducedMotion,
  useScrollProgress,
  wordOffset,
} from "~/lib/landing-motion";
import { useHref } from "~/lib/locale";

/**
 * Sabitlenen ifade bölümü.
 *
 * Kelimeler önce dağınık durur; sayfa kaydıkça tek satıra toplanır, ardından
 * altındaki paragraf belirir. Koreografi tek bir CSS değişkenini (`--lp-p`)
 * okur; değişkeni `useScrollProgress` yazar.
 *
 * `prefers-reduced-motion: reduce` altında dinleyici kurulmaz ve `--lp-p`
 * CSS'teki varsayılanında (1) kalır: kelimeler zaten toplanmış, paragraf zaten
 * görünürdür. Yani bölüm hareket olmadan da tam okunur.
 *
 * Kelime ayrımı boşluktan yapılır; ekran okuyucu ve kopyala-yapıştır için
 * cümlenin tamamı `sr-only` olarak da basılır — kelime kelime bölünmüş bir
 * başlık bazı okuyucularda kopuk okunur.
 */
export function MinutesSection({
  minutes,
}: {
  minutes: LandingContent["minutes"];
}) {
  const localize = useHref();
  const reduced = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  useScrollProgress(containerRef, !reduced);

  const words = minutes.title.split(/\s+/).filter(Boolean);

  return (
    <section id="urun" ref={containerRef} className="lp-pinned">
      <div className="lp-pinned-sticky lp-shell">
        <h2 className="lp-h2">
          <span className="sr-only">{minutes.title}</span>
          <span className="lp-words" aria-hidden>
            {words.map((word, index) => {
              const offset = wordOffset(index, words.length);
              return (
                <span
                  key={`${word}-${index}`}
                  className="lp-word"
                  style={
                    {
                      "--lp-dx": offset.dx,
                      "--lp-dy": offset.dy,
                      "--lp-rot": offset.rot,
                    } as CSSProperties
                  }
                >
                  {word}
                </span>
              );
            })}
          </span>
        </h2>
        <div className="lp-pinned-body flex flex-col items-center gap-7">
          <p className="lp-body lp-measure">{minutes.body}</p>
          <PillLink to={localize(minutes.cta.href)} variant="ink">
            {minutes.cta.label}
          </PillLink>
        </div>
      </div>
    </section>
  );
}
