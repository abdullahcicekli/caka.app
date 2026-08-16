import { z } from "zod";

export const PROFILE_NAME_MAX = 60;
export const PROFILE_BIO_MAX = 160;

export const themeSchema = z.enum(["light", "dark", "lavanta", "ufuk", "neon", "zumrut"]);
export type ProfileTheme = z.infer<typeof themeSchema>;

/** DB'den okunan temayı doğrular; kaldırılan temalar (forest/rose) ve
 * bilinmeyen değerler "light"a düşer. */
export function normalizeTheme(value: string): ProfileTheme {
  const parsed = themeSchema.safeParse(value);
  return parsed.success ? parsed.data : "light";
}

export const blockSizeSchema = z.enum(["1x1", "2x1", "2x2"]);
export type BlockSize = z.infer<typeof blockSizeSchema>;

const gridPositionSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().min(1).max(4),
  h: z.number().int().min(1).max(4),
});
export type GridPosition = z.infer<typeof gridPositionSchema>;

// R7: desktop 4 kolon, mobil 2 kolon.
export const GRID_COLUMNS = { lg: 4, sm: 2 } as const;

const blockBase = {
  id: z.string().min(1).max(64),
  size: blockSizeSchema.default("1x1"),
  pos: z
    .object({
      lg: gridPositionSchema.refine((p) => p.x + p.w <= GRID_COLUMNS.lg, {
        message: "Blok desktop kolonlarının dışına taşıyor",
      }),
      sm: gridPositionSchema.refine((p) => p.x + p.w <= GRID_COLUMNS.sm, {
        message: "Blok mobil kolonlarının dışına taşıyor",
      }),
    })
    .optional(),
  smManual: z.boolean().optional(),
};

export const socialPlatformSchema = z.enum([
  "instagram",
  "x",
  "tiktok",
  "youtube",
  "linkedin",
  "facebook",
  "twitch",
  "dribbble",
  "github",
  "threads",
  "nsosyal",
  "website",
  "email",
]);
export type SocialPlatform = z.infer<typeof socialPlatformSchema>;

function normalizeHttpUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : "";
  } catch {
    return "";
  }
}

const optionalHttpUrlSchema = z
  .string()
  .max(2048)
  .transform((value, context) => {
    if (!value.trim()) return "";
    const normalized = normalizeHttpUrl(value);
    if (!normalized) {
      context.addIssue({ code: "custom", message: "Geçerli bir bağlantı gir" });
      return z.NEVER;
    }
    return normalized;
  });

// Platform → profil URL tabanı; kullanıcı adından bağlantı üretir
// (onboarding kurulumunda ve editörde aynı kaynaktan kullanılır).
const SOCIAL_URL_BASES: Partial<Record<SocialPlatform, string>> = {
  instagram: "https://instagram.com/",
  x: "https://x.com/",
  tiktok: "https://tiktok.com/@",
  youtube: "https://youtube.com/@",
  linkedin: "https://linkedin.com/in/",
  facebook: "https://facebook.com/",
  twitch: "https://twitch.tv/",
  dribbble: "https://dribbble.com/",
  github: "https://github.com/",
  threads: "https://threads.net/@",
  nsosyal: "https://nsosyal.com/",
};

export function socialUrl(platform: SocialPlatform, value: string): string {
  const clean = value.trim().replace(/^@/, "");
  if (!clean) return "";
  if (platform === "website") return clean;
  if (platform === "email") return "";
  return `${SOCIAL_URL_BASES[platform] ?? ""}${clean}`;
}

const SOCIAL_URL_HOSTS: [RegExp, SocialPlatform][] = [
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)(x|twitter)\.com$/, "x"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"],
  [/(^|\.)linkedin\.com$/, "linkedin"],
  [/(^|\.)facebook\.com$/, "facebook"],
  [/(^|\.)twitch\.tv$/, "twitch"],
  [/(^|\.)dribbble\.com$/, "dribbble"],
  [/(^|\.)github\.com$/, "github"],
  [/(^|\.)threads\.(net|com)$/, "threads"],
  [/(^|\.)nsosyal\.com$/, "nsosyal"],
];

/** Yapıştırılan bağlantıdan platform + kullanıcı adını çıkarır (editör
 * importu): "https://nsosyal.com/teknofest" → { nsosyal, teknofest }.
 * Bilinen bir platform değilse null döner. */
export function detectSocialFromUrl(
  value: string,
): { platform: SocialPlatform; handle: string; url: string } | null {
  const normalized = normalizeHttpUrl(value);
  if (!normalized) return null;
  const url = new URL(normalized);
  const match = SOCIAL_URL_HOSTS.find(([host]) => host.test(url.hostname.toLowerCase()));
  if (!match) return null;
  const platform = match[1];
  const segments = url.pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment));
  let handle = segments[0] ?? "";
  // linkedin.com/in/<ad> ve linkedin.com/company/<ad> biçimleri
  if (platform === "linkedin") {
    handle = segments[0] === "in" || segments[0] === "company" ? (segments[1] ?? "") : "";
  }
  return { platform, handle: handle.replace(/^@/, ""), url: normalized };
}

const profileCardSchema = z.object({
  ...blockBase,
  type: z.literal("profile"),
  data: z.object({
    name: z.string().trim().max(PROFILE_NAME_MAX).default(""),
    title: z.string().trim().max(PROFILE_BIO_MAX),
    avatarAssetId: z.string().uuid().optional(),
  }),
});

const socialBlockSchema = z.object({
  ...blockBase,
  type: z.literal("social"),
  data: z.object({
    platform: socialPlatformSchema,
    handle: z.string().trim().max(120),
    url: optionalHttpUrlSchema,
    label: z.string().trim().max(60),
    // Bağlantının og:image önizlemesi; her zaman çekilip saklanır,
    // yalnız 1x1'den büyük kartlarda gösterilir.
    ogImage: optionalHttpUrlSchema.default(""),
  }),
});

const linkBlockSchema = z.object({
  ...blockBase,
  type: z.literal("link"),
  data: z.object({
    title: z.string().trim().max(60).default(""),
    url: optionalHttpUrlSchema,
  }),
});

// Tiptap JSON dokümanı; HTML olarak değil, allowlist'li RichTextView ile
// render edilir (XSS yüzeyi yok). Boyut sınırı serileştirilmiş halde.
const richDocSchema = z
  .unknown()
  .optional()
  .refine((value) => value === undefined || JSON.stringify(value).length <= 8192, {
    message: "Metin içeriği çok uzun",
  });

const textBlockSchema = z.object({
  ...blockBase,
  type: z.literal("text"),
  data: z.object({
    text: z.string().trim().max(280).default(""),
    doc: richDocSchema,
  }),
});

const imageBlockSchema = z.object({
  ...blockBase,
  type: z.literal("image"),
  data: z.object({
    assetId: z.string().uuid().optional(),
    title: z.string().trim().max(60).default(""),
    url: optionalHttpUrlSchema.default(""),
  }),
});

const statusBlockSchema = z.object({
  ...blockBase,
  type: z.literal("status"),
  data: z.object({
    text: z.string().trim().max(140).default(""),
    url: optionalHttpUrlSchema.default(""),
    doc: richDocSchema,
  }),
});

export const profileBlockSchema = z.discriminatedUnion("type", [
  profileCardSchema,
  socialBlockSchema,
  linkBlockSchema,
  textBlockSchema,
  imageBlockSchema,
  statusBlockSchema,
]);

export const profileLayoutSchema = z.object({
  version: z.literal(1),
  blocks: z.array(profileBlockSchema).max(50),
}).superRefine((layout, context) => {
  const profileBlockCount = layout.blocks.filter((block) => block.type === "profile").length;
  if (profileBlockCount !== 1) {
    context.addIssue({
      code: "custom",
      path: ["blocks"],
      message: "Düzende tam olarak bir profil bloğu bulunmalı",
    });
  }
});

export type ProfileBlock = z.infer<typeof profileBlockSchema>;
export type ProfileLayout = z.infer<typeof profileLayoutSchema>;

export function parseProfileLayout(value: string): ProfileLayout | null {
  try {
    const parsed = profileLayoutSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function createBlockId(): string {
  return `blk_${crypto.randomUUID().slice(0, 8)}`;
}

// Taslak/yayınla modeli: şema yarım bloklara izin verir (taslak kaydı),
// yayın öncesi eksikler aşağıdaki kurallarla yüzeye çıkarılır.
const BLOCK_TYPE_LABELS: Record<ProfileBlock["type"], string> = {
  profile: "Profil",
  social: "Sosyal medya",
  link: "Bağlantı",
  text: "Metin",
  image: "Görsel",
  status: "Duyuru",
};

export type BlockIssue = { blockId: string; label: string; message: string };

/** Blok yayına hazır mı? Değilse kullanıcıya gösterilecek Türkçe mesaj. */
export function blockIssue(block: ProfileBlock): string | null {
  switch (block.type) {
    case "profile":
      return block.data.name ? null : "Adını gir";
    case "social":
      // E-posta gibi bazı platformlarda http(s) URL üretilmez (KTD8: kullanıcı
      // URL'leri yalnız http(s)); orada dolu `handle` yeterli sayılır.
      return block.data.url || block.data.handle
        ? null
        : "Bağlantı ya da kullanıcı adı gir";
    case "link":
      if (!block.data.url) return "Bağlantı adresi gir";
      return block.data.title ? null : "Başlık gir";
    case "text":
      return block.data.text ? null : "Metin yaz";
    case "status":
      return block.data.text ? null : "Duyuru metni yaz";
    case "image":
      return block.data.assetId ? null : "Görsel yükle";
  }
}

/** Yayın öncesi eksik blokların listesi; boşsa yayınlanabilir. */
export function layoutIssues(layout: ProfileLayout): BlockIssue[] {
  return layout.blocks.flatMap((block) => {
    const message = blockIssue(block);
    return message
      ? [{ blockId: block.id, label: BLOCK_TYPE_LABELS[block.type], message }]
      : [];
  });
}

export type BentoBlockType = Exclude<ProfileBlock["type"], "profile">;

// R6: blok tipi başına grid min/maks boyutları — editörde gridstack
// constraint'i, sunucuda doğrulama olarak aynı kaynaktan uygulanır.
export const BLOCK_GRID_LIMITS: Record<
  BentoBlockType,
  { minW: number; minH: number; maxW: number; maxH: number }
> = {
  link: { minW: 1, minH: 1, maxW: 4, maxH: 2 },
  social: { minW: 1, minH: 1, maxW: 4, maxH: 3 },
  text: { minW: 1, minH: 1, maxW: 4, maxH: 3 },
  image: { minW: 1, minH: 1, maxW: 4, maxH: 3 },
  status: { minW: 1, minH: 1, maxW: 4, maxH: 1 },
};

export function sizeToDims(size: BlockSize): { w: number; h: number } {
  const [w, h] = size.split("x");
  return { w: Number(w), h: Number(h) };
}

export function sizeFromDims(w: number, h: number): BlockSize {
  if (w >= 2 && h >= 2) return "2x2";
  if (w >= 2) return "2x1";
  return "1x1";
}

// İlk sığan hücreyi satır-öncelikli tarar (okuma sırası).
function firstFit(
  occupied: GridPosition[],
  w: number,
  h: number,
  columns: number,
): { x: number; y: number } {
  const width = Math.min(w, columns);
  const overlaps = (x: number, y: number) =>
    occupied.some((p) => x < p.x + p.w && p.x < x + width && y < p.y + p.h && p.y < y + h);
  for (let y = 0; ; y += 1) {
    for (let x = 0; x + width <= columns; x += 1) {
      if (!overlaps(x, y)) return { x, y };
    }
  }
}

// Yeni blok için desktop yerleşiminde ilk boş konumu döner.
export function placeNewBlock(
  blocks: ProfileBlock[],
  w: number,
  h: number,
): GridPosition {
  const occupied = blocks.flatMap((block) =>
    block.type !== "profile" && block.pos ? [block.pos.lg] : [],
  );
  const { x, y } = firstFit(occupied, w, h, GRID_COLUMNS.lg);
  return { x, y, w: Math.min(w, GRID_COLUMNS.lg), h };
}

// R7: mobil yerleşim, smManual olmayan bloklar için desktop'tan türetilir —
// genişlik 2'ye kırpılır, desktop okuma sırasına (y, sonra x) göre dizilir.
// smManual bloklar sabit engel olarak korunur.
export function withDerivedSmPositions<T extends ProfileBlock>(blocks: T[]): T[] {
  const positioned = blocks.filter(
    (block): block is T & { pos: { lg: GridPosition; sm: GridPosition } } =>
      block.type !== "profile" && block.pos !== undefined,
  );
  const occupied = positioned
    .filter((block) => block.smManual)
    .map((block) => block.pos.sm);
  const auto = positioned
    .filter((block) => !block.smManual)
    .sort((a, b) => a.pos.lg.y - b.pos.lg.y || a.pos.lg.x - b.pos.lg.x);
  const derived = new Map<string, GridPosition>();
  for (const block of auto) {
    const w = Math.min(block.pos.lg.w, GRID_COLUMNS.sm);
    const h = block.pos.lg.h;
    const { x, y } = firstFit(occupied, w, h, GRID_COLUMNS.sm);
    const pos = { x, y, w, h };
    occupied.push(pos);
    derived.set(block.id, pos);
  }
  return blocks.map((block) => {
    const sm = derived.get(block.id);
    return sm && block.pos ? { ...block, pos: { ...block.pos, sm } } : block;
  });
}

// pos alanı olmayan (eski) bloklara size'dan konum türetir; sm'i R7 kuralıyla
// tamamlar. Idempotent — pos'u tam layoutlarda değişiklik yapmaz (smManual
// olmayan bloklarda sm her zaman lg'den yeniden türetilir).
export function ensureLayoutPositions(layout: ProfileLayout): ProfileLayout {
  const occupied = layout.blocks.flatMap((block) =>
    block.type !== "profile" && block.pos ? [block.pos.lg] : [],
  );
  const blocks = layout.blocks.map((block) => {
    if (block.type === "profile" || block.pos) return block;
    const { w, h } = sizeToDims(block.size);
    const { x, y } = firstFit(occupied, w, h, GRID_COLUMNS.lg);
    const lg = { x, y, w: Math.min(w, GRID_COLUMNS.lg), h };
    occupied.push(lg);
    return { ...block, pos: { lg, sm: { ...lg, w: Math.min(w, GRID_COLUMNS.sm) } } };
  });
  return { ...layout, blocks: withDerivedSmPositions(blocks) };
}
