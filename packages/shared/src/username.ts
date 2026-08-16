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
    "edit", "editor", "settings", "api", "i", "og", "basla", "tamamla", "hazir",
    "kurulum", "dashboard", "profile", "account", "home", "index", "new",
    "search", "explore", "discover", "popular", "trending", "preview",
  ],
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
  // G. Saldırgan / kötüye kullanım (kısa çekirdek; uzun kuyruk şikayet akışına)
  abuse: [
    "porn", "xxx", "sex", "fuck", "nigger", "faggot", "nazi", "rape",
    "amk", "siktir", "yarrak", "orospu", "ibne", "pezevenk", "gavat", "pic",
  ],
  // H. Türkçe karşılıklar (route/auth/yasal/altyapı)
  turkish: [
    "giris", "giris-yap", "kayit", "uye-ol", "cikis", "cikis-yap", "ayarlar",
    "hesap", "profil", "duzenle", "yardim", "destek", "destek-merkezi",
    "yardim-merkezi", "iletisim", "hakkimizda", "hakkinda", "sss",
    "sikca-sorulan-sorular", "gizlilik", "gizlilik-politikasi", "kosullar",
    "kullanim-sartlari", "cerez", "cerezler", "fiyat", "fiyatlandirma",
    "sablonlar", "ornekler", "kesfet", "ara", "yonetici", "yonetim", "odeme",
    "fatura", "yasal", "basin", "kariyer", "magaza", "urun", "urunler",
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

/** Marka koruması: `caka` ile başlayan her ad rezervedir (cakateam, caka-app…). */
const BRAND_PREFIX = "caka";

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
  if (RESERVED_USERNAMES.has(username) || username.startsWith(BRAND_PREFIX)) {
    return { ok: false, error: "reserved" };
  }
  return { ok: true, username };
}

export const USERNAME_ERROR_MESSAGES: Record<UsernameError, string> = {
  too_short: `En az ${USERNAME_MIN} karakter olmalı`,
  too_long: `En fazla ${USERNAME_MAX} karakter olabilir`,
  invalid_chars: "Yalnızca küçük harf, rakam ve tire; başta/sonda tire olamaz",
  reserved: "Bu adres kullanılamaz",
};
