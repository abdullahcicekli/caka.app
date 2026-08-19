import {
  ASSET_MAX_COUNT,
  ASSET_MAX_TOTAL_BYTES,
  DOCUMENT_MAX_BYTES,
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
    status: "Duyuru",
    // Ayrımcı hâlâ "gallery" (depo uyumu), görünen ad "Fotoğraf": eski
    // `image` bloğu bu tipte eridi, kullanıcı tek bir blok görüyor.
    gallery: "Fotoğraf",
    youtube: "YouTube",
    spotify: "Spotify",
    document: "Belge",
    location: "Konum",
    ayet: "Kur'an ayeti",
  } satisfies Record<ProfileBlock["type"], string>,

  /** Yayını engelleyen blok sorunlarının kullanıcıya görünen karşılığı. */
  blockIssues: {
    profile_name: "Adını gir",
    social_target: "Bağlantı ya da kullanıcı adı gir",
    link_url: "Bağlantı adresi gir",
    link_title: "Başlık gir",
    text_empty: "Metin yaz",
    status_empty: "Duyuru metni yaz",
    gallery_empty: "Fotoğraf ekle",
    youtube_video_url: "YouTube video bağlantısı gir",
    youtube_channel_url: "YouTube kanal bağlantısı gir",
    spotify_url: "Spotify bağlantısı gir",
    document_missing: "Belge yükle",
    location_missing: "Bulunduğun yeri ara ve seç",
    ayet_verse: "Ayet seç",
  } satisfies Record<BlockIssueId, string>,

  /** Izgara sınırı aşıldığında gösterilen mesaj. */
  gridLimit: (blockLabel: string, limits: BlockGridLimits) =>
    `${blockLabel} bloğu en az ${limits.minW}×${limits.minH}, en fazla ${limits.maxW}×${limits.maxH} olabilir`,

  galleryCountLimit: `Sayfanda en fazla ${MAX_GALLERY_BLOCKS} çok fotoğraflı blok olabilir`,

  editor: {
    documentField: "Belge (PDF)",
    documentDrop: "PDF sürükle veya seç",
    documentReplace: "Belgeyi değiştir",
    documentUploading: "Yükleniyor…",
    documentUploadFailed: "Belge yüklenemedi",
    documentHint: (maxMb: number) =>
      `Şimdilik yalnız PDF, en fazla ${maxMb} MB. Dosya adını, boyutunu ve yükleme tarihini kart kendisi yazar.`,
    documentTitlePlaceholder: "Boş bırakırsan kartta dosya adı görünür",
    documentServeHint:
      "Belge caka.app üzerinden servis edilir ve tıklayınca indirilir; “Önizle” yeni sekmede açar.",

    layoutUnreadable: "Sayfa düzeni okunamadı",
    backToDashboard: "Panele dön",
    toolbarLabel: "Editör araçları",
    addLink: "Bağlantı ekle",
    // Tek düğme: `image` ve `gallery` birleşti, araç çubuğunda da tek
    // "Fotoğraf" düğmesi var.
    addPhoto: "Fotoğraf ekle",
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
    fieldAnnouncement: "Duyuru",
    galleryTitleHint:
      "Başlık yalnız iki satırdan yüksek kartlarda görünür. Kısa kartlarda ekran okuyucular için kullanılır.",
    photosLegend: (count: number, max: number) => `Fotoğraflar (${count}/${max})`,
    galleryMaxPhotos: (max: number, room: number) =>
      `Bir blokta en fazla ${max} fotoğraf olabilir; seçtiklerinin ilk ${room} tanesi eklendi.`,
    photoAltAria: (index: number) => `${index}. fotoğrafın alt metni`,
    photoUpAria: (index: number) => `${index}. fotoğrafı yukarı taşı`,
    photoDownAria: (index: number) => `${index}. fotoğrafı aşağı taşı`,
    photoRemoveAria: (index: number) => `${index}. fotoğrafı kaldır`,

    /** Yükleme yüzdesi. `fetch` gövde ilerlemesi vermiyor; sayı
        `XMLHttpRequest.upload.onprogress`'ten geliyor. */
    uploadPercent: (percent: number) => `Yükleniyor… %${percent}`,
    uploadProgress: (done: number, total: number, percent: number) =>
      `Yükleniyor… ${done}/${total} · %${percent}`,

    /** Düzen seçimi; yalnız 2+ fotoğrafta görünür. */
    photoLayoutLegend: "Düzen",
    photoLayoutGrid: "Izgara",
    photoLayoutSlider: "Kaydırmalı",
    photoLayoutHint:
      "Izgarada bütün fotoğraflar aynı anda görünür; kaydırmalıda 4 saniyede bir geçerler.",
    photoLinkHint:
      "Bağlantı yalnız tek fotoğraflı blokta çalışır; birden fazla fotoğrafta tıklama fotoğrafı büyütür.",
    photoLimitHint: (max: number) =>
      `Sayfanda en fazla ${max} çok fotoğraflı blok olabilir. Bu bloğa ikinci fotoğrafı eklemek için önce başka bir galeriden fotoğraf çıkar.`,

    pickerSocial: "Sosyal medya",
    pickerContent: "İçerik",
    pickerNoResults: (query: string) => `“${query}” için sonuç yok.`,

    galleryFullHint: (max: number) =>
      `Bir blokta en fazla ${max} fotoğraf olabilir. Yeni fotoğraf eklemek için önce birini kaldır.`,
    galleryBlockLimit: (max: number) =>
      `Sayfanda en fazla ${max} fotoğraf bloğu olabilir. Yenisini eklemek için önce birini kaldır.`,
    youtubeLinkLabel: "YouTube bağlantısı",
    youtubeHint:
      "Video ve kanal adresini ayırt ediyoruz — hangisini yapıştırdıysan onu ekleriz.",
    linkTitlePlaceholder: "Örn. Portfolyo",
    optionalTitle: "Başlık (isteğe bağlı)",
    spotifyLinkLabel: "Spotify bağlantısı",
    spotifyHint:
      "Parça, albüm, çalma listesi, sanatçı, podcast ve bölüm eklenebilir — ne yapıştırdıysan onu ekleriz.",
    locationSearchLabel: "Bulunduğun yer",
    locationSearchPlaceholder: "Şehir ya da ilçe ara…",
    locationSearching: "Aranıyor…",
    locationNoResults: (query: string) => `“${query}” için yer bulunamadı.`,
    locationSelected: (label: string) => `${label} seçildi`,
    locationClear: "Konumu kaldır",
    /** Ne yayınlandığını açıkça söyler; ev adresi hassas veridir. */
    locationPrivacyHint:
      "Yalnız şehir/ilçe düzeyinde arama yapılır ve koordinat yaklaşık 1 km'ye yuvarlanarak kaydedilir. Sayfanda görünen: yer adı, ülke, yaklaşık konum ve oranın yerel saati — tam adresin değil.",
    locationTimeZone: (zone: string) => `Saat dilimi: ${zone}`,
    locationNoTimeZone: "Bu yer için saat dilimi bulunamadı; kartta saat görünmeyecek.",
    ayetVariantLegend: "Kart sürümü",
    ayetVariantArabic: "Yalnız Arapça",
    ayetVariantMeal: "Yalnız meal",
    ayetVariantBoth: "İkisi birlikte",
    ayetVariantHint:
      "Sürüm kartın tipografisini ve en küçük ölçüsünü belirler: Arapça hat daha çok yer ister, ikisi birlikte olan sürüm en çoğunu.",
    ayetSearchLabel: "Ayet ara",
    ayetSearchPlaceholder: "Bakara 255 ya da bir kelime",
    ayetSearchHint:
      "Sure adı ve ayet numarası yazabilir (“Bakara 255”, “2:255”) ya da mealde geçen bir kelime arayabilirsin.",
    ayetSearching: "Ayetler aranıyor…",
    /** Öneri listesinin (listbox) adı; ekranda görünmez, seslendirmede duyulur. */
    ayetSuggestionsLabel: "Ayet önerileri",
    /** Sonuç sayısı yalnız ekran okuyucuya söylenir; gören kullanıcı listeyi görüyor. */
    ayetResultCount: (count: number) =>
      `${count} ayet listelendi. Ok tuşlarıyla gez, Enter ile seç.`,
    ayetNoResults: (query: string) => `“${query}” için ayet bulunamadı.`,
    ayetFailed: "Ayet kaynağına ulaşılamadı — bağlantını kontrol et.",
    /** Seçim kutusunun başlığı; kutu ne seçildiğini ve metnin önizlemesini taşır. */
    ayetPickedLegend: "Seçili ayet",
    ayetSearchOpen: "Başka ayet seç",
    ayetSearchClose: "Aramayı kapat",
    ayetClear: "Ayeti kaldır",
    /** Yalnız ekran okuyucuya: seçim kutusu görünenin karşılığı. */
    ayetSelected: (surahName: string, verse: number) => `${surahName} ${verse} seçildi`,
    ayetSourceNote: (translator: string) =>
      `Arapça metin Osmanî hattadır (Hafs); meal ${translator} mealidir ve kartın altında kaynak olarak görünür.`,
    fixIssue: "Düzelt",
    removeBlock: "Kaldır",
    editedElsewhere: "Sayfa başka bir yerde düzenlendi.",

    blockPickerAria: "Blok galerisi",
    searchPlaceholder: "Ara…",
    categoriesAria: "Kategoriler",
    clearFilterAria: "Filtreyi temizle",
    doneAria: "Bitti",
    deleteAction: "Sil",
    applyAction: "Uygula",
    actionRequired: "Aksiyon gerekli",
    refresh: "Yenile",
    generalInfo: "Genel bilgi",
    addBlock: "Blok ekle",
    themeAria: "Tema",
    addText: "Metin ekle",
    addStatus: "Duyuru ekle",
    addYoutube: "YouTube ekle",
    youtubePlaceholder: "youtube.com/watch?v=… ya da youtube.com/@kanal",
    spotifyPlaceholder: "open.spotify.com/track/… ya da spotify:album:…",

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

    goToPage: "Sayfana git",
    back: "Geri",
    addressPlaceholder: "adres",
    handlePlaceholder: "sen",
    continueAria: "Devam et",
    checking: "kontrol ediliyor…",
    claimCta: "Adresi al",
    signUpGoogle: "Google ile kaydol",
    signUpApple: "Apple ile kaydol",
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
    homeAria: "Ana sayfa",
    dashboard: "Panel",
    viewProfile: "Profili gör",
    editProfile: "Profili düzenle",
    accountSettings: "Hesap ayarları",
    draftNotice:
      "Yayınlanmamış değişikliklerin var — aşağıdaki önizleme yayındaki hâli gösteriyor.",
    editPage: "Sayfayı düzenle",
    openPage: "Sayfayı aç",
  },

  profile: {
    menuLabel: "Caka menüsü",
    profileInfoAria: "Profil bilgileri",
    blocksLabel: "Bağlantılar ve içerikler",
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
    documentOnlyPdf: "Şimdilik yalnızca PDF yükleyebilirsin",
    documentTooLarge: `Belge en fazla ${DOCUMENT_MAX_BYTES / (1024 * 1024)} MB olabilir`,
    documentTypeUnverified: "Dosya PDF olarak doğrulanamadı",
    documentSaveFailed: "Belge kaydedilemedi",
    quota: {
      count: `En fazla ${ASSET_MAX_COUNT} dosya yükleyebilirsin. Yeni dosya için önce kullanmadıklarını kaldırman gerekiyor.`,
      bytes: `Toplam yükleme alanın ${Math.round(ASSET_MAX_TOTAL_BYTES / (1024 * 1024))} MB; bu dosya sığmıyor. Yeni dosya için önce kullanmadıklarını kaldırman gerekiyor.`,
    },

    origin: "Geçersiz istek kaynağı",
    layoutReadFailed: "Sayfa verisi okunamadı; sayfayı yenile",
    layoutTooManyBlocks: (max: number) => `Sayfanda en fazla ${max} blok olabilir`,
    draftInvalid: "Taslak verisi geçersiz",
    blocksIncomplete: "Bazı bloklar tamamlanmamış",

    layoutInvalid: "Sayfa verisi geçersiz",
    profileNotFound: "Profil bulunamadı",
    layoutConflict: "Sayfa başka bir yerde güncellendi",
    layoutTooLarge: "Sayfa verisi çok büyük",
    settingsInvalid: "Ayar verisi geçersiz",
    settingsTooLarge: "Ayar verisi çok büyük",
    imageNotOnPage: "Seçilen görsel sayfanda bulunamadı",
    requestInvalid: "İstek verisi geçersiz",
    requestTooLarge: "İstek verisi çok büyük",
    publishFailed: "Sayfa yayınlanamadı",

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

    locationQueryTooLong: (max: number) => `Arama en fazla ${max} karakter olabilir`,
    locationUnavailable: "Konum servisi şu anda yanıt vermedi. Birazdan tekrar dene.",
    ayetUnavailable: "Ayet kaynağı şu anda yanıt vermedi. Birazdan tekrar dene.",
    ayetSurahUnknown: "Böyle bir sure yok. 1 ile 114 arasında bir numara ya da sure adı yaz.",
    ayetVerseOutOfRange: (surahName: string, count: number) =>
      `${surahName} suresi ${count} ayettir; bu numarada bir ayet yok.`,
    ayetQueryTooShort: (min: number) => `Arama için en az ${min} harf yaz.`,

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
