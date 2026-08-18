import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  SPOTIFY_ALLOWED_HOSTS,
  SPOTIFY_KIND_LABELS,
  classifySpotifyUrl,
  isSpotifyEntityId,
  parseSpotifyOEmbed,
  spotifyDefaultSize,
  spotifyEmbedUrl,
  spotifyOEmbedUrl,
  spotifyUrl,
  type SpotifyRef,
} from "./spotify";

/**
 * GERÇEK yanıtlar, 2026-08-18'de canlıdan alındı. Tazelemek için:
 *   https://open.spotify.com/oembed?url=https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT
 *   …/album/4m2880jivSbbyEGAKfITCa   …/playlist/37i9dQZF1DXcBWIGoYBM5M
 *
 * Üç fixture birlikte iki ölçümü kanıtlıyor: parça 152px yükseklik istiyor,
 * albüm/liste 352px; ve yanıt `title` dışında ad taşımıyor (sanatçı adı yok).
 */
function fixture(name: string): unknown {
  const path = fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
  return JSON.parse(readFileSync(path, "utf8"));
}

const TRACK_ID = "4cOdK2wGLETKBW3PvgPWqT";
const ALBUM_ID = "4m2880jivSbbyEGAKfITCa";
const PLAYLIST_ID = "37i9dQZF1DXcBWIGoYBM5M";

/** Testlerde okunabilirlik: başarılı sonucu tek satırda karşılaştır. */
function entity(ref: SpotifyRef): string {
  return ref.kind === "none" ? `none:${ref.reason}` : `${ref.kind}:${ref.entityId}`;
}

describe("classifySpotifyUrl — kanonik web adresleri", () => {
  const cases: [string, string][] = [
    [`https://open.spotify.com/track/${TRACK_ID}`, `track:${TRACK_ID}`],
    [`https://open.spotify.com/album/${ALBUM_ID}`, `album:${ALBUM_ID}`],
    [`https://open.spotify.com/playlist/${PLAYLIST_ID}`, `playlist:${PLAYLIST_ID}`],
    [`https://open.spotify.com/artist/${TRACK_ID}`, `artist:${TRACK_ID}`],
    [`https://open.spotify.com/episode/${TRACK_ID}`, `episode:${TRACK_ID}`],
    [`https://open.spotify.com/show/${TRACK_ID}`, `show:${TRACK_ID}`],
    // Paylaş düğmesi `?si=` takip parametresi ekliyor; kimlik değişmez.
    [`https://open.spotify.com/track/${TRACK_ID}?si=abc123&utm_source=copy-link`, `track:${TRACK_ID}`],
    // Şemasız yapıştırma.
    [`open.spotify.com/track/${TRACK_ID}`, `track:${TRACK_ID}`],
    // Sonda eğik çizgi ve büyük harfli host.
    [`https://OPEN.Spotify.com/Track/${TRACK_ID}/`, `track:${TRACK_ID}`],
    // Eski web oynatıcısı host'u.
    [`https://play.spotify.com/album/${ALBUM_ID}`, `album:${ALBUM_ID}`],
    // http de kabul edilir; kanonik adres yine https kurulur.
    [`http://open.spotify.com/track/${TRACK_ID}`, `track:${TRACK_ID}`],
  ];
  it.each(cases)("%s", (input, expected) => {
    expect(entity(classifySpotifyUrl(input))).toBe(expected);
  });
});

describe("classifySpotifyUrl — ülke öneki, gömme ve eski yollar", () => {
  const cases: [string, string][] = [
    [`https://open.spotify.com/intl-tr/track/${TRACK_ID}`, `track:${TRACK_ID}`],
    [`https://open.spotify.com/intl-de/album/${ALBUM_ID}`, `album:${ALBUM_ID}`],
    [`https://open.spotify.com/embed/track/${TRACK_ID}`, `track:${TRACK_ID}`],
    [`https://open.spotify.com/embed-podcast/episode/${TRACK_ID}`, `episode:${TRACK_ID}`],
    [`https://open.spotify.com/intl-tr/embed/playlist/${PLAYLIST_ID}`, `playlist:${PLAYLIST_ID}`],
    // Eski çalma listesi yolu: `/user/<ad>/playlist/<id>`.
    [`https://open.spotify.com/user/spotify/playlist/${PLAYLIST_ID}`, `playlist:${PLAYLIST_ID}`],
  ];
  it.each(cases)("%s", (input, expected) => {
    expect(entity(classifySpotifyUrl(input))).toBe(expected);
  });
});

describe("classifySpotifyUrl — spotify: URI biçimi", () => {
  const cases: [string, string][] = [
    [`spotify:track:${TRACK_ID}`, `track:${TRACK_ID}`],
    [`spotify:album:${ALBUM_ID}`, `album:${ALBUM_ID}`],
    [`spotify:show:${TRACK_ID}`, `show:${TRACK_ID}`],
    // Eski uygulama biçimi: kullanıcı adı araya giriyor, son çift yine tür+id.
    [`spotify:user:spotify:playlist:${PLAYLIST_ID}`, `playlist:${PLAYLIST_ID}`],
    // Boşluklu yapıştırma.
    [`  spotify:track:${TRACK_ID}  `, `track:${TRACK_ID}`],
  ];
  it.each(cases)("%s", (input, expected) => {
    expect(entity(classifySpotifyUrl(input))).toBe(expected);
  });

  it("URI'de tür tanınmıyorsa desteklenmez", () => {
    expect(entity(classifySpotifyUrl(`spotify:user:abdullah`))).toBe("none:unsupported");
  });

  it("URI'de kimlik base62 değilse desteklenmez", () => {
    expect(entity(classifySpotifyUrl("spotify:track:kisa"))).toBe("none:unsupported");
  });
});

describe("classifySpotifyUrl — reddedilenler", () => {
  const cases: [string, string][] = [
    ["", "none:invalid"],
    ["   ", "none:invalid"],
    // Boşluklu düz metin URL olarak bile ayrıştırılamaz.
    ["yalnızca düz metin", "none:invalid"],
    // Şemasız ama geçerli bir host: Spotify değil.
    ["example.com/track/x", "none:not-spotify"],
    ["javascript:alert(1)", "none:invalid"],
    // Değişmez #8: http(s) dışı şema kabul edilmez.
    ["ftp://open.spotify.com/track/x", "none:invalid"],
    ["https://www.youtube.com/watch?v=Af6i6ChAVTw", "none:not-spotify"],
    // Benzer görünen ama başka host: `open.spotify.com.evil.tr`.
    [`https://open.spotify.com.evil.tr/track/${TRACK_ID}`, "none:not-spotify"],
    // Pazarlama sitesi gömülebilir içerik vermiyor.
    ["https://www.spotify.com/tr/premium/", "none:not-spotify"],
    // Kullanıcı profili: tür listesinde yok.
    ["https://open.spotify.com/user/spotify", "none:unsupported"],
    ["https://open.spotify.com/search/rick%20astley", "none:unsupported"],
    ["https://open.spotify.com/collection/tracks", "none:unsupported"],
    ["https://open.spotify.com/genre/hiphop-page", "none:unsupported"],
    ["https://open.spotify.com/", "none:unsupported"],
    // Kısaltıcı: ağ olmadan çözülemez, sessizce kabul edilmez.
    [`https://spotify.link/abc123`, "none:not-spotify"],
    // Tür doğru ama kimlik eksik/bozuk.
    ["https://open.spotify.com/track", "none:unsupported"],
    ["https://open.spotify.com/track/kisaKimlik", "none:unsupported"],
    // 22 karakter ama base62 dışı karakter var (tire).
    ["https://open.spotify.com/track/4cOdK2wGLETKBW3Pvg-WqT", "none:unsupported"],
    // 23 karakter.
    [`https://open.spotify.com/track/${TRACK_ID}X`, "none:unsupported"],
  ];
  it.each(cases)("%s", (input, expected) => {
    expect(entity(classifySpotifyUrl(input))).toBe(expected);
  });

  it("aşırı uzun girdi ayrıştırılmaz", () => {
    expect(entity(classifySpotifyUrl(`https://open.spotify.com/track/${"a".repeat(4000)}`))).toBe(
      "none:invalid",
    );
  });
});

describe("isSpotifyEntityId", () => {
  it("22 karakterlik base62 kabul edilir", () => {
    expect(isSpotifyEntityId(TRACK_ID)).toBe(true);
    expect(isSpotifyEntityId(PLAYLIST_ID)).toBe(true);
  });
  it("boş, kısa ve alfabe dışı reddedilir", () => {
    expect(isSpotifyEntityId("")).toBe(false);
    expect(isSpotifyEntityId("abc")).toBe(false);
    expect(isSpotifyEntityId("4cOdK2wGLETKBW3Pvg_WqT")).toBe(false);
  });
});

describe("adres kurucular", () => {
  it("kanonik adres türü ve kimliği taşır", () => {
    expect(spotifyUrl("track", TRACK_ID)).toBe(`https://open.spotify.com/track/${TRACK_ID}`);
  });

  it("gömme adresi /embed/ yolunu kullanır", () => {
    expect(spotifyEmbedUrl("album", ALBUM_ID)).toBe(
      `https://open.spotify.com/embed/album/${ALBUM_ID}`,
    );
  });

  it("oEmbed ucu KANONİK adresi sorgular (gömme adresini değil)", () => {
    const url = spotifyOEmbedUrl("playlist", PLAYLIST_ID);
    expect(url.startsWith("https://open.spotify.com/oembed?url=")).toBe(true);
    expect(decodeURIComponent(new URL(url).searchParams.get("url") ?? "")).toBe(
      `https://open.spotify.com/playlist/${PLAYLIST_ID}`,
    );
  });

  it("kurulan adresler sınıflandırmadan aynen geri çıkar", () => {
    for (const kind of Object.keys(SPOTIFY_KIND_LABELS) as (keyof typeof SPOTIFY_KIND_LABELS)[]) {
      expect(entity(classifySpotifyUrl(spotifyUrl(kind, TRACK_ID)))).toBe(`${kind}:${TRACK_ID}`);
      expect(entity(classifySpotifyUrl(spotifyEmbedUrl(kind, TRACK_ID)))).toBe(
        `${kind}:${TRACK_ID}`,
      );
    }
  });

  it("sunucu allowlist'i yalnız kanonik host'u içerir", () => {
    expect([...SPOTIFY_ALLOWED_HOSTS]).toEqual(["open.spotify.com"]);
    expect(SPOTIFY_ALLOWED_HOSTS.has(new URL(spotifyOEmbedUrl("track", TRACK_ID)).hostname)).toBe(
      true,
    );
  });
});

describe("spotifyDefaultSize", () => {
  it("parça kompakt oynatıcıya (2x1) düşer", () => {
    expect(spotifyDefaultSize("track")).toBe("2x1");
  });
  it("352px isteyen türler 2x2 olur", () => {
    for (const kind of ["album", "playlist", "artist", "episode", "show"] as const) {
      expect(spotifyDefaultSize(kind)).toBe("2x2");
    }
  });
});

describe("parseSpotifyOEmbed — gerçek yanıtlar", () => {
  it("parça: başlık, kapak ve 152px yükseklik", () => {
    const parsed = parseSpotifyOEmbed(fixture("spotify-oembed-track.json"));
    expect(parsed).toEqual({
      title: "Never Gonna Give You Up",
      thumbnailUrl:
        "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02baf89eb11ec7c657805d2da0",
      height: 152,
    });
  });

  it("albüm: 352px yükseklik", () => {
    const parsed = parseSpotifyOEmbed(fixture("spotify-oembed-album.json"));
    expect(parsed?.title).toBe("Random Access Memories");
    expect(parsed?.height).toBe(352);
    expect(parsed?.thumbnailUrl).toMatch(/^https:\/\/image-cdn-[a-z]+\.spotifycdn\.com\/image\//);
  });

  it("çalma listesi: i.scdn.co kapağı da kabul edilir", () => {
    const parsed = parseSpotifyOEmbed(fixture("spotify-oembed-playlist.json"));
    expect(parsed?.title).toBe("Today’s Top Hits");
    expect(parsed?.height).toBe(352);
    expect(parsed?.thumbnailUrl).toMatch(/^https:\/\/i\.scdn\.co\/image\//);
  });

  it("yanıtın hiçbir alanı sanatçı adı taşımıyor (şemada da yok)", () => {
    const raw = fixture("spotify-oembed-track.json") as Record<string, unknown>;
    expect(Object.keys(raw)).not.toContain("author_name");
    expect(Object.keys(raw)).not.toContain("artist");
  });
});

describe("parseSpotifyOEmbed — bozuk gövdeler", () => {
  it("nesne olmayan gövde null", () => {
    expect(parseSpotifyOEmbed(null)).toBeNull();
    expect(parseSpotifyOEmbed("metin")).toBeNull();
    expect(parseSpotifyOEmbed(42)).toBeNull();
  });

  it("başlık ve kapak birlikte yoksa null", () => {
    expect(parseSpotifyOEmbed({ height: 152 })).toBeNull();
    expect(parseSpotifyOEmbed({ title: "   ", thumbnail_url: "" })).toBeNull();
  });

  it("yabancı host'lu kapak düşürülür ama başlık korunur", () => {
    expect(
      parseSpotifyOEmbed({ title: "Parça", thumbnail_url: "https://evil.example/x.jpg" }),
    ).toEqual({ title: "Parça", thumbnailUrl: null, height: null });
  });

  it("http kapak (şifresiz) kabul edilmez", () => {
    expect(
      parseSpotifyOEmbed({ title: "Parça", thumbnail_url: "http://i.scdn.co/image/x" }),
    ).toEqual({ title: "Parça", thumbnailUrl: null, height: null });
  });

  it("scdn.co'yu taklit eden host reddedilir", () => {
    expect(
      parseSpotifyOEmbed({ title: "Parça", thumbnail_url: "https://i.scdn.co.evil.tr/image/x" })
        ?.thumbnailUrl,
    ).toBeNull();
  });

  it("sayısal olmayan yükseklik null'a düşer", () => {
    expect(parseSpotifyOEmbed({ title: "Parça", height: "352" })?.height).toBeNull();
  });

  it("başlığın baştaki/sondaki boşluğu kırpılır", () => {
    expect(parseSpotifyOEmbed({ title: "  Parça  " })?.title).toBe("Parça");
  });
});
