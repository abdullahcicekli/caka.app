// Uzak görsel proxy'sinin saf kuralları (backlog #6).
//
// Proxy'nin hedef URL'si kullanıcı girdisinden gelir ve uç herkese açıktır;
// yani bu dosya bir SSRF savunmasıdır, kozmetik bir doğrulama değil. Karar
// mantığı bilinçli olarak `apps/web` yerine burada yaşıyor: `packages/shared`
// tek test edilebilir paket (bkz. AGENTS.md doğrulama beklentisi).
//
// SINIRI BİL: burada yalnız **host adı** denetlenir. `127.0.0.1.nip.io` gibi
// özel bir adrese çözülen public adlar ve kontrol ile fetch arasında A
// kaydını değiştiren DNS rebinding bu katmanla durdurulamaz — Workers
// çalışma zamanı çözülmüş IP'ye kanca vermez. Bu artık riski platformun
// taşıdığı kısıt karşılar: Worker'ın public egress'i RFC1918/loopback'e
// erişemez. Katman yine de gerekli, çünkü asıl hedef bulut metadata uçları
// ve açıkça özel adreslerdir.

import { SIGNATURE_HEX_LENGTH, hmacHex, timingSafeEqual } from "./signature";

/** Proxy'nin ziyaretçiye döndürmeyi kabul ettiği içerik tipleri.
 * SVG bilerek yok: içinde script/dış kaynak taşıyabilir.
 * ICO var: favicon'ların klasik biçimi ve `/favicon.ico` çoğu sitede bu
 * başlıkla geliyor. SVG'nin aksine salt raster bir kap, script taşımaz. */
export const PROXY_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/x-icon",
  "image/vnd.microsoft.icon",
] as const;

/** Yanıt gövdesi tavanı (proxy bunu aşan gövdeyi keser ve reddeder). */
export const PROXY_MAX_IMAGE_BYTES = 2 * 1024 * 1024;
/** Tek hop için zaman aşımı. */
export const PROXY_FETCH_TIMEOUT_MS = 5000;
/** İzin verilen yönlendirme sayısı (her hop yeniden doğrulanır). */
export const PROXY_MAX_REDIRECTS = 3;

/** `Content-Type` başlığından parametreleri atıp allowlist'e bakar. */
export function normalizeImageContentType(header: string | null): string | null {
  const value = (header ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
  return (PROXY_IMAGE_TYPES as readonly string[]).includes(value) ? value : null;
}

// Şema/host adı bazlı kara liste. IP literalleri ayrıca sayısal olarak da
// denetlenir; buradakiler ad olarak gelen özel durumlar.
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata",
  "metadata.google.internal",
  "metadata.goog",
  "instance-data",
  "instance-data.ec2.internal",
]);

const BLOCKED_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".intranet",
  ".lan",
  ".home.arpa",
  ".onion",
  ".test",
  ".invalid",
  ".localdomain",
];

/** Nokta-ondalık IPv4'ü 32 bitlik sayıya çevirir; IPv4 değilse null. */
function parseIpv4(hostname: string): number | null {
  const parts = hostname.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = value * 256 + octet;
  }
  return value;
}

// [ağ adresi, prefix uzunluğu] — RFC1918, loopback, link-local, CGNAT,
// bulut metadata (169.254.169.254 link-local içinde), belgeleme/benchmark,
// multicast ve ayrılmış bloklar.
const BLOCKED_IPV4_RANGES: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

function isBlockedIpv4(value: number): boolean {
  return BLOCKED_IPV4_RANGES.some(([network, prefix]) => {
    const base = parseIpv4(network);
    if (base === null) return false;
    // >>> 0: 32 bit maskeyi işaretsiz tut (prefix 0 durumu burada yok).
    const mask = (0xffffffff << (32 - prefix)) >>> 0;
    return ((value & mask) >>> 0) === ((base & mask) >>> 0);
  });
}

/** IPv6 literalini (köşeli parantezsiz) 8 x 16 bit gruba açar; değilse null. */
function parseIpv6(hostname: string): number[] | null {
  if (!hostname.includes(":")) return null;
  const [headText, tailText, ...rest] = hostname.split("::");
  if (rest.length > 0) return null;

  const expand = (text: string): number[] | null => {
    if (!text) return [];
    const groups: number[] = [];
    for (const piece of text.split(":")) {
      const embedded = parseIpv4(piece);
      if (embedded !== null) {
        // "::ffff:127.0.0.1" gibi gömülü IPv4 gösterimi.
        groups.push((embedded >>> 16) & 0xffff, embedded & 0xffff);
        continue;
      }
      if (!/^[0-9a-f]{1,4}$/i.test(piece)) return null;
      groups.push(Number.parseInt(piece, 16));
    }
    return groups;
  };

  const head = expand(headText ?? "");
  const tail = tailText === undefined ? [] : expand(tailText);
  if (head === null || tail === null) return null;
  if (tailText === undefined) return head.length === 8 ? head : null;
  const fill = 8 - head.length - tail.length;
  if (fill < 0) return null;
  return [...head, ...new Array<number>(fill).fill(0), ...tail];
}

function isBlockedIpv6(groups: number[]): boolean {
  const [g0, g1] = groups as [number, number, ...number[]];
  // ::/96 — belirsiz (::), loopback (::1) ve RFC 4291 m.2.5.5.1'de terk
  // edilmiş "IPv4-uyumlu" biçim (::127.0.0.1, ::169.254.169.254). Tamamı
  // kapalı: gömülü adres public görünse bile bu gösterim meşru kullanılmaz.
  if (groups.slice(0, 6).every((group) => group === 0)) return true;
  // ::ffff:a.b.c.d — IPv4 eşlemeli: gömülü adresi IPv4 kuralıyla dene.
  if (groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff) {
    return isBlockedIpv4(((groups[6]! << 16) | groups[7]!) >>> 0);
  }
  // 2002:a.b.c.d::/16 — 6to4: gömülü IPv4 kontrolü.
  if (g0 === 0x2002) {
    return isBlockedIpv4((((g1 << 16) | groups[2]!) >>> 0));
  }
  // 64:ff9b::/96 NAT64
  if (g0 === 0x0064 && g1 === 0xff9b) return true;
  // 100::/64 discard-only
  if (g0 === 0x0100 && groups.slice(1, 4).every((group) => group === 0)) return true;
  // fc00::/7 benzersiz yerel, fe80::/10 bağlantı-yerel, ff00::/8 multicast
  if ((g0 & 0xfe00) === 0xfc00) return true;
  if ((g0 & 0xffc0) === 0xfe80) return true;
  if ((g0 & 0xff00) === 0xff00) return true;
  return false;
}

/** Host adı özel/dahili bir hedefe mi işaret ediyor? */
export function isBlockedProxyHostname(rawHostname: string): boolean {
  // Sondaki nokta ("example.com.") ve köşeli parantezler atılır.
  const hostname = rawHostname.toLowerCase().replace(/\.$/, "").replace(/^\[|\]$/g, "");
  if (!hostname) return true;
  if (BLOCKED_HOSTNAMES.has(hostname)) return true;
  if (BLOCKED_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) return true;
  // Noktasız tek etiketli ad (intranet host'u) — public bir görsel olamaz.
  if (!hostname.includes(".") && !hostname.includes(":")) return true;

  const ipv4 = parseIpv4(hostname);
  if (ipv4 !== null) return isBlockedIpv4(ipv4);
  const ipv6 = parseIpv6(hostname);
  if (ipv6 !== null) return isBlockedIpv6(ipv6);
  return false;
}

export type ProxyUrlCheck =
  | { ok: true; url: string }
  | { ok: false; reason: string };

/**
 * Proxy'nin gitmesine izin verilen bir adres mi? Her yönlendirme hop'unda
 * yeniden çağrılır — ilk URL temiz olup 302 ile 169.254.169.254'e sapan
 * hedefler böyle kesilir.
 */
export function checkProxyImageUrl(raw: string): ProxyUrlCheck {
  const value = (raw ?? "").trim();
  if (!value) return { ok: false, reason: "empty" };
  if (value.length > 2048) return { ok: false, reason: "too_long" };

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, reason: "invalid" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "scheme" };
  }
  // "http://kullanici:parola@host" — kimlik bilgisi taşıyan URL'ler dahili
  // servislere karşı klasik bir SSRF taşıyıcısıdır.
  if (url.username || url.password) return { ok: false, reason: "credentials" };
  // Yalnız varsayılan portlar: 8080/6379/22 gibi dahili servis portları kapalı.
  if (url.port && url.port !== "80" && url.port !== "443") {
    return { ok: false, reason: "port" };
  }
  if (isBlockedProxyHostname(url.hostname)) return { ok: false, reason: "host" };
  return { ok: true, url: url.toString() };
}

// ————————————————————————————————————————————————————————————————
// İmza (backlog U29 kalıntısı)
//
// NEDEN: `/api/gorsel?u=` kimlik doğrulamasızdır ve doğrulamasız kalmalıdır —
// ziyaretçi oturum açmaz. İmzasız bırakılırsa uç, herkesin kullanabileceği
// bedava bir görsel CDN'idir (Caka'nın hesabından çıkan bant genişliği,
// Caka'nın IP'sinden çıkan istekler). HMAC, "bu adresi Caka üretti"
// iddiasını taşır; gizlilik değil, kullanım yetkisi sağlar.
// ————————————————————————————————————————————————————————————————

/** İmzanın taşındığı sorgu parametresi. */
export const PROXY_SIGNATURE_PARAM = "s";
/** Geriye uyum: imza uzunluğu artık ortak ilkellerde tanımlı. */
export const PROXY_SIGNATURE_HEX_LENGTH = SIGNATURE_HEX_LENGTH;

/**
 * Kanonik adresin HMAC-SHA256 imzası.
 *
 * İmza HAM kullanıcı girdisi üzerinde değil, `checkProxyImageUrl`'ün
 * ürettiği KANONİK adres üzerinde hesaplanır: proxy de doğrulamadan önce
 * aynı kanonikleştirmeyi yapar, yoksa "https://a.com/x" ile
 * "https://a.com:443/x" farklı imzalar üretirdi.
 */
function signCanonical(canonicalUrl: string, secret: string): Promise<string> {
  return hmacHex(canonicalUrl, secret);
}

/**
 * Uzak görselin ziyaretçiye sunulacağı birinci taraf adresi.
 *
 * `signature` verilmediğinde imzasız adres üretir; proxy bunu REDDEDER.
 * Çağrı yollarının doğrusu `signedRemoteImageProxyPath`'tir — bu imza yalnız
 * önbellek anahtarı gibi iç kullanımlar ve testler içindir.
 */
export function remoteImageProxyPath(url: string, signature?: string): string {
  const base = `/api/gorsel?u=${encodeURIComponent(url)}`;
  return signature ? `${base}&${PROXY_SIGNATURE_PARAM}=${signature}` : base;
}

/**
 * İmzalı proxy adresi. Adres proxy'lenemiyorsa ya da sır tanımsızsa null
 * döner — çağıran taraf o zaman önizlemesiz (tasarlanmış) kartı gösterir.
 */
export async function signedRemoteImageProxyPath(
  url: string,
  secret: string,
): Promise<string | null> {
  if (!secret) return null;
  const checked = checkProxyImageUrl(url);
  if (!checked.ok) return null;
  return remoteImageProxyPath(checked.url, await signCanonical(checked.url, secret));
}

/** Proxy'nin kapıda yaptığı doğrulama; `canonicalUrl` = `checkProxyImageUrl().url`. */
export async function verifyRemoteImageSignature(
  canonicalUrl: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  if (!secret || !signature) return false;
  return timingSafeEqual(signature, await signCanonical(canonicalUrl, secret));
}
