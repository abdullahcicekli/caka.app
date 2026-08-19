/**
 * Landing vitrininin altı karakteri: kim oldukları, hangi renk dünyasında
 * durdukları ve **gerçek** `ProfileLayout`'ları.
 *
 * NEDEN GERÇEK DÜZEN, TAKLİT DEĞİL: vitrindeki telefonun içi bir ekran
 * görüntüsü değil, `ProfileCanvas`'ın kendisidir. Laboratuvar route'u
 * (`routes/lab.karakterler.tsx`, yalnız geliştirmede) bu düzenleri ürünün
 * kendi bileşenleriyle çizer, ekran görüntüsü alınır ve
 * `assets/landing/vitrin/` altındaki webp'ler oradan doğar. Kart tasarımı
 * değiştiğinde mockup'lar yeniden üretilebilir; elle çizilmiş bir taklit
 * ilk kart değişikliğinde sessizce eskirdi.
 *
 * ÇEVRİLMEYEN KISIM BURADA: isimler, kullanıcı adları, kart içerikleri ve
 * düzenler bir kullanıcının kendi sayfasıdır — çevrilmezler (Değişmez #5
 * anlamında "kullanıcıya görünen ürün metni" değil, örnek İÇERİKtir).
 * Vitrin şeridinin altyazısındaki MESLEK adı çevrilir ve beş dil
 * kataloğunda yaşar (`showcase`/`karakterler`); buradaki `job` alanı o
 * katalogla eşleşen bir KİMLİKTİR.
 */

import type { ProfileLayout, ProfileTheme } from "@caka/shared";

import avatarBusra from "~/assets/landing/lab/avatar-busra.jpg";
import avatarEmre from "~/assets/landing/lab/avatar-emre.jpg";
import avatarKaan from "~/assets/landing/lab/avatar-kaan.jpg";
import avatarOzan from "~/assets/landing/lab/avatar-ozan.jpg";
import avatarSerkan from "~/assets/landing/lab/avatar-serkan.jpg";
import avatarZeynep from "~/assets/landing/lab/avatar-zeynep.jpg";
import kisiBusra from "~/assets/landing/lab/kisi-busra.webp";
import kisiEmre from "~/assets/landing/lab/kisi-emre.webp";
import kisiKaan from "~/assets/landing/lab/kisi-kaan.webp";
import kisiOzan from "~/assets/landing/lab/kisi-ozan.webp";
import kisiSerkan from "~/assets/landing/lab/kisi-serkan.webp";
import kisiZeynep from "~/assets/landing/lab/kisi-zeynep.webp";

/** Vitrin altyazısındaki meslek etiketinin kimliği; metin katalogda. */
export type PersonaJob =
  | "yazilimci"
  | "youtuber"
  | "sporHocasi"
  | "muzisyen"
  | "gazeteci"
  | "diyetisyen";

export interface Persona {
  id: string;
  /** Altyazının ilk yarısı — çevrilmez. */
  name: string;
  username: string;
  job: PersonaJob;
  theme: ProfileTheme;
  /** Stüdyo çekimi: kişi bu tarafta durur, telefon karşı tarafa konur. */
  side: "left" | "right";
  /** Kartın ve altyazı şeridinin zemin rengi — fotoğrafın fonundan örneklendi. */
  backdrop: string;
  photo: string;
  layout: ProfileLayout;
  /** Blok kimliği → görsel adresi (`ProfileCanvas`'ın `signedImages` girdisi). */
  images: Record<string, string>;
}

/**
 * Izgara konumu: **mobil (4 sütun) düzen esastır**, çünkü vitrindeki telefon
 * `.dashboard-preview` kuralıyla mobil yerleşime zorlanır. Desktop düzeni
 * bire iki ölçeklenerek türetilir, böylece iki görünüm aynı kompozisyonu
 * anlatır. `smManual` şart: yoksa `withDerivedSmPositions` sm'i lg'den
 * yeniden türetir ve buradaki elle kurulmuş sıra kaybolurdu.
 *
 * Birimler YARIM HÜCREDİR (bkz. `GRID_UNIT`): h=2 bir tam satır eder.
 */
function at(x: number, y: number, w: number, h: number) {
  return {
    smManual: true as const,
    pos: {
      lg: { x: x * 2, y, w: Math.min(w * 2, 8), h },
      sm: { x, y, w, h },
    },
  };
}

/** Belge kartının tarih satırı sabit kalsın diye sabit bir an (2026-07-14). */
const BELGE_ANI = Date.parse("2026-07-14T09:20:00Z");

const AVATAR = {
  emre: "a0000000-0000-4000-8000-000000000001",
  kaan: "a0000000-0000-4000-8000-000000000002",
  serkan: "a0000000-0000-4000-8000-000000000003",
  ozan: "a0000000-0000-4000-8000-000000000004",
  zeynep: "a0000000-0000-4000-8000-000000000005",
  busra: "a0000000-0000-4000-8000-000000000006",
} as const;

/**
 * Galeri ve belge blokları R2'deki asset kimliğine bakar (`/i/<uuid>`,
 * `/b/<uuid>` — Değişmez #9); laboratuvarda bu kimlikler yerel R2'ye
 * tohumlanır (`scripts/lab-tohum.mjs`). Kimlikler SABİT: tohumlama ile düzen
 * ayrışırsa kart boş kalır, kırık görsel çıkmaz.
 */
const FOTO = (n: number) => `9a110000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const BELGE = (n: number) => `d0c00000-0000-4000-8000-${String(n).padStart(12, "0")}`;

/**
 * Kart görselleri (og önizlemeleri, kapaklar, küçük görseller) `signedImages`
 * eşlemesinden gelir — yani düz bir adres yeter, imzalı proxy şart değil.
 * Tek tek `import` yerine glob: on küsur satırlık import listesi eklenen her
 * fotoğrafta elle güncellenirdi.
 */
const kartlar = import.meta.glob("../../assets/landing/lab/kart/*.jpg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

function kart(file: string): string {
  const anahtar = Object.keys(kartlar).find((yol) => yol.endsWith(`/${file}`));
  return anahtar ? kartlar[anahtar] : "";
}

export const LANDING_PERSONAS: Persona[] = [
  // ── 1. Yazılım mühendisi ────────────────────────────────────────────────
  // Öne çıkan widget'lar: GitHub katkı ısı haritası, belge (CV), og görselli
  // bağlantılar. Koyu tema.
  {
    id: "emre",
    name: "Emre Kılıç",
    username: "emrekilic",
    job: "yazilimci",
    theme: "dark",
    side: "left",
    backdrop: "#14356f",
    photo: kisiEmre,
    images: {
      "emre-blog": kart("emre-og-1.jpg"),
      "emre-proje": kart("emre-og-2.jpg"),
    },
    layout: {
      grid: 2,
      version: 1,
      blocks: [
        {
          id: "emre-profil",
          type: "profile",
          size: "2x1",
          data: {
            name: "Emre Kılıç",
            title: "Backend geliştirici · Go, TypeScript, Postgres",
            avatarAssetId: AVATAR.emre,
          },
        },
        {
          id: "emre-github",
          type: "social",
          size: "2x2",
          ...at(0, 0, 4, 6),
          data: {
            platform: "github",
            handle: "emrekilic",
            url: "https://github.com/emrekilic",
            label: "GitHub",
            ogImage: "",
            favicon: "",
          },
        },
        {
          id: "emre-cv",
          type: "document",
          size: "2x1",
          ...at(0, 6, 4, 2),
          data: {
            assetId: BELGE(1),
            title: "Öz geçmiş",
            fileName: "emre-kilic-cv.pdf",
            bytes: 284_512,
            uploadedAt: BELGE_ANI,
          },
        },
        {
          id: "emre-blog",
          type: "link",
          size: "2x2",
          ...at(0, 8, 4, 4),
          data: {
            title: "Kuyruk sistemlerini Postgres ile kurmak",
            url: "https://emrekilic.dev/yazilar/postgres-kuyruk",
            ogImage: "",
            favicon: "",
          },
        },
        {
          id: "emre-proje",
          type: "link",
          size: "2x2",
          ...at(0, 12, 4, 4),
          data: {
            title: "pgqueue — açık kaynak iş kuyruğu",
            url: "https://github.com/emrekilic/pgqueue",
            ogImage: "",
            favicon: "",
          },
        },
        {
          id: "emre-linkedin",
          type: "social",
          size: "1x1",
          ...at(0, 16, 2, 2),
          data: {
            platform: "linkedin",
            handle: "emrekilic",
            url: "https://www.linkedin.com/in/emrekilic",
            label: "LinkedIn",
            ogImage: "",
            favicon: "",
          },
        },
        {
          id: "emre-x",
          type: "social",
          size: "1x1",
          ...at(2, 16, 2, 2),
          data: {
            platform: "x",
            handle: "emrekilicdev",
            url: "https://x.com/emrekilicdev",
            label: "X",
            ogImage: "",
            favicon: "",
          },
        },
      ],
    },
  },

  // ── 2. YouTuber ─────────────────────────────────────────────────────────
  // Öne çıkan widget'lar: YouTube video kartı + kanal kartı, foto galerisi,
  // sosyal hesaplar.
  {
    id: "kaan",
    name: "Kaan Demirtaş",
    username: "kaandemirtas",
    job: "youtuber",
    theme: "neon",
    side: "right",
    backdrop: "#e2542a",
    photo: kisiKaan,
    images: {
      "kaan-video": kart("kaan-video.jpg"),
      "kaan-kanal": avatarKaan,
    },
    layout: {
      grid: 2,
      version: 1,
      blocks: [
        {
          id: "kaan-profil",
          type: "profile",
          size: "2x1",
          data: {
            name: "Kaan Demirtaş",
            title: "Haftada bir video · şehir, yol, kamera",
            avatarAssetId: AVATAR.kaan,
          },
        },
        {
          id: "kaan-video",
          type: "youtube",
          size: "2x2",
          ...at(0, 0, 4, 4),
          data: {
            kind: "video",
            url: "https://www.youtube.com/watch?v=8xR2mNqPd1A",
            videoId: "8xR2mNqPd1A",
            title: "İstanbul'da 24 saat: sadece toplu taşımayla",
            channelName: "Kaan Demirtaş",
            shorts: false,
            verticalThumbnail: false,
            thumbnail: "",
          },
        },
        {
          id: "kaan-kanal",
          type: "youtube",
          size: "2x2",
          ...at(0, 4, 4, 4),
          data: {
            kind: "channel",
            url: "https://www.youtube.com/@kaandemirtas",
            channelId: "UCq7Yb3xK2mLpR9dWvT4zNsA",
            channelName: "Kaan Demirtaş",
            handle: "kaandemirtas",
            thumbnail: "",
          },
        },
        {
          id: "kaan-galeri",
          type: "gallery",
          size: "2x2",
          ...at(0, 8, 4, 4),
          data: {
            title: "Kamera arkası",
            photos: [
              { assetId: FOTO(11), alt: "Çekim seti: kamera ve ışıklar" },
              { assetId: FOTO(12), alt: "Şehir manzarası" },
              { assetId: FOTO(13), alt: "Kurgu masası" },
            ],
            layout: "grid",
            url: "",
          },
        },
        {
          id: "kaan-instagram",
          type: "social",
          size: "1x1",
          ...at(0, 12, 2, 2),
          data: {
            platform: "instagram",
            handle: "kaandemirtas",
            url: "https://www.instagram.com/kaandemirtas",
            label: "Instagram",
            ogImage: "",
            favicon: "",
          },
        },
        {
          id: "kaan-tiktok",
          type: "social",
          size: "1x1",
          ...at(2, 12, 2, 2),
          data: {
            platform: "tiktok",
            handle: "kaandemirtas",
            url: "https://www.tiktok.com/@kaandemirtas",
            label: "TikTok",
            ogImage: "",
            favicon: "",
          },
        },
      ],
    },
  },

  // ── 3. Spor hocası ──────────────────────────────────────────────────────
  // Öne çıkan widget'lar: konum kartı (salon), galeri, sosyal, WhatsApp
  // bağlantısı, kısa metin.
  {
    id: "serkan",
    name: "Serkan Yıldız",
    username: "serkanyildizpt",
    job: "sporHocasi",
    theme: "zumrut",
    side: "left",
    backdrop: "#4cb63a",
    photo: kisiSerkan,
    images: {},
    layout: {
      grid: 2,
      version: 1,
      blocks: [
        {
          id: "serkan-profil",
          type: "profile",
          size: "2x1",
          data: {
            name: "Serkan Yıldız",
            title: "Kişisel antrenör · kuvvet ve kondisyon",
            avatarAssetId: AVATAR.serkan,
          },
        },
        {
          id: "serkan-konum",
          type: "location",
          size: "2x2",
          ...at(0, 8, 4, 4),
          data: {
            label: "Kadıköy, İstanbul",
            country: "Türkiye",
            countryCode: "TR",
            lat: 40.99,
            lon: 29.03,
            timeZone: "Europe/Istanbul",
          },
        },
        {
          id: "serkan-wa",
          type: "link",
          size: "2x1",
          ...at(0, 4, 4, 2),
          data: {
            title: "WhatsApp'tan randevu al",
            url: "https://wa.me/905321112233",
            ogImage: "",
            favicon: "",
          },
        },
        {
          id: "serkan-galeri",
          type: "gallery",
          size: "2x2",
          ...at(0, 0, 4, 4),
          data: {
            title: "Salondan",
            photos: [
              { assetId: FOTO(21), alt: "Salon iç mekân" },
              { assetId: FOTO(22), alt: "Kettlebell yakın çekim" },
              { assetId: FOTO(23), alt: "Açık hava antrenman alanı" },
            ],
            layout: "grid",
            url: "",
          },
        },
        {
          id: "serkan-not",
          type: "text",
          size: "2x1",
          ...at(0, 6, 4, 2),
          data: {
            text: "Haftada üç gün, kırk beş dakika. Gerisi tutarlılık.",
            doc: undefined,
          },
        },
        {
          id: "serkan-instagram",
          type: "social",
          size: "1x1",
          ...at(0, 12, 2, 2),
          data: {
            platform: "instagram",
            handle: "serkanyildizpt",
            url: "https://www.instagram.com/serkanyildizpt",
            label: "Instagram",
            ogImage: "",
            favicon: "",
          },
        },
        {
          id: "serkan-youtube",
          type: "social",
          size: "1x1",
          ...at(2, 12, 2, 2),
          data: {
            platform: "youtube",
            handle: "serkanyildizpt",
            url: "https://www.youtube.com/@serkanyildizpt",
            label: "YouTube",
            ogImage: "",
            favicon: "",
          },
        },
      ],
    },
  },

  // ── 4. Müzisyen ─────────────────────────────────────────────────────────
  // Öne çıkan widget'lar: Spotify kartı, galeri, bağlantılar.
  {
    id: "ozan",
    name: "Ozan Şahin",
    username: "ozansahin",
    job: "muzisyen",
    theme: "lavanta",
    side: "right",
    backdrop: "#6a2ba0",
    photo: kisiOzan,
    images: {
      "ozan-album": kart("ozan-kapak.jpg"),
    },
    layout: {
      grid: 2,
      version: 1,
      blocks: [
        {
          id: "ozan-profil",
          type: "profile",
          size: "2x1",
          data: {
            name: "Ozan Şahin",
            title: "Şarkı yazarı · gitar · İstanbul",
            avatarAssetId: AVATAR.ozan,
          },
        },
        {
          id: "ozan-album",
          type: "spotify",
          size: "2x2",
          ...at(0, 0, 4, 4),
          data: {
            kind: "album",
            url: "https://open.spotify.com/album/4kRlPmT2xQhV8nZbW1sYdC",
            entityId: "4kRlPmT2xQhV8nZbW1sYdC",
            title: "Gece Yarısı Radyosu",
            thumbnail: "",
          },
        },
        {
          id: "ozan-galeri",
          type: "gallery",
          size: "2x2",
          ...at(0, 4, 4, 4),
          data: {
            title: "Sahne ve stüdyo",
            photos: [
              { assetId: FOTO(31), alt: "Sahne ışıkları" },
              { assetId: FOTO(32), alt: "Kayıt stüdyosu" },
            ],
            layout: "grid",
            url: "",
          },
        },
        {
          id: "ozan-takvim",
          type: "link",
          size: "2x1",
          ...at(0, 8, 4, 2),
          data: {
            title: "Konser takvimi",
            url: "https://ozansahin.com/takvim",
            ogImage: "",
            favicon: "",
          },
        },
        {
          id: "ozan-instagram",
          type: "social",
          size: "1x1",
          ...at(0, 10, 2, 2),
          data: {
            platform: "instagram",
            handle: "ozansahinmusic",
            url: "https://www.instagram.com/ozansahinmusic",
            label: "Instagram",
            ogImage: "",
            favicon: "",
          },
        },
        {
          id: "ozan-youtube",
          type: "social",
          size: "1x1",
          ...at(2, 10, 2, 2),
          data: {
            platform: "youtube",
            handle: "ozansahin",
            url: "https://www.youtube.com/@ozansahin",
            label: "YouTube",
            ogImage: "",
            favicon: "",
          },
        },
      ],
    },
  },

  // ── 5. Gazeteci ─────────────────────────────────────────────────────────
  // Öne çıkan widget'lar: yazı kartları (metin), og görselli haber
  // bağlantıları, sosyal.
  {
    id: "zeynep",
    name: "Zeynep Aydın",
    username: "zeynepaydin",
    job: "gazeteci",
    theme: "light",
    side: "left",
    backdrop: "#c98a3a",
    photo: kisiZeynep,
    images: {
      "zeynep-haber-1": kart("zeynep-og-1.jpg"),
      "zeynep-haber-2": kart("zeynep-og-2.jpg"),
      "zeynep-arsiv": kart("zeynep-og-3.jpg"),
    },
    layout: {
      grid: 2,
      version: 1,
      blocks: [
        {
          id: "zeynep-profil",
          type: "profile",
          size: "2x1",
          data: {
            name: "Zeynep Aydın",
            title: "Muhabir · ekonomi ve emek haberleri",
            avatarAssetId: AVATAR.zeynep,
          },
        },
        {
          id: "zeynep-not",
          type: "text",
          size: "2x1",
          ...at(0, 0, 4, 2),
          data: {
            text: "Sekiz yıldır saha muhabiriyim. Yazdıklarım burada birikiyor.",
            doc: undefined,
          },
        },
        {
          id: "zeynep-haber-1",
          type: "link",
          size: "2x2",
          ...at(0, 2, 4, 4),
          data: {
            title: "Enflasyon sepetinde bu ay ne değişti?",
            url: "https://ornekgazete.com/ekonomi/enflasyon-sepeti-agustos",
            ogImage: "",
            favicon: "",
          },
        },
        {
          id: "zeynep-haber-2",
          type: "link",
          size: "2x2",
          ...at(0, 6, 4, 4),
          data: {
            title: "Sandık başında on iki saat: bir seçim gecesi",
            url: "https://ornekgazete.com/dosya/secim-gecesi",
            ogImage: "",
            favicon: "",
          },
        },
        {
          id: "zeynep-arsiv",
          type: "link",
          size: "2x2",
          ...at(0, 10, 4, 4),
          data: {
            title: "Tüm yazılarım — arşiv",
            url: "https://zeynepaydin.com/arsiv",
            ogImage: "",
            favicon: "",
          },
        },
        {
          id: "zeynep-x",
          type: "social",
          size: "1x1",
          ...at(0, 14, 2, 2),
          data: {
            platform: "x",
            handle: "zeynepaydin",
            url: "https://x.com/zeynepaydin",
            label: "X",
            ogImage: "",
            favicon: "",
          },
        },
        {
          id: "zeynep-linkedin",
          type: "social",
          size: "1x1",
          ...at(2, 14, 2, 2),
          data: {
            platform: "linkedin",
            handle: "zeynepaydin",
            url: "https://www.linkedin.com/in/zeynepaydin",
            label: "LinkedIn",
            ogImage: "",
            favicon: "",
          },
        },
      ],
    },
  },

  // ── 6. Diyetisyen ───────────────────────────────────────────────────────
  // Öne çıkan widget'lar: konum, belge (beslenme programı), galeri, randevu
  // bağlantısı.
  {
    id: "busra",
    name: "Büşra Kaya",
    username: "dytbusrakaya",
    job: "diyetisyen",
    theme: "ufuk",
    side: "right",
    backdrop: "#69bab4",
    photo: kisiBusra,
    images: {
      "busra-randevu": kart("busra-og-1.jpg"),
    },
    layout: {
      grid: 2,
      version: 1,
      blocks: [
        {
          id: "busra-profil",
          type: "profile",
          size: "2x1",
          data: {
            name: "Büşra Kaya",
            title: "Diyetisyen · beslenme danışmanlığı",
            avatarAssetId: AVATAR.busra,
          },
        },
        {
          id: "busra-randevu",
          type: "link",
          size: "2x2",
          ...at(0, 0, 4, 4),
          data: {
            title: "Online randevu al",
            url: "https://dytbusrakaya.com/randevu",
            ogImage: "",
            favicon: "",
          },
        },
        {
          id: "busra-program",
          type: "document",
          size: "2x1",
          ...at(0, 4, 4, 2),
          data: {
            assetId: BELGE(2),
            title: "Örnek haftalık program",
            fileName: "haftalik-beslenme-programi.pdf",
            bytes: 412_800,
            uploadedAt: BELGE_ANI,
          },
        },
        {
          id: "busra-konum",
          type: "location",
          size: "2x2",
          ...at(0, 12, 4, 4),
          data: {
            label: "Nişantaşı, İstanbul",
            country: "Türkiye",
            countryCode: "TR",
            lat: 41.05,
            lon: 28.99,
            timeZone: "Europe/Istanbul",
          },
        },
        {
          id: "busra-galeri",
          type: "gallery",
          size: "2x2",
          ...at(0, 6, 4, 4),
          data: {
            title: "Danışmanlıktan",
            photos: [
              { assetId: FOTO(41), alt: "Sebze ve meyve tabağı" },
              { assetId: FOTO(42), alt: "Danışmanlık odası" },
              { assetId: FOTO(43), alt: "Sağlıklı öğün" },
            ],
            layout: "grid",
            url: "",
          },
        },
        {
          id: "busra-instagram",
          type: "social",
          size: "1x1",
          ...at(0, 10, 2, 2),
          data: {
            platform: "instagram",
            handle: "dyt.busrakaya",
            url: "https://www.instagram.com/dyt.busrakaya",
            label: "Instagram",
            ogImage: "",
            favicon: "",
          },
        },
        {
          id: "busra-mail",
          type: "social",
          size: "1x1",
          ...at(2, 10, 2, 2),
          data: {
            platform: "email",
            handle: "merhaba@dytbusrakaya.com",
            url: "https://dytbusrakaya.com/iletisim",
            label: "E-posta",
            ogImage: "",
            favicon: "",
          },
        },
      ],
    },
  },
];
