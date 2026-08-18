// Spotify'ın saf kuralları: URL/URI sınıflandırma, adres kurucular ve oEmbed
// ayrıştırıcısı. Ağ çağrısı YOK — çağrı katmanı `apps/web/server/spotify.ts`.
//
// NEDEN ANAHTARSIZ: YouTube'daki gerekçenin aynısı (plan KD5) — ürün vendor
// API anahtarı almıyor. Spotify'ın oEmbed ucu
// `https://open.spotify.com/oembed?url=…` anahtarsız ve kotasız çalışıyor
// (ölçüldü 2026-08-18) ve gömme de `open.spotify.com/embed/<tür>/<id>`
// iframe'iyle yapılıyor; ikisi de token istemiyor.
//
// oEmbed'İN VERDİĞİ TEK AD `title`: parçada şarkı adı, albümde albüm adı,
// listede liste adı. SANATÇI ADI GELMİYOR — bu yüzden ne şemada ne burada
// öyle bir alan var. Ölçülen yanıt: `packages/shared/src/fixtures/`.
//
// KIRILGANLIK: oEmbed resmî bir uç ve gövdesi dar. Bozulursa fixture'ları
// tazeleyip `parseSpotifyOEmbed`'e bak.
import type { SpotifyKind } from "./layout";

/**
 * Spotify kimlikleri base62'dir: 16 baytlık kimliğin base62 gösterimi hep
 * 22 karakter tutar (üç ayrı türde doğrulandı). Uzunluğu serbest bırakmak,
 * `/track/x` gibi kırık bir yapıştırmayı geçerli sayıp kullanıcıya boş bir
 * gömme göstermek olurdu.
 */
const ENTITY_ID_PATTERN = /^[A-Za-z0-9]{22}$/;

/** Sınıflandırmanın Spotify saydığı web host'ları. */
const SPOTIFY_PAGE_HOSTS = new Set([
  "open.spotify.com",
  "www.open.spotify.com",
  // Eski web oynatıcısı; yol şekli birebir aynı ve hâlâ paylaşılıyor.
  "play.spotify.com",
  "www.play.spotify.com",
]);

/**
 * Sunucunun istek atmasına izin verilen host'lar (SSRF kapısı). Yalnız
 * kanonik host: `play.spotify.com` sınıflandırmada kabul edilse de istek
 * her zaman `open.spotify.com`'a kurulur.
 */
export const SPOTIFY_ALLOWED_HOSTS = new Set(["open.spotify.com"]);

/** Kapak görselinin gelebileceği Spotify CDN'leri (ölçülen üçü de burada). */
const IMAGE_HOST_PATTERN = /^https:\/\/(?:[a-z0-9-]+\.)*(?:scdn\.co|spotifycdn\.com)\//i;

/** Tür → kullanıcıya gösterilecek Türkçe ad ("Parça olarak eklendi"). */
export const SPOTIFY_KIND_LABELS: Record<SpotifyKind, string> = {
  track: "Parça",
  album: "Albüm",
  playlist: "Çalma listesi",
  artist: "Sanatçı",
  episode: "Bölüm",
  show: "Podcast",
};

const ENTITY_KINDS = Object.keys(SPOTIFY_KIND_LABELS) as SpotifyKind[];

function isSpotifyKind(value: string): value is SpotifyKind {
  return (ENTITY_KINDS as string[]).includes(value);
}

export type SpotifyRef =
  /** Türü ve kimliği adresten okunan içerik; ek çözüm gerekmez. */
  | { kind: SpotifyKind; entityId: string }
  /** Spotify değil ya da desteklenmeyen bir Spotify yolu. */
  | { kind: "none"; reason: "invalid" | "not-spotify" | "unsupported" };

function none(reason: "invalid" | "not-spotify" | "unsupported"): SpotifyRef {
  return { kind: "none", reason };
}

/** Şemasız yapıştırılan adresler ("open.spotify.com/track/…") de kabul edilir. */
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

/**
 * `spotify:track:<id>` ve eski `spotify:user:<ad>:playlist:<id>` biçimi.
 * Masaüstü uygulamasının "Spotify URI'sini kopyala" seçeneği bunu veriyor,
 * yani kullanıcının panosunda gerçekten bulunan bir biçim.
 */
function classifyUri(raw: string): SpotifyRef | null {
  const value = raw.trim();
  if (!/^spotify:/i.test(value)) return null;
  const parts = value.slice("spotify:".length).split(":");
  if (parts.length < 2) return none("unsupported");
  // Son iki parça daima `<tür>:<id>`: `user:ad:playlist:id` de buna uyar.
  const kind = (parts.at(-2) ?? "").toLowerCase();
  const id = parts.at(-1) ?? "";
  if (!isSpotifyKind(kind)) return none("unsupported");
  return ENTITY_ID_PATTERN.test(id) ? { kind, entityId: id } : none("unsupported");
}

function segments(pathname: string): string[] {
  return pathname.split("/").filter(Boolean);
}

/**
 * Yolun başındaki gürültüyü atar:
 * - `intl-tr` / `intl-de` — Spotify'ın ülke önekli paylaşım adresleri,
 * - `embed`, `embed-podcast` — birinin sayfadan kopyaladığı gömme adresi,
 * - `user/<ad>` — eski çalma listesi yolu (`/user/spotify/playlist/<id>`).
 *
 * Hiçbiri türü değiştirmez; hepsi aynı `<tür>/<id>` çiftinin önüne düşer.
 */
function stripPathPrefixes(parts: string[]): string[] {
  let rest = parts;
  for (let guard = 0; guard < 4 && rest.length > 0; guard += 1) {
    const head = (rest[0] ?? "").toLowerCase();
    if (/^intl-[a-z]{2}$/.test(head) || head === "embed" || head === "embed-podcast") {
      rest = rest.slice(1);
      continue;
    }
    // `user/<ad>` yalnız ARKASINDA bir tür varsa atlanır; tek başına
    // `/user/spotify` bir kullanıcı profilidir ve gömülemez.
    if (head === "user" && rest.length >= 3) {
      rest = rest.slice(2);
      continue;
    }
    break;
  }
  return rest;
}

/**
 * Bir adresin hangi Spotify içeriğine işaret ettiğini ve kimliğini çıkarır.
 * Saf ve senkron: kayıt anında bir kez çağrılır (YouTube'daki KTD34 deseni).
 */
export function classifySpotifyUrl(raw: string): SpotifyRef {
  const uri = classifyUri(raw ?? "");
  if (uri) return uri;

  const url = toUrl(raw);
  if (!url) return none("invalid");
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!SPOTIFY_PAGE_HOSTS.has(host)) return none("not-spotify");

  const parts = stripPathPrefixes(segments(url.pathname));
  const [first, second] = parts;
  if (!first) return none("unsupported");

  const kind = first.toLowerCase();
  // `/user/…`, `/search/…`, `/collection/…`, `/genre/…`, `/concert/…`:
  // gömülebilir bir içerik değil.
  if (!isSpotifyKind(kind)) return none("unsupported");

  const id = second ?? "";
  return ENTITY_ID_PATTERN.test(id) ? { kind, entityId: id } : none("unsupported");
}

/** Kimlik geçerli mi? (Blok verisi dışarıdan gelebilir.) */
export function isSpotifyEntityId(value: string): boolean {
  return ENTITY_ID_PATTERN.test(value);
}

/** Kanonik `open.spotify.com` adresi — blokta saklanan ve alana yazılan hâl. */
export function spotifyUrl(kind: SpotifyKind, entityId: string): string {
  return `https://open.spotify.com/${kind}/${entityId}`;
}

/** iframe'in `src`'i. Ölçüm: parça 152px, diğer türler 352px yükseklik ister. */
export function spotifyEmbedUrl(kind: SpotifyKind, entityId: string): string {
  return `https://open.spotify.com/embed/${kind}/${entityId}`;
}

/** Anahtarsız oEmbed ucu; kanonik adresle çağrılır, gömme adresiyle DEĞİL. */
export function spotifyOEmbedUrl(kind: SpotifyKind, entityId: string): string {
  const target = encodeURIComponent(spotifyUrl(kind, entityId));
  return `https://open.spotify.com/oembed?url=${target}`;
}

/**
 * Varsayılan blok boyutu türe göre seçilir: parçanın kompakt oynatıcısı
 * 152px, masaüstünde 2×1 tile 156px — tam oturuyor. Albüm/liste/sanatçı/
 * podcast gömmesi 352px istediği için 2×2 olmak zorunda; 2×1'de oynatıcı
 * kırpılırdı. (Sınırlar `BLOCK_GRID_LIMITS.spotify` ile uyumlu: 2×1–4×2.)
 */
export function spotifyDefaultSize(kind: SpotifyKind): "2x1" | "2x2" {
  return kind === "track" ? "2x1" : "2x2";
}

export type SpotifyOEmbed = {
  /** Parçada şarkı, albümde albüm, listede liste adı. Sanatçı adı YOK. */
  title: string | null;
  /** Kapak görseli; yalnız Spotify CDN host'ları kabul edilir. */
  thumbnailUrl: string | null;
  /** Gömmenin istediği yükseklik (152 kompakt oynatıcı, 352 tam kart). */
  height: number | null;
};

/**
 * oEmbed yanıtını okur. `html` BİLEREK yok sayılır: içinde hazır bir iframe
 * geliyor ama onu sayfaya basmak, uzak bir HTML parçasını olduğu gibi DOM'a
 * koymak olurdu. Gömme adresini kimlikten kendimiz kurarız.
 */
export function parseSpotifyOEmbed(raw: unknown): SpotifyOEmbed | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const title = typeof value.title === "string" ? value.title.trim() : "";
  const thumbnail = typeof value.thumbnail_url === "string" ? value.thumbnail_url.trim() : "";
  const height = typeof value.height === "number" && Number.isFinite(value.height)
    ? value.height
    : null;
  if (!title && !thumbnail) return null;
  return {
    title: title || null,
    // Yabancı bir host, imzalı proxy'ye Spotify'la ilgisi olmayan bir hedef
    // sokmak demekti; kapak yoksa kart görselsiz hâline düşer.
    thumbnailUrl: thumbnail && IMAGE_HOST_PATTERN.test(thumbnail) ? thumbnail : null,
    height,
  };
}
