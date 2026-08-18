import type { SocialPlatform } from "@caka/shared";

import type { OnboardingContent } from "./index";


export const es = {
  /** Marka adları çevrilmez; yalnız "web sitesi" ve "e-posta" ile yer tutucular. */
  platforms: {
    nsosyal: { label: "Nsosyal", placeholder: "nombreusuario" },
    instagram: { label: "Instagram", placeholder: "@nombreusuario" },
    x: { label: "X", placeholder: "@nombreusuario" },
    tiktok: { label: "TikTok", placeholder: "@nombreusuario" },
    youtube: { label: "YouTube", placeholder: "@canal" },
    linkedin: { label: "LinkedIn", placeholder: "nombreusuario" },
    facebook: { label: "Facebook", placeholder: "nombreusuario" },
    twitch: { label: "Twitch", placeholder: "nombreusuario" },
    dribbble: { label: "Dribbble", placeholder: "nombreusuario" },
    github: { label: "GitHub", placeholder: "nombreusuario" },
    threads: { label: "Threads", placeholder: "@nombreusuario" },
    website: { label: "Sitio web", placeholder: "https://site.com" },
    email: { label: "Correo electrónico", placeholder: "hola@site.com" },
  } satisfies Record<SocialPlatform, { label: string; placeholder: string }>,

  purposes: {
    links: "Reunir mis enlaces en un solo sitio",
    projects: "Mostrar mi trabajo y mis proyectos",
    meetings: "Que me reserven reuniones",
    newsletter: "Hacer crecer una lista de correo",
    sales: "Vender productos",
    followers: "Ganar seguidores",
  },

  discovery: {
    search: "Motor de búsqueda",
    ai: "Herramientas de IA",
    profile: "Lo vi en el perfil de alguien",
    friend: "Me lo recomendó un amigo",
    "t3-foundation": "Fundación T3",
    other: "Otro",
  },

  /** Tema adları — ürünün kendi adlandırması, marka gibi davranır ama çevrilir. */
  templates: {
    gece: "Noche",
    sade: "Sobrio",
    lavanta: "Lavanda",
    ufuk: "Horizonte",
    neon: "Neon",
    zumrut: "Esmeralda",
  } as Record<string, string>,
} satisfies OnboardingContent;
