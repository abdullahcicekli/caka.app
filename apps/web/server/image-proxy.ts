// Uzak görsel proxy'si (backlog #6). Profil sayfasındaki önizleme görselleri
// ziyaretçinin tarayıcısından değil, buradan servis edilir:
//
// - ziyaretçinin IP'si ve User-Agent'ı uzak host'a hiç ulaşmaz,
// - uzak host'un `Set-Cookie` başlığı ziyaretçiye geçmez (yanıt sıfırdan
//   kurulur, upstream başlıkları kopyalanmaz),
// - `Referer` gönderilmez,
// - yalnız `image/*` allowlist'i, boyut ve süre tavanlı,
// - Cloudflare Cache API ile önbelleklenir.
//
// Hedef adres kullanıcı girdisinden geldiği ve uç herkese açık olduğu için
// asıl risk SSRF'tir; adres kuralları `@caka/shared`'daki
// `checkProxyImageUrl` içinde yaşar ve testlidir. Her yönlendirme hop'u
// yeniden doğrulanır.
//
// UÇ İMZALIDIR: yalnız Caka'nın ürettiği adresler proxy'lenir
// (`IMAGE_PROXY_SECRET` ile HMAC-SHA256). Ziyaretçi oturum açmadığı için
// kimlik doğrulaması yapılamaz; imza olmadan uç herkesin kullanabileceği
// bedava bir görsel CDN'i olurdu.
import { Hono } from "hono";

import {
  PROXY_FETCH_TIMEOUT_MS,
  PROXY_MAX_IMAGE_BYTES,
  PROXY_MAX_REDIRECTS,
  PROXY_SIGNATURE_PARAM,
  checkProxyImageUrl,
  normalizeImageContentType,
  signedRemoteImageProxyPath,
  verifyRemoteImageSignature,
} from "@caka/shared";

/** Başarılı görselin önbellek ömrü. */
const CACHE_SECONDS = 24 * 60 * 60;
/** Başarısızlıklar da kısa süre önbelleklenir: kırık bir adres her ziyarette
 * yeni bir dış istek doğurmasın. */
const FAILURE_CACHE_SECONDS = 5 * 60;

function failure(): Response {
  return new Response(null, {
    status: 404,
    headers: { "Cache-Control": `public, max-age=${FAILURE_CACHE_SECONDS}` },
  });
}

/** Gövdeyi tavana kadar okur; tavan aşılırsa null (akış iptal edilir). */
async function readCapped(response: Response, limit: number): Promise<Uint8Array | null> {
  const declared = Number(response.headers.get("Content-Length") ?? 0);
  if (declared > limit) return null;
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array();
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
    // Gövde ortasında zaman aşımı/bağlantı kopması: 500 değil, normal
    // başarısızlık yolu (önbelleklenebilir 404).
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

/**
 * Yönlendirmeleri elle izler ve HER hop'u yeniden doğrular. `redirect:
 * "follow"` kullanılamaz: temiz görünen bir adres 302 ile 169.254.169.254'e
 * sapabilir ve platform bunu bizim adımıza denetlemez.
 */
export async function fetchFollowingCheckedRedirects(
  startUrl: string,
  init: { accept: string; userAgent: string },
): Promise<Response | null> {
  let target = startUrl;
  for (let hop = 0; hop <= PROXY_MAX_REDIRECTS; hop += 1) {
    const checked = checkProxyImageUrl(target);
    if (!checked.ok) return null;
    let response: Response;
    try {
      response = await fetch(checked.url, {
        redirect: "manual",
        signal: AbortSignal.timeout(PROXY_FETCH_TIMEOUT_MS),
        headers: {
          // Ziyaretçinin başlıkları iletilmez; sabit, kimliksiz bir istek.
          // `Referer` hiç gönderilmez (Worker subrequest'i kendiliğinden
          // eklemez) — hedef site profil sahibinin sayfasını göremez.
          "User-Agent": init.userAgent,
          Accept: init.accept,
        },
      });
    } catch {
      return null;
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("Location");
      await response.body?.cancel().catch(() => {});
      if (!location) return null;
      try {
        target = new URL(location, checked.url).toString();
      } catch {
        return null;
      }
      continue;
    }
    return response;
  }
  return null;
}

let secretWarned = false;

/**
 * İmzalı proxy adresi üretir — uzak bir görseli sayfaya koyan HER yol bunu
 * çağırır (SSR loader'ı, editör API'si, og zenginleştirme).
 *
 * Sır tanımsızsa null döner (fail-closed): imzasız adres zaten proxy'den
 * geçmeyeceği için `<img>`'e yazmak kırık görsel demek olurdu; çağıran taraf
 * null görünce önizlemesiz kartı gösterir.
 */
export async function signImageProxyPath(env: Env, url: string): Promise<string | null> {
  const secret = env.IMAGE_PROXY_SECRET ?? "";
  if (!secret) {
    // Yapılandırma hatası bir kez loglanır; her görselde tekrarlamaz.
    if (!secretWarned) {
      secretWarned = true;
      console.warn("image-proxy: IMAGE_PROXY_SECRET tanımsız — uzak görseller kapalı");
    }
    return null;
  }
  return signedRemoteImageProxyPath(url, secret);
}

export const imageProxyApi = new Hono<{ Bindings: Env }>();

imageProxyApi.get("/", async (c) => {
  const raw = c.req.query("u") ?? "";
  const checked = checkProxyImageUrl(raw);
  if (!checked.ok) return failure();
  // Kendi kendini proxy'lemeyi reddet: `u=https://caka.app/api/gorsel?u=…`
  // iç içe geçmiş Worker çağrıları doğurur (her katman ayrı bir alt istek).
  const selfHost = new URL(c.req.url).host;
  if (new URL(checked.url).host === selfHost) return failure();

  // İMZA KAPISI — dış isteğe çıkmadan önce. Sır tanımsızsa uç tamamen
  // kapalıdır: "sır yoksa imzasız çalış" demek, sırrı unutulmuş bir deploy'da
  // açık proxy'yi sessizce geri getirmek olurdu.
  const secret = c.env.IMAGE_PROXY_SECRET ?? "";
  if (!secret) {
    if (!secretWarned) {
      secretWarned = true;
      console.warn("image-proxy: IMAGE_PROXY_SECRET tanımsız — uç kapalı");
    }
    return failure();
  }
  const signature = c.req.query(PROXY_SIGNATURE_PARAM) ?? "";
  if (!(await verifyRemoteImageSignature(checked.url, signature, secret))) return failure();

  // Kanonik önbellek anahtarı: aynı görsel farklı sorgu sıralamalarıyla
  // ayrı girdi açmasın.
  const origin = new URL(c.req.url).origin;
  const cacheKey = new Request(`${origin}/api/gorsel?u=${encodeURIComponent(checked.url)}`, {
    method: "GET",
  });
  // Workers Cache API: tip tanımında `default` yok (og-image.ts ile aynı kalıp).
  const cache = (caches as unknown as { default: Cache }).default;
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const upstream = await fetchFollowingCheckedRedirects(checked.url, {
    accept: "image/*",
    userAgent: "CakaImageProxy/1.0 (+https://caka.app)",
  });
  if (!upstream || !upstream.ok) {
    await upstream?.body?.cancel().catch(() => {});
    return failure();
  }
  const contentType = normalizeImageContentType(upstream.headers.get("Content-Type"));
  if (!contentType) {
    await upstream.body?.cancel().catch(() => {});
    return failure();
  }
  const bytes = await readCapped(upstream, PROXY_MAX_IMAGE_BYTES);
  if (!bytes || bytes.byteLength === 0) return failure();

  // Yanıt sıfırdan kurulur: upstream'in Set-Cookie/ETag/CORS başlıkları
  // ziyaretçiye geçmez.
  const response = new Response(bytes.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": `public, max-age=${CACHE_SECONDS}, stale-while-revalidate=604800`,
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
