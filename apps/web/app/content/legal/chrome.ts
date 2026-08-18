// Hukuki sayfaların kabuk metinleri: künye satırı, tablo ipucu, belgeler arası
// şerit. Belge metninin kendisi değil, onu çevreleyen arayüz.
//
// Bu metinler beş dilde de var — hukuki metin İngilizceye düşse bile arayüz
// ziyaretçinin dilinde kalır (Almanca bir okuyucu "Son güncelleme" değil
// "Zuletzt aktualisiert" görür).

import type { Locale } from "@caka/shared";

export interface LegalChrome {
  updatedAt: string;
  version: string;
  otherDocuments: string;
  otherDocumentsLabel: string;
  tableScrollHint: string;
}

const CHROME: Record<Locale, LegalChrome> = {
  tr: {
    updatedAt: "Son güncelleme",
    version: "Sürüm",
    otherDocuments: "Diğer belgeler",
    otherDocumentsLabel: "Diğer hukuki belgeler",
    tableScrollHint: "Tabloyu yana kaydırarak tamamını görebilirsin.",
  },
  en: {
    updatedAt: "Last updated",
    version: "Version",
    otherDocuments: "Other documents",
    otherDocumentsLabel: "Other legal documents",
    tableScrollHint: "Scroll the table sideways to see all of it.",
  },
  es: {
    updatedAt: "Última actualización",
    version: "Versión",
    otherDocuments: "Otros documentos",
    otherDocumentsLabel: "Otros documentos legales",
    tableScrollHint: "Desliza la tabla hacia los lados para verla completa.",
  },
  "pt-BR": {
    updatedAt: "Última atualização",
    version: "Versão",
    otherDocuments: "Outros documentos",
    otherDocumentsLabel: "Outros documentos jurídicos",
    tableScrollHint: "Deslize a tabela para o lado para ver tudo.",
  },
  de: {
    updatedAt: "Zuletzt aktualisiert",
    version: "Version",
    otherDocuments: "Weitere Dokumente",
    otherDocumentsLabel: "Weitere rechtliche Dokumente",
    tableScrollHint: "Scroll die Tabelle zur Seite, um sie ganz zu sehen.",
  },
};

export const legalChromeCatalog: Record<Locale, LegalChrome> = CHROME;
