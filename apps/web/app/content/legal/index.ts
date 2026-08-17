// R33 — hukuki içerik modüllerinin ortak kapısı.
//
// İki soruyu tek yerde cevaplar:
//
//  1. **"Belgeler arası bağlantı çözülüyor mu?"** — `LEGAL_SECTION_REGISTRY`
//     üç belgenin bölümlerini bir arada tutar. `/gizlilik#ilgili-kisi-haklari`
//     gibi bir hedef ancak tüm kayıt elde olduğunda doğrulanabilir; tek belge
//     kaydedilirse doğrulama sessizce atlanır.
//
//  2. **"Hangi belge yayında?"** — `PUBLISHED_LEGAL_DOCUMENT_IDS`. Footer'ın
//     "Yasal" sütunu, SSS cevabındaki bağlantı, belgeler arası şerit ve
//     `sitemaps/core.xml` yalnız bu listeyi reklam eder. Kapının 404 verdiği
//     bir belgeyi hiçbir yüzey vaat etmez; hukukçu `[...]` alanlarını
//     doldurduğunda üçü de kendiliğinden geri gelir, kod değişmez.
//
// "Yayında" tanımı kapının `blocking` tanımıyla birebir aynı olmalı: bölüm
// metinleri **ve** künye taranır (`collectLegalMetaStrings`), tam olarak
// `classifyLegalDocument`'ın engelleyici saydığı şey. İki tanım ayrışırsa ya
// 404'e bağlantı verilir ya da yayındaki belge saklanır.
//
// DİKKAT: bu modül üç belgenin tam metnini içeri alır. Yalnız sunucu tarafı
// (loader, worker) tüketmelidir; bileşenler yayın listesini `loaderData`
// üzerinden alır. Doğrudan bir bileşenden import edilirse ~90 KB hukuki metin
// istemci paketine düşer.
import {
  LEGAL_DOCUMENTS,
  LEGAL_DOCUMENT_IDS,
  collectLegalMetaStrings,
  hasLegalPlaceholder,
  type LegalDocumentId,
  type LegalDocumentMeta,
  type LegalSection,
} from "@caka/shared";

import { cerezPolitikasiSections } from "./cerez-politikasi";
import { gizlilikSections } from "./gizlilik";
import { kullanimKosullariSections } from "./kullanim-kosullari";

/** Üç belgenin bölümleri; bağlantı doğrulaması bunun tamamını ister. */
export const LEGAL_SECTION_REGISTRY: Record<
  LegalDocumentId,
  readonly LegalSection[]
> = {
  gizlilik: gizlilikSections,
  "kullanim-kosullari": kullanimKosullariSections,
  "cerez-politikasi": cerezPolitikasiSections,
};

/** Belge yayına hazır mı: doldurulmamış alanı kalmamış mı. */
export function isLegalDocumentPublished(id: LegalDocumentId): boolean {
  const doc = LEGAL_DOCUMENTS[id];
  return !hasLegalPlaceholder(
    LEGAL_SECTION_REGISTRY[id],
    collectLegalMetaStrings(doc),
  );
}

/** Yayındaki belge kimlikleri — yüzeylerin reklam edebileceği tek liste. */
export const PUBLISHED_LEGAL_DOCUMENT_IDS: readonly LegalDocumentId[] =
  LEGAL_DOCUMENT_IDS.filter(isLegalDocumentPublished);

/** Yayındaki belgelerin künyeleri (sitemap ve gezinme etiketleri için). */
export const PUBLISHED_LEGAL_DOCUMENTS: readonly LegalDocumentMeta[] =
  PUBLISHED_LEGAL_DOCUMENT_IDS.map((id) => LEGAL_DOCUMENTS[id]);
