/**
 * Adres (username) kuralları — tek kaynak (KTD9, R2).
 * Kurallar hem istemcide (canlı kontrol) hem sunucuda (claim) uygulanır;
 * asıl benzersizlik garantisi DB unique kısıtındadır.
 */

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;

/**
 * Rezerve adresler — kapsamlı, kategorize, exact-match liste.
 * Kaynak: sektör listeleri (shouldbee/reserved-usernames, marteinn/blocklist,
 * GitHub'ın gerçek rezervleri) + bu uygulamanın route tablosu + TR karşılıklar.
 *
 * Kurallar:
 * - Eşleşme exact-match'tir (normalize sonrası); `administrator99` gibi türevler
 *   bilinçli olarak serbesttir — substring engelleme meşru adları da vurur.
 * - Tek istisna: `caka` ile BAŞLAYAN her ad marka koruması gereği rezervedir
 *   (validateUsername içindeki prefix kuralı).
 * - Yeni bir top-level route eklerken adını buraya da ekle (KTD9).
 */
const RESERVED_GROUPS: Record<string, readonly string[]> = {
  // A. Uygulama route'ları (mevcut + planlanan)
  routes: [
    "onboarding", "login", "logout", "signin", "signout", "signup", "register",
    "edit", "editor", "settings", "api", "i", "b", "belge", "og", "basla",
    "tamamla", "hazir",
    "kurulum", "dashboard", "profile", "account", "home", "index", "new",
    "search", "explore", "discover", "popular", "trending", "preview",
  ],
  // A1. Dil önekleri (L20). Bunlar top-level segment olduğu için Değişmez #1
  // kapsamındadır. `en`/`es`/`de` zaten `USERNAME_MIN`in altında kalıp
  // alınamıyor; `pt-br` beş karakterli geçerli bir desen ve gerçekten
  // çakışabilir. Dördü de burada durur ki kural gerekçeye değil listeye
  // dayansın.
  diller: ["en", "es", "pt-br", "de"],
  // A2. Ürün/pazarlama sayfaları
  product: [
    "help", "support", "docs", "blog", "status", "about", "contact", "careers",
    "jobs", "press", "brand", "store", "shop", "app", "apps", "templates",
    "themes", "examples", "features", "faq", "changelog", "roadmap",
    "community", "partners", "affiliate", "affiliates", "referral", "referrals",
    "embed", "widget", "widgets", "analytics", "stats", "insights",
    "integrations", "plugins", "marketplace", "links", "link", "bio", "page",
    "pages", "site", "sites", "public", "private", "qr-code", "shorten",
    "shortener", "url", "urls", "redirect", "socials", "media-kit", "products",
    "courses", "booking", "calendar", "events", "forms", "newsletter",
    "subscribers", "tip", "tips", "donate", "donation", "pricing",
  ],
  // B. Auth / OAuth / güvenlik
  auth: [
    "oauth", "callback", "auth", "sso", "token", "tokens", "verify",
    "verification", "2fa", "mfa", "password", "passwd", "reset", "session",
    "sessions", "webhook", "webhooks", "otp", "captcha",
  ],
  // C. E-posta / altyapı rolü taklidi
  emailRoles: [
    "admin", "administrator", "root", "postmaster", "hostmaster", "webmaster",
    "abuse", "security", "noreply", "no-reply", "mailer-daemon", "info",
    "sales", "marketing", "team", "staff", "hello", "feedback",
  ],
  // D. Subdomain/DNS (adresler ileride subdomain olursa ucuz sigorta)
  dns: [
    "www", "mail", "email", "smtp", "imap", "pop", "pop3", "ftp", "sftp",
    "ns1", "ns2", "ns3", "cdn", "static", "assets", "media", "img", "images",
    "files", "upload", "uploads", "download", "downloads", "dev", "staging",
    "test", "testing", "demo", "beta", "alpha", "prod", "production", "mobile",
    "edge", "proxy", "gateway", "vpn",
  ],
  // E. Taklit / güven / marka (caka* ayrıca prefix kuralıyla korunur)
  impersonation: [
    "official", "resmi", "verified", "real", "mod", "moderator", "ceo",
    "founder", "owner", "caka",
  ],
  // F. Ödeme & yasal
  legal: [
    "billing", "payment", "payments", "pay", "checkout", "invoice", "invoices",
    "refund", "refunds", "tax", "gdpr", "kvkk", "dmca", "copyright",
    "trademark", "subscription", "subscriptions", "plan", "plans", "upgrade",
    "downgrade", "terms", "privacy", "legal",
  ],
  // G. Saldırgan / kötüye kullanım (genişletilmiş çekirdek; uzun kuyruk şikayet akışına)
  abuse: [
    // evrensel
    "porn", "porno", "xxx", "sex", "seks", "fuck", "bitch", "cunt", "dick",
    "asshole", "whore", "slut", "nigger", "faggot", "nazi", "hitler", "rape",
    "penis", "vagina", "vajina",
    // türkçe argo (ascii biçimler)
    "amk", "amq", "aminakoyim", "amina-koyim", "amcik", "siktir", "hassiktir",
    "siktir-git", "siktirgit", "sikik", "sikko", "sikerim", "ananisikeyim",
    "yarrak", "yarak", "yarram", "orospu", "orospucocugu", "orospu-cocugu",
    "kahpe", "kaltak", "surtuk", "pust", "ibne", "ibnelik", "yavsak",
    "pezevenk", "gavat", "godos", "dallama", "serefsiz", "gotveren", "pic",
    "piclik",
  ],
  // G2. Türk siyasetinin bilinen figürleri + kurum/parti taklidi.
  // Kural: tam ad ve bilinen tekil biçimler engelli; yaygın soyadı/kelimeler
  // (ozel, gul, yildirim, yavas...) tek başına SERBESTTİR — meşru kullanıcıları vurur.
  politics: [
    // kurucu / tarihî liderler
    "ataturk", "kemalataturk", "mustafakemal", "mustafakemalataturk",
    "gazimustafakemal", "ismetinonu", "inonu", "adnanmenderes", "menderes",
    "suleymandemirel", "turgutozal", "ozal", "bulentecevit", "ecevit",
    "necmettinerbakan", "erbakan", "alparslanturkes", "turkes",
    // güncel siyaset
    "erdogan", "rterdogan", "tayyiperdogan", "receptayyiperdogan",
    "recep-tayyip-erdogan", "emineerdogan", "abdullahgul", "binaliyildirim",
    "ahmetdavutoglu", "davutoglu", "kilicdaroglu", "kemalkilicdaroglu",
    "ekremimamoglu", "imamoglu", "ozgurozel", "devletbahceli", "bahceli",
    "meralaksener", "aksener", "mansuryavas", "selahattindemirtas",
    "abdullahocalan", "ocalan", "fetullahgulen", "fethullahgulen", "feto",
    // parti / kurum / makam
    "akparti", "akp", "chp", "mhp", "iyiparti", "hdp", "demparti", "tbmm",
    "cumhurbaskani", "cumhurbaskanligi", "basbakan", "basbakanlik",
    "milletvekili", "belediyebaskani",
  ],
  // G3. Dinî kutsal varlıklar ve saygı biçimleri.
  // Kural: düz kişi adları (muhammed, ali, omer, ayse, hasan, huseyin,
  // ebubekir, osman, fatima...) SERBESTTİR — bunlar yaygın Türk isimleridir.
  // Engellenen: kutsal varlık adları, peygamber unvanları ve "hz"/"hazreti"
  // önekli her biçim (aşağıdaki RESERVED_PREFIXES kuralı; hzmuhammed,
  // hazreti-omer vb. alay/taklit vektörünü kapatır).
  religious: [
    "allah", "allahcc", "cenabiallah", "tanri", "rabbim",
    "peygamber", "peygamberimiz", "peygamberefendimiz", "prophet",
    "prophetmuhammad", "rasulullah", "resulullah", "resulallah",
    "muhammedsav", "muhammed-sav", "muhammedmustafa-sav",
    "kuran", "kurankerim", "kuranikerim", "kuran-i-kerim",
    "efendimiz-sav", "sallallahualeyhivesellem",
  ],
  // H. Türkçe karşılıklar (route/auth/yasal/altyapı)
  turkish: [
    "giris", "giris-yap", "kayit", "uye-ol", "cikis", "cikis-yap", "ayarlar",
    "hesap", "profil", "duzenle", "yardim", "destek", "destek-merkezi",
    "yardim-merkezi", "iletisim", "hakkimizda", "hakkinda", "sss",
    "sikca-sorulan-sorular", "gizlilik", "gizlilik-politikasi", "kosullar",
    "kullanim-sartlari", "kullanim-kosullari", "kullanim-kosulu", "cerez",
    "cerezler", "cerez-politikasi", "cerez-tercihleri", "cerez-tercihi",
    "fiyat", "fiyatlandirma", "sablonlar", "ornekler", "kesfet", "ara",
    "yonetici", "yonetim", "odeme", "fatura", "yasal", "basin", "kariyer",
    "magaza", "urun", "urunler",
    "uygulama", "uygulamalar", "sifre", "sifremi-unuttum", "dogrulama",
    "guvenlik", "kullanici", "kullanicilar", "uye", "uyelik", "uyelik-planlari",
    "panel", "istatistikler", "bildirimler", "mesajlar", "populer",
    "one-cikanlar", "indirim", "kampanya", "abonelik", "ekip", "bilgi",
    "satis", "pazarlama", "sikayet",
  ],
  // I. Sistem literalleri
  system: [
    "null", "undefined", "nan", "true", "false", "none", "void", "system",
    "nobody", "everybody", "everyone", "anonymous", "guest",
  ],
};

export const RESERVED_USERNAMES: ReadonlySet<string> = new Set(
  Object.values(RESERVED_GROUPS).flat(),
);

/**
 * Önek kuralları (exact-match'in tek istisnaları):
 * - `caka`: marka koruması (cakateam, caka-app…)
 * - `hz`, `hazreti`: dinî saygı önekiyle ad alma/alay vektörü (hzmuhammed,
 *   hz-ali, hazretiomer…). Düz isimler serbest kalır; meşru bir kullanıcı
 *   adının bu öneklerle başlaması pratikte görülmez.
 */
const RESERVED_PREFIXES = ["caka", "hz", "hazreti"] as const;

export type UsernameError = "too_short" | "too_long" | "invalid_chars" | "reserved";

export type UsernameResult =
  | { ok: true; username: string }
  | { ok: false; error: UsernameError };

/** Girdiyi adrese normalize eder: kırp + küçük harf (TR locale tuzağına düşmeden). */
export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase().replaceAll("ı", "i");
}

const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/** Normalize edip tüm kuralları uygular; geçerse kanonik adresi döner. */
export function validateUsername(input: string): UsernameResult {
  const username = normalizeUsername(input);
  if (username.length < USERNAME_MIN) return { ok: false, error: "too_short" };
  if (username.length > USERNAME_MAX) return { ok: false, error: "too_long" };
  if (!USERNAME_PATTERN.test(username)) return { ok: false, error: "invalid_chars" };
  if (
    RESERVED_USERNAMES.has(username) ||
    RESERVED_PREFIXES.some((prefix) => username.startsWith(prefix))
  ) {
    return { ok: false, error: "reserved" };
  }
  return { ok: true, username };
}

/* METİN BURADA DEĞİL: `UsernameError` kodları için kullanıcıya gösterilen
 * cümleler `app/content/common/*` içinde, beş dilde duruyor
 * (`common.usernameErrors`). Burada Türkçe sabitlerden oluşan bir
 * `USERNAME_ERROR_MESSAGES` vardı ve onboarding onu basıyordu — İngilizce
 * bir kullanıcı adres alırken Türkçe hata görüyordu. Paylaşılan paket
 * ÇEVİRİ TAŞIMAZ; yalnız kodu üretir, cümleyi arayüz seçer. */

/* ------------------------------------------------------------------ *
 * Adres değişikliği (Değişmez #10)
 * ------------------------------------------------------------------ */

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Eski adresin yönlendirme + kilit penceresi. Değişmez #10: 30 gün 302
 * yönlendirme, aynı süre boyunca ad kilitli (başkası alamaz).
 */
export const USERNAME_REDIRECT_DAYS = 30;

/**
 * İki adres değişikliği arasındaki bekleme. Bilerek yönlendirme penceresiyle
 * AYNI: her değişiklik 30 gün kilitli bir ad bırakır, o kilit düşmeden yeni
 * bir değişikliğe izin verilirse kullanıcı arkasında kilitli ad zinciri ve
 * kırık bağlantı yığını bırakır. Eşitlik sayesinde bir kullanıcının aynı anda
 * en fazla BİR aktif eski adresi olur ve süre dolduğunda ikisi birden serbest
 * kalır — hukuki metinde anlatılan tek pencere yeter, ikinci bir süre yok.
 */
export const USERNAME_CHANGE_COOLDOWN_DAYS = 30;

/** Değişiklik anından eski adresin yönlendirmeyi bırakacağı ana. */
export function usernameRedirectExpiresAt(changedAt: Date): Date {
  return new Date(changedAt.getTime() + USERNAME_REDIRECT_DAYS * DAY_MS);
}

/**
 * Türkiye saatinin UTC ofseti. Türkiye 2016'dan beri sabit UTC+3 kullanıyor
 * (yaz saati kaldırıldı), bu yüzden gün kesimi için zaman dilimi verisine
 * gerek yok — sabit ofset deterministik ve Worker'da bedava.
 */
const TR_OFFSET_MS = 3 * 60 * 60 * 1000;

/**
 * Kullanıcıya gösterilecek pencere tarihi (`YYYY-MM-DD`); içerik katmanı
 * Türkçe biçime bunun üzerinden çevirir.
 *
 * Düz `toISOString()` UTC gününü keser: gece 00:00–03:00 arasında yapılan bir
 * değişiklikte ekrandaki bitiş/uygunluk tarihi bir gün geri kayardı. Metin
 * Türkçe ve hukuki metnin anlattığı pencereye işaret ettiği için gün kesimi
 * Türkiye saatine göre yapılır.
 *
 * Not: aynı ofset ölçüm tarafında da (`analytics.ts` → `dayKey`) var. Bilerek
 * kopyalandı: iki alan birbirinden bağımsız evriliyor ve sabit üç saat.
 */
export function usernameWindowDayKey(date: Date): string {
  return new Date(date.getTime() + TR_OFFSET_MS).toISOString().slice(0, 10);
}

export interface UsernameChangeWindow {
  /** Şu an değiştirilebilir mi. */
  allowed: boolean;
  /** İzin verilmiyorsa değişikliğin açılacağı an; izinliyken null. */
  availableAt: Date | null;
  /** Kalan gün (yukarı yuvarlanır, en az 1); izinliyken 0. */
  remainingDays: number;
}

/**
 * Bekleme penceresi. `lastChangedAt` null ise (hiç değiştirmemiş) serbesttir.
 * Gelecek tarihli bir kayıt (saat kayması) bilerek kısıtlayıcı sayılır.
 */
export function usernameChangeWindow(
  lastChangedAt: Date | null | undefined,
  now: Date,
): UsernameChangeWindow {
  if (!lastChangedAt) return { allowed: true, availableAt: null, remainingDays: 0 };
  const availableAt = new Date(
    lastChangedAt.getTime() + USERNAME_CHANGE_COOLDOWN_DAYS * DAY_MS,
  );
  const remainingMs = availableAt.getTime() - now.getTime();
  if (remainingMs <= 0) return { allowed: true, availableAt: null, remainingDays: 0 };
  return { allowed: false, availableAt, remainingDays: Math.ceil(remainingMs / DAY_MS) };
}

/** Değişiklik yolunun saf hataları; "dolu"/"kilitli" DB'ye bakar, burada yok. */
export type UsernameChangeError = UsernameError | "same" | "cooldown";

export type UsernameChangeCheck =
  | { ok: true; username: string }
  | { ok: false; error: UsernameChangeError };

/**
 * Adres değişikliğinin DB'ye bakmayan tüm kuralları tek yerde: biçim/rezerve
 * (validateUsername), "zaten senin adresin" ve bekleme penceresi. Sunucu bunu
 * geçen adayı ayrıca doluluk/kilit için sorgular.
 */
export function checkUsernameChange(
  input: string,
  current: string,
  lastChangedAt: Date | null | undefined,
  now: Date,
): UsernameChangeCheck {
  const result = validateUsername(input);
  if (!result.ok) return result;
  if (result.username === normalizeUsername(current)) {
    return { ok: false, error: "same" };
  }
  if (!usernameChangeWindow(lastChangedAt, now).allowed) {
    return { ok: false, error: "cooldown" };
  }
  return { ok: true, username: result.username };
}
