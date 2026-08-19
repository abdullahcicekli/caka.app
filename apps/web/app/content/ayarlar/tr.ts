import {
  USERNAME_CHANGE_COOLDOWN_DAYS,
  USERNAME_MAX,
  USERNAME_MIN,
  USERNAME_REDIRECT_DAYS,
  formatDate,
} from "@caka/shared";

export const tr = {
  title: "Ayarlar",
  sectionNavLabel: "Ayarlar bölümleri",
  sectionLabels: {
    adres: "Adres",
    dil: "Dil",
    "paylasim-gorseli": "Paylaşım görseli",
    hesap: "Hesap",
  },

  address: {
    title: "Adres",
    hint: "Sayfanın yayında olduğu adres. Değiştirirsen eski adresin bir süre daha çalışır, sonra durur.",
    currentLabel: "Şu anki adresin",
    fieldLabel: "Yeni adres",
    domain: "caka.app/",
    placeholder: "yeniadin",
    hintFormat: `${USERNAME_MIN}-${USERNAME_MAX} karakter; küçük harf, rakam ve tire.`,
    consequencesTitle: "Değiştirmeden önce bunları bil",
    consequences: [
      `Eski adresin ${USERNAME_REDIRECT_DAYS} gün boyunca yeni adresine geçici olarak yönlendirilir. Süre dolunca yönlendirme biter ve eski adres çalışmaz.`,
      `Aynı ${USERNAME_REDIRECT_DAYS} gün boyunca eski adresin kilitli kalır; o süre içinde başkası o adı alamaz.`,
      "Bastırdığın QR kodları, kartvizitlerin ve başka yerlere yazdığın eski bağlantılar süre dolduğunda kırılır — onları güncellemen gerekir.",
      `Bir değişiklikten sonra ${USERNAME_CHANGE_COOLDOWN_DAYS} gün boyunca adresini yeniden değiştiremezsin.`,
    ],
    confirmLabel: "Yukarıdakileri okudum, adresimi değiştirmek istiyorum.",
    submit: "Adresi değiştir",
    submitting: "Değiştiriliyor…",
    checking: "kontrol ediliyor…",
    available: "bu adres boşta",
    unavailable: "Bu adres dolu",
    activeRedirectsTitle: "Hâlâ yönlendiren eski adreslerin",
  },

  // L17 — dil seçimi. Seçenek etiketleri çevrilmez: her dil kendi adıyla
  // görünür (`LOCALE_LABELS`), yoksa aradığı dili tanımayan kullanıcı listede
  // kaybolur.
  language: {
    title: "Dil",
    hint: "Caka'yı hangi dilde göreceğin. Seçimin bu tarayıcıda hatırlanır.",
    fieldLabel: "Arayüz dili",
    note: "Sayfandaki kendi içeriğin çevrilmez; yalnızca Caka'nın arayüzü değişir.",
  },

  share: {
    title: "Paylaşım görseli",
    hint: "Sayfanın bağlantısı WhatsApp, X ve LinkedIn gibi yerlerde paylaşıldığında bu görsel görünür.",
    templateTitle: "Şablon",
    templateGroupLabel: "Şablon seçimi",
    previewAlt: (label: string) => `Seçili paylaşım görseli önizlemesi — ${label}`,
    photoTitle: "Fotoğraf kaynağı",
    photoGroupLabel: "Fotoğraf kaynağı seçimi",
    photoHint: "Portre ve Tam kadraj şablonlarında kullanılacak fotoğraf.",
    photoEmptyHint:
      "Portre ve Tam kadraj şablonları profil fotoğrafını kullanıyor. Sayfana bir görsel bloğu ekleyip yayınlarsan burada onu da seçebilirsin.",
    photoDefaultLabel: "Profil fotoğrafım",
    photoFallbackLabel: (index: number) => `Görsel ${index + 1}`,
  },

  account: {
    title: "Hesap",
    hint: "Bu bilgiler girişte kullandığın hesaptan gelir; buradan değiştirilmez.",
    providerLabel: "Giriş yöntemi",
    providerUnknown: "Bilinmiyor",
    emailLabel: "E-posta",
    emailVerified: "doğrulanmış",
    dataTitle: "Verilerin",
    dataBody:
      "Verilerinin bir kopyasını istemek şu an panelden kendi başına yapılmıyor. KVKK m.11 kapsamındaki taleplerini hello@caka.app adresine yazarsan işleme alınır.",
    dataMailLabel: "hello@caka.app",
    dataMailHref: "mailto:hello@caka.app",
    // Yalnızca belge yayındayken gösterilir (R33): yayında değilken /gizlilik
    // 404 verir ve ölü bağlantı bırakmış oluruz.
    privacyLinkLabel: "Gizlilik Metni",
    privacyLinkHref: "/gizlilik",
    privacyLinkPrefix: "Ayrıntılar:",

    // Hesap silme (KVKK m.7 / m.11-e). Sonuçlar gönderimden ÖNCE yazılıdır:
    // işlem geri alınamıyor, dolayısıyla sürpriz bırakmaya hakkımız yok.
    deleteTitle: "Hesabını sil",
    deleteBody:
      "Hesabını buradan kendin silebilirsin. Silme anında olur, geri alınamaz ve destek ekibi de geri getiremez.",
    deleteConsequencesTitle: "Silmeden önce bunları bil",
    deleteConsequences: [
      "Sayfan anında yayından kalkar; düzenin, blokların ve yazdığın her şey silinir.",
      "Yüklediğin bütün görseller ve belgeler kalıcı olarak silinir.",
      "Sayfanın ziyaret ve tıklama sayaçları, oturumların ve giriş bağlantın silinir.",
      `Adresin ${USERNAME_REDIRECT_DAYS} gün boyunca kilitli kalır: o süre boyunca kimse — sen de dâhil — o adresi alamaz ve adres 404 verir. Böylece bastırdığın QR kodları bir yabancının sayfasına düşmez.`,
      "Aynı e-postayla yeniden kayıt olabilirsin, ama eski sayfan geri gelmez ve yeni bir adres seçmen gerekir.",
    ],
    deleteFieldLabel: "Onaylamak için adresini yaz",
    deleteFieldHint: (username: string) => `Kutuya ${username} yaz.`,
    deleteConfirmLabel:
      "Hesabımın ve tüm içeriğimin kalıcı olarak silineceğini, bunun geri alınamayacağını anladım.",
    deleteSubmit: "Hesabımı kalıcı olarak sil",
    deleteSubmitting: "Siliniyor…",
    /** Sunucudan dönen silme hatalarının karşılığı. */
    deleteErrors: {
      mismatch: "Yazdığın adres kendi adresinle eşleşmiyor",
      no_profile: "Profilin bulunamadı",
      origin: "Geçersiz istek kaynağı",
      unknown: "Silme tamamlanamadı, lütfen tekrar dene",
    },
  },

  /** Sunucudan dönen adres hatalarının karşılığı (biçim hataları hariç). */
  addressErrors: {
    same: "Bu zaten senin adresin",
    cooldown: `Adresini son ${USERNAME_CHANGE_COOLDOWN_DAYS} gün içinde değiştirdin; şimdilik yeniden değiştiremezsin`,
    taken: "Bu adres dolu, başka bir tane dene",
    locked: "Bu adres başka bir kullanıcının eski adresi ve şu an kilitli",
    no_profile: "Profilin bulunamadı",
    conflict: "Adresin başka bir yerde değiştirildi; sayfayı yenile",
    origin: "Geçersiz istek kaynağı",
    unknown: "Bir şeyler ters gitti, lütfen tekrar dene",
  },

  notices: {
    cooldown: (availableOn: string, remainingDays: number) =>
      `Adresini yakın zamanda değiştirdin. ${formatDate(availableOn, "tr")} tarihinden sonra (yaklaşık ${remainingDays} gün) yeniden değiştirebilirsin.`,
    redirect: (oldUsername: string, expiresOn: string) =>
      `caka.app/${oldUsername} — ${formatDate(expiresOn, "tr")} tarihine kadar yönlendiriliyor ve kilitli.`,
    success: (previousUsername: string, username: string, expiresOn: string) =>
      `Adresin caka.app/${username} oldu. caka.app/${previousUsername} adresi ${formatDate(expiresOn, "tr")} tarihine kadar buraya yönlendirilecek.`,
  },
};
