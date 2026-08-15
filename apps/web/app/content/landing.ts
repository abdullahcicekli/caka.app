/**
 * Landing içeriğinin tek kaynağı. Metin, link ve bölüm verisi burada değişir;
 * bileşenler yalnızca bu tipleri tüketir (içerik/görünüm ayrımı).
 */

export interface NavItem {
  label: string;
  href: string;
}

export interface Cta {
  label: string;
  href: string;
}

/** Vitrin kartı: image verilirse fotoğraf, verilmezse dekoratif blok çizilir. */
export interface ShowcaseItem {
  caption?: string;
  tone: "erik" | "kum" | "mor" | "cam";
  image?: string;
  alt?: string;
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
    cta: { label: "Ücretsiz başla", href: "/login" } satisfies Cta,
  },
  hero: {
    title: "Sana göre\nbir bio linki.",
    body: "Instagram, TikTok, YouTube ve diğer profillerindeki tek link; paylaştığın, ürettiğin ve sattığın her şeyi bir araya getirsin.",
    claim: {
      domain: "caka.app/",
      placeholder: "adin",
      cta: "Ücretsiz başla",
      action: "/login",
    },
    showcase: [
      { caption: "Naz Erdem · Yayıncı", tone: "cam" },
      { caption: "Deniz Aksoy · Tasarımcı", tone: "erik" },
    ] satisfies ShowcaseItem[],
  },
  minutes: {
    title: "Caka sayfanı\ndakikalar içinde kur",
    body: "Sosyal hesaplarını, sitelerini, projelerini ve mağazanı tek bağlantıda topla. Her detayı kendin ayarla ya da hazır temayla başla.",
    cta: { label: "Ücretsiz başla", href: "/login" } satisfies Cta,
  },
} as const;

export type LandingContent = typeof landing;
