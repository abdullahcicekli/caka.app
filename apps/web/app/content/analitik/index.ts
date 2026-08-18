// Panel analitiği yüzeyinin metinleri (Değişmez #5), dil boyutuyla.
//
// Sayılar hakkında verilen her söz kodda gerçekten karşılığı olan sözdür:
// pencere 30 gündür, başlangıç tarihi kayıtlardan türetilir, tekil ziyaretçi
// iddiası yoktur. Çeviriler bu sözleri zayıflatmaz veya güçlendirmez.

import type { Locale } from "@caka/shared";

import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { ptBR } from "./pt-BR";
import { tr } from "./tr";

export type AnalitikContent = typeof tr;

export const analitikCatalog: Record<Locale, AnalitikContent> = {
  tr,
  en,
  es,
  "pt-BR": ptBR,
  de,
};

/** Adresin panelde gösterilen kısa hâli. Dilden bağımsız. */
export function kisaAdres(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}
