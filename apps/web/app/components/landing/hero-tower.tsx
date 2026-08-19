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
const ROW_SECONDS = [78, 64, 92];

/**
 * Liste kaç kez basılır. ÜÇ, iki değil: animasyon `-100%/3` kadar kaydırıyor,
 * yani sarma anında ekranda kalan içerik listenin iki kopyası kadar oluyor.
 * İki kopyada kayma tek kopya eniydi ve satır o enden geniş her ekranda
 * (yani 1440'ta bile) sarma noktasında BOŞLUK gösteriyordu.
 */
const REPEAT = 3;

interface HeroTowerProps {
  media: LandingContent["hero"]["media"];
  tower: LandingContent["hero"]["tower"];
}

/**
 * Hero medyası: ürünün KENDİ kartlarından kurulmuş, YATAY akan bento
 * satırları.
 *
 * Kartlar `ProfileBlockCard` — yani `/:username` sayfasında çıkanın birebir
 * aynısı; landing'de gösterilen ile ürünün ürettiği ayrışamaz.
 *
 * MOZAİK: her satır eşit karolardan değil, SÜTUNLARDAN oluşur; bir sütun ya
 * tek büyük kart taşır ya da üst üste iki/üç küçük kart. Ölçüler ürünün
 * yarım birimli ızgarasının gerçek adımlarıdır (bkz. `hero-demo.ts`) ve her
 * kart `BLOCK_GRID_LIMITS` tabanına uyar — hiçbir kart hak etmediği kutuya
 * sıkıştırılmaz. Kartlar konteyner sorgusuyla çalıştığından aynı blok tipi
 * iki ölçüde iki farklı düzen gösterir; şerit bunu bilerek yapar.
 *
 * DEKORATİF VE ETKİLEŞİMSİZ: sarmalayıcı `inert` taşır, dolayısıyla
 * kartlardaki bağlantılar ne odak alır ne ekran okuyucuya okunur. Sonsuz
 * tekrarlanan onlarca bağlantı arasında Tab'lamak klavye kullanıcısı için
 * tuzak olurdu. Şeridin ne olduğunu bir `sr-only` cümle söyler.
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
            seconds={ROW_SECONDS[index] ?? 72}
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
  // Kesintisiz döngü: sütun listesi REPEAT kez basılır, animasyon bir
  // kopyalık mesafe kaydırıp başa sarar.
  const loop = Array.from({ length: REPEAT }, () => row.columns).flat();
  return (
    <div
      className="lp-tower-row"
      data-row={index}
      style={{ "--lp-tower-h": row.h } as CSSProperties}
    >
      <div
        className="lp-tower-run"
        style={{ "--lp-tower-seconds": `${seconds}s` } as CSSProperties}
      >
        {loop.map((column, position) => (
          <div
            key={`${column.cells[0]?.block.id ?? position}-${position}`}
            className="lp-tower-col"
            style={{ "--lp-tower-w": column.w } as CSSProperties}
          >
            {column.cells.map((cell) => (
              <div
                key={cell.block.id}
                className="lp-tower-cell profile-grid-item"
                style={{ "--lp-tower-ch": cell.h } as CSSProperties}
              >
                <ProfileBlockCard
                  block={cell.block}
                  githubCalendars={heroTowerCalendars}
                  signedImages={heroTowerImages}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
