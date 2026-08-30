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
import { and, eq } from "drizzle-orm";
import { Hono, type Context } from "hono";

import { createDb, post } from "@caka/db";
import {
  computeOgHash,
  GRID_UNIT,
  layoutPhotoAssets,
  normalizeOgTemplate,
  normalizeUsername,
  ogImagePath,
  ogTemplateSchema,
  parseProfileLayout,
  resolveOgPhotoAssetId,
  shortContentHash,
  validatePostSlug,
  type OgProfileData,
  type OgTemplate,
} from "@caka/shared";
import { resolveUsername } from "./profile";

/** Üretim başarısız olursa dönülen sabit marka görseli — sayfa og:image'siz kalmaz. */
const FALLBACK_OG_IMAGE = "/og/caka-og-bento-B.png";

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
  // `image` ve `gallery` tek blokta birleşti; aday listesi artık galerideki
  // fotoğrafları da içeriyor (blok sırası korunur, ilk fotoğraf öncelikli).
  const imageAssetIds = layoutPhotoAssets({ version: 1, grid: GRID_UNIT, blocks }).map(
    (item) => item.assetId,
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

/* ------------------------------------------------------------------ *
 * Yazı paylaşım görseli (U5/KTD6): /og/p/<username>/<slug>/<hash>.png
 * ------------------------------------------------------------------ */

/**
 * Yazı görseli mevcut şablonlardan p5'i (Monogram) kullanır: fotoğraf/avatar
 * istemez (R2'ye inilmez, ~40 ms'lik en ucuz dal) ve büyük başlık + adres
 * yerleşimi yazıya birebir oturur. `name` alanına yazı BAŞLIĞI, `title`
 * alanına boş dize verilir — alt satırda zaten `/<username>` basılır.
 */
const POST_OG_TEMPLATE: OgTemplate = "p5";

interface PostOgSource {
  slug: string;
  title: string;
  publishedAt: Date | null;
}

/**
 * Yazı görselinin içerik özeti — profil hattındaki `computeOgHash` ile aynı
 * biçim (8 bayt / 16 hex SHA-256 öneki). Girdiye başlık + İLK yayın anı girer
 * (KTD6): başlık değişince URL değişir ve scraper cache'i kendiliğinden
 * tazelenir; `username`/`slug` da katılır ki iki yazının aynı başlığı aynı
 * hash'i paylaşmasın.
 */
async function computePostOgHash(
  username: string,
  postRow: PostOgSource,
): Promise<string> {
  return shortContentHash([
    "post",
    username,
    postRow.slug,
    postRow.title,
    postRow.publishedAt ? postRow.publishedAt.getTime() : 0,
  ]);
}

/** Kanonik yazı og:image yolu. */
function postOgImagePath(username: string, slug: string, hash: string): string {
  return `/og/p/${username}/${slug}/${hash}.png`;
}

/** Yazı sayfası loader'ının meta için kullandığı güncel og:image yolu. */
export async function ogImagePathForPost(
  username: string,
  postRow: PostOgSource,
): Promise<string> {
  return postOgImagePath(username, postRow.slug, await computePostOgHash(username, postRow));
}

type OgContext = Context<{ Bindings: Env }>;

// DOM lib'in CacheStorage tipi `default`ı bilmez; workerd'de mevcut.
// Cache API colo-yereldir: ilk istekler colo başına bir kez üretir.
function defaultCache(): Cache {
  return (caches as unknown as { default: Cache }).default;
}

/**
 * Hash'li URL'in KANONİK cache anahtarı: query string atılır, yol normalize
 * hâliyle yazılır. Aksi hâlde `?a=1`, `?a=2`… veya `/og/u/FOO/...` her
 * istekte cache miss yaratıp tam PNG üretimini (satori + resvg + R2 GET)
 * tetikler ve cache'i çöple doldurur.
 */
function canonicalCacheKey(requestUrl: string, pathname: string): Request {
  const url = new URL(requestUrl);
  url.pathname = pathname;
  url.search = "";
  return new Request(url.toString());
}

/** Adres devrini (30 gün, Değişmez #10) izleyerek profili çözer: görsel de
 *  yeni adrese taşınır. */
async function resolveThroughRedirect(env: Env, username: string) {
  const resolved = await resolveUsername(env, username);
  return resolved.kind === "redirect" ? resolveUsername(env, resolved.to) : resolved;
}

/**
 * PNG üretimi + colo-yerel cache yazımı — iki ucun ortak kuyruğu. Raster
 * katmanı (WASM + fontlar) yalnız burada dinamik import edilir; import da
 * render da patlarsa sayfa og:image'siz kalmasın diye sabit marka görseline
 * düşülür (best-effort), worker'ın kalanı etkilenmez.
 */
async function renderAndCache(
  c: OgContext,
  cacheKey: Request,
  data: OgProfileData,
): Promise<Response> {
  try {
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
    c.executionCtx.waitUntil(defaultCache().put(cacheKey, response.clone()));
    return response;
  } catch {
    return c.redirect(FALLBACK_OG_IMAGE, 302);
  }
}

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
  const resolved = await resolveThroughRedirect(c.env, username);
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
  // inmeyiz.
  const cacheKey = canonicalCacheKey(c.req.url, ogImagePath(username, template, requestedHash));
  const cached = await defaultCache().match(cacheKey);
  if (cached) return cached;

  const resolved = await resolveThroughRedirect(c.env, username);
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

  return renderAndCache(c, cacheKey, data);
});

/**
 * Yazı paylaşım görseli (R14). Profil ucuyla aynı hat: kanonik cache anahtarı,
 * colo-yerel Cache API, immutable PNG, hata hâlinde fallback.
 *
 * KRİTİK GÜVENLİK KAPISI (KTD6/AE1): uç YALNIZ `status='published'` yazı için
 * render eder. Taslak ve hiç olmayan yazı AYNI genel fallback görseline düşer —
 * ikisi ayrışsaydı uç, taslak varlığını sızdıran bir oracle olurdu; render
 * etseydi taslak BAŞLIĞI PNG üzerinden sızardı. Hash uyuşmazlığında güncel
 * adrese yönlendirme de bu kapının ARKASINDADIR: yalnız yayındaki yazı için
 * yapılır. Taslağa dönüşte colo cache'inde kalabilecek eski immutable PNG,
 * planda kabul edilmiş artık risktir.
 */
ogImageApi.get("/p/:username/:slug/:file", async (c) => {
  const fileMatch = HASH_FILE_PATTERN.exec(c.req.param("file"));
  if (!fileMatch) return c.notFound();
  const requestedHash = fileMatch[1];
  const username = normalizeUsername(c.req.param("username"));
  // Slug KATI doğrulanır; biçimsiz/rezerve segment hiçbir yazıya ait olamaz.
  const slugParsed = validatePostSlug(c.req.param("slug"));
  if (!slugParsed.ok) return c.redirect(FALLBACK_OG_IMAGE, 302);
  const slug = slugParsed.slug;

  const cacheKey = canonicalCacheKey(c.req.url, postOgImagePath(username, slug, requestedHash));
  const cached = await defaultCache().match(cacheKey);
  if (cached) return cached;

  const resolved = await resolveThroughRedirect(c.env, username);
  if (resolved.kind !== "profile") {
    return c.redirect(FALLBACK_OG_IMAGE, 302);
  }

  const row = await createDb(c.env.DB).query.post.findFirst({
    columns: { slug: true, title: true, status: true, publishedAt: true },
    where: and(eq(post.profileId, resolved.profile.id), eq(post.slug, slug)),
  });
  // KTD6 kapısı: yok ve taslak AYIRT EDİLMEDEN fallback'e düşer (AE1).
  if (!row || row.status !== "published") {
    return c.redirect(FALLBACK_OG_IMAGE, 302);
  }

  const currentHash = await computePostOgHash(resolved.profile.username, row);
  if (currentHash !== requestedHash || resolved.profile.username !== username) {
    // Eski paylaşım: güncel görsele 302 (301 süresiz cache'lenir, kullanma).
    // Bu dal yalnız YAYINDAKİ yazı için çalışır — kapı yukarıda.
    return c.redirect(postOgImagePath(resolved.profile.username, row.slug, currentHash), 302);
  }

  // p5 girdisi: başlık `name` alanında büyük basılır; fotoğraf/avatar yok.
  const data: OgProfileData = {
    template: POST_OG_TEMPLATE,
    name: row.title,
    title: "",
    username: resolved.profile.username,
    photoAssetId: null,
    avatarAssetId: null,
    linkTitles: [],
  };

  return renderAndCache(c, cacheKey, data);
});
