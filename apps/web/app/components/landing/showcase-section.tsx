import { NavArrowLeft, NavArrowRight } from "iconoir-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { LandingContent } from "~/content/landing";
import { showcaseSlides } from "~/content/landing";
import { usePrefersReducedMotion } from "~/lib/landing-motion";

/**
 * Yatay kart karuseli + segment kontrolü.
 *
 * KAYDIRMA NATIVE: `overflow-x: auto` + `scroll-snap`. Kütüphane yok, sürükle
 * taklidi yok — dokunmatik ivmesi, kaydırma çubuğu ve klavye davranışı
 * tarayıcının kendi işi.
 *
 * KLAVYE: kaydırma kabı `tabindex="0"` ile odaklanabilir (odaklanınca ok
 * tuşları kabı kaydırır) ve ayrıca ← → düğmeleriyle segment düğmeleri var.
 * Segmentler `tablist` semantiğinde DEĞİL — sekme değiller, aynı şeridin
 * içindeki bir karta atlatan kısayollar; bu yüzden düz düğme + `aria-selected`
 * yerine `aria-current` kullanılır.
 *
 * HAREKET: kaydırma `smooth`, ama `prefers-reduced-motion: reduce` altında
 * anında (`auto`) atlar. Otomatik oynatma YOK.
 */
export function ShowcaseSection({
  showcase,
}: {
  showcase: LandingContent["showcase"];
}) {
  const reduced = usePrefersReducedMotion();
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  // Kart sayısı iki kaynağın kısası: metin katalogda (çevrilir), görsel
  // `shared.ts`'te (çevrilmez) ve ikisi sırayla eşlenir.
  const count = Math.min(showcase.cards.length, showcaseSlides.length);

  const scrollToIndex = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track) return;
      const card = track.children[index] as HTMLElement | undefined;
      if (!card) return;
      track.scrollTo({
        left: card.offsetLeft - track.offsetLeft,
        behavior: reduced ? "auto" : "smooth",
      });
    },
    [reduced],
  );

  // Görünen kartı işaretle: segment göstergesi kullanıcının elle kaydırmasını
  // da izlesin. IntersectionObserver, scroll dinleyicisinden ucuz.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const cards = [...track.children] as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        setActive(cards.indexOf(visible.target as HTMLElement));
      },
      { root: track, threshold: [0.5, 0.9] },
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [count]);

  const activeSegment = showcaseSlides[Math.min(active, count - 1)]?.segment;

  return (
    <section id="vitrin" className="lp-section">
      <div className="lp-shell">
        <h2 className="lp-h2">{showcase.title}</h2>
        <p className="lp-body lp-measure mt-5">{showcase.body}</p>
      </div>

      <ul
        ref={trackRef}
        className="lp-track mt-10"
        tabIndex={0}
        aria-label={showcase.trackLabel}
      >
        {showcaseSlides.slice(0, count).map((slide, index) => {
          const card = showcase.cards[index];
          return (
            <li key={`${slide.segment}-${index}`} className="lp-slide">
              <div className="lp-slide-copy">
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </div>
              <div className="lp-slide-media" data-tint={slide.tint}>
                <img src={slide.image} alt="" loading="lazy" decoding="async" />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="lp-shell mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          className="lp-arrow"
          aria-label={showcase.prev}
          onClick={() => scrollToIndex(Math.max(0, active - 1))}
        >
          <NavArrowLeft aria-hidden width={18} height={18} />
        </button>

        <div className="lp-segments">
          {showcase.segments.map((segment) => {
            const target = showcaseSlides.findIndex(
              (slide) => slide.segment === segment.id,
            );
            const current = activeSegment === segment.id;
            return (
              <button
                key={segment.id}
                type="button"
                className="lp-segment"
                aria-current={current ? "true" : undefined}
                onClick={() => scrollToIndex(target < 0 ? 0 : target)}
              >
                {segment.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="lp-arrow"
          aria-label={showcase.next}
          onClick={() => scrollToIndex(Math.min(count - 1, active + 1))}
        >
          <NavArrowRight aria-hidden width={18} height={18} />
        </button>
      </div>
    </section>
  );
}
