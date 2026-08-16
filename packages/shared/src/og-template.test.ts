import { describe, expect, it } from "vitest";

import {
  DEFAULT_OG_TEMPLATE,
  normalizeOgTemplate,
  OG_TEMPLATE_OPTIONS,
  ogTemplateSchema,
} from "./og-template";

describe("normalizeOgTemplate", () => {
  it.each(["p1", "p2", "p3", "p4", "p5", "p6"] as const)(
    "geçerli şablonu aynen döner: %s",
    (id) => {
      expect(normalizeOgTemplate(id)).toBe(id);
    },
  );

  it.each(["", "p7", "portre", "P1"])(
    "bilinmeyen değeri varsayılana düşürür: %s",
    (value) => {
      expect(normalizeOgTemplate(value)).toBe(DEFAULT_OG_TEMPLATE);
    },
  );
});

describe("OG_TEMPLATE_OPTIONS", () => {
  it("şemadaki her şablon için tam bir Türkçe etiket taşır", () => {
    expect(OG_TEMPLATE_OPTIONS.map((option) => option.id)).toEqual(
      ogTemplateSchema.options,
    );
    for (const option of OG_TEMPLATE_OPTIONS) {
      expect(option.label.length).toBeGreaterThan(0);
    }
  });
});
