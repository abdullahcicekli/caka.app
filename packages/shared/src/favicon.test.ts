import { describe, expect, it } from "vitest";

import { pickFaviconHref } from "./favicon";

describe("favicon seçimi", () => {
  it("SVG adayını eler ve PNG'ye düşer (ölçüm: cicekli.me)", () => {
    expect(
      pickFaviconHref([
        '<link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2">',
        '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=2">',
        '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=2">',
      ]),
    ).toBe("/favicon-32x32.png?v=2");
  });

  it("uzantısı .svg olanı tür yazmasa da eler", () => {
    expect(pickFaviconHref(['<link rel="icon" href="/icon.svg">'])).toBeNull();
  });

  it("aynı türde en büyük boyutu seçer", () => {
    expect(
      pickFaviconHref([
        '<link rel="icon" sizes="16x16" href="/small.png">',
        '<link rel="icon" sizes="192x192" href="/big.png">',
        '<link rel="icon" sizes="32x32" href="/mid.png">',
      ]),
    ).toBe("/big.png");
  });

  it("apple-touch-icon'u düz icon'a tercih eder", () => {
    expect(
      pickFaviconHref([
        '<link rel="icon" sizes="32x32" href="/icon.png">',
        '<link rel="apple-touch-icon" sizes="180x180" href="/apple.png">',
      ]),
    ).toBe("/apple.png");
  });

  it("çok sözcüklü rel'i okur (GitHub: alternate icon)", () => {
    expect(
      pickFaviconHref(['<link rel="alternate icon" type="image/png" href="/favicon.png">']),
    ).toBe("/favicon.png");
  });

  it("mask-icon ve fluid-icon favicon sayılmaz", () => {
    expect(
      pickFaviconHref([
        '<link rel="mask-icon" href="/pinned.png" color="#000">',
        '<link rel="fluid-icon" href="/fluid.png">',
      ]),
    ).toBeNull();
  });

  it("href'i olmayan etiketi atlar", () => {
    expect(pickFaviconHref(['<link rel="icon">'])).toBeNull();
  });
});
