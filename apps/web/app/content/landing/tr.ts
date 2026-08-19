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
  // Yüzen hap navbar iki eylem taşır (giriş / başla) ve bir menü düğmesi.
  // Bölüm bağlantıları menü katmanına taşındı: hap dar ekranda da tek satırda
  // kalsın, gezinme tek bir yerde toplansın.
  nav: {
    login: { label: "Giriş yap", href: "/login" },
    cta: { label: "Ücretsiz başla", href: "/onboarding" },
    menu: {
      label: "Site menüsü",
      open: "Menü",
      close: "Menüyü kapat",
      links: [
        { label: "Nasıl çalışır", href: "/#urun" },
        { label: "Vitrin", href: "/#vitrin" },
        { label: "Sorular", href: "/#sss" },
        { label: "Giriş yap", href: "/login" },
      ],
      card: {
        title: "Bloklarla kurulmuş bir sayfa",
        body: "Bağlantı, fotoğraf, müzik, harita — hepsi tek ızgarada.",
      },
      // Menünün alt meta satırı. Bağlantı değil, yalnız bilgi.
      meta: ["Kişisel sayfa, sana göre", "Reklam ve analitik çerezi yok"],
    },
  },
  hero: {
    // İki satır: birinci satır ne olduğunu, ikinci satır ne kadar sürdüğünü
    // söyler. Satır sonu `\n` ile verilir.
    kicker: "Kişisel sayfan için tek adres\nÜcretsiz, dakikalar içinde yayında",
    title: "Sana göre\nbir bio linki.",
    media: {
      alt: "Caka sayfalarını gösteren portreler",
      pause: "Şeridi durdur",
      play: "Şeridi oynat",
    },
    marquee: landingAssets.marquee,
    claim: {
      domain: "caka.app/",
      placeholder: "adin",
      cta: "Ücretsiz başla",
      action: "/onboarding",
    },
  },
  // Medyadan sonra tek cümlelik editoryal blok: sayfanın vaadini büyük
  // puntoyla tekrarlar.
  editorial: {
    body: "Instagram, TikTok, YouTube ve diğer profillerindeki tek link; paylaştığın, ürettiğin ve sattığın her şeyi bir araya getirsin.",
  },
  // Sabitlenen ifade bölümü: başlık kelimelerine ayrılır, kaydırdıkça tek
  // satıra toplanır. Kelime ayrımı boşluktan yapılır — katalogda dizi tutmak
  // yerine düz cümle, çevirmen için de doğal.
  minutes: {
    title: "Caka sayfanı dakikalar içinde kur",
    body: "Sosyal hesaplarını, sitelerini, projelerini ve mağazanı tek bağlantıda topla. Her detayı kendin ayarla ya da hazır temayla başla.",
    cta: { label: "Ücretsiz başla", href: "/onboarding" },
  },
  share: {
    title: "Caka'nı istediğin\nher yerde paylaş",
    body: "Adresini profillerine, videolarına ve kartvizitine koy. QR kodunla çevrimdışı trafiği de sayfana taşı.",
    cta: { label: "Ücretsiz başla", href: "/onboarding" },
    // Medya kartının üstündeki rozetler. Sayı iddiası taşımaz (R25): ürünün
    // bugün ölçmediği hiçbir metrik yazılmaz.
    badges: ["Tek adres", "QR kod"],
    pill: "Paylaşım",
    image: landingAssets.shareImage,
  },
  audience: {
    title: "Kitleni tanı,\nilgisini koru",
    body: "Hangi bağlantının tıklandığını, ziyaretçinin nereden geldiğini ve neyin işe yaradığını gör. Sayfanı buna göre güncelle.",
    cta: { label: "Ücretsiz başla", href: "/onboarding" },
    badges: ["Tıklama", "Kaynak"],
    pill: "Analitik",
  },
  // Yatay kart karuseli. Kartların görselleri `shared.ts`'te (çevrilmez) ve
  // buradaki kartlarla **sırayla** eşlenir.
  showcase: {
    title: "Gerçek kullanım için tasarlandı",
    body: "Sayfanı kurmaktan paylaşmaya, paylaşmaktan ölçmeye kadar üç adım.",
    segments: [
      { id: "kur", label: "Kur" },
      { id: "paylas", label: "Paylaş" },
      { id: "olc", label: "Ölç" },
    ],
    cards: [
      {
        title: "Bloklu ızgara",
        body: "Blokları sürükle, boyutlarını değiştir, sayfanı kendi düzeninde kur.",
      },
      {
        title: "Hazır temalar",
        body: "Renk ve tipografi kararlarını tek seçimle al, sonra istediğini değiştir.",
      },
      {
        title: "Tek adres",
        body: "caka.app/adin — profillerine, videolarına ve kartvizitine koyduğun tek bağlantı.",
      },
      {
        title: "QR kod",
        body: "Çevrimdışı gördüğün kişileri de sayfana taşı; kod adresinle birlikte üretilir.",
      },
      {
        title: "Tıklama özeti",
        body: "Hangi bloğun ilgi gördüğünü gör, sayfanı ona göre yeniden diz.",
      },
      {
        title: "Ziyaretçi kaynağı",
        body: "Trafiğin hangi profilden geldiğini bil, emeğini doğru yere ver.",
      },
    ],
    prev: "Önceki kart",
    next: "Sonraki kart",
    trackLabel: "Vitrin kartları",
  },
  faq: {
    title: "Soruların? Cevaplandı",
    // Akordeonun solundaki etiket sütunu.
    label: "Sık sorulanlar",
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
  // Koyu kapanış bloğu: beyaz cümle + kireç vurgulu satır + adres formu.
  closingCta: {
    title: "İnternetteki kendi\nköşeni bugün aç",
    accent: "Ücretsiz. Reklamsız. Sana göre.",
    claim: {
      domain: "caka.app/",
      placeholder: "adin",
      cta: "Ücretsiz başla",
      action: "/onboarding",
    },
  },
  // Sayfanın en altındaki kireç alan: kısa bir cümle, üç hap bilgi, logo.
  // Hap bilgiler SABİTTİR — tarih/saat gibi istemcide değişen bir değer
  // yazılmaz, yoksa sunucu çıktısıyla ilk render ayrışır (hidrasyon).
  outro: {
    line: "Bugün açtığın sayfa, yarın da senin kalır.",
    pills: ["Kaynak kodu açık", "Beş dilde", "caka.app"],
  },
  footer: {
    // Yalnızca çalışan hedefler: gerçek çapalar (/#urun, /#vitrin, /#sss —
    // footer hukuki sayfalarda da render edildiği için mutlak yolla), tek
    // gerçek posta kutusu (hello@caka.app) ve hukuki route'lar (R23).
    //
    // "Yasal" sütunundaki üç bağlantı `legalDocument` ile işaretli: belge
    // yayına hazır değilken (R33 kapısı 404 veriyorken) sütundan düşerler.
    tagline: "Caka — sana göre bir kişisel sayfa",
    columns: [
      {
        title: "Ürün",
        links: [
          { label: "Nasıl çalışır", href: "/#urun" },
          { label: "Vitrin", href: "/#vitrin" },
          { label: "Sorular", href: "/#sss" },
        ],
      },
      {
        title: "Caka",
        links: [
          { label: "Ücretsiz başla", href: "/onboarding" },
          { label: "Giriş yap", href: "/login" },
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
