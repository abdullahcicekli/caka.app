// R31 / KTD21: Üründe kullanılan çerezlerin tek kaynağı. `/cerez-politikasi`
// tablosu bu diziden render edilir; yeni bir çerez eklendiğinde önce burası
// güncellenir, böylece politika ile gerçek arasında sessiz kayma oluşmaz.
//
// Kategori birliği bugün tek değer taşır: `zorunlu`. Üründe rıza gerektiren
// hiçbir çerez yok — analitik/pazarlama kategorileri bilinçli olarak
// tanımlanmadı (GA4 alınmadı). Böyle bir araç eklenirse birliğe yeni değer
// eklenir ve rıza akışı da o zaman kurulur.

export const COOKIE_CATEGORIES = ["zorunlu"] as const;
export type CookieCategory = (typeof COOKIE_CATEGORIES)[number];

export const COOKIE_CATEGORY_LABELS: Record<CookieCategory, string> = {
  zorunlu: "Zorunlu",
};

export const COOKIE_PARTIES = ["birinci", "üçüncü"] as const;
export type CookieParty = (typeof COOKIE_PARTIES)[number];

export const COOKIE_PARTY_LABELS: Record<CookieParty, string> = {
  birinci: "Birinci taraf",
  üçüncü: "Üçüncü taraf",
};

export type CookieEntry = {
  /** Tarayıcıda görünen ad. Prod'da `__Secure-` önekli varyantı da yazılır. */
  name: string;
  category: CookieCategory;
  /** Ne işe yaradığı; gerekiyorsa güvenlik bayrağı notunu da içerir. */
  purpose: string;
  /** İnsan okunur ömür (tablo hücresi). */
  lifetime: string;
  party: CookieParty;
  /** Üçüncü taraf çerezlerde sağlayıcı adı; birinci tarafta "Caka". */
  provider: string;
};

// Better Auth 1.6.28 varsayılanları (`advanced.cookies` yapılandırılmadı):
// - Ad kalıbı `${cookiePrefix}.${cookieName}`, önek varsayılanı "better-auth"
//   (dist/cookies/index.mjs createCookieGetter).
// - HTTPS baseURL'de ada `__Secure-` öneki eklenir; lokalde (http) eklenmez.
// - `session_token` maxAge = session.expiresIn || 7 gün (dist/cookies/index.mjs).
// - State stratejisi: `database` adapter'ı olduğu için "database" — state
//   çerezi `state`, maxAge 300 sn, imzalı (dist/state.mjs).
// - PKCE `code_verifier` ve OAuth state verisi çerezde değil, `verification`
//   tablosunda tutulur; ayrı bir PKCE/nonce çerezi yazılmaz.
// - `session_data` / `account_data` yalnız cookieCache veya storeAccountCookie
//   açıkken yazılır; ikisi de kapalı. `dont_remember` yalnız rememberMe=false
//   akışlarında yazılır; üründe yalnız sosyal giriş var.
export const COOKIE_INVENTORY = [
  {
    name: "__Secure-better-auth.session_token",
    category: "zorunlu",
    purpose:
      "Giriş yapan kullanıcının oturumunu taşır; her istekte kim olduğunu " +
      "doğrulamak için kullanılır. HttpOnly, Secure, SameSite=Lax ve imzalıdır. " +
      "Yerel geliştirmede HTTPS olmadığından ad `better-auth.session_token` olur.",
    lifetime: "7 gün",
    party: "birinci",
    provider: "Caka",
  },
  {
    name: "__Secure-better-auth.state",
    category: "zorunlu",
    purpose:
      "Google veya Apple ile girişte CSRF koruması sağlar: gidiş-dönüş " +
      "arasındaki state değerini imzalı olarak tutar ve dönüşte doğrular. " +
      "HttpOnly, Secure, SameSite=Lax; giriş tamamlanınca silinir. Yerel " +
      "geliştirmede ad `better-auth.state` olur.",
    lifetime: "5 dakika",
    party: "birinci",
    provider: "Caka",
  },
  {
    name: "caka_claim",
    category: "zorunlu",
    purpose:
      "Kayıt sırasında seçtiğin adresi, sağlayıcıya gidip dönene kadar taşır; " +
      "dönüşte adres sana bağlanır ve çerez silinir. Tarayıcıda JavaScript ile " +
      "yazıldığı için HttpOnly olamaz ve Secure bayrağı taşımaz; içinde yalnız " +
      "seçtiğin kullanıcı adı bulunur. SameSite=Lax, Path=/.",
    lifetime: "15 dakika",
    party: "birinci",
    provider: "Caka",
  },
] as const satisfies readonly CookieEntry[];

export type CookieTableRow = {
  name: string;
  category: string;
  purpose: string;
  lifetime: string;
  party: string;
  provider: string;
};

/** Envanteri politika tablosunun satırlarına çevirir (saf; sunum kararı yok). */
export function cookieTableRows(
  entries: readonly CookieEntry[] = COOKIE_INVENTORY,
): CookieTableRow[] {
  return entries.map((entry) => ({
    name: entry.name,
    category: COOKIE_CATEGORY_LABELS[entry.category],
    purpose: entry.purpose,
    lifetime: entry.lifetime,
    party: COOKIE_PARTY_LABELS[entry.party],
    provider: entry.provider,
  }));
}
