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
  LOCATION_ZOOM_STEPS,
  classifyYouTubeUrl,
  faviconImageKey,
  mapFrameImageKey,
  youtubeThumbnailUrl,
  type ProfileLayout,
} from "@caka/shared";

import { signImageProxyPath } from "./image-proxy";
import { mapFrameUrls } from "./map-frame";

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

/**
 * Kayıtlı `favicon` yoksa adresin kökünden türet: `https://host/favicon.ico`.
 * Doğrulanmaz — favicon `<img>`'i baş harf çipinin ÜSTÜNDE durur, adres
 * boşsa altındaki harf görünür. Bu, mevcut bloklar için geriye dönük veri
 * yazmayı da gereksiz kılıyor (aynı gerekçe: `derivedPreview`).
 */
function derivedFavicon(url: string): string {
  if (!url) return "";
  try {
    return new URL("/favicon.ico", url).toString();
  } catch {
    return "";
  }
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

/** Bloğun favicon kaynağı; yalnız bağlantı taşıyan bloklarda var. */
function remoteFaviconOf(block: ProfileLayout["blocks"][number]): string {
  switch (block.type) {
    case "social":
    case "link":
      return block.data.favicon || derivedFavicon(block.data.url);
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
    .flatMap((block) => [
      { id: block.id, url: remoteImageOf(block) },
      { id: faviconImageKey(block.id), url: remoteFaviconOf(block) },
    ])
    .filter((entry) => entry.url !== "");

  const signed = await Promise.all(
    targets.map(async (entry) => [entry.id, await signImageProxyPath(env, entry.url)] as const),
  );

  const map: SignedImageMap = {};
  for (const [id, path] of signed) {
    if (path) map[id] = path;
  }
  addMapFrames(env, layout, map);
  return map;
}

/**
 * Konum kartlarının iki harita karesi. AYRI bir yol, çünkü hedef bir uzak
 * görsel adresi değil ve imzalanmaz: adresi ziyaretçinin tarayıcısı doğrudan
 * sağlayıcıdan çeker (proxy'lemek sağlayıcının şartlarınca yasak — bkz.
 * `server/map-frame.ts`). Eşlemeye girmesinin tek nedeni jetonun yalnız
 * sunucu ortamında bulunması.
 *
 * Jeton tanımsızsa `mapFrameUrls` null döner ve blok eşlemeye hiç girmez —
 * kart haritasız tasarımına düşer.
 */
function addMapFrames(env: Env, layout: ProfileLayout, map: SignedImageMap): void {
  for (const block of layout.blocks) {
    if (block.type !== "location" || block.data.lat === null || block.data.lon === null) continue;
    const frames = mapFrameUrls(env, block.data.lat, block.data.lon);
    if (!frames) continue;
    for (const step of LOCATION_ZOOM_STEPS) {
      map[mapFrameImageKey(step, block.data.lat, block.data.lon)] = frames[step];
    }
  }
}
