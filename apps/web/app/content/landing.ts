import creatorElif from "~/assets/landing/creator-elif.webp";
import creatorKerem from "~/assets/landing/creator-kerem.webp";
import creatorNaz from "~/assets/landing/creator-naz.webp";
import creatorSelin from "~/assets/landing/creator-selin.webp";
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

/**
 * Hero'daki akan vitrin kartı. Tamamen dekoratiftir; gerçek bir kullanıcıyı
 * temsil etmediği için görselin üzerinde isim/unvan yazısı taşımaz.
 */
export interface MarqueeItem {
  image: string;
}

/**
 * Footer'daki güven ifadesi. Her biri kanıtına bağlanır: okuyucu iddiayı
 * doğrulayabilmeli, yoksa rozet olur (R49/R50).
 */
export interface TrustItem {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: readonly Cta[];
}

export interface SocialLink {
  platform: "github" | "instagram";
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

/**
 * Kitle bölümü (kum blok). Yanındaki analitik görseli tamamen dekoratiftir:
 * ürünün bugün üretmediği hiçbir sayı gösterilmez (R25).
 */
export interface AudienceSection {
  title: string;
  body: string;
  cta: Cta;
}

export interface FaqItem {
  question: string;
  answer: string;
  /** Cevabın dayandığı sayfaya isteğe bağlı bağlantı. */
  link?: Cta;
}

export interface FaqSection {
  title: string;
  items: readonly FaqItem[];
}

export const landing = {
  nav: {
    items: [{ label: "Ürün", href: "#urun" }] satisfies NavItem[],
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
        { image: creatorKerem },
        { image: creatorSelin },
        { image: creatorElif },
        { image: creatorNaz },
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
  } satisfies AudienceSection,
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
        question: "İçeriğimi dışa aktarabilir veya hesabımı silebilir miyim?",
        answer:
          "İkisi de şu an panelden kendi başına yapılmıyor. Verilerinin bir kopyasını istemek veya hesabının silinmesini talep etmek için KVKK m.11 kapsamında hello@caka.app adresine yazman yeterli.",
        link: { label: "Gizlilik Metni", href: "/gizlilik" },
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
    // Yalnızca çalışan hedefler: tek gerçek anchor (#urun), tek gerçek posta
    // kutusu (hello@caka.app) ve üç yayındaki hukuki route (R23).
    // `destek@` ve `merhaba@` yönlendirilmiyordu; iki ölü bağlantı yerine tek
    // çalışan iletişim adresi bırakıldı.
    columns: [
      {
        title: "Caka",
        links: [
          { label: "Nasıl çalışır", href: "#urun" },
          { label: "İletişim", href: "mailto:hello@caka.app" },
        ],
      },
      {
        title: "Yasal",
        links: [
          { label: "Gizlilik", href: "/gizlilik" },
          { label: "Kullanım Koşulları", href: "/kullanim-kosullari" },
          { label: "Çerez Politikası", href: "/cerez-politikasi" },
        ],
      },
    ] satisfies FooterColumn[],
    // Yalnızca var olduğu doğrulanmış hesaplar. `github.com/caka-app` ve
    // `x.com/cakaapp` 404 dönüyordu: ilki gerçek depoyla değiştirildi,
    // ikincisi kaldırıldı. Bu liste `home.tsx`'teki Organization
    // şemasının `sameAs` alanını da besler — ölü hesap ilan edilmemeli.
    social: [
      {
        platform: "github",
        href: "https://github.com/abdullahcicekli/caka.app",
        label: "GitHub",
      },
      {
        platform: "instagram",
        href: "https://instagram.com/caka.app",
        label: "Instagram",
      },
    ] satisfies SocialLink[],
    // R49/R50: rozet koleksiyonu değil, doğrulanabilir ve ayırt edici iki
    // ifade. Her biri kanıtına tıklanıyor. Bilinçli olarak YOK: ISO 27001,
    // "GDPR compliant", "KVKK uyumlu", "%100 Türkiye'de barındırılıyor" —
    // hiçbirinin arkasında gösterebileceğimiz bir belge yok (KD3). "Güvenli
    // bağlantı" da yok: her sitede bulunan bir özelliği güven sinyali diye
    // sunmak, reddettiğimiz içi boş rozet mantığının doğrulanabilir sürümü
    // olurdu.
    trust: [
      {
        // packages/shared/src/cookies.ts envanteriyle kanıtlanıyor: tanımlı
        // tek kategori "zorunlu". Ölçüm çerezsiz, tarayıcıda doğrulandı.
        label: "Reklam ve analitik çerezi kullanmıyoruz",
        href: "/cerez-politikasi",
      },
      {
        // MIT lisanslı public depo; yukarıdaki iddia dahil her şey kodda
        // okunabilir.
        label: "Kaynak kodu açık",
        href: "https://github.com/abdullahcicekli/caka.app",
      },
    ] satisfies readonly TrustItem[],
    copyright: `© ${new Date().getFullYear()}`,
  },
} as const;

export type LandingContent = typeof landing;
