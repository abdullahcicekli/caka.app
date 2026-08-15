import creatorElif from "~/assets/landing/creator-elif.webp";
import creatorKerem from "~/assets/landing/creator-kerem.webp";
import creatorNaz from "~/assets/landing/creator-naz.webp";
import creatorSelin from "~/assets/landing/creator-selin.webp";

/**
 * Landing içeriğinin tek kaynağı. Metin, link, görsel ve bölüm verisi burada
 * değişir; bileşenler yalnızca bu tipleri tüketir (içerik/görünüm ayrımı).
 */

export interface NavItem {
  label: string;
  href: string;
}

export interface Cta {
  label: string;
  href: string;
}

/** Hero'daki akan vitrin kartı. */
export interface MarqueeItem {
  image: string;
  caption: string;
}

export const landing = {
  nav: {
    items: [
      { label: "Ürün", href: "#urun" },
      { label: "Şablonlar", href: "#sablonlar" },
      { label: "Örnekler", href: "#ornekler" },
      { label: "Fiyat", href: "#fiyat" },
    ] satisfies NavItem[],
    login: { label: "Giriş yap", href: "/login" } satisfies Cta,
    cta: { label: "Ücretsiz başla", href: "/onboarding" } satisfies Cta,
  },
  hero: {
    title: "Sana göre\nbir bio linki.",
    body: "Instagram, TikTok, YouTube ve diğer profillerindeki tek link; paylaştığın, ürettiğin ve sattığın her şeyi bir araya getirsin.",
    claim: {
      domain: "caka.app/",
      placeholder: "adin",
      cta: "Ücretsiz başla",
      action: "/onboarding",
    },
    marquee: {
      durationSeconds: 30,
      items: [
        { image: creatorKerem, caption: "Kerem Aydın · Müzisyen" },
        { image: creatorSelin, caption: "Selin Duru · Seramik atölyesi" },
        { image: creatorElif, caption: "Elif Şahin · Podcast sunucusu" },
        { image: creatorNaz, caption: "Naz Erdem · Yayıncı" },
      ] satisfies MarqueeItem[],
    },
  },
  minutes: {
    title: "Caka sayfanı\ndakikalar içinde kur",
    body: "Sosyal hesaplarını, sitelerini, projelerini ve mağazanı tek bağlantıda topla. Her detayı kendin ayarla ya da hazır temayla başla.",
    cta: { label: "Ücretsiz başla", href: "/onboarding" } satisfies Cta,
  },
} as const;

export type LandingContent = typeof landing;
