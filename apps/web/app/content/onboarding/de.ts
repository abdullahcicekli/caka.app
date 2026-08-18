import type { SocialPlatform } from "@caka/shared";

import type { OnboardingContent } from "./index";


export const de = {
  /** Marka adları çevrilmez; yalnız "web sitesi" ve "e-posta" ile yer tutucular. */
  platforms: {
    nsosyal: { label: "Nsosyal", placeholder: "benutzername" },
    instagram: { label: "Instagram", placeholder: "@benutzername" },
    x: { label: "X", placeholder: "@benutzername" },
    tiktok: { label: "TikTok", placeholder: "@benutzername" },
    youtube: { label: "YouTube", placeholder: "@kanal" },
    linkedin: { label: "LinkedIn", placeholder: "benutzername" },
    facebook: { label: "Facebook", placeholder: "benutzername" },
    twitch: { label: "Twitch", placeholder: "benutzername" },
    dribbble: { label: "Dribbble", placeholder: "benutzername" },
    github: { label: "GitHub", placeholder: "benutzername" },
    threads: { label: "Threads", placeholder: "@benutzername" },
    website: { label: "Website", placeholder: "https://site.com" },
    email: { label: "E-Mail", placeholder: "hallo@site.com" },
  } satisfies Record<SocialPlatform, { label: string; placeholder: string }>,

  purposes: {
    links: "Meine Links an einem Ort sammeln",
    projects: "Meine Arbeiten und Projekte zeigen",
    meetings: "Termine bekommen",
    newsletter: "Eine E-Mail-Liste aufbauen",
    sales: "Produkte verkaufen",
    followers: "Follower gewinnen",
  },

  discovery: {
    search: "Suchmaschine",
    ai: "KI-Tools",
    profile: "Auf dem Profil von jemandem gesehen",
    friend: "Von Freunden empfohlen",
    "t3-foundation": "T3-Stiftung",
    other: "Sonstiges",
  },

  /** Tema adları — ürünün kendi adlandırması, marka gibi davranır ama çevrilir. */
  templates: {
    gece: "Nacht",
    sade: "Schlicht",
    lavanta: "Lavendel",
    ufuk: "Horizont",
    neon: "Neon",
    zumrut: "Smaragd",
  } as Record<string, string>,
} satisfies OnboardingContent;
