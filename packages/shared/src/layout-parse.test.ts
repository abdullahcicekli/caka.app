import { describe, expect, it } from "vitest";

import {
  GALLERY_MAX_PHOTOS,
  MAX_GALLERY_BLOCKS,
  MAX_LAYOUT_BLOCKS,
  ensureLayoutPositions,
  blockGridLimitIssue,
  blockIssue,
  layoutGridLimitIssues,
  parseProfileLayout,
  parseProfileLayoutDetailed,
  profileLayoutWriteSchema,
  serializeProfileLayout,
  type ProfileBlock,
} from "./layout";

const profileBlock = {
  id: "blk_profile",
  type: "profile",
  size: "1x1",
  data: { name: "Ada", title: "Tasarımcı" },
};

const linkBlock = {
  id: "blk_link",
  type: "link",
  size: "1x1",
  data: { title: "Portfolyo", url: "https://caka.app/" },
};

/** Gelecekteki bir deploy'un yazdığı, bu sürümün tanımadığı blok. */
const futureBlock = {
  id: "blk_video",
  type: "video",
  size: "2x1",
  pos: { lg: { x: 0, y: 2, w: 2, h: 2 }, sm: { x: 0, y: 2, w: 2, h: 2 } },
  data: { provider: "youtube", videoId: "dQw4w9WgXcQ" },
};

const doc = (blocks: unknown[]) => JSON.stringify({ version: 1, blocks });
/** Yarım birim işaretiyle yazılmış (yeni) belge. */
const halfUnitDoc = (blocks: unknown[]) => JSON.stringify({ version: 1, grid: 2, blocks });

describe("ızgara birimi göçü (eski hücre → yarım birim)", () => {
  const sized = (h: number) => ({
    id: "blk_link_h",
    type: "link",
    size: "2x1",
    pos: { lg: { x: 0, y: 1, w: 2, h }, sm: { x: 0, y: 1, w: 2, h } },
    data: { title: "x", url: "https://caka.app/" },
  });

  it("işaretsiz (eski) kayıtta dört ölçü de ikiye katlanır", () => {
    const layout = parseProfileLayout(doc([profileBlock, sized(2)]))!;
    const block = layout.blocks.find((item) => item.id === "blk_link_h")!;
    expect(block.pos?.lg).toEqual({ x: 0, y: 2, w: 4, h: 4 });
    expect(block.pos?.sm).toEqual({ x: 0, y: 2, w: 4, h: 4 });
  });

  it("eski 4 kolonluk blok yeni 8 kolonda aynı genişlikte kalır", () => {
    const full = {
      ...sized(1),
      pos: { lg: { x: 0, y: 0, w: 4, h: 1 }, sm: { x: 0, y: 0, w: 2, h: 1 } },
    };
    const layout = parseProfileLayout(doc([profileBlock, full]))!;
    const block = layout.blocks.find((item) => item.id === "blk_link_h")!;
    expect(block.pos?.lg.w).toBe(8);
    expect(block.pos?.sm.w).toBe(4);
  });

  it("işaretli kayıt olduğu gibi kalır (göç idempotent)", () => {
    const layout = parseProfileLayout(halfUnitDoc([profileBlock, sized(3)]))!;
    const block = layout.blocks.find((item) => item.id === "blk_link_h")!;
    expect(block.pos?.lg).toEqual({ x: 0, y: 1, w: 2, h: 3 });
  });

  it("yazılan belge her zaman işaretlenir: oku → yaz → oku aynı kalır", () => {
    const once = parseProfileLayout(doc([profileBlock, sized(2)]))!;
    const twice = parseProfileLayout(serializeProfileLayout(once))!;
    expect(twice.blocks).toEqual(once.blocks);
  });

  it("yazma şeması bayat sekmeden gelen işaretsiz belgeyi çevirir", () => {
    const parsed = profileLayoutWriteSchema.safeParse(JSON.parse(doc([profileBlock, sized(2)])));
    expect(parsed.success).toBe(true);
    const block = parsed.data?.blocks.find((item) => item.id === "blk_link_h");
    expect(block?.pos?.lg.h).toBe(4);
  });
});

describe("parseProfileLayout — geçerli düzen", () => {
  it("tanınan blokları şemadan geçirip döner", () => {
    const layout = parseProfileLayout(doc([profileBlock, linkBlock]));
    expect(layout?.version).toBe(1);
    expect(layout?.blocks.map((block) => block.id)).toEqual(["blk_profile", "blk_link"]);
  });

  it("yalnızca profil bloğu olan düzeni kabul eder (boş blocks dizisi değil)", () => {
    const layout = parseProfileLayout(doc([profileBlock]));
    expect(layout?.blocks).toHaveLength(1);
  });
});

describe("parseProfileLayout — tanınmayan blok tipi", () => {
  it("bilinmeyen tipteki bloğu düşürür, düzenin gerisini ayakta tutar", () => {
    const layout = parseProfileLayout(doc([profileBlock, futureBlock, linkBlock]));
    expect(layout).not.toBeNull();
    expect(layout?.blocks.map((block) => block.id)).toEqual(["blk_profile", "blk_link"]);
  });

  it("düşen bloğu ham hâliyle unknownBlocks içinde saklar", () => {
    const parsed = parseProfileLayoutDetailed(doc([profileBlock, futureBlock]));
    expect(parsed?.unknownBlocks).toEqual([futureBlock]);
  });
});

describe("parseProfileLayout — bozuk blok", () => {
  it("tanınan tipte ama şemaya uymayan bloğu düşürür", () => {
    // link.url http(s) olmalı: javascript: şeması reddedilir.
    const bad = { id: "blk_bad", type: "link", data: { title: "x", url: "javascript:alert(1)" } };
    const parsed = parseProfileLayoutDetailed(doc([profileBlock, bad, linkBlock]));
    expect(parsed?.layout.blocks.map((block) => block.id)).toEqual([
      "blk_profile",
      "blk_link",
    ]);
    expect(parsed?.unknownBlocks).toEqual([bad]);
  });

  it("blok yerine skaler değer varsa onu da düşürür", () => {
    const parsed = parseProfileLayoutDetailed(doc([profileBlock, 42, null]));
    expect(parsed?.layout.blocks).toHaveLength(1);
    expect(parsed?.unknownBlocks).toEqual([42, null]);
  });
});

describe("parseProfileLayout — bozuk belge kapalı biçimde başarısız olur", () => {
  it("JSON değilse null", () => {
    expect(parseProfileLayout("{ bu json değil")).toBeNull();
    expect(parseProfileLayout("")).toBeNull();
  });

  it("sürüm tutmuyorsa null", () => {
    expect(parseProfileLayout(JSON.stringify({ version: 2, blocks: [profileBlock] }))).toBeNull();
    expect(parseProfileLayout(JSON.stringify({ blocks: [profileBlock] }))).toBeNull();
  });

  it("blocks dizi değilse null", () => {
    expect(parseProfileLayout(JSON.stringify({ version: 1, blocks: {} }))).toBeNull();
    expect(parseProfileLayout(JSON.stringify({ version: 1 }))).toBeNull();
  });

  it("profil bloğu tam olarak bir tane değilse null", () => {
    expect(parseProfileLayout(doc([linkBlock]))).toBeNull();
    expect(parseProfileLayout(doc([profileBlock, { ...profileBlock, id: "blk_2" }]))).toBeNull();
    // Profil bloğu bozuksa düşer ve geriye hiç profil kalmaz → kapalı başarısızlık.
    expect(parseProfileLayout(doc([{ ...profileBlock, id: "" }, linkBlock]))).toBeNull();
  });

  it("boş blocks dizisi null (profil bloğu zorunlu)", () => {
    expect(parseProfileLayout(doc([]))).toBeNull();
    expect(parseProfileLayoutDetailed(doc([]))).toBeNull();
  });

  it("50 blok üstü belge null", () => {
    const many = [profileBlock, ...Array.from({ length: MAX_LAYOUT_BLOCKS }, (_, index) => ({
      ...linkBlock,
      id: `blk_${index}`,
    }))];
    expect(many).toHaveLength(MAX_LAYOUT_BLOCKS + 1);
    expect(parseProfileLayout(doc(many))).toBeNull();
  });
});

describe("kaydetme gidiş-dönüşü (unknown blok kaybolmaz)", () => {
  it("tanınmayan blok oku → kaydet turundan sağ çıkar", () => {
    const stored = doc([profileBlock, futureBlock, linkBlock]);
    const parsed = parseProfileLayoutDetailed(stored)!;

    // Eski deploy düzeni okur, kullanıcı bir şey değiştirir, autosave yazar.
    const edited = {
      ...parsed.layout,
      blocks: parsed.layout.blocks.map((block) =>
        block.type === "link" ? { ...block, data: { ...block.data, title: "Yeni" } } : block,
      ),
    };
    const written = serializeProfileLayout(edited, parsed.unknownBlocks);

    // Yeni deploy geri geldiğinde blok aynen yerinde.
    const roundTripped = JSON.parse(written) as { version: number; blocks: unknown[] };
    expect(roundTripped.version).toBe(1);
    expect(roundTripped.blocks).toHaveLength(3);
    expect(roundTripped.blocks).toContainEqual(futureBlock);

    // Ve eski deploy okumaya devam edebilir.
    const reread = parseProfileLayoutDetailed(written)!;
    expect(reread.layout.blocks.map((block) => block.id)).toEqual(["blk_profile", "blk_link"]);
    expect(reread.unknownBlocks).toEqual([futureBlock]);
  });

  it("unknown blok yoksa çıktı düz layout JSON'udur", () => {
    const parsed = parseProfileLayoutDetailed(doc([profileBlock]))!;
    expect(serializeProfileLayout(parsed.layout)).toBe(JSON.stringify(parsed.layout));
  });
});

describe("R6 sunucu tarafı boyut sınırları", () => {
  const withPos = (type: string, w: number, h: number): unknown => ({
    id: `blk_${type}`,
    type,
    size: "2x1",
    pos: { lg: { x: 0, y: 0, w, h }, sm: { x: 0, y: 0, w: Math.min(w, 2), h } },
    data:
      type === "status"
        ? { text: "duyuru", url: "" }
        : type === "link"
          ? { title: "x", url: "https://caka.app/" }
          : { text: "metin" },
  });

  it("status bloğu 4x4 kaydedilemez (maxH 1)", () => {
    const result = profileLayoutWriteSchema.safeParse(
      JSON.parse(doc([profileBlock, withPos("status", 4, 4)])),
    );
    expect(result.success).toBe(false);
    // Mesaj dile bağlı değil, makine okunur bir kod (metin `content/app`'te).
    expect(result.error?.issues[0]?.message).toBe("grid_limits:status");
  });

  it("link bloğu 4x3 kaydedilemez (maxH 2), 4x2 kabul edilir", () => {
    expect(
      profileLayoutWriteSchema.safeParse(JSON.parse(doc([profileBlock, withPos("link", 4, 3)])))
        .success,
    ).toBe(false);
    expect(
      profileLayoutWriteSchema.safeParse(JSON.parse(doc([profileBlock, withPos("link", 4, 2)])))
        .success,
    ).toBe(true);
  });

  it("text bloğu 4x3'e kadar kabul edilir, 4x4 reddedilir", () => {
    expect(
      profileLayoutWriteSchema.safeParse(JSON.parse(doc([profileBlock, withPos("text", 4, 3)])))
        .success,
    ).toBe(true);
    expect(
      profileLayoutWriteSchema.safeParse(JSON.parse(doc([profileBlock, withPos("text", 4, 4)])))
        .success,
    ).toBe(false);
  });

  it("mobil konum da sınırlanır", () => {
    const block = {
      id: "blk_status",
      type: "status",
      size: "2x1",
      pos: { lg: { x: 0, y: 0, w: 2, h: 1 }, sm: { x: 0, y: 0, w: 2, h: 3 } },
      data: { text: "duyuru", url: "" },
    };
    expect(
      profileLayoutWriteSchema.safeParse(JSON.parse(doc([profileBlock, block]))).success,
    ).toBe(false);
  });

  it("okuma şeması sınırı uygulamaz — eski kayıt sayfayı düşürmez", () => {
    const layout = parseProfileLayout(doc([profileBlock, withPos("status", 4, 4)]));
    expect(layout?.blocks).toHaveLength(2);
  });

  it("blockGridLimitIssue pos'suz ve profil bloğunda sessizdir", () => {
    expect(blockGridLimitIssue(profileBlock as unknown as ProfileBlock)).toBeNull();
    const layout = parseProfileLayout(doc([profileBlock, linkBlock]))!;
    expect(layoutGridLimitIssues(layout)).toEqual([]);
  });

  it("layoutGridLimitIssues sınırı aşan bloğu sınırlarıyla raporlar", () => {
    const layout = parseProfileLayout(doc([profileBlock, withPos("status", 4, 4)]))!;
    expect(layoutGridLimitIssues(layout)).toEqual([
      {
        blockId: "blk_status",
        type: "status",
        limits: { minW: 2, minH: 1, maxW: 8, maxH: 2 },
      },
    ]);
  });
});

const photo = (index: number) => ({
  assetId: `0000000${index}-0000-4000-8000-000000000000`,
  alt: `Fotoğraf ${index}`,
});

const gallery = (id: string, photoCount: number) => ({
  id,
  type: "gallery",
  size: "4x1",
  data: { title: "Kareler", photos: Array.from({ length: photoCount }, (_, i) => photo(i)) },
});

describe("galeri şeması (R62)", () => {
  it(`${GALLERY_MAX_PHOTOS} fotoğraf kabul edilir`, () => {
    const parsed = parseProfileLayoutDetailed(doc([profileBlock, gallery("blk_g", GALLERY_MAX_PHOTOS)]))!;
    const block = parsed.layout.blocks.find((item) => item.id === "blk_g")!;
    expect(block.type).toBe("gallery");
    expect(block.type === "gallery" && block.data.photos).toHaveLength(GALLERY_MAX_PHOTOS);
    expect(parsed.unknownBlocks).toEqual([]);
  });

  it(`${GALLERY_MAX_PHOTOS + 1}. fotoğraf şemadan geçmez`, () => {
    const tooMany = gallery("blk_g", GALLERY_MAX_PHOTOS + 1);
    const parsed = parseProfileLayoutDetailed(doc([profileBlock, tooMany]))!;
    // Şemaya uymayan blok düşer ama ham hâliyle korunur (KTD32).
    expect(parsed.layout.blocks.map((item) => item.id)).toEqual(["blk_profile"]);
    expect(parsed.unknownBlocks).toEqual([tooMany]);
    expect(profileLayoutWriteSchema.safeParse(JSON.parse(doc([profileBlock, tooMany]))).success).toBe(
      false,
    );
  });

  it("assetId uuid değilse fotoğraf reddedilir", () => {
    const bad = { ...gallery("blk_g", 0), data: { title: "", photos: [{ assetId: "abc", alt: "" }] } };
    expect(parseProfileLayoutDetailed(doc([profileBlock, bad]))!.unknownBlocks).toEqual([bad]);
  });

  it("alt metni isteğe bağlı, boş galeri yayına engel", () => {
    const noAlt = { ...gallery("blk_g", 0), data: { photos: [{ assetId: photo(1).assetId }] } };
    const parsed = parseProfileLayoutDetailed(doc([profileBlock, noAlt]))!;
    const block = parsed.layout.blocks.find((item) => item.id === "blk_g")!;
    expect(block.type === "gallery" && block.data.photos[0]!.alt).toBe("");
    expect(blockIssue(block)).toBeNull();
    const empty = parseProfileLayout(doc([profileBlock, gallery("blk_e", 0)]))!;
    expect(blockIssue(empty.blocks.find((item) => item.id === "blk_e")!)).toBe("gallery_empty");
  });

  it(`hesap başına ${MAX_GALLERY_BLOCKS} galeri: ${MAX_GALLERY_BLOCKS + 1}. blok yazmada reddedilir`, () => {
    const ok = doc([profileBlock, gallery("blk_g1", 1), gallery("blk_g2", 1)]);
    expect(profileLayoutWriteSchema.safeParse(JSON.parse(ok)).success).toBe(true);

    const tooMany = doc([
      profileBlock,
      gallery("blk_g1", 1),
      gallery("blk_g2", 1),
      gallery("blk_g3", 1),
    ]);
    const result = profileLayoutWriteSchema.safeParse(JSON.parse(tooMany));
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.message === "gallery_count")).toBe(true);
  });

  it("okuma şeması galeri sayısını sınırlamaz — eski kayıt sayfayı düşürmez", () => {
    const layout = parseProfileLayout(
      doc([profileBlock, gallery("blk_g1", 1), gallery("blk_g2", 1), gallery("blk_g3", 1)]),
    );
    expect(layout?.blocks).toHaveLength(4);
  });
});

describe("youtube şeması (KTD34)", () => {
  const video = {
    id: "blk_yt_v",
    type: "youtube",
    size: "2x1",
    data: {
      kind: "video",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      videoId: "dQw4w9WgXcQ",
      title: "Asla vazgeçme",
      channelName: "Rick Astley",
      duration: "3:33",
      shorts: false,
      thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
    },
  };

  const channel = {
    id: "blk_yt_c",
    type: "youtube",
    size: "2x1",
    data: {
      kind: "channel",
      url: "https://www.youtube.com/@MrBeast",
      channelId: "UCX6OQ3DkcsbYNE6H8uQQuVA",
      channelName: "MrBeast",
      handle: "MrBeast",
      subscribers: "440 Mn abone",
      views: "95 Mr görüntülenme",
      thumbnail: "https://yt3.googleusercontent.com/abc=s176",
    },
  };

  it("video ve kanal bloğu ayrı ayrı çözülür", () => {
    const layout = parseProfileLayout(doc([profileBlock, video, channel]))!;
    const byId = new Map(layout.blocks.map((block) => [block.id, block]));
    const parsedVideo = byId.get("blk_yt_v")!;
    const parsedChannel = byId.get("blk_yt_c")!;
    expect(parsedVideo.type === "youtube" && parsedVideo.data.kind).toBe("video");
    expect(parsedChannel.type === "youtube" && parsedChannel.data.kind).toBe("channel");
    expect(blockIssue(parsedVideo)).toBeNull();
    expect(blockIssue(parsedChannel)).toBeNull();
  });

  it("kimliği çözülmemiş blok yayına engel", () => {
    const draft = { ...video, data: { ...video.data, videoId: "", title: "" } };
    const layout = parseProfileLayout(doc([profileBlock, draft]))!;
    expect(blockIssue(layout.blocks.find((block) => block.id === "blk_yt_v")!)).toBe("youtube_video_url");
  });

  it("tanınmayan kind düşer, ham hâliyle korunur", () => {
    const bad = { ...video, data: { ...video.data, kind: "playlist" } };
    expect(parseProfileLayoutDetailed(doc([profileBlock, bad]))!.unknownBlocks).toEqual([bad]);
  });

  it("kimlik alanları URL kurmaya uygun karakter kümesine sınırlı", () => {
    const injected = { ...video, data: { ...video.data, videoId: "abc/../../evil" } };
    expect(parseProfileLayoutDetailed(doc([profileBlock, injected]))!.unknownBlocks).toEqual([
      injected,
    ]);
  });

  // KTD35: küçük görsel mqdefault; hqdefault hiçbir yolda geçmez.
  it("küçük görsel adresi olduğu gibi saklanır (mqdefault)", () => {
    const layout = parseProfileLayout(doc([profileBlock, video]))!;
    const block = layout.blocks.find((item) => item.id === "blk_yt_v")!;
    expect(block.type === "youtube" && block.data.thumbnail).toContain("mqdefault");
  });

  it("yeni tipler bilinmeyen-blok mekanizmasını bozmaz", () => {
    const stored = doc([profileBlock, gallery("blk_g", 2), video, futureBlock]);
    const parsed = parseProfileLayoutDetailed(stored)!;
    expect(parsed.layout.blocks.map((block) => block.id)).toEqual([
      "blk_profile",
      "blk_g",
      "blk_yt_v",
    ]);
    expect(parsed.unknownBlocks).toEqual([futureBlock]);

    const written = serializeProfileLayout(parsed.layout, parsed.unknownBlocks);
    const reread = parseProfileLayoutDetailed(written)!;
    expect(reread.layout.blocks.map((block) => block.id)).toEqual([
      "blk_profile",
      "blk_g",
      "blk_yt_v",
    ]);
    expect(reread.unknownBlocks).toEqual([futureBlock]);
  });
});

describe("yeni tiplerin ızgara sınırları", () => {
  const withPos = (block: Record<string, unknown>, w: number, h: number) => ({
    ...block,
    pos: { lg: { x: 0, y: 0, w, h }, sm: { x: 0, y: 0, w: Math.min(w, 2), h } },
  });

  it("galeri 4x1 varsayılanını ve 4x2'yi kabul eder, 4x3'ü reddeder", () => {
    const base = gallery("blk_g", 1);
    expect(
      profileLayoutWriteSchema.safeParse(JSON.parse(doc([profileBlock, withPos(base, 4, 1)]))).success,
    ).toBe(true);
    expect(
      profileLayoutWriteSchema.safeParse(JSON.parse(doc([profileBlock, withPos(base, 4, 2)]))).success,
    ).toBe(true);
    expect(
      profileLayoutWriteSchema.safeParse(JSON.parse(doc([profileBlock, withPos(base, 4, 3)]))).success,
    ).toBe(false);
  });

  it("youtube en az 2x2 olmalı: kart artık bir oynatıcı", () => {
    // Video yerinde oynatılıyor. Ölçüm: 374px genişlikte 16:9 bir video
    // 210px yükseklik ister; 1 track yalnız 156px (mobilde 138px) veriyor.
    // Bu yüzden hem genişlik hem yükseklik tabanı 2.
    const base = {
      id: "blk_yt",
      type: "youtube",
      size: "2x2",
      data: { kind: "video", url: "", videoId: "abc", title: "", channelName: "", shorts: false, verticalThumbnail: false, thumbnail: "" },
    };
    const kabul = (w: number, h: number) =>
      profileLayoutWriteSchema.safeParse(JSON.parse(doc([profileBlock, withPos(base, w, h)]))).success;
    expect(kabul(1, 2)).toBe(false); // dar
    expect(kabul(2, 1)).toBe(false); // alçak — oynatıcı sığmaz
    expect(kabul(2, 2)).toBe(true);
    expect(kabul(4, 2)).toBe(true);
  });

  it("spotify parçası 2x1'e sığar ama 1 track'e daralmaz", () => {
    // Ölçüm: Spotify kompakt parça oynatıcısı 152px; masaüstü 2x1 = 156px.
    // Genişlik tabanı 2 çünkü 181px'lik bir oynatıcıda kontroller sığmıyor.
    const base = {
      id: "blk_sp",
      type: "spotify",
      size: "2x1",
      data: { kind: "track", url: "", entityId: "abc123", title: "", thumbnail: "" },
    };
    const kabul = (w: number, h: number) =>
      profileLayoutWriteSchema.safeParse(JSON.parse(doc([profileBlock, withPos(base, w, h)]))).success;
    expect(kabul(1, 1)).toBe(false);
    expect(kabul(2, 1)).toBe(true);
    expect(kabul(2, 2)).toBe(true);
  });

  it("ensureLayoutPositions galeri varsayılanını 4 track olarak yerleştirir", () => {
    const layout = ensureLayoutPositions(parseProfileLayout(doc([profileBlock, gallery("blk_g", 1)]))!);
    const block = layout.blocks.find((item) => item.id === "blk_g")!;
    expect(block.pos?.lg).toEqual({ x: 0, y: 0, w: 8, h: 2 });
    // Mobilde 4 yarım sütun (= eski 2 sütun): genişlik kırpılır.
    expect(block.pos?.sm.w).toBe(4);
  });
});

describe("ensureLayoutPositions — tip tavanına kırpma", () => {
  // Sunucu artık BLOCK_GRID_LIMITS'i yazmada uyguluyor; sınır yalnız
  // istemcide dururken yazılmış eski kayıtlar kırpılmazsa kullanıcı
  // sayfasını bir daha kaydedemezdi.
  const oversized = {
    id: "blk_status",
    type: "status",
    size: "2x2",
    pos: { lg: { x: 0, y: 0, w: 2, h: 4 }, sm: { x: 0, y: 0, w: 2, h: 4 } },
    data: { text: "duyuru", url: "" },
  };

  it("mevcut pos'u tip tavanına kırpar ve yazma şeması kabul eder", () => {
    const layout = ensureLayoutPositions(parseProfileLayout(doc([profileBlock, oversized]))!);
    const block = layout.blocks.find((item) => item.id === "blk_status")!;
    // status tavanı 2 yarım satır (= 1 tam satır).
    expect(block.pos?.lg.h).toBe(2);
    expect(block.pos?.sm.h).toBe(2);
    expect(profileLayoutWriteSchema.safeParse(layout).success).toBe(true);
  });

  it("pos'suz eski bloğu da tavana göre yerleştirir", () => {
    const legacy = { id: "blk_s2", type: "status", size: "2x2", data: { text: "x", url: "" } };
    const layout = ensureLayoutPositions(parseProfileLayout(doc([profileBlock, legacy]))!);
    expect(layout.blocks.find((item) => item.id === "blk_s2")?.pos?.lg.h).toBe(2);
  });

  it("sınır içindeki bloğa dokunmaz (idempotent)", () => {
    const layout = parseProfileLayout(doc([profileBlock, linkBlock]))!;
    const once = ensureLayoutPositions(layout);
    expect(ensureLayoutPositions(once)).toEqual(once);
  });
});
