import type { ProfileTheme, SocialPlatform } from "@caka/shared";

export const onboardingPlatforms: {
  id: SocialPlatform;
  label: string;
  tone: string;
  placeholder: string;
}[] = [
  { id: "instagram", label: "Instagram", tone: "platform-instagram", placeholder: "@kullaniciadi" },
  { id: "x", label: "X", tone: "platform-x", placeholder: "@kullaniciadi" },
  { id: "tiktok", label: "TikTok", tone: "platform-tiktok", placeholder: "@kullaniciadi" },
  { id: "youtube", label: "YouTube", tone: "platform-youtube", placeholder: "@kanal" },
  { id: "linkedin", label: "LinkedIn", tone: "platform-linkedin", placeholder: "kullaniciadi" },
  { id: "facebook", label: "Facebook", tone: "platform-facebook", placeholder: "kullaniciadi" },
  { id: "twitch", label: "Twitch", tone: "platform-twitch", placeholder: "kullaniciadi" },
  { id: "dribbble", label: "Dribbble", tone: "platform-dribbble", placeholder: "kullaniciadi" },
  { id: "github", label: "GitHub", tone: "platform-github", placeholder: "kullaniciadi" },
  { id: "threads", label: "Threads", tone: "platform-threads", placeholder: "@kullaniciadi" },
  { id: "website", label: "Web sitesi", tone: "platform-website", placeholder: "https://site.com" },
  { id: "email", label: "E-posta", tone: "platform-email", placeholder: "merhaba@site.com" },
];

export const onboardingPurposes = [
  { id: "links", label: "Bağlantılarımı tek yerde toplamak", icon: "link" },
  { id: "projects", label: "İşlerimi ve projelerimi göstermek", icon: "image" },
  { id: "meetings", label: "Görüşme almak", icon: "calendar" },
  { id: "newsletter", label: "E-posta listesi büyütmek", icon: "mail" },
  { id: "sales", label: "Ürün satmak", icon: "store" },
  { id: "followers", label: "Takipçi kazanmak", icon: "trend" },
] as const;

export const discoveryOptions = [
  { id: "search", label: "Arama motoru", icon: "search" },
  { id: "ai", label: "Yapay zekâ araçları", icon: "sparkles" },
  { id: "profile", label: "Birinin profilinde gördüm", icon: "at" },
  { id: "friend", label: "Arkadaşım önerdi", icon: "users" },
  { id: "t3-foundation", label: "T3 Vakfı", icon: "rocket" },
  { id: "other", label: "Diğer", icon: "more" },
] as const;

export const onboardingTemplates: {
  id: string;
  label: string;
  theme: ProfileTheme;
  className: string;
}[] = [
  { id: "gece", label: "Gece", theme: "dark", className: "template-dark" },
  { id: "sade", label: "Sade", theme: "light", className: "template-light" },
  { id: "orman", label: "Orman", theme: "forest", className: "template-forest" },
  { id: "pudra", label: "Pudra", theme: "rose", className: "template-rose" },
];

export function platformById(id: SocialPlatform) {
  return onboardingPlatforms.find((platform) => platform.id === id)!;
}
