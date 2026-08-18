// Onboarding listelerinin bileşen tarafı: aktif dile göre hazır diziler.
//
// Listeler `content/onboarding`'de saf fonksiyonlar olarak duruyor (sunucu da
// kullanabilsin diye); bileşenler dili tekrar tekrar taşımasın diye burada
// hooka sarılır.

import type { SocialPlatform } from "@caka/shared";

import {
  discoveryOptions,
  onboardingPlatforms,
  onboardingPurposes,
  onboardingTemplates,
  platformById,
  type OnboardingPlatform,
} from "~/content/onboarding";
import { useLocale } from "~/lib/locale";

export function useOnboardingLists() {
  const locale = useLocale();
  return {
    platforms: onboardingPlatforms(locale),
    purposes: onboardingPurposes(locale),
    discovery: discoveryOptions(locale),
    templates: onboardingTemplates(locale),
    byId: (id: SocialPlatform): OnboardingPlatform => platformById(locale, id),
  };
}
