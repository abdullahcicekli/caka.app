import { useState, type CSSProperties } from "react";

import { ProfileBlockCard } from "~/components/profile-block";
import {
  heroTowerCalendars,
  heroTowerImages,
  heroTowerRows,
  type TowerRow,
} from "~/content/landing/hero-demo";
import type { LandingContent } from "~/content/landing";

/** Satır başına akış süresi. Farklı süreler şeride derinlik verir. */
const ROW_SECONDS = [64, 52, 76];

interface HeroTowerProps {
  media: LandingContent["hero"]["media"];
  tower: LandingContent["hero"]["tower"];
}

/**
 * Hero medyası: ürünün KENDİ kartlarından kurulmuş, YATAY akan bento
 * satırları.
 *
 * Stok fotoğraf şeridinin yerini aldı. Kartlar `ProfileBlockCard` — yani
 * `/:username` sayfasında çıkanın birebir aynısı; landing'de gösterilen ile
 * ürünün ürettiği ayrışamaz. Dört portre de artık bu kartların içinde
 * yaşıyor (bağlantı önizlemesi, video kapağı, albüm kapağı, sosyal önizleme).
 *
 * DEKORATİF VE ETKİLEŞİMSİZ: sarmalayıcı `inert` taşır, dolayısıyla
 * kartlardaki bağlantılar ne odak alır ne ekran okuyucuya okunur. Sonsuz
 * tekrarlanan onlarca bağlantı arasında Tab'lamak klavye kullanıcısı için
 * tuzak olurdu. Şeridin ne olduğunu bir `sr-only` cümle söyler.
 *
 * ÖLÇÜ: kartlar container query ile bant seçiyor ve `.profile-grid-item`
 * `container-type: size` istiyor — yani hücrenin KESİN genişliği ve
 * yüksekliği olmalı. İkisi de ızgaranın gerçek adımlarından geliyor
 * (178/368 × 156/240); kart ne sıkıştırılıyor ne geriliyor.
 *
 * HAREKET: akış yalnız `prefers-reduced-motion: no-preference` altında
 * kurulur (CSS); ayrıca her koşulda durdurma düğmesi var (WCAG 2.2.2).
 */
export function HeroTower({ media, tower }: HeroTowerProps) {
  const [paused, setPaused] = useState(false);
  const rows = heroTowerRows(tower);

  return (
    <div className="lp-hero-media">
      <div
        className="lp-tower"
        // Kartlar renklerini profil temasından okur (`[data-profile-theme]`).
        // `.profile-canvas` KULLANILMIYOR: o 100svh ve kendi zeminini getirir.
        data-profile-theme="light"
        // `inert`: içerideki bağlantılar odak almaz, ekran okuyucuya da
        // görünmez. Anlamı aşağıdaki `sr-only` cümle taşır.
        inert
        style={
          { "--lp-strip-state": paused ? "paused" : "running" } as CSSProperties
        }
      >
        {rows.map((row, index) => (
          <TowerRowView
            key={index}
            row={row}
            seconds={ROW_SECONDS[index] ?? 60}
            index={index}
          />
        ))}
      </div>
      <button
        type="button"
        className="lp-strip-toggle"
        onClick={() => setPaused((value) => !value)}
      >
        {paused ? media.play : media.pause}
      </button>
      <span className="sr-only">{media.alt}</span>
    </div>
  );
}

function TowerRowView({
  row,
  seconds,
  index,
}: {
  row: TowerRow;
  seconds: number;
  index: number;
}) {
  // Kesintisiz döngü: liste iki kez basılır, animasyon -%50'de başa sarar.
  const loop = [...row.cards, ...row.cards];
  return (
    <div className="lp-tower-row" data-row={index} data-h={row.height}>
      <div
        className="lp-tower-run"
        style={{ "--lp-tower-seconds": `${seconds}s` } as CSSProperties}
      >
        {loop.map((card, position) => (
          <div
            key={`${card.block.id}-${position}`}
            className="lp-tower-cell profile-grid-item"
            data-w={card.width}
          >
            <ProfileBlockCard
              block={card.block}
              githubCalendars={heroTowerCalendars}
              signedImages={heroTowerImages}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
