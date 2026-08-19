import { useEffect, useRef } from "react";

import type { LandingContent } from "~/content/landing";
import { KARAKTER_KARTLARI } from "~/content/landing/vitrin";

/**
 * Karakter şeridi: altı kişi, altı meslek, altı renk dünyası.
 *
 * KAYDIRMA NATIVE: `overflow-x: auto` + `scroll-snap`, kütüphane yok. Ok
 * düğmeleri ve segmentler YOK — kartlar arasında "gidilecek bir yer" yok,
 * sadece bakılır; fazladan kontrol gürültü olurdu.
 *
 * SABİTLEME (pin): bölüm görüntü alanını doldurunca sayfa orada durur ve
 * dikey kaydırma şeridi YATAY sürer; şerit bitince sayfa aşağı devam eder.
 * Sebebi keşfedilebilirlik — altı karttan üçü görünüyordu ve ziyaretçinin
 * yana kaydırabileceğini anlaması için bir işaret yoktu.
 *
 * Sabitleme İLERLEME GELİŞTİRMESİDİR, davranışın kendisi değil. JS yoksa,
 * `prefers-reduced-motion: reduce` ise, ekran darsa ya da şerit zaten
 * sığıyorsa hiç kurulmaz; o hâllerde native yatay kaydırma aynen çalışır.
 * Kaydırmayı çalan bir etkileşim her zaman geri alınabilir olmalı: burada
 * "geri alma" hiç kurulmamaktır.
 *
 * HAREKETSİZ: kartlar kendiliğinden kıpırdamaz. Bir karttaki animasyonlu
 * webp döngüsü kaldırıldı; şerit yalnız ziyaretçinin kaydırmasıyla hareket
 * eder.
 *
 * ALTYAZI BURADA BASILIYOR, GÖRSELE GÖMÜLÜ DEĞİL: meslek adı beş dilde
 * değişir. Webp'e basılsaydı Almanca sayfada Türkçe bir altyazı dururdu.
 */
export function KarakterlerSection({
  karakterler,
}: {
  karakterler: LandingContent["karakterler"];
}) {
  const pinRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const pin = pinRef.current;
    const stage = stageRef.current;
    const track = trackRef.current;
    if (!pin || !stage || !track) return;

    const azHareket = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Dar ekranda sabitleme kurulmaz: dokunmatikte sayfayı ele geçirmek
    // kullanıcının parmağıyla savaşmak demek ve momentum kaydırmasıyla
    // birlikte titriyor. Orada native yatay kaydırma zaten tanıdık.
    const genisEkran = window.matchMedia("(min-width: 1024px)");

    let mesafe = 0;
    let iptal: (() => void) | null = null;

    /** Sabitlemeyi söker ve elle verilmiş her ölçüyü geri alır. */
    const sok = () => {
      iptal?.();
      iptal = null;
      pin.style.height = "";
      pin.style.removeProperty("--lp-pin-top");
      pin.dataset.pinned = "";
      track.style.scrollSnapType = "";
    };

    const kur = () => {
      sok();
      if (azHareket.matches || !genisEkran.matches) return;

      mesafe = track.scrollWidth - track.clientWidth;
      // Şerit zaten sığıyorsa sürecek bir şey yok.
      if (mesafe < 24) return;

      const sahneY = stage.offsetHeight;
      // Sahne dikeyde ortalanır; yapışma noktası da bu değerdir.
      const ustBosluk = Math.max((window.innerHeight - sahneY) / 2, 0);
      pin.style.setProperty("--lp-pin-top", `${ustBosluk}px`);
      // Kutu boyu = sahne + sürülecek mesafe. Fazlası bölümün altında ölü
      // boşluk bırakır, azı şerit bitmeden sabitlemeyi keser.
      pin.style.height = `${sahneY + mesafe}px`;
      pin.dataset.pinned = "acik";
      // Snap ile programatik `scrollLeft` birbiriyle kavga ediyor: snap her
      // yazmadan sonra en yakın karta yapışıp ilerlemeyi geri alıyor.
      track.style.scrollSnapType = "none";

      const surucu = () => {
        const kutu = pin.getBoundingClientRect();
        const ilerleme = (ustBosluk - kutu.top) / mesafe;
        track.scrollLeft = Math.min(Math.max(ilerleme, 0), 1) * mesafe;
      };

      surucu();
      window.addEventListener("scroll", surucu, { passive: true });
      iptal = () => window.removeEventListener("scroll", surucu);
    };

    kur();

    // GÖRSELLER BÖLÜM YAKLAŞINCA İNER. `loading="lazy"` burada güvenilmez:
    // şerit programatik `scrollLeft` ile sürülüyor ve tarayıcı, sürülerek
    // görünür alana giren kartlar için tembel görselleri yeniden
    // değerlendirmiyor — ölçüldü, altı karttan üçü hiç yüklenmiyordu.
    // Bölüm bir ekran boyu yaklaşınca hepsini birden alıyoruz: sayfanın ilk
    // yükü etkilenmiyor (bölüm katlamanın çok altında), ama kullanıcı
    // geldiğinde boş kart görmüyor.
    const gorselGozlemcisi = new IntersectionObserver(
      (girisler) => {
        if (!girisler.some((g) => g.isIntersecting)) return;
        for (const img of track.querySelectorAll("img")) {
          if (img.naturalWidth > 0) continue;
          img.loading = "eager";
          // Atlanmış bir tembel görselde `loading` değişikliği tek başına
          // yüklemeyi tetiklemiyor; adresi yeniden atamak tetikliyor.
          img.src = img.src;
        }
        gorselGozlemcisi.disconnect();
      },
      { rootMargin: "100% 0px" },
    );
    gorselGozlemcisi.observe(pin);

    // Yeniden ölçüm: pencere boyu, görsellerin geç gelmesi ve yazı tipi
    // değişimi şeridin genişliğini değiştirir; mesafe bayatlarsa sürüş
    // bölümün sonuna varmadan biter.
    const gozlemci = new ResizeObserver(kur);
    gozlemci.observe(track);
    azHareket.addEventListener("change", kur);
    genisEkran.addEventListener("change", kur);

    return () => {
      gorselGozlemcisi.disconnect();
      gozlemci.disconnect();
      azHareket.removeEventListener("change", kur);
      genisEkran.removeEventListener("change", kur);
      sok();
    };
  }, []);

  return (
    <section id="karakterler" className="lp-section lp-anchor">
      {/* BAŞLIK DA SAHNENİN İÇİNDE: sabitleme boyunca ekranda kalır. Dışarıda
          bıraksaydık şerit yerinde dururken başlık yukarı kayıp navbar'ın
          altında kesiliyordu — kullanıcı hangi bölümde durduğunu göremezdi. */}
      <div className="lp-pin" ref={pinRef}>
        <div className="lp-pin-stage" ref={stageRef}>
          <div className="lp-shell">
            <h2 className="lp-h2">{karakterler.title}</h2>
            <p className="lp-body lp-measure mt-5">{karakterler.body}</p>
          </div>

          <ul
            className="lp-track mt-10"
            ref={trackRef}
            tabIndex={0}
            aria-label={karakterler.trackLabel}
          >
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
        </div>
      </div>
    </section>
  );
}
