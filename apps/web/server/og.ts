// og:image çekimi: sosyal blok bağlantısının önizleme görseli.
// Görsel URL'si layout'ta saklanır; ziyaretçiye ise doğrudan değil,
// `/api/gorsel` proxy'si üzerinden servis edilir (server/image-proxy.ts).
//
// BAŞARISIZLIK NORMAL YOLDUR: ölçüldü, tipik 16 link hedefinin yalnız 7'si
// og:image veriyor (Instagram, TikTok, Spotify, Trendyol vermiyor). Bu yüzden
// burada log yok — sessizce null döner ve kart tasarlanmış fallback'ini gösterir.
import { Hono } from "hono";

import { checkProxyImageUrl, pickFaviconHref, type ProfileLayout } from "@caka/shared";
import { getSession } from "./auth";
import { isCrossOriginRequest } from "./request";
import { fetchFollowingCheckedRedirects, signImageProxyPath } from "./image-proxy";
import { appCatalog } from "../app/content/app";
import { localeFromRequest } from "./locale";

// Zaman aşımı ve yönlendirme sınırı ortak fetch yardımcısından gelir
// (server/image-proxy.ts).
//
// NEDEN 1 MB VE NEDEN AKIŞ: eski 128 KB tavanı YouTube'un og:image'ını
// kaçırıyordu — ölçüldü, etiket 744.917. baytta ve `</head>`'den SONRA
// geliyor (YouTube meta'ları gövdeye basıyor), yani "head'e kadar oku"
// kestirmesi de işe yaramaz. Tavanı kaldırmak yerine gövde AKIŞ hâlinde
// okunur ve aranan meta bulunur bulunmaz bağlantı kesilir: sıradan bir site
// birkaç KB'ta biter, yalnız YouTube gibi devler tavana yaklaşır. 1 MB
// kaynak tüketimine karşı mutlak sınırdır (SSRF hedefi sonsuz gövde döndürebilir).
const MAX_HTML_BYTES = 1024 * 1024;
// Chunk sınırında ikiye bölünen bir `<meta …>` etiketini kaçırmamak için
// önceki pencerenin kuyruğu bir sonrakine taşınır. YouTube'un tek satırlık
// dev meta blokları bile bu payın altında.
const TAG_CARRY_CHARS = 4096;

const PRIORITIES = ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src"];

/** Metin penceresindeki meta etiketlerini toplar; ilk görülen değer kazanır. */
function collectMetaImages(window: string, found: Map<string, string>): void {
  for (const tag of window.match(/<meta\s[^>]*>/gi) ?? []) {
    const key = /(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase();
    const content = /content\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (key && content && PRIORITIES.includes(key) && !found.has(key)) found.set(key, content);
  }
}

/**
 * Favicon olabilecek `<link>` etiketlerini ham hâliyle biriktirir. og
 * meta'sıyla AYNI akışta okunur: favicon için ikinci bir istek atmak, zaten
 * indirdiğimiz HTML'i ikinci kez indirmek olurdu.
 *
 * Hangisinin seçileceği (SVG elemesi, boyut, tür sırası) saf ve testli bir
 * kural — `pickFaviconHref`, @caka/shared.
 */
function collectIconLinks(window: string, tags: string[]): void {
  for (const tag of window.match(/<link\s[^>]*>/gi) ?? []) {
    if (/rel\s*=\s*["'][^"']*icon/i.test(tag)) tags.push(tag);
  }
}

/**
 * Gövdeyi tavana kadar akıtarak okur ve `stop` ilk kez true dönünce bağlantıyı
 * keser. Pencere = önceki okumanın kuyruğu + yeni parça; `stop` yalnız yeni
 * pencereyi görür, bu yüzden birikmiş metin üzerinde tekrar tekrar regex
 * çalıştırılmaz (O(n) kalır).
 */
export async function readTextStreaming(
  response: Response,
  maxBytes: number,
  stop: (window: string) => boolean,
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder("utf-8", { fatal: false });
  let carry = "";
  let total = 0;
  try {
    while (total < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      const window = carry + decoder.decode(value, { stream: true });
      if (stop(window)) break;
      carry = window.slice(-TAG_CARRY_CHARS);
    }
  } catch {
    // Gövde ortasında kopma: o ana kadar toplanan neyse onunla devam edilir.
  }
  await reader.cancel().catch(() => {});
}

/** Öncelik sırasına göre ilk geçerli mutlak adresi döner. */
function resolveFirst(
  found: Map<string, string>,
  order: readonly string[],
  baseUrl: string,
): string | null {
  for (const key of order) {
    const raw = found.get(key);
    if (!raw) continue;
    try {
      const resolved = new URL(raw.trim(), baseUrl);
      if (resolved.protocol === "http:" || resolved.protocol === "https:") {
        return resolved.toString();
      }
    } catch {
      // Geçersiz aday — sıradakine bak.
    }
  }
  return null;
}

/**
 * Sayfa favicon'unu ilan etmediyse kök `/favicon.ico`. Doğrulanmaz: bir
 * istek daha atmak yerine kart GRACEFUL düşer — favicon `<img>`'i baş harf
 * çipinin ÜSTÜNDE durur, yüklenemezse altındaki harf görünür
 * (bkz. `.link-mark img` / app.css).
 */
function defaultFaviconUrl(baseUrl: string): string | null {
  try {
    return new URL("/favicon.ico", baseUrl).toString();
  } catch {
    return null;
  }
}

export interface LinkPreview {
  /** og:image adresi; yoksa null. */
  image: string | null;
  /** Sitenin favicon adresi; yoksa null. */
  favicon: string | null;
}

/**
 * Hedef sayfanın önizleme görselini VE favicon'unu döner; ikisi de
 * best-effort (bulunamazsa null). Tek istek, tek akış.
 */
export async function fetchLinkPreview(
  target: string,
  selfHost?: string,
): Promise<LinkPreview> {
  const empty: LinkPreview = { image: null, favicon: null };
  // Oturum gerektirse de bu, kullanıcı girdisiyle tetiklenen bir dış istek:
  // proxy ile aynı SSRF kurallarından geçer (özel/loopback/metadata kapalı).
  const checked = checkProxyImageUrl(target);
  if (!checked.ok) return empty;
  const url = new URL(checked.url);
  try {
    // Yönlendirmeler elle izlenir ve her hop yeniden doğrulanır: aksi hâlde
    // temiz görünen bir adres 302 ile 169.254.169.254'e sapabilirdi
    // (`redirect: "follow"` bunu bizim adımıza denetlemez).
    const response = await fetchFollowingCheckedRedirects(url.toString(), {
      accept: "text/html,application/xhtml+xml",
      // Bazı platformlar bot UA'larına og meta'sız sayfa döner.
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      // Kendi sitemizi kazımanın anlamı yok ve yönlendirmeyle kendimize
      // dönmek iç içe Worker çağrısı doğurur.
      selfHost,
    });
    if (!response || !response.ok) return empty;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("html")) {
      await response.body?.cancel().catch(() => {});
      return empty;
    }
    const found = new Map<string, string>();
    const iconTags: string[] = [];
    let headClosed = false;
    await readTextStreaming(response, MAX_HTML_BYTES, (window) => {
      collectMetaImages(window, found);
      collectIconLinks(window, iconTags);
      if (/<\/head\s*>/i.test(window)) headClosed = true;
      // İkisi de bulunduysa gerisi gereksiz. og bulunup ikon bulunamadıysa
      // `</head>`'i beklemek yeterli: `<link rel=icon>` head dışında olmaz.
      // (YouTube'un og meta'sı head'den SONRA geliyor — bu yüzden koşul
      // "og bulundu" olmadan asla true dönmez.)
      if (found.size === 0) return false;
      return headClosed;
    });
    const base = response.url || url.toString();
    const image = resolveFirst(found, PRIORITIES, base);
    const iconHref = pickFaviconHref(iconTags);
    const favicon =
      (iconHref ? resolveFirst(new Map([["icon", iconHref]]), ["icon"], base) : null) ??
      defaultFaviconUrl(base);
    // Proxy'nin servis edemeyeceği bir adresi layout'a hiç yazma.
    return {
      image: image && checkProxyImageUrl(image).ok ? image : null,
      favicon: favicon && checkProxyImageUrl(favicon).ok ? favicon : null,
    };
  } catch {
    return empty;
  }
}

/** Bağlantısı olup önizlemesi eksik sosyal blokları doldurur (görsel + favicon). */
export async function enrichSocialOgImages(layout: ProfileLayout): Promise<ProfileLayout> {
  const blocks = await Promise.all(
    layout.blocks.map(async (block) => {
      if (block.type !== "social" || !block.data.url) return block;
      if (block.data.ogImage && block.data.favicon) return block;
      const preview = await fetchLinkPreview(block.data.url);
      if (!preview.image && !preview.favicon) return block;
      return {
        ...block,
        data: {
          ...block.data,
          ogImage: block.data.ogImage || preview.image || "",
          favicon: block.data.favicon || preview.favicon || "",
        },
      };
    }),
  );
  return { ...layout, blocks };
}

export const ogApi = new Hono<{ Bindings: Env }>();

// Editör, sosyal blok bağlantısı değişince önizleme görselini buradan çeker.
// `image` layout'a yazılacak ham adres, `proxied` ise doğrudan `<img src>`'e
// konabilecek imzalı birinci taraf adrestir (imzasız adres proxy'den geçmez).
ogApi.get("/", async (c) => {
  if (isCrossOriginRequest(c.req.raw)) return c.json({ error: appCatalog[localeFromRequest(c.req.raw)].api.origin }, 403);
  const session = await getSession(c.env, c.req.raw);
  if (!session) return c.json({ error: "Oturum gerekli" }, 401);
  const { image, favicon } = await fetchLinkPreview(
    c.req.query("url") ?? "",
    new URL(c.req.url).host,
  );
  const [proxied, faviconProxied] = await Promise.all([
    image ? signImageProxyPath(c.env, image) : null,
    favicon ? signImageProxyPath(c.env, favicon) : null,
  ]);
  return c.json({ image, proxied, favicon, faviconProxied });
});
