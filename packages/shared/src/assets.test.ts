import { describe, expect, it } from "vitest";

import {
  ASSET_MAX_COUNT,
  ASSET_MAX_TOTAL_BYTES,
  assetQuotaIssue,
} from "./assets";

const MB = 1024 * 1024;

describe("assetQuotaIssue (R16)", () => {
  it("kota içindeki yüklemeye izin verir", () => {
    expect(assetQuotaIssue({ count: 0, bytes: 0 }, 5 * MB)).toBeNull();
    expect(assetQuotaIssue({ count: 10, bytes: 20 * MB }, 5 * MB)).toBeNull();
  });

  it("sayı sınırında son yüklemeye izin verir, sonrakini keser", () => {
    expect(assetQuotaIssue({ count: ASSET_MAX_COUNT - 1, bytes: 0 }, 1)).toBeNull();
    expect(assetQuotaIssue({ count: ASSET_MAX_COUNT, bytes: 0 }, 1)).toBe("count");
  });

  it("toplam boyut sınırını tam sınırda geçirir, bir bayt aşınca keser", () => {
    expect(
      assetQuotaIssue({ count: 1, bytes: ASSET_MAX_TOTAL_BYTES - 1000 }, 1000),
    ).toBeNull();
    expect(
      assetQuotaIssue({ count: 1, bytes: ASSET_MAX_TOTAL_BYTES - 1000 }, 1001),
    ).toBe("bytes");
  });

  it("sayı sınırı boyut sınırından önce raporlanır", () => {
    expect(
      assetQuotaIssue({ count: ASSET_MAX_COUNT, bytes: ASSET_MAX_TOTAL_BYTES }, 1),
    ).toBe("count");
  });

  it("kotalar R16'da yazılı değerlerdir", () => {
    expect(ASSET_MAX_COUNT).toBe(50);
    expect(ASSET_MAX_TOTAL_BYTES).toBe(100 * MB);
  });
});
