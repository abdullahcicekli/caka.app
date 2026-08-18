// Onboarding listelerinin tek kaynağı (Değişmez #5), dil boyutuyla.
//
// Sıra, ton ve ikon gibi çevrilmeyen alanlar `shared.ts`'te; etiketler dil
// dosyalarında. Listeler burada birleştirilir, böylece yeni bir platform
// eklendiğinde sıra tek yerde değişir.

import type { Locale, SocialPlatform } from "@caka/shared";

import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { ptBR } from "./pt-BR";
import {
  DISCOVERY_ICONS,
  DISCOVERY_IDS,
  PLATFORM_ORDER,
  PURPOSE_ICONS,
  PURPOSE_IDS,
  TEMPLATE_ORDER,
} from "./shared";
import { tr } from "./tr";

export type OnboardingContent = typeof tr;

export const onboardingCatalog: Record<Locale, OnboardingContent> = {
  tr,
  en,
  es,
  "pt-BR": ptBR,
  de,
};

export type OnboardingPlatform = {
  id: SocialPlatform;
  tone: string;
  label: string;
  placeholder: string;
};

export function onboardingPlatforms(locale: Locale): OnboardingPlatform[] {
  const labels = onboardingCatalog[locale].platforms;
  return PLATFORM_ORDER.map((platform) => ({ ...platform, ...labels[platform.id] }));
}

export function platformById(locale: Locale, id: SocialPlatform): OnboardingPlatform {
  return onboardingPlatforms(locale).find((platform) => platform.id === id)!;
}

export function onboardingPurposes(locale: Locale) {
  const labels = onboardingCatalog[locale].purposes;
  return PURPOSE_IDS.map((id) => ({ id, label: labels[id], icon: PURPOSE_ICONS[id] }));
}

export function discoveryOptions(locale: Locale) {
  const labels = onboardingCatalog[locale].discovery;
  return DISCOVERY_IDS.map((id) => ({ id, label: labels[id], icon: DISCOVERY_ICONS[id] }));
}

export function onboardingTemplates(locale: Locale) {
  const labels = onboardingCatalog[locale].templates;
  return TEMPLATE_ORDER.map((template) => ({ ...template, label: labels[template.id] ?? template.id }));
}

export type { DiscoveryId, PurposeId } from "./shared";
