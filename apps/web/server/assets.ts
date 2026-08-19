import { eq, sql } from "drizzle-orm";

import { asset, createDb } from "@caka/db";
import type { AssetUsage } from "@caka/shared";

/**
 * R16 kotası için kullanıcının mevcut asset sayısı ve toplam boyutu.
 *
 * Görsel ve belge AYNI havuzu paylaşır: `asset` tablosu yüklenen her dosyayı
 * tutuyor, kota da dosya türüne bakmadan sayıyor. İki ayrı kota, kullanıcıya
 * anlatması zor ve R16'da olmayan bir kural olurdu.
 */
export async function readAssetUsage(env: Env, userId: string): Promise<AssetUsage> {
  const rows = await createDb(env.DB)
    .select({
      count: sql<number>`count(*)`,
      bytes: sql<number>`coalesce(sum(${asset.size}), 0)`,
    })
    .from(asset)
    .where(eq(asset.userId, userId));
  const row = rows[0];
  return { count: Number(row?.count ?? 0), bytes: Number(row?.bytes ?? 0) };
}
