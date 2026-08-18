import { describe, expect, it } from "vitest";

import {
  MAX_LAYOUT_BLOCKS,
  ensureLayoutPositions,
  blockGridLimitIssue,
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
    expect(result.error?.issues[0]?.message).toContain("en fazla 4×1");
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

  it("layoutGridLimitIssues sınırı aşan bloğu etiketiyle raporlar", () => {
    const layout = parseProfileLayout(doc([profileBlock, withPos("status", 4, 4)]))!;
    expect(layoutGridLimitIssues(layout)).toEqual([
      {
        blockId: "blk_status",
        label: "Duyuru",
        message: "Duyuru bloğu en az 1×1, en fazla 4×1 olabilir",
      },
    ]);
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
    expect(block.pos?.lg.h).toBe(1);
    expect(block.pos?.sm.h).toBe(1);
    expect(profileLayoutWriteSchema.safeParse(layout).success).toBe(true);
  });

  it("pos'suz eski bloğu da tavana göre yerleştirir", () => {
    const legacy = { id: "blk_s2", type: "status", size: "2x2", data: { text: "x", url: "" } };
    const layout = ensureLayoutPositions(parseProfileLayout(doc([profileBlock, legacy]))!);
    expect(layout.blocks.find((item) => item.id === "blk_s2")?.pos?.lg.h).toBe(1);
  });

  it("sınır içindeki bloğa dokunmaz (idempotent)", () => {
    const layout = parseProfileLayout(doc([profileBlock, linkBlock]))!;
    const once = ensureLayoutPositions(layout);
    expect(ensureLayoutPositions(once)).toEqual(once);
  });
});
