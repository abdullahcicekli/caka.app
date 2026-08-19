import type { LandingContent } from "~/content/landing";
import { KARAKTER_KARTLARI } from "~/content/landing/vitrin";

/**
 * Karakter şeridi: altı kişi, altı meslek, altı renk dünyası.
 *
 * KAYDIRMA NATIVE: `overflow-x: auto` + `scroll-snap`, kütüphane yok. Ok
 * düğmeleri ve segmentler YOK — kartlar arasında "gidilecek bir yer" yok,
 * sadece bakılır; fazladan kontrol gürültü olurdu.
 *
 * HAREKETSİZ: kartlar kıpırdamaz. Bir karttaki animasyonlu webp döngüsü
 * (telefondaki sayfa kayıyordu) KALDIRILDI — şerit yalnız ziyaretçinin
 * kendi kaydırmasıyla hareket eder. Kalan tek görsel durağan webp'tir,
 * dolayısıyla `prefers-reduced-motion` dallanmasına da gerek kalmadı.
 *
 * ALTYAZI BURADA BASILIYOR, GÖRSELE GÖMÜLÜ DEĞİL: meslek adı beş dilde
 * değişir. Webp'e basılsaydı Almanca sayfada Türkçe bir altyazı dururdu.
 *
 * HEPSİ LAZY: şerit katlamanın çok altında ve LCP öğesi hero'nun başlığı
 * (`H1.lp-display`). İlk kartı eager yapmak LCP'yi iyileştirmiyor, yalnız
 * ilk yüke bir mockup'ın ağırlığını ekliyordu; ölçülüp geri alındı.
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
                <img
                  src={kisi.image}
                  // Kart bir MOCKUP'tur: alt metni kişinin kim olduğunu ve
                  // ekranda ne durduğunu söyler, "fotoğraf" demez.
                  alt={`${kisi.name} — ${meslek}`}
                  width={1400}
                  height={1050}
                  loading="lazy"
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
