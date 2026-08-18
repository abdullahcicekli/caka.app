import type { SocialPlatform } from "@caka/shared";

import type { OnboardingContent } from "./index";


export const ptBR = {
  /** Marka adları çevrilmez; yalnız "web sitesi" ve "e-posta" ile yer tutucular. */
  platforms: {
    nsosyal: { label: "Nsosyal", placeholder: "nomedeusuario" },
    instagram: { label: "Instagram", placeholder: "@nomedeusuario" },
    x: { label: "X", placeholder: "@nomedeusuario" },
    tiktok: { label: "TikTok", placeholder: "@nomedeusuario" },
    youtube: { label: "YouTube", placeholder: "@canal" },
    linkedin: { label: "LinkedIn", placeholder: "nomedeusuario" },
    facebook: { label: "Facebook", placeholder: "nomedeusuario" },
    twitch: { label: "Twitch", placeholder: "nomedeusuario" },
    dribbble: { label: "Dribbble", placeholder: "nomedeusuario" },
    github: { label: "GitHub", placeholder: "nomedeusuario" },
    threads: { label: "Threads", placeholder: "@nomedeusuario" },
    website: { label: "Site", placeholder: "https://site.com" },
    email: { label: "E-mail", placeholder: "ola@site.com" },
  } satisfies Record<SocialPlatform, { label: string; placeholder: string }>,

  purposes: {
    links: "Reunir meus links em um só lugar",
    projects: "Mostrar meus trabalhos e projetos",
    meetings: "Receber agendamentos de reunião",
    newsletter: "Aumentar uma lista de e-mails",
    sales: "Vender produtos",
    followers: "Ganhar seguidores",
  },

  discovery: {
    search: "Mecanismo de busca",
    ai: "Ferramentas de IA",
    profile: "Vi no perfil de alguém",
    friend: "Um amigo indicou",
    "t3-foundation": "Fundação T3",
    other: "Outro",
  },

  /** Tema adları — ürünün kendi adlandırması, marka gibi davranır ama çevrilir. */
  templates: {
    gece: "Noite",
    sade: "Simples",
    lavanta: "Lavanda",
    ufuk: "Horizonte",
    neon: "Neon",
    zumrut: "Esmeralda",
  } as Record<string, string>,
} satisfies OnboardingContent;
