// Yazı yönetimi yüzeyinin (liste + editör, U7) kullanıcıya görünen metinleri
// (Değişmez #5). Türkçe kanoniktir ve tipi verir. Sınır cümleleri sabitlerden
// türetilir (`@caka/shared`) — kural değişirse ekran metni sessizce yalan
// söylemez. Tarih biçimlemesi burada YOK: liste sayfası `yaziCatalog.date`'i
// kullanır (aynı gün anahtarı, aynı deterministik biçim).

import { MAX_POSTS_PER_PROFILE, POST_BODY_MAX_BYTES } from "@caka/shared";

const MAX_KB = POST_BODY_MAX_BYTES / 1024;

export const tr = {
  /** Panel menüsündeki giriş. */
  nav: "Yazılar",

  list: {
    title: "Yazılar",
    intro: `Profilinin altında kendi adresinde yayımlanan uzun metinler. En fazla ${MAX_POSTS_PER_PROFILE} yazın olabilir; taslaklar da sayılır.`,
    empty: "Henüz yazın yok. İlk yazını aşağıdan başlat.",
    newPost: "Yeni yazı",
    // R8: sınırda düğme kapanır ve NEDENİ yazar — sessiz engel yok.
    limitReason: `${MAX_POSTS_PER_PROFILE} yazı sınırına ulaştın. Yeni yazı için önce bir yazını silmen gerekiyor.`,
    statusDraft: "Taslak",
    statusPublished: "Yayında",
  },

  editor: {
    metaTitle: "Yazı editörü",
    backToList: "Yazılara dön",
    titlePlaceholder: "Başlık",
    bodyPlaceholder: "Yazmaya başla…",
    slugLabel: "Adres",
    slugHint: "Adres yazı ilk kez yayımlanana kadar değiştirilebilir.",
    // R18/AE9: alan kilitliyken YANINDA duran açıklama — kilit hata sanılmasın.
    slugLockedReason:
      "Yayınlanan yazının adresi, paylaşılan bağlantılar kırılmasın diye değiştirilemez.",
    slugStatus: {
      checking: "Adres denetleniyor…",
      available: "Bu adres uygun.",
      taken: "Bu adres başka bir yazında kullanılıyor.",
      too_short: "Adres en az 3 karakter olmalı.",
      too_long: "Adres en fazla 80 karakter olabilir.",
      invalid_chars: "Adres yalnız küçük harf, rakam ve tire içerebilir.",
      reserved: "Bu adres ayrılmış; başka bir adres seç.",
    },
    save: {
      // Yeni yazı henüz sunucuda yokken: otomatik kayıt neyi beklediğini söyler.
      pending: "Başlık yazınca taslak otomatik kaydedilir.",
      saving: "Kaydediliyor…",
      saved: "Kaydedildi",
      error: "Kaydedilemedi — bağlantını kontrol et. Değişikliklerin bu sekmede duruyor.",
      conflict:
        "Yazı başka bir sekmede güncellendi. Buradaki son değişiklikler kaydedilmedi — metnini kopyalamadan sayfayı yenileme.",
      unauthenticated:
        "Oturumun kapanmış görünüyor. Yeni bir sekmede giriş yap; değişikliklerin bu sekmede duruyor.",
      // R7: 50 KB aşımı SESSİZ reddedilmez — neden kaydedilmediği söylenir.
      tooLarge: `Yazı ${MAX_KB} KB sınırını aşıyor ve bu hâliyle kaydedilmiyor. Kaydetmek için içeriği kısalt.`,
    },
    /** 50 KB'a yaklaşırken görünen canlı bayt göstergesi. */
    sizeIndicator: (kb: string): string => `${kb} / ${MAX_KB} KB`,
    publish: "Yayınla",
    unpublish: "Taslağa al",
    remove: "Sil",
    removeConfirm: "Bu yazı kalıcı olarak silinsin mi?",
    viewPost: "Yazıyı aç",
    actionFailed: "İşlem tamamlanamadı; yeniden dene.",
    toolbar: {
      h2: "Başlık",
      h3: "Ara başlık",
      codeBlock: "Kod bloğu",
      image: "Görsel ekle",
    },
    imageUploadFailed: "Görsel yüklenemedi",
  },
};
