import { describe, expect, it } from "vitest";

import {
  BLOCK_GRID_LIMITS,
  GRID_COLUMNS,
  PROFILE_BIO_MAX,
  blockIssue,
  detectSocialFromUrl,
  ensureLayoutPositions,
  layoutIssues,
  parseProfileLayout,
  placeNewBlock,
  profileLayoutSchema,
  sizeFromDims,
  sizeToDims,
  socialUrl,
  withDerivedSmPositions,
  type ProfileBlock,
  type ProfileLayout,
} from "./layout";
import { DOCUMENT_MAX_BYTES } from "./document";

const profileBlock = {
  id: "blk_profile",
  type: "profile" as const,
  size: "1x1" as const,
  data: { name: "Ada", title: "Tasarımcı" },
};

describe("profileLayoutSchema", () => {
  it("normalizes scheme-less link URLs", () => {
    const result = profileLayoutSchema.parse({
      version: 1,
      blocks: [
        profileBlock,
        {
          id: "blk_1",
          type: "link",
          size: "2x1",
          data: { title: "Portfolyo", url: "caka.app" },
        },
      ],
    });
    expect(result.blocks.find((block) => block.type === "link")?.data).toMatchObject({ url: "https://caka.app/" });
  });

  it("rejects unsafe URL schemes", () => {
    expect(() =>
      profileLayoutSchema.parse({
        version: 1,
        blocks: [
          profileBlock,
          {
            id: "blk_1",
            type: "link",
            data: { title: "Kötü", url: "javascript:alert(1)" },
          },
        ],
      }),
    ).toThrow();
  });

  it("accepts a 160-character profile bio and rejects overflow", () => {
    const makeLayout = (title: string) => ({
      version: 1,
      blocks: [
        {
          id: "blk_profile",
          type: "profile",
          data: { name: "Ada", title },
        },
      ],
    });
    expect(() => profileLayoutSchema.parse(makeLayout("a".repeat(PROFILE_BIO_MAX)))).not.toThrow();
    expect(() => profileLayoutSchema.parse(makeLayout("a".repeat(PROFILE_BIO_MAX + 1)))).toThrow();
  });

  it("requires exactly one fixed profile block", () => {
    expect(() => profileLayoutSchema.parse({ version: 1, blocks: [] })).toThrow();
    expect(() => profileLayoutSchema.parse({ version: 1, blocks: [profileBlock, { ...profileBlock, id: "blk_profile_2" }] })).toThrow();
  });

  it("rejects positions that overflow the column count", () => {
    const overflowing = {
      version: 1,
      blocks: [
        profileBlock,
        {
          id: "blk_1",
          type: "link",
          data: { title: "Taşan", url: "https://caka.app" },
          // 8 yarım kolonluk ızgarada x=7,w=2 taşar.
          pos: { lg: { x: 7, y: 0, w: 2, h: 1 }, sm: { x: 0, y: 0, w: 2, h: 1 } },
        },
      ],
    };
    expect(() => profileLayoutSchema.parse(overflowing)).toThrow();
  });
});

function bento(
  id: string,
  lg: { x: number; y: number; w: number; h: number },
  smManual = false,
  sm?: { x: number; y: number; w: number; h: number },
): ProfileBlock {
  return {
    id,
    type: "link",
    size: sizeFromDims(lg.w, lg.h),
    smManual,
    pos: { lg, sm: sm ?? { x: 0, y: 0, w: Math.min(lg.w, 2), h: lg.h } },
    data: { title: id, url: "", ogImage: "", favicon: "" },
  };
}

describe("boyut sözlüğü", () => {
  const ALL_SIZES = ["1x1", "1x2", "2x1", "2x2", "4x1", "4x2"] as const;

  it("sözlükteki her etiket sizeToDims → sizeFromDims turundan kendisi olarak çıkar", () => {
    for (const size of ALL_SIZES) {
      const { w, h } = sizeToDims(size);
      expect(sizeFromDims(w, h)).toBe(size);
    }
  });

  // Etiket eski hücre biriminde, ızgara yarım birimde (GRID_UNIT).
  it("sizeToDims etiketi yarım birim ölçüsüne çevirir", () => {
    expect(sizeToDims("1x2")).toEqual({ w: 2, h: 4 });
    expect(sizeToDims("2x1")).toEqual({ w: 4, h: 2 });
    expect(sizeToDims("4x2")).toEqual({ w: 8, h: 4 });
  });

  // KTD33: eski sözlükte yalnız 1x1/2x1/2x2 vardı; dikey tile ve tam
  // genişlik etiketleri kayboluyordu.
  it("dikey tile ve tam genişlik artık kaybolmuyor", () => {
    expect(sizeFromDims(2, 4)).toBe("1x2");
    expect(sizeFromDims(8, 2)).toBe("4x1");
    expect(sizeFromDims(8, 4)).toBe("4x2");
  });

  it("sözlükte karşılığı olmayan ara ölçüler bir alt basamağa yuvarlanır", () => {
    // 5 yarım kolon (463px) ve 3 yarım satır (240px) sözlükte yok: ikisi de
    // bir alt basamağa yuvarlanır.
    expect(sizeFromDims(5, 2)).toBe("2x1");
    expect(sizeFromDims(5, 3)).toBe("2x1");
    expect(sizeFromDims(3, 6)).toBe("1x2");
    expect(sizeFromDims(0, 0)).toBe("1x1");
  });

  it("gidiş-dönüş: etiket → ölçü → etiket kendisi kalır", () => {
    for (const size of ["1x1", "1x2", "2x1", "2x2", "4x1", "4x2"] as const) {
      const { w, h } = sizeToDims(size);
      expect(sizeFromDims(w, h)).toBe(size);
    }
  });
});

describe("grid position helpers", () => {
  it("converts sizes to dims and back", () => {
    // Yükseklik yarım satır: "2x1" = 1 tam satır = 2 birim.
    expect(sizeToDims("2x1")).toEqual({ w: 4, h: 2 });
    expect(sizeFromDims(4, 4)).toBe("2x2");
  });

  it("derives mobile positions in desktop reading order with width clamped to 4", () => {
    const blocks = [
      bento("a", { x: 0, y: 0, w: 8, h: 2 }),
      bento("b", { x: 4, y: 2, w: 2, h: 2 }),
      bento("c", { x: 0, y: 2, w: 2, h: 2 }),
    ];
    const derived = withDerivedSmPositions(blocks);
    // Mobil 4 yarım kolon: tam genişlik blok 8'den 4'e kırpılır.
    expect(derived[0]!.pos!.sm).toEqual({ x: 0, y: 0, w: 4, h: 2 });
    // Okuma sırası: c (y2,x0) b'den (y2,x4) önce gelir.
    expect(derived[2]!.pos!.sm).toEqual({ x: 0, y: 2, w: 2, h: 2 });
    expect(derived[1]!.pos!.sm).toEqual({ x: 2, y: 2, w: 2, h: 2 });
  });

  it("keeps smManual blocks fixed and flows the rest around them", () => {
    const manual = bento("manual", { x: 0, y: 0, w: 2, h: 2 }, true, { x: 0, y: 0, w: 4, h: 4 });
    const auto = bento("auto", { x: 2, y: 0, w: 2, h: 2 });
    const derived = withDerivedSmPositions([manual, auto]);
    expect(derived[0]!.pos!.sm).toEqual({ x: 0, y: 0, w: 4, h: 4 });
    expect(derived[1]!.pos!.sm).toEqual({ x: 0, y: 4, w: 2, h: 2 });
  });

  it("fills missing positions from legacy sizes without overlap", () => {
    const layout: ProfileLayout = {
      version: 1,
      grid: 2,
      blocks: [
        { ...profileBlock },
        { id: "blk_1", type: "link", size: "1x1", data: { title: "a", url: "" } },
        { id: "blk_2", type: "link", size: "2x1", data: { title: "b", url: "" } },
        { id: "blk_3", type: "link", size: "1x1", data: { title: "c", url: "" } },
      ] as ProfileLayout["blocks"],
    };
    const ensured = ensureLayoutPositions(layout);
    const positions = ensured.blocks.filter((b) => b.type !== "profile").map((b) => b.pos!.lg);
    expect(positions).toEqual([
      { x: 0, y: 0, w: 2, h: 2 },
      { x: 2, y: 0, w: 4, h: 2 },
      { x: 6, y: 0, w: 2, h: 2 },
    ]);
    // Idempotent: ikinci çağrı değişiklik yapmaz.
    expect(ensureLayoutPositions(ensured)).toEqual(ensured);
  });

  it("places new blocks into the first free desktop slot", () => {
    const blocks = [bento("a", { x: 0, y: 0, w: 8, h: 2 }), bento("b", { x: 0, y: 2, w: 4, h: 2 })];
    expect(placeNewBlock(blocks, 4, 2)).toEqual({ x: 4, y: 2, w: 4, h: 2 });
  });
});

describe("detectSocialFromUrl", () => {
  it("nsosyal profil bağlantısından platform + kullanıcı adı çıkarır", () => {
    expect(detectSocialFromUrl("https://nsosyal.com/teknofest")).toEqual({
      platform: "nsosyal",
      handle: "teknofest",
      url: "https://nsosyal.com/teknofest",
    });
  });

  it("şemasız ve @'li bağlantıları normalize eder", () => {
    expect(detectSocialFromUrl("tiktok.com/@gdh")).toMatchObject({
      platform: "tiktok",
      handle: "gdh",
    });
  });

  it("linkedin /in/ ve /company/ yollarından kullanıcı adı çıkarır", () => {
    expect(detectSocialFromUrl("https://www.linkedin.com/in/ada-lovelace")).toMatchObject({
      platform: "linkedin",
      handle: "ada-lovelace",
    });
    expect(detectSocialFromUrl("https://linkedin.com/company/acme")).toMatchObject({
      platform: "linkedin",
      handle: "acme",
    });
  });

  it("bilinmeyen host ve düz kullanıcı adı için null döner", () => {
    expect(detectSocialFromUrl("https://ornek.dev/ben")).toBeNull();
    expect(detectSocialFromUrl("teknofest")).toBeNull();
  });
});

describe("blockIssue", () => {
  it("taslak şeması boş alanlı blokları kabul eder", () => {
    expect(() =>
      profileLayoutSchema.parse({
        version: 1,
        blocks: [
          { id: "blk_p", type: "profile", data: { name: "", title: "" } },
          { id: "blk_1", type: "link", data: { title: "", url: "" } },
          { id: "blk_2", type: "text", data: { text: "" } },
        ],
      }),
    ).not.toThrow();
  });

  it("eksik alanlar için sorun kimliği, tamam bloklar için null döner", () => {
    const parsed = profileLayoutSchema.parse({
      version: 1,
      blocks: [
        { id: "blk_p", type: "profile", data: { name: "", title: "" } },
        { id: "blk_link", type: "link", data: { title: "", url: "" } },
        { id: "blk_link2", type: "link", data: { title: "", url: "caka.app" } },
        { id: "blk_social", type: "social", data: { platform: "x", handle: "", url: "", label: "" } },
        { id: "blk_text", type: "text", data: { text: "" } },
        { id: "blk_status", type: "status", data: { text: "" } },
        { id: "blk_photo", type: "gallery", data: {} },
      ],
    });
    const byId = new Map(parsed.blocks.map((block) => [block.id, block]));
    expect(blockIssue(byId.get("blk_p")!)).toBe("profile_name");
    expect(blockIssue(byId.get("blk_link")!)).toBe("link_url");
    expect(blockIssue(byId.get("blk_link2")!)).toBe("link_title");
    expect(blockIssue(byId.get("blk_social")!)).toBe("social_target");
    expect(blockIssue(byId.get("blk_text")!)).toBe("text_empty");
    expect(blockIssue(byId.get("blk_status")!)).toBe("status_empty");
    expect(blockIssue(byId.get("blk_photo")!)).toBe("gallery_empty");
    expect(blockIssue({ ...profileBlock })).toBeNull();
  });

  // socialUrl("email", …) http(s) URL üretmez (KTD8); e-posta bloğu yalnız
  // handle ile dolar ve yayın kilitlenmemeli.
  it("http(s) URL üretmeyen platformda dolu handle yeterlidir", () => {
    const parsed = profileLayoutSchema.parse({
      version: 1,
      blocks: [
        { ...profileBlock },
        {
          id: "blk_mail",
          type: "social",
          data: { platform: "email", handle: "merhaba@caka.app", url: "", label: "E-posta" },
        },
      ],
    });
    const mail = parsed.blocks.find((block) => block.id === "blk_mail")!;
    expect(blockIssue(mail)).toBeNull();
    expect(layoutIssues(parsed)).toEqual([]);
  });
});

describe("layoutIssues", () => {
  it("eksik blokları kimliğiyle listeler, tam düzen için boş döner", () => {
    const incomplete = profileLayoutSchema.parse({
      version: 1,
      blocks: [
        { ...profileBlock },
        { id: "blk_1", type: "link", data: { title: "", url: "" } },
      ],
    });
    expect(layoutIssues(incomplete)).toEqual([
      { blockId: "blk_1", type: "link", issue: "link_url" },
    ]);

    const complete = profileLayoutSchema.parse({
      version: 1,
      blocks: [
        { ...profileBlock },
        { id: "blk_1", type: "link", data: { title: "Portfolyo", url: "caka.app" } },
      ],
    });
    expect(layoutIssues(complete)).toEqual([]);
  });
});

describe("socialUrl", () => {
  it("nsosyal kullanıcı adından profil bağlantısı üretir", () => {
    expect(socialUrl("nsosyal", "@teknofest")).toBe("https://nsosyal.com/teknofest");
  });

  it("email için bağlantı üretmez", () => {
    expect(socialUrl("email", "merhaba@caka.app")).toBe("");
  });
});

describe("ensureLayoutPositions — genişleten kırpma ızgarayı taşırmaz", () => {
  it("minW bloğu genişletirken x'i sola çeker", () => {
    // youtube.minW = 4 (yarım birim); mobilde (4 yarım sütun) x=1,w=1 bir
    // blok w=4'e çıkınca x + w = 5 ederdi ve yazma şeması sonraki kaydı
    // kalıcı olarak reddederdi. Kayıt eski birimde yazılmış (işaretsiz),
    // yani okunurken x=3,w=1 → x=6,w=2 olur ve minW hâlâ genişletir.
    const layout = parseProfileLayout(
      JSON.stringify({
        version: 1,
        blocks: [
          {
            id: "blk_p",
            type: "profile",
            size: "2x2",
            pos: { lg: { x: 0, y: 0, w: 2, h: 2 }, sm: { x: 0, y: 0, w: 2, h: 2 } },
            data: { name: "A", title: "" },
          },
          {
            id: "blk_yt",
            type: "youtube",
            size: "2x1",
            pos: { lg: { x: 3, y: 0, w: 1, h: 1 }, sm: { x: 1, y: 2, w: 1, h: 1 } },
            data: { kind: "video", url: "", videoId: "", title: "", channelName: "", shorts: false, verticalThumbnail: false, thumbnail: "" },
          },
        ],
      }),
    );
    expect(layout).not.toBeNull();
    const fixed = ensureLayoutPositions(layout!);
    const yt = fixed.blocks.find((b) => b.id === "blk_yt")!;
    expect(yt.pos!.sm.w).toBe(4);
    expect(yt.pos!.sm.x + yt.pos!.sm.w).toBeLessThanOrEqual(GRID_COLUMNS.sm);
    expect(yt.pos!.lg.x + yt.pos!.lg.w).toBeLessThanOrEqual(GRID_COLUMNS.lg);
    // İdempotent olmalı: ikinci geçiş bir şey değiştirmemeli.
    expect(ensureLayoutPositions(fixed)).toEqual(fixed);
  });
});

describe("belge bloğu şeması", () => {
  const uuid = "6f1c2f5c-1a1e-4a0e-9a1b-2f3c4d5e6f70";

  it("boş taslak olarak doğar ve varsayılanları alır", () => {
    const parsed = profileLayoutSchema.parse({
      version: 1,
      blocks: [profileBlock, { id: "blk_d", type: "document", data: {} }],
    });
    const block = parsed.blocks[1]!;
    if (block.type !== "document") throw new Error("beklenmeyen tip");
    expect(block.data).toEqual({ title: "", fileName: "", bytes: 0, uploadedAt: 0 });
    expect(blockIssue(block)).toBe("document_missing");
  });

  it("dosya yüklenince yayına hazır olur", () => {
    const parsed = profileLayoutSchema.parse({
      version: 1,
      blocks: [
        profileBlock,
        {
          id: "blk_d",
          type: "document",
          data: { assetId: uuid, fileName: "cv.pdf", bytes: 1024, uploadedAt: 1_700_000_000_000 },
        },
      ],
    });
    expect(blockIssue(parsed.blocks[1]!)).toBeNull();
  });

  it("boyut tavanını ve UUID olmayan asset kimliğini reddeder", () => {
    const base = { id: "blk_d", type: "document" as const };
    expect(() =>
      profileLayoutSchema.parse({
        version: 1,
        blocks: [profileBlock, { ...base, data: { bytes: DOCUMENT_MAX_BYTES + 1 } }],
      }),
    ).toThrow();
    expect(() =>
      profileLayoutSchema.parse({
        version: 1,
        blocks: [profileBlock, { ...base, data: { assetId: "../../etc" } }],
      }),
    ).toThrow();
  });

  it("tip tabanı kartın ölçülen asgarisidir (yarım birimde 4×2)", () => {
    expect(BLOCK_GRID_LIMITS.document).toEqual({ minW: 4, minH: 2, maxW: 8, maxH: 4 });
  });
});
