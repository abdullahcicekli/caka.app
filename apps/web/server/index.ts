import { Hono } from "hono";

import { validateUsername } from "@caka/shared";
import { analyticsApi } from "./analytics-api";
import { getAuth } from "./auth";
import { isUsernameAvailable } from "./profile";
import { layoutApi } from "./layout-api";
import { ogApi } from "./og";
import { ogImageApi } from "./og-image";
import { onboardingApi } from "./onboarding-api";
import { seoRoutes } from "./seo";

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
// layoutApi: PUT /api/profile/layout (taslak kaydı) + POST /api/profile/publish
honoApp.route("/api/profile", layoutApi);
// Birinci taraf ölçüm (R48): POST /api/olcum/tiklama — çerezsiz, gövdesiz 204.
honoApp.route("/api/olcum", analyticsApi);
honoApp.route("/api/og-image", ogApi);
// Kullanıcıya özel og:image: /og/u/:username/:hash.png (hash'li, immutable)
honoApp.route("/og", ogImageApi);

/**
 * Canlı adres kontrolü — yalnızca tavsiye niteliğinde (R2); garanti claim'de.
 * Onboarding auth'tan ÖNCE geldiği için oturumsuz erişilebilir; kötüye
 * kullanım sınırı zone-level rate limit ile (U12) tamamlanacak.
 */
/** R2 görsel servisi (KTD10): anahtar = asset id, path-traversal yüzeyi yok. */
const ASSET_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

honoApp.get("/i/:id", async (c) => {
  const id = c.req.param("id");
  if (!ASSET_ID_PATTERN.test(id)) return c.notFound();
  const object = await c.env.BUCKET.get(id);
  if (!object) return c.notFound();
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

honoApp.get("/api/username-check", async (c) => {
  const input = c.req.query("u") ?? "";
  const result = validateUsername(input);
  if (!result.ok) {
    return c.json({ available: false, reason: result.error });
  }
  const available = await isUsernameAvailable(c.env, result.username);
  return c.json({ available, username: result.username });
});
