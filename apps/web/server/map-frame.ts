// Statik harita karesi: `GET /api/harita?lat=…&lon=…&z=far|near&s=<imza>`.
//
// R58 — ZİYARETÇİ HARİTA SUNUCUSUNA BAĞLANMAZ. Kareyi Worker çeker, Cache
// API'de tutar ve kendi alan adından servis eder. Ziyaretçinin IP'si ve
// User-Agent'ı sağlayıcıya ulaşmaz; sağlayıcının hiçbir başlığı (Set-Cookie
// dâhil) ziyaretçiye geçmez — yanıt sıfırdan kurulur. Desen `/api/gorsel`
// (`server/image-proxy.ts`) ile birebir aynı.
//
// NEDEN AYRI BİR UÇ, NEDEN `/api/gorsel` DEĞİL: sağlayıcı adresi API
// ANAHTARI taşıyor. `/api/gorsel` hedef adresi sorgu dizesinde ziyaretçiye
// gösterir; harita adresi oradan geçseydi anahtar her profil sayfasının
// HTML'ine basılmış olurdu (Değişmez #6). Bu uçta ziyaretçi yalnız koordinatı
// ve kademeyi görür, adresi Worker kurar.
//
// UÇ İMZALIDIR: imzasız olsaydı herkes bizim kotamızdan bedava harita
// çekerdi. İmza koordinat + kademeyi kapsar (`mapFrameSignaturePayload`).
// Sır ya da anahtar tanımsızsa uç TAMAMEN kapalıdır (fail-closed) ve kart
// haritasız hâline düşer — sessizce yanlış bir görsel göstermez.
import { Hono } from "hono";

import {
  LOCATION_FRAME,
  LOCATION_ZOOM,
  LOCATION_ZOOM_STEPS,
  MAP_SIGNATURE_PARAM,
  type LocationZoomStep,
  stadiaStaticMapUrl,
  hmacHex,
  isValidLatitude,
  isValidLongitude,
  mapFramePath,
  mapFrameSignaturePayload,
  normalizeImageContentType,
  roundCoordinate,
  timingSafeEqual,
} from "@caka/shared";

/** Kareler değişmez (koordinat + kademe sabit): uzun önbellek güvenli. */
const CACHE_SECONDS = 30 * 24 * 60 * 60;
/** Başarısızlık kısa süre önbelleklenir; her ziyaret yeni dış istek doğurmasın. */
const FAILURE_CACHE_SECONDS = 5 * 60;
const FETCH_TIMEOUT_MS = 6000;
/** Ölçüm: 512×384@2x jpeg kareler 90–180 KB. Tavan bolca üstünde. */
const MAX_FRAME_BYTES = 1024 * 1024;

function failure(): Response {
  return new Response(null, {
    status: 404,
    headers: { "Cache-Control": `public, max-age=${FAILURE_CACHE_SECONDS}` },
  });
}

let configWarned = false;

/** Anahtar ve imza sırrı; ikisinden biri yoksa özellik kapalıdır. */
function mapConfig(env: Env): { apiKey: string; secret: string } | null {
  const apiKey = env.STADIA_API_KEY ?? "";
  const secret = env.IMAGE_PROXY_SECRET ?? "";
  if (apiKey && secret) return { apiKey, secret };
  if (!configWarned) {
    configWarned = true;
    console.warn(
      "map-frame: STADIA_API_KEY veya IMAGE_PROXY_SECRET tanımsız — harita kareleri kapalı",
    );
  }
  return null;
}

function isZoomStep(value: string): value is LocationZoomStep {
  return (LOCATION_ZOOM_STEPS as readonly string[]).includes(value);
}

/**
 * Kartın iki karesinin imzalı birinci taraf yolları. Loader bunu bir kez
 * hesaplar ve blok kimliğine anahtarlanmış eşlemeyle bileşene taşır
 * (`server/layout-images.ts` ile aynı gerekçe: HMAC asenkron, render saf).
 */
export async function signMapFramePaths(
  env: Env,
  lat: number,
  lon: number,
): Promise<Record<LocationZoomStep, string> | null> {
  const config = mapConfig(env);
  if (!config) return null;
  const entries = await Promise.all(
    LOCATION_ZOOM_STEPS.map(async (step) => {
      const signature = await hmacHex(
        mapFrameSignaturePayload(lat, lon, step),
        config.secret,
      );
      return [step, mapFramePath(lat, lon, step, signature)] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<LocationZoomStep, string>;
}

/** Gövdeyi tavana kadar okur; tavan aşılırsa null (akış iptal edilir). */
async function readCapped(response: Response, limit: number): Promise<Uint8Array | null> {
  const declared = Number(response.headers.get("Content-Length") ?? 0);
  if (declared > limit) return null;
  const reader = response.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) {
        await reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
  } catch {
    await reader.cancel().catch(() => {});
    return null;
  }
  const merged = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

export const mapFrameApi = new Hono<{ Bindings: Env }>();

mapFrameApi.get("/", async (c) => {
  const config = mapConfig(c.env);
  if (!config) return failure();

  // Koordinat SAKLANDIĞI ÇÖZÜNÜRLÜĞE yeniden yuvarlanır: hem imza gövdesi
  // kanonikleşir (aynı yer için tek önbellek girdisi) hem de uç, elle
  // yazılmış tam çözünürlüklü bir koordinatla ev adresi haritası çekmenin
  // yolu olmaz.
  const lat = roundCoordinate(Number(c.req.query("lat")));
  const lon = roundCoordinate(Number(c.req.query("lon")));
  const step = c.req.query("z") ?? "";
  if (!isValidLatitude(lat) || !isValidLongitude(lon) || !isZoomStep(step)) return failure();

  const expected = await hmacHex(mapFrameSignaturePayload(lat, lon, step), config.secret);
  if (!timingSafeEqual(c.req.query(MAP_SIGNATURE_PARAM) ?? "", expected)) return failure();

  // Kanonik önbellek anahtarı: imza dışarıda bırakılır (sır döndüğünde
  // önbellek geçersizleşmesin) ve parametre sırası sabitlenir.
  const origin = new URL(c.req.url).origin;
  const cacheKey = new Request(`${origin}/api/harita?lat=${lat}&lon=${lon}&z=${step}`);
  const cache = (caches as unknown as { default: Cache }).default;
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  // Başarısızlıklar da önbelleklenir (`failure()` kısa `max-age` taşır):
  // kalıcı olarak çekilemeyen bir koordinat, aksi hâlde HER önbelleksiz
  // ziyarette sağlayıcıya yeni bir istek doğurup kotayı yerdi.
  const fail = () => {
    const response = failure();
    c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  };

  const target = stadiaStaticMapUrl({
    lat,
    lon,
    zoom: LOCATION_ZOOM[step],
    width: LOCATION_FRAME.width,
    height: LOCATION_FRAME.height,
    apiKey: config.apiKey,
  });

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      // Yönlendirme beklenmiyor; izlenirse anahtar yabancı bir host'a
      // taşınabilirdi. "manual" ile 3xx doğrudan başarısızlıktır.
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "image/jpeg,image/png", "User-Agent": "CakaMap/1.0 (+https://caka.app)" },
    });
  } catch {
    return fail();
  }
  if (!upstream.ok) {
    await upstream.body?.cancel().catch(() => {});
    return fail();
  }
  const contentType = normalizeImageContentType(upstream.headers.get("Content-Type"));
  if (!contentType) {
    await upstream.body?.cancel().catch(() => {});
    return fail();
  }
  const bytes = await readCapped(upstream, MAX_FRAME_BYTES);
  if (!bytes || bytes.byteLength === 0) return fail();

  // Yanıt sıfırdan kurulur: sağlayıcının hiçbir başlığı ziyaretçiye geçmez.
  const response = new Response(bytes.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": `public, max-age=${CACHE_SECONDS}, immutable`,
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cross-Origin-Resource-Policy": "same-origin",
      "Referrer-Policy": "no-referrer",
    },
  });
  c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
});
