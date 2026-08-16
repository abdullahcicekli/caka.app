import { and, eq } from "drizzle-orm";
import { Hono } from "hono";

import { asset, createDb } from "@caka/db";
import { getSession } from "./auth";
import { sniffImageType } from "./avatar";
import { hasSameOrigin, readLimitedBody } from "./request";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png"]);

export const onboardingApi = new Hono<{ Bindings: Env }>();

onboardingApi.post("/avatar", async (c) => {
  if (!hasSameOrigin(c.req.raw)) {
    return c.json({ error: "Geçersiz istek kaynağı" }, 403);
  }
  const session = await getSession(c.env, c.req.raw);
  if (!session) return c.json({ error: "Oturum gerekli" }, 401);
  const declaredType = c.req.header("Content-Type")?.split(";")[0] ?? "";
  if (!ACCEPTED_TYPES.has(declaredType)) {
    return c.json({ error: "Yalnızca JPEG veya PNG yükleyebilirsin" }, 400);
  }
  const bytes = await readLimitedBody(c.req.raw, MAX_AVATAR_BYTES);
  if (!bytes) return c.json({ error: "Fotoğraf en fazla 5 MB olabilir" }, 413);
  const contentType = sniffImageType(bytes);
  if (!contentType || !ACCEPTED_TYPES.has(contentType) || contentType !== declaredType) {
    return c.json({ error: "Fotoğraf türü doğrulanamadı" }, 400);
  }

  const id = crypto.randomUUID();
  await c.env.BUCKET.put(id, bytes, { httpMetadata: { contentType } });
  try {
    await createDb(c.env.DB).insert(asset).values({
      id,
      userId: session.user.id,
      contentType,
      size: bytes.byteLength,
    });
  } catch (error) {
    await c.env.BUCKET.delete(id);
    console.error(JSON.stringify({ message: "onboarding avatar insert failed", error: String(error) }));
    return c.json({ error: "Fotoğraf kaydedilemedi" }, 500);
  }
  return c.json({ id, url: `/i/${id}` });
});

export async function isAssetOwnedByUser(env: Env, assetId: string, userId: string) {
  const found = await createDb(env.DB).query.asset.findFirst({
    columns: { id: true },
    where: and(eq(asset.id, assetId), eq(asset.userId, userId)),
  });
  return Boolean(found);
}
