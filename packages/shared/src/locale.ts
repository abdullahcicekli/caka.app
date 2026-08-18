// L1–L3: Ürünün dil listesi ve bir isteğin hangi dille karşılanacağının tek
// kaynağı. Saf tutulur (istek/çerez okuma `apps/web/server/locale.ts`'te) ki
// çözümleme zinciri Worker'sız test edilebilsin.
//
// Türkçe kanoniktir ve **öneksizdir**: `/gizlilik` bugünkü adresidir, `/tr/...`
// diye ikinci bir kanonik adres üretilmez (L5). Bu yüzden `localeFromPrefix`
// "tr" segmentini bilerek tanımaz.

/** Desteklenen diller — sıra ürün önceliğidir, seçicide de bu sırayla görünür. */
export const SUPPORTED_LOCALES = ["en", "tr", "es", "pt-BR", "de"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Hiçbir sinyal tutmadığında düşülen dil (L2). */
export const DEFAULT_LOCALE: Locale = "tr";

/**
 * Dillerin kendi dillerindeki adları. Seçici bunları çevirmez: Almanca bilen
 * biri listede "Almanca"yı değil "Deutsch"u arar.
 */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  tr: "Türkçe",
  es: "Español",
  "pt-BR": "Português (Brasil)",
  de: "Deutsch",
};

/**
 * Dilin URL öneki. Türkçe boş string alır — öneksizdir.
 *
 * Önekler küçük harftir (`pt-br`); `pt-BR` yalnızca kod içi dil kimliğidir.
 * `pt-br` beş karakterli geçerli bir kullanıcı adı deseni olduğu için
 * `RESERVED_USERNAMES`'e girer (L20, Değişmez #1); diğer önekler
 * `USERNAME_MIN`in altında kaldığından zaten alınamaz.
 */
const PREFIX_BY_LOCALE: Record<Locale, string> = {
  en: "en",
  tr: "",
  es: "es",
  "pt-BR": "pt-br",
  de: "de",
};

const LOCALE_BY_PREFIX = new Map<string, Locale>(
  SUPPORTED_LOCALES.filter((locale) => PREFIX_BY_LOCALE[locale] !== "").map(
    (locale) => [PREFIX_BY_LOCALE[locale], locale],
  ),
);

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Dilin URL öneki; Türkçede boş string. */
export function prefixForLocale(locale: Locale): string {
  return PREFIX_BY_LOCALE[locale];
}

/** Yol segmentini dile çevirir. Türkçe önek taşımadığı için "tr" tanınmaz. */
export function localeFromPrefix(prefix: string): Locale | null {
  return LOCALE_BY_PREFIX.get(prefix) ?? null;
}

/**
 * Bir BCP-47 dil etiketini desteklenen bir dile eşler.
 *
 * Bölge etiketi düşürülür (`en-US` → `en`), Portekizcenin bütün varyantları
 * `pt-BR`ye toplanır: ürün tek bir Portekizce sürüm tutuyor ve Brezilya
 * sürümünü Portekiz'den gelen ziyaretçiye vermek, İngilizce vermekten iyidir.
 */
function localeFromLanguageTag(tag: string): Locale | null {
  const normalized = tag.trim().toLowerCase();
  if (!normalized || normalized === "*") return null;

  const base = normalized.split("-")[0];
  if (base === "pt") return "pt-BR";
  if (base === "en") return "en";
  if (base === "tr") return "tr";
  if (base === "es") return "es";
  if (base === "de") return "de";
  return null;
}

interface WeightedTag {
  locale: Locale;
  quality: number;
}

/**
 * `Accept-Language` başlığından en yüksek q değerli desteklenen dili seçer.
 *
 * q ayrıştırılamıyorsa girdi elenmez, en sona atılır: bozuk bir q yüzünden
 * tarayıcının tek dil tercihini görmezden gelmek, onu yanlış sıraya koymaktan
 * kötüdür. `q=0` ise açık bir REDDETME'dir ve girdi tamamen düşer.
 */
export function parseAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;

  const weighted: WeightedTag[] = [];

  for (const part of header.split(",")) {
    const [tag, ...parameters] = part.split(";");
    const locale = localeFromLanguageTag(tag ?? "");
    if (!locale) continue;

    const qParameter = parameters
      .map((parameter) => parameter.trim())
      .find((parameter) => parameter.startsWith("q="));

    let quality = 1;
    if (qParameter) {
      const parsed = Number.parseFloat(qParameter.slice(2));
      if (Number.isNaN(parsed)) quality = 0;
      else if (parsed <= 0) continue;
      else quality = parsed;
    }

    weighted.push({ locale, quality });
  }

  if (weighted.length === 0) return null;

  // Array.prototype.sort kararlıdır: eşit q'da başlıktaki sıra korunur.
  weighted.sort((a, b) => b.quality - a.quality);
  return weighted[0]?.locale ?? null;
}

export interface LocaleSignals {
  /** URL önekinden çözülen dil — varsa tartışmasız kazanır. */
  pathLocale?: Locale | null;
  /** `caka_dil` çerezinin ham değeri. */
  cookie?: string | null;
  /** İsteğin `Accept-Language` başlığı. */
  acceptLanguage?: string | null;
}

/**
 * L2 zinciri: URL öneki → çerez → `Accept-Language` → Türkçe.
 *
 * İlk tutan kazanır. Çerez, kullanıcının açık seçimidir; Almanca tarayıcıda
 * Türkçeyi seçmiş birine Almanca dayatmaz.
 */
export function resolveLocale({
  pathLocale,
  cookie,
  acceptLanguage,
}: LocaleSignals): Locale {
  if (pathLocale) return pathLocale;
  if (cookie && isSupportedLocale(cookie)) return cookie;
  return parseAcceptLanguage(acceptLanguage) ?? DEFAULT_LOCALE;
}
