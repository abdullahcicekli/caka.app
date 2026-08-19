import { describe, expect, it } from "vitest";

import {
  AYET_ARABIC_MAX,
  AYET_MEAL_MAX,
  QURAN_VERSE_COUNT,
  SURAHS,
  foldTurkish,
  parseSurahQuery,
  parseVerseRef,
  searchSurahs,
  surahByNo,
  truncateVerse,
  verseRefIssue,
} from "./quran";

describe("sure dizini", () => {
  it("114 sure taşır ve numaralar 1..114 sırasındadır", () => {
    expect(SURAHS).toHaveLength(114);
    SURAHS.forEach((surah, index) => expect(surah.no).toBe(index + 1));
  });

  it("ayet sayılarının toplamı 6236'dır", () => {
    const total = SURAHS.reduce((sum, surah) => sum + surah.verses, 0);
    expect(total).toBe(QURAN_VERSE_COUNT);
  });

  it("her surenin Türkçe ve Arapça adı doludur", () => {
    for (const surah of SURAHS) {
      expect(surah.name.trim()).not.toBe("");
      expect(surah.nameAr.trim()).not.toBe("");
      expect(surah.verses).toBeGreaterThan(0);
    }
  });

  it("bilinen ayet sayıları tutuyor", () => {
    expect(surahByNo(1)?.verses).toBe(7);
    expect(surahByNo(2)?.verses).toBe(286);
    expect(surahByNo(112)?.verses).toBe(4);
    expect(surahByNo(114)?.verses).toBe(6);
    expect(surahByNo(115)).toBeNull();
  });

  it("şema sınırları en uzun ayeti (Bakara 282) alacak kadar geniş", () => {
    // Ölçüm 2026-08-19: Arapça 1224, meal 1333 karakter.
    expect(AYET_ARABIC_MAX).toBeGreaterThanOrEqual(1224);
    expect(AYET_MEAL_MAX).toBeGreaterThanOrEqual(1333);
  });
});

describe("foldTurkish", () => {
  it("şapka, kesme ve büyük/küçük harf farkını eritir", () => {
    expect(foldTurkish("Mü'minûn")).toBe("muminun");
    expect(foldTurkish("MÜMİNUN")).toBe("muminun");
    expect(foldTurkish("Âl-i İmrân")).toBe("al i imran");
    expect(foldTurkish("İhlâs")).toBe("ihlas");
  });

  it("noktalı/noktasız i ayrımını kapatır", () => {
    expect(foldTurkish("Kıyâme")).toBe(foldTurkish("kiyame"));
    expect(foldTurkish("Târık")).toBe("tarik");
  });

  it("boşlukları sadeleştirir", () => {
    expect(foldTurkish("  Âl-i   İmrân  ")).toBe("al i imran");
    expect(foldTurkish("   ")).toBe("");
  });
});

describe("parseSurahQuery", () => {
  it("sayısal adresleri ayrıştırır", () => {
    expect(parseSurahQuery("2:255")).toEqual({ surah: 2, verse: 255 });
    expect(parseSurahQuery("2/255")).toEqual({ surah: 2, verse: 255 });
    expect(parseSurahQuery("2.255")).toEqual({ surah: 2, verse: 255 });
    expect(parseSurahQuery("2 255")).toEqual({ surah: 2, verse: 255 });
    expect(parseSurahQuery("112")).toEqual({ surah: 112, verse: null });
  });

  it("sure adıyla yazılanı ayrıştırır", () => {
    expect(parseSurahQuery("bakara 255")).toEqual({ surah: 2, verse: 255 });
    expect(parseSurahQuery("BAKARA 255")).toEqual({ surah: 2, verse: 255 });
    expect(parseSurahQuery("Âl-i İmrân 190")).toEqual({ surah: 3, verse: 190 });
    expect(parseSurahQuery("ihlas")).toEqual({ surah: 112, verse: null });
  });

  it("ikinci adları da tanır", () => {
    expect(parseSurahQuery("mümin 1")).toEqual({ surah: 40, verse: 1 });
    expect(parseSurahQuery("mesed")).toEqual({ surah: 111, verse: null });
  });

  it("tek sureye daralan ön eki kabul eder, birden çoğunu reddeder", () => {
    expect(parseSurahQuery("bakar")).toEqual({ surah: 2, verse: null });
    // "na" ile başlayan birden çok sure var (Nahl, Nasr, Nâs, Nâziât…)
    expect(parseSurahQuery("na")).toBeNull();
  });

  it("metin aramasını referans sanmaz", () => {
    expect(parseSurahQuery("sabır")).toBeNull();
    expect(parseSurahQuery("")).toBeNull();
    expect(parseSurahQuery("   ")).toBeNull();
    expect(parseSurahQuery("115")).toBeNull();
    expect(parseSurahQuery("0")).toBeNull();
  });

  it("sınır dışı ayet numarasını ayrıştırır ama doğrulamaz", () => {
    // Kullanıcıya "anlamadım" değil "Bakara'da 300. ayet yok" diyebilmek için.
    expect(parseSurahQuery("bakara 300")).toEqual({ surah: 2, verse: 300 });
    expect(verseRefIssue({ surah: 2, verse: 300 })).toBe("verse");
  });
});

describe("parseVerseRef / verseRefIssue", () => {
  it("tam ve geçerli adresi döner", () => {
    expect(parseVerseRef("2:255")).toEqual({ surah: 2, verse: 255 });
    expect(parseVerseRef("ihlas 1")).toEqual({ surah: 112, verse: 1 });
  });

  it("eksik ya da geçersiz adreste null döner", () => {
    expect(parseVerseRef("bakara")).toBeNull();
    expect(parseVerseRef("bakara 300")).toBeNull();
    expect(parseVerseRef("112:5")).toBeNull();
    expect(parseVerseRef("sabır")).toBeNull();
  });

  it("sorunun hangi parçada olduğunu ayırt eder", () => {
    expect(verseRefIssue({ surah: 2, verse: 255 })).toBeNull();
    expect(verseRefIssue({ surah: 0, verse: 1 })).toBe("surah");
    expect(verseRefIssue({ surah: 200, verse: 1 })).toBe("surah");
    expect(verseRefIssue({ surah: 112, verse: 0 })).toBe("verse");
    expect(verseRefIssue({ surah: 112, verse: 5 })).toBe("verse");
    expect(verseRefIssue({ surah: 112, verse: 1.5 })).toBe("verse");
  });
});

describe("searchSurahs", () => {
  it("ön ek eşleşmesini içerene tercih eder", () => {
    const results = searchSurahs("ba");
    expect(results[0].name).toBe("Bakara");
  });

  it("numarayla arar", () => {
    expect(searchSurahs("36")[0].no).toBe(36);
  });

  it("boş sorguda ilk sureleri döner ve sınırı aşmaz", () => {
    expect(searchSurahs("", 5)).toHaveLength(5);
    expect(searchSurahs("a", 3)).toHaveLength(3);
  });

  it("eşleşme yoksa boş döner", () => {
    expect(searchSurahs("zzzz")).toEqual([]);
  });
});

describe("truncateVerse", () => {
  it("sınırın altındaki metne dokunmaz", () => {
    expect(truncateVerse("Kısa ayet", 40)).toBe("Kısa ayet");
  });

  it("boşlukları sadeleştirir", () => {
    expect(truncateVerse("  iki   boşluk ", 40)).toBe("iki boşluk");
  });

  it("kelime sınırında keser", () => {
    expect(truncateVerse("bir iki üç dört beş", 12)).toBe("bir iki üç…");
  });

  it("boşluksuz uzun dizede ham keser", () => {
    expect(truncateVerse("aaaaaaaaaaaaaaaaaaaa", 5)).toBe("aaaaa…");
  });

  it("sıfır ya da negatif sınırda boş döner", () => {
    expect(truncateVerse("bir şey", 0)).toBe("");
    expect(truncateVerse("bir şey", -3)).toBe("");
  });
});
