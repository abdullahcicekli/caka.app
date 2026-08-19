// İmzalı birinci taraf uçların ortak HMAC ilkelleri.
//
// NEDEN AYRI DOSYA: desen uzak görsel proxy'sinde (`/api/gorsel`) yaşıyor ve
// bir zamanlar statik harita karesinde de vardı — harita ucu, sağlayıcının
// proxy'lemeyi yasaklaması üzerine kaldırıldı (`server/map-frame.ts`).
// Dosya yine ayrı duruyor: uç dışarıya açık ve "yalnız Caka'nın ürettiği
// adresler geçer" kuralına dayanıyor; ilkelin kendi yerinde olması, imza
// mantığının route dosyasına sızmasını engelliyor.

// Anahtar her imzada yeniden import edilir: WebCrypto'da bu mikrosaniyelik
// bir iş ve modül düzeyinde sır tutan bir önbellekten daha temiz.
function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

/** İmzanın hex uzunluğu — 32 hex = 128 bit; kaba kuvvete fazlasıyla yeter. */
export const SIGNATURE_HEX_LENGTH = 32;

/** Kanonik yükün HMAC-SHA256 imzası (hex, 128 bite kısaltılmış). */
export async function hmacHex(payload: string, secret: string): Promise<string> {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret),
    new TextEncoder().encode(payload),
  );
  let hex = "";
  for (const byte of new Uint8Array(signature)) hex += byte.toString(16).padStart(2, "0");
  return hex.slice(0, SIGNATURE_HEX_LENGTH);
}

/**
 * Sabit zamanlı hex karşılaştırma. Uzunluk farkı erken dönüşle sızar; bu
 * kasıtlı, çünkü imza uzunluğu zaten sabit ve herkesçe bilinen bir sayı.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}
