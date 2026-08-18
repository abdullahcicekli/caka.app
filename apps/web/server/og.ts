// og:image çekimi: sosyal blok bağlantısının önizleme görseli. Sayfanın
// yalnız ilk 128KB'ı okunur; og:image / twitter:image meta'sı aranır.
// Görsel URL'si layout'ta saklanır; ziyaretçiye ise doğrudan değil,
// `/api/gorsel` proxy'si üzerinden servis edilir (server/image-proxy.ts).
import { Hono } from "hono";

import { checkProxyImageUrl, type ProfileLayout } from "@caka/shared";
import { getSession } from "./auth";
import { fetchFollowingCheckedRedirects } from "./image-proxy";

// Zaman aşımı ve yönlendirme sınırı ortak fetch yardımcısından gelir
// (server/image-proxy.ts).
const MAX_HTML_BYTES = 128 * 1024;

async function readHtmlHead(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < MAX_HTML_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }
  await reader.cancel().catch(() => {});
  const merged = new Uint8Array(Math.min(total, MAX_HTML_BYTES));
  let offset = 0;
  for (const chunk of chunks) {
    const slice = chunk.subarray(0, Math.min(chunk.length, merged.length - offset));
    merged.set(slice, offset);
    offset += slice.length;
    if (offset >= merged.length) break;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(merged);
}

function extractOgImage(html: string, baseUrl: string): string | null {
  const priorities = ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src"];
  const found = new Map<string, string>();
  for (const tag of html.match(/<meta\s[^>]*>/gi) ?? []) {
    const key = /(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase();
    const content = /content\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (key && content && priorities.includes(key) && !found.has(key)) found.set(key, content);
  }
  for (const key of priorities) {
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
    if (!contentType.includes("html")) return null;
    const html = await readHtmlHead(response);
    const image = extractOgImage(html, response.url || url.toString());
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
ogApi.get("/", async (c) => {
  const session = await getSession(c.env, c.req.raw);
  if (!session) return c.json({ error: "Oturum gerekli" }, 401);
  const image = await fetchOgImage(c.req.query("url") ?? "");
  return c.json({ image });
});
