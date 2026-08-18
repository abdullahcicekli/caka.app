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

export const MAX_LAYOUT_BLOCKS = 50;

/** Belgeyi ayakta tutan tek yapısal kural; hem şemada hem kurtarmalı
 * ayrıştırmada aynı yerden okunur ki ikisi ayrışmasın. */
function profileBlockCountIssue(blocks: readonly { type: string }[]): string | null {
  return blocks.filter((block) => block.type === "profile").length === 1
    ? null
    : "Düzende tam olarak bir profil bloğu bulunmalı";
}

export const profileLayoutSchema = z.object({
  // NEDEN hâlâ z.literal(1): sürümü yükseltmek eski deploy'lar için tek yönlü
  // kapı olurdu (eski kod version:2'yi hiç okuyamaz). İleri/geri uyum artık
  // belge sürümünde değil, blok birleşiminde çözülüyor — tanınmayan bloklar
  // parseProfileLayoutDetailed ile ayıklanıp ham hâlleriyle korunuyor. Belge
  // gövdesi gerçekten değişene kadar bu sabit kalmalı.
  version: z.literal(1),
  blocks: z.array(profileBlockSchema).max(MAX_LAYOUT_BLOCKS),
}).superRefine((layout, context) => {
  const message = profileBlockCountIssue(layout.blocks);
  if (message) {
    context.addIssue({ code: "custom", path: ["blocks"], message });
  }
});

export type ProfileBlock = z.infer<typeof profileBlockSchema>;
export type ProfileLayout = z.infer<typeof profileLayoutSchema>;

// Blok dizisi bilinçli olarak `unknown[]`: belge gövdesi (sürüm + dizi + üst
// sınır) sıkı doğrulanır, blokların tek tek doğrulaması ayrı turda yapılır.
const layoutEnvelopeSchema = z.object({
  version: z.literal(1),
  blocks: z.array(z.unknown()).max(MAX_LAYOUT_BLOCKS),
});

export interface ParsedProfileLayout {
  /** Tanınan bloklardan oluşan, şemadan geçmiş düzen. */
  layout: ProfileLayout;
  /** Ayrıştırılamayan bloklar — ham hâlleriyle, sırayla. */
  unknownBlocks: unknown[];
}

/**
 * Düzeni kurtarmalı ayrıştırır: ayrıştırılamayan **blok** düşürülür (ama
 * `unknownBlocks` içinde ham hâliyle saklanır), gerisi ayakta kalır. Yapısal
 * olarak bozuk **belge** (JSON değil, sürüm tutmuyor, `blocks` dizi değil,
 * 50 blok üstü, profil bloğu tam bir tane değil) yine `null` döner — kapalı
 * biçimde başarısız olur.
 *
 * Böylece yeni bir blok tipi tek yönlü kapı olmaktan çıkar: eski bir deploy
 * yeni tipi tanımaz, sayfayı yine de render eder, kaydederken de kaybetmez
 * (bkz. serializeProfileLayout).
 */
export function parseProfileLayoutDetailed(value: string): ParsedProfileLayout | null {
  let raw: unknown;
  try {
    raw = JSON.parse(value);
  } catch {
    return null;
  }
  const envelope = layoutEnvelopeSchema.safeParse(raw);
  if (!envelope.success) return null;

  const blocks: ProfileBlock[] = [];
  const unknownBlocks: unknown[] = [];
  for (const candidate of envelope.data.blocks) {
    const parsed = profileBlockSchema.safeParse(candidate);
    if (parsed.success) blocks.push(parsed.data);
    else unknownBlocks.push(candidate);
  }
  if (profileBlockCountIssue(blocks)) return null;
  return { layout: { version: 1, blocks }, unknownBlocks };
}

export function parseProfileLayout(value: string): ProfileLayout | null {
  return parseProfileLayoutDetailed(value)?.layout ?? null;
}

/**
 * Kaydetmeye hazır JSON. Tanınmayan bloklar dizinin sonuna ham hâlleriyle
 * geri eklenir: kullanıcı eski bir deploy'da sayfasını kaydetse bile yeni
 * tipteki blokları silinmez, deploy geri alındığında aynen geri gelir.
 */
export function serializeProfileLayout(
  layout: ProfileLayout,
  unknownBlocks: readonly unknown[] = [],
): string {
  if (unknownBlocks.length === 0) return JSON.stringify(layout);
  return JSON.stringify({
    ...layout,
    blocks: [...layout.blocks, ...unknownBlocks],
  });
}

export function createBlockId(): string {
  return `blk_${crypto.randomUUID().slice(0, 8)}`;
}

// Taslak/yayınla modeli: şema yarım bloklara izin verir (taslak kaydı),
// yayın öncesi eksikler aşağıdaki kurallarla yüzeye çıkarılır.
export const BLOCK_TYPE_LABELS: Record<ProfileBlock["type"], string> = {
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
// constraint'i (`editor/grid.tsx`), sunucuda `profileLayoutWriteSchema`
// üzerinden doğrulama; ikisi de bu tek kaynaktan okur.
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

/** Bloğun konumu tip sınırlarını aşıyor mu? Aşıyorsa Türkçe mesaj. */
export function blockGridLimitIssue(block: ProfileBlock): string | null {
  if (block.type === "profile" || !block.pos) return null;
  const limits = BLOCK_GRID_LIMITS[block.type];
  // Hem masaüstü hem mobil konum aynı tavana uyar; mobil genişlik zaten
  // kolon sayısıyla (2) ayrıca sınırlı.
  for (const pos of [block.pos.lg, block.pos.sm]) {
    if (
      pos.w < limits.minW ||
      pos.h < limits.minH ||
      pos.w > limits.maxW ||
      pos.h > limits.maxH
    ) {
      return `${BLOCK_TYPE_LABELS[block.type]} bloğu en az ${limits.minW}×${limits.minH}, en fazla ${limits.maxW}×${limits.maxH} olabilir`;
    }
  }
  return null;
}

/** Tip sınırlarını aşan blokların listesi; boşsa düzen kaydedilebilir. */
export function layoutGridLimitIssues(layout: ProfileLayout): BlockIssue[] {
  return layout.blocks.flatMap((block) => {
    const message = blockGridLimitIssue(block);
    return message
      ? [{ blockId: block.id, label: BLOCK_TYPE_LABELS[block.type], message }]
      : [];
  });
}

/**
 * Yazma şeması (R6): okuma şemasının üstüne tip başına min/maks boyut
 * kontrolünü ekler. Okuma tarafına bilinçli olarak eklenmez — eskiden
 * yazılmış, sınırı aşan bir blok yüzünden yayındaki sayfa kararmasın.
 */
export const profileLayoutWriteSchema = profileLayoutSchema.superRefine(
  (layout, context) => {
    layout.blocks.forEach((block, index) => {
      const message = blockGridLimitIssue(block);
      if (message) {
        context.addIssue({ code: "custom", path: ["blocks", index, "pos"], message });
      }
    });
  },
);

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
    if (block.type === "profile") return block;
    // Tip tavanı burada uygulanır — hem eski `size`'dan türetirken ("2x2"
    // bir status bloğu için h=2 üretir, oysa maxH 1) hem de sınır yalnız
    // istemcide dururken yazılmış mevcut `pos` kayıtlarında. Yazma şeması
    // artık bunları reddediyor; kırpılmasalar kullanıcı sayfasını bir daha
    // kaydedemez ve kendi başına düzeltemezdi. Kırpma idempotent ve
    // yalnızca küçültücü olduğu için `x + w <= kolon` refine'ı bozulmaz.
    const limits = BLOCK_GRID_LIMITS[block.type];
    if (block.pos) {
      const clamp = (p: GridPosition): GridPosition => ({
        ...p,
        w: Math.min(Math.max(p.w, limits.minW), limits.maxW),
        h: Math.min(Math.max(p.h, limits.minH), limits.maxH),
      });
      const lg = clamp(block.pos.lg);
      const sm = clamp(block.pos.sm);
      return lg.w === block.pos.lg.w &&
        lg.h === block.pos.lg.h &&
        sm.w === block.pos.sm.w &&
        sm.h === block.pos.sm.h
        ? block
        : { ...block, pos: { lg, sm } };
    }
    const dims = sizeToDims(block.size);
    const w = Math.min(Math.max(dims.w, limits.minW), limits.maxW);
    const h = Math.min(Math.max(dims.h, limits.minH), limits.maxH);
    const { x, y } = firstFit(occupied, w, h, GRID_COLUMNS.lg);
    const lg = { x, y, w: Math.min(w, GRID_COLUMNS.lg), h };
    occupied.push(lg);
    return { ...block, pos: { lg, sm: { ...lg, w: Math.min(w, GRID_COLUMNS.sm) } } };
  });
  return { ...layout, blocks: withDerivedSmPositions(blocks) };
}
