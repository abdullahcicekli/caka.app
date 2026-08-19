/**
 * LABORATUVAR — vitrin mockup'larının üretildiği yer. YALNIZ GELİŞTİRMEDE
 * kayıtlıdır (`app/routes.ts` içindeki `import.meta.env.DEV` kapısı); üretim
 * derlemesinde ne route'u ne de bu modülün import ettiği görseller pakete
 * girer.
 *
 * ─── NASIL ÇALIŞTIRILIR ────────────────────────────────────────────────────
 *
 *   1) apps/web içinden yerel R2'yi tohumla (galeri/avatar/belge kartları
 *      ürünün gerçek `/i/<uuid>` ve `/b/<uuid>` yollarından okunur):
 *
 *        node scripts/lab-tohum.mjs
 *
 *   2) `pnpm dev`, sonra tarayıcıda:
 *
 *        http://localhost:5173/__lab/karakterler          → altı kart alt alta
 *        http://localhost:5173/__lab/karakterler?p=emre   → tek kart, çıplak
 *
 *      `?p=` verildiğinde sayfa yalnız o kartı basar, sayfa dolgusu ve
 *      başlıklar kalkar — ekran görüntüsü tam kartın sınırına oturur.
 *
 *   3) Ekran görüntüleri (2x DPR) ve webp'e çevrim:
 *
 *        node scripts/lab-cek.mjs
 *
 *      Çıktı: `app/assets/landing/vitrin/<id>.webp`
 *
 * ─── NEDEN BÖYLE ───────────────────────────────────────────────────────────
 *
 * Telefonun içi bir ekran görüntüsü DEĞİL, `ProfileCanvas`'ın kendisidir:
 * aynı kartlar, aynı ızgara, aynı tema değişkenleri. Kart tasarımı
 * değiştiğinde mockup'lar bu route'tan yeniden üretilir. Elle çizilmiş bir
 * taklit ilk kart değişikliğinde sessizce eskir ve kimse fark etmezdi.
 *
 * Telefon, ürünün `.dashboard-preview` kuralını (app.css) yeniden kullanır:
 * `ProfileCanvas`'ı görüntü genişliğinden bağımsız olarak MOBİL yerleşime
 * zorlayan tek yer orası. Buradaki stil bloğu yalnız ölçüyü büyütür
 * (264×400 → 360×778); yerleşim kurallarını kopyalamaz.
 *
 * KONUM KARTI VİTRİNDE YOK. Mapbox Product Terms §2.8.1 harita içeriğinin
 * ekran görüntüsüyle çoğaltılmasını açıkça yasaklıyor (bkz.
 * `server/map-frame.ts`), yani bir konum kartının haritası landing'de statik
 * bir varlığa gömülemez ve kart ürünün haritasız fallback'ine düşerdi.
 * Doğru davranış ama vitrinde satılan şeyin yarım hâli görünür; bu yüzden
 * personaların düzeninden çıkarıldı (gerekçe: `content/landing/personas.ts`
 * sonundaki not). Ürün kodundaki konum bloğuna dokunulmadı.
 */

import { useSearchParams } from "react-router";

import { ProfileCanvas } from "~/components/profile-block";
import kaanSonVideo from "~/assets/landing/lab/kart/kaan-son-video.jpg";
import { LANDING_PERSONAS, type Persona } from "~/content/landing/personas";
// Altyazı metni katalogdan (Değişmez #5). Laboratuvar tek dilde çalışır —
// mockup'lar dilsizdir, şerit altyazısını landing kendi diliyle basar.
import { tr } from "~/content/landing/tr";
import type { GithubCalendar, GithubCalendarLevel } from "~/lib/github-calendar";
import type { YoutubeFeedMap } from "~/lib/youtube-feed";

/**
 * Katkı takvimi — gerçek uçtan (`server/github.ts`) değil, sabit bir
 * tohumdan. Gerekçe: mockup yeniden üretilebilir olmalı; canlı GitHub verisi
 * her çekimde başka bir grafik çizer ve iki varlık asla birbirini tutmaz.
 */
function tohumluTakvim(tohum: number, hafta = 53): GithubCalendar {
  let durum = tohum;
  const sonraki = () => {
    // xorshift32 — kısa, bağımlılıksız, deterministik.
    durum ^= durum << 13;
    durum ^= durum >>> 17;
    durum ^= durum << 5;
    return Math.abs(durum) / 2 ** 31;
  };
  let toplam = 0;
  const weeks = Array.from({ length: hafta }, (_, h) => ({
    days: Array.from({ length: 7 }, (_, g) => {
      const haftaSonu = g === 0 || g === 6;
      const r = sonraki() * (haftaSonu ? 0.55 : 1);
      const count = r < 0.28 ? 0 : Math.round(r * 11);
      toplam += count;
      const level = (count === 0 ? 0 : count < 3 ? 1 : count < 6 ? 2 : count < 9 ? 3 : 4) as GithubCalendarLevel;
      const gun = new Date(Date.UTC(2025, 7, 18) + (h * 7 + g) * 86_400_000);
      return { date: gun.toISOString().slice(0, 10), count, level };
    }),
  }));
  return { total: toplam, weeks };
}

const GITHUB_TAKVIMLERI = { emrekilic: tohumluTakvim(20260819) };

/** Kanal kartının "son video" satırı — akış yerine sabit veri (bkz. yukarısı). */
const YOUTUBE_AKISLARI: YoutubeFeedMap = {
  "kaan-kanal": {
    channelName: "Kaan Demirtaş",
    videoId: "8xR2mNqPd1A",
    title: "İstanbul'da 24 saat: sadece toplu taşımayla",
    url: "https://www.youtube.com/watch?v=8xR2mNqPd1A",
    // Video kartındaki kareyle AYNI OLMAMALI: kanal kartı "son video"yu
    // gösterir, video kartı sabitlenmiş başka bir videoyu.
    thumbnail: kaanSonVideo,
    short: false,
    published: "4 gün önce",
    views: "182 B görüntülenme",
  },
};

function Kart({ persona, kaydir = 0 }: { persona: Persona; kaydir?: number }) {
  const telefonSagda = persona.side === "left";
  return (
    <figure className="lab-cerceve">
      <div className="lab-kart" data-persona={persona.id} style={{ background: persona.backdrop }}>
        <img className="lab-foto" src={persona.photo} alt="" />
        <div className={`lab-telefon ${telefonSagda ? "is-sag" : "is-sol"}`}>
          <div className="dashboard-preview">
            <div
              className="dashboard-preview-scale"
              // Döngü karesi: sayfa telefonun içinde kayar. `translateY`
              // ölçekten SONRA uygulanmalı, yoksa piksel değeri 0.9091 ile
              // çarpılır ve kareler eşit aralıklı olmaz.
              style={kaydir ? { translate: `0 ${-kaydir}px` } : undefined}
            >
              <ProfileCanvas
                layout={persona.layout}
                theme={persona.theme}
                githubCalendars={GITHUB_TAKVIMLERI}
                signedImages={persona.images}
                youtubeFeeds={YOUTUBE_AKISLARI}
              />
            </div>
          </div>
        </div>
      </div>
      {/* ALTYAZI VARLIĞA GÖMÜLMEZ: beş dilde değişir, webp'e basılsaydı
          landing dört dilde Türkçe bir altyazı gösterirdi. Burada yalnız
          önizleme için var; çekim `.lab-kart` sınırını alır (bkz.
          `scripts/lab-cek.mjs`) ve bu satır kadraja girmez. */}
      <figcaption className="lab-altyazi">
        {persona.name}. {tr.karakterler.jobs[persona.job]}.
      </figcaption>
    </figure>
  );
}

export default function LabKarakterler() {
  const [params] = useSearchParams();
  const secili = params.get("p");
  const kaydir = Number(params.get("kaydir") ?? 0) || 0;
  const liste = secili ? LANDING_PERSONAS.filter((p) => p.id === secili) : LANDING_PERSONAS;

  return (
    <div className={`lab-sayfa ${secili ? "is-tek" : ""}`}>
      <style>{LAB_CSS}</style>
      {liste.map((persona) => (
        <Kart key={persona.id} persona={persona} kaydir={kaydir} />
      ))}
    </div>
  );
}

/**
 * Stil route'un içinde: laboratuvar üretim CSS'ine (app.css) hiçbir kural
 * eklemez. Kart ölçüsü 1200×900 — çekim 2x DPR ile 2400×1800 alınır ve
 * teslim için 1400×1050'ye indirilir.
 */
const LAB_CSS = `
.lab-sayfa { display: flex; flex-direction: column; align-items: center; gap: 32px; padding: 32px; background: #111; }
.lab-sayfa.is-tek { gap: 0; padding: 0; background: transparent; }

.lab-kart {
  position: relative;
  width: 1200px;
  height: 900px;
  margin: 0;
  overflow: hidden;
  isolation: isolate;
}
.lab-foto { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }

/* Telefon zeminde DURUR: tabanı kişinin ayak hizasına yakın, gölgesi yere
   düşüyor. Kişi hangi taraftaysa telefon karşı tarafa geçer. */
.lab-telefon { position: absolute; bottom: 74px; z-index: 1; }
.lab-telefon.is-sag { right: 96px; }
.lab-telefon.is-sol { left: 96px; }

/* Ürünün ".dashboard-preview" kuralı mobil yerleşimi verir; burada yalnız
   ölçü büyütülür (özgüllük app.css'i geçsin diye iki sınıflı seçici). */
.lab-telefon .dashboard-preview {
  width: 360px;
  height: 778px;
  margin: 0;
  border: 0;
  border-radius: 44px;
  box-shadow:
    0 0 0 11px #16181d,
    0 0 0 13px rgb(255 255 255 / 0.14),
    38px 46px 70px rgb(0 0 0 / 0.34);
}
.lab-telefon .dashboard-preview-scale {
  width: 396px;
  /* Döngü kareleri sayfayı yukarı öteliyor; kap gerçek içerik boyunda
     olmalı ki altta boş bir bant açılmasın. */
  height: 1500px;
  transform: scale(0.9091);
  transform-origin: top left;
}
.lab-telefon .dashboard-preview .profile-canvas { min-height: 856px; padding: 34px 20px; }
.lab-telefon .dashboard-preview .profile-grid { grid-auto-rows: 60px; }

/* Yere düşen gölge — telefonun ayakta durduğunu anlatan tek ipucu. */
.lab-telefon::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -30px;
  width: 118%;
  height: 46px;
  transform: translateX(-50%);
  background: radial-gradient(ellipse at center, rgb(0 0 0 / 0.4), transparent 70%);
  filter: blur(6px);
}

.lab-cerceve { margin: 0; }
.lab-altyazi {
  margin-top: 14px;
  font-size: 30px;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: #fff;
}
`;
