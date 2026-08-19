import { ClaimForm } from "./claim-form";
import { HeroTower } from "./hero-tower";
import type { LandingContent } from "~/content/landing";

interface HeroProps {
  hero: LandingContent["hero"];
}

/**
 * Hero: küçük kicker → çok büyük başlık → tam genişlikte medya bloğu.
 *
 * MEKANİK: başlık bloğu `position: sticky`, medya normal akışta ve daha
 * yüksek katmanda. Kaydırınca başlık yerinde durur, medya üstüne biner.
 * Tamamen CSS — bu etki için tek satır JS yok (bkz. `landing.css`).
 *
 * MEDYA: stok portre şeridi değil, ürünün KENDİ kartlarından kurulmuş akan
 * sütunlar (`HeroTower`). Bir bio-link ürününün en güçlü kanıtı, ürettiği
 * sayfanın kendisidir; portreler de artık o kartların içinde yaşıyor.
 */
export function Hero({ hero }: HeroProps) {
  const [kickerTop, ...kickerRest] = hero.kicker.split("\n");

  return (
    <section id="hero" className="lp-hero lp-shell">
      <div className="lp-hero-head">
        <p className="lp-kicker">
          <span>{kickerTop}</span>
          {kickerRest.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
        <h1 className="lp-display lp-hero-title">{hero.title}</h1>
      </div>

      <HeroTower media={hero.media} tower={hero.tower} />

      {/* Medyanın altına binen hap. Referansta burada düz bir CTA düğmesi
          var; bir bio-link ürününde o hapın en değerli hâli adın orada talep
          edilmesidir — biçim aynı, iş Caka'nın. */}
      <div className="lp-hero-cta">
        <ClaimForm claim={hero.claim} />
      </div>
    </section>
  );
}
