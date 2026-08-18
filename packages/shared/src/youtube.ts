// YouTube'un saf kuralları: URL sınıflandırma, adres kurucular ve
// ayrıştırıcılar. Ağ çağrısı YOK — çağrı katmanı `apps/web/server/youtube.ts`.
//
// NEDEN ANAHTARSIZ: ürün bilinçli olarak vendor API anahtarı almıyor (plan
// KD5). Video başlığı oEmbed'den, kanal kimliği kanal sayfasının `og:url`
// meta'sından, kanalın son videosu da RSS akışından gelir. Üçü de anahtarsız
// ve kotasız.
//
// KIRILGANLIK: oEmbed ve RSS resmî uçlardır; kanal `UC…` çözümü ise bir
// scrape'tir. Bozulursa `packages/shared/src/fixtures/youtube-channel-*.html`
// fixture'ını tazeleyip `parseYouTubeChannelIdFromHtml`'e bak.

/** YouTube video kimliği: 11 karakter, base64url alfabesi. */
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
/** Kanal kimliği: `UC` + 22 karakter. */
const CHANNEL_ID_PATTERN = /^UC[A-Za-z0-9_-]{22}$/;
/** `@handle`: YouTube 3-30 karakter, harf/rakam/nokta/alt tire/tire kabul eder. */
const HANDLE_PATTERN = /^[A-Za-z0-9._-]{3,30}$/;
/** Eski `/c/` ve `/user/` adları. */
const LEGACY_NAME_PATTERN = /^[A-Za-z0-9._%+-]{1,64}$/;

const VIDEO_PAGE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);
const SHORT_LINK_HOSTS = new Set(["youtu.be", "www.youtu.be"]);

/** Sunucunun istek atmasına izin verilen YouTube host'ları (SSRF kapısı). */
export const YOUTUBE_ALLOWED_HOSTS = new Set([
  ...VIDEO_PAGE_HOSTS,
  ...SHORT_LINK_HOSTS,
  "i.ytimg.com",
  "img.youtube.com",
]);

/**
 * `maxresdefault` yokluğunda YouTube 1097 baytlık gri bir vekil görsel döner —
 * bazen 404, bazen 200 ile. Yani yalnız durum kodu YETMEZ; boyut da bu eşiği
 * geçmeli (ölçüm: gerçek mq/maxres görselleri 8 KB'tan büyük).
 */
export const YOUTUBE_THUMBNAIL_MIN_BYTES = 4096;

export type YouTubeThumbnailQuality = "mq" | "maxres";

/**
 * Shorts'un GERÇEK dikey küçük görseli. Ölçüm (2026-08-18): `mqdefault` ve
 * `maxresdefault` bir Short için de 16:9 döner (320×180 / 1280×720), yani
 * dikey bir çerçeveye `cover` ile oturtulunca genişliğin çoğu kırpılır.
 * `oardefault` ise 1080×1920 — Short'un kendi oranı.
 *
 * Ayrıca güvenilir bir Shorts göstergesidir: normal videolarda 404 döner
 * (beş örnekte doğrulandı). Adres şekli `/shorts/` yolunu gerektirirken bu
 * dosyanın varlığı içeriğin gerçekten dikey olduğunu söyler.
 */
export function youtubeVerticalThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/oardefault.jpg`;
}

export type YouTubeRef =
  /** Kimliği doğrudan URL'den okunan video. */
  | { kind: "video"; videoId: string; shorts: boolean }
  /** `UC…` kimliği URL'de olan kanal — ek çözüm gerekmez. */
  | { kind: "channel"; channelId: string }
  /** `@handle`, `/c/…`, `/user/…` — `UC…` için kanal sayfası okunmalı. */
  | { kind: "channel-ref"; refKind: "handle" | "custom" | "user"; ref: string }
  /** YouTube değil ya da desteklenmeyen bir YouTube yolu. */
  | { kind: "none"; reason: "invalid" | "not-youtube" | "unsupported" };

function none(reason: "invalid" | "not-youtube" | "unsupported"): YouTubeRef {
  return { kind: "none", reason };
}

/** Şemasız yapıştırılan adresler ("youtube.com/@x") de kabul edilir. */
function toUrl(raw: string): URL | null {
  const value = (raw ?? "").trim();
  if (!value || value.length > 2048) return null;
  for (const candidate of [value, `https://${value}`]) {
    try {
      const url = new URL(candidate);
      if (url.protocol === "http:" || url.protocol === "https:") return url;
      // Şema var ama http(s) değil (Değişmez #8): ikinci denemeye geçme.
      return null;
    } catch {
      // Sıradaki adayı dene.
    }
  }
  return null;
}

function segments(pathname: string): string[] {
  return pathname.split("/").filter(Boolean);
}

function decodeSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Bir URL'in YouTube videosu mu kanal mı olduğunu ve kimliğini çıkarır.
 * Saf ve senkron: kayıt anında bir kez çağrılır (plan KTD34).
 */
export function classifyYouTubeUrl(raw: string): YouTubeRef {
  const url = toUrl(raw);
  if (!url) return none("invalid");
  const host = url.hostname.toLowerCase().replace(/\.$/, "");

  if (SHORT_LINK_HOSTS.has(host)) {
    const [id] = segments(url.pathname);
    if (!id) return none("unsupported");
    return VIDEO_ID_PATTERN.test(id)
      ? { kind: "video", videoId: id, shorts: false }
      : none("unsupported");
  }

  if (!VIDEO_PAGE_HOSTS.has(host)) return none("not-youtube");

  const parts = segments(url.pathname);
  const [first, second] = parts;

  if (!first) return none("unsupported");

  // `@handle` her şeyden önce gelir: `/@kanal/live` bir video yolu değildir.
  if (first.startsWith("@")) {
    const handle = decodeSegment(first.slice(1));
    return HANDLE_PATTERN.test(handle)
      ? { kind: "channel-ref", refKind: "handle", ref: handle }
      : none("unsupported");
  }

  if (first === "watch") {
    const id = url.searchParams.get("v") ?? "";
    return VIDEO_ID_PATTERN.test(id)
      ? { kind: "video", videoId: id, shorts: false }
      : none("unsupported");
  }

  if (first === "shorts" || first === "embed" || first === "live" || first === "v") {
    const id = second ?? "";
    return VIDEO_ID_PATTERN.test(id)
      ? { kind: "video", videoId: id, shorts: first === "shorts" }
      : none("unsupported");
  }

  if (first === "channel") {
    const id = second ?? "";
    return CHANNEL_ID_PATTERN.test(id) ? { kind: "channel", channelId: id } : none("unsupported");
  }

  if (first === "c" || first === "user") {
    // Doğrulama HAM segmentte yapılır (yüzde kodu hâlâ alfabede); çözüm sonrası
    // ada boşluk gibi karakterler girebilir ve adres kurucu onu yeniden kodlar.
    const raw = second ?? "";
    return LEGACY_NAME_PATTERN.test(raw)
      ? { kind: "channel-ref", refKind: first === "c" ? "custom" : "user", ref: decodeSegment(raw) }
      : none("unsupported");
  }

  // `/playlist`, `/results`, `/feed/…` gibi yollar widget'a dönüşmez.
  return none("unsupported");
}

/** Video kimliği geçerli mi? (Blok verisi dışarıdan gelebilir.) */
export function isYouTubeVideoId(value: string): boolean {
  return VIDEO_ID_PATTERN.test(value);
}

/** Kanal kimliği geçerli mi? */
export function isYouTubeChannelId(value: string): boolean {
  return CHANNEL_ID_PATTERN.test(value);
}

/**
 * Video küçük görseli. `hqdefault` BİLEREK yok: 4:3 ve siyah bantlı
 * (plan KTD35). `mqdefault` her zaman var ve gerçek 16:9'dur.
 */
export function youtubeThumbnailUrl(videoId: string, quality: YouTubeThumbnailQuality): string {
  const file = quality === "maxres" ? "maxresdefault" : "mqdefault";
  return `https://i.ytimg.com/vi/${videoId}/${file}.jpg`;
}

/** Videonun kanonik izleme adresi. */
export function youtubeVideoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/** Anahtarsız oEmbed ucu: başlık ve kanal adı. Kanallarda 404 döner. */
export function youtubeOEmbedUrl(videoId: string): string {
  const target = encodeURIComponent(youtubeVideoUrl(videoId));
  return `https://www.youtube.com/oembed?url=${target}&format=json`;
}

/** Kanal RSS akışı: ~26 KB, anahtarsız, kotasız (plan KTD36). */
export function youtubeChannelFeedUrl(channelId: string): string {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
}

/** Kanalın kanonik adresi. */
export function youtubeChannelUrl(channelId: string): string {
  return `https://www.youtube.com/channel/${channelId}`;
}

/** `UC…` çözümü için okunacak kanal sayfası adresi. */
export function youtubeChannelRefUrl(refKind: "handle" | "custom" | "user", ref: string): string {
  const name = encodeURIComponent(ref);
  if (refKind === "handle") return `https://www.youtube.com/@${name}`;
  return `https://www.youtube.com/${refKind === "custom" ? "c" : "user"}/${name}`;
}

const META_TAG_PATTERN = /<meta\s[^>]*>/gi;

/**
 * Kanal sayfasının HTML'inden `UC…` kimliğini çıkarır.
 *
 * NEDEN `og:url`: sayfada `UC` + 22 karakter kalıbına uyan onlarca base64
 * parçası var ve naif ilk-eşleşme grep'i BAŞKA bir kanalın kimliğini
 * döndürüyor (ölçüldü: @MrBeast sayfasında ilk eşleşme `UCvFHBqiftcFfbYGsMchSMTC`,
 * doğrusu `UCX6OQ3DkcsbYNE6H8uQQuVA`). `og:url` kanonik kanal adresidir.
 */
export function parseYouTubeChannelIdFromHtml(html: string): string | null {
  const candidates: string[] = [];
  for (const tag of html.match(META_TAG_PATTERN) ?? []) {
    const key = /(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase();
    if (key !== "og:url") continue;
    const content = /content\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (content) candidates.push(content);
  }
  // `og:url` yoksa kanonik link aynı bilgiyi taşır.
  const canonical = /<link\s[^>]*rel\s*=\s*["']canonical["'][^>]*>/i.exec(html)?.[0];
  const canonicalHref = canonical
    ? /href\s*=\s*["']([^"']+)["']/i.exec(canonical)?.[1]
    : undefined;
  if (canonicalHref) candidates.push(canonicalHref);

  for (const candidate of candidates) {
    const ref = classifyYouTubeUrl(decodeXmlEntities(candidate));
    if (ref.kind === "channel") return ref.channelId;
  }
  return null;
}

export type YouTubeVideoMeta = {
  title: string | null;
  channelName: string | null;
  channelUrl: string | null;
};

/**
 * oEmbed yanıtını okur. `thumbnail_url` BİLEREK yok sayılır: oEmbed
 * `hqdefault` verir (plan KTD35), küçük görseli video kimliğinden kendimiz
 * kurarız.
 */
export function parseYouTubeOEmbed(raw: unknown): YouTubeVideoMeta | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const title = typeof value.title === "string" ? value.title.trim() : "";
  const author = typeof value.author_name === "string" ? value.author_name.trim() : "";
  const authorUrl = typeof value.author_url === "string" ? value.author_url.trim() : "";
  if (!title && !author) return null;
  return {
    title: title || null,
    channelName: author || null,
    channelUrl: authorUrl || null,
  };
}

export type YouTubeFeedVideo = {
  videoId: string;
  title: string;
  /** ISO 8601, akıştan olduğu gibi. */
  publishedAt: string;
  /** `media:statistics` okunamazsa null. */
  views: number | null;
  /** Akıştaki `link rel="alternate"` `/shorts/` gösteriyorsa true. */
  short: boolean;
};

export type YouTubeChannelFeed = {
  channelId: string;
  channelTitle: string;
  /** Akış sırası korunur: en yeni video ilk sıradadır. */
  videos: YouTubeFeedVideo[];
};

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  "#39": "'",
};

function decodeXmlEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, body: string) => {
    const key = body.toLowerCase();
    const named = NAMED_ENTITIES[key];
    if (named) return named;
    if (key.startsWith("#x")) {
      const code = Number.parseInt(key.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    if (key.startsWith("#")) {
      const code = Number.parseInt(key.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return match;
  });
}

function tagText(xml: string, tag: string): string | null {
  const pattern = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i");
  const match = pattern.exec(xml);
  return match?.[1] === undefined ? null : decodeXmlEntities(match[1]).trim();
}

/**
 * Kanal RSS akışını ayrıştırır (plan KTD36). Akış Atom'dur; XML ayrıştırıcı
 * yerine hedefli regex kullanılır — Workers'ta DOMParser yok ve akışın şekli
 * dar. Beklenmedik bir gövde geldiğinde null döner ve widget sessizce
 * son bilinen hâlinde kalır.
 */
export function parseYouTubeChannelFeed(xml: string): YouTubeChannelFeed | null {
  if (!xml.includes("<feed")) return null;
  const firstEntry = xml.indexOf("<entry>");
  const head = firstEntry === -1 ? xml : xml.slice(0, firstEntry);

  // Akış kökündeki `<yt:channelId>` "UC" önekini DÜŞÜRÜYOR (ölçüldü:
  // `X6OQ3DkcsbYNE6H8uQQuVA`), bu yüzden kimlik kanonik kanal linkinden okunur.
  let channelId: string | null = null;
  for (const href of head.match(/href\s*=\s*"([^"]+)"/gi) ?? []) {
    const value = /href\s*=\s*"([^"]+)"/i.exec(href)?.[1];
    if (!value) continue;
    const ref = classifyYouTubeUrl(decodeXmlEntities(value));
    if (ref.kind === "channel") {
      channelId = ref.channelId;
      break;
    }
  }
  if (!channelId) return null;

  const channelTitle = tagText(head, "title") ?? "";

  const videos: YouTubeFeedVideo[] = [];
  for (const entry of xml.match(/<entry>[\s\S]*?<\/entry>/gi) ?? []) {
    const videoId = tagText(entry, "yt:videoId");
    if (!videoId || !VIDEO_ID_PATTERN.test(videoId)) continue;
    const alternate = /<link\s[^>]*rel\s*=\s*"alternate"[^>]*href\s*=\s*"([^"]+)"/i.exec(entry)?.[1];
    const views = /<media:statistics\s[^>]*views\s*=\s*"(\d+)"/i.exec(entry)?.[1];
    videos.push({
      videoId,
      title: tagText(entry, "title") ?? "",
      publishedAt: tagText(entry, "published") ?? "",
      views: views === undefined ? null : Number(views),
      short: Boolean(alternate && decodeXmlEntities(alternate).includes("/shorts/")),
    });
  }
  if (videos.length === 0) return null;

  return { channelId, channelTitle, videos };
}
