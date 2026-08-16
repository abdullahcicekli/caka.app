import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { createDb, profile } from "@caka/db";
import { profileLayoutSchema, themeSchema } from "@caka/shared";
import { getSession } from "./auth";
import { hasSameOrigin, readLimitedJson } from "./request";

const saveSchema = z.object({
  layout: profileLayoutSchema,
  theme: themeSchema,
  version: z.number().int().min(1),
});

export const layoutApi = new Hono<{ Bindings: Env }>();

layoutApi.put("/", async (c) => {
  if (!hasSameOrigin(c.req.raw)) {
    return c.json({ error: "Geçersiz istek kaynağı" }, 403);
  }
  const session = await getSession(c.env, c.req.raw);
  if (!session) return c.json({ error: "Oturum gerekli" }, 401);

  try {
    const body = saveSchema.safeParse(await readLimitedJson(c.req.raw, 128 * 1024));
    if (!body.success) {
      return c.json({ error: "Sayfa verisi geçersiz", issues: body.error.issues }, 400);
    }
    const updated = await createDb(c.env.DB)
      .update(profile)
      .set({
        layout: JSON.stringify(body.data.layout),
        theme: body.data.theme,
        version: body.data.version + 1,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(profile.userId, session.user.id),
          eq(profile.version, body.data.version),
        ),
      )
      .returning({ version: profile.version });
    if (!updated.length) {
      return c.json({ error: "Sayfa başka bir yerde güncellendi" }, 409);
    }
    return c.json({ version: updated[0]!.version });
  } catch (error) {
    if (error instanceof Error && error.message === "body_too_large") {
      return c.json({ error: "Sayfa verisi çok büyük" }, 413);
    }
    return c.json({ error: "Sayfa kaydedilemedi" }, 400);
  }
});
