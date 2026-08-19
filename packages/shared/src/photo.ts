import { z } from "zod";

/**
 * FOTOĞRAF BLOĞUNUN SAF KURALLARI (U32 devamı).
 *
 * `image` (tek görsel) ve `gallery` (5'e kadar fotoğraf) tek bir blokta
 * birleşti: kullanıcı artık "kaç fotoğraf koyacağım" sorusunu blok tipi
 * seçerek değil, fotoğraf ekleyerek yanıtlıyor. Depodaki ayrımcı `"gallery"`
 * OLARAK KALDI — canlı sayfalardaki galeri blokları hiç dokunulmadan
 * okunmaya devam etsin diye; `image` blokları okuma anında bu tipe çevriliyor
 * (bkz. `migrateRawImageBlock`, layout.ts).
 *
 * Bu dosya dile ve React'e bağlı değildir: yalnız sayı → dizilim kararı.
 */

/**
 * Düzen seçimi. Tek fotoğrafta ikisi de aynı şeyi gösterir (kartı dolduran
 * tek fotoğraf), o yüzden seçim yalnız 2+ fotoğrafta anlamlı.
 *  • grid   → hepsi aynı anda görünür, hiçbiri gizlenmez.
 *  • slider → sırayla geçer; nokta göstergeleriyle.
 */
export const photoLayoutSchema = z.enum(["grid", "slider"]);
export type PhotoLayout = z.infer<typeof photoLayoutSchema>;
export const PHOTO_LAYOUTS = photoLayoutSchema.options;

/**
 * Slider'ın otomatik geçiş aralığı. 4 sn: 3 sn'de bir fotoğrafa bakmaya
 * vakit kalmıyor, 6 sn'de kart durmuş görünüyor. `prefers-reduced-motion:
 * reduce` altında otomatik geçiş HİÇ çalışmaz (bileşen matchMedia'ya bakar;
 * CSS'teki genel koruma yalnız animasyonu kısar, JS zamanlayıcısını değil).
 */
export const PHOTO_SLIDER_INTERVAL_MS = 4000;

/**
 * Kartın oran bandı. Dizilim İKİ girdiye bağlı: fotoğraf sayısı (bileşen
 * bilir) ve kartın gerçek oranı (yalnız CSS bilir). Bileşen her bant için bir
 * plan basar, CSS konteyner sorgusuyla bandına uyanı seçer — JS ölçümü ve
 * hidrasyon kayması yok.
 *
 * Eşikler ızgarada GERÇEKTEN oluşabilen ölçülerden türedi (8 kolon × 72px
 * satır, 12px boşluk → genişlik 178/273/368/463/558/653/748, yükseklik
 * 156/240/324/408/492):
 *   tall     r < 0,85   → 178×324 (0,55), 178×492 (0,36), 368×492 (0,75)
 *   square   0,85–1,70  → 178×156 (1,14), 368×324 (1,14), 748×492 (1,52)
 *   wide     1,70–3,20  → 368×156 (2,36), 748×324 (2,31), 273×156 (1,75)
 *   panorama r ≥ 3,20   → 558×156 (3,58), 653×156 (4,19), 748×156 (4,79)
 */
export const PHOTO_SHAPES = ["tall", "square", "wide", "panorama"] as const;
export type PhotoShape = (typeof PHOTO_SHAPES)[number];

/** Bir fotoğrafın `grid-area` adı; DOM'da ve planda aynı adla anılır. */
export function photoAreaName(index: number): string {
  return `p${index + 1}`;
}

export interface PhotoGridPlan {
  columns: number;
  rows: number;
  /** Satır satır hücre adları; `grid-template-areas` ile birebir. */
  cells: readonly (readonly string[])[];
}

/**
 * Bant × sayı → dizilim. `+N` PİLİ YOK: her fotoğraf görünür (eski galeri
 * sığmayanları gizleyip pil basıyordu; kullanıcı yüklediği fotoğrafı kartta
 * göremiyordu). Hücre ölçüleri kart iç ölçüsünden hesaplandı (kart − 16px
 * dolgu, hücre arası 4px) ve dizilimler ona göre seçildi.
 *
 * Hedef hücre oranı 4:3'e yakın: fotoğraflar çoğunlukla yatay, `object-fit:
 * cover` ile kırpılıyorlar; kare hücre yatay bir fotoğrafın kenarlarını,
 * dikey hücre ise yarısını atardı.
 */
const PHOTO_GRID_CELLS: Record<PhotoShape, readonly (readonly (readonly string[])[])[]> = {
  // Dar ve uzun kart (178×324 → iç 162×308). Tek sütun 3 fotoğrafa kadar
  // taşır (162×100); 4-5'te tam genişlik bir hero + ikişerli satırlar, çünkü
  // 5 fotoğrafı tek sütuna dizmek 162×57'lik şeritler üretiyordu.
  tall: [
    [["p1"]],
    [["p1"], ["p2"]],
    [["p1"], ["p2"], ["p3"]],
    [["p1", "p1"], ["p2", "p3"], ["p4", "p4"]],
    [["p1", "p1"], ["p2", "p3"], ["p4", "p5"]],
  ],
  // Kareye yakın kart (368×324 → iç 352×308).
  //  2 → üst üste (352×152); yan yana 174×308'lik dikey yarıklar olurdu.
  //  3 → hero solda 2/3 (232×308 = 0,75) + sağda iki tane (114×152 = 0,75);
  //      iki ölçü de aynı oranda, kart tek bir kompozisyon gibi duruyor.
  //  4 → 2×2 mozaik (174×152 = 1,14).
  //  5 → üstte 2 (174×152), altta 3 (115×152); hepsi görünür.
  square: [
    [["p1"]],
    [["p1"], ["p2"]],
    [["p1", "p1", "p2"], ["p1", "p1", "p3"]],
    [["p1", "p2"], ["p3", "p4"]],
    [
      ["p1", "p1", "p1", "p2", "p2", "p2"],
      ["p3", "p3", "p4", "p4", "p5", "p5"],
    ],
  ],
  // Yatık kart (368×156 → iç 352×140; 748×324 → iç 732×308).
  //  4 → 2×2: yan yana dört tane 85×140'lık (0,61) dikey dilim olurdu.
  //  5 → hero solda 2×2 + sağda 2×2: 368×156'da 174×140 ve 85×68, 748×324'te
  //      364×308 ve 180×152 — iki ölçüde de hücrelerin oranı aynı (≈1,2).
  wide: [
    [["p1"]],
    [["p1", "p2"]],
    [["p1", "p2", "p3"]],
    [["p1", "p2"], ["p3", "p4"]],
    [
      ["p1", "p1", "p2", "p3"],
      ["p1", "p1", "p4", "p5"],
    ],
  ],
  // Şerit kart (748×156 → iç 732×140). Tek satır: 5 fotoğrafta hücre
  // 143×140 (KTD39'da ölçülen en iyi konfigürasyon).
  panorama: [
    [["p1"]],
    [["p1", "p2"]],
    [["p1", "p2", "p3"]],
    [["p1", "p2", "p3", "p4"]],
    [["p1", "p2", "p3", "p4", "p5"]],
  ],
};

/**
 * Fotoğraf sayısı + kart bandı → ızgara planı. Sayı 0 ise plan yoktur (kart
 * yer tutucusunu basar); tavanın (5) üstü olamaz, şema zaten kesiyor.
 */
export function photoGridPlan(count: number, shape: PhotoShape): PhotoGridPlan | null {
  if (!Number.isInteger(count) || count < 1) return null;
  const table = PHOTO_GRID_CELLS[shape];
  const cells = table[Math.min(count, table.length) - 1]!;
  return { columns: cells[0]!.length, rows: cells.length, cells };
}

/** Planı `grid-template-areas` değerine çevirir: `"p1 p2" "p3 p4"`. */
export function photoGridAreas(plan: PhotoGridPlan): string {
  return plan.cells.map((row) => `"${row.join(" ")}"`).join(" ");
}

/**
 * Fotoğraf eklendiğinde bloğun ALMASI GEREKEN en küçük ölçü. Sınır tablosu
 * (`BLOCK_GRID_LIMITS`) tip başına tek bir taban verebiliyor ve o taban tek
 * fotoğrafın tabanı olmak zorunda — beş fotoğrafın tabanını oraya yazmak
 * canlı sayfalardaki tek görselli blokları ilk açılışta büyütürdü. Bunun
 * yerine editör, fotoğraf EKLENDİĞİNDE bloğu gerekiyorsa büyütür (Spotify
 * kartındaki `spotifyDefaultSize` ile aynı desen).
 *
 * Ölçüler (masaüstü tuvali 748px):
 *   1 → 178×156   tek fotoğraf, kartın tamamı
 *   2 → 368×156   iki hücre 174×140
 *   3 → 368×156   üç hücre 115×140
 *   4 → 368×324   2×2 mozaik, hücre 174×152
 *   5 → 748×156   beş hücre 143×140 (KTD39)
 * Slider tek seferde tek fotoğraf gösterdiği için sayıdan bağımsız olarak
 * 368×324 ister: 156px'lik bir şeritte yatay fotoğrafın yarısı kırpılıyor.
 */
export function photoRecommendedSize(
  count: number,
  layout: PhotoLayout,
): "1x1" | "2x1" | "2x2" | "4x1" {
  if (count <= 1) return "1x1";
  if (layout === "slider") return "2x2";
  if (count <= 3) return "2x1";
  if (count === 4) return "2x2";
  return "4x1";
}
