/**
 * Yazı adresi (slug) kuralları — tek kaynak (R3, R19).
 * Kullanıcı adı kurallarıyla (username.ts) aynı akışı izler ama ondan
 * BAĞIMSIZDIR: rezerve listeler karışmaz — `RESERVED_USERNAMES` top-level
 * adresleri korur, buradaki liste profil ALTINDAKİ segmentleri korur.
 * Katman kullanıcıya görünen metin taşımaz (Değişmez #5): kimlik döndürür,
 * cümleyi içerik katalogları kurar.
 */

export const POST_SLUG_MIN = 3;
export const POST_SLUG_MAX = 80;

/**
 * Profil altında yazıya verilemeyecek segmentler. Liste R3'te sayılan NİHAİ
 * listedir; ek kelime plan değişikliği gerektirir, uygulama takdiri değildir.
 * `og` ve `s` uzunluk sınırının altında kalıp zaten alınamıyor; yine de
 * listede dururlar ki kural uzunluk sınırına değil listeye dayansın.
 */
export const RESERVED_POST_SLUGS: ReadonlySet<string> = new Set([
  "yazi", "yazilar", "hakkinda", "iletisim", "magaza", "abone", "rss",
  "sitemap", "og", "api", "s",
]);

export type PostSlugError = "too_short" | "too_long" | "invalid_chars" | "reserved";

export type PostSlugResult =
  | { ok: true; slug: string }
  | { ok: false; error: PostSlugError };

/**
 * Girdiyi kanonik biçime indirger (R19): kırp + küçük harf + Türkçe noktasız
 * ı → i. `normalizeUsername` ile aynı desen — `toLowerCase` locale'siz çalışır,
 * `ı` kendi başına küçük olduğundan elle eşlenir; böylece `Ilk-Yazim` ve
 * `ılk-yazım` aynı kanonik adrese düşer.
 */
export function normalizePostSlug(input: string): string {
  return input.trim().toLowerCase().replaceAll("ı", "i");
}

// Username ile aynı biçim: [a-z0-9-] alfabesi, tire baş/son olamaz ve adres
// yalnız tireden oluşamaz — URL'de "-yazi" gibi biçimler karışıklık üretir.
const POST_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/** Normalize edip tüm kuralları uygular; geçerse kanonik slug'ı döner. */
export function validatePostSlug(input: string): PostSlugResult {
  const slug = normalizePostSlug(input);
  if (slug.length < POST_SLUG_MIN) return { ok: false, error: "too_short" };
  if (slug.length > POST_SLUG_MAX) return { ok: false, error: "too_long" };
  if (!POST_SLUG_PATTERN.test(slug)) return { ok: false, error: "invalid_chars" };
  if (RESERVED_POST_SLUGS.has(slug)) return { ok: false, error: "reserved" };
  return { ok: true, slug };
}
