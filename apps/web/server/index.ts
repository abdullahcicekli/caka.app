import { Hono } from "hono";

import {
  DOCUMENT_CONTENT_TYPE,
  contentDispositionHeader,
  validateUsername,
} from "@caka/shared";
import { analyticsApi } from "./analytics-api";
import { getAuth } from "./auth";
import { documentApi } from "./document-api";
import { imageProxyApi } from "./image-proxy";
import { isUsernameAvailable } from "./profile";
import { layoutApi } from "./layout-api";
import { locationApi } from "./location-api";
import { mapFrameApi } from "./map-frame";
import { ogApi } from "./og";
import { quranApi } from "./quran-api";
import { ogImageApi } from "./og-image";
import { onboardingApi } from "./onboarding-api";
import { seoRoutes } from "./seo";
import { spotifyApi } from "./spotify-api";
import { youtubeApi } from "./youtube-api";

// Hono; API, R2 görselleri ve makine-okur SEO endpointlerini taşır. SSR
// sayfaları React Router handler'ında kalır.
export const honoApp = new Hono<{ Bindings: Env }>();

honoApp.route("/", seoRoutes);

honoApp.get("/api/health", (c) => c.json({ ok: true }));

// Better Auth: /api/auth/* (Google + Apple OAuth)
honoApp.on(["GET", "POST"], "/api/auth/*", (c) =>
  getAuth(c.env).handler(c.req.raw),
);

honoApp.route("/api/onboarding", onboardingApi);
// Belge (CV) yükleme ucu: POST /api/belge — yalnız PDF, 10 MB tavanı ve
// sihirli bayt doğrulaması (bkz. server/document-api.ts).
honoApp.route("/api/belge", documentApi);
// layoutApi: PUT /api/profile/layout (taslak kaydı) + POST /api/profile/publish
honoApp.route("/api/profile", layoutApi);
// Birinci taraf ölçüm (R48): POST /api/olcum/tiklama — çerezsiz, gövdesiz 204.
honoApp.route("/api/olcum", analyticsApi);
honoApp.route("/api/og-image", ogApi);
// Editörün YouTube çözümleme ucu (KTD34): GET /api/youtube?url=… — video mu
// kanal mı olduğu kayıt anında burada çözülür, render tekrarlamaz.
honoApp.route("/api/youtube", youtubeApi);
// Editörün Spotify çözümleme ucu: GET /api/spotify?url=… — tür (parça/albüm/
// liste/…) ve kimlik kayıt anında burada çözülür, render tekrarlamaz.
honoApp.route("/api/spotify", spotifyApi);
// Editörün konum arama ucu: GET /api/konum?q=… — yer, ülke, koordinat ve
// saat dilimi kayıt anında burada çözülür, render tekrarlamaz. Oturum ister.
honoApp.route("/api/konum", locationApi);
// Konum kartının statik harita karesi (R58): GET /api/harita — kareyi Worker
// çeker ve birinci taraftan servis eder; ziyaretçi harita sunucusuna hiç
// bağlanmaz. İmzalı; anahtar/sır tanımsızsa tamamen kapalı.
honoApp.route("/api/harita", mapFrameApi);
// Editörün ayet arama/çözümleme ucu: GET /api/ayet?q=… ve /api/ayet/sec.
// Kur'an metni pakete GÖMÜLMEZ (2,7 MB); yalnız burada, oturumlu kullanıcı
// için çözülür ve seçilen ayet bloğun verisine yazılır — ziyaretçi sayfası
// hiçbir dış kaynağa gitmez (R58).
honoApp.route("/api/ayet", quranApi);
// Uzak önizleme görselleri birinci taraftan servis edilir (backlog #6):
// ziyaretçinin IP/UA'sı uzak host'a gitmez, üçüncü taraf çerezi yazılamaz.
honoApp.route("/api/gorsel", imageProxyApi);
// Kullanıcıya özel og:image: /og/u/:username/:hash.png (hash'li, immutable)
honoApp.route("/og", ogImageApi);

/**
 * Canlı adres kontrolü — yalnızca tavsiye niteliğinde (R2); garanti claim'de.
 * Onboarding auth'tan ÖNCE geldiği için oturumsuz erişilebilir; kötüye
 * kullanım sınırı zone-level rate limit ile (U12) tamamlanacak.
 */
/** R2 görsel servisi (KTD10): anahtar = asset id, path-traversal yüzeyi yok. */
const ASSET_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** `/i/` YALNIZ görsel servis eder. Tür kontrolü, aynı kovadaki belgelerin bu
 *  yoldan (dosya adı taşımayan, satır içi bir yanıtla) çıkmasını kapatır: her
 *  tür kendi başlık setini hak ediyor ve iki yolun karışması, birinde yapılan
 *  sıkılaştırmayı diğerinde delik bırakırdı. */
const IMAGE_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

honoApp.get("/i/:id", async (c) => {
  const id = c.req.param("id");
  if (!ASSET_ID_PATTERN.test(id)) return c.notFound();
  const object = await c.env.BUCKET.get(id);
  if (!object) return c.notFound();
  if (!IMAGE_CONTENT_TYPES.has(object.httpMetadata?.contentType ?? "")) {
    return c.notFound();
  }
  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
});

/**
 * Belge servisi — /b/:id (Değişmez #1: `b` ve `belge` rezerve adlarda).
 *
 * VARSAYILAN İNDİRMEDİR, satır içi görüntüleme değil. Gerekçe: dosya
 * kullanıcının yüklediği rastgele bir PDF'tir ve tarayıcının PDF
 * görüntüleyicisi (PDFium / pdf.js) küçük bir yüzey değildir. Satır içi
 * açılan belge, profil sayfalarıyla AYNI kökende bir belge olarak ayrışırdı;
 * `attachment` ile tarayıcı dosyayı bizim kökenimizde hiç ayrıştırmaz,
 * açma kararını ziyaretçi kendi cihazında verir.
 *
 * `?onizleme=1` satır içi sunar (kartın "Önizle" eylemi, YENİ SEKMEDE — kartın
 * içine gömülü bir PDF sayfanın üstünü kaplayıp sayfaya bürünebilirdi). O
 * dalda üç kilit birlikte çalışır:
 *  • `Content-Security-Policy: default-src 'none'; sandbox` — belge donuk
 *    (opaque) bir kökende açılır, caka.app kökeninde script/istek yok;
 *  • `X-Content-Type-Options: nosniff` — tarayıcı türü kendi tahmin edemez;
 *  • yüklemedeki `%PDF-` kontrolü — PDF olmayan gövde buraya zaten giremez.
 */
honoApp.get("/b/:id", async (c) => {
  const id = c.req.param("id");
  if (!ASSET_ID_PATTERN.test(id)) return c.notFound();
  const object = await c.env.BUCKET.get(id);
  if (!object) return c.notFound();
  if (object.httpMetadata?.contentType !== DOCUMENT_CONTENT_TYPE) return c.notFound();
  const inline = c.req.query("onizleme") === "1";
  return new Response(object.body, {
    headers: {
      "Content-Type": DOCUMENT_CONTENT_TYPE,
      // Ad R2 metadata'sından okunur: yüklemede SUNUCUNUN temizlediği addır,
      // düzeni yazan istemciden gelmez.
      "Content-Disposition": contentDispositionHeader(
        inline ? "inline" : "attachment",
        object.customMetadata?.fileName ?? "",
      ),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      // Belge, profil sayfasından erişilebilir ama KENDİ BAŞINA bir arama
      // sonucu olmamalı: tipik içerik bir CV, yani telefon/adres taşıyan bir
      // dosya. Kullanıcı onu sayfasına koydu; aramada ayrı bir sonuç olarak
      // çıkmasını istediğini varsayamayız.
      "X-Robots-Tag": "noindex, noarchive",
    },
  });
});

honoApp.get("/api/username-check", async (c) => {
  const input = c.req.query("u") ?? "";
  const result = validateUsername(input);
  if (!result.ok) {
    return c.json({ available: false, reason: result.error });
  }
  const available = await isUsernameAvailable(c.env, result.username);
  return c.json({ available, username: result.username });
});
