import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { createDb, profile } from "@caka/db";
import {
  MAX_LAYOUT_BLOCKS,
  layoutIssues,
  ogTemplateSchema,
  parseProfileLayout,
  parseProfileLayoutDetailed,
  profileLayoutWriteSchema,
  serializeProfileLayout,
  themeSchema,
} from "@caka/shared";
import { getSession } from "./auth";
import { hasSameOrigin, readLimitedJson } from "./request";
import { appCatalog } from "../app/content/app";
import { localeFromRequest } from "./locale";

const saveSchema = z.object({
  // Yazma şeması: okuma şemasının üstüne R6 tip-boyut sınırlarını uygular
  // (örn. status bloğu 4x4 kaydedilemez).
  layout: profileLayoutWriteSchema,
  theme: themeSchema,
  version: z.number().int().min(1),
});

const publishSchema = z.object({
  version: z.number().int().min(1),
});

const ogSettingsSchema = z.object({
  ogTemplate: ogTemplateSchema,
  // null = avatar kullan (varsayılan); dolu = layout'taki görsel bloğu.
  ogPhotoAssetId: z.string().uuid().nullable(),
});

// /api/profile altına mount edilir: PUT /layout (taslağa kaydet),
// POST /publish (taslağı canlıya al), PUT /og (paylaşım görseli ayarları).
/** İsteğin dilindeki API metinleri. */
function apiText(request: Request) {
  return appCatalog[localeFromRequest(request)].api;
}

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
    const db = createDb(c.env.DB);
    // İleri/geri uyum: bu deploy'un tanımadığı bloklar istemciye hiç
    // gitmez, bu yüzden istemcinin gönderdiği düzende de yoktur. Kaydederken
    // sunucudaki mevcut belgeden ham hâlleriyle geri eklenir — aksi hâlde
    // eski bir deploy'da yapılan tek bir autosave, yeni tipteki blokları
    // kalıcı olarak silerdi.
    const current = await db.query.profile.findFirst({
      columns: { draftLayout: true, layout: true },
      where: eq(profile.userId, session.user.id),
    });
    if (!current) return c.json({ error: "Profil bulunamadı" }, 404);
    // Editör hangi belgeyi açtıysa korunan bloklar da oradan gelir
    // (taslak ayrıştırılamıyorsa yayınlanmış hâl — loader ile aynı sıra).
    const source =
      (current.draftLayout ? parseProfileLayoutDetailed(current.draftLayout) : null) ??
      parseProfileLayoutDetailed(current.layout);
    // KAPALI BİÇİMDE BAŞARISIZ OL: kaynak belge okunamıyorsa korunacak
    // blokları da bilemeyiz. Boş dizi varsayıp yazmak, bu özelliğin
    // engellemek için var olduğu veri kaybının ta kendisi olurdu.
    if (!source) {
      return c.json({ error: apiText(c.req.raw).layoutReadFailed }, 409);
    }
    const carried = source.unknownBlocks;
    // Korunan bloklar üst sınırı aşarsa yazılan belge bir daha okunamaz
    // (zarf 50 blokla sınırlı); kaydı burada net bir mesajla kes.
    if (body.data.layout.blocks.length + carried.length > MAX_LAYOUT_BLOCKS) {
      return c.json(
        { error: apiText(c.req.raw).layoutTooManyBlocks(MAX_LAYOUT_BLOCKS) },
        400,
      );
    }
    const updated = await db
      .update(profile)
      .set({
        draftLayout: serializeProfileLayout(body.data.layout, carried),
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

// Paylaşım görseli ayarları (Ayarlar sayfası): şablon + fotoğraf kaynağı.
// Layout'tan bağımsız iki küçük alan olduğu için optimistic locking yok;
// yalnızca oturum sahibinin kendi profil satırı güncellenir (where userId).
layoutApi.put("/og", async (c) => {
  if (!hasSameOrigin(c.req.raw)) {
    return c.json({ error: "Geçersiz istek kaynağı" }, 403);
  }
  const session = await getSession(c.env, c.req.raw);
  if (!session) return c.json({ error: "Oturum gerekli" }, 401);

  try {
    const body = ogSettingsSchema.safeParse(await readLimitedJson(c.req.raw, 4 * 1024));
    if (!body.success) {
      return c.json({ error: "Ayar verisi geçersiz", issues: body.error.issues }, 400);
    }
    const db = createDb(c.env.DB);
    // Fotoğraf kaynağı ancak kullanıcının KENDİ layout'undaki bir görsel
    // bloğu olabilir; rastgele assetId yazımı burada kesilir. (Asset sonradan
    // layout'tan silinirse okuma tarafı sessizce avatara düşer.)
    if (body.data.ogPhotoAssetId !== null) {
      const row = await db.query.profile.findFirst({
        columns: { layout: true },
        where: eq(profile.userId, session.user.id),
      });
      if (!row) return c.json({ error: "Profil bulunamadı" }, 404);
      const blocks = parseProfileLayout(row.layout)?.blocks ?? [];
      const inLayout = blocks.some(
        (block) => block.type === "image" && block.data.assetId === body.data.ogPhotoAssetId,
      );
      if (!inLayout) {
        return c.json({ error: "Seçilen görsel sayfanda bulunamadı" }, 400);
      }
    }
    const updated = await db
      .update(profile)
      .set({
        ogTemplate: body.data.ogTemplate,
        ogPhotoAssetId: body.data.ogPhotoAssetId,
        updatedAt: new Date(),
      })
      .where(eq(profile.userId, session.user.id))
      .returning({ id: profile.id });
    if (!updated.length) return c.json({ error: "Profil bulunamadı" }, 404);
    return c.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "body_too_large") {
      return c.json({ error: "Ayar verisi çok büyük" }, 413);
    }
    return c.json({ error: "Ayarlar kaydedilemedi" }, 400);
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

    // Kurtarmalı ayrıştırma: tanınmayan bloklar yayını düşürmez, ham
    // hâlleriyle yayınlanan belgeye taşınır.
    const parsed = parseProfileLayoutDetailed(row.draftLayout);
    if (!parsed) {
      return c.json({ error: "Taslak verisi geçersiz" }, 400);
    }
    const draft = profileLayoutWriteSchema.safeParse(parsed.layout);
    if (!draft.success) {
      return c.json({ error: apiText(c.req.raw).draftInvalid, issues: draft.error.issues }, 400);
    }

    const issues = layoutIssues(draft.data);
    if (issues.length > 0) {
      return c.json({ error: apiText(c.req.raw).blocksIncomplete, issues }, 422);
    }

    const updated = await db
      .update(profile)
      .set({
        // Ham taslak string'i değil, zod'dan geçmiş normalize hâli yayınlanır
        // (tanınmayan bloklar ham hâlleriyle korunur).
        layout: serializeProfileLayout(draft.data, parsed.unknownBlocks),
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
