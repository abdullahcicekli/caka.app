// Galeri, YouTube ve Spotify widget'larının kullanıcıya görünen metinleri
// (Değişmez #5), dil boyutuyla.

import type { Locale } from "@caka/shared";

import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { ptBR } from "./pt-BR";
import { tr } from "./tr";

export type WidgetContent = typeof tr;

export const widgetCatalog: Record<Locale, WidgetContent> = {
  tr,
  en,
  es,
  "pt-BR": ptBR,
  de,
};
