/**
 * Konum kartı: koyu, sade bir harita; üstünde konumun YEREL saatini taşıyan
 * küçük bir pil; ortasında konum noktası.
 *
 * ÜÇÜNCÜ TARAFA SIFIR İSTEK (R58): iki harita karesi de birinci taraf
 * `/api/harita` yolundan geliyor; kareyi Worker çekip önbelleğe alıyor
 * (`server/map-frame.ts`). Ziyaretçinin tarayıcısı hiçbir harita sunucusuna
 * bağlanmıyor, JS de yüklemiyor — kart iki `<img>` ve biraz CSS.
 *
 * YAKINLAŞMA EFEKTİ İKİ KARE ARASINDA: "uzak" (ülke ölçeği, z=4) altta,
 * "yakın" (şehir ölçeği, z=11) üstte durur. Bileşen bağlanınca `is-near`
 * sınıfı eklenir ve CSS geçişi yakın kareyi büyüyerek açar. Tek yönlü ve bir
 * kereliktir: sürekli dönen bir animasyon profil sayfasında gürültü olurdu.
 * `prefers-reduced-motion` açıkken geçiş yok — yakın kare doğrudan görünür.
 *
 * HİDRASYON: sunucu çıktısı ile ilk istemci render'ı BİREBİR aynı. Saat de
 * yakınlaşma da tek bir `useState(false)` + `useEffect` ile, bağlandıktan
 * SONRA devreye girer. Saati sunucuda basmak mümkün değildi: değer zamana
 * bağlı (SSR ile hidrasyon arasında dakika değişebilir) ve `Intl` çıktısı
 * ortama göre farklılaşıyor (bkz. `content/widget/shared.ts` — bu depoda
 * tarih/sayı biçimleyicileri bu yüzden elle yazılıyor).
 *
 * SAAT KONUMUN DİLİMİNDE: ziyaretçininkinde değil. Saat dilimi kayıt anında
 * çözülüp blokta saklanıyor; kart yalnız o kimliği `Intl`e veriyor.
 */
import { useEffect, useState } from "react";

import {
  MAP_ATTRIBUTION,
  type LocationBlockData,
  type LocalClock,
  formatUtcOffset,
  isNightHour,
  readLocalClock,
} from "@caka/shared";

import { widgetCatalog } from "~/content/widget";
import { useCatalog } from "~/lib/locale";

/** Saatin kaç saniyede bir tazelendiği. Dakika göstergesi için 30 sn yeter. */
const CLOCK_TICK_MS = 30_000;

export function LocationCard({
  data,
  frames,
}: {
  data: LocationBlockData;
  /** Blok kimliğine göre çözülmüş, imzalı birinci taraf kare yolları. */
  frames: { far: string; near: string };
}) {
  const w = useCatalog(widgetCatalog);
  // Tek bayrak iki işi birden yapıyor: saat basılır ve yakınlaşma başlar.
  // Ayrı iki state, aynı anda gelen iki render demekti.
  const [mounted, setMounted] = useState(false);
  const [clock, setClock] = useState<LocalClock | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!data.timeZone) return;
    const read = () => setClock(readLocalClock(data.timeZone));
    read();
    const timer = window.setInterval(read, CLOCK_TICK_MS);
    return () => window.clearInterval(timer);
  }, [data.timeZone]);

  const hasMap = Boolean(frames.far || frames.near);
  const label = data.label || w.location.fallbackLabel;

  return (
    <article
      className={[
        "profile-block",
        "profile-block-location",
        hasMap ? "" : "is-mapless",
        mounted ? "is-near" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={w.location.cardLabel(label)}
    >
      <span className="loc-map" aria-hidden>
        {/* Uzak kare ALTTA ve `eager`: kartın ilk gördüğü görüntü o.
            Yakın kare üstte, `lazy` — geçiş başlarken yükleniyor olabilir
            ve altındaki kare boşluk bırakmaz. */}
        {frames.far ? (
          <img className="loc-frame is-far" src={frames.far} alt="" draggable={false} />
        ) : null}
        {frames.near ? (
          <img
            className="loc-frame is-near"
            src={frames.near}
            alt=""
            loading="lazy"
            draggable={false}
          />
        ) : null}
        <span className="loc-dot" />
      </span>

      {/* Saat pili yalnız bağlandıktan sonra ve yalnız saat dilimi biliniyorsa
          basılır. Sunucu çıktısında hiç yok, dolayısıyla uyuşmazlık da yok. */}
      {clock ? (
        <span className="loc-clock">
          <span className="loc-clock-mark" aria-hidden>
            {isNightHour(clock.hour) ? "🌙" : "☀️"}
          </span>
          {w.location.clock(clock.hour, clock.minute)}
          <small>{`UTC${formatUtcOffset(clock.offsetMinutes)}`}</small>
        </span>
      ) : null}

      <span className="loc-foot">
        <strong>{label}</strong>
        {data.country && data.country !== label ? <small>{data.country}</small> : null}
      </span>

      {/* Atıf GÖRÜNÜR olmak zorunda: harita karesi `manual_attribution=true`
          ile filigransız isteniyor ve yükümlülük bize geçiyor. Çevrilmez —
          marka ve proje adları. */}
      {hasMap ? <small className="loc-attrib">{MAP_ATTRIBUTION}</small> : null}
    </article>
  );
}
