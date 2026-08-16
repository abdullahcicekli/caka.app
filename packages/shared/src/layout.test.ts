import { describe, expect, it } from "vitest";

import {
  PROFILE_BIO_MAX,
  blockIssue,
  detectSocialFromUrl,
  ensureLayoutPositions,
  layoutIssues,
  placeNewBlock,
  profileLayoutSchema,
  sizeFromDims,
  sizeToDims,
  socialUrl,
  withDerivedSmPositions,
  type ProfileBlock,
  type ProfileLayout,
} from "./layout";

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
          pos: { lg: { x: 3, y: 0, w: 2, h: 1 }, sm: { x: 0, y: 0, w: 2, h: 1 } },
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
    data: { title: id, url: "" },
  };
}

describe("grid position helpers", () => {
  it("converts sizes to dims and back", () => {
    expect(sizeToDims("2x1")).toEqual({ w: 2, h: 1 });
    expect(sizeFromDims(2, 2)).toBe("2x2");
    expect(sizeFromDims(3, 1)).toBe("2x1");
    expect(sizeFromDims(1, 2)).toBe("1x1");
  });

  it("derives mobile positions in desktop reading order with width clamped to 2", () => {
    const blocks = [
      bento("a", { x: 0, y: 0, w: 4, h: 1 }),
      bento("b", { x: 2, y: 1, w: 1, h: 1 }),
      bento("c", { x: 0, y: 1, w: 1, h: 1 }),
    ];
    const derived = withDerivedSmPositions(blocks);
    expect(derived[0]!.pos!.sm).toEqual({ x: 0, y: 0, w: 2, h: 1 });
    // Okuma sırası: c (y1,x0) b'den (y1,x2) önce gelir.
    expect(derived[2]!.pos!.sm).toEqual({ x: 0, y: 1, w: 1, h: 1 });
    expect(derived[1]!.pos!.sm).toEqual({ x: 1, y: 1, w: 1, h: 1 });
  });

  it("keeps smManual blocks fixed and flows the rest around them", () => {
    const manual = bento("manual", { x: 0, y: 0, w: 1, h: 1 }, true, { x: 0, y: 0, w: 2, h: 2 });
    const auto = bento("auto", { x: 1, y: 0, w: 1, h: 1 });
    const derived = withDerivedSmPositions([manual, auto]);
    expect(derived[0]!.pos!.sm).toEqual({ x: 0, y: 0, w: 2, h: 2 });
    expect(derived[1]!.pos!.sm).toEqual({ x: 0, y: 2, w: 1, h: 1 });
  });

  it("fills missing positions from legacy sizes without overlap", () => {
    const layout: ProfileLayout = {
      version: 1,
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
      { x: 0, y: 0, w: 1, h: 1 },
      { x: 1, y: 0, w: 2, h: 1 },
      { x: 3, y: 0, w: 1, h: 1 },
    ]);
    // Idempotent: ikinci çağrı değişiklik yapmaz.
    expect(ensureLayoutPositions(ensured)).toEqual(ensured);
  });

  it("places new blocks into the first free desktop slot", () => {
    const blocks = [bento("a", { x: 0, y: 0, w: 4, h: 1 }), bento("b", { x: 0, y: 1, w: 2, h: 1 })];
    expect(placeNewBlock(blocks, 2, 1)).toEqual({ x: 2, y: 1, w: 2, h: 1 });
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

  it("eksik alanlar için Türkçe mesaj, tamam bloklar için null döner", () => {
    const parsed = profileLayoutSchema.parse({
      version: 1,
      blocks: [
        { id: "blk_p", type: "profile", data: { name: "", title: "" } },
        { id: "blk_link", type: "link", data: { title: "", url: "" } },
        { id: "blk_link2", type: "link", data: { title: "", url: "caka.app" } },
        { id: "blk_social", type: "social", data: { platform: "x", handle: "", url: "", label: "" } },
        { id: "blk_text", type: "text", data: { text: "" } },
        { id: "blk_status", type: "status", data: { text: "" } },
        { id: "blk_image", type: "image", data: {} },
      ],
    });
    const byId = new Map(parsed.blocks.map((block) => [block.id, block]));
    expect(blockIssue(byId.get("blk_p")!)).toBe("Adını gir");
    expect(blockIssue(byId.get("blk_link")!)).toBe("Bağlantı adresi gir");
    expect(blockIssue(byId.get("blk_link2")!)).toBe("Başlık gir");
    expect(blockIssue(byId.get("blk_social")!)).toBe("Bağlantı ya da kullanıcı adı gir");
    expect(blockIssue(byId.get("blk_text")!)).toBe("Metin yaz");
    expect(blockIssue(byId.get("blk_status")!)).toBe("Duyuru metni yaz");
    expect(blockIssue(byId.get("blk_image")!)).toBe("Görsel yükle");
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
  it("eksik blokları etiketiyle listeler, tam düzen için boş döner", () => {
    const incomplete = profileLayoutSchema.parse({
      version: 1,
      blocks: [
        { ...profileBlock },
        { id: "blk_1", type: "link", data: { title: "", url: "" } },
      ],
    });
    expect(layoutIssues(incomplete)).toEqual([
      { blockId: "blk_1", label: "Bağlantı", message: "Bağlantı adresi gir" },
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
