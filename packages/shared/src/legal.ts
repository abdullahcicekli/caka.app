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
    version: "0.1",
    updatedAt: "2026-08-17",
  },
  "kullanim-kosullari": {
    id: "kullanim-kosullari",
    path: "/kullanim-kosullari",
    title: "Kullanım Koşulları",
    navLabel: "Kullanım Koşulları",
    version: "0.1",
    updatedAt: "2026-08-17",
  },
  "cerez-politikasi": {
    id: "cerez-politikasi",
    path: "/cerez-politikasi",
    title: "Çerez Politikası",
    navLabel: "Çerez Politikası",
    version: "0.1",
    updatedAt: "2026-08-17",
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
): boolean {
  return findLegalPlaceholders(sections).length > 0;
}

/** Belgede kalan tüm doldurulmamış alanlar; tekilleştirilmiş. */
export function findLegalPlaceholders(
  sections: readonly LegalSection[],
): string[] {
  const found = new Set<string>();
  for (const value of collectLegalStrings(sections)) {
    for (const hit of findPlaceholdersInText(value)) found.add(hit);
  }
  return [...found];
}

/* ------------------------------------------------------------------ *
 * Bağlantı bütünlüğü
 * ------------------------------------------------------------------ */

/** Bağlantıda izin verilen protokoller (`rich-text.tsx` ile aynı allowlist). */
export function isSafeLegalHref(href: string): boolean {
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
 * Bölüm `id`'lerinin kendi içindeki sorunları: boş ya da tekrar eden `id`.
 * Kırık `#bolum-id` bağlantılarının sessizce oluşmasını engeller.
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
      continue;
    }
    if (seen.has(id)) issues.push(`Bölüm id'si tekrar ediyor: "${id}"`);
    seen.add(id);
  }
  return issues;
}

/**
 * Kırık iç bağlantıları bulur. Doğrulananlar:
 * - `#bolum-id` → aynı belgede o bölüm var mı
 * - `/gizlilik#bolum-id` → hedef belge kayıtlıysa o bölüm var mı
 * - `/bilinmeyen-hukuki-yol` → hukuki belge yolları arasında geçerli mi
 * - protokol allowlist'i (`javascript:` gibi hedefler kırık sayılır)
 *
 * Hukuki olmayan iç yollar (`/login` gibi) ve dış bağlantılar doğrulanamaz;
 * sessizce geçilir.
 */
export function findBrokenLegalLinks(registry: LegalSectionRegistry): string[] {
  const idsByDocument = new Map<LegalDocumentId, Set<string>>();
  for (const id of LEGAL_DOCUMENT_IDS) {
    const sections = registry[id];
    if (sections) {
      idsByDocument.set(id, new Set(sections.map((s) => s.id.trim())));
    }
  }

  const broken: string[] = [];
  for (const documentId of LEGAL_DOCUMENT_IDS) {
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

      if (rawPath !== "" && !targetId) continue; // hukuki olmayan iç yol
      if (!targetId) {
        broken.push(`${where}: hedef belge çözümlenemedi "${href}"`);
        continue;
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
