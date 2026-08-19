// R16 kullanıcı başına yükleme kotası. Sayaçlar `asset` tablosundan gelir,
// karar burada verilir (saf ve test edilebilir).
//
// Kota GÖRSELE ÖZEL DEĞİL: `asset` tablosu yüklenen her dosyayı (görsel ve
// belge) aynı havuzda sayar, kural da öyle.

/** Bir kullanıcı en fazla bu kadar dosya tutabilir. */
export const ASSET_MAX_COUNT = 50;
/** Bir kullanıcının toplam yükleme alanı. */
export const ASSET_MAX_TOTAL_BYTES = 100 * 1024 * 1024;

export interface AssetUsage {
  /** Kullanıcının mevcut asset satırı sayısı. */
  count: number;
  /** Mevcut satırların toplam boyutu (bayt). */
  bytes: number;
}

/**
 * Kota reddinin kimliği. Metin DEĞİL kimlik döndürülür (Değişmez #5): mesaj
 * kullanıcıya görünür ve beş dile çevrilir (`content/app`), bu katman ise saf
 * kural katmanıdır ve dil bilmez.
 */
export type AssetQuotaIssue = "count" | "bytes";

/** Yeni bir yükleme kotaya sığıyor mu? Sığmıyorsa reddin kimliği. */
export function assetQuotaIssue(
  usage: AssetUsage,
  incomingBytes: number,
): AssetQuotaIssue | null {
  if (usage.count >= ASSET_MAX_COUNT) return "count";
  if (usage.bytes + incomingBytes > ASSET_MAX_TOTAL_BYTES) return "bytes";
  return null;
}
