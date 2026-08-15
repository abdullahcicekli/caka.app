import { Hono } from "hono";

import { validateUsername } from "@caka/shared";
import { getAuth } from "./auth";
import { isUsernameAvailable } from "./profile";

// Hono, Worker'ın API yüzeyini taşır (KTD2): /api/*, /i/* ve /:username/og.png
// buraya düşer; SSR sayfaları React Router handler'ında kalır.
export const honoApp = new Hono<{ Bindings: Env }>();

honoApp.get("/api/health", (c) => c.json({ ok: true }));

// Better Auth: /api/auth/* (Google OAuth dahil)
honoApp.on(["GET", "POST"], "/api/auth/*", (c) =>
  getAuth(c.env).handler(c.req.raw),
);

/**
 * Canlı adres kontrolü — yalnızca tavsiye niteliğinde (R2); garanti claim'de.
 * Onboarding auth'tan ÖNCE geldiği için oturumsuz erişilebilir; kötüye
 * kullanım sınırı zone-level rate limit ile (U12) tamamlanacak.
 */
honoApp.get("/api/username-check", async (c) => {
  const input = c.req.query("u") ?? "";
  const result = validateUsername(input);
  if (!result.ok) {
    return c.json({ available: false, reason: result.error });
  }
  const available = await isUsernameAvailable(c.env, result.username);
  return c.json({ available, username: result.username });
});
