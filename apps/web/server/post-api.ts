import { and, count, desc, eq, ne } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { createDb, post, profile } from "@caka/db";
import {
  MAX_POSTS_PER_PROFILE,
  POST_BODY_MAX_BYTES,
  POST_TITLE_MAX,
  validatePostDoc,
  validatePostSlug,
} from "@caka/shared";
import { getSession } from "./auth";
import { hasSameOrigin, isCrossOriginRequest, readLimitedJson } from "./request";
import { appCatalog } from "../app/content/app";
import { localeFromRequest } from "./locale";

// /api/yazi altına mount edilir (U3). Uçların TAMAMI oturum + köken kapısının
// arkasındadır ve yalnız oturum sahibinin KENDİ profilindeki yazılara dokunur:
// profil parametresi kabul edilmez, hedef her zaman oturumdan türetilir.
// Adres denetimi de bu kapının arkasındadır — herkese açık bir "slug boşta mı"
// ucu, taslak varlığını sızdıran bir sayım oracle'ı olurdu (R4).

/** İsteğin dilindeki API metinleri. */
function apiText(request: Request) {
  return appCatalog[localeFromRequest(request)].api;
}

// Gövde 50 KB (R7) + başlık/slug/JSON zarfı için pay. Zarfı aşan istek daha
// gövde ayrıştırılmadan 413 ile kesilir (readLimitedJson).
const REQUEST_BYTE_LIMIT = POST_BODY_MAX_BYTES + 8 * 1024;

// Gövde (body) serileştirilmiş JSON metni olarak taşınır — DB kolonu da metin.
// Doğrulama `validatePostDoc` (R6/R7/R9): boyut, düğüm/mark izin listesi ve
// birinci taraf görsel kaynağı tek kaynaktan denetlenir; izin dışı düğüm
// sessizce düşmez, kimlikli hatayla reddedilir.

/** Gövdeyi ayrıştırıp postDoc şemasından geçirir; hatayı HTTP koduna eşler. */
function checkPostBody(
  raw: string,
): { ok: true } | { ok: false; status: 400 | 413; issue: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, status: 400, issue: "invalid_doc" };
  }
  const doc = validatePostDoc(parsed);
  if (!doc.ok) {
    return {
      ok: false,
      status: doc.issue === "body_too_large" ? 413 : 400,
      issue: doc.issue,
    };
  }
  return { ok: true };
}
const createSchema = z.object({
  slug: z.string(),
  title: z.string().trim().min(1).max(POST_TITLE_MAX),
  body: z.string(),
});

// Güncelleme tam belge gönderir (başlık+gövde+slug birlikte) ve iyimser kilit
// için istemcinin elindeki updatedAt'i (ms) taşır — layout-api'deki `version`
// deseninin satır düzeyi karşılığı.
const updateSchema = createSchema.extend({
  updatedAt: z.number().int().min(0),
});

// Yayınla / taslağa al: içerik taşımaz, yalnız iyimser kilit damgası.
const actionSchema = z.object({
  updatedAt: z.number().int().min(0),
});

type PostRow = typeof post.$inferSelect;

/** Liste/tekil yanıt biçimi: tarihler ms sayısı olarak döner (kilit için geri
 *  gönderilecekleri biçimin aynısı). */
function toMeta(row: PostRow) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    publishedAt: row.publishedAt ? row.publishedAt.getTime() : null,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

/** Oturum sahibinin profil satırı (yalnız id) — her ucun ortak ilk adımı. */
async function ownProfileId(db: ReturnType<typeof createDb>, userId: string) {
  const row = await db.query.profile.findFirst({
    columns: { id: true },
    where: eq(profile.userId, userId),
  });
  return row?.id ?? null;
}

/** D1'in unique kısıt ihlali — slug yarışında ön kontrolü kaçan ikinci yazma
 *  buraya düşer; net bir 409'a çevrilir. */
function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && error.message.includes("UNIQUE constraint failed");
}

export const postApi = new Hono<{ Bindings: Env }>();

// Sahibin yazı listesi (taslaklar dahil — yalnız sahibi görür, R4). Gövde
// listeye girmez: 20 × 50 KB'lık bir yanıt üretmemek için tekil uca bırakılır.
postApi.get("/", async (c) => {
  if (isCrossOriginRequest(c.req.raw)) {
    return c.json({ error: apiText(c.req.raw).origin }, 403);
  }
  const session = await getSession(c.env, c.req.raw);
  if (!session) return c.json({ error: "Oturum gerekli" }, 401);

  const db = createDb(c.env.DB);
  const profileId = await ownProfileId(db, session.user.id);
  if (!profileId) return c.json({ error: apiText(c.req.raw).profileNotFound }, 404);

  const rows = await db
    .select()
    .from(post)
    .where(eq(post.profileId, profileId))
    .orderBy(desc(post.updatedAt));
  return c.json({ posts: rows.map(toMeta) });
});

// Adres uygunluk denetimi — /api/username-check yalnız istek/yanıt biçimi için
// emsaldir, erişim modeli için DEĞİL: bu uç oturum ister ve yalnız sahibin
// kendi profilinde bakar. `?haric=<id>` düzenlenen yazının kendi adresini
// çakışma saymaz. Biçim hataları kimlik olarak döner (Değişmez #5): cümleyi
// editör katalogdan kurar.
postApi.get("/adres-denetim", async (c) => {
  if (isCrossOriginRequest(c.req.raw)) {
    return c.json({ error: apiText(c.req.raw).origin }, 403);
  }
  const session = await getSession(c.env, c.req.raw);
  if (!session) return c.json({ error: "Oturum gerekli" }, 401);

  const result = validatePostSlug(c.req.query("slug") ?? "");
  if (!result.ok) {
    return c.json({ available: false, reason: result.error });
  }
  const db = createDb(c.env.DB);
  const profileId = await ownProfileId(db, session.user.id);
  if (!profileId) return c.json({ error: apiText(c.req.raw).profileNotFound }, 404);

  const exceptId = c.req.query("haric");
  // Benzersizlik taslakları da kapsar (R22); silinen yazının satırı kalmadığı
  // için adresi kendiliğinden yeniden kullanılabilir.
  const clash = await db.query.post.findFirst({
    columns: { id: true },
    where: exceptId
      ? and(eq(post.profileId, profileId), eq(post.slug, result.slug), ne(post.id, exceptId))
      : and(eq(post.profileId, profileId), eq(post.slug, result.slug)),
  });
  return c.json({ available: !clash, slug: result.slug });
});

// Tekil yazı (gövde dahil) — editörün düzenleme ekranı için.
postApi.get("/:id", async (c) => {
  if (isCrossOriginRequest(c.req.raw)) {
    return c.json({ error: apiText(c.req.raw).origin }, 403);
  }
  const session = await getSession(c.env, c.req.raw);
  if (!session) return c.json({ error: "Oturum gerekli" }, 401);

  const db = createDb(c.env.DB);
  const profileId = await ownProfileId(db, session.user.id);
  if (!profileId) return c.json({ error: apiText(c.req.raw).profileNotFound }, 404);

  const row = await db.query.post.findFirst({
    where: and(eq(post.id, c.req.param("id")), eq(post.profileId, profileId)),
  });
  if (!row) return c.json({ error: apiText(c.req.raw).postNotFound }, 404);
  return c.json({ post: { ...toMeta(row), body: row.body } });
});

// Oluştur: yeni yazı her zaman taslak doğar (R4); yayın ayrı bir eylemdir.
postApi.post("/", async (c) => {
  if (!hasSameOrigin(c.req.raw)) {
    return c.json({ error: apiText(c.req.raw).origin }, 403);
  }
  const session = await getSession(c.env, c.req.raw);
  if (!session) return c.json({ error: "Oturum gerekli" }, 401);

  try {
    const body = createSchema.safeParse(await readLimitedJson(c.req.raw, REQUEST_BYTE_LIMIT));
    if (!body.success) {
      return c.json({ error: apiText(c.req.raw).postInvalid, issues: body.error.issues }, 400);
    }
    const slug = validatePostSlug(body.data.slug);
    if (!slug.ok) {
      return c.json({ error: apiText(c.req.raw).postSlugInvalid, reason: slug.error }, 400);
    }
    const bodyCheck = checkPostBody(body.data.body);
    if (!bodyCheck.ok) {
      return c.json(
        {
          error:
            bodyCheck.status === 413
              ? apiText(c.req.raw).postBodyTooLarge
              : apiText(c.req.raw).postBodyInvalid,
          issue: bodyCheck.issue,
        },
        bodyCheck.status,
      );
    }

    const db = createDb(c.env.DB);
    const profileId = await ownProfileId(db, session.user.id);
    if (!profileId) return c.json({ error: apiText(c.req.raw).profileNotFound }, 404);

    // 20 sınırı taslak dahil (R8 + R22): sayım status süzmeden, profilin TÜM
    // yazı satırları üstünden yapılır.
    const [tally] = await db
      .select({ value: count() })
      .from(post)
      .where(eq(post.profileId, profileId));
    if ((tally?.value ?? 0) >= MAX_POSTS_PER_PROFILE) {
      return c.json({ error: apiText(c.req.raw).postLimitReached }, 400);
    }

    // Benzersizlik taslak dahil (R22). Ön kontrol net mesaj için; yarış hâli
    // unique index'e çarpar ve aşağıdaki catch aynı 409'u üretir.
    const clash = await db.query.post.findFirst({
      columns: { id: true },
      where: and(eq(post.profileId, profileId), eq(post.slug, slug.slug)),
    });
    if (clash) return c.json({ error: apiText(c.req.raw).postSlugTaken }, 409);

    try {
      const now = new Date();
      const [created] = await db
        .insert(post)
        .values({
          id: crypto.randomUUID(),
          profileId,
          slug: slug.slug,
          title: body.data.title,
          body: body.data.body,
          status: "draft",
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      return c.json({ post: toMeta(created!) }, 201);
    } catch (error) {
      if (isUniqueViolation(error)) {
        return c.json({ error: apiText(c.req.raw).postSlugTaken }, 409);
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && error.message === "body_too_large") {
      return c.json({ error: apiText(c.req.raw).postTooLarge }, 413);
    }
    return c.json({ error: apiText(c.req.raw).postSaveFailed }, 400);
  }
});

// Güncelle: tam belge + iyimser kilit. R18 adres kilidi buradadır:
// `publishedAt` bir kez dolduysa slug değişikliği reddedilir — taslağa dönüş
// kilidi KALDIRMAZ, çünkü paylaşılmış bağlantı yazı taslaktayken de sahiplidir.
postApi.put("/:id", async (c) => {
  if (!hasSameOrigin(c.req.raw)) {
    return c.json({ error: apiText(c.req.raw).origin }, 403);
  }
  const session = await getSession(c.env, c.req.raw);
  if (!session) return c.json({ error: "Oturum gerekli" }, 401);

  try {
    const body = updateSchema.safeParse(await readLimitedJson(c.req.raw, REQUEST_BYTE_LIMIT));
    if (!body.success) {
      return c.json({ error: apiText(c.req.raw).postInvalid, issues: body.error.issues }, 400);
    }
    const slug = validatePostSlug(body.data.slug);
    if (!slug.ok) {
      return c.json({ error: apiText(c.req.raw).postSlugInvalid, reason: slug.error }, 400);
    }
    const bodyCheck = checkPostBody(body.data.body);
    if (!bodyCheck.ok) {
      return c.json(
        {
          error:
            bodyCheck.status === 413
              ? apiText(c.req.raw).postBodyTooLarge
              : apiText(c.req.raw).postBodyInvalid,
          issue: bodyCheck.issue,
        },
        bodyCheck.status,
      );
    }

    const db = createDb(c.env.DB);
    const profileId = await ownProfileId(db, session.user.id);
    if (!profileId) return c.json({ error: apiText(c.req.raw).profileNotFound }, 404);

    const current = await db.query.post.findFirst({
      where: and(eq(post.id, c.req.param("id")), eq(post.profileId, profileId)),
    });
    if (!current) return c.json({ error: apiText(c.req.raw).postNotFound }, 404);

    // R18: yayınlanmış (veya yayınlanıp taslağa alınmış) yazının adresi sabit.
    if (current.publishedAt !== null && slug.slug !== current.slug) {
      return c.json({ error: apiText(c.req.raw).postSlugLocked }, 400);
    }
    // Adres değişiyorsa yeni adres profil içinde boşta olmalı (taslak dahil).
    if (slug.slug !== current.slug) {
      const clash = await db.query.post.findFirst({
        columns: { id: true },
        where: and(eq(post.profileId, profileId), eq(post.slug, slug.slug)),
      });
      if (clash) return c.json({ error: apiText(c.req.raw).postSlugTaken }, 409);
    }

    try {
      // İyimser kilit: where'e istemcinin gördüğü updatedAt da girer; satır bu
      // arada değiştiyse 0 satır döner → 409. Yukarıdaki okuma yalnız 404/R18
      // ayrımı içindir, yarışın hakemi bu koşullu yazmadır.
      const updated = await db
        .update(post)
        .set({
          slug: slug.slug,
          title: body.data.title,
          body: body.data.body,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(post.id, current.id),
            eq(post.profileId, profileId),
            eq(post.updatedAt, new Date(body.data.updatedAt)),
          ),
        )
        .returning();
      if (!updated.length) {
        return c.json({ error: apiText(c.req.raw).postConflict }, 409);
      }
      return c.json({ post: toMeta(updated[0]!) });
    } catch (error) {
      if (isUniqueViolation(error)) {
        return c.json({ error: apiText(c.req.raw).postSlugTaken }, 409);
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && error.message === "body_too_large") {
      return c.json({ error: apiText(c.req.raw).postTooLarge }, 413);
    }
    return c.json({ error: apiText(c.req.raw).postSaveFailed }, 400);
  }
});

// Yayınla: durum `published` olur; `publishedAt` yalnız İLK yayında dolar ve
// bir daha asla yazılmaz — adres kilidinin (R18) dayanağı bu alandır.
postApi.post("/:id/yayinla", async (c) => {
  if (!hasSameOrigin(c.req.raw)) {
    return c.json({ error: apiText(c.req.raw).origin }, 403);
  }
  const session = await getSession(c.env, c.req.raw);
  if (!session) return c.json({ error: "Oturum gerekli" }, 401);

  try {
    const body = actionSchema.safeParse(await readLimitedJson(c.req.raw, 4 * 1024));
    if (!body.success) {
      return c.json({ error: apiText(c.req.raw).requestInvalid }, 400);
    }
    const db = createDb(c.env.DB);
    const profileId = await ownProfileId(db, session.user.id);
    if (!profileId) return c.json({ error: apiText(c.req.raw).profileNotFound }, 404);

    const current = await db.query.post.findFirst({
      columns: { id: true, publishedAt: true },
      where: and(eq(post.id, c.req.param("id")), eq(post.profileId, profileId)),
    });
    if (!current) return c.json({ error: apiText(c.req.raw).postNotFound }, 404);

    const updated = await db
      .update(post)
      .set({
        status: "published",
        publishedAt: current.publishedAt ?? new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(post.id, current.id),
          eq(post.profileId, profileId),
          eq(post.updatedAt, new Date(body.data.updatedAt)),
        ),
      )
      .returning();
    if (!updated.length) {
      return c.json({ error: apiText(c.req.raw).postConflict }, 409);
    }
    return c.json({ post: toMeta(updated[0]!) });
  } catch (error) {
    if (error instanceof Error && error.message === "body_too_large") {
      return c.json({ error: apiText(c.req.raw).requestTooLarge }, 413);
    }
    return c.json({ error: apiText(c.req.raw).postSaveFailed }, 400);
  }
});

// Taslağa al: durum döner ama `publishedAt`e DOKUNULMAZ — kilit kalıcıdır
// (R18) ve ziyaretçi bu andan itibaren 404 alır (R4, U5'in işi).
postApi.post("/:id/taslak", async (c) => {
  if (!hasSameOrigin(c.req.raw)) {
    return c.json({ error: apiText(c.req.raw).origin }, 403);
  }
  const session = await getSession(c.env, c.req.raw);
  if (!session) return c.json({ error: "Oturum gerekli" }, 401);

  try {
    const body = actionSchema.safeParse(await readLimitedJson(c.req.raw, 4 * 1024));
    if (!body.success) {
      return c.json({ error: apiText(c.req.raw).requestInvalid }, 400);
    }
    const db = createDb(c.env.DB);
    const profileId = await ownProfileId(db, session.user.id);
    if (!profileId) return c.json({ error: apiText(c.req.raw).profileNotFound }, 404);

    const current = await db.query.post.findFirst({
      columns: { id: true },
      where: and(eq(post.id, c.req.param("id")), eq(post.profileId, profileId)),
    });
    if (!current) return c.json({ error: apiText(c.req.raw).postNotFound }, 404);

    const updated = await db
      .update(post)
      .set({ status: "draft", updatedAt: new Date() })
      .where(
        and(
          eq(post.id, current.id),
          eq(post.profileId, profileId),
          eq(post.updatedAt, new Date(body.data.updatedAt)),
        ),
      )
      .returning();
    if (!updated.length) {
      return c.json({ error: apiText(c.req.raw).postConflict }, 409);
    }
    return c.json({ post: toMeta(updated[0]!) });
  } catch (error) {
    if (error instanceof Error && error.message === "body_too_large") {
      return c.json({ error: apiText(c.req.raw).requestTooLarge }, 413);
    }
    return c.json({ error: apiText(c.req.raw).postSaveFailed }, 400);
  }
});

// Sil: satır kalkınca adres aynı profilde yeniden kullanılabilir (R22) —
// unique index satırla birlikte boşalır, ek bir kilit tablosu yoktur.
// Gövde taşımadığı için iyimser kilit de yoktur; silme idempotent bir niyettir.
postApi.delete("/:id", async (c) => {
  if (!hasSameOrigin(c.req.raw)) {
    return c.json({ error: apiText(c.req.raw).origin }, 403);
  }
  const session = await getSession(c.env, c.req.raw);
  if (!session) return c.json({ error: "Oturum gerekli" }, 401);

  const db = createDb(c.env.DB);
  const profileId = await ownProfileId(db, session.user.id);
  if (!profileId) return c.json({ error: apiText(c.req.raw).profileNotFound }, 404);

  const deleted = await db
    .delete(post)
    .where(and(eq(post.id, c.req.param("id")), eq(post.profileId, profileId)))
    .returning({ id: post.id });
  if (!deleted.length) return c.json({ error: apiText(c.req.raw).postNotFound }, 404);
  return c.json({ ok: true });
});
