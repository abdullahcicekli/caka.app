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
//   Kerem Aydın  @keremaydin  müzisyen     (avatar-kerem.webp)
//   Selin Demir  @selindemir  seramik      (avatar-selin.webp)
//   Elif Kaya    @elifkaya    podcast      (avatar-elif.webp)
//   Naz Erdem    @nazerdem    seslendirme  (avatar-naz.webp)
//
// GÖRSEL HAVUZU: her görsel şeritte YALNIZ BİR KEZ geçer. Dört portreyle
// on beş yer doldurmak (avatar + kart kapağı + önizleme aynı fotoğraftan)
// gözle hemen yakalanıyordu.
//
// İş bölümü şu kurala göre:
//   * YÜZ yalnız AVATARDA. Avatarlar dört portrenin kırpmasıdır — aynı
//     personadan ikinci bir portre ÜRETMEK başka bir yüz getirir ve tam da
//     düzeltilen kimlik kusurunu geri koyardı.
//   * KART görselleri kişi TAŞIMAZ: personanın dünyasından bir sahne ya da
//     nesne (stüdyo, atölye rafı, mikrofon, çömlekçi takımları, albüm
//     kapağı). Kimlik iddiası taşımadıkları için hangi yüzün çıktığı sorun
//     değil ve her personaya kendi görsel seti düşüyor.
//     İki sahne artık KARAKTER ŞERİDİNİN stüdyo karelerinden kırpılıyor
//     (`scene-kaan`, `scene-ozan`): kişisiz kadrajlar oldukları için yukarıdaki
//     kural bozulmuyor ve landing'in görselleri tek bir çekime dayanıyor.
// Kırpma geometrileri ve üretim prompt'ları `~/assets/landing/README.md`.
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

import {
  faviconImageKey,
  mapFrameImageKey,
  type BlockSize,
  type ProfileBlock,
} from "@caka/shared";

import avatarElif from "~/assets/landing/avatar-elif.webp";
import avatarKerem from "~/assets/landing/avatar-kerem.webp";
import avatarNaz from "~/assets/landing/avatar-naz.webp";
import avatarSelin from "~/assets/landing/avatar-selin.webp";
import coverGeceYolu from "~/assets/landing/cover-gece-yolu.webp";
import coverSadeHayat from "~/assets/landing/cover-sade-hayat.webp";
import detailElif from "~/assets/landing/detail-elif.webp";
import detailNaz from "~/assets/landing/detail-naz.webp";
import mapTown from "~/assets/landing/map-town.webp";
import sceneKaan from "~/assets/landing/scene-kaan.webp";
import sceneNaz from "~/assets/landing/scene-naz.webp";
import sceneOzan from "~/assets/landing/scene-ozan.webp";
import sceneSelin from "~/assets/landing/scene-selin.webp";
import sceneSelinTools from "~/assets/landing/scene-selin-tools.webp";
import { githubLoginKey, type GithubCalendar } from "~/lib/github-calendar";

/** Personaların çevrilen kart metinleri; kimlikleri bu dosyada. */
export interface HeroTowerCopy {
  kerem: { bio: string; status: string; document: string; link: string };
  selin: { bio: string; status: string; link: string; location: string; country: string };
  elif: { bio: string; status: string; youtube: string; link: string };
  naz: { bio: string; status: string; text: string; link: string };
}

/**
 * ÖLÇÜLER YARIM BİRİMDE — ürünün ızgarasının birebir aynısı (`GRID_UNIT`,
 * `@caka/shared`): 8 sütun, `grid-auto-rows: 72px`, 12px boşluk.
 *
 *   genişlik   2 → 178px   3 → 273px   4 → 368px   5 → 463px   6 → 558px
 *   yükseklik  1 →  72px   2 → 156px   3 → 240px   4 → 324px
 *
 * Bu yüzden şerit artık "eşit karo" değil: bir sütunda tek büyük kart, bir
 * sonrakinde üst üste iki küçük kart durabiliyor. Kartlar konteyner
 * sorgusuyla çalıştığı için AYNI blok iki ölçüde iki farklı düzen gösteriyor
 * (Spotify'ın kompakt/kapaklı hâli, bağlantı kartının kapaklı/sade hâli) —
 * ölçü çeşitliliği süs değil, ürünün yeteneği.
 */
export type TowerSpanW = 2 | 3 | 4 | 5 | 6 | 8;
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
 * Kartların görselleri — ŞERİDİN TEK GÖRSEL LİSTESİ.
 *
 * Düzen bu listeye bağlı DEĞİL: kutu ölçüleri kartın kendi oranından
 * seçiliyor (bkz. `heroTowerRows`), görseller yalnız o kutuları dolduruyor.
 * Yeni bir görsel seti geldiğinde değişmesi gereken tek yer burası ve
 * yukarıdaki import'lardır; satırlara, sütunlara, ölçülere dokunmak
 * gerekmez.
 *
 * Gerçek üründe bu eşlemeyi loader imzalı proxy yoluyla doldurur
 * (`server/layout-images.ts`); burada doğrudan paketlenmiş dosyalar
 * veriliyor — sözleşme aynı: blok kimliği → görsel adresi.
 *
 * GÖRSEL TAŞIYABİLEN HER KART BURADA DOLU. Boş bırakılan profil kartı baş
 * harf çipine düşerdi ("KA" gibi) ve şerit tam da o yer tutucudan
 * kurtarılıyor. Dar sosyal kartlar (178px) og GÖSTERMEZ — onların görsel
 * çapası platform ikonudur, baş harf değil.
 */
export const heroTowerImages: Readonly<Record<string, string>> = {
  // Manzara görseller (1,91:1 — `.link-og`, `.social-og`, video kapağı).
  // Her biri BİR kez geçiyor: aynı görselin iki kartta çıkması şeridi
  // "dört fotoğrafla on beş yer doldurulmuş" gibi gösteriyordu.
  // İki kadraj KARAKTER ŞERİDİNDEN geliyor (`assets/landing/vitrin/`): Kaan'ın
  // set ekipmanı Elif'in "kamera arkası" videosunun kapağına, Ozan'ın plak +
  // amfi köşesi Kerem'in konser bağlantısına düşüyor. İkisi de KİŞİSİZ kırpma
  // — kart görselinin kimlik iddiası taşımaması kuralı korunuyor (yukarı bkz.).
  "demo-elif-youtube": sceneKaan,
  "demo-naz-nsosyal": sceneNaz,
  "demo-selin-link": sceneSelin,
  "demo-kerem-link": sceneOzan,
  // Kare kapaklar (`.sp-cover`).
  "demo-kerem-spotify": coverGeceYolu,
  "demo-elif-spotify": coverSadeHayat,
  // Yuvarlak portreler (profil avatarı).
  "demo-kerem-profile": avatarKerem,
  "demo-selin-profile": avatarSelin,
  "demo-elif-profile": avatarElif,
  "demo-naz-profile": avatarNaz,
  // Bağlantı kartının marka çipi. Favicon YOKSA kart alan adının BAŞ HARFİNİ
  // gösteriyor ("S", "K") — şeritte yer tutucu harf bırakmamak için iki
  // kişisel sitenin favicon'u sahibinin portresi. (Kişisel sitelerde
  // gerçekten de sık rastlanan bir seçim.)
  // Kişi TAŞIMAYAN detay kırpmaları: sosyal kartın og önizlemesi.
  "demo-selin-threads": sceneSelinTools,
  "demo-elif-linkedin": detailElif,
  "demo-naz-link": detailNaz,
  // Yalnız BAŞLIKLI iki bağlantı kartına: 368×156'lık kartlar tam kapak
  // bandında ve marka çipini hiç basmıyor, oraya favicon vermek DOM'a
  // görünmeyen bir görsel eklemek olurdu.
  [faviconImageKey("demo-selin-link")]: avatarSelin,
  [faviconImageKey("demo-elif-link")]: avatarElif,
  // Konum kartının harita karesi. ÜRETİLMİŞ, gerçek coğrafya DEĞİL — ve
  // bu bilinçli bir karar, eksiklik değil:
  //
  //   1. Mapbox Product Terms §2.8.1 harita içeriğini önbelleğe almayı,
  //      proxy'lemeyi ve statik görsel olarak saklayıp dağıtmayı açıkça
  //      yasaklıyor. Yani Mapbox'tan bir kare indirip repoya koymak
  //      yapılamaz; kalan tek yol karenin doğrudan Mapbox'tan çekilmesi.
  //   2. O yol landing'i üçüncü tarafa açardı. Sayfanın DİBİNDE "reklam ve
  //      analitik çerezi kullanmıyoruz" yazıyor; her ziyaretçinin IP/UA'sını
  //      bir sağlayıcıya göndermek o iddianın yanına yakışmıyor ve çerez
  //      envanteri/satıcı sicili işi de açardı.
  //   3. Statik Görsel API'sinin ücretsiz kademesi aylık 50 bin istek ve
  //      HARCAMA TAVANI YOK. Landing en çok görüntülenen sayfa; oraya
  //      ölçülmemiş ve üst sınırsız bir fatura kalemi koymak yanlış.
  //
  // Ürünün GERÇEK konum kartı Mapbox'tan gelmeye devam ediyor; değişen
  // yalnız landing'in dekoratif demosu. Yalnız "far" karesi verildi:
  // yakınlaşma animasyonu ikinci bir kare ister, o da ikinci bir görsel.
  [mapFrameImageKey("far", 37.03, 27.43)]: mapTown,
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
 * KUTU KARTA GÖRE SEÇİLİR, tersi değil. Kartlar konteyner sorgusuyla
 * çalışıyor ve her tipin kendi doğal oranı var; kutu ona uymazsa kart
 * içeriğini bir kenara toplar ve ortada ölü boşluk kalır. Ölçülen eşleşmeler
 * (kart → kutunun kartı DOLDURDUĞU ölçü):
 *
 *   profil, çıplak sosyal, og'suz bağlantı  → 178×156
 *   durum                                   → 178×72 / 273×72 / 368×72
 *   metin                                   → 273×156
 *   spotify (kapak = kutu yüksekliği kare)  → 368×156
 *   og'lu bağlantı, dolu kapak              → 368×156 (metin gizlenir)
 *   og'lu bağlantı, kapak + başlık          → 368×324 (og eni 370 ≈ kutu)
 *   og'lu sosyal                            → 273×240 / 463×324
 *   YouTube video (16:9)                    → 463×324
 *   belge (3 sütun)                         → 463×240
 *   github ısı grafiği                      → 368×240
 *   konum (tam taşan harita)                → 463×324
 *
 * Aynı tipi iki ölçüde koymak bilinçli: Spotify'ın kompakt oynatıcısı ile
 * kapaklı hâli, bağlantının dolu kapaklı hâli ile başlıklı hâli yan yana
 * görünüyor — çeşitlilik süs değil, ürünün konteyner sorgusunun kendisi.
 *
 * İKİ KURAL — ekleme yaparken koru:
 *   1. Bir sütunun kartlarının yükseklikleri satırı TAM doldurur (12px
 *      boşluklarla): h4 = 4 | 2+2 | 1+2+1 | 3+1, h3 = 3 | 2+1 | 1+2,
 *      h2 = 2 | 1+1.
 *   2. Yan yana (ve üst üste) gelen kartlar farklı personalara aittir;
 *      satırın SON sütunu ile İLK sütunu da komşudur — döngü orada sarar.
 *      Satır başlangıçları da kaydırılmıştır (Elif → Kerem → Naz).
 */
export function heroTowerRows(copy: HeroTowerCopy): TowerRow[] {
  return [
    // ---- Satır 0 (h4 = 324px): tabanı yüksek kartların satırı.
    // Sıra: Elif · Kerem · Naz · Selin · Kerem · Selin
    {
      h: 4,
      columns: [
        {
          w: 5,
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
          w: 5,
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
                id: "demo-selin-link",
                type: "link",
                size: "2x2",
                data: {
                  title: copy.selin.link,
                  url: "https://selindemir.com/koleksiyon",
                  ogImage: "https://selindemir.com/og.jpg",
                  favicon: "https://selindemir.com/favicon.ico",
                },
              },
            },
          ],
        },
        {
          w: 4,
          cells: [
            {
              h: 2,
              block: {
                id: "demo-kerem-spotify",
                type: "spotify",
                size: "2x1",
                data: {
                  kind: "album",
                  url: "https://open.spotify.com/album/1A2B3C4D5E6F7G8H9I0J",
                  entityId: "1A2B3C4D5E6F7G8H9I0J",
                  title: "Gece Yolu",
                  thumbnail: "https://i.scdn.co/image/demo-gece-yolu",
                },
              },
            },
            {
              h: 2,
              // 368×156: kart tam kapak bandına düşer, görsel kutuyu uçtan
              // uca doldurur. Aynı bloğun başlıklı hâli Selin'de (368×324).
              block: {
                id: "demo-kerem-link",
                type: "link",
                size: "2x1",
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
          w: 5,
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
      ],
    },
    // ---- Satır 1 (h3 = 240px). Sıra: Kerem · Selin · Elif · Naz · Kerem · Elif
    {
      h: 3,
      columns: [
        {
          w: 5,
          cells: [
            {
              h: 3,
              block: {
                id: "demo-kerem-document",
                type: "document",
                size: "2x2",
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
          ],
        },
        {
          w: 3,
          cells: [
            { h: 3, block: social("demo-selin-threads", "threads", "selindemir", "2x2", true) },
          ],
        },
        {
          w: 4,
          cells: [
            {
              h: 2,
              block: {
                id: "demo-elif-spotify",
                type: "spotify",
                size: "2x1",
                data: {
                  kind: "show",
                  url: "https://open.spotify.com/show/2K3L4M5N6O7P8Q9R0S1T",
                  entityId: "2K3L4M5N6O7P8Q9R0S1T",
                  title: "Sade Hayat",
                  thumbnail: "https://i.scdn.co/image/demo-sade-hayat",
                },
              },
            },
            { h: 1, block: status("demo-elif-status", copy.elif.status, "2x1") },
          ],
        },
        {
          // 368, 273 degil: Ispanyolca durum metni ("Agenda abierta para
          // grabar") 273'te ikinci satira tasip 72px'lik kutuya sigmiyordu.
          // Metin karti da 368x156'da doluyor.
          w: 4,
          cells: [
            {
              h: 2,
              block: {
                id: "demo-naz-text",
                type: "text",
                size: "2x1",
                data: { text: copy.naz.text },
              },
            },
            { h: 1, block: status("demo-naz-status", copy.naz.status, "2x1") },
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
          w: 3,
          cells: [
            { h: 3, block: social("demo-elif-linkedin", "linkedin", "elifkaya", "2x2", true) },
          ],
        },
      ],
    },
    // ---- Satır 2 (h2 = 156px): küçük kartların ritmi. Profil kartları
    // burada yaşar — 178×156 onların TAM dolduğu tek ölçü ve h2 satırında
    // dar bir sütun o kartı tek başına taşıyabiliyor.
    // Sıra: Naz · Selin · Elif · (Kerem+Selin) · Naz · Elif · Selin
    {
      h: 2,
      columns: [
        {
          w: 4,
          cells: [
            {
              h: 2,
              block: {
                id: "demo-naz-link",
                type: "link",
                size: "2x1",
                data: {
                  title: copy.naz.link,
                  url: "https://nazerdem.com/hikayeler",
                  ogImage: "https://nazerdem.com/og.jpg",
                  favicon: "",
                },
              },
            },
          ],
        },
        {
          w: 2,
          cells: [{ h: 2, block: profile("demo-selin-profile", "Selin Demir", copy.selin.bio) }],
        },
        {
          w: 2,
          cells: [{ h: 2, block: profile("demo-elif-profile", "Elif Kaya", copy.elif.bio) }],
        },
        {
          // Durum kartı 72px'e sığar ama TEK SATIRDA: 178px'lik bir kutuda
          // Almanca ve İspanyolca metinler ikinci satıra taşıyordu. Bu
          // yüzden durum kartlarının en dar kutusu 273px.
          w: 3,
          cells: [
            { h: 1, block: status("demo-kerem-status", copy.kerem.status, "2x1") },
            { h: 1, block: status("demo-selin-status", copy.selin.status, "2x1") },
          ],
        },
        {
          w: 2,
          cells: [{ h: 2, block: profile("demo-naz-profile", "Naz Erdem", copy.naz.bio) }],
        },
        {
          w: 2,
          cells: [
            {
              h: 2,
              // og YOK: 178×156'da bağlantı kartı marka çipi + başlık + alan
              // adı düzenine geçiyor ve kutuyu dolduruyor. Çipin baş harfini
              // favicon örtüyor.
              block: {
                id: "demo-elif-link",
                type: "link",
                size: "1x1",
                data: {
                  title: copy.elif.link,
                  url: "https://elifkaya.com/bolumler",
                  ogImage: "",
                  favicon: "https://elifkaya.com/favicon.ico",
                },
              },
            },
          ],
        },
        {
          w: 2,
          cells: [{ h: 2, block: social("demo-selin-instagram", "instagram", "selindemir") }],
        },
      ],
    },
  ];
}
