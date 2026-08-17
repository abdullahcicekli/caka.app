import { and, eq, gt, sql } from "drizzle-orm";

import { account, createDb, profile, usernameRedirect } from "@caka/db";
import {
  checkUsernameChange,
  createBlockId,
  parseProfileLayout,
  PROFILE_BIO_MAX,
  profileLayoutSchema,
  socialUrl,
  themeSchema,
  usernameChangeWindow,
  usernameRedirectExpiresAt,
  type ProfileLayout,
  type ProfileTheme,
  type SocialPlatform,
  type UsernameChangeError,
  type UsernameChangeWindow,
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
      // Yayınlanmış hâl baştan kurulduğu için bayat taslak temizlenir;
      // aksi hâlde sonraki "yayınla" onboarding çıktısını geri alırdı.
      draftLayout: null,
      draftTheme: null,
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
  row: { id: string; layout: string; draftLayout?: string | null },
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

    // Bekleyen taslak varsa oradaki profil bloğuna da aynı avatar yazılır;
    // yoksa sonraki yayın avatarı geri silerdi. Best-effort: taslak
    // bozuksa dokunulmaz.
    let draftUpdate: { draftLayout: string } | undefined;
    if (row.draftLayout) {
      try {
        const draft = JSON.parse(row.draftLayout) as {
          blocks?: { type?: string; data?: Record<string, unknown> }[];
        };
        const draftBlock = draft.blocks?.find((b) => b.type === "profile");
        if (draftBlock && !draftBlock.data?.avatarAssetId) {
          draftBlock.data = { ...draftBlock.data, avatarAssetId };
          draftUpdate = { draftLayout: JSON.stringify(draft) };
        }
      } catch {
        // Taslak çözümlemesi başarısızsa yalnızca yayınlanmış hâl onarılır.
      }
    }

    await createDb(env.DB)
      .update(profile)
      .set({
        layout: JSON.stringify(layout),
        ...draftUpdate,
        version: sql`${profile.version} + 1`,
      })
      .where(eq(profile.id, row.id));
    return avatarAssetId;
  } catch {
    // Onarım best-effort; giriş akışını etkilemez.
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * Adres değişikliği (Değişmez #10)
 * ------------------------------------------------------------------ */

export interface ActiveUsernameRedirect {
  oldUsername: string;
  expiresAt: Date;
}

export interface UsernameChangeState {
  /** Bekleme penceresi: şimdi değiştirilebilir mi, değilse ne zaman. */
  window: UsernameChangeWindow;
  /** Bu profile ait, süresi dolmamış eski adresler (302 yönlendiriyor + kilitli). */
  activeRedirects: ActiveUsernameRedirect[];
}

/**
 * Ayarlar/Adres bölümünün ihtiyacı olan durum: bekleme penceresi + hâlâ
 * yönlendiren eski adresler. Yazma yapmaz.
 */
export async function getUsernameChangeState(
  env: Env,
  row: { id: string; usernameChangedAt: Date | null },
  now = new Date(),
): Promise<UsernameChangeState> {
  const rows = await createDb(env.DB).query.usernameRedirect.findMany({
    columns: { oldUsername: true, expiresAt: true },
    where: and(
      eq(usernameRedirect.profileId, row.id),
      gt(usernameRedirect.expiresAt, now),
    ),
  });
  return {
    window: usernameChangeWindow(row.usernameChangedAt, now),
    activeRedirects: rows
      .map((item) => ({ oldUsername: item.oldUsername, expiresAt: item.expiresAt }))
      .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime()),
  };
}

/** Saf kural hataları + yalnızca DB'nin bilebileceği hâller. */
export type ChangeUsernameError =
  | UsernameChangeError
  | "taken"
  | "locked"
  | "no_profile"
  | "conflict";

export type ChangeUsernameResult =
  | { ok: true; username: string; previousUsername: string; redirectExpiresAt: Date }
  | { ok: false; error: ChangeUsernameError };

/**
 * Adresi değiştirir (Değişmez #10). Sıra:
 *
 *  1. Profil YALNIZCA `userId` üzerinden okunur/yazılır — çağıran başkasının
 *     profilini değiştiremez, adres parametre olarak dışarıdan gelmez.
 *  2. Saf kurallar `checkUsernameChange`'te (biçim/rezerve/aynı/bekleme).
 *  3. Doluluk ve kilit kontrolü: ad başka bir profildeyse ya da BAŞKASININ
 *     süresi dolmamış devir kaydı tutuyorsa reddedilir. Kilit kendine aitse
 *     (kendi eski adresini geri alıyor) izin verilir; eski kayıt profilin
 *     kendisine işaret ettiği için resolveUsername zaten profili önce bulur.
 *  4. Yazma tek D1 batch'inde: profil güncellemesi + eski ad için devir kaydı.
 *     Batch atomiktir; unique ihlalinde ikisi de geri alınır, yani "adres
 *     değişti ama yönlendirme yok" hâli oluşmaz.
 *
 * `WHERE username = previous` koşulu eşzamanlı ikinci gönderimi yakalar:
 * satır güncellenmezse "conflict" döner (DB tutarlı kalır, eski ad zaten
 * ilk isteğin kaydıyla yönlendiriyordur).
 */
export async function changeUsername(
  env: Env,
  userId: string,
  input: string,
  now = new Date(),
): Promise<ChangeUsernameResult> {
  const db = createDb(env.DB);
  const row = await db.query.profile.findFirst({
    columns: { id: true, username: true, usernameChangedAt: true },
    where: eq(profile.userId, userId),
  });
  if (!row) return { ok: false, error: "no_profile" };

  const checked = checkUsernameChange(input, row.username, row.usernameChangedAt, now);
  if (!checked.ok) return { ok: false, error: checked.error };
  const next = checked.username;

  const [taken, lock] = await Promise.all([
    db.query.profile.findFirst({
      columns: { id: true },
      where: eq(profile.username, next),
    }),
    db.query.usernameRedirect.findFirst({
      columns: { profileId: true },
      where: and(eq(usernameRedirect.oldUsername, next), gt(usernameRedirect.expiresAt, now)),
    }),
  ]);
  if (taken) return { ok: false, error: "taken" };
  if (lock && lock.profileId !== row.id) return { ok: false, error: "locked" };

  const previousUsername = row.username;
  const redirectExpiresAt = usernameRedirectExpiresAt(now);
  try {
    const [updated] = await db.batch([
      db
        .update(profile)
        .set({ username: next, usernameChangedAt: now, updatedAt: now })
        .where(and(eq(profile.userId, userId), eq(profile.username, previousUsername)))
        .returning({ id: profile.id }),
      db
        .insert(usernameRedirect)
        .values({
          oldUsername: previousUsername,
          profileId: row.id,
          expiresAt: redirectExpiresAt,
          createdAt: now,
        })
        // Aynı ad daha önce (süresi dolmuş) bir devir kaydı bırakmış olabilir;
        // kayıt bu profile ve yeni süreye taşınır.
        .onConflictDoUpdate({
          target: usernameRedirect.oldUsername,
          set: { profileId: row.id, expiresAt: redirectExpiresAt, createdAt: now },
        }),
    ]);
    if (!updated.length) return { ok: false, error: "conflict" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    // Kontrol ile yazma arasında başkası kaptı (AE1 ile aynı yarış).
    if (msg.includes("UNIQUE constraint failed: profile.username")) {
      return { ok: false, error: "taken" };
    }
    throw err;
  }

  return { ok: true, username: next, previousUsername, redirectExpiresAt };
}

/**
 * Hesap bölümü için salt okunur özet: hangi sağlayıcıyla girildiği.
 * E-posta oturumdan okunur, burada tekrar sorgulanmaz.
 */
export async function getAccountProviders(env: Env, userId: string): Promise<string[]> {
  const rows = await createDb(env.DB).query.account.findMany({
    columns: { providerId: true },
    where: eq(account.userId, userId),
  });
  return [...new Set(rows.map((row) => row.providerId))].sort();
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
