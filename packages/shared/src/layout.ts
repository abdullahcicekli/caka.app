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

// Boyut sözlüğü ızgaranın kendi basamaklarıdır: genişlik 1/2/4 (4 sütun),
// yükseklik 1/2. Dikey tile (`1x2`) ve tam genişlik (`4x1`, `4x2`) bento
// yerleşimlerinin dayandığı biçimlerdi ve sözlükte yoktu — `sizeFromDims`
// onları en yakın dar etikete yuvarlayıp kaybediyordu (KTD33).
export const blockSizeSchema = z.enum(["1x1", "1x2", "2x1", "2x2", "4x1", "4x2"]);
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
    // R60: bağlantının og:image önizlemesi — `social` bloğundakiyle aynı
    // sözleşme (kayıt anında çekilir, saklanır, render yeniden çekmez).
    ogImage: optionalHttpUrlSchema.default(""),
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

/** R62: bir galeri bloğu en fazla bu kadar fotoğraf taşır. */
export const GALLERY_MAX_PHOTOS = 5;
/** R62: bir hesapta en fazla bu kadar galeri bloğu olabilir. */
export const MAX_GALLERY_BLOCKS = 2;

// Fotoğraf, `image` bloğuyla aynı deseni izler: R2 anahtarı düz UUID olan
// asset kimliği (Değişmez #9). `alt` erişilebilirlik içindir ve isteğe
// bağlıdır — boş bırakılan fotoğraf dekoratif sayılır (alt="").
const galleryPhotoSchema = z.object({
  assetId: z.string().uuid(),
  alt: z.string().trim().max(120).default(""),
});
export type GalleryPhoto = z.infer<typeof galleryPhotoSchema>;

// Her galeri kendi fotoğraflarını taşır: ortak bir havuz yok, blok silinince
// referansı da gider. Beş fotoğraf sınırı şemada; iki galeri sınırı belge
// düzeyinde (tek blok kendi başına kaç galeri olduğunu bilemez).
const galleryBlockSchema = z.object({
  ...blockBase,
  type: z.literal("gallery"),
  data: z.object({
    title: z.string().trim().max(60).default(""),
    photos: z.array(galleryPhotoSchema).max(GALLERY_MAX_PHOTOS).default([]),
  }),
});

// KTD34: video/kanal ayrımı URL şeklinden KAYIT ANINDA çözülür ve sonucu
// blokta durur; render yeniden ayrıştırma yapmaz. `kind` bu yüzden bir
// ayrımlı birleşimin etiketidir, render'da hesaplanan bir bayrak değil.
//
// Kimlik alanları URL kurmakta kullanılıyor (embed adresi, RSS akışı); charset
// güvencesi bu yüzden şemada. Uzunluk/biçim beklentisi: `videoId` 11 karakter,
// `channelId` `UC` + 22 karakter. Çözümleyici (`server/youtube.ts`) doldurur;
// taslak blokta boş kalabilir.
const youtubeIdSchema = (max: number) =>
  z.string().trim().max(max).regex(/^[A-Za-z0-9_-]*$/, "Geçersiz YouTube kimliği").default("");

const youtubeVideoDataSchema = z.object({
  kind: z.literal("video"),
  /** Kullanıcının yapıştırdığı, normalize edilmiş adres. */
  url: optionalHttpUrlSchema.default(""),
  videoId: youtubeIdSchema(24),
  title: z.string().trim().max(140).default(""),
  channelName: z.string().trim().max(80).default(""),
  /** Gösterime hazır süre dizesi ("12:34"); çözülemezse boş. */
  duration: z.string().trim().max(16).default(""),
  /** `/shorts/` yolundan geldi mi? Adres şeklinden gelir, render türetmez. */
  shorts: z.boolean().default(false),
  /**
   * Küçük görsel gerçekten dikey mi (`oardefault`, 1080×1920). `shorts` tek
   * başına yetmez: bir Short'un `mqdefault`'u da 16:9 gelir ve 9:16 çerçeveye
   * oturtulunca ağır kırpılır. Kayıt anında doğrulanır.
   */
  verticalThumbnail: z.boolean().default(false),
  // KTD35: `mqdefault` (320×180, gerçek 16:9 ve her videoda var). `hqdefault`
  // 4:3 ve siyah bantlı olduğu için hiçbir yolda kullanılmaz.
  thumbnail: optionalHttpUrlSchema.default(""),
});

const youtubeChannelDataSchema = z.object({
  kind: z.literal("channel"),
  url: optionalHttpUrlSchema.default(""),
  /** `UC…` biçimindeki kanonik kanal kimliği; RSS akışının anahtarı. */
  channelId: youtubeIdSchema(32),
  channelName: z.string().trim().max(80).default(""),
  /** `@` olmadan saklanır. */
  handle: z.string().trim().max(80).default(""),
  /** Gösterime hazır, yerelleştirilmiş dizeler; çözülemezse boş kalır. */
  subscribers: z.string().trim().max(32).default(""),
  views: z.string().trim().max(32).default(""),
  /** Kanal avatarı (uzak adres; render proxy'den geçirir). */
  thumbnail: optionalHttpUrlSchema.default(""),
});

const youtubeBlockSchema = z.object({
  ...blockBase,
  type: z.literal("youtube"),
  data: z.discriminatedUnion("kind", [youtubeVideoDataSchema, youtubeChannelDataSchema]),
});

export type YoutubeBlockData = z.infer<typeof youtubeBlockSchema>["data"];
export type YoutubeKind = YoutubeBlockData["kind"];

export const profileBlockSchema = z.discriminatedUnion("type", [
  profileCardSchema,
  socialBlockSchema,
  linkBlockSchema,
  textBlockSchema,
  imageBlockSchema,
  statusBlockSchema,
  galleryBlockSchema,
  youtubeBlockSchema,
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
  gallery: "Galeri",
  youtube: "YouTube",
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
    case "gallery":
      return block.data.photos.length ? null : "Galeriye fotoğraf ekle";
    case "youtube":
      // KTD34: çözüm kayıt anında yapılır; kimliği boş bir blok, adres
      // yapıştırılmamış ya da çözülememiş demektir — ikisinde de render
      // edilecek bir şey yok.
      return block.data.kind === "video"
        ? block.data.videoId
          ? null
          : "YouTube video bağlantısı gir"
        : block.data.channelId
          ? null
          : "YouTube kanal bağlantısı gir";
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
//
// NEDEN mevcut tiplerin tavanı DARALTILMIYOR: `ensureLayoutPositions` bu
// tabloyu küçültücü bir kırpma olarak uyguluyor. Bir tipin `maxW`'sini
// düşürmek, o boyutta yazılmış canlı sayfaları ilk açılışta sessizce
// daraltırdı — düzeltilen değil, üretilen bir kusur olurdu. Yeni tipler ise
// sıfırdan karar veriliyor.
export const BLOCK_GRID_LIMITS: Record<
  BentoBlockType,
  { minW: number; minH: number; maxW: number; maxH: number }
> = {
  link: { minW: 1, minH: 1, maxW: 4, maxH: 2 },
  social: { minW: 1, minH: 1, maxW: 4, maxH: 3 },
  text: { minW: 1, minH: 1, maxW: 4, maxH: 3 },
  image: { minW: 1, minH: 1, maxW: 4, maxH: 3 },
  status: { minW: 1, minH: 1, maxW: 4, maxH: 1 },
  // Galeri her tile boyutunda bir düzene sahip (KTD37/KTD38), 1×1 dahil;
  // tavan sözlüğün en büyük biçimi olan 4×2.
  gallery: { minW: 1, minH: 1, maxW: 4, maxH: 2 },
  // YouTube kartının görsel odağı 16:9 bir küçük görsel. 1 track'te (masaüstü
  // 181px, mobil 169px) başlık + kanal adıyla birlikte okunaklı durmuyor;
  // taban 2 track. Video ve kanal aynı sınırları paylaşır ki tip değiştirmek
  // bloğu yeniden boyutlandırmasın.
  youtube: { minW: 2, minH: 1, maxW: 4, maxH: 2 },
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
 * R62: hesap başına galeri sayısı sınırı. Tek blok kendi başına belgede kaç
 * galeri olduğunu bilemez, bu yüzden kural belge düzeyindedir.
 */
export function galleryCountIssue(layout: ProfileLayout): string | null {
  const count = layout.blocks.filter((block) => block.type === "gallery").length;
  return count > MAX_GALLERY_BLOCKS
    ? `Sayfanda en fazla ${MAX_GALLERY_BLOCKS} galeri bloğu olabilir`
    : null;
}

/**
 * Yazma şeması (R6, R62): okuma şemasının üstüne tip başına min/maks boyut
 * kontrolünü ve galeri sayısı sınırını ekler. Okuma tarafına bilinçli olarak
 * eklenmez — eskiden yazılmış, sınırı aşan bir blok yüzünden yayındaki sayfa
 * kararmasın. Hem taslağa kaydetme (`PUT /api/profile/layout`) hem yayınlama
 * (`POST /api/profile/publish`) bu şemadan geçtiği için sınır iki yolda da
 * tutar; blok başına 5 fotoğraf kuralı zaten şemanın kendisinde.
 */
export const profileLayoutWriteSchema = profileLayoutSchema.superRefine(
  (layout, context) => {
    layout.blocks.forEach((block, index) => {
      const message = blockGridLimitIssue(block);
      if (message) {
        context.addIssue({ code: "custom", path: ["blocks", index, "pos"], message });
      }
    });
    const galleryMessage = galleryCountIssue(layout);
    if (galleryMessage) {
      context.addIssue({ code: "custom", path: ["blocks"], message: galleryMessage });
    }
  },
);

export function sizeToDims(size: BlockSize): { w: number; h: number } {
  const [w, h] = size.split("x");
  return { w: Number(w), h: Number(h) };
}

/**
 * Izgara ölçüsünü sözlük etiketine indirger. Sözlüğün basamakları (genişlik
 * 1/2/4, yükseklik 1/2) ile birebir örtüştüğü için her etiket gidiş-dönüşten
 * kendisi olarak çıkar: `sizeFromDims(sizeToDims(s)) === s`. Dönüş tipi
 * şablon literalinden türer — sözlüğe yeni bir basamak eklendiğinde burası
 * derleme hatası verir, sessizce yanlış etiket üretmez.
 *
 * Ara ölçüler (w=3, h=3…) sözlükte karşılığı olmadığı için bir alt basamağa
 * yuvarlanır; gerçek yerleşim zaten `pos`tan okunur, `size` yalnız `pos`suz
 * eski kayıtların akış sınıfı içindir.
 */
export function sizeFromDims(w: number, h: number): BlockSize {
  const width: 1 | 2 | 4 = w >= 4 ? 4 : w >= 2 ? 2 : 1;
  const height: 1 | 2 = h >= 2 ? 2 : 1;
  return `${width}x${height}`;
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
