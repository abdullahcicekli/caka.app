// Tuval bloklarının yazı beslemesi (U6): profil sayfası, panel önizlemesi ve
// editör aynı sorgudan okur ki üçü ayrışmasın. Yazı CRUD'u `post-api.ts`'te;
// burası yalnız render için gereken ince listeyi çeker (gövde İNMEZ — 20 ×
// 50 KB'lık bir yanıt üretmemek için, post-api listesiyle aynı gerekçe).
import { and, desc, eq } from "drizzle-orm";

import { createDb, post } from "@caka/db";

/** Tuval kartlarının çizdiği yayınlanmış yazı satırı. */
export interface PublishedPostCard {
  id: string;
  slug: string;
  title: string;
  /** İlk yayın anı (ms) — liste bu alana göre en yeniden eskiye sıralı. */
  publishedAt: number;
}

/**
 * Profilin YAYINDAKİ yazıları, en yeniden eskiye (R10/AE7: sorgu her sayfa
 * görüntülemesinde koşar, yeni yayın tuval yeniden yayınlanmadan listeye
 * düşer). `publishedAt` yayında olan satırda hep doludur; `?? 0` yalnız tip
 * daraltması için.
 */
export async function getPublishedPostCards(
  env: Env,
  profileId: string,
): Promise<PublishedPostCard[]> {
  const db = createDb(env.DB);
  const rows = await db
    .select({
      id: post.id,
      slug: post.slug,
      title: post.title,
      publishedAt: post.publishedAt,
    })
    .from(post)
    .where(and(eq(post.profileId, profileId), eq(post.status, "published")))
    .orderBy(desc(post.publishedAt));
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    publishedAt: row.publishedAt ? row.publishedAt.getTime() : 0,
  }));
}

/** Editörün öne çıkan seçicisi ve yazı listesi için sahibin TÜM yazıları
 *  (taslaklar dahil). */
export interface OwnPostOption {
  id: string;
  slug: string;
  title: string;
  status: string;
  publishedAt: number | null;
  /** Son dokunuş (ms) — liste sayfası taslakların tarihini bundan yazar. */
  updatedAt: number;
}

/** Sahibin yazıları, son dokunulan en üstte (post-api listesiyle aynı sıra). */
export async function getOwnPostOptions(env: Env, profileId: string): Promise<OwnPostOption[]> {
  const db = createDb(env.DB);
  const rows = await db
    .select({
      id: post.id,
      slug: post.slug,
      title: post.title,
      status: post.status,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
    })
    .from(post)
    .where(eq(post.profileId, profileId))
    .orderBy(desc(post.updatedAt));
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    publishedAt: row.publishedAt ? row.publishedAt.getTime() : null,
    updatedAt: row.updatedAt.getTime(),
  }));
}

/** Editör ekranının açılış okuması: sahibin TEK yazısı, gövde dahil (U7).
 *  Yazma/CRUD hâlâ `post-api.ts`'tedir; bu yalnız SSR açılış okumasıdır ve
 *  tarihleri API ile aynı biçimde (ms) döner ki iyimser kilit damgası
 *  doğrudan geri gönderilebilsin. */
export interface OwnPostFull extends OwnPostOption {
  body: string;
}

export async function getOwnPostFull(
  env: Env,
  profileId: string,
  postId: string,
): Promise<OwnPostFull | null> {
  const db = createDb(env.DB);
  const row = await db.query.post.findFirst({
    where: and(eq(post.id, postId), eq(post.profileId, profileId)),
  });
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    publishedAt: row.publishedAt ? row.publishedAt.getTime() : null,
    updatedAt: row.updatedAt.getTime(),
    body: row.body,
  };
}
