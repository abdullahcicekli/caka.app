// Yazı yönetimi yüzeyinin (liste + editör, U7) metin kataloğu (Değişmez #5):
// Türkçe kanoniktir ve tipi verir; diğer dört dil `satisfies YaziEditorContent`
// ile aynı sözleşmeye bağlanır — bir anahtar eksik kalırsa `pnpm typecheck`
// kırılır. Public yazı SAYFASININ metinleri ayrı katalogdadır (`content/yazi`);
// buradaki her şey yalnız sahibin gördüğü ekranlara aittir.

import type { Locale, PostSlugError } from "@caka/shared";

import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { ptBR } from "./pt-BR";
import { tr } from "./tr";

export type YaziEditorContent = typeof tr;

/**
 * Adres alanının durum kimlikleri: paylaşılan katmanın `PostSlugError`
 * kimlikleri + canlı denetimin iki sonucu. `slugStatus` kataloğunun
 * anahtarları bu tipe bağlıdır — sunucu yeni bir kimlik döndürmeye başlarsa
 * derleme kırılır, metin sessizce eksik kalmaz.
 */
export type SlugStatusId = PostSlugError | "checking" | "available" | "taken";

// Tip köprüsü: `slugStatus` anahtar kümesi SlugStatusId ile birebir aynı
// olmalı. (Fazla anahtar `satisfies`e, eksik anahtar bu satıra takılır.)
const _slugStatusKeys: Record<SlugStatusId, string> = tr.editor.slugStatus;
void _slugStatusKeys;

export const yaziEditorCatalog: Record<Locale, YaziEditorContent> = {
  tr,
  en,
  es,
  "pt-BR": ptBR,
  de,
};
