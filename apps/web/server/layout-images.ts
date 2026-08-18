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
import {
  classifyYouTubeUrl,
  youtubeThumbnailUrl,
  type ProfileLayout,
} from "@caka/shared";

import { signImageProxyPath } from "./image-proxy";

/**
 * Kayıtlı `ogImage` yoksa adresten TÜRETİLEBİLİR bir önizleme var mı?
 *
 * Bugün yalnız YouTube: küçük görselin adresi video kimliğinden kurulabiliyor,
 * yani hiç ağa çıkmadan. Bu, geriye dönük bir veri doldurmayı gereksiz
 * kılıyor — `link` bloğu `ogImage` alanını ancak bu sürümle kazandı, dolayısıyla
 * MEVCUT bütün YouTube bağlantılarının alanı boş ve sahibi editörü açmadan
 * dolmayacaktı. Ayrıca YouTube'un `og:image` etiketi ~694 KB'ta duruyor;
 * kazımak pahalı, türetmek bedava.
 *
 * `mqdefault` seçildi çünkü HER videoda var. `maxresdefault` daha keskin ama
 * eski videolarda ve Shorts'ta 404 yerine 1097 baytlık gri bir vekil dönüyor,
 * yani doğrulamadan kullanmak kırık kart üretirdi (KTD35).
 */
function derivedPreview(url: string): string {
  if (!url) return "";
  const ref = classifyYouTubeUrl(url);
  return ref.kind === "video" ? youtubeThumbnailUrl(ref.videoId, "mq") : "";
}

/** Blok kimliği → imzalı birinci taraf görsel yolu. */
export type SignedImageMap = Record<string, string>;

/** Bloğun render'da göstereceği uzak görselin kaynak adresi; yoksa boş. */
function remoteImageOf(block: ProfileLayout["blocks"][number]): string {
  switch (block.type) {
    case "social":
    case "link":
      return block.data.ogImage || derivedPreview(block.data.url);
    case "youtube":
    case "spotify":
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
