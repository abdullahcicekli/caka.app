import { and, eq, gt } from "drizzle-orm";

import { createDb, profile, usernameRedirect } from "@caka/db";
import { validateUsername } from "@caka/shared";

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

/** R3: sayfa asla boş açılmaz — Google adından tohum profil kartı. */
function buildSeedLayout(name: string) {
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
        data: { name: name.slice(0, 60), title: "" },
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
  user: { id: string; name: string },
  input: string,
): Promise<ClaimResult> {
  const result = validateUsername(input);
  if (!result.ok) return { ok: false, error: "invalid" };
  if (!(await isUsernameAvailable(env, result.username))) {
    return { ok: false, error: "taken" };
  }

  const db = createDb(env.DB);
  try {
    await db.insert(profile).values({
      id: crypto.randomUUID(),
      userId: user.id,
      username: result.username,
      layout: JSON.stringify(buildSeedLayout(user.name)),
    });
    return { ok: true, username: result.username };
  } catch {
    // Unique ihlali: kontrol ile insert arasında başkası kaptı (AE1).
    return { ok: false, error: "taken" };
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
