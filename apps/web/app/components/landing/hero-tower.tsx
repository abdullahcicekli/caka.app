import { useState, type CSSProperties } from "react";

import type { ProfileTheme } from "@caka/shared";

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

/**
 * PERSONA BAŞINA TEMA — sütun ya da hücre başına DEĞİL.
 *
 * Tema profil düzeyinde bir özniteliktir: bir sayfanın tek teması olur. Şerit
 * dört personanın sayfa parçalarını akıtıyor ve aynı persona birden çok
 * sütunda geçiyor (Kerem üç kez, adı ve `@keremaydin` etiketiyle). Temayı
 * sütuna bağlasaydık aynı kişinin sayfası şeritte iki farklı temada görünür,
 * yani tam da bu şeritte bir kez düzeltilen kimlik tutarsızlığının (kadın
 * fotoğrafı taşıyan kartın "Kerem Aydın" diye etiketlenmesi) tema hâli
 * doğardı.
 *
 * RİTİM VERİDEN GELİR, rastgele değil: `hero-demo.ts` "yan yana ve üst üste
 * gelen kartlar farklı personalara aittir — satırın son sütunu ile ilk sütunu
 * da komşudur" kuralını zaten uyguluyor. Farklı persona ⇒ farklı tema
 * olduğundan komşu iki kart hiçbir yerde aynı temayı taşımıyor; döngü sarma
 * noktasında da taşımıyor.
 *
 * ZEMİN ARTIK KIRIK BEYAZ (`--color-tebesir`, #efebe1), fıstık yeşili değil.
 * Aşağıdaki bütün oranlar o zemine göre YENİDEN ölçüldü.
 *
 * DÖRT TEMA, ALTI DEĞİL — karışım değişmedi, gerekçesi ikiye katlandı:
 *
 *   1. Kart İÇİ metin. `light` ve `lavanta`nın ikincil metni (link kartındaki
 *      alan adı, sosyal karttaki handle) 4,22 ve 3,99 kontrastta kalıyor;
 *      12-13px metin için AA eşiği 4,5 (`docs/backlog.md` #15). Bu ölçüm kart
 *      yüzeyine göredir, yani şerit zemininden BAĞIMSIZ — zemin değişince
 *      geçersizleşmedi. Kalan dördü: metin 11,16-15,00 · ikincil 5,34-5,97.
 *   2. Kart yüzeyi ↔ zemin. `light`/`lavanta`nın beyaz kartı kırık beyaza
 *      1,19 ile oturuyor (fıstık yeşilinde 1,38 idi) — açık zeminde beyaz
 *      kart daha da kayboluyor, ikinci eleme sebebi. Dört koyu tema ise
 *      İYİLEŞTİ: dark 12,49 · ufuk 10,75 · neon 14,04 · zumrut 13,91
 *      (yeşil zeminde 10,74 / 9,25 / 12,08 / 11,97 idi).
 *
 * `dark`ın vurgusu `--color-kirec`'ti, yani ESKİ zeminin ta kendisi: durum
 * kartı zemine 1,00 ile oturuyor, hiç görünmüyordu. Zemin çekilince o kart
 * şeridin tek kireç lekesi oldu — kaybolan bir kart değil, bir vurgu.
 *
 * BİLİNEN SINIR (ÇÖZÜLDÜ, gerekçesi burada duruyor): durum kartı kart
 * yüzeyini değil VURGU degradesini basıyor ve hiçbir vurgu durağı kırık
 * beyaza 3:1 ile oturmuyor — dark 1,16/1,53 · zumrut 1,67/1,09 ·
 * neon 2,69/2,17/1,53 · ufuk 2,60/3,32. Her değer yeşil zemindekinden İYİ
 * ama çoğu hâlâ eşiğin altında. Tek zeminle renkle çözmek matematiksel
 * olarak mümkün değil: koyu kart yüzeylerinin 3:1'i açık, açık vurguların
 * 3:1'i koyu bir zemin ister. Bu yüzden kartın kenarı RENKLE değil ışıkla
 * çiziliyor: şerit kartlarına yalnız landing'de bir gölge veriliyor
 * (`.lp-tower .profile-block`, landing.css). Üründe gerek yok, orada kart
 * kendi tema zemininin üstünde duruyor.
 *
 * Eşleşmeler personanın kendi görsel dünyasını yankılar:
 *   Kerem  müzisyen, "Gece Yolu" (gece yolu, indigo-kömür)  → dark
 *   Selin  seramik  (toprak, kum, terracotta)               → ufuk
 *   Elif   podcast  "Sade Hayat" (adaçayı, okra, yulaf)     → zumrut
 *   Naz    seslendirme (koyu erik kabin, mor)               → neon
 */
const PERSONA_THEMES: Record<string, ProfileTheme> = {
  kerem: "dark",
  selin: "ufuk",
  elif: "zumrut",
  naz: "neon",
};

/**
 * Blok kimlikleri `demo-<persona>-<ne>` biçiminde (bkz. `hero-demo.ts`);
 * tema oradan okunur, hücreye ayrı bir alan eklenmez. Tanınmayan bir kimlik
 * gelirse sarmalayıcının teması geçerli kalır.
 */
const FALLBACK_THEME: ProfileTheme = "dark";

function personaTheme(blockId: string): ProfileTheme {
  return PERSONA_THEMES[blockId.split("-")[1] ?? ""] ?? FALLBACK_THEME;
}

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
        // Buradaki tema yalnız TABANDIR; her hücre personasının temasını
        // kendi üstüne yazar (bkz. `PERSONA_THEMES`).
        data-profile-theme={FALLBACK_THEME}
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
                // Tema HÜCREDE, sütunda değil: satır 2'nin bir sütunu iki
                // ayrı personanın durum kartını üst üste taşıyor (Kerem +
                // Selin), sütuna yazılan tema o kartlardan birini yanlış
                // temaya sokardı.
                data-profile-theme={personaTheme(cell.block.id)}
                style={{ "--lp-tower-ch": cell.h } as CSSProperties}
              >
                {/* GÖRSELLER HEMEN İNER. Şerit CSS `transform` ile
                    kaydırılıyor ve tarayıcı tembel görselleri dönüşümle
                    görünür alana giren öğeler için yeniden değerlendirmiyor:
                    kart kayıp gelse de boş kalıyordu (ölçüldü — görünür
                    alandaki üç kart hiç yüklenmemişti). Şerit zaten
                    katlamanın üstünde ve görülmek için var. */}
                <ProfileBlockCard
                  block={cell.block}
                  githubCalendars={heroTowerCalendars}
                  signedImages={heroTowerImages}
                  eagerImages
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
