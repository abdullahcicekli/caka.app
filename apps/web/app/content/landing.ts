import creatorElif from "~/assets/landing/creator-elif.webp";
import creatorKerem from "~/assets/landing/creator-kerem.webp";
import creatorNaz from "~/assets/landing/creator-naz.webp";
import creatorSelin from "~/assets/landing/creator-selin.webp";
import proofCreator1 from "~/assets/landing/proof-creator-1.webp";
import proofCreator2 from "~/assets/landing/proof-creator-2.webp";
import proofCreator3 from "~/assets/landing/proof-creator-3.webp";
import proofCreator4 from "~/assets/landing/proof-creator-4.webp";
import quoteAvatar from "~/assets/landing/quote-avatar.webp";
import shareCards from "~/assets/landing/share-cards.webp";

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

/** Paylaş bölümü: cam blok, solda metin + CTA, sağda kart görseli. */
export interface ShareSection {
  title: string;
  body: string;
  cta: Cta;
  image: string;
}

/** Analitik kartı (kum blok): bar grafik + iki metrik. */
export interface Metric {
  value: string;
  label: string;
  /** Kart rengini belirleyen varyant (bar | lila | mavi). */
  tone: "bar" | "lila" | "mavi";
}

export interface AudienceSection {
  title: string;
  body: string;
  cta: Cta;
  metrics: readonly Metric[];
}

export interface ProofSection {
  title: string;
  accent: string;
  images: readonly string[];
  address: string;
}

export interface QuoteSection {
  image: string;
  quote: string;
  name: string;
  role: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqSection {
  title: string;
  items: readonly FaqItem[];
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
  share: {
    title: "Caka'nı istediğin\nher yerde paylaş",
    body: "Adresini profillerine, videolarına ve kartvizitine koy. QR kodunla çevrimdışı trafiği de sayfana taşı.",
    cta: { label: "Ücretsiz başla", href: "/onboarding" } satisfies Cta,
    image: shareCards,
  } satisfies ShareSection,
  audience: {
    title: "Kitleni tanı,\nilgisini koru",
    body: "Hangi bağlantının tıklandığını, ziyaretçinin nereden geldiğini ve neyin işe yaradığını gör. Sayfanı buna göre güncelle.",
    cta: { label: "Ücretsiz başla", href: "/onboarding" } satisfies Cta,
    metrics: [
      {
        value: "43.500",
        label: "Tıklama",
        tone: "bar",
      },
      { value: "643", label: "Bülten kaydı", tone: "lila" },
      { value: "960", label: "Ziyaret · İstanbul", tone: "mavi" },
    ] satisfies readonly Metric[],
  } satisfies AudienceSection,
  proof: {
    title: "Türkiye'de 50 binden fazla",
    accent: "yaratıcının",
    images: [
      proofCreator1,
      proofCreator2,
      proofCreator3,
      proofCreator4,
    ] satisfies readonly string[],
    address: "caka.app/atolye",
  } satisfies ProofSection,
  quote: {
    image: quoteAvatar,
    quote:
      "\"Bütün işlerimi tek bağlantıda toplamak, profilimi paylaşma şeklimi değiştirdi.\"",
    name: "Deniz Aksu",
    role: "Endüstriyel tasarımcı",
  } satisfies QuoteSection,
  faq: {
    title: "Soruların? Cevaplandı",
    items: [
      {
        question: "Caka nedir?",
        answer:
          "Caka, tüm profillerini, projelerini ve mağazanı tek adreste toplayan bir link-in-bio sayfasıdır. Klasik link listesi yerine kendi düzenini kurabilirsin.",
      },
      {
        question: "Ücretsiz planda neler var?",
        answer:
          "Google ile kayıt, kendi adresin, bloklu grid düzenleme, analitik özeti ve görsel yükleme ücretsiz planda yer alır.",
      },
      {
        question: "Kendi alan adımı bağlayabilir miyim?",
        answer:
          "Şu anda caka.app altındaki adresinle yayındasın. Kendi alan adını bağlama ücretli planla birlikte yolda.",
      },
      {
        question: "Adresimi sonradan değiştirebilir miyim?",
        answer:
          "Evet. Ayarlar'dan adresini değiştirebilirsin; eski adresin 30 gün boyunca yeni adresine yönlendirilir.",
      },
      {
        question: "İçeriğimi dışa aktarabilir miyim?",
        answer:
          "Evet, içeriğini istediğin zaman dışa aktarabilir ve istersen hesabını tamamen silebilirsin.",
      },
    ] satisfies readonly FaqItem[],
  } satisfies FaqSection,
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
