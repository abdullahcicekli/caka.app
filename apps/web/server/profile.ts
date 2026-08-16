import { and, eq, gt, sql } from "drizzle-orm";

import { createDb, profile, usernameRedirect } from "@caka/db";
import {
  createBlockId,
  parseProfileLayout,
  PROFILE_BIO_MAX,
  profileLayoutSchema,
  socialUrl,
  themeSchema,
  type ProfileLayout,
  type ProfileTheme,
  type SocialPlatform,
  validateUsername,
} from "@caka/shared";
import { copyGoogleAvatar } from "./avatar";
import { enrichSocialOgImages } from "./og";

export interface OnboardingLink {
  platform: SocialPlatform;
  value: string;
}

export interface OnboardingData {
  name?: string;
  bio?: string;
  avatarAssetId?: string;
  platforms?: SocialPlatform[];
  purposes?: string[];
  discovery?: string;
  template?: string;
  links?: OnboardingLink[];
}

export function parseOnboardingData(value: string): OnboardingData {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as OnboardingData) : {};
  } catch {
    return {};
  }
}

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

/** R3: sayfa asla boş açılmaz — hesap adı + avatarıyla tohum profil kartı. */
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
        size: "1x1",
        data: {
          name: name.slice(0, 60),
          title: "",
          ...(avatarAssetId ? { avatarAssetId } : {}),
        },
      },
    ],
  };
}

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  x: "X",
  tiktok: "TikTok",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  twitch: "Twitch",
  dribbble: "Dribbble",
  github: "GitHub",
  threads: "Threads",
  nsosyal: "Nsosyal",
  website: "Web sitesi",
  email: "E-posta",
};

function templateTheme(template?: string): ProfileTheme {
  if (template === "gece") return "dark";
  // Yeni şablon id'leri tema id'siyle birebir aynı (lavanta, ufuk, neon, zumrut)
  const parsed = themeSchema.safeParse(template);
  return parsed.success ? parsed.data : "light";
}

export function buildOnboardingLayout(
  data: OnboardingData,
  fallback: { name: string; avatarAssetId?: string },
): { layout: ProfileLayout; theme: ProfileTheme } {
  const profileBlock = {
    id: createBlockId(),
    type: "profile" as const,
    size: "1x1" as const,
    data: {
      name: (data.name || fallback.name || "Caka").slice(0, 60),
      title: (data.bio ?? "").slice(0, PROFILE_BIO_MAX),
      ...(data.avatarAssetId || fallback.avatarAssetId
        ? { avatarAssetId: data.avatarAssetId || fallback.avatarAssetId }
        : {}),
    },
  };
  const socialBlocks = (data.links ?? [])
    .filter((item) => item.value.trim())
    .slice(0, 12)
    .map((item) => ({
      id: createBlockId(),
      type: "social" as const,
      size: "1x1" as const,
      data: {
        platform: item.platform,
        handle: item.value.trim(),
        url: socialUrl(item.platform, item.value),
        label: PLATFORM_LABELS[item.platform],
      },
    }));
  const purposeStatus = data.purposes?.includes("projects")
    ? [{
        id: createBlockId(),
        type: "status" as const,
        size: "2x1" as const,
        data: { text: "Yeni işler ve projeler burada.", url: "" },
      }]
    : [];
  const parsed = profileLayoutSchema.parse({
    version: 1,
    blocks: [profileBlock, ...socialBlocks, ...purposeStatus],
  });
  return { layout: parsed, theme: templateTheme(data.template) };
}

export async function updateOnboardingData(
  env: Env,
  userId: string,
  patch: OnboardingData,
) {
  const db = createDb(env.DB);
  const row = await getProfileByUserId(env, userId);
  if (!row) return null;
  const merged = { ...parseOnboardingData(row.onboardingData), ...patch };
  await db
    .update(profile)
    .set({ onboardingData: JSON.stringify(merged), updatedAt: new Date() })
    .where(eq(profile.userId, userId));
  return merged;
}

export async function completeOnboarding(
  env: Env,
  user: { id: string; name: string },
  patch: OnboardingData,
) {
  const row = await getProfileByUserId(env, user.id);
  if (!row) return null;
  const data = { ...parseOnboardingData(row.onboardingData), ...patch };
  const current = parseProfileLayout(row.layout);
  const currentProfile = current?.blocks.find((block) => block.type === "profile");
  const fallbackAvatar =
    currentProfile?.type === "profile" ? currentProfile.data.avatarAssetId : undefined;
  const result = buildOnboardingLayout(data, {
    name: user.name,
    avatarAssetId: fallbackAvatar,
  });
  // Sosyal blokların og görselleri best-effort doldurulur; çekilemeyenler
  // editör ilk açıldığında yeniden denenir.
  result.layout = await enrichSocialOgImages(result.layout);
  await createDb(env.DB)
    .update(profile)
    .set({
      onboardingData: JSON.stringify(data),
      onboardingCompletedAt: new Date(),
      layout: JSON.stringify(result.layout),
      theme: result.theme,
      version: sql`${profile.version} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(profile.userId, user.id));
  return { ...result, data };
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    // Unique ihlali: kontrol ile insert arasında başkası kaptı (AE1).
    if (msg.includes("UNIQUE constraint failed: profile.username")) {
      return { ok: false, error: "taken" };
    }
    // Çift gönderim: aynı kullanıcının profili zaten var — başarı say.
    if (msg.includes("UNIQUE constraint failed: profile.user_id")) {
      const existing = await getProfileByUserId(env, user.id);
      if (existing) return { ok: true, username: existing.username };
    }
    // Diğer hatalar (ör. şema uyumsuzluğu) "taken" maskesi takmasın.
    throw err;
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
