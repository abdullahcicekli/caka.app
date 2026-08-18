// YouTube çağrı katmanı: saf kurallar `@caka/shared/youtube`'da, ağ burada.
//
// ANAHTAR YOK (plan KD5/KTD34): video başlığı oEmbed'den, kanal `UC…` kimliği
// kanal sayfasının `og:url`'ünden, kanalın son videosu da 26 KB'lık RSS
// akışından gelir. Hiçbiri kota veya token istemez.
//
// MALİYET NEREYE DÜŞÜYOR: pahalı işler KAYIT ANINDA bir kez yapılır
// (`resolveYouTubeLink`) ve sonucu blokta saklanır; render yalnız RSS okur.
// RSS Cache API'de tutulur — github.ts'in D1 önbelleğinden farklı olarak
// burada kimlik başına global tekillik gerekmiyor: akış anonim, kotasız ve
// colo başına en fazla birkaç dakikada bir çekiliyor.
//
// HATA YUTULUR: ağ hatası ne kaydetmeyi ne sayfayı bozar. Çözümlenemeyen bir
// bağlantı yalnızca zenginleştirilmemiş blok demektir.
import { waitUntil } from "cloudflare:workers";

import {
  YOUTUBE_ALLOWED_HOSTS,
  YOUTUBE_THUMBNAIL_MIN_BYTES,
  type YouTubeChannelFeed,
  classifyYouTubeUrl,
  isYouTubeChannelId,
  parseYouTubeChannelFeed,
  parseYouTubeChannelAvatarFromHtml,
  parseYouTubeChannelIdFromHtml,
  parseYouTubeOEmbed,
  youtubeChannelFeedUrl,
  youtubeChannelRefUrl,
  youtubeChannelUrl,
  youtubeOEmbedUrl,
  youtubeThumbnailUrl,
  youtubeVerticalThumbnailUrl,
} from "@caka/shared";

import { readTextStreaming } from "./og";

const FETCH_TIMEOUT_MS = 4000;
/** Kanal sayfası ~1,3 MB; kısa timeout onu hiç bitiremez. */
const CHANNEL_PAGE_TIMEOUT_MS = 8000;
const MAX_HOPS = 3;

const OEMBED_MAX_BYTES = 64 * 1024;
const FEED_MAX_BYTES = 512 * 1024;
/**
 * Kanal sayfasında `og:url` ölçülen konumu ~735 KB (etiketler `</head>`'den
 * sonra, gövdede). Tavan onun üstünde ama sonsuz değil; okuma zaten etiket
 * bulunur bulunmaz kesiliyor.
 */
const CHANNEL_PAGE_MAX_BYTES = 1536 * 1024;

/** RSS'in önbellek ömrü: widget'ın "canlılık" gecikmesi bu (plan KTD36). */
const FEED_CACHE_SECONDS = 15 * 60;

const USER_AGENT = "caka.app (+https://caka.app; profile youtube widget)";

/** Kayıt anında çözülüp blokta saklanan video verisi. */
export type ResolvedYouTubeVideo = {
  kind: "video";
  videoId: string;
  /** URL şekli Short'a işaret ediyor mu (dikey en-boy). */
  shorts: boolean;
  title: string | null;
  channelName: string | null;
  channelUrl: string | null;
  /** Short'ta doğrulanmış `oardefault`, yoksa `maxresdefault`/`mqdefault`. */
  thumbnailUrl: string;
  /** Küçük görsel gerçekten dikey mi (9:16 çerçeve yalnız o zaman doğru). */
  verticalThumbnail: boolean;
};

/** Kayıt anında çözülüp blokta saklanan kanal verisi. */
export type ResolvedYouTubeChannel = {
  kind: "channel";
  channelId: string;
  channelName: string | null;
  channelUrl: string;
  /** Kanal sayfasının `og:image`'ı; RSS avatar vermiyor. Yoksa null. */
  avatarUrl: string | null;
};

export type ResolvedYouTube = ResolvedYouTubeVideo | ResolvedYouTubeChannel;

/**
 * Yalnız YouTube host'larına, yalnız varsayılan portlarla gider ve HER
 * yönlendirme hop'unda host'u yeniden doğrular. Risk düşük (hedefler sabit)
 * ama kural aynı kural: adres doğrulaması fetch'in yanında durur.
 */
async function youtubeFetch(
  target: string,
  init: { accept: string; timeoutMs: number; method?: "GET" | "HEAD" },
): Promise<Response | null> {
  let url = target;
  for (let hop = 0; hop <= MAX_HOPS; hop += 1) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return null;
    }
    if (parsed.protocol !== "https:") return null;
    if (parsed.port && parsed.port !== "443") return null;
    if (!YOUTUBE_ALLOWED_HOSTS.has(parsed.hostname.toLowerCase())) return null;

    let response: Response;
    try {
      response = await fetch(parsed.toString(), {
        method: init.method ?? "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(init.timeoutMs),
        headers: {
          Accept: init.accept,
          "User-Agent": USER_AGENT,
          // Kanal sayfası dilden bağımsız olsun; `og:url` her dilde aynı.
          "Accept-Language": "tr,en;q=0.8",
        },
      });
    } catch {
      return null;
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("Location");
      await response.body?.cancel().catch(() => {});
      if (!location) return null;
      try {
        url = new URL(location, parsed).toString();
      } catch {
        return null;
      }
      continue;
    }
    return response;
  }
  return null;
}

/** Gövdeyi tavana kadar metin olarak okur; tavan aşılırsa okuma kesilir. */
async function readCappedText(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder("utf-8", { fatal: false });
  let text = "";
  let total = 0;
  try {
    while (total < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      text += decoder.decode(value, { stream: true });
    }
  } catch {
    // Yarım gövde: elde ne varsa onunla ayrıştırmayı dene.
  }
  await reader.cancel().catch(() => {});
  return text;
}

/**
 * `maxresdefault` var mı? Sadece durum kodu YETMEZ: YouTube yokluk hâlinde
 * 1097 baytlık gri bir vekil görsel döndürüyor (ölçüldü: eski videolarda 404,
 * bazı Shorts'larda 200). Bu yüzden boyut da eşiği geçmeli.
 */
async function pickThumbnailUrl(
  videoId: string,
  shorts: boolean,
): Promise<{ url: string; vertical: boolean }> {
  // Short ise dikey görseli dene: `mqdefault` bir Short için de 16:9 gelir ve
  // dikey çerçevede ağır kırpılır. Yoksa normal akışa düşülür — `/shorts/`
  // yolundan gelen her adres gerçekten dikey içerik olmayabilir.
  if (shorts) {
    const vertical = youtubeVerticalThumbnailUrl(videoId);
    const probe = await youtubeFetch(vertical, {
      accept: "image/*",
      timeoutMs: FETCH_TIMEOUT_MS,
      method: "HEAD",
    });
    await probe?.body?.cancel().catch(() => {});
    const size = Number(probe?.headers.get("content-length") ?? "0");
    if (probe?.ok && size >= YOUTUBE_THUMBNAIL_MIN_BYTES) {
      return { url: vertical, vertical: true };
    }
  }

  const maxres = youtubeThumbnailUrl(videoId, "maxres");
  const response = await youtubeFetch(maxres, {
    accept: "image/*",
    timeoutMs: FETCH_TIMEOUT_MS,
    method: "HEAD",
  });
  await response?.body?.cancel().catch(() => {});
  const declared = Number(response?.headers.get("content-length") ?? "0");
  if (response?.ok && declared >= YOUTUBE_THUMBNAIL_MIN_BYTES) {
    return { url: maxres, vertical: false };
  }
  return { url: youtubeThumbnailUrl(videoId, "mq"), vertical: false };
}

/** oEmbed'den başlık ve kanal adı; başarısızlık null döner (blok yine kurulur). */
async function fetchVideoMeta(videoId: string) {
  const response = await youtubeFetch(youtubeOEmbedUrl(videoId), {
    accept: "application/json",
    timeoutMs: FETCH_TIMEOUT_MS,
  });
  if (!response) return null;
  if (!response.ok) {
    await response.body?.cancel().catch(() => {});
    return null;
  }
  const body = await readCappedText(response, OEMBED_MAX_BYTES);
  try {
    return parseYouTubeOEmbed(JSON.parse(body));
  } catch {
    return null;
  }
}

/**
 * `@handle` / `/c/…` / `/user/…` → `UC…`. Kanal sayfası ~1,3 MB olduğu için
 * gövde akış hâlinde okunur ve `og:url` görülür görülmez bağlantı kesilir.
 * oEmbed burada KULLANILAMAZ: kanallarda 404 dönüyor.
 */
async function fetchChannelPage(url: string): Promise<{
  channelId: string | null;
  avatar: string | null;
}> {
  const empty = { channelId: null, avatar: null };
  const response = await youtubeFetch(url, {
    accept: "text/html",
    timeoutMs: CHANNEL_PAGE_TIMEOUT_MS,
  });
  if (!response) return empty;
  if (!response.ok) {
    await response.body?.cancel().catch(() => {});
    return empty;
  }
  let channelId: string | null = null;
  let avatar: string | null = null;
  // İkisi de aynı okumadan çıkar: avatar için ayrı bir istek atmak, kanal
  // sayfası ~1,3 MB olduğu için pahalı olurdu.
  await readTextStreaming(response, CHANNEL_PAGE_MAX_BYTES, (window) => {
    channelId ??= parseYouTubeChannelIdFromHtml(window);
    avatar ??= parseYouTubeChannelAvatarFromHtml(window);
    return channelId !== null && avatar !== null;
  });
  return { channelId, avatar };
}

async function resolveChannelId(
  refKind: "handle" | "custom" | "user",
  ref: string,
): Promise<{ channelId: string | null; avatar: string | null }> {
  return fetchChannelPage(youtubeChannelRefUrl(refKind, ref));
}

/**
 * Kanal RSS akışı, Cache API önbellekli. Akış çekilemez veya ayrıştırılamazsa
 * null döner ve widget kayıt anında saklanan bilgiyle (kanal adı) yetinir.
 */
export async function getYouTubeChannelFeed(channelId: string): Promise<YouTubeChannelFeed | null> {
  if (!isYouTubeChannelId(channelId)) return null;
  // Workers Cache API: tip tanımında `default` yok (image-proxy.ts ile aynı kalıp).
  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request(`https://caka.app/__cache/youtube-feed/${channelId}`);

  try {
    const cached = await cache.match(cacheKey);
    if (cached) return parseYouTubeChannelFeed(await cached.text());
  } catch {
    // Önbellek okunamadıysa doğrudan kaynağa git.
  }

  const response = await youtubeFetch(youtubeChannelFeedUrl(channelId), {
    accept: "application/atom+xml,application/xml",
    timeoutMs: FETCH_TIMEOUT_MS,
  });
  if (!response) return null;
  if (!response.ok) {
    await response.body?.cancel().catch(() => {});
    return null;
  }
  const xml = await readCappedText(response, FEED_MAX_BYTES);
  const feed = parseYouTubeChannelFeed(xml);
  if (!feed) return null;

  // Yalnız ayrıştırılabilen akış önbelleklenir: bozuk gövdeyi 15 dakika
  // saklamak, kendini yenileyen widget'ı 15 dakika dondurmak olurdu.
  try {
    waitUntil(
      cache.put(
        cacheKey,
        new Response(xml, {
          headers: {
            "Content-Type": "application/atom+xml; charset=utf-8",
            "Cache-Control": `public, max-age=${FEED_CACHE_SECONDS}`,
          },
        }),
      ),
    );
  } catch {
    // Önbellek yazımı başarısız olsa da yanıt geçerli.
  }
  return feed;
}

/**
 * Kayıt anındaki tek giriş noktası (plan KTD34): bir YouTube bağlantısını
 * video mu kanal mı olduğuna çözer ve blokta saklanacak veriyi üretir.
 * Render bu işi TEKRARLAMAZ.
 *
 * YouTube olmayan ya da desteklenmeyen bir adres için null döner.
 */
export async function resolveYouTubeLink(url: string): Promise<ResolvedYouTube | null> {
  const ref = classifyYouTubeUrl(url);

  if (ref.kind === "video") {
    // Küçük görsel doğrulaması ve oEmbed birbirinden bağımsız: paralel.
    const [meta, thumbnail] = await Promise.all([
      fetchVideoMeta(ref.videoId),
      pickThumbnailUrl(ref.videoId, ref.shorts),
    ]);
    return {
      kind: "video",
      videoId: ref.videoId,
      shorts: ref.shorts,
      title: meta?.title ?? null,
      channelName: meta?.channelName ?? null,
      channelUrl: meta?.channelUrl ?? null,
      thumbnailUrl: thumbnail.url,
      verticalThumbnail: thumbnail.vertical,
    };
  }

  if (ref.kind !== "channel" && ref.kind !== "channel-ref") return null;

  // `/channel/UC…` adresinde kimlik hazır ama avatar yok; onun için de sayfa
  // okunur. Maliyet kayıt anında bir kez, karşılığı kanal kartının kimliği.
  const page =
    ref.kind === "channel"
      ? await fetchChannelPage(youtubeChannelUrl(ref.channelId))
      : await resolveChannelId(ref.refKind, ref.ref);
  const channelId = ref.kind === "channel" ? ref.channelId : page.channelId;
  if (!channelId) return null;

  // Kanal adı için ayrı bir istek gerekmiyor: RSS zaten başlığı taşıyor ve
  // widget'ın ilk render'ı için de aynı akış okunacak.
  const feed = await getYouTubeChannelFeed(channelId);
  return {
    kind: "channel",
    channelId,
    channelName: feed?.channelTitle || null,
    channelUrl: youtubeChannelUrl(channelId),
    avatarUrl: page.avatar,
  };
}
