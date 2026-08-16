/**
 * Kullanıcıya özel og:image üretimi + önbelleği (KTD7 tabanı, hash'li URL).
 *
 * URL şeması: /og/u/<username>/<template>/<hash>.png — şablon URL'dedir ki
 * Ayarlar sayfası 6 şablonu da gerçek render'la gösterebilsin; hash, o
 * şablonla üretilen görseli etkileyen profil içeriğinin (şablon + ad + bio +
 * fotoğraf kaynağı + bağlantı başlıkları) kısa özetidir. İçerik değişince URL
 * değişir; sosyal ağ scraper'ları yeni görseli kendiliğinden çeker (cache
 * invalidation bedava). Eski hash'li istekler güncel URL'e 302 döner; eski
 * 3 segmentli `/og/u/<username>/<hash>.png` deseni de (sosyal ağlarca
 * önbelleğe alındı) seçili şablonun güncel URL'ine 302 ile taşınır.
 *
 * Plandan bilinçli sapma: KTD6/KTD7 `/:username/og.png` + 1 saatlik Cache API
 * öngörüyordu; hash'li URL immutable cache'e izin verdiği için bu yol seçildi.
 * R2'ye YAZILMAZ: üretim ~40 ms (ucuz) ve Değişmez #9 (düz UUID anahtar)
 * türetilmiş görsel saklamayı zorlaştırır.
 *
 * Saf yardımcılar (hash, bayt parser'ları, fotoğraf önceliği)
 * `@caka/shared/og-image`'da yaşar ve orada test edilir; raster katmanı
 * (`./og-render`, WASM + fontlar) yalnız cache miss'te dinamik import edilir —
 * SSR/auth istekleri o yükü taşımaz.
 */
import { Hono } from "hono";

import {
  computeOgHash,
  normalizeOgTemplate,
  normalizeUsername,
  ogImagePath,
  ogTemplateSchema,
  parseProfileLayout,
  resolveOgPhotoAssetId,
  type OgProfileData,
  type OgTemplate,
} from "@caka/shared";
import { resolveUsername } from "./profile";

/** Üretim başarısız olursa dönülen sabit marka görseli — sayfa og:image'siz kalmaz. */
const FALLBACK_OG_IMAGE = "/og/caka-og-bento-A.png";

interface OgProfileSource {
  username: string;
  layout: string;
  ogTemplate: string;
  ogPhotoAssetId: string | null;
}

/**
 * Profil satırından og görselini etkileyen alanları çıkarır. `template`
 * verilirse profildeki seçim yerine o şablon kullanılır (Ayarlar önizlemeleri
 * 6 şablonun URL'ini de bu yolla üretir).
 */
export function extractOgProfileData(
  row: OgProfileSource,
  template?: OgTemplate,
): OgProfileData {
  const layout = parseProfileLayout(row.layout);
  const blocks = layout?.blocks ?? [];
  const profileBlock = blocks.find((block) => block.type === "profile");
  const name =
    (profileBlock?.type === "profile" ? profileBlock.data.name : "") || row.username;
  const title = profileBlock?.type === "profile" ? profileBlock.data.title.trim() : "";
  const avatarAssetId =
    (profileBlock?.type === "profile" ? profileBlock.data.avatarAssetId : undefined) ??
    null;
  const imageAssetIds = blocks.flatMap((block) =>
    block.type === "image" && block.data.assetId ? [block.data.assetId] : [],
  );
  const linkTitles = blocks.flatMap((block) => {
    if (block.type === "link" && block.data.title) return [block.data.title];
    if (block.type === "social") {
      const label = block.data.label || block.data.handle;
      return label ? [label] : [];
    }
    return [];
  });
  return {
    template: template ?? normalizeOgTemplate(row.ogTemplate),
    name,
    title,
    username: row.username,
    // Öncelik: kullanıcının seçtiği görsel bloğu → avatar → ilk görsel bloğu.
    // Avatar önde çünkü "kişinin kendisi" olan tek alan o; rastgele bir görsel
    // bloğu (masa/oda fotoğrafı) kişinin fotoğrafı sayılamaz.
    photoAssetId: resolveOgPhotoAssetId({
      selectedAssetId: row.ogPhotoAssetId,
      avatarAssetId,
      imageAssetIds,
    }),
    avatarAssetId,
    linkTitles,
  };
}

/** Verilen şablon için güncel og:image yolu (hash dahil). */
export async function ogImagePathForTemplate(
  row: OgProfileSource,
  template: OgTemplate,
): Promise<string> {
  const data = extractOgProfileData(row, template);
  return ogImagePath(data.username, template, await computeOgHash(data));
}

/** Loader'ın meta için kullandığı güncel og:image yolu (seçili şablon). */
export async function ogImagePathForProfile(row: OgProfileSource): Promise<string> {
  return ogImagePathForTemplate(row, normalizeOgTemplate(row.ogTemplate));
}

const HASH_FILE_PATTERN = /^([0-9a-f]{16})\.png$/;

export const ogImageApi = new Hono<{ Bindings: Env }>();

/**
 * Eski 3 segmentli desen (`/og/u/:username/<hash>.png`, şablonsuz): sosyal
 * ağlar bu URL'leri çoktan önbelleğe aldı — kırma, seçili şablonun güncel
 * URL'ine 302 dön (Değişmez #10 ruhu: 301 süresiz cache'lenir, kullanma).
 * Hono'da bu route 4 segmentli olanla çakışmaz; `:file` tek segment eşler.
 */
ogImageApi.get("/u/:username/:file", async (c) => {
  if (!HASH_FILE_PATTERN.test(c.req.param("file"))) return c.notFound();
  const username = normalizeUsername(c.req.param("username"));
  let resolved = await resolveUsername(c.env, username);
  if (resolved.kind === "redirect") {
    resolved = await resolveUsername(c.env, resolved.to);
  }
  if (resolved.kind !== "profile") {
    return c.redirect(FALLBACK_OG_IMAGE, 302);
  }
  return c.redirect(await ogImagePathForProfile(resolved.profile), 302);
});

ogImageApi.get("/u/:username/:template/:file", async (c) => {
  const fileMatch = HASH_FILE_PATTERN.exec(c.req.param("file"));
  if (!fileMatch) return c.notFound();
  // Şablon segmenti KATI doğrulanır (normalize edilmez): bilinmeyen değer
  // p1'e sessizce düşseydi kanonik cache anahtarı yanlış içerikle dolardı.
  const templateParsed = ogTemplateSchema.safeParse(c.req.param("template"));
  if (!templateParsed.success) return c.notFound();
  const template = templateParsed.data;
  const requestedHash = fileMatch[1];
  const username = normalizeUsername(c.req.param("username"));

  // Hash URL'de olduğu için içerik değişmezdir: cache isabetinde D1'e bile
  // inmeyiz. Cache API colo-yereldir; ilk istekler colo başına bir kez üretir.
  // DOM lib'in CacheStorage tipi `default`ı bilmez; workerd'de mevcut.
  //
  // Anahtar KANONİKTİR: query string atılır ve kullanıcı adı normalize edilmiş
  // hâliyle yazılır. Aksi hâlde `?a=1`, `?a=2`… veya `/og/u/FOO/...` her
  // istekte cache miss yaratıp tam PNG üretimini (satori + resvg + R2 GET)
  // tetikleyebilir ve cache'i çöple doldurur.
  const cache = (caches as unknown as { default: Cache }).default;
  const canonicalUrl = new URL(c.req.url);
  canonicalUrl.pathname = ogImagePath(username, template, requestedHash);
  canonicalUrl.search = "";
  const cacheKey = new Request(canonicalUrl.toString());
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let resolved = await resolveUsername(c.env, username);
  if (resolved.kind === "redirect") {
    // Adres devri (30 gün, R18): görsel de yeni adrese taşınır.
    resolved = await resolveUsername(c.env, resolved.to);
  }
  if (resolved.kind !== "profile") {
    return c.redirect(FALLBACK_OG_IMAGE, 302);
  }

  // Şablon URL'den gelir (profildeki seçim değil): Ayarlar 6 şablonu da
  // gerçek render'la göstersin diye her şablonun kendi kararlı URL'i var.
  const data = extractOgProfileData(resolved.profile, template);
  const currentHash = await computeOgHash(data);
  if (currentHash !== requestedHash || resolved.profile.username !== username) {
    // Eski paylaşım: aynı şablonun güncel görseline yönlendir. 302 + kısa
    // cache (Değişmez #10 ruhu: 301 süresiz cache'lenir, kullanma).
    return c.redirect(
      ogImagePath(resolved.profile.username, template, currentHash),
      302,
    );
  }

  try {
    // Raster katmanı (WASM + fontlar) yalnız burada yüklenir; import da
    // render da patlarsa fallback'e düşülür, worker'ın kalanı etkilenmez.
    const { renderOgPng } = await import("./og-render");
    const png = await renderOgPng(c.env, data);
    const response = new Response(png, {
      headers: {
        "Content-Type": "image/png",
        // URL hash'li olduğu için immutable güvenli.
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
    c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch {
    // Üretim hatasında sayfa asla og:image'siz kalmasın (best-effort).
    return c.redirect(FALLBACK_OG_IMAGE, 302);
  }
});
