// R32 / R33 / KTD21 / KTD22: Hukuki belgelerin ortak veri modeli.
//
// Üç hukuki sayfa (`/gizlilik`, `/kullanim-kosullari`, `/cerez-politikasi`)
// aynı `LegalSection[]` şeklinden render edilir. Metin bileşene gömülmez
// (Değişmez #5); içerik modülleri `apps/web/app/content/legal/` altında yaşar
// ve yalnızca veri döndürür.
//
// Neden belge başına sürüm: üçü aynı gün yayınlansa da sonradan yalnızca biri
// değişebilir. Ortak tek bir tarih sabiti, değişmeyen belgenin tarihini de
// oynatır ve metni gerçeğe aykırı hâle getirir.

/* ------------------------------------------------------------------ *
 * Satır içi metin
 * ------------------------------------------------------------------ */

/**
 * Satır içi parça. Ham HTML string'i YOK — `rich-text.tsx`'teki allowlist
 * yaklaşımının aynısı, ama elle yazılan uzun metin için Tiptap JSON'undan
 * daha az gürültülü bir gösterim.
 *
 * - `string` → düz metin
 * - `{ kind: "strong" }` → vurgulu terim (tanım listelerinin başı)
 * - `{ kind: "link" }` → bağlantı; `href` iç yol (`/gizlilik`), aynı belgedeki
 *   bölüm (`#bolum-id`), başka belgenin bölümü (`/gizlilik#bolum-id`),
 *   `https://…` veya `mailto:…` olabilir.
 */
export type LegalInline =
  | string
  | { kind: "strong"; text: string }
  | { kind: "link"; text: string; href: string };

/** Satır içi parçalardan oluşan metin parçası. */
export type LegalRichText = readonly LegalInline[];

/** Tablo hücresi — satır içi bağlantı taşıyabilir. */
export type LegalCell = LegalRichText;

/** Tablo satırı: sütun sayısı kadar hücre. */
export type LegalRow = readonly LegalCell[];

/* ------------------------------------------------------------------ *
 * Bloklar ve bölümler
 * ------------------------------------------------------------------ */

/**
 * Blok sözlüğü. Üç varyant bilinçli olarak dar tutuldu; alt başlık gerektiren
 * içerik yeni bir `LegalSection` olur (bölümler zaten `id` taşıdığı için
 * derin bağlantı da böyle çalışır).
 */
export type LegalBlock =
  | { kind: "paragraph"; text: LegalRichText }
  | {
      kind: "list";
      /** İşaretli madde mi, numaralı madde mi. */
      style: "bullet" | "numbered";
      items: readonly LegalRichText[];
    }
  | {
      kind: "table";
      /** Tablonun altında görünen açıklama (opsiyonel). */
      caption?: string;
      columns: readonly string[];
      rows: readonly LegalRow[];
    };

/** Bir hukuki belgenin numaralanmış bölümü. `id`, `#bolum-id` hedefi olur. */
export type LegalSection = {
  id: string;
  heading: string;
  blocks: readonly LegalBlock[];
};

/* ------------------------------------------------------------------ *
 * Belge kimlikleri, sürüm ve tarih
 * ------------------------------------------------------------------ */

export const LEGAL_DOCUMENT_IDS = [
  "gizlilik",
  "kullanim-kosullari",
  "cerez-politikasi",
] as const;

export type LegalDocumentId = (typeof LEGAL_DOCUMENT_IDS)[number];

export type LegalDocumentMeta = {
  id: LegalDocumentId;
  /** Uygulama yolu; belgeler arası gezinme ve bağlantı doğrulaması kullanır. */
  path: string;
  /** Sayfa başlığı (h1). */
  title: string;
  /** Belgeler arası gezinme şeridindeki kısa etiket. */
  navLabel: string;
  /** Belge sürümü — yalnız bu belge değiştiğinde artar. */
  version: string;
  /** ISO tarih (YYYY-AA-GG) — yalnız bu belge değiştiğinde güncellenir. */
  updatedAt: string;
};

export const LEGAL_DOCUMENTS: Record<LegalDocumentId, LegalDocumentMeta> = {
  gizlilik: {
    id: "gizlilik",
    path: "/gizlilik",
    title: "Gizlilik ve Aydınlatma Metni",
    navLabel: "Gizlilik ve Aydınlatma",
    // 0.5: konum kartının haritası artık ziyaretçinin tarayıcısından
    // DOĞRUDAN Mapbox'a gidiyor (sağlayıcının şartları proxy'lemeyi
    // yasaklıyor) — §6 tablosuna Mapbox satırı eklendi. Yeni bir üçüncü
    // taraf teması, damga sabit kalamazdı.
    // 0.4: belge (PDF) yükleme eklendi — "yüklenen dosyalar" satırı artık
    // görselin yanında belgeyi de sayıyor. Metin değişip damga sabit
    // kalsaydı yayındaki "son güncelleme" tarihi yalan söylerdi.
    version: "0.5",
    updatedAt: "2026-08-19",
  },
  "kullanim-kosullari": {
    id: "kullanim-kosullari",
    path: "/kullanim-kosullari",
    title: "Kullanım Koşulları",
    navLabel: "Kullanım Koşulları",
    version: "0.3",
    updatedAt: "2026-08-18",
  },
  "cerez-politikasi": {
    id: "cerez-politikasi",
    path: "/cerez-politikasi",
    title: "Çerez Politikası",
    navLabel: "Çerez Politikası",
    // 0.4: §6'ya harita isteği (Mapbox) eklendi. Çerez YAZMIYOR — ölçüldü,
    // yanıtta çerez başlığı yok — ama IP ve User Agent gidiyor, yani
    // "cihaza yazmayan üçüncü taraf istekleri" listesine girmesi şart.
    version: "0.4",
    updatedAt: "2026-08-19",
  },
};

export const LEGAL_DOCUMENT_LIST: readonly LegalDocumentMeta[] =
  LEGAL_DOCUMENT_IDS.map((id) => LEGAL_DOCUMENTS[id]);

const TR_MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

/**
 * `2026-08-17` → `17 Ağustos 2026`. Intl yerine sabit tablo: çıktının
 * çalışma ortamının locale verisine göre kaymamasını garanti eder.
 * Biçim tanınmazsa girdi olduğu gibi döner (sayfa yine de render olur).
 */
export function formatLegalDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return iso;
  const [, year, month, day] = match;
  const name = TR_MONTHS[Number(month) - 1];
  if (!name) return iso;
  return `${Number(day)} ${name} ${year}`;
}

/* ------------------------------------------------------------------ *
 * Metin toplama
 * ------------------------------------------------------------------ */

function inlineText(node: LegalInline): string {
  return typeof node === "string" ? node : node.text;
}

/** Satır içi parçaları düz metne indirger (tarama ve test için). */
export function legalPlainText(text: LegalRichText): string {
  return text.map(inlineText).join("");
}

/**
 * Bir belgede ziyaretçiye görünen tüm string'ler. Başlıklar, paragraflar,
 * madde metinleri, tablo başlıkları/hücreleri ve tablo açıklaması dahil.
 */
export function collectLegalStrings(
  sections: readonly LegalSection[],
): string[] {
  const out: string[] = [];
  for (const section of sections) {
    out.push(section.heading);
    for (const block of section.blocks) {
      if (block.kind === "paragraph") {
        out.push(legalPlainText(block.text));
      } else if (block.kind === "list") {
        for (const item of block.items) out.push(legalPlainText(item));
      } else {
        if (block.caption) out.push(block.caption);
        out.push(...block.columns);
        for (const row of block.rows) {
          for (const cell of row) out.push(legalPlainText(cell));
        }
      }
    }
  }
  return out;
}

/**
 * Placeholder taramasının gördüğü string'ler: ziyaretçiye görünen metinlere
 * ek olarak bağlantı **hedefleri**. `inlineText` bir bağlantıyı `text`'ine
 * indirger; hedefteki doldurulmamış alan (`/basvuru-[TBD]`) yalnız görünen
 * metne bakılırsa kapıdan geçer. Render bu fonksiyonu kullanmaz — çıktı
 * yalnızca tarama içindir, `collectLegalStrings` olduğu gibi kalır.
 */
export function collectLegalScanStrings(
  sections: readonly LegalSection[],
): string[] {
  return [
    ...collectLegalStrings(sections),
    ...collectLegalLinks(sections).map((link) => link.href),
  ];
}

/**
 * Belge künyesindeki taranabilir string'ler. Künye bölümlerin dışında yaşar
 * ama `<h1>`, SEO başlığı, gezinme şeridi ve tarih satırı olarak render edilir;
 * oradaki bir `[TBD]` bölümler tertemizken bile yayına sızar.
 */
export function collectLegalMetaStrings(doc: LegalDocumentMeta): string[] {
  return [doc.title, doc.navLabel, doc.version, doc.updatedAt, doc.path];
}

/** Belgedeki tüm bağlantılar (bağlam etiketiyle birlikte). */
export function collectLegalLinks(
  sections: readonly LegalSection[],
): { href: string; text: string; sectionId: string }[] {
  const out: { href: string; text: string; sectionId: string }[] = [];
  const visit = (text: LegalRichText, sectionId: string) => {
    for (const node of text) {
      if (typeof node !== "string" && node.kind === "link") {
        out.push({ href: node.href, text: node.text, sectionId });
      }
    }
  };
  for (const section of sections) {
    for (const block of section.blocks) {
      if (block.kind === "paragraph") visit(block.text, section.id);
      else if (block.kind === "list") {
        for (const item of block.items) visit(item, section.id);
      } else {
        for (const row of block.rows) {
          for (const cell of row) visit(cell, section.id);
        }
      }
    }
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * R33 — placeholder kapısı
 * ------------------------------------------------------------------ */

/**
 * Doldurulmamış olgu alanı kalıbı: `[VERİ SORUMLUSU UNVANI]`.
 * Hukuki metinde köşeli parantez başka amaçla KULLANILMAZ — bu işaret
 * yalnızca "yayın öncesi doldurulacak" anlamına gelir.
 */
export const LEGAL_PLACEHOLDER_PATTERN = /\[[^\]\n]+\]/g;

/** Tek bir metin parçasındaki placeholder'lar. */
export function findPlaceholdersInText(value: string): string[] {
  return value.match(LEGAL_PLACEHOLDER_PATTERN) ?? [];
}

/** Metinde doldurulmamış alan var mı (kapının yüklem hâli). */
export function hasLegalPlaceholder(
  sections: readonly LegalSection[],
  extraStrings: readonly string[] = [],
): boolean {
  return findLegalPlaceholders(sections, extraStrings).length > 0;
}

/**
 * Belgede kalan tüm doldurulmamış alanlar; tekilleştirilmiş.
 *
 * Tarama bölüm metinlerini **ve** bağlantı hedeflerini kapsar. Künye gibi
 * bölümlerin dışında kalan string'ler `extraStrings` ile verilir
 * (`collectLegalMetaStrings`).
 */
export function findLegalPlaceholders(
  sections: readonly LegalSection[],
  extraStrings: readonly string[] = [],
): string[] {
  const found = new Set<string>();
  for (const value of [...collectLegalScanStrings(sections), ...extraStrings]) {
    for (const hit of findPlaceholdersInText(value)) found.add(hit);
  }
  return [...found];
}

/* ------------------------------------------------------------------ *
 * Bağlantı bütünlüğü
 * ------------------------------------------------------------------ */

/**
 * Protokol-göreli hedef: `//evil.com` ve tarayıcının ters eğik çizgiyi eğik
 * çizgiye normalize etmesiyle aynı kapıya çıkan `/\evil.com`. İkisi de iç yol
 * gibi okunur ama site dışına gider.
 */
const PROTOCOL_RELATIVE_PATTERN = /^[/\\][/\\]/;

/** Bağlantıda izin verilen protokoller (`rich-text.tsx` ile aynı allowlist). */
export function isSafeLegalHref(href: string): boolean {
  // Tek eğik çizgi kısayolundan ÖNCE elenir: aksi hâlde `//evil.com` iç yol
  // sayılıp `<Link>` ile, yani `rel` olmadan, site dışına gezinir.
  if (PROTOCOL_RELATIVE_PATTERN.test(href)) return false;
  if (href.startsWith("#") || href.startsWith("/")) return true;
  try {
    const url = new URL(href);
    return (
      url.protocol === "http:" ||
      url.protocol === "https:" ||
      url.protocol === "mailto:"
    );
  } catch {
    return false;
  }
}

/** Kayıtlı belgelerin bölüm listeleri; bağlantı doğrulaması bunu kullanır. */
export type LegalSectionRegistry = Partial<
  Record<LegalDocumentId, readonly LegalSection[]>
>;

const PATH_TO_DOCUMENT_ID = new Map<string, LegalDocumentId>(
  LEGAL_DOCUMENT_LIST.map((doc) => [doc.path, doc.id]),
);

/**
 * Bölümlerin kendi içindeki yapı sorunları:
 * - boş ya da tekrar eden `id` (kırık `#bolum-id` bağlantısı üretir)
 * - tablo satırının hücre sayısının sütun sayısıyla uyuşmaması (eksik hücre
 *   sütunları kaydırır, fazlası başlıksız bir sütun doğurur — ikisi de
 *   hukuki tabloyu sessizce yanlış okutur)
 */
export function findLegalSectionIssues(
  sections: readonly LegalSection[],
): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  for (const section of sections) {
    const id = section.id.trim();
    if (id === "") {
      issues.push(`Bölüm id'si boş: "${section.heading}"`);
    } else {
      if (seen.has(id)) issues.push(`Bölüm id'si tekrar ediyor: "${id}"`);
      seen.add(id);
    }

    const label = id === "" ? section.heading : id;
    for (const block of section.blocks) {
      if (block.kind !== "table") continue;
      block.rows.forEach((row, index) => {
        if (row.length === block.columns.length) return;
        issues.push(
          `Tablo satırı sütun sayısıyla uyuşmuyor: "${label}" ` +
            `satır ${index + 1} — ${row.length} hücre, ` +
            `${block.columns.length} sütun`,
        );
      });
    }
  }
  return issues;
}

const LEGAL_PATH_SLUGS: readonly string[] = LEGAL_DOCUMENT_LIST.map((doc) =>
  doc.path.replace(/^\//, ""),
);

/** Önek karşılaştırmasının anlamlı sayılması için en kısa ortak uzunluk. */
const LEGAL_PATH_NEAR_MISS_MIN = 4;

/**
 * Çözümlenemeyen bir iç yol "hukuki belge yolu gibi mi görünüyor?"
 *
 * Kural: yolun ilk segmenti kayıtlı bir belge slug'ıyla önek ilişkisindeyse
 * (biri diğeriyle başlıyorsa) yazım hatası sayılır ve raporlanır —
 * `/gizlilik-metni`, `/kullanim` gibi. Aksi hâlde gerçekten hukuki olmayan bir
 * iç yoldur (`/login`, `/ayarlar`) ve doğrulanamayacağı için sessizce geçilir.
 *
 * Kural bilinçli olarak önek ilişkisiyle sınırlı: harf düşmesi (`/gizllik`)
 * yakalanmaz. Amaç, hukuki yol yazarken yapılan yakın-ıska hatalarını
 * yüzeye çıkarmak; uygulamanın route tablosunu buradan taklit etmek değil.
 */
function looksLikeLegalPath(rawPath: string): boolean {
  const segment = rawPath.replace(/^\//, "").split("/")[0] ?? "";
  if (segment === "") return false;
  return LEGAL_PATH_SLUGS.some(
    (slug) =>
      (segment.length >= LEGAL_PATH_NEAR_MISS_MIN && slug.startsWith(segment)) ||
      (slug.length >= LEGAL_PATH_NEAR_MISS_MIN && segment.startsWith(slug)),
  );
}

/**
 * Kırık iç bağlantıları bulur. Doğrulananlar:
 * - `#bolum-id` → aynı belgede o bölüm var mı
 * - `/gizlilik#bolum-id` → hedef belge kayıtlıysa o bölüm var mı
 * - `/gizlilik-metni` → hukuki belge yoluna benzeyip hiçbirine çözülmeyen iç
 *   yol (`:username` catch-all'una düşüp 404 olurdu)
 * - protokol allowlist'i (`javascript:`, `//evil.com` kırık sayılır)
 *
 * Hukuki belge yoluna benzemeyen iç yollar (`/login`) ve dış bağlantılar
 * doğrulanamaz; sessizce geçilir. Ayrım için bkz. `looksLikeLegalPath`.
 *
 * `options.documents` verilirse yalnız o belgelerdeki bağlantılar taranır;
 * çözümleme yine tüm `registry` üzerinden yapılır.
 */
export function findBrokenLegalLinks(
  registry: LegalSectionRegistry,
  options?: { readonly documents?: readonly LegalDocumentId[] },
): string[] {
  const idsByDocument = new Map<LegalDocumentId, Set<string>>();
  for (const id of LEGAL_DOCUMENT_IDS) {
    const sections = registry[id];
    if (sections) {
      idsByDocument.set(id, new Set(sections.map((s) => s.id.trim())));
    }
  }

  const scanned = options?.documents ?? LEGAL_DOCUMENT_IDS;
  const broken: string[] = [];
  for (const documentId of scanned) {
    const sections = registry[documentId];
    if (!sections) continue;

    for (const link of collectLegalLinks(sections)) {
      const { href } = link;
      const where = `${documentId}#${link.sectionId} → "${link.text}"`;

      if (!isSafeLegalHref(href)) {
        broken.push(`${where}: izin verilmeyen hedef "${href}"`);
        continue;
      }
      if (href.startsWith("http") || href.startsWith("mailto:")) continue;

      const [rawPath, hash] = splitHref(href);
      const targetId = rawPath === "" ? documentId : PATH_TO_DOCUMENT_ID.get(rawPath);

      if (!targetId) {
        // Hukuki yola benziyor ama hiçbirine çözülmüyor → yazım hatası.
        if (looksLikeLegalPath(rawPath)) {
          broken.push(`${where}: hedef belge çözümlenemedi "${href}"`);
        }
        continue; // aksi hâlde hukuki olmayan iç yol; doğrulanamaz
      }
      if (!hash) continue;

      const known = idsByDocument.get(targetId);
      if (!known) continue; // hedef belge bu çalıştırmada kayıtlı değil
      if (!known.has(hash)) {
        broken.push(`${where}: "${targetId}" belgesinde "#${hash}" bölümü yok`);
      }
    }
  }
  return broken;
}

function splitHref(href: string): [path: string, hash: string] {
  const index = href.indexOf("#");
  if (index < 0) return [href, ""];
  return [href.slice(0, index), href.slice(index + 1)];
}

/* ------------------------------------------------------------------ *
 * R33 — yayına hazırlık sınıflandırması
 * ------------------------------------------------------------------ */

/**
 * Bir belgenin yayına hazırlık durumu.
 *
 * Ayrım hukuki: **doldurulmamış alan** yayını engeller — okuyucuya
 * `[VERİ SORUMLUSU UNVANI]` gösteren bir aydınlatma metni aydınlatma değildir,
 * sayfa prod'da 404 dönmelidir. Bozuk bölüm `id`'si, uyumsuz tablo satırı ve
 * kırık iç bağlantı ise metni yanlışlamaz; okunabilirliği düşürür. Onlar
 * yalnız geliştirmede yüzeye çıkar ve testte kırılır.
 */
export type LegalDocumentStatus = {
  /** Yayını engelleyen bulgular (yalnızca doldurulmamış alanlar). */
  blocking: string[];
  /** Yayını engellemeyen, dev'de gösterilen bulgular. */
  warnings: string[];
  /** `blocking.length > 0` — kapının yüklem hâli. */
  blocked: boolean;
};

/**
 * Kapının saf karar mantığı. Render katmanı bunun üstünde ince bir uyarlayıcı
 * olmalı: `blocked && PROD` → 404, aksi hâlde `[...blocking, ...warnings]`
 * dev kutusuna gider.
 *
 * `registry` verilmezse yalnız bu belge çözümlenir; belgeler arası
 * (`/gizlilik#bolum`) bağlantıların doğrulanması için tüm kayıt geçilmelidir.
 * Taranan bağlantılar her hâlükârda yalnız bu belgeninkilerdir.
 */
export function classifyLegalDocument(
  doc: LegalDocumentMeta,
  sections: readonly LegalSection[],
  registry: LegalSectionRegistry = {},
): LegalDocumentStatus {
  const resolved: LegalSectionRegistry = { ...registry, [doc.id]: sections };
  const placeholders = findLegalPlaceholders(
    sections,
    collectLegalMetaStrings(doc),
  );

  return {
    blocking: placeholders.map((hit) => `Doldurulmamış alan: ${hit}`),
    warnings: [
      ...findLegalSectionIssues(sections),
      ...findBrokenLegalLinks(resolved, { documents: [doc.id] }),
    ],
    blocked: placeholders.length > 0,
  };
}
