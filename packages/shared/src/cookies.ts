// R31 / KTD21: Ziyaretçinin cihazına yazılan her şeyin tek kaynağı.
// `/cerez-politikasi` tablosu bu diziden render edilir; yeni bir girdi
// eklendiğinde önce burası güncellenir, böylece politika ile gerçek arasında
// sessiz kayma oluşmaz.
//
// Envanter yalnız çerezleri değil, cihazda yer tutan diğer depolama
// girdilerini de kapsar (`storage` alanı). KVKK çerez rehberi cihaza erişimi
// teknolojiden bağımsız değerlendirir; `sessionStorage`'a yazılan bir girdiyi
// tablonun dışında bırakmak, DevTools'u açan okuyucuya karşı sessiz kayma
// olurdu.
//
// Çerez dışı girdiler İDDİA EDİLMEDİ, derlenmiş istemci paketinde arandı:
// `pnpm --filter @caka/web build` sonrası `build/client/assets` altında
// `sessionStorage`/`localStorage` çağrıları taranıp anahtar adları okundu.
// Bugün React Router iki anahtar yazabiliyor ve ikisi de aşağıda:
// `react-router-scroll-positions` ile `react-router-manifest-version`.
// Üçüncü bir aday (`remix-router-transitions`) pakette duruyor ama yalnızca
// `viewTransition` seçeneği kullanıldığında yazılıyor; uygulamanın kaynağında
// bu seçeneğe yapılmış tek bir çağrı yok, bu yüzden envantere alınmadı —
// kullanılmaya başlanırsa girdi de eklenir.
//
// Kategori birliği bugün tek değer taşır: `zorunlu`. Üründe rıza gerektiren
// hiçbir girdi yok — analitik/pazarlama kategorileri bilinçli olarak
// tanımlanmadı (GA4 alınmadı). Ziyaret ölçümü çerezsizdir ve cihaza hiçbir şey
// yazmaz: zone genelindeki Cloudflare Web Analytics de, panel için tutulan
// birinci taraf sayaçlar da (R48) yalnızca sunucu tarafında toplar. Rıza
// gerektiren bir araç eklenirse birliğe yeni değer eklenir ve rıza akışı da o
// zaman kurulur.

export const COOKIE_CATEGORIES = ["zorunlu"] as const;
export type CookieCategory = (typeof COOKIE_CATEGORIES)[number];

export const COOKIE_CATEGORY_LABELS: Record<CookieCategory, string> = {
  zorunlu: "Zorunlu",
};

/**
 * Girdinin cihazda nerede durduğu. Varsayılan `cookie`.
 *
 * Birlik, AGENTS.md'nin envantere girmesini şart koştuğu her depolama türünü
 * karşılar (çerez, `localStorage`, `sessionStorage`, IndexedDB). Bugün yalnız
 * ikisi kullanılıyor; kalanlar burada duruyor ki doğru olanı yapan katkıcı tip
 * hatasına çarpıp girdisini yanlış türle etiketlemek zorunda kalmasın.
 */
export const COOKIE_STORAGE_KINDS = [
  "cookie",
  "localStorage",
  "sessionStorage",
  "indexedDB",
] as const;
export type CookieStorageKind = (typeof COOKIE_STORAGE_KINDS)[number];

export const COOKIE_STORAGE_LABELS: Record<CookieStorageKind, string> = {
  cookie: "Çerez",
  localStorage: "localStorage",
  sessionStorage: "sessionStorage",
  indexedDB: "IndexedDB",
};

export const DEFAULT_COOKIE_STORAGE: CookieStorageKind = "cookie";

export const COOKIE_PARTIES = ["birinci", "üçüncü"] as const;
export type CookieParty = (typeof COOKIE_PARTIES)[number];

export const COOKIE_PARTY_LABELS: Record<CookieParty, string> = {
  birinci: "Birinci taraf",
  üçüncü: "Üçüncü taraf",
};

export type CookieEntry = {
  /** Tarayıcıda görünen ad. Prod'da `__Secure-` önekli varyantı da yazılır. */
  name: string;
  /** Cihazda nerede durduğu; yazılmazsa `cookie` sayılır. */
  storage?: CookieStorageKind;
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
  // Çerez değil: React Router'ın `<ScrollRestoration />` bileşeni
  // (`apps/web/app/root.tsx`) sekmeye özel `sessionStorage` alanına yazar.
  // Girdi tarayıcıda gözle görülür, bu yüzden envanterde durur.
  {
    name: "react-router-scroll-positions",
    storage: "sessionStorage",
    category: "zorunlu",
    purpose:
      "Sayfalar arasında gezinirken kaydırma konumunu tutar; geri tuşuna " +
      "bastığında sayfa başa atlamak yerine kaldığın yere döner. İçinde " +
      "yalnızca piksel değerleri bulunur — kimlik, ad veya başka bir kişisel " +
      "veri taşımaz. Sunucuya gönderilmez; sekmeye özeldir.",
    lifetime: "Sekmeyi kapatınca silinir",
    party: "birinci",
    provider: "Caka",
  },
  // Çerez değil: React Router'ın rota keşfi (lazy route discovery), sitenin
  // yeni bir sürümü yayınlandığında bunu fark edip sayfayı bir kez yeniler.
  // Sonsuz yenileme döngüsüne girmemek için hangi sürüm için yenilediğini
  // sekmeye özel `sessionStorage` alanına yazar. Ad, kurulu paketin derlenmiş
  // istemci paketinden okunarak doğrulandı (`react-router-manifest-version`),
  // varsayılmadı. Yalnızca yayın sırasında açık kalmış bir sekmede oluşur ve
  // yenileme başarılıysa hemen silinir — ama oluştuğu an cihazda durur, bu
  // yüzden envanterde yeri var (KTD21).
  {
    name: "react-router-manifest-version",
    storage: "sessionStorage",
    category: "zorunlu",
    purpose:
      "Sitenin yeni bir sürümü yayınlandığında, o sırada açık olan sekmenin " +
      "eski sürümde takılı kalmaması için sayfa bir kez yenilenir. Bu girdi " +
      "yalnızca hangi sürüm için yenilendiğini tutar, böylece yenileme " +
      "döngüye girmez. İçinde bir sürüm etiketi vardır — kimlik, ad veya " +
      "başka bir kişisel veri taşımaz. Sunucuya gönderilmez; sekmeye " +
      "özeldir ve ancak yayın anında açık olan sekmelerde oluşur.",
    lifetime: "Yenileme başarılı olunca silinir; en geç sekmeyi kapatınca",
    party: "birinci",
    provider: "Caka",
  },
] as const satisfies readonly CookieEntry[];

export type CookieTableRow = {
  name: string;
  storage: string;
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
    storage: COOKIE_STORAGE_LABELS[entry.storage ?? DEFAULT_COOKIE_STORAGE],
    category: COOKIE_CATEGORY_LABELS[entry.category],
    purpose: entry.purpose,
    lifetime: entry.lifetime,
    party: COOKIE_PARTY_LABELS[entry.party],
    provider: entry.provider,
  }));
}
