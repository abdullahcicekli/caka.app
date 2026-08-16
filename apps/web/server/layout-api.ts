import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { createDb, profile } from "@caka/db";
import { layoutIssues, profileLayoutSchema, themeSchema } from "@caka/shared";
import { getSession } from "./auth";
import { hasSameOrigin, readLimitedJson } from "./request";

const saveSchema = z.object({
  layout: profileLayoutSchema,
  theme: themeSchema,
  version: z.number().int().min(1),
});

const publishSchema = z.object({
  version: z.number().int().min(1),
});

// /api/profile altına mount edilir: PUT /layout (taslağa kaydet),
// POST /publish (taslağı canlıya al).
export const layoutApi = new Hono<{ Bindings: Env }>();

// Taslak/yayınla modeli: editör kayıtları taslağa yazılır; yayınlanmış
// `layout`/`theme` yalnızca /publish ile değişir.
layoutApi.put("/layout", async (c) => {
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
        draftLayout: JSON.stringify(body.data.layout),
        draftTheme: body.data.theme,
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

// Taslağı canlıya alır: eksik bloklar varsa 422 ile reddeder, sorun yoksa
// layout/theme'i taslaktan kopyalayıp taslağı temizler.
layoutApi.post("/publish", async (c) => {
  if (!hasSameOrigin(c.req.raw)) {
    return c.json({ error: "Geçersiz istek kaynağı" }, 403);
  }
  const session = await getSession(c.env, c.req.raw);
  if (!session) return c.json({ error: "Oturum gerekli" }, 401);

  try {
    const body = publishSchema.safeParse(await readLimitedJson(c.req.raw, 4 * 1024));
    if (!body.success) {
      return c.json({ error: "İstek verisi geçersiz" }, 400);
    }
    const db = createDb(c.env.DB);
    const row = await db.query.profile.findFirst({
      where: eq(profile.userId, session.user.id),
    });
    if (!row) return c.json({ error: "Profil bulunamadı" }, 404);

    // Bekleyen taslak yoksa yayınlanacak yeni bir şey de yok.
    if (row.draftLayout === null) {
      return c.json({ version: row.version, published: false });
    }

    let draftJson: unknown;
    try {
      draftJson = JSON.parse(row.draftLayout);
    } catch {
      return c.json({ error: "Taslak verisi geçersiz" }, 400);
    }
    const draft = profileLayoutSchema.safeParse(draftJson);
    if (!draft.success) {
      return c.json({ error: "Taslak verisi geçersiz", issues: draft.error.issues }, 400);
    }

    const issues = layoutIssues(draft.data);
    if (issues.length > 0) {
      return c.json({ error: "Bazı bloklar tamamlanmamış", issues }, 422);
    }

    const updated = await db
      .update(profile)
      .set({
        // Ham taslak string'i değil, zod'dan geçmiş normalize hâli yayınlanır.
        layout: JSON.stringify(draft.data),
        theme: row.draftTheme ?? row.theme,
        draftLayout: null,
        draftTheme: null,
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
    return c.json({ version: updated[0]!.version, published: true });
  } catch (error) {
    if (error instanceof Error && error.message === "body_too_large") {
      return c.json({ error: "İstek verisi çok büyük" }, 413);
    }
    return c.json({ error: "Sayfa yayınlanamadı" }, 400);
  }
});
