// Ayarlar → Dil (L17). Seçim `caka_dil` çerezine yazılır ve sayfa aynı
// içeriğin yeni dildeki adresine gider.

import { LocaleSelect } from "~/components/locale-select";
import { ayarlarCatalog } from "~/content/ayarlar";
import { useCatalog } from "~/lib/locale";

export function LanguageCard() {
  const copy = useCatalog(ayarlarCatalog).language;

  return (
    <section id="dil" className="ayarlar-card">
      <h2>{copy.title}</h2>
      <p className="ayarlar-hint">{copy.hint}</p>

      <label className="ayarlar-field-label" htmlFor="ayarlar-dil">
        {copy.fieldLabel}
      </label>
      <LocaleSelect id="ayarlar-dil" label={copy.fieldLabel} className="ayarlar-select" />

      <p className="ayarlar-hint">{copy.note}</p>
    </section>
  );
}
