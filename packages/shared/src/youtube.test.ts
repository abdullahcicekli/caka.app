import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  YOUTUBE_THUMBNAIL_MIN_BYTES,
  classifyYouTubeUrl,
  isYouTubeChannelId,
  isYouTubeVideoId,
  parseYouTubeChannelFeed,
  parseYouTubeChannelIdFromHtml,
  parseYouTubeOEmbed,
  youtubeChannelFeedUrl,
  youtubeChannelRefUrl,
  youtubeChannelUrl,
  youtubeOEmbedUrl,
  youtubeThumbnailUrl,
  youtubeVerticalThumbnailUrl,
  youtubeVideoUrl,
} from "./youtube";

/**
 * GERÇEK yanıtlar, 2026-08-18'de canlıdan alındı. Tazelemek için:
 *   https://www.youtube.com/@MrBeast                      → youtube-channel-mrbeast.html
 *   https://www.youtube.com/feeds/videos.xml?channel_id=… → youtube-feed-mrbeast.xml
 *   https://www.youtube.com/oembed?url=…&format=json      → youtube-oembed-mrbeast.json
 *
 * Kanal sayfası 1.326.455 bayttı; fixture o yanıtın iki gerçek dilimidir
 * (0-4096 ve 715000-746500). Dilim BİLEREK yanıltıcı `UC…` blob'unu da
 * içeriyor — naif grep tuzağının hâlâ orada olduğunu kanıtlar.
 */
function fixture(name: string): string {
  return readFileSync(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)), "utf8");
}

describe("classifyYouTubeUrl — video şekilleri", () => {
  const cases: [string, string, boolean][] = [
    ["https://www.youtube.com/watch?v=Af6i6ChAVTw", "Af6i6ChAVTw", false],
    ["https://youtube.com/watch?v=Af6i6ChAVTw&t=30s", "Af6i6ChAVTw", false],
    ["https://m.youtube.com/watch?v=Af6i6ChAVTw", "Af6i6ChAVTw", false],
    ["https://music.youtube.com/watch?v=Af6i6ChAVTw", "Af6i6ChAVTw", false],
    ["https://youtu.be/Af6i6ChAVTw", "Af6i6ChAVTw", false],
    ["https://youtu.be/Af6i6ChAVTw?si=abc", "Af6i6ChAVTw", false],
    ["https://www.youtube.com/shorts/LiH-P4rSkLI", "LiH-P4rSkLI", true],
    ["https://www.youtube.com/embed/Af6i6ChAVTw", "Af6i6ChAVTw", false],
    ["https://www.youtube-nocookie.com/embed/Af6i6ChAVTw", "Af6i6ChAVTw", false],
    ["https://www.youtube.com/live/Af6i6ChAVTw", "Af6i6ChAVTw", false],
    ["https://www.youtube.com/v/Af6i6ChAVTw", "Af6i6ChAVTw", false],
    ["youtube.com/watch?v=Af6i6ChAVTw", "Af6i6ChAVTw", false],
    ["  https://www.youtube.com/watch?v=Af6i6ChAVTw  ", "Af6i6ChAVTw", false],
    ["http://www.youtube.com/watch?v=Af6i6ChAVTw", "Af6i6ChAVTw", false],
  ];

  for (const [url, videoId, shorts] of cases) {
    it(`video: ${url}`, () => {
      expect(classifyYouTubeUrl(url)).toEqual({ kind: "video", videoId, shorts });
    });
  }
});

describe("classifyYouTubeUrl — kanal şekilleri", () => {
  it("`/channel/UC…` kimliği doğrudan verir", () => {
    expect(classifyYouTubeUrl("https://www.youtube.com/channel/UCX6OQ3DkcsbYNE6H8uQQuVA")).toEqual({
      kind: "channel",
      channelId: "UCX6OQ3DkcsbYNE6H8uQQuVA",
    });
  });

  it("alt yollu kanal adresi de kimliği verir", () => {
    expect(
      classifyYouTubeUrl("https://www.youtube.com/channel/UCX6OQ3DkcsbYNE6H8uQQuVA/videos"),
    ).toEqual({ kind: "channel", channelId: "UCX6OQ3DkcsbYNE6H8uQQuVA" });
  });

  it("`@handle` çözülmeyi bekleyen referans döner", () => {
    expect(classifyYouTubeUrl("https://www.youtube.com/@MrBeast")).toEqual({
      kind: "channel-ref",
      refKind: "handle",
      ref: "MrBeast",
    });
  });

  it("`@handle/videos` hâlâ handle'dır, video değil", () => {
    expect(classifyYouTubeUrl("https://www.youtube.com/@MrBeast/videos")).toEqual({
      kind: "channel-ref",
      refKind: "handle",
      ref: "MrBeast",
    });
  });

  it("`@handle/live` video yolu sanılmaz", () => {
    expect(classifyYouTubeUrl("https://www.youtube.com/@MrBeast/live")).toEqual({
      kind: "channel-ref",
      refKind: "handle",
      ref: "MrBeast",
    });
  });

  it("`/c/Ad` eski özel ad", () => {
    expect(classifyYouTubeUrl("https://www.youtube.com/c/MrBeast6000")).toEqual({
      kind: "channel-ref",
      refKind: "custom",
      ref: "MrBeast6000",
    });
  });

  it("`/user/Ad` eski kullanıcı adı", () => {
    expect(classifyYouTubeUrl("https://www.youtube.com/user/MrBeast6000")).toEqual({
      kind: "channel-ref",
      refKind: "user",
      ref: "MrBeast6000",
    });
  });

  it("yüzde kodlu ad çözülür", () => {
    expect(classifyYouTubeUrl("https://www.youtube.com/c/Kanal%20Adi")).toEqual({
      kind: "channel-ref",
      refKind: "custom",
      ref: "Kanal Adi",
    });
  });
});

describe("classifyYouTubeUrl — 'değil' sonuçları", () => {
  const notYouTube = [
    "https://vimeo.com/76979871",
    "https://example.com/watch?v=Af6i6ChAVTw",
    // Alan adı sonu YouTube'a benziyor ama değil (host allowlist'i tam eşleşme).
    "https://youtube.com.evil.example/watch?v=Af6i6ChAVTw",
    "https://notyoutube.com/@MrBeast",
  ];
  for (const url of notYouTube) {
    it(`YouTube değil: ${url}`, () => {
      expect(classifyYouTubeUrl(url)).toEqual({ kind: "none", reason: "not-youtube" });
    });
  }

  const unsupported = [
    "https://www.youtube.com/playlist?list=PL1234567890",
    "https://www.youtube.com/results?search_query=caka",
    "https://www.youtube.com/feed/subscriptions",
    // Video kimliği 11 karakter değil.
    "https://www.youtube.com/watch?v=kisa",
    "https://youtu.be/kisa",
    // `v` parametresi hiç yok.
    "https://www.youtube.com/watch",
    // `UC` öneki olmayan kanal kimliği.
    "https://www.youtube.com/channel/X6OQ3DkcsbYNE6H8uQQuVA",
    // Handle çok kısa.
    "https://www.youtube.com/@ab",
  ];
  for (const url of unsupported) {
    it(`desteklenmiyor: ${url}`, () => {
      expect(classifyYouTubeUrl(url)).toEqual({ kind: "none", reason: "unsupported" });
    });
  }

  const invalid = ["", "   ", "javascript:alert(1)", "data:text/html,<b>x", "ftp://youtube.com/x"];
  for (const url of invalid) {
    it(`geçersiz: ${JSON.stringify(url)}`, () => {
      expect(classifyYouTubeUrl(url)).toEqual({ kind: "none", reason: "invalid" });
    });
  }

  it("2048 karakterden uzun adres reddedilir", () => {
    expect(classifyYouTubeUrl(`https://www.youtube.com/watch?v=${"a".repeat(3000)}`)).toEqual({
      kind: "none",
      reason: "invalid",
    });
  });
});

describe("kimlik doğrulayıcıları", () => {
  it("video kimliği 11 karakter olmalı", () => {
    expect(isYouTubeVideoId("Af6i6ChAVTw")).toBe(true);
    expect(isYouTubeVideoId("Af6i6ChAVT")).toBe(false);
    expect(isYouTubeVideoId("Af6i6ChAV/w")).toBe(false);
  });

  it("kanal kimliği UC + 22 karakter olmalı", () => {
    expect(isYouTubeChannelId("UCX6OQ3DkcsbYNE6H8uQQuVA")).toBe(true);
    expect(isYouTubeChannelId("X6OQ3DkcsbYNE6H8uQQuVA")).toBe(false);
  });
});

describe("adres kurucular", () => {
  it("Shorts'un dikey küçük görseli oardefault'tur", () => {
    // Ölçüm (2026-08-18): bir Short'un mqdefault'u da maxresdefault'u da
    // 16:9 gelir (320×180 / 1280×720); yalnız oardefault 1080×1920.
    // 9:16 çerçeveye 16:9 görsel koymak genişliğin çoğunu kırpıyordu.
    expect(youtubeVerticalThumbnailUrl("LiH-P4rSkLI")).toBe(
      "https://i.ytimg.com/vi/LiH-P4rSkLI/oardefault.jpg",
    );
    expect(youtubeVerticalThumbnailUrl("LiH-P4rSkLI")).not.toContain("mqdefault");
    expect(youtubeVerticalThumbnailUrl("LiH-P4rSkLI")).not.toContain("hqdefault");
  });

  it("küçük görsel mqdefault'tur; hqdefault hiç üretilmez", () => {
    expect(youtubeThumbnailUrl("Af6i6ChAVTw", "mq")).toBe(
      "https://i.ytimg.com/vi/Af6i6ChAVTw/mqdefault.jpg",
    );
    expect(youtubeThumbnailUrl("Af6i6ChAVTw", "maxres")).toBe(
      "https://i.ytimg.com/vi/Af6i6ChAVTw/maxresdefault.jpg",
    );
    expect(youtubeThumbnailUrl("Af6i6ChAVTw", "mq")).not.toContain("hqdefault");
  });

  it("oEmbed, RSS ve kanal adresleri", () => {
    expect(youtubeVideoUrl("Af6i6ChAVTw")).toBe("https://www.youtube.com/watch?v=Af6i6ChAVTw");
    expect(youtubeOEmbedUrl("Af6i6ChAVTw")).toBe(
      "https://www.youtube.com/oembed?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DAf6i6ChAVTw&format=json",
    );
    expect(youtubeChannelFeedUrl("UCX6OQ3DkcsbYNE6H8uQQuVA")).toBe(
      "https://www.youtube.com/feeds/videos.xml?channel_id=UCX6OQ3DkcsbYNE6H8uQQuVA",
    );
    expect(youtubeChannelUrl("UCX6OQ3DkcsbYNE6H8uQQuVA")).toBe(
      "https://www.youtube.com/channel/UCX6OQ3DkcsbYNE6H8uQQuVA",
    );
    expect(youtubeChannelRefUrl("handle", "MrBeast")).toBe("https://www.youtube.com/@MrBeast");
    expect(youtubeChannelRefUrl("custom", "MrBeast6000")).toBe(
      "https://www.youtube.com/c/MrBeast6000",
    );
    expect(youtubeChannelRefUrl("user", "MrBeast6000")).toBe(
      "https://www.youtube.com/user/MrBeast6000",
    );
  });

  it("gri vekil görseli elemek için eşik var", () => {
    // Ölçüm: yokluk hâlinde dönen gri görsel 1097 bayt.
    expect(YOUTUBE_THUMBNAIL_MIN_BYTES).toBeGreaterThan(1097);
  });
});

describe("parseYouTubeChannelIdFromHtml — gerçek kanal sayfası", () => {
  const html = fixture("youtube-channel-mrbeast.html");

  it("og:url'den doğru kanal kimliğini okur", () => {
    expect(parseYouTubeChannelIdFromHtml(html)).toBe("UCX6OQ3DkcsbYNE6H8uQQuVA");
  });

  it("naif ilk-eşleşme grep'i BAŞKA bir kimlik veriyor (tuzak hâlâ fixture'da)", () => {
    const naive = /UC[A-Za-z0-9_-]{22}/.exec(html)?.[0];
    expect(naive).toBe("UCvFHBqiftcFfbYGsMchSMTC");
    expect(naive).not.toBe(parseYouTubeChannelIdFromHtml(html));
  });

  it("og:url yoksa kanonik linke düşer", () => {
    const onlyCanonical =
      '<html><head><link rel="canonical" href="https://www.youtube.com/channel/UCX6OQ3DkcsbYNE6H8uQQuVA"></head></html>';
    expect(parseYouTubeChannelIdFromHtml(onlyCanonical)).toBe("UCX6OQ3DkcsbYNE6H8uQQuVA");
  });

  it("kanal kimliği taşımayan sayfada null", () => {
    expect(parseYouTubeChannelIdFromHtml("<html><head></head><body>yok</body></html>")).toBeNull();
    expect(
      parseYouTubeChannelIdFromHtml(
        '<meta property="og:url" content="https://www.youtube.com/watch?v=Af6i6ChAVTw">',
      ),
    ).toBeNull();
  });
});

describe("parseYouTubeOEmbed — gerçek oEmbed yanıtı", () => {
  const payload: unknown = JSON.parse(fixture("youtube-oembed-mrbeast.json"));

  it("başlık ve kanal adını okur", () => {
    expect(parseYouTubeOEmbed(payload)).toEqual({
      title: "Last To Leave Mansion, Keeps It",
      channelName: "MrBeast",
      channelUrl: "https://www.youtube.com/@MrBeast",
    });
  });

  it("oEmbed'in hqdefault küçük görselini taşımaz", () => {
    expect(JSON.stringify(parseYouTubeOEmbed(payload))).not.toContain("hqdefault");
  });

  it("beklenmedik gövdede null", () => {
    expect(parseYouTubeOEmbed(null)).toBeNull();
    expect(parseYouTubeOEmbed("<html>")).toBeNull();
    expect(parseYouTubeOEmbed({})).toBeNull();
  });
});

describe("parseYouTubeChannelFeed — gerçek RSS akışı", () => {
  const feed = parseYouTubeChannelFeed(fixture("youtube-feed-mrbeast.xml"));

  it("kanal kimliğini kök `yt:channelId`'den DEĞİL kanonik linkten alır", () => {
    // Akışın kökündeki etiket "UC" önekini düşürüyor; kanonik link tam kimliği verir.
    expect(feed?.channelId).toBe("UCX6OQ3DkcsbYNE6H8uQQuVA");
    expect(feed?.channelTitle).toBe("MrBeast");
  });

  it("15 videoyu en yeniden eskiye okur", () => {
    expect(feed?.videos).toHaveLength(15);
    const [latest] = feed!.videos;
    expect(latest).toEqual({
      videoId: "LiH-P4rSkLI",
      title: "Can You Pass This Classroom Quiz?",
      publishedAt: "2026-08-11T16:00:06+00:00",
      views: 33380364,
      short: true,
    });
  });

  it("normal videoyu Short saymaz", () => {
    const regular = feed!.videos.find((video) => video.videoId === "Af6i6ChAVTw");
    expect(regular?.short).toBe(false);
    expect(regular?.title).toBe("Last To Leave Mansion, Keeps It");
    expect(regular?.views).toBeGreaterThan(0);
  });

  it("her videonun kimliği geçerli ve görüntülenme sayısı okunmuş", () => {
    for (const video of feed!.videos) {
      expect(isYouTubeVideoId(video.videoId)).toBe(true);
      expect(video.views).not.toBeNull();
      expect(video.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it("XML kaçışları çözülür", () => {
    const xml = `<feed><link rel="alternate" href="https://www.youtube.com/channel/UCX6OQ3DkcsbYNE6H8uQQuVA"/><title>A &amp; B</title>
      <entry><yt:videoId>Af6i6ChAVTw</yt:videoId><title>Tom &amp; Jerry &#39;96</title>
      <link rel="alternate" href="https://www.youtube.com/watch?v=Af6i6ChAVTw"/><published>2026-01-01T00:00:00+00:00</published></entry></feed>`;
    const parsed = parseYouTubeChannelFeed(xml);
    expect(parsed?.channelTitle).toBe("A & B");
    expect(parsed?.videos[0]?.title).toBe("Tom & Jerry '96");
    // `media:statistics` yoksa sayı uydurulmaz.
    expect(parsed?.videos[0]?.views).toBeNull();
  });

  it("bozuk gövdede null döner (widget sessizce eski hâlinde kalır)", () => {
    expect(parseYouTubeChannelFeed("")).toBeNull();
    expect(parseYouTubeChannelFeed("<html><body>429</body></html>")).toBeNull();
    expect(parseYouTubeChannelFeed("<feed><title>Kanal</title></feed>")).toBeNull();
  });
});
