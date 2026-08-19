import type { LandingContent } from "~/content/landing";
import { KARAKTER_KARTLARI } from "~/content/landing/vitrin";

/**
 * Karakter şeridi: altı kişi, altı meslek, altı renk dünyası.
 *
 * KAYDIRMA NATIVE — `ShowcaseSection` ile aynı `lp-track` kabı: `overflow-x:
 * auto` + `scroll-snap`, kütüphane yok. İki şeridin aynı kabı paylaşması
 * bilinçli: ziyaretçi sayfada iki farklı kaydırma davranışı öğrenmek zorunda
 * kalmıyor. Bu şeritte ok düğmeleri ve segmentler YOK — kartlar arasında
 * "gidilecek bir yer" yok, sadece bakılır; fazladan kontrol gürültü olurdu.
 *
 * ALTYAZI BURADA BASILIYOR, GÖRSELE GÖMÜLÜ DEĞİL: meslek adı beş dilde
 * değişir. Webp'e basılsaydı Almanca sayfada Türkçe bir altyazı dururdu.
 *
 * HEPSİ LAZY: şerit katlamanın çok altında ve LCP öğesi hero'nun başlığı
 * (ölçüldü: 1164 ms, `H1.lp-display` — bu bölüm eklendikten sonra da aynı).
 * İlk kartı eager yapmak LCP'yi iyileştirmiyor, yalnız ilk yüke 66 KB
 * ekliyordu; ölçülüp geri alındı.
 */
export function KarakterlerSection({
  karakterler,
}: {
  karakterler: LandingContent["karakterler"];
}) {
  return (
    <section id="karakterler" className="lp-section lp-anchor">
      <div className="lp-shell">
        <h2 className="lp-h2">{karakterler.title}</h2>
        <p className="lp-body lp-measure mt-5">{karakterler.body}</p>
      </div>

      <ul className="lp-track mt-10" tabIndex={0} aria-label={karakterler.trackLabel}>
        {KARAKTER_KARTLARI.map((kisi) => {
          const meslek = karakterler.jobs[kisi.job];
          return (
            <li key={kisi.id} className="lp-kisi">
              <div className="lp-kisi-media" style={{ backgroundColor: kisi.backdrop }}>
                {/* HAREKET TERCİHİ CSS'TE ÇÖZÜLÜR, JS'TE DEĞİL: `<source
                    media>` tarayıcıya tek bir dosya indirtir. Bir React
                    durumuyla değiştirseydik hareketsiz karar hidrasyondan
                    sonra gelir, o ana kadar animasyon çoktan inmiş olurdu —
                    hem fazladan istek hem de tercihin ihlali. */}
                <picture>
                  {kisi.loop ? (
                    <source srcSet={kisi.image} media="(prefers-reduced-motion: reduce)" />
                  ) : null}
                  <img
                    src={kisi.loop ?? kisi.image}
                    // Kart bir MOCKUP'tur: alt metni kişinin kim olduğunu ve
                    // ekranda ne durduğunu söyler, "fotoğraf" demez.
                    alt={`${kisi.name} — ${meslek}`}
                    width={1400}
                    height={1050}
                    loading="lazy"
                    decoding="async"
                  />
                </picture>
              </div>
              <p className="lp-kisi-ad">
                <strong>{kisi.name}.</strong> <span>{meslek}.</span>
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
