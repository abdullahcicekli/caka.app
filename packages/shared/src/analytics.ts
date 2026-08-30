// Panel analitiği — birinci taraf ziyaret/tıklama ölçümünün saf kuralları
// (R48). Bu dosyada ziyaretçiye ait hiçbir tanımlayıcı kavramı yoktur: ölçüm
// yalnızca "hangi profil, hangi gün, hangi ülke, kaç kez" sorusunu yanıtlar.
// Tekil ziyaretçi metriği bilinçli olarak yoktur (OQ6) — üretmek için cihaza
// yazmak ya da IP türevi bir parmak izi tutmak gerekirdi; ikisi de yasak.

import type { ProfileBlock, ProfileLayout } from "./layout";

/**
 * Gün kovaları Türkiye saatine göre kesilir. Türkiye 2016'dan beri sabit
 * UTC+3 kullanıyor (yaz saati uygulaması kaldırıldı), bu yüzden zaman dilimi
 * veritabanına ihtiyaç yok — sabit ofset yeterli ve deterministik.
 */
export const OLCUM_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Panelde gösterilen pencere. Daha eskisi saklanır ama panelde toplanmaz. */
export const OLCUM_PENCERE_GUN = 30;

/** Ülkesi çözülemeyen istekler için ayrılmış kod (ISO 3166-1'de kullanılmaz). */
export const OLCUM_BILINMEYEN_ULKE = "XX";

/**
 * Eşiğin altında kalan ülkelerin toplandığı kova. `XX`'ten ayrı bir koddur:
 * `XX` "ülkesini çözemedik" der, bu ise "çözdük ama söylemiyoruz" der.
 * `ZZ` de `XX` gibi ISO 3166-1'de kullanıcıya ayrılmıştır, gerçek bir ülkeyi
 * gölgelemez.
 */
export const OLCUM_DIGER_ULKE = "ZZ";

/**
 * Ülke satırının tek tek gösterilebilmesi için gereken en az ziyaret sayısı.
 *
 * Neden var: `link_click_daily` şeması ülkeyi bilerek tutmuyor, gerekçesi
 * yeniden kimliklendirme riski. Aynı gerekçe ülke kırılımı için de geçerli —
 * bağlantısını yalnız birkaç kişiyle paylaşan bir yaratıcı, "DE: 1" satırında
 * tek bir ziyaretçinin nerede olduğunu okuyabilirdi.
 *
 * Neden 5: kırılım toplulaştırılmış istatistik yayınında yerleşik k-anonimlik
 * tabanıdır ve buradaki en küçük anlamlı kova boyutudur. Daha düşük bir k
 * (2-3) tek kişilik ifşayı ancak bir ziyaret kaydırarak engeller; daha yüksek
 * bir k ise yeni sayfaların kırılımını aylarca tümüyle boş bırakırdı. Eşiğin
 * altındaki satırlar SİLİNMEZ, `OLCUM_DIGER_ULKE` kovasında toplanır: toplam
 * korunur, açığa çıkan tek şey "bu kadar ziyaret listelenmeyen ülkelerden
 * geldi" olur — hangi ülke olduğu değil.
 */
export const OLCUM_ULKE_ESIGI = 5;

/** `Date` → Türkiye günü anahtarı (`YYYY-MM-DD`). */
export function dayKey(date: Date): string {
  return new Date(date.getTime() + OLCUM_OFFSET_MS).toISOString().slice(0, 10);
}

/** Gün anahtarını `days` kadar kaydırır (negatif = geçmişe). */
export function shiftDayKey(key: string, days: number): string {
  const base = Date.parse(`${key}T00:00:00.000Z`);
  if (Number.isNaN(base)) return key;
  return new Date(base + days * DAY_MS).toISOString().slice(0, 10);
}

/** `end` dahil, geriye doğru `days` günlük artan sıralı anahtar dizisi. */
export function dayKeyRange(end: string, days: number): string[] {
  const count = Math.max(1, Math.trunc(days));
  const keys: string[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    keys.push(shiftDayKey(end, -offset));
  }
  return keys;
}

export interface DailyRow {
  day: string;
  count: number;
}

/** `since` (dahil) tarihinden itibaren toplam. Aralık dışı satırlar atlanır. */
export function sumSince(rows: readonly DailyRow[], since: string): number {
  let total = 0;
  for (const row of rows) {
    if (row.day >= since) total += row.count;
  }
  return total;
}

/** Kayıtlı en eski gün; hiç veri yoksa `null`. */
export function earliestDay(rows: readonly { day: string }[]): string | null {
  let earliest: string | null = null;
  for (const row of rows) {
    if (!row.day) continue;
    if (earliest === null || row.day < earliest) earliest = row.day;
  }
  return earliest;
}

/**
 * Seyrek günlük satırları kesintisiz bir seriye açar: veri olmayan günler 0
 * olur. Grafiğin "veri yok" ile "sıfır" arasındaki farkı gizlememesi için
 * pencere her zaman tam uzunlukta döner.
 */
export function buildDailySeries(
  rows: readonly DailyRow[],
  end: string,
  days: number = OLCUM_PENCERE_GUN,
): DailyRow[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.day, (totals.get(row.day) ?? 0) + row.count);
  }
  return dayKeyRange(end, days).map((day) => ({ day, count: totals.get(day) ?? 0 }));
}

export interface CountryRow {
  country: string;
  count: number;
}

/**
 * Ülke kırılımı: çoktan aza, eşitlikte koda göre. `limit` kadarı döner —
 * kuyruk "diğer" olarak toplanmaz, çünkü küçük sayılarda uzun kuyruk
 * göstermek yanıltıcı bir kesinlik hissi verir.
 *
 * `OLCUM_ULKE_ESIGI`'nin altında kalan ülkeler tek tek listelenmez; sayıları
 * `OLCUM_DIGER_ULKE` satırında toplanır ve bu satır her zaman en sonda durur.
 * Böylece tek ziyaretçili bir ülke koduyla ziyaretçinin yeri ele verilmez ama
 * ziyaretler toplamdan da düşmez.
 */
export function topCountries(
  rows: readonly CountryRow[],
  limit = 5,
  esik: number = OLCUM_ULKE_ESIGI,
): CountryRow[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const code = row.country || OLCUM_BILINMEYEN_ULKE;
    totals.set(code, (totals.get(code) ?? 0) + row.count);
  }

  // Eşiğin altındakiler daha `limit` uygulanmadan ayrılır: aksi hâlde
  // gizlenmiş bir satır listede yer kaplayıp gösterilebilir bir ülkeyi dışarı
  // itebilirdi.
  const gorunur: CountryRow[] = [];
  let gizli = 0;
  for (const [country, count] of totals) {
    // Kovanın kendisi eşiğin altındaki satırlardan doğar; girdide böyle bir
    // kod gelirse (ki Cloudflare üretmez) ayrı bir ülke gibi listelenmesin.
    if (count >= esik && country !== OLCUM_DIGER_ULKE) {
      gorunur.push({ country, count });
    } else {
      gizli += count;
    }
  }

  const list = gorunur
    .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country))
    .slice(0, Math.max(0, limit));
  if (gizli > 0) list.push({ country: OLCUM_DIGER_ULKE, count: gizli });
  return list;
}

/** Tıklanabilir blok: paneldeki kırılımın satır kimliği blok id'sidir. */
export interface TrackableLink {
  blockId: string;
  /** Panelde görünen ad; boşsa çağıran taraf tip etiketine düşer. */
  label: string;
  /** Hedef adres (görüntüleme amaçlı; ölçüm kimliği blok id'sidir). */
  url: string;
  type: ProfileBlock["type"];
}

/** Blok gerçekten dış bir adrese gidiyor mu? (mailto dahil değil.) */
// switch + never: yeni bir tıklanabilir blok tipi eklendiğinde derleme
// hatası verir. Eskiden `if` zinciriydi ve yeni tip sessizce ölçüme hiç
// girmiyordu.
function blockUrl(block: ProfileBlock): string {
  switch (block.type) {
    case "social":
    case "link":
    case "status":
      return block.data.url;
    // Fotoğraf bloğu YALNIZ tek fotoğraflıyken bir bağlantı taşır (eski
    // `image` bloğunun davranışı). Çok fotoğraflı blokta tıklama ışık
    // kutusunu açar, dışarı çıkmaz — ölçülecek hedef yok.
    case "gallery":
      return block.data.photos.length <= 1 ? block.data.url : "";
    case "youtube":
    // Spotify kartı yerinde oynatılıyor ama "Spotify'da aç" bağlantısı da
    // taşıyor; ölçülecek hedef odur.
    case "spotify":
      return block.data.url;
    // Belge DIŞ bir adrese gitmiyor (birinci taraf `/b/<id>`) ama indirme,
    // bir CV bloğunun ölçülmeye değer TEK olayı — "kaç kişi indirdi"
    // sorusunun cevabı. Sayı gerçekten indirmedir: kartın "Önizle"
    // bağlantısı ölçümden muaf (`data-measure="skip"`,
    // `components/link-click-beacon.tsx`), yoksa sayaç iki olayın toplamı
    // olur ama indirme diye okunurdu. Ölçüm kimliği yine blok id'si.
    case "document":
      return block.data.assetId ? `/b/${block.data.assetId}` : "";
    case "profile":
    case "text":
    // Konum kartı bir GÖRÜNTÜ; hiçbir yere gitmez (harita sağlayıcısına
    // bağlantı vermek ziyaretçiyi üçüncü tarafa yollamak olurdu).
    case "location":
    // Ayet kartı bir bağlantı DEĞİL: metin kayıtta duruyor, tıklanacak bir
    // hedef yok (R58 — ziyaretçi hiçbir dış kaynağa gitmiyor).
    case "ayet":
    // Yazı blokları İÇ bağlantıdır (/kullanici/yazi-adresi): dış tıklama
    // ölçümünün konusu değiller — konum/ayet ile aynı küme.
    case "posts":
    case "featuredPost":
      return "";
    default: {
      const exhaustive: never = block;
      void exhaustive;
      return "";
    }
  }
}

function blockLabel(block: ProfileBlock): string {
  switch (block.type) {
    case "social":
      return block.data.label || block.data.handle;
    case "link":
    case "gallery":
      return block.data.title;
    case "status":
      return block.data.text;
    case "youtube":
      return block.data.kind === "video"
        ? block.data.title
        : block.data.channelName || block.data.handle;
    case "spotify":
      return block.data.title;
    case "document":
      return block.data.title || block.data.fileName;
    case "profile":
    case "text":
    case "location":
    case "ayet":
    // Yazı blokları etiket taşımaz; ölçüme de girmiyorlar (bkz. `blockUrl`).
    case "posts":
    case "featuredPost":
      return "";
    default: {
      const exhaustive: never = block;
      void exhaustive;
      return "";
    }
  }
}

/**
 * Yayındaki düzendeki tıklanabilir blokları çıkarır. Ölçüm kimliği blok
 * id'sidir: URL değişse de tarih serisi kopmaz, aynı adrese giden iki blok
 * birbirine karışmaz.
 */
export function collectTrackableLinks(layout: ProfileLayout): TrackableLink[] {
  const links: TrackableLink[] = [];
  for (const block of layout.blocks) {
    const url = blockUrl(block).trim();
    if (!url) continue;
    links.push({
      blockId: block.id,
      label: blockLabel(block).trim(),
      url,
      type: block.type,
    });
  }
  return links;
}

/** Blok id'si düzende tıklanabilir bir blok mu? (API doğrulaması.) */
export function isTrackableBlockId(layout: ProfileLayout, blockId: string): boolean {
  return collectTrackableLinks(layout).some((link) => link.blockId === blockId);
}

export interface LinkClickRow {
  blockId: string;
  clicks: number;
}

export interface LinkBreakdownRow extends TrackableLink {
  clicks: number;
}

/**
 * Düzendeki bağlantıları tıklama sayılarıyla birleştirir. Düzenden silinmiş
 * blokların tıklamaları listelenmez — panel "şu an sayfanda duran bağlantılar"
 * sorusunu yanıtlar; silinmiş blokların geçmişi tabloda kalır ama gösterilmez.
 */
export function buildLinkBreakdown(
  links: readonly TrackableLink[],
  clicks: readonly LinkClickRow[],
): LinkBreakdownRow[] {
  const totals = new Map<string, number>();
  for (const row of clicks) {
    totals.set(row.blockId, (totals.get(row.blockId) ?? 0) + row.clicks);
  }
  return links
    .map((link) => ({ ...link, clicks: totals.get(link.blockId) ?? 0 }))
    .sort((a, b) => b.clicks - a.clicks || a.label.localeCompare(b.label, "tr"));
}

const AYLAR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

/**
 * `YYYY-MM-DD` → `17 Ağustos 2026`. Intl yerine elle: Workers'ta locale
 * verisinin varlığına bel bağlamayalım, çıktı her ortamda aynı olsun.
 */
export function formatDayKey(key: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return key;
  const [, year, month, day] = match;
  const name = AYLAR[Number(month) - 1];
  if (!name) return key;
  return `${Number(day)} ${name} ${year}`;
}

/** Binlik ayracı nokta (tr-TR). Intl'e bağımlı değil. */
export function formatCount(value: number): string {
  const safe = Number.isFinite(value) ? Math.trunc(value) : 0;
  const sign = safe < 0 ? "-" : "";
  const digits = Math.abs(safe).toString();
  let out = "";
  for (let index = 0; index < digits.length; index += 1) {
    if (index > 0 && (digits.length - index) % 3 === 0) out += ".";
    out += digits[index];
  }
  return sign + out;
}

/** Ölçüm ülkesini normalize eder: iki büyük harf değilse `XX`. */
export function normalizeCountry(value: string | null | undefined): string {
  const code = (value ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : OLCUM_BILINMEYEN_ULKE;
}

// ── Gelen kaynak (referrer) ────────────────────────────────────────────────
// `Referer` başlığı tam URL taşıyabilir (arama sorgusu, özel grup bağlantısı,
// iç yol). Bu yüzden ham host dahil hiçbir parçası saklanmaz: başlık okunur,
// aşağıdaki SABİT sözlüğe eşlenir ve atılır. Sözlük dar olduğu için ülke
// kırılımındaki k-anonimlik eşiği burada gerekmez — "instagram: 1" satırı
// tek bir ziyaretçinin kim olduğunu söyleyemez, "kisiselblog.net: 1" ise
// söyleyebilirdi; o satır bilerek üretilmiyor.

/** `Referer` başlığı hiç yoksa (adres çubuğu, yer imi, uygulama içi). */
export const OLCUM_KAYNAK_DOGRUDAN = "dogrudan";

/** Sözlükte olmayan her kaynak. Ham host'u bilerek taşımaz. */
export const OLCUM_KAYNAK_DIGER = "diger";

/** Site içi geçiş (caka.app'ten gelen ziyaret). */
export const OLCUM_KAYNAK_CAKA = "caka";

/**
 * Bilinen kaynaklar → host listeleri. Alt alan adları da eşleşir
 * (`l.instagram.com` → instagram). Google TLD çeşitliliği (google.com.tr,
 * google.de, google.co.uk…) listeyle değil desenle yakalanır — aşağıda.
 */
const KAYNAK_HOSTLARI: readonly (readonly [string, readonly string[]])[] = [
  ["x", ["x.com", "twitter.com", "t.co"]],
  ["instagram", ["instagram.com"]],
  ["linkedin", ["linkedin.com", "lnkd.in"]],
  ["github", ["github.com"]],
  ["youtube", ["youtube.com", "youtu.be"]],
  ["tiktok", ["tiktok.com"]],
  ["whatsapp", ["whatsapp.com", "wa.me"]],
  ["facebook", ["facebook.com", "fb.com", "fb.me", "messenger.com"]],
  ["reddit", ["reddit.com", "redd.it"]],
  [OLCUM_KAYNAK_CAKA, ["caka.app"]],
] as const;

/** google.com, google.com.tr, google.de, google.co.uk… (alt alan dahil). */
const GOOGLE_HOST = /(^|\.)google\.(com|[a-z]{2})(\.[a-z]{2})?$/;

/**
 * `Referer` başlığını sabit kaynak adına eşler. Girdinin URL olmaması
 * (bozuk başlık) `diger` sayılır — `dogrudan` yalnızca başlığın hiç
 * gelmediği durumdur; ikisi ayrı bilgi taşır.
 */
export function normalizeReferrer(referer: string | null | undefined): string {
  const raw = (referer ?? "").trim();
  if (!raw) return OLCUM_KAYNAK_DOGRUDAN;

  let host: string;
  try {
    host = new URL(raw).hostname.toLowerCase();
  } catch {
    return OLCUM_KAYNAK_DIGER;
  }
  if (host.startsWith("www.")) host = host.slice(4);

  for (const [source, hosts] of KAYNAK_HOSTLARI) {
    for (const candidate of hosts) {
      if (host === candidate || host.endsWith(`.${candidate}`)) return source;
    }
  }
  if (GOOGLE_HOST.test(host)) return "google";
  return OLCUM_KAYNAK_DIGER;
}

export interface SourceRow {
  source: string;
  count: number;
}

/**
 * Kaynak kırılımı: çoktan aza, eşitlikte ada göre. `limit` üstünde kalanlar
 * `diger` kovasına eklenir ve o satır her zaman en sonda durur — toplam
 * korunur, liste sonsuz uzamaz. Eşik yoktur (bkz. yukarıdaki blok yorumu).
 */
export function topSources(rows: readonly SourceRow[], limit = 5): SourceRow[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const key = row.source || OLCUM_KAYNAK_DIGER;
    totals.set(key, (totals.get(key) ?? 0) + row.count);
  }

  const named: SourceRow[] = [];
  let diger = totals.get(OLCUM_KAYNAK_DIGER) ?? 0;
  for (const [source, count] of totals) {
    if (source !== OLCUM_KAYNAK_DIGER) named.push({ source, count });
  }
  named.sort((a, b) => b.count - a.count || a.source.localeCompare(b.source));

  const visible = named.slice(0, Math.max(0, limit));
  for (const row of named.slice(Math.max(0, limit))) diger += row.count;
  if (diger > 0) visible.push({ source: OLCUM_KAYNAK_DIGER, count: diger });
  return visible;
}
