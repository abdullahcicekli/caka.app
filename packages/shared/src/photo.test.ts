import { describe, expect, it } from "vitest";

import {
  GALLERY_MAX_PHOTOS,
  PHOTO_SHAPES,
  photoAreaName,
  photoGridAreas,
  photoGridPlan,
  photoRecommendedSize,
  sizeToDims,
  type PhotoShape,
} from "./index";

const counts = Array.from({ length: GALLERY_MAX_PHOTOS }, (_, index) => index + 1);

/** Plandaki her hücrenin dikdörtgen sınırları (grid-template-areas kuralı). */
function bounds(cells: readonly (readonly string[])[], name: string) {
  let top = Infinity;
  let left = Infinity;
  let bottom = -1;
  let right = -1;
  let seen = 0;
  cells.forEach((row, y) =>
    row.forEach((cell, x) => {
      if (cell !== name) return;
      seen += 1;
      top = Math.min(top, y);
      left = Math.min(left, x);
      bottom = Math.max(bottom, y);
      right = Math.max(right, x);
    }),
  );
  return { top, left, bottom, right, seen };
}

describe("photoGridPlan", () => {
  it("fotoğrafsız blokta plan yoktur", () => {
    expect(photoGridPlan(0, "square")).toBeNull();
    expect(photoGridPlan(-1, "square")).toBeNull();
  });

  // "+N" pili KALKTI: bir plan fotoğrafı gizleyemez, hepsi ızgarada durur.
  it.each(PHOTO_SHAPES)("%s bandında her fotoğraf tam olarak bir kez yerleşir", (shape) => {
    for (const count of counts) {
      const plan = photoGridPlan(count, shape)!;
      const names = new Set(plan.cells.flat());
      expect([...names].sort()).toEqual(
        Array.from({ length: count }, (_, index) => photoAreaName(index)).sort(),
      );
    }
  });

  it.each(PHOTO_SHAPES)("%s bandında ızgara dikdörtgen ve boşluksuz", (shape) => {
    for (const count of counts) {
      const plan = photoGridPlan(count, shape)!;
      // Bütün satırlar aynı uzunlukta olmazsa `grid-template-areas` geçersiz.
      for (const row of plan.cells) expect(row).toHaveLength(plan.columns);
      expect(plan.cells).toHaveLength(plan.rows);
      // Her fotoğrafın kapladığı alan dikdörtgen olmalı (CSS şartı).
      for (let index = 0; index < count; index += 1) {
        const box = bounds(plan.cells, photoAreaName(index));
        const area = (box.bottom - box.top + 1) * (box.right - box.left + 1);
        expect(box.seen).toBe(area);
      }
    }
  });

  // Ölçüldü (kart iç ölçüsü = kart − 16px dolgu, hücre arası 4px):
  //   panorama 748×156 → beş hücre 143×140 (KTD39'daki en iyi konfigürasyon)
  it("şerit kartta beş fotoğraf tek satıra dizilir", () => {
    const plan = photoGridPlan(5, "panorama")!;
    expect(plan.columns).toBe(5);
    expect(plan.rows).toBe(1);
  });

  // 748×324'te hero 364×308, sağdaki dört hücre 180×152 — hepsi ≈1,2 en-boy.
  it("yatık kartta beş fotoğraf hero + 2×2 olur", () => {
    expect(photoGridAreas(photoGridPlan(5, "wide")!)).toBe('"p1 p1 p2 p3" "p1 p1 p4 p5"');
  });

  // Dar ve uzun kartta yan yana iki hücre dikey yarık olurdu.
  it("dar kartta iki fotoğraf üst üste, yatık kartta yan yana durur", () => {
    expect(photoGridPlan(2, "tall")).toMatchObject({ columns: 1, rows: 2 });
    expect(photoGridPlan(2, "wide")).toMatchObject({ columns: 2, rows: 1 });
  });

  it("tek fotoğraf her bantta kartın tamamını kaplar", () => {
    for (const shape of PHOTO_SHAPES) {
      expect(photoGridPlan(1, shape)).toMatchObject({ columns: 1, rows: 1 });
    }
  });

  it("photoGridAreas grid-template-areas biçimini üretir", () => {
    expect(photoGridAreas(photoGridPlan(4, "square")!)).toBe('"p1 p2" "p3 p4"');
  });

  // Bant yalnız oranı temsil eder; tavanın (5) üstünde bir sayı gelirse plan
  // en büyük plana düşer, patlamaz.
  it("tavanın üstündeki sayı en büyük plana düşer", () => {
    const shape: PhotoShape = "square";
    expect(photoGridPlan(9, shape)).toEqual(photoGridPlan(GALLERY_MAX_PHOTOS, shape));
  });
});

describe("photoRecommendedSize", () => {
  // Ölçüler yarım birimde (GRID_UNIT): 2 = eski 1 hücre.
  it("ızgarada fotoğraf sayısı arttıkça blok büyür", () => {
    expect(sizeToDims(photoRecommendedSize(1, "grid"))).toEqual({ w: 2, h: 2 }); // 178×156
    expect(sizeToDims(photoRecommendedSize(2, "grid"))).toEqual({ w: 4, h: 2 }); // 368×156
    expect(sizeToDims(photoRecommendedSize(3, "grid"))).toEqual({ w: 4, h: 2 });
    expect(sizeToDims(photoRecommendedSize(4, "grid"))).toEqual({ w: 4, h: 4 }); // 368×324
    expect(sizeToDims(photoRecommendedSize(5, "grid"))).toEqual({ w: 8, h: 2 }); // 748×156
  });

  // Slider tek seferde tek fotoğraf gösteriyor: 156px'lik şeritte yatay
  // fotoğrafın yarısı kırpılıyordu.
  it("slider sayıdan bağımsız olarak iki satır ister", () => {
    expect(photoRecommendedSize(2, "slider")).toBe("2x2");
    expect(photoRecommendedSize(5, "slider")).toBe("2x2");
    // Tek fotoğrafta düzen seçimi yok; ikisi de aynı şeyi gösterir.
    expect(photoRecommendedSize(1, "slider")).toBe("1x1");
  });
});
