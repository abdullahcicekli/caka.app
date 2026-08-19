/**
 * Kur'an hattının kapsama testi — ürünün en hassas kartı buna bağlı.
 *
 * Kartta bir ayet EKSİK render edilmemeli: `ara-quranuthmanihaf` edisyonunun
 * kullandığı her kod noktası, gönderdiğimiz font dosyasında bulunmalı. Test
 * yan bir manifest'e değil, tarayıcının indireceği `.woff2` baytlarına bakar.
 *
 * Düşerse ne olmuştur:
 *   • "eksik kod noktası" → font değişti ya da edisyon yeni bir işaret
 *     kullanmaya başladı. Yeni fontu ölçmeden GÖNDERME.
 *   • "glif sayısı" → biri fonta subset uyguladı. `pyftsubset --unicodes=…`
 *     kapsamayı bozmadan ŞEKİLLENDİRMEYİ bozuyor (ölçüldü: 6236 ayetin
 *     5285'inde ligatür kaybı), yani bu testin geri kalanı sessiz kalırdı.
 *   • "edisyon kimliği" → `ARABIC_EDITION` değişti; aşağıdaki liste artık
 *     geçerli değil, yeniden türetilmeli.
 *
 * Listeyi yeniden türetme (ağ gerektirir, bu yüzden CI'da değil):
 *
 *   curl -s https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/\
 *   ara-quranuthmanihaf.min.json | node -e 'let s="";process.stdin.on("data",\
 *   c=>s+=c).on("end",()=>{const q=JSON.parse(s).quran,u=new Set();\
 *   for(const v of q)for(const ch of v.text)u.add(ch.codePointAt(0));\
 *   console.log([...u].sort((a,b)=>a-b).map(c=>c.toString(16).toUpperCase()\
 *   .padStart(4,"0")).join(" "))})'
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { parseWoff2 } from "./support/woff2";

/**
 * `ara-quranuthmanihaf` edisyonunun TAMAMINDA (6236 ayet) geçen kod
 * noktaları — 2026-08-19'da tarandı. Üçü Arabic Extended-A bloğunda ve
 * sistem nesih yüzlerinin çoğunda yok; kartta tofu çıkmasının sebebi
 * onlardı: U+08F0 (2901 geçiş), U+08F1 (1807), U+08F2 (1935).
 */
const EDITION_CODEPOINTS = (
  "0020 0621 0627 0628 0629 062A 062B 062C 062D 062E 062F 0630 0631 0632 0633 0634 " +
  "0635 0636 0637 0638 0639 063A 0640 0641 0642 0643 0644 0645 0646 0647 0648 0649 " +
  "064A 064B 064C 064D 064E 064F 0650 0651 0652 0653 0654 0655 065C 0670 0671 06D6 " +
  "06D7 06D8 06DA 06DB 06DC 06DE 06E0 06E1 06E2 06E4 06E5 06E6 06E7 06E8 06E9 06EC " +
  "06ED 08F0 08F1 08F2 200F"
)
  .split(" ")
  .map((hex) => Number.parseInt(hex, 16));

/** Amiri Quran 1.003'ün glif sayısı — subset uygulayan biri buradan yakalanır. */
const AMIRI_QURAN_GLYPHS = 1446;

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");

const font = parseWoff2(
  readFileSync(fileURLToPath(new URL("../app/fonts/amiri-quran.woff2", import.meta.url))),
);
const css = read("../app/app.css");
// Kaynak METİN olarak okunuyor, `import` ile DEĞİL: `server/` başka bir tsc
// projesinde ve bu testin tek ihtiyacı sabitin değeri.
const quranServer = read("../server/quran.ts");

describe("Kur'an hattı (Amiri Quran)", () => {
  it("liste edisyonla aynı boyda ve tekrarsız kalır", () => {
    expect(EDITION_CODEPOINTS).toHaveLength(69);
    expect(new Set(EDITION_CODEPOINTS).size).toBe(69);
  });

  it("liste hangi edisyondan türetildiyse o edisyon kullanılıyor", () => {
    expect(quranServer).toContain('export const ARABIC_EDITION = "ara-quranuthmanihaf";');
  });

  it("edisyonun her kod noktasını kapsar", () => {
    const missing = EDITION_CODEPOINTS.filter((cp) => !font.codepoints.has(cp)).map((cp) =>
      `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`,
    );
    expect(missing).toEqual([]);
  });

  it("subset uygulanmamış: bütün glifler ve şekillendirme tabloları duruyor", () => {
    expect(font.numGlyphs).toBe(AMIRI_QURAN_GLYPHS);
    // Arapça'da kapsama yetmez: harflerin bitişmesi GSUB'a, harekelerin
    // yerine oturması GPOS'a bağlı. İkisi de gitmemeli.
    expect(font.tables.has("GSUB")).toBe(true);
    expect(font.tables.has("GPOS")).toBe(true);
    expect(font.tables.has("GDEF")).toBe(true);
  });
});

describe("app.css font bağlantısı", () => {
  const face = css.match(/@font-face\s*\{[^}]*"Amiri Quran"[^}]*\}/)?.[0];

  it("fontu kendi sunucumuzdan servis eder (R58: dış kaynak yok)", () => {
    expect(face).toBeDefined();
    expect(face).toContain('url("./fonts/amiri-quran.woff2")');
    expect(face).not.toMatch(/https?:\/\//);
  });

  it("ayet kartı önce bu yüzü dener", () => {
    const token = css.match(/--font-arabic:\s*([^;]+);/)?.[1];
    expect(token?.trim().startsWith('"Amiri Quran"')).toBe(true);
  });

  it("unicode-range edisyonun boşluk dışındaki her kod noktasını içerir", () => {
    const raw = face?.match(/unicode-range:\s*([^;]+);/)?.[1];
    expect(raw).toBeDefined();
    const ranges = raw!.split(",").map((part) => {
      const [start, end] = part.trim().replace(/^U\+/i, "").split("-");
      return [Number.parseInt(start, 16), Number.parseInt(end ?? start, 16)] as const;
    });
    // Boşluk BİLEREK dışarıda: aralığa girseydi yalnız Latin metin taşıyan bir
    // sayfa bile dosyayı indirtebilirdi. Boşluk yedek yüzden gelir.
    expect(ranges.some(([lo, hi]) => 0x20 >= lo && 0x20 <= hi)).toBe(false);
    const uncovered = EDITION_CODEPOINTS.filter(
      (cp) => cp !== 0x20 && !ranges.some(([lo, hi]) => cp >= lo && cp <= hi),
    ).map((cp) => `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`);
    expect(uncovered).toEqual([]);
  });
});
