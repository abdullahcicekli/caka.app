import { and, eq, gt, sql } from "drizzle-orm";

import { createDb, profile, usernameRedirect } from "@caka/db";
import { validateUsername } from "@caka/shared";
import { copyGoogleAvatar } from "./avatar";

/** Adres kullanılabilir mi? Profil kaydı + süresi geçmemiş devir kilidi bakılır. */
export async function isUsernameAvailable(env: Env, username: string) {
  const db = createDb(env.DB);
  const [taken, locked] = await Promise.all([
    db.query.profile.findFirst({
      columns: { id: true },
      where: eq(profile.username, username),
    }),
    db.query.usernameRedirect.findFirst({
      columns: { oldUsername: true },
      where: and(
        eq(usernameRedirect.oldUsername, username),
        gt(usernameRedirect.expiresAt, new Date()),
      ),
    }),
  ]);
  return !taken && !locked;
}

export async function getProfileByUserId(env: Env, userId: string) {
  return createDb(env.DB).query.profile.findFirst({
    where: eq(profile.userId, userId),
  });
}

/** R3: sayfa asla boş açılmaz — Google adı + avatarıyla tohum profil kartı. */
function buildSeedLayout(name: string, avatarAssetId: string | null) {
  return {
    version: 1,
    blocks: [
      {
        id: `blk_${crypto.randomUUID().slice(0, 8)}`,
        type: "profile",
        pos: {
          lg: { x: 0, y: 0, w: 2, h: 2 },
          sm: { x: 0, y: 0, w: 2, h: 2 },
        },
        smManual: false,
        data: {
          name: name.slice(0, 60),
          title: "",
          ...(avatarAssetId ? { avatarAssetId } : {}),
        },
      },
    ],
  };
}

export type ClaimResult =
  | { ok: true; username: string }
  | { ok: false; error: "invalid" | "taken" };

/**
 * Adresi yarış-güvenli biçimde alır (R2): asıl garanti unique kısıt; ihlal
 * "taken" olarak yüzeye çıkar. Avatar kopyalama U8 ile gelecek.
 */
export async function claimUsername(
  env: Env,
  user: { id: string; name: string; image?: string | null },
  input: string,
): Promise<ClaimResult> {
  const result = validateUsername(input);
  if (!result.ok) return { ok: false, error: "invalid" };
  if (!(await isUsernameAvailable(env, result.username))) {
    return { ok: false, error: "taken" };
  }

  // Avatar kopyalama başarısız olsa da claim tamamlanır (R3).
  const avatarAssetId = user.image
    ? await copyGoogleAvatar(env, user.id, user.image)
    : null;

  const db = createDb(env.DB);
  try {
    await db.insert(profile).values({
      id: crypto.randomUUID(),
      userId: user.id,
      username: result.username,
      layout: JSON.stringify(buildSeedLayout(user.name, avatarAssetId)),
    });
    return { ok: true, username: result.username };
  } catch {
    // Unique ihlali: kontrol ile insert arasında başkası kaptı (AE1).
    return { ok: false, error: "taken" };
  }
}

/**
 * Avatarsız kalmış mevcut profilleri girişte kendiliğinden onarır
 * (avatar kopyalama sonradan eklendi; eski kayıtlar baş harfle kalmıştı).
 */
export async function ensureProfileAvatar(
  env: Env,
  user: { id: string; image?: string | null },
  row: { id: string; layout: string },
): Promise<string | null> {
  if (!user.image) return null;
  try {
    const layout = JSON.parse(row.layout) as {
      blocks?: { type?: string; data?: Record<string, unknown> }[];
    };
    const block = layout.blocks?.find((b) => b.type === "profile");
    if (!block || block.data?.avatarAssetId) return null;

    const avatarAssetId = await copyGoogleAvatar(env, user.id, user.image);
    if (!avatarAssetId) return null;

    block.data = { ...block.data, avatarAssetId };
    await createDb(env.DB)
      .update(profile)
      .set({
        layout: JSON.stringify(layout),
        version: sql`${profile.version} + 1`,
      })
      .where(eq(profile.id, row.id));
    return avatarAssetId;
  } catch {
    // Onarım best-effort; giriş akışını etkilemez.
    return null;
  }
}

/** Public sayfa lookup'ı: profil ya da aktif devir kaydı (R15/R18). */
export async function resolveUsername(env: Env, username: string) {
  const db = createDb(env.DB);
  const found = await db.query.profile.findFirst({
    where: eq(profile.username, username),
  });
  if (found) return { kind: "profile" as const, profile: found };

  const redirect = await db.query.usernameRedirect.findFirst({
    where: and(
      eq(usernameRedirect.oldUsername, username),
      gt(usernameRedirect.expiresAt, new Date()),
    ),
  });
  if (redirect) {
    const target = await db.query.profile.findFirst({
      where: eq(profile.id, redirect.profileId),
    });
    if (target) return { kind: "redirect" as const, to: target.username };
  }
  return { kind: "not_found" as const };
}
