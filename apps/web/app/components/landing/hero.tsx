import { useState, type CSSProperties } from "react";

import { PillLink } from "./pill-button";
import type { Cta, LandingContent } from "~/content/landing";
import { usePrefersReducedMotion } from "~/lib/landing-motion";
import { useHref } from "~/lib/locale";

interface HeroProps {
  hero: LandingContent["hero"];
  cta: Cta;
}

/**
 * Hero: küçük kicker → çok büyük başlık → tam genişlikte medya bloğu.
 *
 * MEKANİK: başlık bloğu `position: sticky`, medya normal akışta ve daha
 * yüksek katmanda. Kaydırınca başlık yerinde durur, medya üstüne biner.
 * Tamamen CSS — bu etki için tek satır JS yok (bkz. `landing.css`).
 */
export function Hero({ hero, cta }: HeroProps) {
  const localize = useHref();
  const [kickerTop, ...kickerRest] = hero.kicker.split("\n");

  return (
    <section className="lp-hero lp-shell">
      <div className="lp-hero-head">
        <p className="lp-kicker">
          <span>{kickerTop}</span>
          {kickerRest.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
        <h1 className="lp-display lp-hero-title">{hero.title}</h1>
      </div>

      <HeroStrip media={hero.media} marquee={hero.marquee} />

      <div className="lp-hero-cta">
        <PillLink to={localize(cta.href)} variant="ink">
          {cta.label}
        </PillLink>
      </div>
    </section>
  );
}

/**
 * Medya bloğu: kireç zeminde yatay akan portre şeridi.
 *
 * PERFORMANS: blok sabit orana oturur, yani görseller yüklenirken sayfa
 * kaymaz (CLS). İlk iki görsel hemen yüklenir; kalanlar `lazy` ve dar ekranda
 * `hidden` — gizli ve tembel görsel indirilmez, mobil transferi yarıya düşer.
 *
 * HAREKET: liste kesintisiz döngü için iki kez basılır. Akış
 * `prefers-reduced-motion: reduce` altında CSS'te hiç kurulmaz ve ziyaretçi
 * her hâlükârda bir düğmeyle durdurabilir (WCAG 2.2.2 — 5 saniyeden uzun
 * süren otomatik hareketin durdurulabilir olması gerekir).
 */
function HeroStrip({
  media,
  marquee,
}: {
  media: LandingContent["hero"]["media"];
  marquee: LandingContent["hero"]["marquee"];
}) {
  const reduced = usePrefersReducedMotion();
  const [paused, setPaused] = useState(false);
  const loop = [...marquee.items, ...marquee.items];

  return (
    <div className="lp-hero-media">
      <div
        className="lp-hero-strip"
        style={
          {
            "--lp-strip-duration": `${marquee.durationSeconds}s`,
            // Duraklatma `animation-play-state` ile: sınıfı kaldırmak
            // animasyonu başa sardırır, şerit zıplardı.
            "--lp-strip-state": paused ? "paused" : "running",
          } as CSSProperties
        }
      >
        {loop.map((item, index) => (
          <img
            key={`${item.image}-${index}`}
            src={item.image}
            alt=""
            // İlk iki kare mobilde de görünür, o yüzden hemen yüklenir.
            // Kalanlar mobilde `display: none` + `lazy`: tarayıcı gizli
            // tembel görseli indirmez.
            loading={index < 2 ? "eager" : "lazy"}
            decoding="async"
            className={index < 2 ? undefined : "is-extra"}
          />
        ))}
      </div>
      {/* Şeridi durdurma düğmesi. `reduced` true iken CSS animasyonu zaten
          yok; düğme de anlamsızlaşır ve gizlenir. */}
      {reduced ? null : (
        <button
          type="button"
          className="lp-strip-toggle"
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? media.play : media.pause}
        </button>
      )}
      <span className="sr-only">{media.alt}</span>
    </div>
  );
}
