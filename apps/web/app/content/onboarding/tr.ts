import type { SocialPlatform } from "@caka/shared";


export const tr = {
  /** Marka adları çevrilmez; yalnız "web sitesi" ve "e-posta" ile yer tutucular. */
  platforms: {
    nsosyal: { label: "Nsosyal", placeholder: "kullaniciadi" },
    instagram: { label: "Instagram", placeholder: "@kullaniciadi" },
    x: { label: "X", placeholder: "@kullaniciadi" },
    tiktok: { label: "TikTok", placeholder: "@kullaniciadi" },
    youtube: { label: "YouTube", placeholder: "@kanal" },
    linkedin: { label: "LinkedIn", placeholder: "kullaniciadi" },
    facebook: { label: "Facebook", placeholder: "kullaniciadi" },
    twitch: { label: "Twitch", placeholder: "kullaniciadi" },
    dribbble: { label: "Dribbble", placeholder: "kullaniciadi" },
    github: { label: "GitHub", placeholder: "kullaniciadi" },
    threads: { label: "Threads", placeholder: "@kullaniciadi" },
    website: { label: "Web sitesi", placeholder: "https://site.com" },
    email: { label: "E-posta", placeholder: "merhaba@site.com" },
  } satisfies Record<SocialPlatform, { label: string; placeholder: string }>,

  purposes: {
    links: "Bağlantılarımı tek yerde toplamak",
    projects: "İşlerimi ve projelerimi göstermek",
    meetings: "Görüşme almak",
    newsletter: "E-posta listesi büyütmek",
    sales: "Ürün satmak",
    followers: "Takipçi kazanmak",
  },

  discovery: {
    search: "Arama motoru",
    ai: "Yapay zekâ araçları",
    profile: "Birinin profilinde gördüm",
    friend: "Arkadaşım önerdi",
    "t3-foundation": "T3 Vakfı",
    other: "Diğer",
  },

  /** Tema adları — ürünün kendi adlandırması, marka gibi davranır ama çevrilir. */
  templates: {
    gece: "Gece",
    sade: "Sade",
    lavanta: "Lavanta",
    ufuk: "Ufuk",
    neon: "Neon",
    zumrut: "Zümrüt",
  } as Record<string, string>,
};
