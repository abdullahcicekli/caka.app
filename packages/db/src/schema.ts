import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth-schema";

export * from "./auth-schema";

const timestampMs = (name: string) =>
  integer(name, { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull();

/**
 * Kullanıcının tek profili (MVP: 1-1). `username` normalize edilmiş lowercase
 * tek kolondur (KTD9); benzersizlik bu unique kısıttan gelir. `layout` tam
 * doküman JSON'u, `version` eşzamanlı yazma tespiti içindir (KTD5/R8).
 */
export const profile = sqliteTable(
  "profile",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    username: text("username").notNull().unique(),
    theme: text("theme").notNull().default("light"),
    // og:image şablonu (paylaşım görseli yerleşimi); geçerli değerler
    // @caka/shared `ogTemplateSchema`'da, okurken normalizeOgTemplate uygulanır.
    ogTemplate: text("og_template").notNull().default("p1"),
    // Paylaşım görseli fotoğraf kaynağı: null = avatar (varsayılan); dolu =
    // layout'taki bu assetId'li görsel bloğu. Asset artık layout'ta yoksa
    // okuma sırasında sessizce avatara düşülür (resolveOgPhotoAssetId).
    ogPhotoAssetId: text("og_photo_asset_id"),
    layout: text("layout").notNull(),
    // Taslak/yayınla modeli: editör taslağa yazar, "yayınla" layout/theme'e
    // kopyalar. null = bekleyen taslak yok (yayınlanmış hâl güncel).
    draftLayout: text("draft_layout"),
    draftTheme: text("draft_theme"),
    version: integer("version").notNull().default(1),
    onboardingData: text("onboarding_data").notNull().default("{}"),
    onboardingCompletedAt: integer("onboarding_completed_at", {
      mode: "timestamp_ms",
    }),
    usernameChangedAt: integer("username_changed_at", { mode: "timestamp_ms" }),
    createdAt: timestampMs("created_at"),
    updatedAt: timestampMs("updated_at"),
  },
);

/**
 * Adres değişikliği devri (R18, OQ1 kararı: 30 gün 302 + eski ad kilitli).
 * Süresi geçen kayıtlar lookup'ta yok sayılır ve ad serbest kalır.
 */
export const usernameRedirect = sqliteTable(
  "username_redirect",
  {
    oldUsername: text("old_username").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: timestampMs("created_at"),
  },
  (table) => [index("username_redirect_profile_idx").on(table.profileId)],
);

/**
 * GitHub katkı takvimi önbelleği. Login başına TEK global kayıt: Cache API
 * colo-başına çalıştığı için bilerek D1 seçildi — GitHub token bütçesi kolo
 * sayısıyla çarpılmaz. `payload` normalize edilmiş takvim JSON'u; kullanıcı
 * yoksa null (negatif önbellek). `fetchedAt` başarılı/başarısız son deneme
 * zamanıdır; bayatlık eşiği uygulama katmanındadır (server/github.ts).
 */
export const githubCalendar = sqliteTable("github_calendar", {
  /** Küçük harfe normalize edilmiş GitHub login'i */
  login: text("login").primaryKey(),
  payload: text("payload"),
  fetchedAt: timestampMs("fetched_at"),
});

/**
 * R2 nesne envanteri (R16/R17). `id` aynı zamanda düz R2 anahtarıdır (KTD10).
 * Temizlik yalnızca hesap silmede; kayıt sırasında diff/silme yapılmaz.
 */
export const asset = sqliteTable(
  "asset",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    contentType: text("content_type").notNull(),
    size: integer("size").notNull(),
    createdAt: timestampMs("created_at"),
  },
  (table) => [index("asset_user_idx").on(table.userId)],
);

/**
 * Panel analitiği — profil görüntülenmesi (R48).
 *
 * Olay başına satır DEĞİL, gün+ülke başına sayaçtır: yazma anında
 * toplulaştırılır (`ON CONFLICT ... views = views + 1`). Bunun iki nedeni var:
 * (a) satır sayısı profil × gün × ülke ile sınırlı kalır, gecelik toplulaştırma
 * cron'una gerek kalmaz; (b) olay düzeyinde zaman damgası hiç yazılmadığı için
 * tek bir ziyaretin izi diskte oluşmaz — ziyaret sırası geri kurulamaz.
 *
 * `country` yalnızca `request.cf.country`dir; ham IP hiçbir yerde saklanmaz,
 * hash'lenmez, türev üretilmez (KD1'in birinci koşulu). Ülkesi çözülemeyen
 * istekler `XX` kovasına düşer. Tekil ziyaretçi metriği yoktur (OQ6) — cihaza
 * yazmadan üretilemezdi.
 */
export const profileViewDaily = sqliteTable(
  "profile_view_daily",
  {
    profileId: text("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    /** Türkiye günü (`YYYY-MM-DD`, sabit UTC+3 — bkz. @caka/shared dayKey) */
    day: text("day").notNull(),
    /** ISO 3166-1 alpha-2 veya `XX` */
    country: text("country").notNull(),
    views: integer("views").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.profileId, table.day, table.country] }),
  ],
);

/**
 * Panel analitiği — bağlantı tıklaması (R48). Ölçüm kimliği blok id'sidir:
 * adres değişse de seri kopmaz. Ülke kırılımı bilinçli olarak yoktur —
 * tıklama zaten seyrek bir olay, ülke ile çaprazlamak küçük sayılarda
 * gereksiz ayırt edicilik üretirdi.
 */
export const linkClickDaily = sqliteTable(
  "link_click_daily",
  {
    profileId: text("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    /** Düzendeki blok id'si (`blk_xxxxxxxx`) */
    blockId: text("block_id").notNull(),
    day: text("day").notNull(),
    clicks: integer("clicks").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.profileId, table.day, table.blockId] }),
  ],
);
