import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
    layout: text("layout").notNull(),
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
