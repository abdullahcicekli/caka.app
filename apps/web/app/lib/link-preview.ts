/**
 * Bağlantı kartının GÖRSELSİZ hâli için saf yardımcılar (plan KD7/R61).
 *
 * NEDEN BURASI: ölçüm, tipik 16 link hedefinin yalnız 7'sinin og:image
 * verdiğini gösterdi — Instagram, TikTok, Spotify, Trendyol vermiyor. Yani
 * önizlemesiz kart istisna değil, ÇOĞUNLUK yolu. O kartın da bir görsel
 * çapası olmalı: marka renginde bir çip ve alan adının baş harfi.
 *
 * FAVICON BİLEREK YOK: uzak favicon çekmek ziyaretçiyi üçüncü tarafa
 * bağlardı (R58) ve proxy imzası gerektirirdi; üstelik her host vermiyor.
 * Baş harf + marka rengi hiç istek atmadan aynı işi görüyor.
 *
 * Saf ve senkron: SSR ile hidrasyon aynı sonucu üretmek zorunda, bu yüzden
 * ne rastgelelik ne de `Intl`/`Date` kullanılır.
 */

/** Alan adının son etiketiyle birlikte atılan ikinci düzey ekler. */
const SECOND_LEVEL_SUFFIXES = new Set(["com", "net", "org", "gov", "edu", "co", "av", "gen"]);

/** Adres önekinde anlam taşımayan alt alanlar. */
const NOISE_SUBDOMAINS = new Set(["www", "m", "mobile", "open", "play", "shop"]);

/**
 * Host soneki → çip sınıfı. Sosyal platformların tonu zaten `.platform-*`
 * altında tanımlı; tekrar etmemek için oradan okunur.
 */
const BRAND_TONES: [string, string][] = [
  ["instagram.com", "platform-instagram"],
  ["tiktok.com", "platform-tiktok"],
  ["youtube.com", "platform-youtube"],
  ["youtu.be", "platform-youtube"],
  ["x.com", "platform-x"],
  ["twitter.com", "platform-x"],
  ["github.com", "platform-github"],
  ["linkedin.com", "platform-linkedin"],
  ["facebook.com", "platform-facebook"],
  ["twitch.tv", "platform-twitch"],
  ["dribbble.com", "platform-dribbble"],
  ["threads.net", "platform-threads"],
  ["threads.com", "platform-threads"],
  ["nsosyal.com", "platform-nsosyal"],
  ["spotify.com", "link-tone-spotify"],
  ["trendyol.com", "link-tone-trendyol"],
  ["hepsiburada.com", "link-tone-hepsiburada"],
  ["sahibinden.com", "link-tone-sahibinden"],
  ["substack.com", "link-tone-substack"],
  ["soundcloud.com", "link-tone-soundcloud"],
  ["pinterest.com", "link-tone-pinterest"],
  ["behance.net", "link-tone-behance"],
  ["figma.com", "link-tone-figma"],
  ["discord.com", "link-tone-discord"],
  ["discord.gg", "link-tone-discord"],
  ["t.me", "link-tone-telegram"],
  ["telegram.me", "link-tone-telegram"],
  ["wa.me", "link-tone-whatsapp"],
  ["whatsapp.com", "link-tone-whatsapp"],
  ["etsy.com", "link-tone-etsy"],
  ["amazon.com", "link-tone-amazon"],
  ["amazon.com.tr", "link-tone-amazon"],
  ["medium.com", "link-tone-siyah"],
  ["notion.so", "link-tone-siyah"],
  ["notion.site", "link-tone-siyah"],
  ["patreon.com", "link-tone-siyah"],
  ["apple.com", "link-tone-siyah"],
];

/** Markası bilinmeyen hostlar için token tabanlı ton havuzu. */
const GENERIC_TONE_COUNT = 6;

export type LinkBrand = {
  /** Çipin arka plan sınıfı. */
  tone: string;
  /** Çipte görünen tek harf (Türkçe büyütme kuralıyla). */
  initial: string;
};

function toUrl(value: string): URL | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

/** Host'un anlam taşıyan etiketleri: gürültülü alt alanlar ve TLD atılır. */
function brandLabels(hostname: string): string[] {
  const labels = hostname.toLowerCase().replace(/\.$/, "").split(".").filter(Boolean);
  while (labels.length > 1 && NOISE_SUBDOMAINS.has(labels[0]!)) labels.shift();
  if (labels.length > 1) labels.pop();
  if (labels.length > 1 && SECOND_LEVEL_SUFFIXES.has(labels[labels.length - 1]!)) labels.pop();
  return labels;
}

/**
 * Host dizesinden kararlı bir sayı üretir (FNV-1a 32 bit). Aynı alan adı her
 * zaman aynı tonu alır; sunucu ve tarayıcı ayrışmaz.
 */
function hostHash(host: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < host.length; index += 1) {
    hash ^= host.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/** Adresin okunur hedefi: "www." ve sorgu/çapa atılır, yol korunur. */
export function prettyLinkTarget(value: string, maxLength = 38): string {
  const url = toUrl(value);
  if (!url) return value.trim();
  const host = url.hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  let path = "";
  try {
    path = decodeURIComponent(url.pathname);
  } catch {
    path = url.pathname;
  }
  path = path.replace(/\/+$/, "");
  const full = `${host}${path}`;
  if (full.length <= maxLength) return full;
  // Host her zaman görünür kalır; kısaltma yalnız yolu yer.
  const room = Math.max(0, maxLength - host.length - 1);
  return room <= 1 ? host : `${host}${path.slice(0, room)}…`;
}

/**
 * Yalnız alan adı ("trendyol.com"). Başlığı boş kalan taslak kartta başlık
 * yerine geçer; alt satırdaki yollu hâlle aynı metni iki kez yazmamak için.
 */
export function linkHostLabel(value: string): string {
  const url = toUrl(value);
  if (!url) return value.trim();
  return url.hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
}

/** Kartın görsel çapası: marka tonu + baş harf. */
export function linkBrand(value: string): LinkBrand {
  const url = toUrl(value);
  const host = url ? url.hostname.toLowerCase().replace(/\.$/, "") : "";
  if (!host) return { tone: "link-tone-1", initial: "•" };

  const known = BRAND_TONES.find(([suffix]) => host === suffix || host.endsWith(`.${suffix}`));
  const labels = brandLabels(host);
  const name = labels[labels.length - 1] ?? host;
  const first = /[\p{L}\p{N}]/u.exec(name)?.[0] ?? "•";
  return {
    tone: known?.[1] ?? `link-tone-${(hostHash(host) % GENERIC_TONE_COUNT) + 1}`,
    // Türkçe büyütme: "i" → "İ" (locale'siz büyütme "I" verirdi).
    initial: first.toLocaleUpperCase("tr"),
  };
}
