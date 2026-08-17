import { describe, expect, it } from "vitest";

import {
  COOKIE_CATEGORIES,
  COOKIE_INVENTORY,
  COOKIE_PARTIES,
  cookieTableRows,
  type CookieEntry,
} from "./cookies";

describe("çerez envanteri", () => {
  it("her girdinin amacı doludur", () => {
    for (const entry of COOKIE_INVENTORY) {
      expect(entry.purpose.trim(), entry.name).not.toBe("");
    }
  });

  it("her girdinin kategorisi bilinen birliğe aittir", () => {
    for (const entry of COOKIE_INVENTORY) {
      expect(COOKIE_CATEGORIES, entry.name).toContain(entry.category);
    }
  });

  it("her girdinin tarafı bilinen birliğe aittir", () => {
    for (const entry of COOKIE_INVENTORY) {
      expect(COOKIE_PARTIES, entry.name).toContain(entry.party);
    }
  });

  it("aynı ad iki kez geçmez", () => {
    const names = COOKIE_INVENTORY.map((entry) => entry.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("üçüncü taraf çerezlerde sağlayıcı doludur", () => {
    // Envanter `as const` olduğu için literal tiplere daralır; kural bugün
    // envanterde üçüncü taraf çerez olmasa da geçerli olsun diye genişletilir.
    const entries: readonly CookieEntry[] = COOKIE_INVENTORY;
    for (const entry of entries.filter((entry) => entry.party === "üçüncü")) {
      expect(entry.provider.trim(), entry.name).not.toBe("");
    }
  });

  it("her girdinin ömrü doludur", () => {
    for (const entry of COOKIE_INVENTORY) {
      expect(entry.lifetime.trim(), entry.name).not.toBe("");
    }
  });
});

describe("cookieTableRows", () => {
  it("her envanter girdisi için bir satır üretir", () => {
    expect(cookieTableRows()).toHaveLength(COOKIE_INVENTORY.length);
  });

  it("kategori ve tarafı Türkçe etikete çevirir", () => {
    const rows = cookieTableRows([
      {
        name: "test_cookie",
        category: "zorunlu",
        purpose: "Test amaçlı",
        lifetime: "1 gün",
        party: "birinci",
        provider: "Caka",
      },
    ]);
    expect(rows).toEqual([
      {
        name: "test_cookie",
        category: "Zorunlu",
        purpose: "Test amaçlı",
        lifetime: "1 gün",
        party: "Birinci taraf",
        provider: "Caka",
      },
    ]);
  });

  it("boş envanterde boş dizi döner", () => {
    expect(cookieTableRows([])).toEqual([]);
  });
});
