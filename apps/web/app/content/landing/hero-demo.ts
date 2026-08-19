// Hero şeridindeki örnek Caka sayfaları.
//
// NEDEN GERÇEK BLOKLAR: şerit stok fotoğraf kolajı değil, ürünün KENDİ
// kartlarıyla kurulur (`ProfileBlockCard`). Ziyaretçi Caka'nın gerçekte ne
// ürettiğini görür ve landing'de gösterilenle üründe çıkan şey birbirinden
// ayrışamaz — kartların görünümü değişirse şerit de değişir.
//
// HER KART AYRI BİR KİŞİ — 24 KART, 24 KİŞİ. Şerit önce tek bir ada
// ("Kerem Aydın") bağlıydı, sonra dört personaya bölündü; ama 24 kutuyu dört
// kişiyle doldurmak aynı adı sayfada altı kez gösteriyordu. `keremaydin`
// GitHub'da, `kerem-aydin-basin-kiti.pdf` belgede, `elifkaya` LinkedIn'de,
// `elifkaya.com` bağlantıda, "Elif Kaya" profil kartında — hepsi yan yana.
// Şerit "dört kişiyle doldurulmuş" görünüyordu.
//
// Kadro `~/assets/landing/serit/kadro.json`: slug, ad, cinsiyet, meslek ve
// portre betimlemesi. Her kişinin ADI, KULLANICI ADI, ALAN ADI, MESLEĞİ ve
// AVATARI aynı kişiye ait ve şeritte YALNIZ BİR KART'a düşer. Bir kişiyi
// ikinci bir karta koymak eski kusuru geri getirir.
//
// GÖRSEL HAVUZU: her görsel şeritte YALNIZ BİR KEZ geçer.
//
// İş bölümü şu kurala göre:
//   * YÜZ yalnız AVATARDA. Avatarlar `serit/<slug>.webp` (256×256) —
//     profil kartının portresi ve kişisel alan adlarının favicon çipi.
//   * KART görselleri kişi TAŞIMAZ: kişinin dünyasından bir sahne ya da
//     nesne (stüdyo, atölye tezgâhı, mikrofon, albüm kapağı). Kimlik iddiası
//     taşımadıkları için hangi yüzün çıktığı sorun değil.
//     Görsel kartın KONUSUNU göstermeli — kişi taşımasın AMA bir şey anlatsın.
// Kırpma geometrileri ve üretim prompt'ları `~/assets/landing/README.md`.
//
// BAŞ HARF ÇİPİ YOK. Bağlantı kartı favicon bulamazsa alan adının baş
// harfini marka renkli bir kareye basar ("K", "O"); şeritte bu "görsel
// yüklenmemiş" diye okunur. Kişisel alan adlarının favicon'u sahibinin
// avatarıdır (kişisel sitelerde gerçekten sık rastlanan bir seçim), tanınmış
// servisler kendi marka işaretini çizer. Denetim gözle değil ölçerek:
// `node scripts/serit-denetim.mjs <port>` sıfır bulgu vermeli.
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

import avatarAhmet from "~/assets/landing/serit/ahmet.webp";
import avatarDeniz from "~/assets/landing/serit/deniz.webp";
import avatarEsra from "~/assets/landing/serit/esra.webp";
import avatarYusuf from "~/assets/landing/serit/yusuf.webp";
import avatarFurkan from "~/assets/landing/serit/furkan.webp";
import avatarKaan from "~/assets/landing/serit/kaan.webp";
import avatarOzan from "~/assets/landing/serit/ozan.webp";
import avatarSelin from "~/assets/landing/serit/selin.webp";
import avatarSena from "~/assets/landing/serit/sena.webp";
import coverGeceYolu from "~/assets/landing/cover-gece-yolu.webp";
import coverSadeHayat from "~/assets/landing/cover-sade-hayat.webp";
import mapTown from "~/assets/landing/map-town.webp";
import thumbPodcast from "~/assets/landing/thumb-podcast.webp";
import sceneNaz from "~/assets/landing/scene-naz.webp";
import ogKonser from "~/assets/landing/og-konser.webp";
import sceneMarangoz from "~/assets/landing/scene-marangoz.webp";
import sceneMutfak from "~/assets/landing/scene-mutfak.webp";
import sceneMimar from "~/assets/landing/scene-mimar.webp";
import sceneSelin from "~/assets/landing/scene-selin.webp";
import sceneYazi from "~/assets/landing/scene-yazi.webp";
import { githubLoginKey, type GithubCalendar } from "~/lib/github-calendar";

/**
 * Kartların çevrilen metinleri; kimlikleri (ad, kullanıcı adı, alan adı) bu
 * dosyada kalır. Anahtar = kişinin slug'ı, yani `kadro.json`daki kimliği.
 * Yalnız METİN TAŞIYAN kartların sahipleri burada: sosyal kartlar
 * (kullanıcı adı), Spotify (eser adı) ve GitHub (katkı grafiği) çevrilecek
 * hiçbir şey göstermiyor.
 */
export interface HeroTowerCopy {
  elif: { youtube: string };
  sena: { bio: string };
  selin: { link: string };
  ozan: { link: string };
  onur: { location: string; country: string };
  yusuf: { document: string };
  serkan: { status: string };
  rabia: { text: string };
  can: { status: string };
  furkan: { link: string };
  kaan: { bio: string };
  deniz: { bio: string };
  tolga: { status: string };
  volkan: { status: string };
  ahmet: { bio: string };
  esra: { link: string };
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

/** GitHub kartı Emre'nin (yazılım mühendisi) — kadroda o hattın tek kişisi. */
const GITHUB_HANDLE = "emrekilic";

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
  // Her biri BİR kez geçiyor ve kartın KONUSUNU anlatıyor: Elif'in "kamera
  // arkası" videosuna bir podcast stüdyosu, Ozan'ın konser bağlantısına bir
  // sahne, Halil'in atölye kartına tezgâh, Burak'ın kartına bir iç mekân
  // detayı, Furkan'ın öyküsüne defter-dolmakalem natürmortu. Hiçbirinde
  // kişi yok — kart görseli kimlik iddiası taşımaz.
  "demo-elif-youtube": thumbPodcast,
  "demo-naz-nsosyal": sceneNaz,
  "demo-selin-link": sceneSelin,
  "demo-ozan-link": ogKonser,
  // Kare kapaklar (`.sp-cover`).
  "demo-kerem-spotify": coverGeceYolu,
  "demo-busra-spotify": coverSadeHayat,
  // Yuvarlak portreler (profil avatarı) — kadronun kendi kareleri.
  "demo-sena-profile": avatarSena,
  "demo-kaan-profile": avatarKaan,
  "demo-deniz-profile": avatarDeniz,
  "demo-ahmet-profile": avatarAhmet,
  // Kişi TAŞIMAYAN yakın planlar: sosyal kartın og önizlemesi ve yazarın
  // bağlantısı. GÖRSEL KARTIN SAHİBİNİN İŞİNİ ANLATIR:
  //   Halil  marangoz → rende, keski, talaş olan tezgâh
  //   Burak  mimar    → maket, teknik çizim, cetvel
  //   Furkan yazar    → defter, dolmakalem, kupa (loş çalışma masası)
  // Üçü de bir dönem BAŞKA birinin karesiydi (çömlekçi tezgâhı, raf önünde
  // cam vazo, seslendirmenin masası) ve kart konusuyla ilgisiz duruyordu.
  // Bu yüzden DOSYA ADLARI ARTIK KİŞİYE DEĞİL KONUYA GÖRE: kadro yeniden
  // dağıtılınca kişi adı taşıyan dosya adı yanlışa düşüyor, konu adı düşmüyor.
  "demo-halil-threads": sceneMarangoz,
  "demo-yusuf-link": sceneMutfak,
  "demo-burak-linkedin": sceneMimar,
  "demo-furkan-link": sceneYazi,
  // Bağlantı kartının marka çipi. Favicon YOKSA kart alan adının BAŞ
  // HARFİNİ gösteriyor ("S", "O") — şeritte yer tutucu harf bırakmamak için
  // dört kişisel sitenin favicon'u sahibinin portresi. (Kişisel sitelerde
  // gerçekten de sık rastlanan bir seçim.) Kapaklı iki kart da (368×156)
  // çipi basıyor: kapak bandında da `.link-mark` DOM'da ve görünür.
  [faviconImageKey("demo-selin-link")]: avatarSelin,
  [faviconImageKey("demo-ozan-link")]: avatarOzan,
  [faviconImageKey("demo-furkan-link")]: avatarFurkan,
  [faviconImageKey("demo-esra-link")]: avatarEsra,
  [faviconImageKey("demo-yusuf-link")]: avatarYusuf,
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

/** Sosyal kart kısayolu — kimlik kişinin kendi kullanıcı adından gelir. */
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
      variant: "card",
    },
  };
}

function profile(id: string, name: string, title: string): ProfileBlock {
  return { id, type: "profile", size: "1x1", data: { name, title } };
}

function status(id: string, text: string, size: BlockSize): ProfileBlock {
  return { id, type: "status", size, data: { text, url: "" } };
}

/** Kişisel siteye giden bağlantı kartı; favicon'u sahibinin avatarı. */
function link(
  id: string,
  title: string,
  url: string,
  { og, favicon }: { og: boolean; favicon: boolean },
): ProfileBlock {
  const host = new URL(url).host;
  return {
    id,
    type: "link",
    size: og ? "2x1" : "1x1",
    data: {
      title,
      url,
      ogImage: og ? `https://${host}/og.jpg` : "",
      favicon: favicon ? `https://${host}/favicon.ico` : "",
      // Şema `variant`ı `.default("card")` ile tanımlıyor: girdide isteğe
      // bağlı ama ÇIKTI tipinde zorunlu, o yüzden burada yazılı olmalı.
      variant: "card",
    },
  };
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
 *   2. Her kart AYRI bir kişinin; komşuluk da bu yüzden kendiliğinden
 *      sağlanıyor. Tema komşuluğu ayrı bir mesele ve `hero-tower.tsx`teki
 *      `PERSONA_THEMES` tablosu bu düzenin dört renkle boyanmasıdır —
 *      kart taşırsan o tabloyu da yeniden boya.
 */
export function heroTowerRows(copy: HeroTowerCopy): TowerRow[] {
  return [
    // ---- Satır 0 (h4 = 324px): tabanı yüksek kartların satırı.
    // Elif · (Sena + Zeynep) · Naz · Selin · (Kerem + Ozan) · Onur
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
            { h: 2, block: profile("demo-sena-profile", "Sena Korkmaz", copy.sena.bio) },
            { h: 2, block: social("demo-zeynep-x", "x", "zeynepaydin") },
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
              block: link("demo-selin-link", copy.selin.link, "https://selindemir.com/koleksiyon", {
                og: true,
                favicon: true,
              }),
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
              block: link("demo-ozan-link", copy.ozan.link, "https://ozansahin.com/konserler", {
                og: true,
                favicon: true,
              }),
            },
          ],
        },
        {
          w: 5,
          cells: [
            {
              h: 4,
              block: {
                id: "demo-onur-location",
                type: "location",
                size: "2x2",
                data: {
                  label: copy.onur.location,
                  country: copy.onur.country,
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
    // ---- Satır 1 (h3 = 240px).
    // Yusuf · Halil · (Büşra + Serkan) · (Rabia + Can) · Emre · Burak
    {
      h: 3,
      columns: [
        {
          w: 5,
          cells: [
            {
              h: 3,
              // BELGE KARTI DEĞİL, YALNIZ GÖRSEL BAĞLANTI. Burada 463x240'lık
              // bir belge kartı duruyordu: o boyutta kartın yarısını jenerik
              // PDF sayfa simgesi kaplıyor ve şeridin en büyük öğesi bir yer
              // tutucu grafiği oluyordu. `variant: "image"` kartı bütünüyle
              // görsele bırakıyor; başlık ve adres DOM'da kalır, bağlantının
              // erişilebilir adı onlardan gelir.
              block: {
                id: "demo-yusuf-link",
                type: "link",
                size: "2x2",
                data: {
                  title: copy.yusuf.document,
                  url: "https://yusufates.com/menu",
                  ogImage: "https://yusufates.com/og.jpg",
                  favicon: "https://yusufates.com/favicon.ico",
                  variant: "image",
                },
              },
            },
          ],
        },
        {
          w: 3,
          cells: [
            { h: 3, block: social("demo-halil-threads", "threads", "halilbarut", "2x2", true) },
          ],
        },
        {
          w: 4,
          cells: [
            {
              h: 2,
              block: {
                id: "demo-busra-spotify",
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
            { h: 1, block: status("demo-serkan-status", copy.serkan.status, "2x1") },
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
                id: "demo-rabia-text",
                type: "text",
                size: "2x1",
                data: { text: copy.rabia.text },
              },
            },
            { h: 1, block: status("demo-can-status", copy.can.status, "2x1") },
          ],
        },
        {
          w: 4,
          cells: [
            {
              h: 3,
              block: {
                id: "demo-emre-github",
                type: "social",
                size: "2x2",
                data: {
                  platform: "github",
                  handle: GITHUB_HANDLE,
                  url: `https://github.com/${GITHUB_HANDLE}`,
                  label: "",
                  ogImage: "",
                  favicon: "",
                  variant: "card",
                },
              },
            },
          ],
        },
        {
          w: 3,
          cells: [
            { h: 3, block: social("demo-burak-linkedin", "linkedin", "buraktunc", "2x2", true) },
          ],
        },
      ],
    },
    // ---- Satır 2 (h2 = 156px): küçük kartların ritmi. Profil kartları
    // burada yaşar — 178×156 onların TAM dolduğu tek ölçü ve h2 satırında
    // dar bir sütun o kartı tek başına taşıyabiliyor.
    // Furkan · Kaan · Deniz · (Tolga + Volkan) · Ahmet · Esra · Mert
    {
      h: 2,
      columns: [
        {
          w: 4,
          cells: [
            {
              h: 2,
              block: link("demo-furkan-link", copy.furkan.link, "https://furkanyalcin.com/oykuler", {
                og: true,
                favicon: true,
              }),
            },
          ],
        },
        {
          w: 2,
          cells: [{ h: 2, block: profile("demo-kaan-profile", "Kaan Demirtaş", copy.kaan.bio) }],
        },
        {
          w: 2,
          cells: [{ h: 2, block: profile("demo-deniz-profile", "Deniz Aksu", copy.deniz.bio) }],
        },
        {
          // Durum kartı 72px'e sığar ama TEK SATIRDA: 178px'lik bir kutuda
          // Almanca ve İspanyolca metinler ikinci satıra taşıyordu. Bu
          // yüzden durum kartlarının en dar kutusu 273px.
          w: 3,
          cells: [
            { h: 1, block: status("demo-tolga-status", copy.tolga.status, "2x1") },
            { h: 1, block: status("demo-volkan-status", copy.volkan.status, "2x1") },
          ],
        },
        {
          w: 2,
          cells: [{ h: 2, block: profile("demo-ahmet-profile", "Ahmet Duran", copy.ahmet.bio) }],
        },
        {
          w: 2,
          cells: [
            {
              h: 2,
              // og YOK: 178×156'da bağlantı kartı marka çipi + başlık + alan
              // adı düzenine geçiyor ve kutuyu dolduruyor. Çipin baş harfini
              // favicon örtüyor.
              block: link("demo-esra-link", copy.esra.link, "https://esrapolat.com/siparis", {
                og: false,
                favicon: true,
              }),
            },
          ],
        },
        {
          w: 2,
          cells: [{ h: 2, block: social("demo-mert-instagram", "instagram", "mertacar") }],
        },
      ],
    },
  ];
}
