// Yazı (uzun metin) içeriğinin saf sınırları — tek kaynak (R7, R8, R22).
// Sınırlar taslakları da kapsar (R22): taslak da aynı tabloda yaşar, "sonra
// yayınlarım" diyerek sınırın dışına çıkılamaz. Düğüm (blok) doğrulaması
// U4'ün işi; burada yalnız boyut/sayı sabitleri ve gövde boyut denetimi var.

/**
 * Başlık üst sınırı (R8). 120 karakter: `<title>` ve OG başlığı için rahat
 * sığan, tek satır düşünceden uzun bir cümleye yetecek ölçü.
 */
export const POST_TITLE_MAX = 120;

/**
 * Gövdenin (JSON metin) üst sınırı: 50 KB (R7). Mevcut blok başına 8 KB
 * sınırından (layout.ts) AYRIDIR ve onu değiştirmez — bu sınır yazının
 * tamamını kapatır. 50 KB düz metinde ~25-40 sayfa demektir; D1 satırını ve
 * SSR render'ını makul tutar.
 */
export const POST_BODY_MAX_BYTES = 50 * 1024;

/**
 * Profil başına yazı üst sınırı (R8), taslaklar dahil (R22). Ürün blog
 * platformu değil link-in-bio; 20 yazı "birkaç uzun metin" ihtiyacını
 * fazlasıyla karşılar, listeleme arayüzünü de sayfalamasız tutar.
 */
export const MAX_POSTS_PER_PROFILE = 20;

/**
 * Yazı durumları. Yalnız iki durum var: taslak (yalnız sahibi görür) ve
 * yayında. "Arşiv" gibi ara durumlar bilinçli yok — yayından kaldırma
 * taslağa döndürmektir.
 */
export const POST_STATUSES = ["draft", "published"] as const;

export type PostStatus = (typeof POST_STATUSES)[number];

/**
 * Gövde boyutu BAYT üstünden ölçülür, karakter değil: sınır depolama/aktarım
 * sınırıdır ve Türkçe metin UTF-8'de karakter başına 1-2 bayt tutar —
 * `string.length` ile ölçmek çok baytlı metinde sınırı sessizce aşardı.
 */
export function postBodyByteLength(body: string): number {
  return new TextEncoder().encode(body).length;
}

/** Serileştirilmiş gövde 50 KB sınırının içinde mi (R7)? */
export function isPostBodyWithinLimit(body: string): boolean {
  return postBodyByteLength(body) <= POST_BODY_MAX_BYTES;
}
