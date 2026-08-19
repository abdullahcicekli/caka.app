// Konum kartının iki statik harita karesinin adresi.
//
// ZİYARETÇİ HARİTA SUNUCUSUNA DOĞRUDAN BAĞLANIR — ve bu bilinçli değil,
// ZORUNLU. Mapbox Product Terms (21 Temmuz 2026) §2.8.1 kareyi sunucuda
// önbelleğe alıp kendi alan adımızdan servis etmeyi açıkça yasaklıyor:
// "Customer shall not distribute Licensed Map Content, including from a
// cache, by proxying, or by using a screenshot or other static image instead
// of accessing Licensed Map Content directly from the Mapping APIs."
// §1.9(iv)-(v) içeriğin "directly from Mapbox APIs" alınmasını şart koşar ve
// "export, download, cache or store" etmeyi yasaklar. İzin verilen tek
// önbellek son kullanıcının cihazındadır (30 gün) ve "directly from the
// Mapping APIs" doldurulmalıdır — yani tarayıcının kendi HTTP önbelleği.
//
// Bu yüzden eski `/api/harita` proxy ucu (Worker çeker → Cache API → birinci
// taraftan servis) KALDIRILDI. O mimari ancak sözleşmeyle izin veren bir
// sağlayıcıyla mümkündü ve o izin ücretli aboneliğe bağlıydı.
//
// SONUÇ, hukuki metinlerde ifşa edilir: konum kartı taşıyan bir profil
// açıldığında ziyaretçinin IP'si ve User Agent'ı Mapbox'a ulaşır
// (`docs/legal/vendor-register.md` A bölümü, `/gizlilik` §6).
//
// JETON: `MAPBOX_PUBLIC_TOKEN` herkese açık bir `pk.*` jetonudur ve HTML'e
// basılır; Değişmez #6 anlamında sır değildir. Korumasını Mapbox panelindeki
// URL kısıtlaması sağlar (bkz. `.dev.vars.example`). Jeton tanımsızsa bu
// yardımcı `null` döner, blok eşlemeye hiç girmez ve kart haritasız
// tasarımına düşer (fail-closed) — kırık görsel çıkmaz.
import {
  LOCATION_FRAME,
  LOCATION_ZOOM,
  LOCATION_ZOOM_STEPS,
  type LocationZoomStep,
  mapboxStaticMapUrl,
} from "@caka/shared";

let configWarned = false;

/** Herkese açık harita jetonu; yoksa özellik kapalıdır. */
function mapToken(env: Env): string | null {
  const token = env.MAPBOX_PUBLIC_TOKEN ?? "";
  if (token) return token;
  if (!configWarned) {
    configWarned = true;
    console.warn("map-frame: MAPBOX_PUBLIC_TOKEN tanımsız — harita kareleri kapalı");
  }
  return null;
}

/**
 * Kartın iki karesinin adresi. Loader bunu bir kez kurar ve koordinata
 * anahtarlanmış eşlemeyle bileşene taşır (`server/layout-images.ts`): adres
 * jeton taşıdığı için render sırasında saf bir fonksiyonla türetilemez —
 * jeton yalnız sunucu ortamında var.
 */
export function mapFrameUrls(
  env: Env,
  lat: number,
  lon: number,
): Record<LocationZoomStep, string> | null {
  const token = mapToken(env);
  if (!token) return null;
  const entries = LOCATION_ZOOM_STEPS.map((step) => [
    step,
    mapboxStaticMapUrl({
      lat,
      lon,
      zoom: LOCATION_ZOOM[step],
      width: LOCATION_FRAME.width,
      height: LOCATION_FRAME.height,
      token,
    }),
  ]);
  return Object.fromEntries(entries) as Record<LocationZoomStep, string>;
}
