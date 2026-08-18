// Uzak önizleme görsellerinin imzalı proxy adresleri (U31).
//
// Proxy imzalı olduğu için adres artık saf bir fonksiyonla render sırasında
// türetilemez: imza sırra ihtiyaç duyar ve HMAC asenkrondur. Bu yüzden
// adresler loader'da bir kez hesaplanır ve bloğa değil, blok kimliğine
// anahtarlanmış AYRI bir eşlemeyle bileşene taşınır.
//
// Neden bloğun kendi `ogImage` alanını imzalı adresle değiştirmiyoruz:
// editör aynı düzen nesnesini kaydetmek için de kullanıyor. Alanı yerinde
// değiştirmek, kullanıcının bir sonraki kaydında `/api/gorsel?...` yolunu
// kalıcı olarak `ogImage`'a yazardı — kaynak adres geri döndürülemez biçimde
// kaybolurdu. `githubCalendars` zaten aynı deseni kullanıyor (bkz.
// `server/github.ts`); bu ona kardeş.
import type { ProfileLayout } from "@caka/shared";

import { signImageProxyPath } from "./image-proxy";

/** Blok kimliği → imzalı birinci taraf görsel yolu. */
export type SignedImageMap = Record<string, string>;

/** Bloğun render'da göstereceği uzak görselin kaynak adresi; yoksa boş. */
function remoteImageOf(block: ProfileLayout["blocks"][number]): string {
  switch (block.type) {
    case "social":
    case "link":
      return block.data.ogImage;
    case "youtube":
      return block.data.thumbnail;
    default:
      return "";
  }
}

/**
 * Düzendeki her uzak görsel için imzalı proxy yolunu üretir.
 *
 * Sır tanımsızsa `signImageProxyPath` null döner ve o blok eşlemeye hiç
 * girmez — kart, görselsiz tasarlanmış hâline düşer. Sessiz kırık görsel
 * yerine bilinçli fallback.
 */
export async function signLayoutImages(
  env: Env,
  layout: ProfileLayout,
): Promise<SignedImageMap> {
  const targets = layout.blocks
    .map((block) => ({ id: block.id, url: remoteImageOf(block) }))
    .filter((entry) => entry.url !== "");
  if (targets.length === 0) return {};

  const signed = await Promise.all(
    targets.map(async (entry) => [entry.id, await signImageProxyPath(env, entry.url)] as const),
  );

  const map: SignedImageMap = {};
  for (const [id, path] of signed) {
    if (path) map[id] = path;
  }
  return map;
}
