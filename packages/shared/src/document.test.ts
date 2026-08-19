import { describe, expect, it } from "vitest";

import {
  DOCUMENT_FILE_NAME_MAX,
  DOCUMENT_MAX_BYTES,
  contentDispositionHeader,
  formatFileSize,
  formatUploadDate,
  isPdfBytes,
  sanitizeDocumentFileName,
  shortenFileName,
} from "./document";

function bytesOf(text: string): Uint8Array {
  return new Uint8Array([...text].map((char) => char.charCodeAt(0)));
}

describe("isPdfBytes", () => {
  it("%PDF- ile başlayan gövdeyi kabul eder", () => {
    expect(isPdfBytes(bytesOf("%PDF-1.7\n%âãÏÓ"))).toBe(true);
    expect(isPdfBytes(bytesOf("%PDF-"))).toBe(true);
  });

  it("başka bir türü, boş gövdeyi ve kırık imzayı reddeder", () => {
    expect(isPdfBytes(bytesOf("<!doctype html>"))).toBe(false);
    expect(isPdfBytes(bytesOf("%PDF"))).toBe(false);
    expect(isPdfBytes(new Uint8Array())).toBe(false);
    expect(isPdfBytes(new Uint8Array([0xff, 0xd8, 0xff]))).toBe(false);
  });

  it("imzayı gövdenin İÇİNE saklayan dosyayı reddeder", () => {
    // Spec ilk 1024 baytı tarar; biz taramıyoruz — HTML+PDF melezine kapı
    // açmamak için imza ilk baytta olmalı.
    expect(isPdfBytes(bytesOf("<html></html>%PDF-1.4"))).toBe(false);
  });
});

describe("sanitizeDocumentFileName", () => {
  it("sıradan adı olduğu gibi bırakır", () => {
    expect(sanitizeDocumentFileName("Özgeçmiş 2026.pdf")).toBe("Özgeçmiş 2026.pdf");
  });

  it("yol parçalarını atar", () => {
    expect(sanitizeDocumentFileName("../../etc/passwd.pdf")).toBe("passwd.pdf");
    expect(sanitizeDocumentFileName("C:\\Users\\ali\\cv.pdf")).toBe("cv.pdf");
  });

  it("başlık enjeksiyonuna açan karakterleri temizler", () => {
    expect(sanitizeDocumentFileName('cv"\r\nX-Injected: 1.pdf')).toBe("cvX-Injected: 1.pdf");
    expect(sanitizeDocumentFileName("cv\u0000.pdf")).toBe("cv.pdf");
  });

  it("uzantıyı ters gösteren bidi işaretlerini siler", () => {
    expect(sanitizeDocumentFileName("cv\u202Efdp.exe")).toBe("cvfdp.exe.pdf");
  });

  it("uzantı yoksa .pdf ekler, varsa tekrarlamaz", () => {
    expect(sanitizeDocumentFileName("ozgecmis")).toBe("ozgecmis.pdf");
    expect(sanitizeDocumentFileName("ozgecmis.PDF")).toBe("ozgecmis.PDF");
  });

  it("gizli dosya adı üretmez ve kurtarılamayan adda boş döner", () => {
    expect(sanitizeDocumentFileName("...")).toBe("");
    expect(sanitizeDocumentFileName("   ")).toBe("");
    expect(sanitizeDocumentFileName("")).toBe("");
    // Yalnız uzantı: baştaki nokta kırpılınca "pdf.pdf" üretmemeli.
    expect(sanitizeDocumentFileName(".pdf")).toBe("");
    expect(sanitizeDocumentFileName("PDF")).toBe("");
  });

  it("üst sınırı aşan adı uzantıyı koruyarak kırpar", () => {
    const long = `${"a".repeat(400)}.pdf`;
    const result = sanitizeDocumentFileName(long);
    expect(result.length).toBeLessThanOrEqual(DOCUMENT_FILE_NAME_MAX);
    expect(result.endsWith(".pdf")).toBe(true);
  });
});

describe("contentDispositionHeader", () => {
  it("ASCII ve RFC 5987 biçimlerini birlikte yazar", () => {
    expect(contentDispositionHeader("attachment", "cv.pdf")).toBe(
      `attachment; filename="cv.pdf"; filename*=UTF-8''cv.pdf`,
    );
  });

  it("Türkçe karakterleri ASCII yedeğinde bozar, ext-value'da korur", () => {
    const header = contentDispositionHeader("inline", "Özgeçmiş.pdf");
    expect(header.startsWith('inline; filename="')).toBe(true);
    expect(header).toContain(`filename*=UTF-8''${encodeURIComponent("Özgeçmiş.pdf")}`);
    // ASCII yedeğinde kaçış gerektirecek karakter kalmamalı.
    expect(/filename="[\x20-\x7e]*"/.test(header)).toBe(true);
  });

  it("başlığa satır sonu ya da tırnak sızdırmaz", () => {
    const header = contentDispositionHeader("attachment", 'a"\r\nb.pdf');
    expect(header).not.toContain("\r");
    expect(header).not.toContain("\n");
    expect(header.match(/"/g)).toHaveLength(2);
  });

  it("adı kurtarılamayan dosyada yedek ada düşer", () => {
    expect(contentDispositionHeader("attachment", "...")).toContain('filename="belge.pdf"');
  });
});

describe("shortenFileName", () => {
  it("sınırın altındaki adı olduğu gibi bırakır", () => {
    expect(shortenFileName("cv.pdf", 24)).toBe("cv.pdf");
  });

  it("ortadan kısaltır, uzantıyı ve sondaki ayırt edici parçayı korur", () => {
    const result = shortenFileName("abdullah-cicekli-ozgecmis-2026.pdf", 24);
    expect(result.length).toBe(24);
    expect(result.endsWith(".pdf")).toBe(true);
    expect(result).toContain("…");
    expect(result.startsWith("abdullah")).toBe(true);
    expect(result).toMatch(/2026\.pdf$/);
  });

  it("uzantısı olmayan adı da kısaltır", () => {
    const result = shortenFileName("a".repeat(60), 20);
    expect(result.length).toBe(20);
    expect(result).toContain("…");
  });

  it("nokta içeren ama uzantısız adda son parçayı uzantı sanmaz", () => {
    const result = shortenFileName("2026.01.12 guncellenmis ozgecmis dosyasi", 20);
    expect(result.length).toBe(20);
    expect(result.endsWith("dosyasi")).toBe(true);
  });

  it("çok küçük sınırlarda patlamaz", () => {
    expect(shortenFileName("cv.pdf", 0)).toBe("");
    expect(shortenFileName("cv.pdf", 1)).toBe("…");
    expect(shortenFileName("uzunca-bir-ad.pdf", 3).length).toBe(3);
  });
});

describe("formatFileSize", () => {
  it("bayt, KB ve MB basamaklarını ayırır", () => {
    expect(formatFileSize(0, ",")).toBe("0 B");
    expect(formatFileSize(1023, ",")).toBe("1023 B");
    expect(formatFileSize(1024, ",")).toBe("1 KB");
    expect(formatFileSize(512 * 1024, ",")).toBe("512 KB");
    expect(formatFileSize(1024 * 1024, ",")).toBe("1 MB");
  });

  it("MB'ı tek ondalıkla, dilin ayırıcısıyla yazar", () => {
    expect(formatFileSize(1.25 * 1024 * 1024, ",")).toBe("1,3 MB");
    expect(formatFileSize(1.25 * 1024 * 1024, ".")).toBe("1.3 MB");
  });

  it("10 MB'tan büyüğü tam sayıya yuvarlar", () => {
    expect(formatFileSize(DOCUMENT_MAX_BYTES, ",")).toBe("10 MB");
  });

  it("geçersiz değerde boş döner", () => {
    expect(formatFileSize(-1, ",")).toBe("");
    expect(formatFileSize(Number.NaN, ",")).toBe("");
  });
});

describe("formatUploadDate", () => {
  const months = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
  ];
  const pattern = (day: number, month: string, year: number) => `${day} ${month} ${year}`;

  it("UTC gününü yazar", () => {
    expect(formatUploadDate(Date.UTC(2026, 7, 12), months, pattern)).toBe("12 Ağustos 2026");
  });

  it("boş ya da geçersiz damgada hiçbir şey yazmaz", () => {
    expect(formatUploadDate(0, months, pattern)).toBe("");
    expect(formatUploadDate(Number.NaN, months, pattern)).toBe("");
  });
});
