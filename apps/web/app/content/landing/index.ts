// Landing içeriğinin tek kaynağı (Değişmez #5) — artık dil boyutuyla.
//
// Tip sözleşmesi Türkçe dosyadan türetilir: `tr.ts`'te `as const` YOKTUR, bu
// yüzden alanlar `string`e genişler ve diğer dört dosya `satisfies
// LandingContent` diyebilir. Bir anahtar eklenip bir dile eklenmezse
// `pnpm typecheck` kırılır (L10) — eksik çeviri prod'a sızmaz.

import type { Locale } from "@caka/shared";

import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { ptBR } from "./pt-BR";
import { tr } from "./tr";

export type LandingContent = typeof tr;

export type Cta = LandingContent["nav"]["login"];

/** Hukuki bir belgeye giden bağlantı. `legalDocument` doluysa bağlantı yalnız
 * o belge yayındayken gösterilir: kapı (R33) doldurulmamış `[...]` alanı olan
 * belgeyi prod'da 404'ler, onu reklam eden yüzey de susmalıdır. Yayın listesi
 * `loaderData` ile gelir (bkz. `app/content/legal/index.ts`). */
export type LegalAwareLink = LandingContent["footer"]["trust"][number];

export type TrustItem = LegalAwareLink;
export type FooterColumn = LandingContent["footer"]["columns"][number];
export type FaqItem = LandingContent["faq"]["items"][number];
export type FaqSection = LandingContent["faq"];
export type ShareSection = LandingContent["share"];
export type AudienceSection = LandingContent["audience"];

export type { MarqueeItem, SocialLink } from "./shared";

export const landingCatalog: Record<Locale, LandingContent> = {
  tr,
  en,
  es,
  "pt-BR": ptBR,
  de,
};
