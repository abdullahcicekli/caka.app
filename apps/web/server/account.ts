// Self-servis hesap silme (KVKK m.7 / m.11-e, GDPR m.17).
//
// Silme ANINDA ve GERİ DÖNÜŞSÜZDÜR: "silinecek" işareti, geri alma penceresi
// veya arşiv kopyası yok. Bunun sebebi hem `/gizlilik` §7'deki "sen silene
// kadar" vaadi hem de basitlik: soft-delete her okuma yoluna bir filtre borcu
// yazar ve unutulan tek bir yol, silinmiş sanılan profili yayında bırakır.
//
// Adres 30 gün kilitli kalır: `username_redirect`'e HEDEFSİZ (profileId NULL)
// bir kilit satırı yazılır. Bastırılmış QR kodları ve kartvizitler bu süre
// boyunca bir yabancının sayfasına düşmez; kilit dolunca ad serbest kalır.
// Şemadaki gerekçe için bkz. `packages/db/src/schema.ts`.
import { eq, inArray } from "drizzle-orm";

import {
  account,
  asset,
  createDb,
  githubCalendar,
  linkClickDaily,
  profile,
  profileViewDaily,
  session,
  user,
  usernameRedirect,
} from "@caka/db";
import {
  normalizeUsername,
  parseProfileLayout,
  usernameRedirectExpiresAt,
} from "@caka/shared";

import { collectGithubLogins } from "./github";

export type DeleteAccountError = "no_profile" | "mismatch";

export type DeleteAccountCheck =
  | { ok: true; username: string }
  | { ok: false; error: DeleteAccountError };

/** R2 `delete` çağrısı başına anahtar sınırı. */
const R2_DELETE_BATCH = 1000;

/**
 * Onay doğrulaması: kullanıcı kendi adresini birebir yazmış mı.
 *
 * Silmeden AYRI durur çünkü route önce bunu çağırıp kullanıcıyı yalnız onay
 * tuttuğunda çıkışa gönderir; yazım hatası yapan biri oturumunu kaybetmez.
 * `deleteAccount` yine de aynı kontrolü kendi içinde tekrarlar — yetki kararı
 * çağıranın dikkatine bırakılmaz.
 */
export async function checkDeleteAccount(
  env: Env,
  userId: string,
  confirmation: string,
): Promise<DeleteAccountCheck> {
  const row = await createDb(env.DB).query.profile.findFirst({
    columns: { username: true },
    where: eq(profile.userId, userId),
  });
  if (!row) return { ok: false, error: "no_profile" };
  if (normalizeUsername(confirmation) !== row.username) {
    return { ok: false, error: "mismatch" };
  }
  return { ok: true, username: row.username };
}

/**
 * Hesabı ve ona bağlı her şeyi siler. Sıra önemlidir:
 *
 *  1. **D1 tek batch** (tek işlem) — yarım silinmiş bir hesap kalmaz.
 *  2. **R2 nesneleri** — batch'ten SONRA. Ters sırada D1 yazması patlarsa
 *     hesap ayakta ama görselleri 404 verir; bu sırada ise en kötü ihtimalle
 *     referanssız birkaç nesne kalır ve anahtarları loglanır (UUID, PII değil).
 *
 * `github_calendar` satırları da temizlenir (backlog #3): kayıt global bir
 * önbellektir, aynı login'i gösteren başka bir profil varsa satır yeniden
 * çekilir — kayıp yok, gereksiz saklama var.
 */
export async function deleteAccount(
  env: Env,
  userId: string,
  confirmation: string,
  now = new Date(),
): Promise<DeleteAccountCheck> {
  const db = createDb(env.DB);
  const row = await db.query.profile.findFirst({
    columns: { id: true, username: true, layout: true },
    where: eq(profile.userId, userId),
  });
  if (!row) return { ok: false, error: "no_profile" };
  if (normalizeUsername(confirmation) !== row.username) {
    return { ok: false, error: "mismatch" };
  }

  const assets = await db.query.asset.findMany({
    columns: { id: true },
    where: eq(asset.userId, userId),
  });
  const layout = parseProfileLayout(row.layout);
  const logins = layout ? collectGithubLogins(layout) : [];
  const lockExpiresAt = usernameRedirectExpiresAt(now);

  await db.batch([
    // Kullanıcının ESKİ adresleri: kilitleri hedefsiz kalır. Profil satırı
    // silinince FK `set null` zaten aynı sonucu verirdi; burada açıkça yazmak
    // silmeyi FK davranışına bağımlı olmaktan kurtarır.
    db
      .update(usernameRedirect)
      .set({ profileId: null })
      .where(eq(usernameRedirect.profileId, row.id)),
    // Yürürlükteki adres için yeni kilit. Ad daha önce (süresi dolmuş) bir
    // kayıt bırakmış olabilir; o satır bu kilide taşınır.
    db
      .insert(usernameRedirect)
      .values({
        oldUsername: row.username,
        profileId: null,
        expiresAt: lockExpiresAt,
        createdAt: now,
      })
      .onConflictDoUpdate({
        target: usernameRedirect.oldUsername,
        set: { profileId: null, expiresAt: lockExpiresAt, createdAt: now },
      }),
    db.delete(profileViewDaily).where(eq(profileViewDaily.profileId, row.id)),
    db.delete(linkClickDaily).where(eq(linkClickDaily.profileId, row.id)),
    db.delete(asset).where(eq(asset.userId, userId)),
    db.delete(profile).where(eq(profile.userId, userId)),
    db.delete(session).where(eq(session.userId, userId)),
    db.delete(account).where(eq(account.userId, userId)),
    db.delete(user).where(eq(user.id, userId)),
  ]);

  if (logins.length > 0) {
    // Batch dışında: bu tablo kullanıcıya ait değil, global önbellek. Hata
    // vermesi silmeyi geri almamalı.
    try {
      await db.delete(githubCalendar).where(inArray(githubCalendar.login, logins));
    } catch (error) {
      console.error(
        JSON.stringify({ message: "account delete: github cache cleanup failed", error: String(error) }),
      );
    }
  }

  if (assets.length > 0) {
    const keys = assets.map((item) => item.id);
    for (let index = 0; index < keys.length; index += R2_DELETE_BATCH) {
      const chunk = keys.slice(index, index + R2_DELETE_BATCH);
      try {
        await env.BUCKET.delete(chunk);
      } catch (error) {
        // Yetim nesne kaldı: anahtarlar elle temizlenebilsin diye loglanır.
        // `asset.id` düz UUID'dir (Değişmez #9), kişisel veri taşımaz.
        console.error(
          JSON.stringify({
            message: "account delete: r2 cleanup failed",
            keys: chunk,
            error: String(error),
          }),
        );
      }
    }
  }

  return { ok: true, username: row.username };
}
