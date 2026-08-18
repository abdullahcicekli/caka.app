// og:image çekimi: sosyal blok bağlantısının önizleme görseli.
// Görsel URL'si layout'ta saklanır; ziyaretçiye ise doğrudan değil,
// `/api/gorsel` proxy'si üzerinden servis edilir (server/image-proxy.ts).
//
// BAŞARISIZLIK NORMAL YOLDUR: ölçüldü, tipik 16 link hedefinin yalnız 7'si
// og:image veriyor (Instagram, TikTok, Spotify, Trendyol vermiyor). Bu yüzden
// burada log yok — sessizce null döner ve kart tasarlanmış fallback'ini gösterir.
import { Hono } from "hono";

import { checkProxyImageUrl, type ProfileLayout } from "@caka/shared";
import { getSession } from "./auth";
import { fetchFollowingCheckedRedirects, signImageProxyPath } from "./image-proxy";

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

function resolveOgImage(found: Map<string, string>, baseUrl: string): string | null {
  for (const key of PRIORITIES) {
    const raw = found.get(key);
    if (!raw) continue;
    try {
      const resolved = new URL(raw.trim(), baseUrl);
      if (resolved.protocol === "http:" || resolved.protocol === "https:") {
        return resolved.toString();
      }
    } catch {
      // Geçersiz aday — sıradaki meta'ya bak.
    }
  }
  return null;
}

/** Hedef sayfanın og:image URL'sini döner; bulunamazsa null (best-effort). */
export async function fetchOgImage(target: string): Promise<string | null> {
  // Oturum gerektirse de bu, kullanıcı girdisiyle tetiklenen bir dış istek:
  // proxy ile aynı SSRF kurallarından geçer (özel/loopback/metadata kapalı).
  const checked = checkProxyImageUrl(target);
  if (!checked.ok) return null;
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
    });
    if (!response || !response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("html")) {
      await response.body?.cancel().catch(() => {});
      return null;
    }
    const found = new Map<string, string>();
    await readTextStreaming(response, MAX_HTML_BYTES, (window) => {
      collectMetaImages(window, found);
      // Bir aday bulunduysa gerisini indirmeye gerek yok: kalan öncelikler
      // (secure_url vs twitter:image) aynı görseli işaret ediyor.
      return found.size > 0;
    });
    const image = resolveOgImage(found, response.url || url.toString());
    // Proxy'nin servis edemeyeceği bir adresi layout'a hiç yazma.
    return image && checkProxyImageUrl(image).ok ? image : null;
  } catch {
    return null;
  }
}

/** Bağlantısı olup görseli olmayan sosyal blokların og görselini doldurur. */
export async function enrichSocialOgImages(layout: ProfileLayout): Promise<ProfileLayout> {
  const blocks = await Promise.all(
    layout.blocks.map(async (block) => {
      if (block.type !== "social" || !block.data.url || block.data.ogImage) return block;
      const image = await fetchOgImage(block.data.url);
      return image ? { ...block, data: { ...block.data, ogImage: image } } : block;
    }),
  );
  return { ...layout, blocks };
}

export const ogApi = new Hono<{ Bindings: Env }>();

// Editör, sosyal blok bağlantısı değişince önizleme görselini buradan çeker.
// `image` layout'a yazılacak ham adres, `proxied` ise doğrudan `<img src>`'e
// konabilecek imzalı birinci taraf adrestir (imzasız adres proxy'den geçmez).
ogApi.get("/", async (c) => {
  const session = await getSession(c.env, c.req.raw);
  if (!session) return c.json({ error: "Oturum gerekli" }, 401);
  const image = await fetchOgImage(c.req.query("url") ?? "");
  const proxied = image ? await signImageProxyPath(c.env, image) : null;
  return c.json({ image, proxied });
});
