/**
 * Adres (username) kuralları — tek kaynak (KTD9, R2).
 * Kurallar hem istemcide (canlı kontrol) hem sunucuda (claim) uygulanır;
 * asıl benzersizlik garantisi DB unique kısıtındadır.
 */

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;

/**
 * Rezerve adresler: tüm uygulama route'ları + altyapı + kötüye kullanım.
 * Yeni bir top-level route eklerken buraya da eklenmelidir.
 */
export const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  // uygulama route'ları
  "onboarding",
  "login",
  "logout",
  "edit",
  "settings",
  "api",
  "i",
  "og",
  "basla",
  "tamamla",
  "hazir",
  // altyapı / genel
  "assets",
  "static",
  "cdn",
  "www",
  "app",
  "mail",
  "email",
  "dev",
  "test",
  "status",
  "docs",
  "blog",
  "help",
  "destek",
  "support",
  "about",
  "hakkinda",
  "terms",
  "privacy",
  "gizlilik",
  "kosullar",
  "dashboard",
  "panel",
  // marka / kötüye kullanım
  "caka",
  "admin",
  "administrator",
  "root",
  "moderator",
  "mod",
  "official",
  "resmi",
]);

export type UsernameError = "too_short" | "too_long" | "invalid_chars" | "reserved";

export type UsernameResult =
  | { ok: true; username: string }
  | { ok: false; error: UsernameError };

/** Girdiyi adrese normalize eder: kırp + küçük harf (TR locale tuzağına düşmeden). */
export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase().replaceAll("ı", "i");
}

const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/** Normalize edip tüm kuralları uygular; geçerse kanonik adresi döner. */
export function validateUsername(input: string): UsernameResult {
  const username = normalizeUsername(input);
  if (username.length < USERNAME_MIN) return { ok: false, error: "too_short" };
  if (username.length > USERNAME_MAX) return { ok: false, error: "too_long" };
  if (!USERNAME_PATTERN.test(username)) return { ok: false, error: "invalid_chars" };
  if (RESERVED_USERNAMES.has(username)) return { ok: false, error: "reserved" };
  return { ok: true, username };
}

export const USERNAME_ERROR_MESSAGES: Record<UsernameError, string> = {
  too_short: `En az ${USERNAME_MIN} karakter olmalı`,
  too_long: `En fazla ${USERNAME_MAX} karakter olabilir`,
  invalid_chars: "Yalnızca küçük harf, rakam ve tire; başta/sonda tire olamaz",
  reserved: "Bu adres kullanılamaz",
};
