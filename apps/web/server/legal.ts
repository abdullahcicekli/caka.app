// R33 — hukuki belgelerin yayın kapısı. Yalnızca loader'dan çağrılır.
//
// Neden `app/components/legal-page.tsx`'te değil: kapı, belgeler arası
// bağlantıları doğrulayabilmek için üç belgenin tam metnini okur
// (`LEGAL_SECTION_REGISTRY`). Bileşen dosyasında dursaydı bu metin istemci
// paketine de düşerdi; kapı zaten sunucu tarafı bir karar.
//
// Karar mantığı burada değil: `classifyLegalDocument` (@caka/shared) saf
// sınıflandırmayı yapar, buradaki fonksiyon onun üstünde ince bir uyarlayıcıdır.
import {
  classifyLegalDocument,
  type LegalDocumentMeta,
  type LegalSection,
} from "@caka/shared";

import { LEGAL_SECTION_REGISTRY } from "../app/content/legal";

/**
 * Ortam ayrımı için deponun zaten kullandığı Vite sinyali kullanılır
 * (`root.tsx` `import.meta.env.DEV`, `workers/app.ts` `import.meta.env.MODE`);
 * ayrı bir env değişkeni icat edilmedi.
 *
 * - **Prod build**: doldurulmamış alan varsa yapılandırılmış log + 404.
 *   Uyarılar döndürülmez — dev kutusu ziyaretçiye asla çıkmaz.
 * - **Dev / lokal**: sayfa render edilir; engelleyici bulgular ve uyarılar
 *   birlikte döner, `LegalPage` bunları görünür bir kutuda gösterir.
 *
 * Bozuk bölüm `id`'si ve kırık iç bağlantı prod'u karartmaz (metin yine de
 * okunur); yalnız dev uyarısı olarak yüzeye çıkar ve testte kırılır.
 */
export function legalPlaceholderGate(
  doc: LegalDocumentMeta,
  sections: readonly LegalSection[],
): string[] {
  const status = classifyLegalDocument(doc, sections, LEGAL_SECTION_REGISTRY);

  if (import.meta.env.PROD) {
    if (status.blocked) {
      // Kapı sessiz kapanmasın: aksi hâlde 404'ü ilk gören ziyaretçi olur.
      console.error(
        JSON.stringify({
          message: "legal document blocked by placeholder gate",
          document: doc.id,
          blocking: status.blocking,
        }),
      );
      // Çıplak 404: gövdeli bir `data()` React Router'ın hidrasyon yüküne
      // yazılır ve "bu belge var ama yayınlanmamış" bilgisini kaynak koda
      // sızdırırdı. Gövdeyi tüketen bir yer de yok.
      throw new Response(null, { status: 404 });
    }
    return [];
  }

  return [...status.blocking, ...status.warnings];
}
