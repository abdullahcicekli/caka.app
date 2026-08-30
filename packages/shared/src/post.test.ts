import { describe, expect, it } from "vitest";

import {
  MAX_POSTS_PER_PROFILE,
  POST_BODY_MAX_BYTES,
  POST_TITLE_MAX,
  POST_STATUSES,
  isPostBodyWithinLimit,
  postBodyByteLength,
} from "./post";

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
