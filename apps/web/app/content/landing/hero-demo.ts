// Hero şeridindeki örnek Caka sayfaları.
//
// NEDEN GERÇEK BLOKLAR: şerit stok fotoğraf kolajı değil, ürünün KENDİ
// kartlarıyla kurulur (`ProfileBlockCard`). Ziyaretçi Caka'nın gerçekte ne
// ürettiğini görür ve landing'de gösterilenle üründe çıkan şey birbirinden
// ayrışamaz — kartların görünümü değişirse şerit de değişir.
//
// DÖRT PERSONA, TEK KİMLİK: şerit eskiden tek bir ada ("Kerem Aydın")
// bağlıydı ama kartların fotoğrafları dört ayrı kişiye aitti — kadın
// fotoğrafı taşıyan bir kart "Kerem Aydın" diye etiketleniyordu. Artık dört
// persona var ve her personanın ADI, KULLANICI ADI, ALAN ADI, MESLEĞİ ve
// FOTOĞRAFI aynı kişiye ait:
//
//   Kerem Aydın  @keremaydin  müzisyen     (creator-kerem.webp — gitar, stüdyo)
//   Selin Demir  @selindemir  seramik      (creator-selin.webp — çark, atölye)
//   Elif Kaya    @elifkaya    podcast      (creator-elif.webp  — mikrofon, masa)
//   Naz Erdem    @nazerdem    seslendirme  (creator-naz.webp   — mikrofon, kayıt)
//
// GÖRSELLER: kart görselleri dört portrenin KIRPMALARIDIR (ImageMagick;
// kırpma geometrisi ve üretilen görsellerin prompt'ları
// `~/assets/landing/README.md`). Aynı personadan ikinci bir "foto" ÜRETMEK
// başka bir yüz getirir ve tam da düzeltilen kusuru geri koyardı; kişi
// TAŞIMAYAN görseller (albüm kapağı, podcast kapağı, menü görseli) üretildi.
//
// ÇEVRİLMEYEN KISIM BURADA: adlar, kullanıcı adları, adresler, kimlikler,
// görseller, sayılar, eser adları ("Gece Yolu", "Sade Hayat"). Çevrilen
// kısım beş dil dosyasında (`heroTower`) ve buraya parametre olarak girer
// (Değişmez #5).
//
// DEKORATİF: şerit `inert` ile basılır — kartlardaki bağlantılar odak almaz,
// ekran okuyucuya okunmaz. Bu yüzden içindeki sayılar (katkı grafiği, dosya
// boyutu) ürün iddiası değil, örnek sayfanın kendi verisidir.
//
// SSR: hiçbir değer render anında hesaplanmaz — tarih sabit epoch, katkı
// grafiği sabit bir üreticiden. Rastgelelik yok, `Date.now()` yok.

import type { BlockSize, ProfileBlock } from "@caka/shared";

import avatarElif from "~/assets/landing/avatar-elif.webp";
import avatarKerem from "~/assets/landing/avatar-kerem.webp";
import avatarNaz from "~/assets/landing/avatar-naz.webp";
import avatarSelin from "~/assets/landing/avatar-selin.webp";
import cardElif from "~/assets/landing/card-elif.webp";
import cardKerem from "~/assets/landing/card-kerem.webp";
import cardNaz from "~/assets/landing/card-naz.webp";
import cardSelin from "~/assets/landing/card-selin.webp";
import coverGeceYolu from "~/assets/landing/cover-gece-yolu.webp";
import coverSadeHayat from "~/assets/landing/cover-sade-hayat.webp";
import { githubLoginKey, type GithubCalendar } from "~/lib/github-calendar";

/** Personaların çevrilen kart metinleri; kimlikleri bu dosyada. */
export interface HeroTowerCopy {
  kerem: { bio: string; status: string; document: string; link: string };
  selin: { bio: string; status: string; link: string; location: string; country: string };
  elif: { bio: string; status: string; youtube: string };
  naz: { bio: string; status: string; text: string };
}

/**
 * ÖLÇÜLER YARIM BİRİMDE — ürünün ızgarasının birebir aynısı (`GRID_UNIT`,
 * `@caka/shared`): 8 sütun, `grid-auto-rows: 72px`, 12px boşluk.
 *
 *   genişlik   2 → 178px   4 → 368px   8 → 748px
 *   yükseklik  1 →  72px   2 → 156px   3 → 240px   4 → 324px
 *
 * Bu yüzden şerit artık "eşit karo" değil: bir sütunda tek büyük kart, bir
 * sonrakinde üst üste iki küçük kart durabiliyor. Kartlar konteyner
 * sorgusuyla çalıştığı için AYNI blok iki ölçüde iki farklı düzen gösteriyor
 * (Spotify'ın kompakt/kapaklı hâli, bağlantı kartının kapaklı/sade hâli) —
 * ölçü çeşitliliği süs değil, ürünün yeteneği.
 */
export type TowerSpanW = 2 | 4 | 8;
export type TowerSpanH = 1 | 2 | 3 | 4;

export interface TowerCell {
  block: ProfileBlock;
  /** Kartın yüksekliği, yarım birimde. `BLOCK_GRID_LIMITS` tabanına uy. */
  h: TowerSpanH;
}

export interface TowerColumn {
  /** Sütunun genişliği, yarım birimde. */
  w: TowerSpanW;
  /** Üst üste dizilen kartlar; yükseklikleri satırı TAM doldurmalı. */
  cells: TowerCell[];
}

export interface TowerRow {
  /** Satırın yüksekliği, yarım birimde. */
  h: TowerSpanH;
  columns: TowerColumn[];
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
 * Kartların görselleri. Gerçek üründe bunları loader imzalı proxy yoluyla
 * doldurur (`server/layout-images.ts`); burada doğrudan paketlenmiş dosyalar
 * veriliyor — sözleşme aynı: blok kimliği → görsel adresi.
 *
 * GÖRSEL TAŞIYABİLEN HER KART BURADA DOLU. Boş bırakılan profil kartı baş
 * harf çipine düşerdi ("KA" gibi) ve şerit tam da o yer tutucudan
 * kurtarılıyor. Dar sosyal kartlar (178px) og GÖSTERMEZ — onların görsel
 * çapası platform ikonudur, baş harf değil.
 */
export const heroTowerImages: Readonly<Record<string, string>> = {
  // Manzara kırpmalar (1,91:1 — `.link-og`, `.social-og`, video kapağı).
  "demo-elif-youtube": cardElif,
  "demo-naz-nsosyal": cardNaz,
  "demo-selin-link": cardSelin,
  "demo-kerem-link": cardKerem,
  // Kare kapaklar (`.sp-cover`).
  "demo-kerem-spotify": coverGeceYolu,
  "demo-elif-spotify": coverSadeHayat,
  // Yuvarlak portreler (profil avatarı).
  "demo-kerem-profile": avatarKerem,
  "demo-selin-profile": avatarSelin,
  "demo-elif-profile": avatarElif,
  "demo-naz-profile": avatarNaz,
};

type DemoSocialPlatform = "x" | "tiktok" | "linkedin" | "instagram" | "threads" | "nsosyal";

/** Sosyal kart kısayolu — kimlik personanın kullanıcı adından gelir. */
function social(
  id: string,
  platform: DemoSocialPlatform,
  handle: string,
  size: BlockSize = "1x1",
  hasOg = false,
): ProfileBlock {
  return {
    id,
    type: "social",
    size,
    data: {
      platform,
      handle,
      url: `https://example.com/${handle}`,
      label: "",
      // Kayıtlı adres yalnız loader'a "bu kartın görseli var" der; render
      // görseli `heroTowerImages`ten okur (bkz. `profile-block.tsx`).
      ogImage: hasOg ? "https://example.com/og.jpg" : "",
      favicon: "",
    },
  };
}

function profile(id: string, name: string, title: string): ProfileBlock {
  return { id, type: "profile", size: "1x1", data: { name, title } };
}

function status(id: string, text: string, size: BlockSize): ProfileBlock {
  return { id, type: "status", size, data: { text, url: "" } };
}

/**
 * Şeridin üç YATAY satırı; her satır kendi içinde bir BENTO MOZAİĞİ.
 *
 * Satırlar ters yönlerde akar; üçüncüsü yalnız geniş ekranda görünür
 * (dar ekranda yer yok, kartları da o yüzden `lazy` kalır).
 *
 * İKİ KURAL — ekleme yaparken koru:
 *   1. Bir sütunun kartlarının yükseklikleri satırın yüksekliğini TAM
 *      doldurur (12px boşluklarla): h4 = 4 | 2+2 | 1+1+2, h3 = 3 | 2+1 | 1+2.
 *   2. Yan yana (ve üst üste) gelen kartlar farklı personalara aittir;
 *      satırın SON sütunu ile İLK sütunu da komşudur — döngü orada sarar.
 *      Satır başlangıçları da kaydırılmıştır (Elif → Kerem → Naz).
 */
export function heroTowerRows(copy: HeroTowerCopy): TowerRow[] {
  return [
    // ---- Satır 0 (h4 = 324px) — tabanı yüksek kartlar burada yaşar:
    // YouTube ve konum 4 birimden kısa olamıyor (`BLOCK_GRID_LIMITS`).
    // Sıra: Elif · Kerem · Selin · Naz · Kerem · Selin
    {
      h: 4,
      columns: [
        {
          w: 4,
          cells: [
            {
              h: 4,
              block: {
                id: "demo-elif-youtube",
                type: "youtube",
                size: "2x2",
                data: {
                  kind: "video",
                  url: "https://www.youtube.com/watch?v=demoVideoElif",
                  videoId: "demoVideoElif",
                  title: copy.elif.youtube,
                  channelName: "Elif Kaya",
                  shorts: false,
                  verticalThumbnail: false,
                  thumbnail: "https://i.ytimg.com/vi/demoVideoElif/mqdefault.jpg",
                },
              },
            },
          ],
        },
        {
          w: 2,
          cells: [
            { h: 2, block: profile("demo-kerem-profile", "Kerem Aydın", copy.kerem.bio) },
            { h: 2, block: social("demo-kerem-x", "x", "keremaydin") },
          ],
        },
        {
          w: 4,
          cells: [
            {
              h: 4,
              block: {
                id: "demo-selin-location",
                type: "location",
                size: "2x2",
                data: {
                  label: copy.selin.location,
                  country: copy.selin.country,
                  countryCode: "TR",
                  lat: 37.03,
                  lon: 27.43,
                  timeZone: "Europe/Istanbul",
                },
              },
            },
          ],
        },
        {
          w: 4,
          cells: [
            { h: 4, block: social("demo-naz-nsosyal", "nsosyal", "nazerdem", "2x2", true) },
          ],
        },
        {
          w: 4,
          cells: [
            {
              h: 4,
              block: {
                id: "demo-kerem-spotify",
                type: "spotify",
                size: "2x2",
                data: {
                  kind: "album",
                  url: "https://open.spotify.com/album/1A2B3C4D5E6F7G8H9I0J",
                  entityId: "1A2B3C4D5E6F7G8H9I0J",
                  title: "Gece Yolu",
                  thumbnail: "https://i.scdn.co/image/demo-gece-yolu",
                },
              },
            },
          ],
        },
        {
          w: 2,
          cells: [
            { h: 2, block: profile("demo-selin-profile", "Selin Demir", copy.selin.bio) },
            { h: 2, block: social("demo-selin-instagram", "instagram", "selindemir") },
          ],
        },
      ],
    },
    // ---- Satır 1 (h3 = 240px). Sıra: Kerem · Naz · Selin · Elif · Naz · Selin
    {
      h: 3,
      columns: [
        {
          w: 4,
          cells: [
            {
              h: 2,
              block: {
                id: "demo-kerem-document",
                type: "document",
                size: "2x1",
                data: {
                  // assetId ŞART: boş bırakılırsa kart editörün "belge ekle"
                  // boş durumuna düşer ve landing'de düzenleyici arayüzü
                  // sızardı. Şerit `inert`, indirme bağlantısı tıklanamaz.
                  assetId: "7d1c2f60-9a3e-4b18-8f52-0c6d5e14a9b3",
                  title: copy.kerem.document,
                  fileName: "kerem-aydin-basin-kiti.pdf",
                  bytes: 412_000,
                  // Sabit epoch (2026-02-18, UTC). Kart tarihi UTC getters
                  // ile biçimlendiriyor: sunucu ve istemci aynı günü yazar.
                  uploadedAt: 1_771_372_800_000,
                },
              },
            },
            { h: 1, block: status("demo-kerem-status", copy.kerem.status, "2x1") },
          ],
        },
        {
          w: 2,
          cells: [
            { h: 2, block: profile("demo-naz-profile", "Naz Erdem", copy.naz.bio) },
            { h: 1, block: status("demo-naz-status", copy.naz.status, "1x1") },
          ],
        },
        {
          w: 4,
          cells: [
            {
              h: 3,
              block: {
                id: "demo-selin-link",
                type: "link",
                size: "2x2",
                data: {
                  title: copy.selin.link,
                  url: "https://selindemir.com/koleksiyon",
                  ogImage: "https://selindemir.com/og.jpg",
                  favicon: "",
                },
              },
            },
          ],
        },
        {
          w: 4,
          cells: [
            {
              h: 3,
              block: {
                id: "demo-elif-spotify",
                type: "spotify",
                size: "2x2",
                data: {
                  kind: "show",
                  url: "https://open.spotify.com/show/2K3L4M5N6O7P8Q9R0S1T",
                  entityId: "2K3L4M5N6O7P8Q9R0S1T",
                  title: "Sade Hayat",
                  thumbnail: "https://i.scdn.co/image/demo-sade-hayat",
                },
              },
            },
          ],
        },
        { w: 2, cells: [{ h: 3, block: social("demo-naz-tiktok", "tiktok", "nazerdem", "1x2") }] },
        { w: 2, cells: [{ h: 3, block: social("demo-selin-x", "x", "selindemir", "1x2") }] },
      ],
    },
    // ---- Satır 2 (h3 = 240px). Sıra: Naz · Kerem · Elif · Selin · Kerem · Elif
    {
      h: 3,
      columns: [
        {
          w: 4,
          cells: [
            {
              h: 3,
              block: {
                id: "demo-naz-text",
                type: "text",
                size: "2x2",
                data: { text: copy.naz.text },
              },
            },
          ],
        },
        {
          w: 4,
          cells: [
            {
              h: 3,
              block: {
                id: "demo-kerem-github",
                type: "social",
                size: "2x2",
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
          ],
        },
        {
          w: 2,
          cells: [
            { h: 2, block: profile("demo-elif-profile", "Elif Kaya", copy.elif.bio) },
            { h: 1, block: status("demo-elif-status", copy.elif.status, "1x1") },
          ],
        },
        {
          w: 2,
          cells: [
            { h: 2, block: social("demo-selin-threads", "threads", "selindemir") },
            { h: 1, block: status("demo-selin-status", copy.selin.status, "1x1") },
          ],
        },
        {
          w: 4,
          cells: [
            {
              h: 3,
              block: {
                id: "demo-kerem-link",
                type: "link",
                size: "2x2",
                data: {
                  title: copy.kerem.link,
                  url: "https://keremaydin.com/konserler",
                  ogImage: "https://keremaydin.com/og.jpg",
                  favicon: "",
                },
              },
            },
          ],
        },
        {
          w: 2,
          cells: [{ h: 3, block: social("demo-elif-linkedin", "linkedin", "elifkaya", "1x2") }],
        },
      ],
    },
  ];
}
