import { describe, expect, it } from "vitest";

import {
  computeOgHash,
  isOgSourceImageSafe,
  jpegSize,
  OG_IMAGE_MAX_SOURCE_PIXELS,
  OG_IMAGE_MAX_UNPARSED_BYTES,
  ogImagePath,
  pngSize,
  type OgProfileData,
} from "./og-image";

/** Geçerli PNG başlığı üretir (imza + IHDR chunk'ı). */
function pngHeader(width: number, height: number, opts?: { badSignature?: boolean; chunkType?: string }): Uint8Array {
  const bytes = new Uint8Array(33);
  const dv = new DataView(bytes.buffer);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  if (opts?.badSignature) bytes[0] = 0x00;
  dv.setUint32(8, 13); // IHDR veri uzunluğu
  const type = opts?.chunkType ?? "IHDR";
  for (let i = 0; i < 4; i++) bytes[12 + i] = type.charCodeAt(i);
  dv.setUint32(16, width);
  dv.setUint32(20, height);
  return bytes;
}

/** SOI + segmentlerden minimal JPEG baytları üretir. */
function jpegBytes(segments: number[][]): Uint8Array {
  return new Uint8Array([0xff, 0xd8, ...segments.flat()]);
}

/** SOF0 segmenti: FF C0 <len=17> <precision> <height BE16> <width BE16> ... */
function sof0(width: number, height: number): number[] {
  return [
    0xff, 0xc0, 0x00, 0x11, 0x08,
    (height >> 8) & 0xff, height & 0xff,
    (width >> 8) & 0xff, width & 0xff,
    0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
  ];
}

/** APP0 (JFIF) segmenti — SOF'tan önce gelen tipik segment. */
function app0(): number[] {
  return [0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00];
}

describe("pngSize", () => {
  it("geçerli PNG başlığından boyutu okur", () => {
    expect(pngSize(pngHeader(1200, 630))).toEqual({ width: 1200, height: 630 });
  });

  it("bozuk imzayı reddeder", () => {
    expect(pngSize(pngHeader(100, 100, { badSignature: true }))).toBeNull();
  });

  it("ilk chunk IHDR değilse reddeder", () => {
    expect(pngSize(pngHeader(100, 100, { chunkType: "IDAT" }))).toBeNull();
  });

  it("kesik girdiyi reddeder", () => {
    expect(pngSize(pngHeader(100, 100).slice(0, 20))).toBeNull();
    expect(pngSize(new Uint8Array(0))).toBeNull();
  });

  it("sıfır boyutu reddeder", () => {
    expect(pngSize(pngHeader(0, 100))).toBeNull();
  });
});

describe("jpegSize", () => {
  it("APP0 sonrası SOF0'dan boyutu okur", () => {
    const bytes = jpegBytes([app0(), sof0(800, 600)]);
    expect(jpegSize(bytes)).toEqual({ width: 800, height: 600 });
  });

  it("0xFF dolgu baytlarını marker saymaz (SOF kaçmaz)", () => {
    // Marker öncesi dolgu 0xFF baytları JPEG spesifikasyonunda serbest.
    const bytes = jpegBytes([[0xff, 0xff, 0xff], app0(), [0xff, 0xff], sof0(320, 240)]);
    expect(jpegSize(bytes)).toEqual({ width: 320, height: 240 });
  });

  it("SOI ile başlamayan girdiyi reddeder", () => {
    expect(jpegSize(new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]))).toBeNull();
  });

  it("SOF'suz/kesik girdide null döner", () => {
    expect(jpegSize(jpegBytes([app0()]))).toBeNull();
    expect(jpegSize(jpegBytes([app0(), sof0(800, 600)]).slice(0, 10))).toBeNull();
  });

  it("bozuk segment uzunluğunda sonsuz döngüye girmez", () => {
    // length < 2 geçersizdir; parser null dönmeli, asılı kalmamalı.
    const bytes = jpegBytes([[0xff, 0xe0, 0x00, 0x00], sof0(10, 10), [0, 0, 0, 0, 0, 0]]);
    expect(jpegSize(bytes)).toBeNull();
  });
});

describe("isOgSourceImageSafe", () => {
  it("piksel tavanı altındaki görseli kabul eder", () => {
    expect(isOgSourceImageSafe({ width: 4000, height: 3000 }, 5 * 1024 * 1024)).toBe(true);
  });

  it("piksel tavanı üstünü reddeder (20000×20000 OOM senaryosu)", () => {
    expect(isOgSourceImageSafe({ width: 20000, height: 20000 }, 5 * 1024 * 1024)).toBe(false);
    expect(
      isOgSourceImageSafe({ width: 1, height: OG_IMAGE_MAX_SOURCE_PIXELS + 1 }, 100),
    ).toBe(false);
  });

  it("boyut okunamadıysa bayt tavanına göre karar verir", () => {
    expect(isOgSourceImageSafe(null, OG_IMAGE_MAX_UNPARSED_BYTES)).toBe(true);
    expect(isOgSourceImageSafe(null, OG_IMAGE_MAX_UNPARSED_BYTES + 1)).toBe(false);
  });
});

describe("computeOgHash", () => {
  const base: OgProfileData = {
    template: "p1",
    name: "Ada Lovelace",
    title: "Matematikçi",
    username: "ada",
    photoAssetId: "photo-1",
    avatarAssetId: "avatar-1",
    linkTitles: ["Blog", "Kitap"],
  };

  it("aynı girdide sabit kalır (16 hex)", async () => {
    const a = await computeOgHash(base);
    const b = await computeOgHash({ ...base, linkTitles: [...base.linkTitles] });
    expect(a).toMatch(/^[0-9a-f]{16}$/);
    expect(b).toBe(a);
  });

  const patches: [string, Partial<OgProfileData>][] = [
    ["template", { template: "p2" }],
    ["name", { name: "Grace Hopper" }],
    ["title", { title: "Amiral" }],
    ["username", { username: "grace" }],
    ["photoAssetId", { photoAssetId: "photo-2" }],
    ["photoAssetId null", { photoAssetId: null }],
    ["avatarAssetId", { avatarAssetId: null }],
    ["linkTitles", { linkTitles: ["Blog"] }],
  ];

  it.each(patches)("%s değişince hash değişir", async (_label, patch) => {
    const a = await computeOgHash(base);
    const b = await computeOgHash({ ...base, ...patch });
    expect(b).not.toBe(a);
  });

  it("alan kaydırma çakışması üretmez (name↔title)", async () => {
    const a = await computeOgHash({ ...base, name: "X", title: "" });
    const b = await computeOgHash({ ...base, name: "", title: "X" });
    expect(b).not.toBe(a);
  });
});

describe("ogImagePath", () => {
  it("hash'li kanonik yolu üretir", () => {
    expect(ogImagePath("ada", "0123456789abcdef")).toBe("/og/u/ada/0123456789abcdef.png");
  });
});
