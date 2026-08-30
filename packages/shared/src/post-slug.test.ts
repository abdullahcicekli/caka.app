import { describe, expect, it } from "vitest";

import {
  POST_SLUG_MAX,
  POST_SLUG_MIN,
  RESERVED_POST_SLUGS,
  normalizePostSlug,
  validatePostSlug,
} from "./post-slug";

describe("normalizePostSlug", () => {
  it("kırpar ve küçük harfe çevirir", () => {
    expect(normalizePostSlug("  Ilk-Yazim ")).toBe("ilk-yazim");
  });

  it("Türkçe noktasız ı'yı deterministik olarak i'ye eşler", () => {
    expect(normalizePostSlug("ılk yazım")).toBe("ilk yazim");
    expect(normalizePostSlug("YAZI-BAŞLIĞI".toLowerCase())).toBe("yazi-başliği");
  });
});

describe("validatePostSlug", () => {
  it("geçerli adresi kanonik haliyle döner", () => {
    expect(validatePostSlug("Ilk-Yazim")).toEqual({ ok: true, slug: "ilk-yazim" });
  });

  it("Türkçe ı varyantını kanonik biçime eşleyip kabul eder (R19)", () => {
    expect(validatePostSlug("yazı-adı")).toEqual({ ok: true, slug: "yazi-adi" });
  });

  it("2 karakteri reddeder", () => {
    expect(validatePostSlug("ab")).toEqual({ ok: false, error: "too_short" });
  });

  it("81 karakteri reddeder, 80 karakteri kabul eder", () => {
    expect(validatePostSlug("a".repeat(81))).toEqual({ ok: false, error: "too_long" });
    expect(validatePostSlug("a".repeat(80))).toEqual({ ok: true, slug: "a".repeat(80) });
  });

  it.each(["ilk yazim", "ilk_yazim", "yazı-başlığı", "ilk.yazim", "-abc", "abc-"])(
    "geçersiz karakter/biçimi reddeder: %s",
    (slug) => {
      expect(validatePostSlug(slug)).toEqual({ ok: false, error: "invalid_chars" });
    },
  );

  // AE4: rezerve kelime kimlikli hatayla reddedilir.
  it("rezerve adresi kimlikli hatayla reddeder: hakkinda", () => {
    expect(validatePostSlug("hakkinda")).toEqual({ ok: false, error: "reserved" });
  });

  it.each(["yazi", "yazilar", "iletisim", "magaza", "abone", "rss", "sitemap", "api"])(
    "rezerve adresi reddeder: %s",
    (slug) => {
      expect(validatePostSlug(slug)).toEqual({ ok: false, error: "reserved" });
    },
  );

  it("normalize sonrası rezerve olan girdiyi de reddeder", () => {
    expect(validatePostSlug("HAKKINDA")).toEqual({ ok: false, error: "reserved" });
  });
});

describe("RESERVED_POST_SLUGS", () => {
  it("R3'teki nihai listeyle birebir aynıdır", () => {
    expect([...RESERVED_POST_SLUGS].sort()).toEqual(
      ["yazi", "yazilar", "hakkinda", "iletisim", "magaza", "abone", "rss", "sitemap", "og", "api", "s"].sort(),
    );
  });

  it("her kelime slug alfabesine uyar (liste kendi kendine tutarlı)", () => {
    for (const slug of RESERVED_POST_SLUGS) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
      expect(slug.length).toBeLessThanOrEqual(POST_SLUG_MAX);
    }
  });

  it("uzunluk sınırının altındaki rezerve kelimeler zaten alınamaz (og, s)", () => {
    // Sıra gereği önce uzunluk hatası döner; kelimeler yine de listede durur
    // ki sınırlar değişirse rezerv düşmesin.
    expect("og".length).toBeLessThan(POST_SLUG_MIN);
    expect(validatePostSlug("og")).toEqual({ ok: false, error: "too_short" });
    expect(validatePostSlug("s")).toEqual({ ok: false, error: "too_short" });
  });
});
