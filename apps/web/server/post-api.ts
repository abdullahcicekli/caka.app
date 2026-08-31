import { and, count, desc, eq, ne, sql } from "drizzle-orm";
import { Hono, type Context } from "hono";
import { z } from "zod";

import { createDb, post, profile } from "@caka/db";
import {
  MAX_POSTS_PER_PROFILE,
  POST_BODY_MAX_BYTES,
  POST_TITLE_MAX,
  type PostStatus,
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

type PostApiContext = Context<{ Bindings: Env }>;
type ApiText = ReturnType<typeof apiText>;
type PostSession = NonNullable<Awaited<ReturnType<typeof getSession>>>;

/**
 * Her ucun ortak ilk adımı: köken kapısı + oturum. Okuyan uçlar
 * `isCrossOriginRequest`, yazanlar `hasSameOrigin` kullanır — gerekçe
 * `server/request.ts`'te: tarayıcı aynı köken GET'inde `Origin` GÖNDERMEZ,
 * bu yüzden okuma tarafında kural tersine çevrilir.
 *
 * Geçerse oturumu ve isteğin dilindeki metinleri, geçmezse hazır yanıtı
 * döner (çağıran `instanceof Response` ile ayırır).
 */
async function openGate(
  c: PostApiContext,
  kind: "read" | "write",
): Promise<{ session: PostSession; text: ApiText } | Response> {
  const text = apiText(c.req.raw);
  const blocked =
    kind === "read" ? isCrossOriginRequest(c.req.raw) : !hasSameOrigin(c.req.raw);
  if (blocked) return c.json({ error: text.origin }, 403);
  const session = await getSession(c.env, c.req.raw);
  if (!session) return c.json({ error: "Oturum gerekli" }, 401);
  return { session, text };
}

// Zarf sınırı DoS bekçisidir, 50 KB kuralının hakemi DEĞİL: gövde JSON
// zarfına gömülürken kaçış karakterleri (tırnak, ters bölü, satır sonu)
// baytları şişirir — kod bloğu ağırlıklı bir yazı ham hâliyle sınırın
// altındayken zarfı aşabilirdi. Gerçek 50 KB kuralını `validatePostDoc`
// kanonik ölçümle uygular; zarf payı bu yüzden iki katı + sabit pay.
const REQUEST_BYTE_LIMIT = POST_BODY_MAX_BYTES * 2 + 8 * 1024;

// Gövde (body) serileştirilmiş JSON metni olarak taşınır — DB kolonu da metin.
// Doğrulama `validatePostDoc` (R6/R7/R9): boyut, düğüm/mark izin listesi ve
// birinci taraf görsel kaynağı tek kaynaktan denetlenir; izin dışı düğüm
// sessizce düşmez, kimlikli hatayla reddedilir.

/**
 * Gövdeyi ayrıştırıp postDoc şemasından geçirir. Sorun varsa hazır hata
 * yanıtını (413 = 50 KB aşımı, 400 = biçim/izin listesi), temizse null döner.
 */
function postBodyError(c: PostApiContext, text: ApiText, raw: string): Response | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return c.json({ error: text.postBodyInvalid, issue: "invalid_doc" }, 400);
  }
  const doc = validatePostDoc(parsed);
  if (doc.ok) return null;
  if (doc.issue === "body_too_large") {
    return c.json({ error: text.postBodyTooLarge, issue: doc.issue }, 413);
  }
  return c.json({ error: text.postBodyInvalid, issue: doc.issue }, 400);
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

/** Yanıt biçimi gövdeyi taşımaz; liste sorgusu da gövdesiz satır okur. */
type PostMetaRow = Omit<typeof post.$inferSelect, "body">;

/** Liste/tekil yanıt biçimi: tarihler ms sayısı olarak döner (kilit için geri
 *  gönderilecekleri biçimin aynısı). */
function toMeta(row: PostMetaRow) {
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
  const gate = await openGate(c, "read");
  if (gate instanceof Response) return gate;
  const { session, text } = gate;

  const db = createDb(c.env.DB);
  const profileId = await ownProfileId(db, session.user.id);
  if (!profileId) return c.json({ error: text.profileNotFound }, 404);

  const rows = await db.query.post.findMany({
    columns: { body: false },
    where: eq(post.profileId, profileId),
    orderBy: desc(post.updatedAt),
  });
  return c.json({ posts: rows.map(toMeta) });
});

// Adres uygunluk denetimi — /api/username-check yalnız istek/yanıt biçimi için
// emsaldir, erişim modeli için DEĞİL: bu uç oturum ister ve yalnız sahibin
// kendi profilinde bakar. `?haric=<id>` düzenlenen yazının kendi adresini
// çakışma saymaz. Biçim hataları kimlik olarak döner (Değişmez #5): cümleyi
// editör katalogdan kurar.
postApi.get("/adres-denetim", async (c) => {
  const gate = await openGate(c, "read");
  if (gate instanceof Response) return gate;
  const { session, text } = gate;

  const result = validatePostSlug(c.req.query("slug") ?? "");
  if (!result.ok) {
    return c.json({ available: false, reason: result.error });
  }
  const db = createDb(c.env.DB);
  const profileId = await ownProfileId(db, session.user.id);
  if (!profileId) return c.json({ error: text.profileNotFound }, 404);

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
  const gate = await openGate(c, "read");
  if (gate instanceof Response) return gate;
  const { session, text } = gate;

  const db = createDb(c.env.DB);
  const profileId = await ownProfileId(db, session.user.id);
  if (!profileId) return c.json({ error: text.profileNotFound }, 404);

  const row = await db.query.post.findFirst({
    where: and(eq(post.id, c.req.param("id")), eq(post.profileId, profileId)),
  });
  if (!row) return c.json({ error: text.postNotFound }, 404);
  return c.json({ post: { ...toMeta(row), body: row.body } });
});

// Oluştur: yeni yazı her zaman taslak doğar (R4); yayın ayrı bir eylemdir.
postApi.post("/", async (c) => {
  const gate = await openGate(c, "write");
  if (gate instanceof Response) return gate;
  const { session, text } = gate;

  try {
    const body = createSchema.safeParse(await readLimitedJson(c.req.raw, REQUEST_BYTE_LIMIT));
    if (!body.success) {
      return c.json({ error: text.postInvalid, issues: body.error.issues }, 400);
    }
    const slug = validatePostSlug(body.data.slug);
    if (!slug.ok) {
      return c.json({ error: text.postSlugInvalid, reason: slug.error }, 400);
    }
    const bodyError = postBodyError(c, text, body.data.body);
    if (bodyError) return bodyError;

    const db = createDb(c.env.DB);
    const profileId = await ownProfileId(db, session.user.id);
    if (!profileId) return c.json({ error: text.profileNotFound }, 404);

    // Benzersizlik taslak dahil (R22). Ön kontrol net mesaj için; yarış hâli
    // unique index'e çarpar ve aşağıdaki catch aynı 409'u üretir.
    const clash = await db.query.post.findFirst({
      columns: { id: true },
      where: and(eq(post.profileId, profileId), eq(post.slug, slug.slug)),
    });
    if (clash) return c.json({ error: text.postSlugTaken, issue: "slug_taken" }, 409);

    try {
      // 20 sınırı taslak dahil (R8 + R22) ve SQLite tarafında ATOMİK: ayrı
      // isolate'lardaki iki eşzamanlı istek "say → ekle" arasında birbirini
      // göremezdi; koşullu INSERT ... SELECT sayımı ve eklemeyi tek deyimde
      // yapar, sınırı aşan ekleme 0 satır değiştirir.
      const id = crypto.randomUUID();
      const nowMs = Date.now();
      const result = await db.run(sql`
        INSERT INTO post (id, profile_id, slug, title, body, status, published_at, created_at, updated_at)
        SELECT ${id}, ${profileId}, ${slug.slug}, ${body.data.title}, ${body.data.body}, 'draft', NULL, ${nowMs}, ${nowMs}
        WHERE (SELECT COUNT(*) FROM post WHERE profile_id = ${profileId}) < ${MAX_POSTS_PER_PROFILE}
      `);
      if (((result as { meta?: { changes?: number } }).meta?.changes ?? 0) === 0) {
        return c.json({ error: text.postLimitReached }, 400);
      }
      const created = await db.query.post.findFirst({
        columns: { body: false },
        where: eq(post.id, id),
      });
      if (!created) return c.json({ error: text.postSaveFailed }, 500);
      return c.json({ post: toMeta(created) }, 201);
    } catch (error) {
      if (isUniqueViolation(error)) {
        return c.json({ error: text.postSlugTaken, issue: "slug_taken" }, 409);
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && error.message === "body_too_large") {
      return c.json({ error: text.postTooLarge }, 413);
    }
    // Sunucu hatası istemci hatası gibi sunulmaz: 400 yerine 500 — izleme
    // 5xx görür, editör de "girdin hatalı" diye yanlış teşhis koymaz.
    console.error(JSON.stringify({ message: "post api: create failed", error: String(error) }));
    return c.json({ error: text.postSaveFailed }, 500);
  }
});

// Güncelle: tam belge + iyimser kilit. R18 adres kilidi buradadır:
// `publishedAt` bir kez dolduysa slug değişikliği reddedilir — taslağa dönüş
// kilidi KALDIRMAZ, çünkü paylaşılmış bağlantı yazı taslaktayken de sahiplidir.
postApi.put("/:id", async (c) => {
  const gate = await openGate(c, "write");
  if (gate instanceof Response) return gate;
  const { session, text } = gate;

  try {
    const body = updateSchema.safeParse(await readLimitedJson(c.req.raw, REQUEST_BYTE_LIMIT));
    if (!body.success) {
      return c.json({ error: text.postInvalid, issues: body.error.issues }, 400);
    }
    const slug = validatePostSlug(body.data.slug);
    if (!slug.ok) {
      return c.json({ error: text.postSlugInvalid, reason: slug.error }, 400);
    }
    const bodyError = postBodyError(c, text, body.data.body);
    if (bodyError) return bodyError;

    const db = createDb(c.env.DB);
    const profileId = await ownProfileId(db, session.user.id);
    if (!profileId) return c.json({ error: text.profileNotFound }, 404);

    const current = await db.query.post.findFirst({
      // Gövde okunmaz: bu satır yalnız 404 ve R18/çakışma ayrımı için.
      columns: { id: true, slug: true, publishedAt: true },
      where: and(eq(post.id, c.req.param("id")), eq(post.profileId, profileId)),
    });
    if (!current) return c.json({ error: text.postNotFound }, 404);

    // R18: yayınlanmış (veya yayınlanıp taslağa alınmış) yazının adresi sabit.
    if (current.publishedAt !== null && slug.slug !== current.slug) {
      return c.json({ error: text.postSlugLocked }, 400);
    }
    // Adres değişiyorsa yeni adres profil içinde boşta olmalı (taslak dahil).
    if (slug.slug !== current.slug) {
      const clash = await db.query.post.findFirst({
        columns: { id: true },
        where: and(eq(post.profileId, profileId), eq(post.slug, slug.slug)),
      });
      if (clash) return c.json({ error: text.postSlugTaken, issue: "slug_taken" }, 409);
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
        // İyimser kilit 409'u ile "adres dolu" 409'u istemcide AYNI koddan
        // ayrışamaz; makine-okur `issue` alanı bu yüzden var — istemci slug
        // karşılaştırarak tahmin yürütmez.
        return c.json({ error: text.postConflict, issue: "conflict" }, 409);
      }
      return c.json({ post: toMeta(updated[0]!) });
    } catch (error) {
      if (isUniqueViolation(error)) {
        return c.json({ error: text.postSlugTaken, issue: "slug_taken" }, 409);
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && error.message === "body_too_large") {
      return c.json({ error: text.postTooLarge }, 413);
    }
    console.error(JSON.stringify({ message: "post api: update failed", error: String(error) }));
    return c.json({ error: text.postSaveFailed }, 500);
  }
});

/**
 * Yayınla / taslağa al ortak gövdesi: iki uç yalnız YAZDIKLARI DURUMDA
 * ayrışır, gerisi (kapı, iyimser kilit, hata eşlemesi) aynıdır.
 *
 * `publishedAt` yalnız İLK yayında dolar ve bir daha asla yazılmaz — adres
 * kilidinin (R18) dayanağı bu alandır. Taslağa alma ona DOKUNMAZ; kilit
 * kalıcıdır ve ziyaretçi o andan itibaren 404 alır (R4, U5'in işi).
 */
async function changeStatus(
  c: PostApiContext,
  postId: string,
  next: PostStatus,
): Promise<Response> {
  const gate = await openGate(c, "write");
  if (gate instanceof Response) return gate;
  const { session, text } = gate;

  try {
    const body = actionSchema.safeParse(await readLimitedJson(c.req.raw, 4 * 1024));
    if (!body.success) {
      return c.json({ error: text.requestInvalid }, 400);
    }
    const db = createDb(c.env.DB);
    const profileId = await ownProfileId(db, session.user.id);
    if (!profileId) return c.json({ error: text.profileNotFound }, 404);

    const current = await db.query.post.findFirst({
      columns: { id: true, publishedAt: true },
      where: and(eq(post.id, postId), eq(post.profileId, profileId)),
    });
    if (!current) return c.json({ error: text.postNotFound }, 404);

    const updated = await db
      .update(post)
      .set({
        status: next,
        ...(next === "published"
          ? { publishedAt: current.publishedAt ?? new Date() }
          : {}),
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
      return c.json({ error: text.postConflict, issue: "conflict" }, 409);
    }
    return c.json({ post: toMeta(updated[0]!) });
  } catch (error) {
    if (error instanceof Error && error.message === "body_too_large") {
      return c.json({ error: text.requestTooLarge }, 413);
    }
    console.error(JSON.stringify({ message: "post api: status change failed", error: String(error) }));
    return c.json({ error: text.postSaveFailed }, 500);
  }
}

postApi.post("/:id/yayinla", (c) => changeStatus(c, c.req.param("id"), "published"));
postApi.post("/:id/taslak", (c) => changeStatus(c, c.req.param("id"), "draft"));

// Sil: satır kalkınca adres aynı profilde yeniden kullanılabilir (R22) —
// unique index satırla birlikte boşalır, ek bir kilit tablosu yoktur.
// Gövde taşımadığı için iyimser kilit de yoktur; silme idempotent bir niyettir.
postApi.delete("/:id", async (c) => {
  const gate = await openGate(c, "write");
  if (gate instanceof Response) return gate;
  const { session, text } = gate;

  const db = createDb(c.env.DB);
  const profileId = await ownProfileId(db, session.user.id);
  if (!profileId) return c.json({ error: text.profileNotFound }, 404);

  const deleted = await db
    .delete(post)
    .where(and(eq(post.id, c.req.param("id")), eq(post.profileId, profileId)))
    .returning({ id: post.id });
  if (!deleted.length) return c.json({ error: text.postNotFound }, 404);
  return c.json({ ok: true });
});
