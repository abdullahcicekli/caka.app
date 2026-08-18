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
  // Genişlik de YARIM BİRİM: tavan 8 = eski 4 kolon.
  w: z.number().int().min(1).max(8),
  // Yükseklik YARIM SATIR birimindedir (bkz. GRID_UNIT). Tip tavanı en
  // çok 6 (3 tam satır) ama şema 8'e kadar kabul eder: bayat bir sekmeden
  // gelen tam satırlık değer çevrildiğinde 8'e çıkabiliyor ve buradan
  // düşerse kullanıcı ham zod mesajını görürdü — asıl ret `grid_limits:*`
  // koduyla `blockGridLimitIssue`'dan gelmeli.
  h: z.number().int().min(1).max(8),
});
export type GridPosition = z.infer<typeof gridPositionSchema>;

// R7: desktop 4 kolon, mobil 2 kolon — ızgara YARIM BİRİME geçtiği için
// sayılar iki katı (8 / 4). Genişlik basamakları birebir korunuyor:
// 748px'lik tuvalde 8 kolon 83px eder, 2 birim = 178px (eski 1 kolon),
// 4 birim = 368px (eski 2 kolon), 8 birim = 748px (eski 4 kolon).
export const GRID_COLUMNS = { lg: 8, sm: 4 } as const;

/**
 * IZGARA BİRİMİ = ESKİ HÜCRENİN YARISI (her iki eksende).
 *
 * Hücre 178×156'yken kullanıcının elindeki basamaklar çok kabaydı: bir kartı
 * ya 156 ya 324 yükseklikte, ya 178 ya 368 genişlikte yapabiliyordu. Ölçüm:
 * og önizlemeli bir sosyal kartın içeriği 269px istiyor — 156'da görsel
 * kırpılıyor, 324'te altında 85px ölü alan kalıyor ve kart arada duramıyordu.
 *
 * Hücre ikiye bölündü (83×72 + 12 boşluk). ESKİ BASAMAKLARIN HEPSİ DURUYOR —
 * 2 birim = eski 1 hücre, 4 birim = eski 2 hücre — aralarına yenileri girdi:
 * genişlikte 273/463/653, yükseklikte 240/408.
 *
 * Kart TABANLARI küçülmedi: `BLOCK_GRID_LIMITS`'teki minimumlar da ikiye
 * katlandı, yani hiçbir kart eskisinden dar/kısa olamıyor. Değişen tek şey
 * basamak aralığı. (Gerçekten küçük bir kart — 83px'lik ikon karesi — ayrı
 * bir kart tasarımı ister, ızgara meselesi değil.)
 *
 * Bu yüzden depodaki `x`/`y`/`w`/`h` iki katına çıktı; eski kayıtlar
 * `parseProfileLayoutDetailed` içinde okunurken bir kez çevriliyor
 * (`grid` işareti yoksa eski kayıt sayılır).
 */
export const GRID_UNIT = 2;

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
    /**
     * Kartta görünen başlık. İSTEĞE BAĞLI: platformun kendi adına eşitse
     * (ve yeni bloklar öyle doğar) kart onu basmaz — "Web sitesi" gibi
     * hiçbir şey söylemeyen bir satır olurdu. Kullanıcı kendi başlığını
     * yazarsa görünür.
     */
    label: z.string().trim().max(60),
    // Bağlantının og:image önizlemesi; her zaman çekilip saklanır,
    // yalnız 1x1'den büyük kartlarda gösterilir.
    ogImage: optionalHttpUrlSchema.default(""),
    // Sitenin favicon'u (kayıt anında sayfadan okunur ya da /favicon.ico'dan
    // türetilir). Ziyaretçiye imzalı proxy'den servis edilir.
    favicon: optionalHttpUrlSchema.default(""),
  }),
});

const linkBlockSchema = z.object({
  ...blockBase,
  type: z.literal("link"),
  data: z.object({
    /** İsteğe bağlı başlık; boşsa kart yalnız adresi yazar. */
    title: z.string().trim().max(60).default(""),
    url: optionalHttpUrlSchema,
    // R60: bağlantının og:image önizlemesi — `social` bloğundakiyle aynı
    // sözleşme (kayıt anında çekilir, saklanır, render yeniden çekmez).
    ogImage: optionalHttpUrlSchema.default(""),
    favicon: optionalHttpUrlSchema.default(""),
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

/**
 * Spotify gömme türleri. Hepsi `open.spotify.com/embed/<tür>/<id>` ile
 * gömülüyor ve oEmbed anahtarsız çalışıyor (ölçüldü 2026-08-18): parça
 * 456×152 kompakt oynatıcı, diğerleri 456×352.
 */
export const spotifyKindSchema = z.enum([
  "track",
  "album",
  "playlist",
  "artist",
  "episode",
  "show",
]);
export type SpotifyKind = z.infer<typeof spotifyKindSchema>;

const spotifyBlockSchema = z.object({
  ...blockBase,
  type: z.literal("spotify"),
  data: z.object({
    kind: spotifyKindSchema,
    /** Kanonik `open.spotify.com` adresi; kayıt anında normalize edilir. */
    url: optionalHttpUrlSchema.default(""),
    /** Base62 kimlik; gömme adresi bundan kurulur. */
    entityId: z
      .string()
      .trim()
      .max(40)
      .regex(/^[A-Za-z0-9]*$/, "Geçersiz Spotify kimliği")
      .default(""),
    title: z.string().trim().max(140).default(""),
    /**
     * Kapak görseli (uzak adres; render imzalı proxy'den geçirir).
     *
     * Sanatçı/sahip adı için ALAN YOK: oEmbed yalnız `title` veriyor
     * (parçada şarkı adı, albümde albüm adı), yani dolduramayacağımız bir
     * yuva olurdu.
     */
    thumbnail: optionalHttpUrlSchema.default(""),
  }),
});

const youtubeChannelDataSchema = z.object({
  kind: z.literal("channel"),
  url: optionalHttpUrlSchema.default(""),
  /** `UC…` biçimindeki kanonik kanal kimliği; RSS akışının anahtarı. */
  channelId: youtubeIdSchema(32),
  channelName: z.string().trim().max(80).default(""),
  /** `@` olmadan saklanır. */
  handle: z.string().trim().max(80).default(""),
  /**
   * Kanal avatarı — kanal sayfasının `og:image`'ı, kayıt anında çözülür.
   * Uzak adres; render imzalı proxy'den geçirir. RSS akışı avatar vermiyor.
   */
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
  spotifyBlockSchema,
]);

/**
 * Favicon'un imzalı proxy yolu, og görselinin yanında AYNI eşlemede taşınır.
 * Ayrı bir eşleme üç loader'ın, `ProfileCanvas`'ın ve editörün imza
 * tesisatını ikiye katlardı; anahtar biçimi bu yüzden burada, iki tarafın da
 * gördüğü yerde tanımlı (sunucu `server/layout-images.ts`, istemci
 * `components/profile-block.tsx`).
 */
export function faviconImageKey(blockId: string): string {
  return `${blockId}#favicon`;
}

export const MAX_LAYOUT_BLOCKS = 50;

/** Belgeyi ayakta tutan tek yapısal kural; hem şemada hem kurtarmalı
 * ayrıştırmada aynı yerden okunur ki ikisi ayrışmasın. */
function profileBlockCountIssue(blocks: readonly { type: string }[]): string | null {
  return blocks.filter((block) => block.type === "profile").length === 1
    ? null
    : "Düzende tam olarak bir profil bloğu bulunmalı";
}

export const profileLayoutSchema = z.object({
  /**
   * Izgara birimi işareti; bkz. `layoutEnvelopeSchema.grid`. Varsayılanlı ve
   * çıktıda ZORUNLU: düzen nesnesi kuran her yer bunu yazmak zorunda, yoksa
   * kayıt eski sanılır ve okunurken ölçüler bir kez daha ikiye katlanırdı.
   * Derleyici eksik bırakan çağrı yerinde durur.
   */
  grid: z.literal(GRID_UNIT).default(GRID_UNIT),
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
  /**
   * Izgara biriminin sürümü. Yoksa kayıt ESKİ HÜCRE birimiyle yazılmıştır
   * (178×156) ve okunurken her iki eksende bir kez ikiye katlanır. Belge
   * `version`ı bilinçli olarak 1'de sabit (bkz. yukarısı: sürüm yükseltmek
   * eski deploy için tek yönlü kapı); bu alan onun yerine geçen, eski kodun
   * görmezden geldiği bir işaret.
   */
  grid: z.literal(GRID_UNIT).optional(),
  blocks: z.array(z.unknown()).max(MAX_LAYOUT_BLOCKS),
});

/** Eski hücre biriminde yazılmış bir konumu yarım birime çevirir. */
function toHalfUnits(pos: GridPosition): GridPosition {
  return {
    x: pos.x * GRID_UNIT,
    y: pos.y * GRID_UNIT,
    w: pos.w * GRID_UNIT,
    h: pos.h * GRID_UNIT,
  };
}

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

  // Eski kayıt: ölçüler eski hücre biriminde. Bir kez çevrilir; sonuç
  // kaydedilince `grid` işaretiyle yazılır ve çevrim bir daha çalışmaz.
  const legacyGrid = envelope.data.grid !== GRID_UNIT;

  const blocks: ProfileBlock[] = [];
  const unknownBlocks: unknown[] = [];
  for (const candidate of envelope.data.blocks) {
    const parsed = profileBlockSchema.safeParse(candidate);
    if (!parsed.success) {
      unknownBlocks.push(candidate);
      continue;
    }
    const block = parsed.data;
    blocks.push(
      legacyGrid && block.pos
        ? { ...block, pos: { lg: toHalfUnits(block.pos.lg), sm: toHalfUnits(block.pos.sm) } }
        : block,
    );
  }
  if (profileBlockCountIssue(blocks)) return null;
  return { layout: { version: 1, grid: GRID_UNIT, blocks }, unknownBlocks };
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
  // `grid` her yazımda damgalanır: işaretsiz kayıt okunurken eski sayılır ve
  // ölçüler ikinci kez katlanırdı.
  return JSON.stringify({
    ...layout,
    grid: GRID_UNIT,
    blocks: unknownBlocks.length === 0 ? layout.blocks : [...layout.blocks, ...unknownBlocks],
  });
}

export function createBlockId(): string {
  return `blk_${crypto.randomUUID().slice(0, 8)}`;
}

// Taslak/yayınla modeli: şema yarım bloklara izin verir (taslak kaydı),
// yayın öncesi eksikler aşağıdaki kurallarla yüzeye çıkarılır.
/**
 * Blok sorunlarının kimlikleri. Metin DEĞİL kimlik döndürülür: mesajlar
 * kullanıcıya görünür ve beş dile çevrilir (`content/app`), bu katman ise saf
 * kural katmanıdır ve dil bilmez.
 */
export const BLOCK_ISSUE_IDS = [
  "profile_name",
  "social_target",
  "link_url",
  "link_title",
  "text_empty",
  "status_empty",
  "image_missing",
  "gallery_empty",
  "youtube_video_url",
  "youtube_channel_url",
  "spotify_url",
] as const;

export type BlockIssueId = (typeof BLOCK_ISSUE_IDS)[number];

export type BlockIssue = {
  blockId: string;
  type: ProfileBlock["type"];
  issue: BlockIssueId;
};

/** Blok yayına hazır mı? Değilse sorunun kimliği. */
export function blockIssue(block: ProfileBlock): BlockIssueId | null {
  switch (block.type) {
    case "profile":
      return block.data.name ? null : "profile_name";
    case "social":
      // E-posta gibi bazı platformlarda http(s) URL üretilmez (KTD8: kullanıcı
      // URL'leri yalnız http(s)); orada dolu `handle` yeterli sayılır.
      return block.data.url || block.data.handle ? null : "social_target";
    case "link":
      if (!block.data.url) return "link_url";
      return block.data.title ? null : "link_title";
    case "text":
      return block.data.text ? null : "text_empty";
    case "status":
      return block.data.text ? null : "status_empty";
    case "image":
      return block.data.assetId ? null : "image_missing";
    case "gallery":
      return block.data.photos.length ? null : "gallery_empty";
    case "youtube":
      // KTD34: çözüm kayıt anında yapılır; kimliği boş bir blok, adres
      // yapıştırılmamış ya da çözülememiş demektir — ikisinde de render
      // edilecek bir şey yok.
      return block.data.kind === "video"
        ? block.data.videoId
          ? null
          : "youtube_video_url"
        : block.data.channelId
          ? null
          : "youtube_channel_url";
    case "spotify":
      // YouTube'la aynı gerekçe: kimlik kayıt anında çözülür, boşsa gömülecek
      // bir şey yok.
      return block.data.entityId ? null : "spotify_url";
  }
}

/** Yayın öncesi eksik blokların listesi; boşsa yayınlanabilir. */
export function layoutIssues(layout: ProfileLayout): BlockIssue[] {
  return layout.blocks.flatMap((block) => {
    const issue = blockIssue(block);
    return issue ? [{ blockId: block.id, type: block.type, issue }] : [];
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
export type BlockGridLimits = { minW: number; minH: number; maxW: number; maxH: number };

export const BLOCK_GRID_LIMITS: Record<BentoBlockType, BlockGridLimits> = {
  // Ölçüler YARIM BİRİMDE (GRID_UNIT): 2 = eski 1 hücre. Minimumlar da
  // katlandı, yani hiçbir kartın tabanı küçülmedi — yalnız basamak sıklaştı.
  link: { minW: 2, minH: 2, maxW: 8, maxH: 4 },
  social: { minW: 2, minH: 2, maxW: 8, maxH: 6 },
  text: { minW: 2, minH: 2, maxW: 8, maxH: 6 },
  image: { minW: 2, minH: 2, maxW: 8, maxH: 6 },
  status: { minW: 2, minH: 1, maxW: 8, maxH: 2 },
  // Galeri her tile boyutunda bir düzene sahip (KTD37/KTD38), 1×1 dahil;
  // tavan sözlüğün en büyük biçimi olan 4×2.
  gallery: { minW: 2, minH: 2, maxW: 8, maxH: 4 },
  // YouTube kartı yerinde OYNATILIYOR, yani boyutu bir oynatıcı boyutudur.
  // Ölçüm: 2 track genişlikte (masaüstü 374px) 16:9 bir video 210px yükseklik
  // ister; 1 track yalnız 156px (mobilde 138px) veriyor, yani oynatıcı ya
  // kırpılır ya kıymık gibi kalırdı. Taban bu yüzden 2x2. Video ve kanal
  // aynı sınırları paylaşır ki tip değiştirmek bloğu yeniden boyutlandırmasın.
  youtube: { minW: 4, minH: 4, maxW: 8, maxH: 4 },
  // Spotify'ın kompakt parça oynatıcısı 152px (ölçüldü); masaüstünde 2x1
  // (374x156) buna tam oturuyor, o yüzden yükseklik tabanı 1. Genişlik tabanı
  // 2: 181px'lik bir oynatıcıda kontroller sığmıyor. Albüm/liste/sanatçı
  // gömmesi 352px istediği için onların varsayılanı 2x2 (kayıt anında seçilir).
  spotify: { minW: 4, minH: 2, maxW: 8, maxH: 4 },
};

/** Bloğun konumu tip sınırlarını aşıyor mu? Aşıyorsa bloğun sınırları. */
export function blockGridLimitIssue(block: ProfileBlock): BlockGridLimits | null {
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
      return limits;
    }
  }
  return null;
}

export type GridLimitIssue = {
  blockId: string;
  type: ProfileBlock["type"];
  limits: BlockGridLimits;
};

/** Tip sınırlarını aşan blokların listesi; boşsa düzen kaydedilebilir. */
export function layoutGridLimitIssues(layout: ProfileLayout): GridLimitIssue[] {
  return layout.blocks.flatMap((block) => {
    const limits = blockGridLimitIssue(block);
    return limits ? [{ blockId: block.id, type: block.type, limits }] : [];
  });
}

/**
 * R62: hesap başına galeri sayısı sınırı. Tek blok kendi başına belgede kaç
 * galeri olduğunu bilemez, bu yüzden kural belge düzeyindedir.
 */
export function galleryCountIssue(layout: ProfileLayout): boolean {
  const count = layout.blocks.filter((block) => block.type === "gallery").length;
  return count > MAX_GALLERY_BLOCKS;
}

/**
 * Yazma şeması (R6, R62): okuma şemasının üstüne tip başına min/maks boyut
 * kontrolünü ve galeri sayısı sınırını ekler. Okuma tarafına bilinçli olarak
 * eklenmez — eskiden yazılmış, sınırı aşan bir blok yüzünden yayındaki sayfa
 * kararmasın. Hem taslağa kaydetme (`PUT /api/profile/layout`) hem yayınlama
 * (`POST /api/profile/publish`) bu şemadan geçtiği için sınır iki yolda da
 * tutar; blok başına 5 fotoğraf kuralı zaten şemanın kendisinde.
 */
/**
 * Eski hücre biriminde gelen bir bloğu yarım birime çevirir. Girdi HAM: bayat
 * bir sekmeden gelen belge henüz doğrulanmadı, bu yüzden şekil varsayılmaz.
 */
function scaleRawBlockUnits(block: unknown): unknown {
  if (!block || typeof block !== "object") return block;
  const pos = (block as { pos?: unknown }).pos;
  if (!pos || typeof pos !== "object") return block;
  const scaleSide = (side: unknown): unknown => {
    if (!side || typeof side !== "object") return side;
    const value = side as { x?: unknown; y?: unknown; w?: unknown; h?: unknown };
    const scaled: Record<string, unknown> = { ...value };
    for (const key of ["x", "y", "w", "h"] as const) {
      if (typeof value[key] === "number") scaled[key] = value[key] * GRID_UNIT;
    }
    return scaled;
  };
  const value = pos as { lg?: unknown; sm?: unknown };
  return { ...block, pos: { ...value, lg: scaleSide(value.lg), sm: scaleSide(value.sm) } };
}

/**
 * Yazma şeması. `z.preprocess`: işaretsiz gelen belge BAYAT BİR SEKMEDEN
 * geliyordur (deploy anında açık kalmış editör) ve yükseklikleri tam satır
 * birimindedir. Çevrilmeden kaydedilse `serializeProfileLayout` ona yarım
 * satır damgası vurur ve kullanıcının bütün kartları yarı boya inerdi.
 * Sınır denetimi çevrimden SONRA çalışır — tavanlar da yarım satır biriminde.
 */
export const profileLayoutWriteSchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== "object") return raw;
  const value = raw as { grid?: unknown; blocks?: unknown };
  if (value.grid === GRID_UNIT || !Array.isArray(value.blocks)) return raw;
  return { ...value, grid: GRID_UNIT, blocks: value.blocks.map(scaleRawBlockUnits) };
}, profileLayoutSchema.superRefine(
  (layout, context) => {
    layout.blocks.forEach((block, index) => {
      const limits = blockGridLimitIssue(block);
      if (limits) {
        // Mesaj dile bağlı olmamalı: doğrulama sunucuda çalışıyor, metni
        // gösteren istemci ise kendi dilinde yazıyor (`content/app`).
        context.addIssue({
          code: "custom",
          path: ["blocks", index, "pos"],
          message: `grid_limits:${block.type}`,
        });
      }
    });
    if (galleryCountIssue(layout)) {
      context.addIssue({ code: "custom", path: ["blocks"], message: "gallery_count" });
    }
  },
));

export function sizeToDims(size: BlockSize): { w: number; h: number } {
  const [w, h] = size.split("x");
  // Etiket ESKİ HÜCRE birimindedir ("2x1" = 2 kolon × 1 satır); ızgara ise
  // yarım birim sayıyor, bu yüzden iki eksende de çevriliyor.
  return { w: Number(w) * GRID_UNIT, h: Number(h) * GRID_UNIT };
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
  // `w` yarım birim: 8 birim = eski 4 kolon.
  const width: 1 | 2 | 4 = w >= 4 * GRID_UNIT ? 4 : w >= 2 * GRID_UNIT ? 2 : 1;
  // `h` yarım satır: 4 birim = 2 tam satır. Ara basamaklar (3 birim = 240px)
  // bir alt etikete yuvarlanır — etiket yalnız `pos`suz eski kayıtların akış
  // sınıfı, gerçek yerleşim `pos`tan okunur.
  const height: 1 | 2 = h >= 2 * GRID_UNIT ? 2 : 1;
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
    // kaydedemez ve kendi başına düzeltemezdi.
    //
    // Kırpma HER ZAMAN küçültücü DEĞİL: `minW` (ör. youtube 2) bir bloğu
    // genişletebilir ve `x + w <= kolon` refine'ını taşırabilir — mobilde
    // (2 sütun) x=1,w=1 bir youtube bloğu w=2'ye çıkınca 3 ederdi ve
    // sonraki kayıt kalıcı 400 verirdi. Bu yüzden genişlerken `x` sola
    // çekilir; sonuç hem sınırlara hem ızgaraya uyar ve idempotenttir.
    const limits = BLOCK_GRID_LIMITS[block.type];
    if (block.pos) {
      const clamp = (p: GridPosition, columns: number): GridPosition => {
        const w = Math.min(Math.max(p.w, limits.minW), Math.min(limits.maxW, columns));
        return {
          ...p,
          x: Math.max(0, Math.min(p.x, columns - w)),
          w,
          h: Math.min(Math.max(p.h, limits.minH), limits.maxH),
        };
      };
      const lg = clamp(block.pos.lg, GRID_COLUMNS.lg);
      const sm = clamp(block.pos.sm, GRID_COLUMNS.sm);
      return lg.x === block.pos.lg.x &&
        lg.w === block.pos.lg.w &&
        lg.h === block.pos.lg.h &&
        sm.x === block.pos.sm.x &&
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
