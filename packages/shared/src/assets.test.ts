import { describe, expect, it } from "vitest";

import {
  ASSET_MAX_COUNT,
  ASSET_MAX_TOTAL_BYTES,
  assetQuotaError,
} from "./assets";

const MB = 1024 * 1024;

describe("assetQuotaError (R16)", () => {
  it("kota içindeki yüklemeye izin verir", () => {
    expect(assetQuotaError({ count: 0, bytes: 0 }, 5 * MB)).toBeNull();
    expect(assetQuotaError({ count: 10, bytes: 20 * MB }, 5 * MB)).toBeNull();
  });

  it("sayı sınırında son yüklemeye izin verir, sonrakini keser", () => {
    expect(assetQuotaError({ count: ASSET_MAX_COUNT - 1, bytes: 0 }, 1)).toBeNull();
    const error = assetQuotaError({ count: ASSET_MAX_COUNT, bytes: 0 }, 1);
    expect(error).toContain(String(ASSET_MAX_COUNT));
    expect(error).toContain("görsel");
  });

  it("toplam boyut sınırını tam sınırda geçirir, bir bayt aşınca keser", () => {
    expect(
      assetQuotaError({ count: 1, bytes: ASSET_MAX_TOTAL_BYTES - 1000 }, 1000),
    ).toBeNull();
    expect(
      assetQuotaError({ count: 1, bytes: ASSET_MAX_TOTAL_BYTES - 1000 }, 1001),
    ).toContain("100 MB");
  });

  it("sayı sınırı boyut sınırından önce raporlanır", () => {
    const error = assetQuotaError({ count: ASSET_MAX_COUNT, bytes: ASSET_MAX_TOTAL_BYTES }, 1);
    expect(error).toContain(String(ASSET_MAX_COUNT));
  });

  it("kotalar R16'da yazılı değerlerdir", () => {
    expect(ASSET_MAX_COUNT).toBe(50);
    expect(ASSET_MAX_TOTAL_BYTES).toBe(100 * MB);
  });
});
