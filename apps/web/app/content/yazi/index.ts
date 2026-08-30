// Public yazı sayfasının metin kataloğu (Değişmez #5): Türkçe kanoniktir ve
// tipi verir; diğer dört dil `satisfies YaziContent` ile aynı sözleşmeye
// bağlanır — bir anahtar eksik kalırsa `pnpm typecheck` kırılır.
//
// Yazı GÖVDESİ bu katalogdan geçmez (R15): gövde sahibin yazdığı dildedir;
// burada yalnız sayfanın çerçeve metinleri (tarih, dönüş bağlantısı, taslak
// notu, yalın 404) yaşar.

import type { Locale } from "@caka/shared";

import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { ptBR } from "./pt-BR";
import { tr } from "./tr";

export { parseDayKey } from "./tr";

export type YaziContent = typeof tr;

export const yaziCatalog: Record<Locale, YaziContent> = {
  tr,
  en,
  es,
  "pt-BR": ptBR,
  de,
};
