import { describe, expect, it } from "vitest";

import {
  LEGAL_DOCUMENTS,
  LEGAL_DOCUMENT_IDS,
  LEGAL_DOCUMENT_LIST,
  collectLegalLinks,
  collectLegalStrings,
  findBrokenLegalLinks,
  findLegalPlaceholders,
  findLegalSectionIssues,
  formatLegalDate,
  hasLegalPlaceholder,
  isSafeLegalHref,
  legalPlainText,
  type LegalSection,
} from "./legal";

describe("hukuki belge künyeleri", () => {
  it("her belge kendi sürüm ve tarihini taşır, hiçbiri boş değildir", () => {
    for (const id of LEGAL_DOCUMENT_IDS) {
      const doc = LEGAL_DOCUMENTS[id];
      expect(doc.version.trim(), id).not.toBe("");
      expect(doc.updatedAt.trim(), id).not.toBe("");
      expect(doc.title.trim(), id).not.toBe("");
      expect(doc.navLabel.trim(), id).not.toBe("");
    }
  });

  it("tarihler ISO biçiminde tutulur", () => {
    for (const doc of LEGAL_DOCUMENT_LIST) {
      expect(doc.updatedAt, doc.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("yol ile belge kimliği eşleşir", () => {
    for (const doc of LEGAL_DOCUMENT_LIST) {
      expect(doc.path).toBe(`/${doc.id}`);
    }
  });

  it("künye kaydı üç belgeyi de içerir", () => {
    expect(LEGAL_DOCUMENT_LIST).toHaveLength(3);
  });
});

describe("formatLegalDate", () => {
  it("ISO tarihi Türkçe yazıya çevirir", () => {
    expect(formatLegalDate("2026-08-17")).toBe("17 Ağustos 2026");
    expect(formatLegalDate("2026-01-05")).toBe("5 Ocak 2026");
    expect(formatLegalDate("2025-12-31")).toBe("31 Aralık 2025");
  });

  it("tanınmayan girdiyi olduğu gibi döndürür", () => {
    expect(formatLegalDate("yakında")).toBe("yakında");
    expect(formatLegalDate("2026-13-01")).toBe("2026-13-01");
  });
});

describe("metin toplama", () => {
  const sections: LegalSection[] = [
    {
      id: "amac",
      heading: "Amaç",
      blocks: [
        {
          kind: "paragraph",
          text: [
            "Ayrıntı için ",
            { kind: "link", text: "Çerez Politikası", href: "/cerez-politikasi" },
            " sayfasına bak.",
          ],
        },
        {
          kind: "list",
          style: "bullet",
          items: [[{ kind: "strong", text: "Kimlik" }, " — ad, soyad"]],
        },
        {
          kind: "table",
          caption: "Çerez envanteri",
          columns: ["Ad", "Amaç"],
          rows: [[["session"], ["oturum"]]],
        },
      ],
    },
  ];

  it("satır içi parçaları düz metne indirger", () => {
    expect(
      legalPlainText([
        "Ayrıntı için ",
        { kind: "link", text: "Çerez Politikası", href: "/cerez-politikasi" },
        " sayfasına bak.",
      ]),
    ).toBe("Ayrıntı için Çerez Politikası sayfasına bak.");
  });

  it("başlık, paragraf, madde ve tablo metinlerini toplar", () => {
    const strings = collectLegalStrings(sections);
    expect(strings).toContain("Amaç");
    expect(strings).toContain("Ayrıntı için Çerez Politikası sayfasına bak.");
    expect(strings).toContain("Kimlik — ad, soyad");
    expect(strings).toContain("Çerez envanteri");
    expect(strings).toContain("oturum");
  });

  it("bağlantıları bölüm bağlamıyla toplar", () => {
    const links = collectLegalLinks(sections);
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({
      href: "/cerez-politikasi",
      text: "Çerez Politikası",
      sectionId: "amac",
    });
  });

  it("blokları boş bir bölümü hatasız işler", () => {
    const empty: LegalSection[] = [{ id: "bos", heading: "Boş bölüm", blocks: [] }];
    expect(() => collectLegalStrings(empty)).not.toThrow();
    expect(collectLegalStrings(empty)).toEqual(["Boş bölüm"]);
    expect(collectLegalLinks(empty)).toEqual([]);
    expect(findLegalPlaceholders(empty)).toEqual([]);
    expect(findBrokenLegalLinks({ gizlilik: empty })).toEqual([]);
    expect(findLegalSectionIssues(empty)).toEqual([]);
  });
});

describe("placeholder kapısı", () => {
  const withPlaceholder: LegalSection[] = [
    {
      id: "veri-sorumlusu",
      heading: "Veri sorumlusu",
      blocks: [
        {
          kind: "paragraph",
          text: ["Veri sorumlusu ", "[VERİ SORUMLUSU UNVANI]", " şirketidir."],
        },
      ],
    },
  ];

  it("paragraf içindeki doldurulmamış alanı yakalar", () => {
    expect(hasLegalPlaceholder(withPlaceholder)).toBe(true);
    expect(findLegalPlaceholders(withPlaceholder)).toEqual([
      "[VERİ SORUMLUSU UNVANI]",
    ]);
  });

  it("başlıktaki, madde ve tablo hücresindeki alanları da yakalar", () => {
    const sections: LegalSection[] = [
      {
        id: "karisik",
        heading: "[BÖLÜM BAŞLIĞI]",
        blocks: [
          {
            kind: "list",
            style: "numbered",
            items: [["Saklama süresi: ", "[SAKLAMA SÜRESİ]"]],
          },
          {
            kind: "table",
            columns: ["Tedarikçi"],
            rows: [[["[TEDARİKÇİ ADI]"]]],
          },
        ],
      },
    ];
    expect(findLegalPlaceholders(sections).sort()).toEqual([
      "[BÖLÜM BAŞLIĞI]",
      "[SAKLAMA SÜRESİ]",
      "[TEDARİKÇİ ADI]",
    ]);
  });

  it("doldurulmuş metinde eşleşme bulmaz", () => {
    const sections: LegalSection[] = [
      {
        id: "veri-sorumlusu",
        heading: "Veri sorumlusu",
        blocks: [
          { kind: "paragraph", text: ["Veri sorumlusu Caka'dır."] },
        ],
      },
    ];
    expect(hasLegalPlaceholder(sections)).toBe(false);
  });

  it("aynı alan iki kez geçse de bir kez raporlanır", () => {
    const sections: LegalSection[] = [
      {
        id: "a",
        heading: "A",
        blocks: [
          { kind: "paragraph", text: ["[ADRES]"] },
          { kind: "paragraph", text: ["Yine ", "[ADRES]"] },
        ],
      },
    ];
    expect(findLegalPlaceholders(sections)).toEqual(["[ADRES]"]);
  });
});

describe("bölüm id bütünlüğü", () => {
  it("tekrar eden id'yi bildirir", () => {
    const sections: LegalSection[] = [
      { id: "haklar", heading: "Haklar", blocks: [] },
      { id: "haklar", heading: "Haklar (tekrar)", blocks: [] },
    ];
    expect(findLegalSectionIssues(sections)).toHaveLength(1);
  });

  it("boş id'yi bildirir", () => {
    const sections: LegalSection[] = [{ id: "  ", heading: "Adsız", blocks: [] }];
    expect(findLegalSectionIssues(sections)).toHaveLength(1);
  });
});

describe("bağlantı bütünlüğü", () => {
  function paragraph(id: string, href: string): LegalSection {
    return {
      id,
      heading: id,
      blocks: [
        { kind: "paragraph", text: [{ kind: "link", text: "bak", href }] },
      ],
    };
  }

  it("var olmayan bir bölüme link veren belge kırık sayılır", () => {
    const sections = [
      paragraph("iletisim", "#olmayan-bolum"),
      { id: "haklar", heading: "Haklar", blocks: [] },
    ];
    const broken = findBrokenLegalLinks({ gizlilik: sections });
    expect(broken).toHaveLength(1);
    expect(broken[0]).toContain("#olmayan-bolum");
  });

  it("var olan bölüme link veren belge temizdir", () => {
    const sections = [
      paragraph("iletisim", "#haklar"),
      { id: "haklar", heading: "Haklar", blocks: [] },
    ];
    expect(findBrokenLegalLinks({ gizlilik: sections })).toEqual([]);
  });

  it("belgeler arası bölüm bağlantısını çapraz doğrular", () => {
    const gizlilik = [paragraph("cerezler", "/cerez-politikasi#envanter")];
    const cerez: LegalSection[] = [
      { id: "envanter", heading: "Envanter", blocks: [] },
    ];
    expect(
      findBrokenLegalLinks({ gizlilik, "cerez-politikasi": cerez }),
    ).toEqual([]);

    const kirik = [paragraph("cerezler", "/cerez-politikasi#yok")];
    expect(
      findBrokenLegalLinks({ gizlilik: kirik, "cerez-politikasi": cerez }),
    ).toHaveLength(1);
  });

  it("hedef belge kayıtlı değilse sessizce geçer", () => {
    const gizlilik = [paragraph("cerezler", "/cerez-politikasi#envanter")];
    expect(findBrokenLegalLinks({ gizlilik })).toEqual([]);
  });

  it("hukuki olmayan iç yollar ve dış bağlantılar doğrulanmaz", () => {
    const sections = [
      paragraph("giris", "/login"),
      paragraph("kvkk", "https://www.kvkk.gov.tr/"),
      paragraph("posta", "mailto:merhaba@caka.app"),
    ];
    expect(findBrokenLegalLinks({ gizlilik: sections })).toEqual([]);
  });

  it("izin verilmeyen protokol kırık sayılır", () => {
    const sections = [paragraph("kotu", "javascript:alert(1)")];
    const broken = findBrokenLegalLinks({ gizlilik: sections });
    expect(broken).toHaveLength(1);
    expect(broken[0]).toContain("izin verilmeyen hedef");
  });

  it("isSafeLegalHref allowlist'i uygular", () => {
    expect(isSafeLegalHref("#bolum")).toBe(true);
    expect(isSafeLegalHref("/gizlilik")).toBe(true);
    expect(isSafeLegalHref("https://caka.app")).toBe(true);
    expect(isSafeLegalHref("mailto:merhaba@caka.app")).toBe(true);
    expect(isSafeLegalHref("javascript:alert(1)")).toBe(false);
    expect(isSafeLegalHref("data:text/html,x")).toBe(false);
  });
});
