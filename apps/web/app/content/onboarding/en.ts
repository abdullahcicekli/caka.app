import type { SocialPlatform } from "@caka/shared";

import type { OnboardingContent } from "./index";


export const en = {
  /** Marka adları çevrilmez; yalnız "web sitesi" ve "e-posta" ile yer tutucular. */
  platforms: {
    nsosyal: { label: "Nsosyal", placeholder: "username" },
    instagram: { label: "Instagram", placeholder: "@username" },
    x: { label: "X", placeholder: "@username" },
    tiktok: { label: "TikTok", placeholder: "@username" },
    youtube: { label: "YouTube", placeholder: "@channel" },
    linkedin: { label: "LinkedIn", placeholder: "username" },
    facebook: { label: "Facebook", placeholder: "username" },
    twitch: { label: "Twitch", placeholder: "username" },
    dribbble: { label: "Dribbble", placeholder: "username" },
    github: { label: "GitHub", placeholder: "username" },
    threads: { label: "Threads", placeholder: "@username" },
    website: { label: "Website", placeholder: "https://site.com" },
    email: { label: "Email", placeholder: "hello@site.com" },
  } satisfies Record<SocialPlatform, { label: string; placeholder: string }>,

  purposes: {
    links: "Gather my links in one place",
    projects: "Show my work and projects",
    meetings: "Get booked for meetings",
    newsletter: "Grow an email list",
    sales: "Sell products",
    followers: "Gain followers",
  },

  discovery: {
    search: "Search engine",
    ai: "AI tools",
    profile: "Saw it on someone's profile",
    friend: "A friend recommended it",
    "t3-foundation": "T3 Foundation",
    other: "Other",
  },

  /** Tema adları — ürünün kendi adlandırması, marka gibi davranır ama çevrilir. */
  templates: {
    gece: "Night",
    sade: "Plain",
    lavanta: "Lavender",
    ufuk: "Horizon",
    neon: "Neon",
    zumrut: "Emerald",
  } as Record<string, string>,
} satisfies OnboardingContent;
