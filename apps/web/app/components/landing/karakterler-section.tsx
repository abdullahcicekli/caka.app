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
 * İLK KART EAGER, GERİSİ LAZY: şerit katlamanın altında ama ilk kart yatay
 * kaydırmada zaten görünür durumda açılıyor; altısını birden indirmek
 * landing'in ilk yüküne yaklaşık 300 KB eklerdi.
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
        {KARAKTER_KARTLARI.map((kisi, index) => {
          const meslek = karakterler.jobs[kisi.job];
          return (
            <li key={kisi.id} className="lp-kisi">
              <div className="lp-kisi-media" style={{ backgroundColor: kisi.backdrop }}>
                <img
                  src={kisi.image}
                  // Kart bir MOCKUP'tur: alt metni kişinin kim olduğunu ve
                  // ekranda ne durduğunu söyler, "fotoğraf" demez.
                  alt={`${kisi.name} — ${meslek}`}
                  width={1400}
                  height={1050}
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
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
