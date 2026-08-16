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

export interface FooterColumn {
  title: string;
  links: readonly Cta[];
}

export interface SocialLink {
  platform: "github" | "x" | "instagram";
  href: string;
  label: string;
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
  closingCta: {
    title: "İnternetteki kendi\nköşeni bugün aç",
    claim: {
      domain: "caka.app/",
      placeholder: "adin",
      cta: "Ücretsiz başla",
      action: "/onboarding",
    },
  },
  footer: {
    columns: [
      {
        title: "Ürün",
        links: [
          { label: "Nasıl çalışır", href: "#urun" },
          { label: "Şablonlar", href: "#sablonlar" },
          { label: "Örnekler", href: "#ornekler" },
          { label: "Fiyat", href: "#fiyat" },
        ],
      },
      {
        title: "Kaynaklar",
        links: [
          { label: "SSS", href: "#sss" },
          { label: "Destek", href: "mailto:destek@caka.app" },
          { label: "Blog", href: "#blog" },
        ],
      },
      {
        title: "Şirket",
        links: [
          { label: "Hakkımızda", href: "#hakkimizda" },
          { label: "İletişim", href: "mailto:merhaba@caka.app" },
          { label: "Kariyer", href: "#kariyer" },
        ],
      },
      {
        title: "Yasal",
        links: [
          { label: "Gizlilik", href: "#gizlilik" },
          { label: "Kullanım Şartları", href: "#kosullar" },
          { label: "Çerezler", href: "#cerezler" },
        ],
      },
    ] satisfies FooterColumn[],
    social: [
      { platform: "github", href: "https://github.com/caka-app", label: "GitHub" },
      { platform: "x", href: "https://x.com/cakaapp", label: "X" },
      {
        platform: "instagram",
        href: "https://instagram.com/caka.app",
        label: "Instagram",
      },
    ] satisfies SocialLink[],
    copyright: `© ${new Date().getFullYear()}`,
  },
} as const;

export type LandingContent = typeof landing;
