// Onboarding listelerinin çevrilmeyen kısmı: platform sırası ve renk tonları.
// Etiket ve yer tutucu metinleri dil dosyalarında.

import type { ProfileTheme, SocialPlatform } from "@caka/shared";

export const PLATFORM_ORDER: { id: SocialPlatform; tone: string }[] = [
  { id: "nsosyal", tone: "platform-nsosyal" },
  { id: "instagram", tone: "platform-instagram" },
  { id: "x", tone: "platform-x" },
  { id: "tiktok", tone: "platform-tiktok" },
  { id: "youtube", tone: "platform-youtube" },
  { id: "linkedin", tone: "platform-linkedin" },
  { id: "facebook", tone: "platform-facebook" },
  { id: "twitch", tone: "platform-twitch" },
  { id: "dribbble", tone: "platform-dribbble" },
  { id: "github", tone: "platform-github" },
  { id: "threads", tone: "platform-threads" },
  { id: "website", tone: "platform-website" },
  { id: "email", tone: "platform-email" },
];

export const PURPOSE_IDS = [
  "links",
  "projects",
  "meetings",
  "newsletter",
  "sales",
  "followers",
] as const;
export type PurposeId = (typeof PURPOSE_IDS)[number];

export const PURPOSE_ICONS: Record<PurposeId, string> = {
  links: "link",
  projects: "image",
  meetings: "calendar",
  newsletter: "mail",
  sales: "store",
  followers: "trend",
};

export const DISCOVERY_IDS = [
  "search",
  "ai",
  "profile",
  "friend",
  "t3-foundation",
  "other",
] as const;
export type DiscoveryId = (typeof DISCOVERY_IDS)[number];

export const DISCOVERY_ICONS: Record<DiscoveryId, string> = {
  search: "search",
  ai: "sparkles",
  profile: "at",
  friend: "users",
  "t3-foundation": "rocket",
  other: "more",
};

/** Tema kimlikleri ve sınıfları; adları dil dosyalarında. */
export const TEMPLATE_ORDER: { id: string; theme: ProfileTheme; className: string }[] = [
  { id: "gece", theme: "dark", className: "template-dark" },
  { id: "sade", theme: "light", className: "template-light" },
  { id: "lavanta", theme: "lavanta", className: "template-lavanta" },
  { id: "ufuk", theme: "ufuk", className: "template-ufuk" },
  { id: "neon", theme: "neon", className: "template-neon" },
  { id: "zumrut", theme: "zumrut", className: "template-zumrut" },
];
