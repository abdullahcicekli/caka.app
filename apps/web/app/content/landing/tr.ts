// Landing içeriğinin **kanonik** dili. Tip sözleşmesi bu dosyadan türer
// (`index.ts`); buraya bir anahtar eklenip diğer dört dile eklenmezse
// `pnpm typecheck` kırılır (L10).
//
// Adresler Türkçe hâliyle yazılır (`/gizlilik`); render anında ziyaretçinin
// diline çevrilir (`localizeHref`). Beş dosyaya beş ayrı adres yazılmaz.

import { landingAssets } from "./shared";

export const tr = {
  // Sayfanın arama sonucunda ve paylaşımda görünen metni.
  seo: {
    title: "Caka — sana göre bir kişisel sayfa",
    description:
      "Ürettiklerini, bağlantılarını ve projelerini tek bir kişisel sayfada bir araya getir.",
    imageAlt: "Caka ile kişisel sayfanı oluştur",
  },
  // Navbar'da bölüm bağlantısı YOK: ana sayfa tek sayfa, "Ürün" bağlantısı
  // ziyaretçiyi zaten aşağıda gördüğü bölüme yolluyordu. Kalan iki eylem
  // (giriş / başla) navbarın işini yapıyor. `#urun` id'si duruyor — footer
  // "Nasıl çalışır" oraya gidiyor.
  nav: {
    login: { label: "Giriş yap", href: "/login" },
    cta: { label: "Ücretsiz başla", href: "/onboarding" },
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
    marquee: landingAssets.marquee,
  },
  minutes: {
    title: "Caka sayfanı\ndakikalar içinde kur",
    body: "Sosyal hesaplarını, sitelerini, projelerini ve mağazanı tek bağlantıda topla. Her detayı kendin ayarla ya da hazır temayla başla.",
    cta: { label: "Ücretsiz başla", href: "/onboarding" },
  },
  share: {
    title: "Caka'nı istediğin\nher yerde paylaş",
    body: "Adresini profillerine, videolarına ve kartvizitine koy. QR kodunla çevrimdışı trafiği de sayfana taşı.",
    cta: { label: "Ücretsiz başla", href: "/onboarding" },
    image: landingAssets.shareImage,
  },
  audience: {
    title: "Kitleni tanı,\nilgisini koru",
    body: "Hangi bağlantının tıklandığını, ziyaretçinin nereden geldiğini ve neyin işe yaradığını gör. Sayfanı buna göre güncelle.",
    cta: { label: "Ücretsiz başla", href: "/onboarding" },
  },
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
          "Evet. Ayarlar → Adres bölümünden değiştirebilirsin; eski adresin 30 gün boyunca yeni adresine yönlendirilir ve o süre boyunca kilitli kalır. Bir değişiklikten sonra yeniden değiştirmek için 30 gün beklemen gerekir.",
      },
      {
        question: "İçeriğimi dışa aktarabilir veya hesabımı silebilir miyim?",
        answer:
          "İkisi de şu an panelden kendi başına yapılmıyor. Verilerinin bir kopyasını istemek veya hesabının silinmesini talep etmek için KVKK m.11 kapsamında hello@caka.app adresine yazman yeterli.",
        link: {
          label: "Gizlilik Metni",
          href: "/gizlilik",
          legalDocument: "gizlilik" as const,
        },
      },
    ],
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
    // Yalnızca çalışan hedefler: tek gerçek anchor (/#urun — footer hukuki
    // sayfalarda da render edildiği için mutlak yolla), tek gerçek posta
    // kutusu (hello@caka.app) ve hukuki route'lar (R23).
    //
    // "Yasal" sütunundaki üç bağlantı `legalDocument` ile işaretli: belge
    // yayına hazır değilken (R33 kapısı 404 veriyorken) sütundan düşerler.
    columns: [
      {
        title: "Caka",
        links: [
          { label: "Nasıl çalışır", href: "/#urun" },
          { label: "İletişim", href: "mailto:hello@caka.app" },
        ],
      },
      {
        title: "Yasal",
        links: [
          { label: "Gizlilik", href: "/gizlilik", legalDocument: "gizlilik" as const },
          {
            label: "Kullanım Koşulları",
            href: "/kullanim-kosullari",
            legalDocument: "kullanim-kosullari" as const,
          },
          {
            label: "Çerez Politikası",
            href: "/cerez-politikasi",
            legalDocument: "cerez-politikasi" as const,
          },
        ],
      },
    ],
    social: landingAssets.social,
    // R49/R50: rozet koleksiyonu değil, doğrulanabilir ve ayırt edici iki
    // ifade. Her biri kanıtına tıklanıyor. Bilinçli olarak YOK: ISO 27001,
    // "GDPR compliant", "KVKK uyumlu", "%100 Türkiye'de barındırılıyor" —
    // hiçbirinin arkasında gösterebileceğimiz bir belge yok (KD3).
    trust: [
      {
        // packages/shared/src/cookies.ts envanteriyle kanıtlanıyor: tanımlı
        // tek kategori "zorunlu". Ölçüm çerezsiz, tarayıcıda doğrulandı.
        label: "Reklam ve analitik çerezi kullanmıyoruz",
        href: "/cerez-politikasi",
        legalDocument: "cerez-politikasi" as const,
      },
      {
        // MIT lisanslı public depo; yukarıdaki iddia dahil her şey kodda
        // okunabilir.
        label: "Kaynak kodu açık",
        href: "https://github.com/abdullahcicekli/caka.app",
      },
    ],
    copyright: landingAssets.copyright,
  },
};
