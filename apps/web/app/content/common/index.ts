// Birden fazla modülün paylaştığı arayüz metinleri.
//
// Adres doğrulama hataları hem onboarding'de hem ayarlarda görünüyor; iki
// katalogda ayrı ayrı durursa zamanla ayrışırlar.

import type { Locale } from "@caka/shared";

import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { ptBR } from "./pt-BR";
import { tr } from "./tr";

export type CommonContent = typeof tr;

export const commonCatalog: Record<Locale, CommonContent> = {
  tr,
  en,
  es,
  "pt-BR": ptBR,
  de,
};
