// R16 kullanıcı başına yükleme kotası. Sayaçlar `asset` tablosundan gelir,
// karar burada verilir (saf ve test edilebilir).

/** Bir kullanıcı en fazla bu kadar görsel tutabilir. */
export const ASSET_MAX_COUNT = 50;
/** Bir kullanıcının toplam görsel alanı. */
export const ASSET_MAX_TOTAL_BYTES = 100 * 1024 * 1024;

export interface AssetUsage {
  /** Kullanıcının mevcut asset satırı sayısı. */
  count: number;
  /** Mevcut satırların toplam boyutu (bayt). */
  bytes: number;
}

/**
 * Yeni bir yükleme kotaya sığıyor mu? Sığmıyorsa kullanıcıya gösterilecek
 * Türkçe mesaj, sığıyorsa null.
 */
export function assetQuotaError(usage: AssetUsage, incomingBytes: number): string | null {
  if (usage.count >= ASSET_MAX_COUNT) {
    return `En fazla ${ASSET_MAX_COUNT} görsel yükleyebilirsin. Yeni görsel için önce kullanmadığın görselleri kaldırman gerekiyor.`;
  }
  if (usage.bytes + incomingBytes > ASSET_MAX_TOTAL_BYTES) {
    const limitMb = Math.round(ASSET_MAX_TOTAL_BYTES / (1024 * 1024));
    return `Toplam görsel alanın ${limitMb} MB; bu görsel sığmıyor. Yeni görsel için önce kullanmadığın görselleri kaldırman gerekiyor.`;
  }
  return null;
}
