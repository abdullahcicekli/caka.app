// U17 bu dosyayı doldurur (KVKK m.10 + Aydınlatma Tebliği m.5 unsurları).
// Şimdilik tek bir yer tutucu bölüm var; köşeli parantezli işaret R33
// kapısını gerçekten tetikler, yani belge prod'da 404 döner ve yarım metin
// ziyaretçiye görünmez.
import type { LegalSection } from "@caka/shared";

export const gizlilikSections: LegalSection[] = [
  {
    id: "hazirlaniyor",
    heading: "Metin hazırlanıyor",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Aydınlatma ve gizlilik metninin gövdesi henüz yazılmadı: ",
          "[AYDINLATMA METNİ GÖVDESİ]",
          ".",
        ],
      },
    ],
  },
];
