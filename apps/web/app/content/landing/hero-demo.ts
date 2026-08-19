// Hero şeridindeki örnek Caka sayfası.
//
// NEDEN GERÇEK BLOKLAR: şerit stok fotoğraf kolajı değil, ürünün KENDİ
// kartlarıyla kurulur (`ProfileBlockCard`). Ziyaretçi Caka'nın gerçekte ne
// ürettiğini görür ve landing'de gösterilenle üründe çıkan şey birbirinden
// ayrışamaz — kartların görünümü değişirse şerit de değişir.
//
// ÇEVRİLMEYEN KISIM BURADA: adlar, kullanıcı adları, adresler, kimlikler,
// görseller, sayılar. Çevrilen kısım beş dil dosyasında (`heroTower`) ve
// buraya parametre olarak girer (Değişmez #5).
//
// DEKORATİF: şerit `inert` ile basılır — kartlardaki bağlantılar odak almaz,
// ekran okuyucuya okunmaz. Bu yüzden içindeki sayılar (katkı grafiği, dosya
// boyutu) ürün iddiası değil, örnek sayfanın kendi verisidir.
//
// SSR: hiçbir değer render anında hesaplanmaz — tarih sabit epoch, katkı
// grafiği sabit bir üreticiden. Rastgelelik yok, `Date.now()` yok.

import type { ProfileBlock } from "@caka/shared";

import creatorElif from "~/assets/landing/creator-elif.webp";
import creatorKerem from "~/assets/landing/creator-kerem.webp";
import creatorNaz from "~/assets/landing/creator-naz.webp";
import creatorSelin from "~/assets/landing/creator-selin.webp";
import { githubLoginKey, type GithubCalendar } from "~/lib/github-calendar";

/** Şeritteki kartların çevrilen metinleri (beş dil dosyasından gelir). */
export interface HeroTowerCopy {
  bio: string;
  link: string;
  status: string;
  document: string;
  location: string;
  country: string;
  youtube: string;
  link2: string;
  text: string;
}

/**
 * Kartın şeritteki genişliği. Değerler ızgaranın GERÇEK adımları:
 * `n` = 178px (üründe `2x2`), `w` = 368px (üründe `4x2`). Kart hiçbir zaman
 * ürünün kullanmadığı bir ene gerilmez ya da sıkıştırılmaz.
 */
export type TowerCardWidth = "n" | "w";

/** Satır yüksekliği: `s` = 156px, `m` = 240px (yine ızgaranın adımları). */
export type TowerRowHeight = "s" | "m";

export interface TowerCard {
  block: ProfileBlock;
  width: TowerCardWidth;
}

export interface TowerRow {
  height: TowerRowHeight;
  cards: TowerCard[];
}

const GITHUB_HANDLE = "keremaydin";

/**
 * Örnek katkı grafiği. SABİT bir üreticiden: `Math.random()` sunucu ve
 * istemcide farklı kareler üretir ve hidrasyonu kırardı. Desen haftanın
 * gününe ve hafta indeksine bağlı basit bir fonksiyon — hafta sonları
 * sönük, son aylar yoğun; gerçek bir grafiğin ritmini taşır.
 */
function demoCalendar(): GithubCalendar {
  const weeks: GithubCalendar["weeks"] = [];
  let total = 0;
  for (let week = 0; week < 53; week += 1) {
    const days: GithubCalendar["weeks"][number]["days"] = [];
    for (let day = 0; day < 7; day += 1) {
      const weekend = day === 0 || day === 6;
      const wave = (week * 7 + day * 3) % 11;
      const recency = week / 52;
      const raw = weekend ? wave % 3 : Math.round(wave * (0.45 + recency));
      const level = Math.max(0, Math.min(4, raw % 5)) as 0 | 1 | 2 | 3 | 4;
      const count = level * 3;
      total += count;
      // Tarih de sabit: örnek sayfa 2026 takvimini gösterir.
      const dayOfYear = week * 7 + day;
      const date = new Date(Date.UTC(2026, 0, 1 + dayOfYear))
        .toISOString()
        .slice(0, 10);
      days.push({ date, count, level });
    }
    weeks.push({ days });
  }
  return { total, weeks };
}

export const heroTowerCalendars = {
  [githubLoginKey(GITHUB_HANDLE)]: demoCalendar(),
};

/**
 * Kartların uzak görselleri. Gerçek üründe bunları loader imzalı proxy
 * yoluyla doldurur (`server/layout-images.ts`); burada doğrudan paketlenmiş
 * dosyalar veriliyor — sözleşme aynı: blok kimliği → görsel adresi.
 *
 * Dört portre böylece ürünün KENDİ kartlarının içinde yaşamaya devam eder:
 * bağlantı önizlemesi, video kapağı, albüm kapağı ve sosyal kart önizlemesi.
 */
export const heroTowerImages: Readonly<Record<string, string>> = {
  "demo-link": creatorKerem,
  "demo-youtube": creatorSelin,
  "demo-spotify": creatorElif,
  "demo-social-ig": creatorNaz,
};

/**
 * Şeridin üç YATAY satırı. Satırlar ters yönlerde akar; üçüncüsü yalnız geniş
 * ekranda görünür (dar ekranda yer yok, kartları da o yüzden `lazy` kalır).
 *
 * Kart genişlikleri karışık: geniş kartlar (bağlantı, video, albüm) yanında
 * dar sosyal kartlar — bento ritmi tek satırda da böyle çıkıyor.
 */
export function heroTowerRows(copy: HeroTowerCopy): TowerRow[] {
  const social = (
    id: string,
    platform: "x" | "tiktok" | "linkedin" | "youtube" | "instagram",
    ogImage = "",
  ): ProfileBlock => ({
    id,
    type: "social",
    size: ogImage ? "4x2" : "2x2",
    data: {
      platform,
      handle: "keremaydin",
      url: `https://example.com/keremaydin`,
      label: "",
      ogImage,
      favicon: "",
    },
  });

  return [
    {
      height: "m",
      cards: [
        {
          width: "w",
          block: {
            id: "demo-link",
            type: "link",
            size: "4x2",
            data: {
              title: copy.link,
              url: "https://keremaydin.com/single",
              ogImage: "https://keremaydin.com/og.jpg",
              favicon: "",
            },
          },
        },
        {
          width: "w",
          block: {
            id: "demo-youtube",
            type: "youtube",
            size: "4x2",
            data: {
              kind: "video",
              url: "https://www.youtube.com/watch?v=demoVideo1",
              videoId: "demoVideo1",
              title: copy.youtube,
              channelName: "Kerem Aydın",
              shorts: false,
              verticalThumbnail: false,
              thumbnail: "https://i.ytimg.com/vi/demoVideo1/mqdefault.jpg",
            },
          },
        },
        {
          width: "w",
          block: {
            id: "demo-spotify",
            type: "spotify",
            size: "4x2",
            data: {
              kind: "album",
              url: "https://open.spotify.com/album/1A2B3C4D5E6F7G8H9I0J",
              entityId: "1A2B3C4D5E6F7G8H9I0J",
              title: "Gece Yolu",
              thumbnail: "https://i.scdn.co/image/demo",
            },
          },
        },
      ],
    },
    {
      height: "s",
      cards: [
        {
          width: "w",
          block: {
            id: "demo-profile",
            type: "profile",
            size: "2x2",
            data: { name: "Kerem Aydın", title: copy.bio },
          },
        },
        {
          width: "w",
          block: social("demo-social-ig", "instagram", "https://instagram.com/og.jpg"),
        },
        {
          width: "w",
          block: {
            id: "demo-status",
            type: "status",
            size: "4x1",
            data: { text: copy.status, url: "" },
          },
        },
        { width: "n", block: social("demo-social-li", "linkedin") },
        { width: "n", block: social("demo-social-x", "x") },
        {
          width: "w",
          block: {
            id: "demo-document",
            type: "document",
            size: "4x1",
            data: {
              // assetId ŞART: boş bırakılırsa kart editörün "belge ekle" boş
              // durumuna düşer ve landing'de düzenleyici arayüzü sızardı.
              // Şerit `inert`, indirme bağlantısı tıklanamaz.
              assetId: "7d1c2f60-9a3e-4b18-8f52-0c6d5e14a9b3",
              title: copy.document,
              fileName: "kerem-aydin-basin-kiti.pdf",
              bytes: 412_000,
              // Sabit epoch (2026-02-18, UTC). Kart tarihi UTC getters ile
              // biçimlendiriyor, yani sunucu ve istemci aynı günü yazar.
              uploadedAt: 1_771_372_800_000,
            },
          },
        },
        { width: "n", block: social("demo-social-yt", "youtube") },
        { width: "n", block: social("demo-social-tiktok", "tiktok") },
      ],
    },
    {
      height: "m",
      cards: [
        {
          width: "w",
          block: {
            id: "demo-github",
            type: "social",
            size: "4x2",
            data: {
              platform: "github",
              handle: GITHUB_HANDLE,
              url: `https://github.com/${GITHUB_HANDLE}`,
              label: "",
              ogImage: "",
              favicon: "",
            },
          },
        },
        {
          width: "w",
          block: {
            id: "demo-location",
            type: "location",
            size: "2x2",
            data: {
              label: copy.location,
              country: copy.country,
              countryCode: "TR",
              lat: 40.99,
              lon: 29.02,
              timeZone: "Europe/Istanbul",
            },
          },
        },
        {
          width: "w",
          block: {
            id: "demo-link-2",
            type: "link",
            size: "4x2",
            data: {
              title: copy.link2,
              url: "https://keremaydin.com/konserler",
              ogImage: "",
              favicon: "",
            },
          },
        },
        {
          width: "w",
          block: {
            id: "demo-text",
            type: "text",
            size: "4x1",
            data: { text: copy.text },
          },
        },
      ],
    },
  ];
}
