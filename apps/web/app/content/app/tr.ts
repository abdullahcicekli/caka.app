import {
  type BlockIssueId,
  type BlockGridLimits,
  MAX_GALLERY_BLOCKS,
  type ProfileBlock,
} from "@caka/shared";

export const tr = {
  /** Sayfa başlıkları — hepsi noindex, yalnız sekmede görünür. */
  titles: {
    editor: "Editör — Caka",
    dashboard: "Panel — Caka",
    settings: "Ayarlar — Caka",
    login: "Giriş yap — Caka",
    setup: "Sayfanı hazırla — Caka",
    onboardingFinish: "Hesabın hazırlanıyor — Caka",
    onboardingReady: "Sayfan hazır — Caka",
    notFound: "Sayfa bulunamadı — Caka",
  },

  /** Blok tipi adları. Şemanın adlandırması değil, editörde görünen ad. */
  blockTypes: {
    profile: "Profil",
    social: "Sosyal medya",
    link: "Bağlantı",
    text: "Metin",
    image: "Görsel",
    status: "Duyuru",
    // Editörde "Galeri" adı blok seçicinin adıyla ("Blok galerisi")
    // çarpışıyor; fotoğraf bloğu bu yüzden burada tam adıyla görünür.
    gallery: "Fotoğraf galerisi",
    youtube: "YouTube",
    spotify: "Spotify",
  } satisfies Record<ProfileBlock["type"], string>,

  /** Yayını engelleyen blok sorunlarının kullanıcıya görünen karşılığı. */
  blockIssues: {
    profile_name: "Adını gir",
    social_target: "Bağlantı ya da kullanıcı adı gir",
    link_url: "Bağlantı adresi gir",
    link_title: "Başlık gir",
    text_empty: "Metin yaz",
    status_empty: "Duyuru metni yaz",
    image_missing: "Görsel yükle",
    gallery_empty: "Galeriye fotoğraf ekle",
    youtube_video_url: "YouTube video bağlantısı gir",
    youtube_channel_url: "YouTube kanal bağlantısı gir",
    spotify_url: "Spotify bağlantısı gir",
  } satisfies Record<BlockIssueId, string>,

  /** Izgara sınırı aşıldığında gösterilen mesaj. */
  gridLimit: (blockLabel: string, limits: BlockGridLimits) =>
    `${blockLabel} bloğu en az ${limits.minW}×${limits.minH}, en fazla ${limits.maxW}×${limits.maxH} olabilir`,

  galleryCountLimit: `Sayfanda en fazla ${MAX_GALLERY_BLOCKS} galeri bloğu olabilir`,

  editor: {
    layoutUnreadable: "Sayfa düzeni okunamadı",
    backToDashboard: "Panele dön",
    toolbarLabel: "Editör araçları",
    addLink: "Bağlantı ekle",
    addImage: "Görsel ekle",
    addGallery: "Fotoğraf galerisi ekle",
    mobilePreview: "Mobil önizleme",
    desktopPreview: "Masaüstü görünümü",
    pickTheme: "Tema seç",
    editProfileInfo: "Genel profil bilgilerini düzenle",
    saveFailed: "Kaydedilemedi — bağlantını kontrol et.",

    draftTitle: "Yayınlanmamış değişiklikler var",
    liveTitle: "Yayındaki sayfan",
    draftShort: "Taslak",
    liveShort: "Yayında",
    addressLabel: (username: string, hasDraft: boolean) =>
      `caka.app/${username} — ${hasDraft ? "taslak var" : "yayında"}`,
    publishing: "Yayınlanıyor",
    publishingProgress: "Yayınlanıyor…",
    publishFinish: "Bitir ve yayınla",
    publishShort: "Yayınla",
    blockedTitle: "Şu bloklar tamamlanmadan sayfan yayınlanamaz. Doldur ya da kaldır:",

    fieldDescription: "Açıklama",
    fieldTitle: "Başlık",
    fieldLink: "Bağlantı",

    imageUploading: "Yükleniyor…",
    imageReplace: "Görseli değiştir",
    imageDrop: "Sürükle veya seç",
    imageUploadFailed: "Görsel yüklenemedi",

    galleryEmpty: "Henüz fotoğraf yok.",
    galleryAltPlaceholder: "Alt metin (isteğe bağlı)",
    galleryAdd: "Fotoğraf ekle (JPEG veya PNG)",
    galleryMultiHint: "Birden fazla fotoğraf seçebilirsin",

    resolving: "Çözümleniyor…",
    youtubeFailed: "YouTube bağlantısı çözümlenemedi.",
    youtubeFailedHint: "YouTube bağlantısı çözümlenemedi — bağlantını kontrol et.",
    youtubeTitlePlaceholder: "Boş bırakırsan kartta yalnız video görünür",
    spotifyFailed: "Spotify bağlantısı çözümlenemedi.",
    spotifyFailedHint: "Spotify bağlantısı çözümlenemedi — bağlantını kontrol et.",
    spotifyAdded: (kindLabel: string) => `${kindLabel} olarak eklendi`,

    dragHint: "basılı tut → sürükle",
    closePanel: "Paneli kapat",
    deleteBlock: "Bloğu sil",

    fieldName: "Ad",
    fieldPlatform: "Platform",
    fieldSocialTarget: "Bağlantı ya da kullanıcı adı",
    socialHint:
      "Profil bağlantısını yapıştırabilir ya da sadece kullanıcı adını yazabilirsin — ikisini de anlıyoruz.",
    fieldImage: "Görsel",
    fieldAnnouncement: "Duyuru",
    galleryTitleHint:
      "Başlık yalnız iki satır yüksekliğindeki galerilerde görünür. Kısa galerilerde ekran okuyucular için kullanılır.",
    photosLegend: (count: number, max: number) => `Fotoğraflar (${count}/${max})`,
    galleryMaxPhotos: (max: number, room: number) =>
      `Bir galeride en fazla ${max} fotoğraf olabilir; seçtiklerinin ilk ${room} tanesi eklendi.`,
    photoAltAria: (index: number) => `${index}. fotoğrafın alt metni`,
    photoUpAria: (index: number) => `${index}. fotoğrafı yukarı taşı`,
    photoDownAria: (index: number) => `${index}. fotoğrafı aşağı taşı`,
    photoRemoveAria: (index: number) => `${index}. fotoğrafı kaldır`,
    pickerSocial: "Sosyal medya",
    pickerContent: "İçerik",
    pickerNoResults: (query: string) => `“${query}” için sonuç yok.`,

    galleryFullHint: (max: number) =>
      `Bir galeride en fazla ${max} fotoğraf olabilir. Yeni fotoğraf eklemek için önce birini kaldır.`,
    galleryUploadStep: (done: number, total: number) => `Yükleniyor… (${done}/${total})`,
    galleryBlockLimit: (max: number) =>
      `Sayfanda en fazla ${max} fotoğraf galerisi olabilir. Yenisini eklemek için önce birini kaldır.`,
    youtubeLinkLabel: "YouTube bağlantısı",
    youtubeHint:
      "Video ve kanal adresini ayırt ediyoruz — hangisini yapıştırdıysan onu ekleriz.",
    linkTitlePlaceholder: "Örn. Portfolyo",
    optionalTitle: "Başlık (isteğe bağlı)",
    spotifyLinkLabel: "Spotify bağlantısı",
    spotifyHint:
      "Parça, albüm, çalma listesi, sanatçı, podcast ve bölüm eklenebilir — ne yapıştırdıysan onu ekleriz.",
    fixIssue: "Düzelt",
    removeBlock: "Kaldır",
    editedElsewhere: "Sayfa başka bir yerde düzenlendi.",

    richText: {
      placeholder: "Bir şeyler yaz…",
      linkUrl: "Bağlantı adresi",
      bold: "Kalın",
      italic: "İtalik",
      orderedList: "Sıralı liste",
      quote: "Alıntı",
      link: "Bağlantı",
      toolbarLabel: "Metin biçimlendirme",
    },
  },

  setup: {
    stepsLabel: "Kurulum adımları",
    nameRequired: "Adını yazmalısın",
    photoInvalid: "Fotoğraf doğrulanamadı",
    linkInvalid: "Bağlantılardan biri geçerli değil",
    photoUploadFailed: "Fotoğraf yüklenemedi",
    photoUploading: "Yükleniyor…",
    photoReplace: "Fotoğrafı değiştir",
    nameLabel: "Adın",
    bioLabel: "Kısa açıklama",
    bioPlaceholder: "Kendini birkaç kelimeyle anlat.",

    platformsTitle: "Hangi platformlardasın?",
    platformsBody:
      "Seçtiğin her platform sayfanda bir blok olarak görünür. Kullanıcı adlarını sonra da girebilirsin.",
    purposeTitle: "Caka'yı ne için kullanacaksın?",
    purposeBody: "Sana uyanları seç. Sayfanı buna göre hazırlayalım, ayarlarla uğraşma.",
    discoveryKicker: "Sayfana geçmeden son bir soru",
    discoveryTitle: "Caka'yı nereden duydun?",
    templateTitle: "Bir şablon seç",
    templateBody: "Sana uyan stili seç, içeriğini sonra ekle.",
    templatePreviewRole: "Tasarım · İstanbul",
    templateUse: "Bu şablonla başla",
    linksTitle: "Bağlantılarını ekle",
    linksBody: "Seçtiğin platformların kullanıcı adlarını gir.",
    linksChosen: "Seçtiklerin",
    usernameLabel: "Kullanıcı adı",
    extraLinks: "Ek bağlantılar",

    buildingContent: "İçeriğin bulunuyor…",
    buildingLinks: "Bağlantıların sayfana yerleştiriliyor",
    readyKicker: "Güzel görünüyor",
    readyBody:
      "Sayfan iyi bir başlangıç yaptı. Düzenlemeye devam ederek daha da iyileştirebilirsin.",
    readyTitle: "Yeni sayfan yayında",
    readyCta: "Sayfamı düzenlemeye devam et",

    bioTooLong: (max: number) => `Açıklama en fazla ${max} karakter olabilir`,
    bioOverBy: (over: number) =>
      `Açıklama ${over} karakter fazla. Devam etmek için metni kısalt.`,
    stepAria: (current: number, total: number) => `Adım ${current}/${total}`,
    skipStep: "Bu adımı geç",
    takenFromAccount: (username: string) => `${username} hesabından alındı`,
    haveAccountSignIn: "Hesabın varsa giriş yap",
    claimingAddress: (username: string) => `caka.app/${username} adresini alıyorsun.`,
    termsNotice: "Kaydolarak kullanım şartlarını ve gizlilik politikasını kabul edersin.",
    gridSoon: "Grid editörü çok yakında — sayfan şimdiden yayında.",

    almostDone: "Neredeyse tamam",
    claimTitle: "Hoş geldin",
    claimBody: "Sayfan hangi adreste yayınlansın?",
    claimAvailable: "✓ bu adres boşta",
    claimTaken: "Bu adres az önce alındı, başka bir tane dene",
    claimUnknownError: "Bir şeyler ters gitti, lütfen tekrar dene",
  },

  auth: {
    loginTitle: "Tekrar hoş geldin",
    loginBody: "Kaldığın yerden devam et.",
    loginCta: "giriş yap",
    signInGoogle: "Google ile giriş yap",
    signInApple: "Apple ile giriş yap",
    noAccount: "Hesabın yok mu?",
    claimAddress: "Adresini al",
    homeAria: "Caka ana sayfa",
    demoRole: "seramik atölyesi · İzmir",
    demoLinkCalendar: "Atölye takvimi",
    demoLinkContact: "İletişim",

    signOut: "Çıkış yap",
    accountMenu: "Hesap menüsü",
  },

  nav: {
    copied: "Kopyalandı",
    copyLink: "Bağlantıyı kopyala",
    pages: "Sayfalar",
    analytics: "Analitik",
    settings: "Ayarlar",
    viewProfile: "Profili gör",
    editProfile: "Profili düzenle",
    accountSettings: "Hesap ayarları",
    draftNotice:
      "Yayınlanmamış değişikliklerin var — aşağıdaki önizleme yayındaki hâli gösteriyor.",
    editPage: "Sayfayı düzenle",
    openPage: "Sayfayı aç",

    comingSoon: "Yakında",
  },

  profile: {
    menuLabel: "Caka menüsü",
    blocksLabel: "Bağlantılar ve içerikler",
    addImage: "Görsel ekle",
    shareImageAlt: (name: string) => `${name} adlı Caka profilinin paylaşım görseli`,
    description: (name: string) =>
      `${name} adlı kişinin bağlantıları, projeleri ve ürettikleri.`,
    edit: "Düzenle",
    unclaimed: (username: string) => `caka.app/${username} henüz kimsenin değil.`,

    availableAddress: "Bu adres boşta",
    claimThisAddress: "Bu adresi kap",
    availableCta: "bu adres boşta, kap!",
  },

  /** API uçlarının döndürdüğü, editörde kullanıcıya gösterilen hatalar. */
  api: {
    origin: "Geçersiz istek kaynağı",
    layoutReadFailed: "Sayfa verisi okunamadı; sayfayı yenile",
    layoutTooManyBlocks: (max: number) => `Sayfanda en fazla ${max} blok olabilir`,
    draftInvalid: "Taslak verisi geçersiz",
    blocksIncomplete: "Bazı bloklar tamamlanmamış",

    spotifyInvalid:
      "Bu bir bağlantı gibi görünmüyor. Spotify'da “Paylaş → Bağlantıyı kopyala” ile aldığın adresi yapıştır.",
    spotifyNotSpotify:
      "Bu adres Spotify'a ait değil. open.spotify.com adresi ya da spotify:track:… biçimindeki bağlantıyı yapıştır.",
    spotifyUnsupported:
      "Bu Spotify adresi eklenebilir bir içerik değil. Parça, albüm, çalma listesi, sanatçı, podcast ve bölüm eklenebilir; kullanıcı profili, arama ve kitaplık sayfaları eklenemez.",
    spotifyNotFound: (kind: string) =>
      `Bu ${kind} Spotify'da bulunamadı. İçerik kaldırılmış olabilir ya da bağlantı eksik kopyalanmış.`,
    spotifyUnavailable: "Spotify şu anda yanıt vermedi. Birazdan tekrar dene.",

    youtubeInvalid: "Bu bir bağlantı gibi görünmüyor. Video ya da kanal adresini yapıştır.",
    youtubeNotYoutube: "Bu adres YouTube'a ait değil. youtube.com ya da youtu.be adresi yapıştır.",
    youtubeUnsupported:
      "Bu YouTube adresi bir video ya da kanal değil. Oynatma listesi, arama ve akış sayfaları eklenemez.",
    youtubeChannelNotFound:
      "Bu kanal bulunamadı. Adresi kontrol et ya da kanalın /channel/UC… adresini dene.",
    youtubeVideoNotFound:
      "Video bulunamadı. Video silinmiş, gizli olabilir ya da bağlantı eksik kopyalanmış.",

    uploadOnlyJpegPng: "Yalnızca JPEG veya PNG yükleyebilirsin",
    uploadTooLarge: "Fotoğraf en fazla 5 MB olabilir",
    uploadTypeUnverified: "Fotoğraf türü doğrulanamadı",
    uploadSaveFailed: "Fotoğraf kaydedilemedi",
  },

  errors: {
    genericTitle: "Bir şeyler ters gitti",
    genericBody: "Beklenmeyen bir hata oluştu. Lütfen tekrar dene.",
    notFoundTitle: "Sayfa bulunamadı",
    notFoundBody: "Aradığın sayfa yok ya da taşınmış olabilir.",
    profileErrorTitle: "Bu sayfa görüntülenemiyor",
    profileErrorBody: "Bir şeyler ters gitti; daha sonra tekrar dene.",
    illustrationAlt:
      "Örgü ve oyun hamurundan yapılmış minyatür bir manzara: yuvarlak çalılar ve aralarından kıvrılan mavi bir dere",
    createPage: "Kendi sayfanı oluştur",
    backHome: "Ana sayfaya dön",
  },
};
