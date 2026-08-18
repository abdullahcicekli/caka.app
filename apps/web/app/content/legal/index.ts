// R33 — hukuki içerik modüllerinin ortak kapısı, artık dil boyutuyla (L12).
//
// Üç soruyu tek yerde cevaplar:
//
//  1. **"Belgeler arası bağlantı çözülüyor mu?"** — `legalSectionRegistry`
//     bir dilin üç belgesini bir arada tutar. `/gizlilik#ilgili-kisi-haklari`
//     gibi bir hedef ancak tüm kayıt elde olduğunda doğrulanabilir.
//
//  2. **"Hangi belge, hangi dilde yayında?"** — kapı dil başına çalışır.
//     Türkçe belge yayındayken İngilizcesi eksikse yalnız İngilizce sürüm
//     404 verir; Türkçe sayfa etkilenmez. Böylece çeviri yarım kalmış bir
//     belge yayını bloklamaz ama yarım hâliyle de yayına çıkmaz.
//
//  3. **"Metin hangi dilde yazıldı?"** — hukuki metinler yalnız Türkçe ve
//     İngilizce yazılır (LKD6). `es`/`pt-BR`/`de` İngilizce metni görür ve
//     sayfada bağlayıcı sürümün Türkçe olduğunu söyleyen şerit çıkar.
//
// "Yayında" tanımı kapının `blocking` tanımıyla birebir aynı olmalı: bölüm
// metinleri **ve** künye taranır (`collectLegalMetaStrings`), tam olarak
// `classifyLegalDocument`'ın engelleyici saydığı şey.
//
// DİKKAT: bu modül belgelerin tam metnini içeri alır. Yalnız sunucu tarafı
// (loader, worker) tüketmelidir; bileşenler yayın listesini `loaderData`
// üzerinden alır. Doğrudan bir bileşenden import edilirse ~90 KB hukuki metin
// istemci paketine düşer (L13).
import {
  LEGAL_DOCUMENTS,
  LEGAL_DOCUMENT_IDS,
  type Locale,
  collectLegalMetaStrings,
  hasLegalPlaceholder,
  type LegalDocumentId,
  type LegalSection,
} from "@caka/shared";

import { cerezPolitikasiSectionsEn } from "./en/cerez-politikasi";
import { gizlilikSectionsEn } from "./en/gizlilik";
import { kullanimKosullariSectionsEn } from "./en/kullanim-kosullari";
import { legalTextLocale, legalTitles } from "./meta";
import { cerezPolitikasiSections } from "./tr/cerez-politikasi";
import { gizlilikSections } from "./tr/gizlilik";
import { kullanimKosullariSections } from "./tr/kullanim-kosullari";

type SectionRegistry = Record<LegalDocumentId, readonly LegalSection[]>;

/** Metnin gerçekten yazıldığı iki dil. */
const REGISTRY: Record<"tr" | "en", SectionRegistry> = {
  tr: {
    gizlilik: gizlilikSections,
    "kullanim-kosullari": kullanimKosullariSections,
    "cerez-politikasi": cerezPolitikasiSections,
  },
  en: {
    gizlilik: gizlilikSectionsEn,
    "kullanim-kosullari": kullanimKosullariSectionsEn,
    "cerez-politikasi": cerezPolitikasiSectionsEn,
  },
};

/** Bir dilin üç belgesi; bağlantı doğrulaması bunun tamamını ister. */
export function legalSectionRegistry(locale: Locale): SectionRegistry {
  return REGISTRY[legalTextLocale(locale)];
}

export function legalSections(locale: Locale, id: LegalDocumentId): readonly LegalSection[] {
  return legalSectionRegistry(locale)[id];
}

/**
 * Belge o dilde yayına hazır mı: bölümleri var ve doldurulmamış alanı kalmamış.
 *
 * Bölüm dizisi boşsa belge o dilde henüz YAZILMAMIŞTIR ve yayında sayılmaz —
 * boş bir sayfa göstermek, 404'ten daha kötü bir vaattir.
 */
export function isLegalDocumentPublished(locale: Locale, id: LegalDocumentId): boolean {
  const sections = legalSections(locale, id);
  if (sections.length === 0) return false;

  const titles = legalTitles(locale, id);
  return !hasLegalPlaceholder(sections, [
    ...collectLegalMetaStrings(LEGAL_DOCUMENTS[id]),
    titles.title,
    titles.navLabel,
  ]);
}

/** O dilde yayındaki belge kimlikleri — yüzeylerin reklam edebileceği tek liste. */
export function publishedLegalDocumentIds(locale: Locale): readonly LegalDocumentId[] {
  return LEGAL_DOCUMENT_IDS.filter((id) => isLegalDocumentPublished(locale, id));
}
