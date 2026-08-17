import { describe, expect, it } from "vitest";

import {
  LEGAL_DOCUMENTS,
  LEGAL_DOCUMENT_IDS,
  LEGAL_DOCUMENT_LIST,
  classifyLegalDocument,
  collectLegalLinks,
  collectLegalMetaStrings,
  collectLegalScanStrings,
  collectLegalStrings,
  findBrokenLegalLinks,
  findLegalPlaceholders,
  findLegalSectionIssues,
  formatLegalDate,
  hasLegalPlaceholder,
  isSafeLegalHref,
  legalPlainText,
  type LegalDocumentMeta,
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

  it("bağlantı hedefindeki doldurulmamış alanı yakalar", () => {
    // Görünen metin tertemiz; kaçak yalnızca `href`'te. Tarama `href`'i
    // görmezse okuyucuya tıklanınca 404 olan bir başvuru yolu gösterilir.
    const sections: LegalSection[] = [
      {
        id: "basvuru",
        heading: "Başvuru",
        blocks: [
          {
            kind: "paragraph",
            text: [
              "Başvurunu ",
              { kind: "link", text: "başvuru formu", href: "/basvuru-[TBD]" },
              " ile ilet.",
            ],
          },
          {
            kind: "paragraph",
            text: [
              { kind: "link", text: "KVKK formu", href: "https://caka.app/[KVKK-FORM]" },
            ],
          },
        ],
      },
    ];
    expect(hasLegalPlaceholder(sections)).toBe(true);
    expect(findLegalPlaceholders(sections).sort()).toEqual([
      "[KVKK-FORM]",
      "[TBD]",
    ]);
  });

  it("tarama metni bağlantı hedefini içerir, görünen metin toplama değişmez", () => {
    const sections: LegalSection[] = [
      {
        id: "amac",
        heading: "Amaç",
        blocks: [
          {
            kind: "paragraph",
            text: [{ kind: "link", text: "form", href: "/basvuru-[TBD]" }],
          },
        ],
      },
    ];
    expect(collectLegalStrings(sections)).toEqual(["Amaç", "form"]);
    expect(collectLegalScanStrings(sections)).toContain("/basvuru-[TBD]");
  });

  it("künyedeki doldurulmamış alanı yakalar", () => {
    const doc: LegalDocumentMeta = {
      ...LEGAL_DOCUMENTS.gizlilik,
      title: "Gizlilik Metni [TASLAK]",
    };
    const temiz: LegalSection[] = [
      { id: "amac", heading: "Amaç", blocks: [] },
    ];
    // Bölümler tertemiz: künye taranmazsa kapı açık kalır.
    expect(findLegalPlaceholders(temiz)).toEqual([]);
    expect(
      findLegalPlaceholders(temiz, collectLegalMetaStrings(doc)),
    ).toEqual(["[TASLAK]"]);
  });

  it("künye taraması sürüm ve gezinme etiketini de kapsar", () => {
    const doc: LegalDocumentMeta = {
      ...LEGAL_DOCUMENTS.gizlilik,
      navLabel: "[ETİKET]",
      version: "[SÜRÜM]",
    };
    expect(collectLegalMetaStrings(doc)).toContain("[ETİKET]");
    expect(collectLegalMetaStrings(doc)).toContain("[SÜRÜM]");
  });

  it("yayındaki künyelerde doldurulmamış alan yoktur", () => {
    for (const doc of LEGAL_DOCUMENT_LIST) {
      expect(findLegalPlaceholders([], collectLegalMetaStrings(doc)), doc.id)
        .toEqual([]);
    }
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

  function tableSection(rows: LegalSection["blocks"][number]): LegalSection {
    return { id: "envanter", heading: "Envanter", blocks: [rows] };
  }

  it("sütun sayısına uymayan tablo satırını bildirir", () => {
    const eksik = tableSection({
      kind: "table",
      columns: ["Ad", "Amaç", "Ömür"],
      rows: [
        [["session"], ["oturum"], ["7 gün"]],
        [["state"], ["csrf"]], // bir hücre eksik → sütunlar kayar
      ],
    });
    const issues = findLegalSectionIssues([eksik]);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain("satır 2");
    expect(issues[0]).toContain("2 hücre");
    expect(issues[0]).toContain("3 sütun");
  });

  it("fazla hücreli satırı da bildirir", () => {
    const fazla = tableSection({
      kind: "table",
      columns: ["Ad", "Amaç"],
      rows: [[["session"], ["oturum"], ["fazlalık"]]],
    });
    expect(findLegalSectionIssues([fazla])).toHaveLength(1);
  });

  it("sütunlarla uyumlu tabloyu sorunsuz sayar", () => {
    const uyumlu = tableSection({
      kind: "table",
      caption: "Çerez envanteri",
      columns: ["Ad", "Amaç"],
      rows: [
        [["session"], ["oturum"]],
        [["state"], ["csrf"]],
      ],
    });
    expect(findLegalSectionIssues([uyumlu])).toEqual([]);
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
      paragraph("ayarlar", "/ayarlar"),
      paragraph("gelecek", "/cerez-tercihleri"),
      paragraph("kvkk", "https://www.kvkk.gov.tr/"),
      paragraph("posta", "mailto:merhaba@caka.app"),
    ];
    expect(findBrokenLegalLinks({ gizlilik: sections })).toEqual([]);
  });

  it.each(["/gizlilik-metni", "/kullanim", "/cerez-politikasi/ek"])(
    "hukuki yola benzeyip çözülmeyen iç yolu bildirir: %s",
    (href) => {
      const broken = findBrokenLegalLinks({
        gizlilik: [paragraph("yanlis", href)],
      });
      expect(broken).toHaveLength(1);
      expect(broken[0]).toContain("hedef belge çözümlenemedi");
      expect(broken[0]).toContain(href);
    },
  );

  it("yalnız istenen belgenin bağlantıları taranır", () => {
    const gizlilik = [paragraph("iyi", "#iyi"), { id: "iyi", heading: "İyi", blocks: [] }];
    const cerez = [paragraph("kotu", "#olmayan")];
    const registry = { gizlilik, "cerez-politikasi": cerez };
    expect(findBrokenLegalLinks(registry)).toHaveLength(1);
    expect(
      findBrokenLegalLinks(registry, { documents: ["gizlilik"] }),
    ).toEqual([]);
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
    // Protokol-göreli hedef iç yol DEĞİLDİR: `<Link to="//evil.com">` siteden
    // çıkar ve `rel` taşımaz. Ters eğik çizgi tarayıcıda eğik çizgiye
    // normalize olduğu için aynı kapıyı açar.
    expect(isSafeLegalHref("//evil.com")).toBe(false);
    expect(isSafeLegalHref("//evil.com/gizlilik")).toBe(false);
    expect(isSafeLegalHref("/\\evil.com")).toBe(false);
  });

  it("protokol-göreli hedef kırık sayılır", () => {
    const broken = findBrokenLegalLinks({
      gizlilik: [paragraph("kotu", "//evil.com")],
    });
    expect(broken).toHaveLength(1);
    expect(broken[0]).toContain("izin verilmeyen hedef");
  });
});

describe("classifyLegalDocument", () => {
  const doc = LEGAL_DOCUMENTS.gizlilik;

  it("temiz belgede engel de uyarı da yoktur", () => {
    const sections: LegalSection[] = [
      {
        id: "amac",
        heading: "Amaç",
        blocks: [{ kind: "paragraph", text: ["Bu metin hazırdır."] }],
      },
    ];
    expect(classifyLegalDocument(doc, sections)).toEqual({
      blocking: [],
      warnings: [],
      blocked: false,
    });
  });

  it("doldurulmamış alan engelleyicidir, uyarı listesine düşmez", () => {
    const sections: LegalSection[] = [
      {
        id: "veri-sorumlusu",
        heading: "Veri sorumlusu",
        blocks: [{ kind: "paragraph", text: ["[VERİ SORUMLUSU UNVANI]"] }],
      },
    ];
    const status = classifyLegalDocument(doc, sections);
    expect(status.blocked).toBe(true);
    expect(status.blocking).toEqual([
      "Doldurulmamış alan: [VERİ SORUMLUSU UNVANI]",
    ]);
    expect(status.warnings).toEqual([]);
  });

  it("künyedeki doldurulmamış alan da yayını engeller", () => {
    const taslak = { ...doc, title: "Gizlilik [TASLAK]" };
    const sections: LegalSection[] = [
      { id: "amac", heading: "Amaç", blocks: [] },
    ];
    const status = classifyLegalDocument(taslak, sections);
    expect(status.blocked).toBe(true);
    expect(status.blocking).toEqual(["Doldurulmamış alan: [TASLAK]"]);
  });

  it("bölüm ve bağlantı sorunları uyarıdır, yayını engellemez", () => {
    const sections: LegalSection[] = [
      { id: "haklar", heading: "Haklar", blocks: [] },
      {
        id: "haklar",
        heading: "Haklar (tekrar)",
        blocks: [
          {
            kind: "paragraph",
            text: [{ kind: "link", text: "bak", href: "#olmayan" }],
          },
        ],
      },
    ];
    const status = classifyLegalDocument(doc, sections);
    expect(status.blocked).toBe(false);
    expect(status.blocking).toEqual([]);
    expect(status.warnings).toHaveLength(2);
  });

  it("engel ve uyarı bir arada bulunabilir", () => {
    const sections: LegalSection[] = [
      {
        id: "",
        heading: "Adsız",
        blocks: [{ kind: "paragraph", text: ["[ADRES]"] }],
      },
      {
        id: "iletisim",
        heading: "İletişim",
        blocks: [
          {
            kind: "paragraph",
            text: [{ kind: "link", text: "bak", href: "#yok" }],
          },
        ],
      },
    ];
    const status = classifyLegalDocument(doc, sections);
    expect(status.blocked).toBe(true);
    expect(status.blocking).toEqual(["Doldurulmamış alan: [ADRES]"]);
    expect(status.warnings).toHaveLength(2);
    expect(status.warnings.some((w) => w.includes("Bölüm id'si boş"))).toBe(true);
    expect(status.warnings.some((w) => w.includes("#yok"))).toBe(true);
  });

  it("belgeler arası bağlantıyı verilen kayıt üzerinden çözer", () => {
    const gizlilik: LegalSection[] = [
      {
        id: "cerezler",
        heading: "Çerezler",
        blocks: [
          {
            kind: "paragraph",
            text: [
              {
                kind: "link",
                text: "envanter",
                href: "/cerez-politikasi#envanter",
              },
            ],
          },
        ],
      },
    ];
    const cerez: LegalSection[] = [
      { id: "envanter", heading: "Envanter", blocks: [] },
    ];

    expect(
      classifyLegalDocument(doc, gizlilik, { "cerez-politikasi": cerez })
        .warnings,
    ).toEqual([]);

    const kirik: LegalSection[] = [
      { id: "baska", heading: "Başka", blocks: [] },
    ];
    expect(
      classifyLegalDocument(doc, gizlilik, { "cerez-politikasi": kirik })
        .warnings,
    ).toHaveLength(1);
  });

  it("başka belgenin sorunlarını bu belgeye yazmaz", () => {
    const gizlilik: LegalSection[] = [
      { id: "amac", heading: "Amaç", blocks: [] },
    ];
    const bozukCerez: LegalSection[] = [
      {
        id: "envanter",
        heading: "Envanter",
        blocks: [
          {
            kind: "paragraph",
            text: [{ kind: "link", text: "bak", href: "#olmayan" }],
          },
        ],
      },
    ];
    const status = classifyLegalDocument(doc, gizlilik, {
      "cerez-politikasi": bozukCerez,
    });
    expect(status.warnings).toEqual([]);
  });
});
