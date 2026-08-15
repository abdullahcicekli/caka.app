import { Hono } from "hono";

// Hono, Worker'ın API yüzeyini taşır (KTD2): /api/*, /i/* ve /:username/og.png
// buraya düşer; SSR sayfaları React Router handler'ında kalır.
export const honoApp = new Hono<{ Bindings: Env }>();

honoApp.get("/api/health", (c) => c.json({ ok: true }));
