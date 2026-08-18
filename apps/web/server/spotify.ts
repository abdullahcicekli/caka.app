// Spotify çağrı katmanı: saf kurallar `@caka/shared/spotify`'da, ağ burada.
//
// ANAHTAR YOK (plan KD5): başlık ve kapak görseli anahtarsız oEmbed ucundan
// (`open.spotify.com/oembed?url=…`) gelir, gömme de aynı host'un
// `/embed/<tür>/<id>` iframe'idir. Ne token ne kota var.
//
// MALİYET NEREYE DÜŞÜYOR: YouTube'daki desenin aynısı — pahalı iş KAYIT
// ANINDA bir kez yapılır (`resolveSpotifyLink`) ve sonucu blokta saklanır.
// Render hiçbir dış istek atmaz: iframe'i kimlikten kurar, kapağı imzalı
// proxy'den okur.
//
// HATA YUTULUR: ağ hatası ne kaydetmeyi ne sayfayı bozar. Çözülemeyen bir
// bağlantı yalnızca zenginleştirilmemiş (başlıksız/kapaksız) blok demektir;
// gömme kimlikten kurulduğu için oynatıcı yine çalışır.
import {
  SPOTIFY_ALLOWED_HOSTS,
  type SpotifyKind,
  classifySpotifyUrl,
  parseSpotifyOEmbed,
  spotifyOEmbedUrl,
  spotifyUrl,
} from "@caka/shared";

const FETCH_TIMEOUT_MS = 4000;
const MAX_HOPS = 3;
/** oEmbed gövdesi ölçülen üç örnekte < 1 KB; tavan bolca üstünde. */
const OEMBED_MAX_BYTES = 64 * 1024;

const USER_AGENT = "caka.app (+https://caka.app; profile spotify widget)";

/** Kayıt anında çözülüp blokta saklanan Spotify verisi. */
export type ResolvedSpotify = {
  kind: SpotifyKind;
  entityId: string;
  /** Kanonik `open.spotify.com` adresi. */
  url: string;
  /**
   * oEmbed'in verdiği tek ad: parçada şarkı, albümde albüm adı. Sanatçı adı
   * gelmiyor, o yüzden burada da yok.
   */
  title: string | null;
  /** Kapak görseli (uzak adres); render imzalı proxy'den geçirir. */
  thumbnailUrl: string | null;
  /**
   * `title` neden boş: uç, "bulunamadı" ile "ağ tökezledi"yi ayırt edebilsin
   * diye. Kullanıcıya gösterilecek cümle buna bağlı.
   */
  status: "ok" | "not-found" | "unavailable";
};

/**
 * Yalnız `open.spotify.com`'a, yalnız https ve varsayılan portla gider ve HER
 * yönlendirme hop'unda host'u yeniden doğrular (youtube.ts ile aynı kapı).
 * Risk düşük (hedef sabit) ama kural aynı kural: adres doğrulaması fetch'in
 * yanında durur.
 */
async function spotifyFetch(target: string): Promise<Response | null> {
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
    if (!SPOTIFY_ALLOWED_HOSTS.has(parsed.hostname.toLowerCase())) return null;

    let response: Response;
    try {
      response = await fetch(parsed.toString(), {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: {
          Accept: "application/json",
          "User-Agent": USER_AGENT,
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
 * Kayıt anındaki tek giriş noktası: bir Spotify bağlantısını türüne ve
 * kimliğine çözer, oEmbed'den başlık/kapak ekler. Render bu işi TEKRARLAMAZ.
 *
 * Spotify olmayan ya da desteklenmeyen bir adres için null döner — bu ayrımı
 * uç, ağa çıkmadan `classifySpotifyUrl` ile zaten yapıyor; buradaki null
 * ikinci kapı.
 */
export async function resolveSpotifyLink(url: string): Promise<ResolvedSpotify | null> {
  const ref = classifySpotifyUrl(url);
  if (ref.kind === "none") return null;

  const canonical = spotifyUrl(ref.kind, ref.entityId);
  const base = { kind: ref.kind, entityId: ref.entityId, url: canonical } as const;

  const response = await spotifyFetch(spotifyOEmbedUrl(ref.kind, ref.entityId));
  // `null` = ağ/timeout/allowlist; içerik yok DEMEK DEĞİL.
  if (!response) {
    return { ...base, title: null, thumbnailUrl: null, status: "unavailable" };
  }
  if (!response.ok) {
    await response.body?.cancel().catch(() => {});
    // Ölçüm: olmayan kimlikte 404, gömülemeyen türde (kullanıcı profili) 400.
    const missing = response.status === 404 || response.status === 400;
    return {
      ...base,
      title: null,
      thumbnailUrl: null,
      status: missing ? "not-found" : "unavailable",
    };
  }

  const body = await readCappedText(response, OEMBED_MAX_BYTES);
  let meta: ReturnType<typeof parseSpotifyOEmbed> = null;
  try {
    meta = parseSpotifyOEmbed(JSON.parse(body));
  } catch {
    meta = null;
  }
  if (!meta) {
    // 200 geldi ama gövde beklenen şekilde değil: içerik var sayılır, sadece
    // zenginleştirilemedi. Gömme kimlikten kurulduğu için kart yine çalışır.
    return { ...base, title: null, thumbnailUrl: null, status: "unavailable" };
  }
  return { ...base, title: meta.title, thumbnailUrl: meta.thumbnailUrl, status: "ok" };
}
