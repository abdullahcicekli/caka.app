// Ayarlar sayfasının kullanıcıya görünen tüm metni (Değişmez #5).
// Bileşenler metin gömmez; buradan okur.
//
// Adres bölümünün metni Değişmez #10'un birebir karşılığıdır: süreler
// `@caka/shared`'daki sabitlerden türetilir, böylece kural değişirse ekran
// metni sessizce yalan söylemez.
import {
  USERNAME_CHANGE_COOLDOWN_DAYS,
  USERNAME_ERROR_MESSAGES,
  USERNAME_MAX,
  USERNAME_MIN,
  USERNAME_REDIRECT_DAYS,
  formatLegalDate,
} from "@caka/shared";

/** Ayarlar bölümleri — sayfa içi gezinme ve `<section id>` kaynağı. */
export const ayarlarSections = [
  { id: "adres", label: "Adres" },
  { id: "paylasim-gorseli", label: "Paylaşım görseli" },
  { id: "hesap", label: "Hesap" },
] as const;

export type AyarlarSectionId = (typeof ayarlarSections)[number]["id"];

/** Adres değişikliği sonucu için sunucudan dönebilecek hata kimlikleri. */
export type AddressErrorId =
  | "too_short"
  | "too_long"
  | "invalid_chars"
  | "reserved"
  | "same"
  | "cooldown"
  | "taken"
  | "locked"
  | "no_profile"
  | "conflict"
  | "origin"
  | "unknown";

export const ayarlarContent = {
  title: "Ayarlar",
  sectionNavLabel: "Ayarlar bölümleri",
  saveState: {
    saving: "Kaydediliyor…",
    saved: "Kaydedildi",
    error: "Kaydedilemedi — tekrar dene",
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
    dataTitle: "Verilerin ve hesap silme",
    dataBody:
      "Hesabını silmek veya verilerinin bir kopyasını istemek şu an panelden kendi başına yapılmıyor. KVKK m.11 kapsamındaki taleplerini hello@caka.app adresine yazarsan işleme alınır.",
    dataMailLabel: "hello@caka.app",
    dataMailHref: "mailto:hello@caka.app",
    // Yalnızca belge yayındayken gösterilir (R33): yayında değilken /gizlilik
    // 404 verir ve ölü bağlantı bırakmış oluruz.
    privacyLinkLabel: "Gizlilik Metni",
    privacyLinkHref: "/gizlilik",
    privacyLinkPrefix: "Ayrıntılar:",
  },
} as const;

/** Sağlayıcı kimliği → kullanıcıya gösterilen ad. */
const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  apple: "Apple",
};

export function providerLabel(providerId: string): string {
  return PROVIDER_LABELS[providerId] ?? providerId;
}

/** `2026-09-16` → `16 Eylül 2026` (hukuki sayfalarla aynı biçim). */
export function formatAyarlarDate(isoDate: string): string {
  return formatLegalDate(isoDate);
}

export function addressCooldownNotice(availableOn: string, remainingDays: number): string {
  return `Adresini yakın zamanda değiştirdin. ${formatAyarlarDate(
    availableOn,
  )} tarihinden sonra (yaklaşık ${remainingDays} gün) yeniden değiştirebilirsin.`;
}

export function addressRedirectNotice(oldUsername: string, expiresOn: string): string {
  return `caka.app/${oldUsername} — ${formatAyarlarDate(
    expiresOn,
  )} tarihine kadar yönlendiriliyor ve kilitli.`;
}

export function addressSuccessNotice(
  previousUsername: string,
  username: string,
  expiresOn: string,
): string {
  return `Adresin caka.app/${username} oldu. caka.app/${previousUsername} adresi ${formatAyarlarDate(
    expiresOn,
  )} tarihine kadar buraya yönlendirilecek.`;
}

/** Sunucudan dönen hata kimliğini Türkçe cümleye çevirir. */
export function addressErrorMessage(error: AddressErrorId): string {
  switch (error) {
    case "too_short":
    case "too_long":
    case "invalid_chars":
    case "reserved":
      return USERNAME_ERROR_MESSAGES[error];
    case "same":
      return "Bu zaten senin adresin";
    case "cooldown":
      return `Adresini son ${USERNAME_CHANGE_COOLDOWN_DAYS} gün içinde değiştirdin; şimdilik yeniden değiştiremezsin`;
    case "taken":
      return "Bu adres dolu, başka bir tane dene";
    case "locked":
      return "Bu adres başka bir kullanıcının eski adresi ve şu an kilitli";
    case "no_profile":
      return "Profilin bulunamadı";
    case "conflict":
      return "Adresin başka bir yerde değiştirildi; sayfayı yenile";
    case "origin":
      return "Geçersiz istek kaynağı";
    default:
      return "Bir şeyler ters gitti, lütfen tekrar dene";
  }
}
