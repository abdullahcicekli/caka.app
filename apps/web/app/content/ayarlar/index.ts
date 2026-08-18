// Ayarlar sayfasının kullanıcıya görünen tüm metni (Değişmez #5), dil boyutuyla.
//
// Adres bölümünün metni Değişmez #10'un birebir karşılığıdır: süreler
// `@caka/shared`'daki sabitlerden türetilir, böylece kural değişirse ekran
// metni sessizce yalan söylemez.

import type { Locale } from "@caka/shared";

import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { ptBR } from "./pt-BR";
import { tr } from "./tr";

export type AyarlarContent = typeof tr;

/** Ayarlar bölümleri — sayfa içi gezinme ve `<section id>` kaynağı. */
export const AYARLAR_SECTION_IDS = ["adres", "dil", "paylasim-gorseli", "hesap"] as const;

export type AyarlarSectionId = (typeof AYARLAR_SECTION_IDS)[number];

/**
 * Adres değişikliği sonucu için sunucudan dönebilecek hata kimlikleri.
 * `too_short`/`too_long`/`invalid_chars`/`reserved` ortak katalogdan gelir.
 */
export type AddressErrorId =
  | "too_short"
  | "too_long"
  | "invalid_chars"
  | "reserved"
  | "same"
  | "cooldown"
  | "taken"
  | "locked"
  | "no_profile"
  | "conflict"
  | "origin"
  | "unknown";

export const ayarlarCatalog: Record<Locale, AyarlarContent> = {
  tr,
  en,
  es,
  "pt-BR": ptBR,
  de,
};

/** Sağlayıcı kimliği → kullanıcıya gösterilen ad. Çevrilmez: marka adları. */
const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  apple: "Apple",
};

export function providerLabel(providerId: string): string {
  return PROVIDER_LABELS[providerId] ?? providerId;
}
