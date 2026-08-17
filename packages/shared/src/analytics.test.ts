import { describe, expect, it } from "vitest";

import {
  buildDailySeries,
  buildLinkBreakdown,
  collectTrackableLinks,
  dayKey,
  dayKeyRange,
  earliestDay,
  formatCount,
  formatDayKey,
  isTrackableBlockId,
  normalizeCountry,
  OLCUM_BILINMEYEN_ULKE,
  OLCUM_DIGER_ULKE,
  OLCUM_ULKE_ESIGI,
  shiftDayKey,
  sumSince,
  topCountries,
} from "./analytics";
import { profileLayoutSchema, type ProfileLayout } from "./layout";

function makeLayout(extra: unknown[] = []): ProfileLayout {
  return profileLayoutSchema.parse({
    version: 1,
    blocks: [
      {
        id: "blk_profile",
        type: "profile",
        size: "1x1",
        data: { name: "Ada", title: "Tasarımcı" },
      },
      ...extra,
    ],
  });
}

describe("gün kovaları", () => {
  it("Türkiye saatine göre keser (UTC+3)", () => {
    // 21:30 UTC = ertesi gün 00:30 İstanbul
    expect(dayKey(new Date("2026-08-17T21:30:00.000Z"))).toBe("2026-08-18");
    expect(dayKey(new Date("2026-08-17T20:59:59.000Z"))).toBe("2026-08-17");
    expect(dayKey(new Date("2026-08-17T00:00:00.000Z"))).toBe("2026-08-17");
  });

  it("gün anahtarını ileri/geri kaydırır, ay ve yıl sınırını aşar", () => {
    expect(shiftDayKey("2026-08-17", -1)).toBe("2026-08-16");
    expect(shiftDayKey("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftDayKey("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftDayKey("2028-03-01", -1)).toBe("2028-02-29");
  });

  it("bozuk anahtarı olduğu gibi döndürür", () => {
    expect(shiftDayKey("dün", -1)).toBe("dün");
  });

  it("pencereyi artan sırada ve son gün dahil üretir", () => {
    expect(dayKeyRange("2026-08-17", 3)).toEqual([
      "2026-08-15",
      "2026-08-16",
      "2026-08-17",
    ]);
    expect(dayKeyRange("2026-08-17", 30)).toHaveLength(30);
  });
});

describe("toplulaştırma", () => {
  const rows = [
    { day: "2026-08-10", count: 4 },
    { day: "2026-08-15", count: 2 },
    { day: "2026-08-17", count: 7 },
  ];

  it("verilen günden itibaren toplar, öncesini saymaz", () => {
    expect(sumSince(rows, "2026-08-15")).toBe(9);
    expect(sumSince(rows, "2026-08-01")).toBe(13);
    expect(sumSince(rows, "2026-08-18")).toBe(0);
  });

  it("en eski günü bulur, veri yoksa null döner", () => {
    expect(earliestDay(rows)).toBe("2026-08-10");
    expect(earliestDay([])).toBeNull();
  });

  it("boş günleri sıfırla doldurur ve pencereyi tam uzunlukta döner", () => {
    const series = buildDailySeries(rows, "2026-08-17", 3);
    expect(series).toEqual([
      { day: "2026-08-15", count: 2 },
      { day: "2026-08-16", count: 0 },
      { day: "2026-08-17", count: 7 },
    ]);
  });

  it("aynı günün birden çok satırını (ülke kırılımı) toplar", () => {
    const series = buildDailySeries(
      [
        { day: "2026-08-17", count: 3 },
        { day: "2026-08-17", count: 5 },
      ],
      "2026-08-17",
      1,
    );
    expect(series).toEqual([{ day: "2026-08-17", count: 8 }]);
  });
});

describe("ülke kırılımı", () => {
  it("çoktan aza sıralar ve aynı kodu toplar", () => {
    expect(
      topCountries([
        { country: "TR", count: 3 },
        { country: "DE", count: 5 },
        { country: "TR", count: 4 },
      ]),
    ).toEqual([
      { country: "TR", count: 7 },
      { country: "DE", count: 5 },
    ]);
  });

  it("limit uygular", () => {
    const rows = [
      { country: "TR", count: 9 },
      { country: "DE", count: 8 },
      { country: "US", count: 7 },
    ];
    expect(topCountries(rows, 2)).toEqual([
      { country: "TR", count: 9 },
      { country: "DE", count: 8 },
    ]);
  });

  it("ülkesi çözülemeyen istekleri XX'te toplar", () => {
    expect(normalizeCountry(null)).toBe(OLCUM_BILINMEYEN_ULKE);
    expect(normalizeCountry("")).toBe(OLCUM_BILINMEYEN_ULKE);
    expect(normalizeCountry("T1")).toBe(OLCUM_BILINMEYEN_ULKE);
    expect(normalizeCountry("tr")).toBe("TR");
    expect(topCountries([{ country: "", count: 6 }])).toEqual([
      { country: OLCUM_BILINMEYEN_ULKE, count: 6 },
    ]);
  });
});

describe("ülke kırılımı — yeniden kimliklendirme eşiği", () => {
  it("tek ziyaretçili bir ülkeyi adıyla göstermez", () => {
    // Asıl korunan senaryo: bağlantısını yalnız birkaç kişiyle paylaşan
    // yaratıcı, "DE: 1" satırından tek ziyaretçinin yerini okuyamamalı.
    const rows = topCountries([
      { country: "TR", count: 40 },
      { country: "DE", count: 1 },
    ]);
    expect(rows.some((row) => row.country === "DE")).toBe(false);
    expect(rows).toEqual([
      { country: "TR", count: 40 },
      { country: OLCUM_DIGER_ULKE, count: 1 },
    ]);
  });

  it("eşiğin tam üstünü gösterir, tam altını gizler", () => {
    const rows = topCountries([
      { country: "TR", count: OLCUM_ULKE_ESIGI },
      { country: "DE", count: OLCUM_ULKE_ESIGI - 1 },
    ]);
    expect(rows).toEqual([
      { country: "TR", count: OLCUM_ULKE_ESIGI },
      { country: OLCUM_DIGER_ULKE, count: OLCUM_ULKE_ESIGI - 1 },
    ]);
  });

  it("gizlenen ziyaretler toplamdan düşmez", () => {
    const girdi = [
      { country: "TR", count: 30 },
      { country: "DE", count: 3 },
      { country: "US", count: 2 },
      { country: "FR", count: 1 },
    ];
    const toplam = girdi.reduce((sum, row) => sum + row.count, 0);
    const rows = topCountries(girdi);
    expect(rows.reduce((sum, row) => sum + row.count, 0)).toBe(toplam);
    expect(rows).toEqual([
      { country: "TR", count: 30 },
      { country: OLCUM_DIGER_ULKE, count: 6 },
    ]);
  });

  it("gizli kova her zaman en sonda durur, en büyük olsa bile", () => {
    const rows = topCountries([
      { country: "TR", count: 6 },
      ...Array.from({ length: 20 }, (_, index) => ({
        // 20 ayrı ülke, her biri 1 ziyaret: toplamı TR'yi geçer ama hiçbiri
        // adıyla listelenmemeli.
        country: `Z${String.fromCharCode(65 + index)}`,
        count: 1,
      })),
    ]);
    expect(rows).toEqual([
      { country: "TR", count: 6 },
      { country: OLCUM_DIGER_ULKE, count: 20 },
    ]);
  });

  it("eşik altı satırlar limitte yer kaplamaz", () => {
    // Gizlenen bir satır `limit` kotasını yeseydi, gösterilebilir bir ülke
    // listeden düşerdi.
    const rows = topCountries(
      [
        { country: "TR", count: 9 },
        { country: "DE", count: 1 },
        { country: "US", count: 8 },
      ],
      2,
    );
    expect(rows).toEqual([
      { country: "TR", count: 9 },
      { country: "US", count: 8 },
      { country: OLCUM_DIGER_ULKE, count: 1 },
    ]);
  });

  it("hiçbir satır eşiği geçmezse yalnız gizli kova kalır", () => {
    expect(
      topCountries([
        { country: "TR", count: 2 },
        { country: "DE", count: 1 },
      ]),
    ).toEqual([{ country: OLCUM_DIGER_ULKE, count: 3 }]);
  });

  it("gizlenecek satır yoksa kova hiç eklenmez", () => {
    const rows = topCountries([{ country: "TR", count: 7 }]);
    expect(rows).toEqual([{ country: "TR", count: 7 }]);
    expect(rows.some((row) => row.country === OLCUM_DIGER_ULKE)).toBe(false);
  });

  it("çözülemeyen ülke de eşiğe tabidir", () => {
    // `XX` bir ülke değil ama yine de bir kırılım satırı; eşik onun için de
    // geçerli olmalı, yoksa "Bilinmiyor: 1" aynı bilgiyi sızdırırdı.
    expect(topCountries([{ country: OLCUM_BILINMEYEN_ULKE, count: 1 }])).toEqual([
      { country: OLCUM_DIGER_ULKE, count: 1 },
    ]);
  });

  it("girdide ZZ kodu gelirse ayrı bir ülke gibi listelenmez", () => {
    expect(
      topCountries([
        { country: "TR", count: 10 },
        { country: OLCUM_DIGER_ULKE, count: 40 },
      ]),
    ).toEqual([
      { country: "TR", count: 10 },
      { country: OLCUM_DIGER_ULKE, count: 40 },
    ]);
  });

  it("eşik çağrı başına gevşetilebilir ama varsayılan 5'tir", () => {
    expect(OLCUM_ULKE_ESIGI).toBe(5);
    expect(topCountries([{ country: "DE", count: 1 }], 5, 1)).toEqual([
      { country: "DE", count: 1 },
    ]);
  });
});

describe("tıklanabilir bloklar", () => {
  const layout = makeLayout([
    {
      id: "blk_link",
      type: "link",
      size: "1x1",
      data: { title: "Blog", url: "https://ornek.dev" },
    },
    {
      id: "blk_social",
      type: "social",
      size: "1x1",
      data: {
        platform: "github",
        handle: "ada",
        url: "https://github.com/ada",
        label: "GitHub",
      },
    },
    {
      id: "blk_metin",
      type: "text",
      size: "1x1",
      data: { text: "selam" },
    },
    {
      id: "blk_bos_durum",
      type: "status",
      size: "2x1",
      data: { text: "Adressiz durum", url: "" },
    },
  ]);

  it("yalnızca dış adresi olan blokları toplar", () => {
    expect(collectTrackableLinks(layout).map((link) => link.blockId)).toEqual([
      "blk_link",
      "blk_social",
    ]);
  });

  it("profil kartı ve adressiz bloklar ölçülmez", () => {
    expect(isTrackableBlockId(layout, "blk_profile")).toBe(false);
    expect(isTrackableBlockId(layout, "blk_metin")).toBe(false);
    expect(isTrackableBlockId(layout, "blk_bos_durum")).toBe(false);
    expect(isTrackableBlockId(layout, "blk_link")).toBe(true);
    expect(isTrackableBlockId(layout, "uydurma")).toBe(false);
  });

  it("kırılımı çok tıklanandan aza sıralar, tıklanmayanı sıfırla listeler", () => {
    const rows = buildLinkBreakdown(collectTrackableLinks(layout), [
      { blockId: "blk_social", clicks: 9 },
    ]);
    expect(rows.map((row) => [row.blockId, row.clicks])).toEqual([
      ["blk_social", 9],
      ["blk_link", 0],
    ]);
  });

  it("düzenden silinmiş blokların tıklaması listeye sızmaz", () => {
    const rows = buildLinkBreakdown(collectTrackableLinks(layout), [
      { blockId: "blk_silinmis", clicks: 100 },
    ]);
    expect(rows.some((row) => row.blockId === "blk_silinmis")).toBe(false);
  });
});

describe("biçimlendirme", () => {
  it("binlik ayracını nokta yapar", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(999)).toBe("999");
    expect(formatCount(1000)).toBe("1.000");
    expect(formatCount(1234567)).toBe("1.234.567");
    expect(formatCount(Number.NaN)).toBe("0");
  });

  it("gün anahtarını Türkçe tarihe çevirir", () => {
    expect(formatDayKey("2026-08-17")).toBe("17 Ağustos 2026");
    expect(formatDayKey("2026-01-01")).toBe("1 Ocak 2026");
    expect(formatDayKey("bozuk")).toBe("bozuk");
  });
});
