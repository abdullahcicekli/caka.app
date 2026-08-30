import { describe, expect, it } from "vitest";

import {
  MAX_POSTS_PER_PROFILE,
  POST_BODY_MAX_BYTES,
  POST_TITLE_MAX,
  POST_STATUSES,
  isPostBodyWithinLimit,
  postBodyByteLength,
  postHeadingLevel,
  postImageAssetId,
  validatePostDoc,
} from "./post";

// Testlerde kullanılan geçerli birinci taraf görsel kimliği (R2 asset UUID'i).
const ASSET_ID = "0b6f8f2e-6a54-4f6e-9a3b-2f1d4c5e6a7b";

function doc(content: unknown[]) {
  return { type: "doc", content };
}

const paragraph = (text: string) => ({
  type: "paragraph",
  content: [{ type: "text", text }],
});

describe("yazı sabitleri", () => {
  it("R7/R8 sınırlarını sabitler", () => {
    expect(POST_TITLE_MAX).toBe(120);
    expect(POST_BODY_MAX_BYTES).toBe(50 * 1024);
    expect(MAX_POSTS_PER_PROFILE).toBe(20);
  });

  it("durum tipleri taslak ve yayında'dan ibarettir", () => {
    expect(POST_STATUSES).toEqual(["draft", "published"]);
  });
});

describe("postBodyByteLength", () => {
  it("baytı sayar, karakteri değil", () => {
    expect(postBodyByteLength("abc")).toBe(3);
    // "ğ" UTF-8'de 2 bayttır — karakter sayımı sınırı yanlış ölçerdi.
    expect(postBodyByteLength("ğ")).toBe(2);
  });
});

describe("isPostBodyWithinLimit", () => {
  it("tam sınırı kabul eder, bir bayt fazlasını reddeder", () => {
    expect(isPostBodyWithinLimit("a".repeat(POST_BODY_MAX_BYTES))).toBe(true);
    expect(isPostBodyWithinLimit("a".repeat(POST_BODY_MAX_BYTES + 1))).toBe(false);
  });

  it("çok baytlı karakterlerde de bayt üstünden ölçer", () => {
    // 25 * 1024 adet "ğ" = tam 50 KB → sınır içinde; bir "a" daha taşırır.
    const body = "ğ".repeat((50 * 1024) / 2);
    expect(isPostBodyWithinLimit(body)).toBe(true);
    expect(isPostBodyWithinLimit(body + "a")).toBe(false);
  });
});

describe("validatePostDoc", () => {
  it("başlık/kod/görsel düğümlü doküman şemadan geçer (R6)", () => {
    const result = validatePostDoc(
      doc([
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Başlık" }] },
        paragraph("Merhaba"),
        { type: "codeBlock", content: [{ type: "text", text: "const a = 1;" }] },
        { type: "image", attrs: { src: `/i/${ASSET_ID}`, alt: "Şema" } },
        {
          type: "bulletList",
          content: [{ type: "listItem", content: [paragraph("madde")] }],
        },
        { type: "blockquote", content: [paragraph("alıntı")] },
      ]),
    );
    expect(result).toEqual({ ok: true });
  });

  it("izin listesi dışındaki düğümü kimlikli hatayla reddeder — sessiz düşme yok (R6)", () => {
    const result = validatePostDoc(doc([{ type: "table", content: [] }]));
    expect(result).toEqual({ ok: false, issue: "unknown_node", detail: "table" });
  });

  it("iç içe geçmiş izin dışı düğümü de yakalar", () => {
    const result = validatePostDoc(
      doc([{ type: "blockquote", content: [{ type: "iframe" }] }]),
    );
    expect(result).toEqual({ ok: false, issue: "unknown_node", detail: "iframe" });
  });

  it("bilinmeyen mark'ı kimlikli hatayla reddeder", () => {
    const result = validatePostDoc(
      doc([
        {
          type: "paragraph",
          content: [{ type: "text", text: "x", marks: [{ type: "highlight" }] }],
        },
      ]),
    );
    expect(result).toEqual({ ok: false, issue: "unknown_mark", detail: "highlight" });
  });

  it("mevcut mark'ları (bold/italic/strike/underline/link) kabul eder", () => {
    const result = validatePostDoc(
      doc([
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "x",
              marks: [
                { type: "bold" },
                { type: "italic" },
                { type: "strike" },
                { type: "underline" },
                { type: "link", attrs: { href: "https://caka.app" } },
              ],
            },
          ],
        },
      ]),
    );
    expect(result).toEqual({ ok: true });
  });

  it("görsel src'si birinci taraf deseni dışındaysa reddeder (R9)", () => {
    for (const src of [
      "https://evil.example/x.png",
      "/b/" + ASSET_ID,
      "/i/../gizli",
      "/i/degil-uuid",
      "",
      undefined,
    ]) {
      const result = validatePostDoc(doc([{ type: "image", attrs: { src } }]));
      expect(result).toEqual({ ok: false, issue: "invalid_image_src" });
    }
  });

  it("alt'sız görsel geçer, string olmayan alt reddedilir", () => {
    expect(validatePostDoc(doc([{ type: "image", attrs: { src: `/i/${ASSET_ID}` } }]))).toEqual({
      ok: true,
    });
    expect(
      validatePostDoc(doc([{ type: "image", attrs: { src: `/i/${ASSET_ID}`, alt: 42 } }])),
    ).toEqual({ ok: false, issue: "invalid_image_alt" });
  });

  it("doküman kökü doc değilse reddeder", () => {
    expect(validatePostDoc(null)).toEqual({ ok: false, issue: "invalid_doc" });
    expect(validatePostDoc("metin")).toEqual({ ok: false, issue: "invalid_doc" });
    expect(validatePostDoc({ type: "paragraph" })).toEqual({ ok: false, issue: "invalid_doc" });
  });

  it("50 KB sınırı: altı geçer, üstü kimlikli hatayla reddedilir (R7)", () => {
    const filler = (bytes: number) => doc([paragraph("a".repeat(bytes))]);
    expect(validatePostDoc(filler(1000))).toEqual({ ok: true });
    expect(validatePostDoc(filler(POST_BODY_MAX_BYTES))).toEqual({
      ok: false,
      issue: "body_too_large",
    });
  });
});

describe("postImageAssetId", () => {
  it("birinci taraf /i/<uuid> deseninden asset kimliğini çıkarır", () => {
    expect(postImageAssetId(`/i/${ASSET_ID}`)).toBe(ASSET_ID);
  });

  it("desen dışını null döner — render bu düğümü basmaz", () => {
    expect(postImageAssetId(`https://caka.app/i/${ASSET_ID}`)).toBeNull();
    expect(postImageAssetId(`/i/${ASSET_ID}/../x`)).toBeNull();
    expect(postImageAssetId("/i/abc")).toBeNull();
    expect(postImageAssetId(42)).toBeNull();
  });
});

describe("postHeadingLevel", () => {
  it("h1 sayfa başlığına ayrılmıştır: 1 ve 2 → h2, 3+ → h3", () => {
    expect(postHeadingLevel(1)).toBe(2);
    expect(postHeadingLevel(2)).toBe(2);
    expect(postHeadingLevel(3)).toBe(3);
    expect(postHeadingLevel(6)).toBe(3);
  });

  it("sayı olmayan seviye h2'ye düşer (deterministik)", () => {
    expect(postHeadingLevel(undefined)).toBe(2);
    expect(postHeadingLevel("3")).toBe(2);
  });
});
