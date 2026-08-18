// L6: Dil önekli adreslerin tek kaynağı.
//
// Dört tüketici aynı tablodan okur — `app/routes.ts` üretimi, Worker'ın
// yönlendirme kapısı, SEO alternatifleri (hreflang) ve dil değiştirici. İkinci
// bir kaynak oluşursa diller sessizce ayrışır: bir dilde var olan bir sayfanın
// hreflang'i 404'e bağlanır ve kimse fark etmez.
//
// Türkçe sütunu **bugün yayında olan adreslerdir** (L5). Bu sütundaki bir
// değerin değişmesi yayındaki bir adresi kırar; `routes.test.ts` bunu satır
// satır sabitler.

import { DEFAULT_LOCALE, type Locale, localeFromPrefix, prefixForLocale } from "./locale";

/** Uygulama route'ları. `/:username` catch-all'u burada yoktur: dil almaz (L9). */
export const ROUTE_KEYS = [
  "home",
  "login",
  "edit",
  "dashboard",
  "ayarlar",
  "gizlilik",
  "kullanim-kosullari",
  "cerez-politikasi",
  "onboarding",
  "onboarding.tamamla",
  "onboarding.hazir",
  "onboarding.kurulum",
] as const;

export type RouteKey = (typeof ROUTE_KEYS)[number];

/**
 * Route'un dil başına yol deseni. `:` ile başlayan segment parametredir.
 * `home` her dilde boştur — dilin kökü.
 *
 * Slug'lar ASCII ve küçük harftir; aksan ve umlaut URL'de yüzdeleme kaçışına
 * yol açar (`abschliessen`, `uebersicht`).
 */
export const ROUTE_SLUGS: Record<RouteKey, Record<Locale, string>> = {
  home: { tr: "", en: "", es: "", "pt-BR": "", de: "" },
  login: {
    tr: "login",
    en: "login",
    es: "acceder",
    "pt-BR": "entrar",
    de: "anmelden",
  },
  edit: {
    tr: "edit",
    en: "edit",
    es: "editar",
    "pt-BR": "editar",
    de: "bearbeiten",
  },
  dashboard: {
    tr: "dashboard",
    en: "dashboard",
    es: "panel",
    "pt-BR": "painel",
    de: "uebersicht",
  },
  ayarlar: {
    tr: "ayarlar",
    en: "settings",
    es: "ajustes",
    "pt-BR": "configuracoes",
    de: "einstellungen",
  },
  gizlilik: {
    tr: "gizlilik",
    en: "privacy",
    es: "privacidad",
    "pt-BR": "privacidade",
    de: "datenschutz",
  },
  "kullanim-kosullari": {
    tr: "kullanim-kosullari",
    en: "terms",
    es: "terminos",
    "pt-BR": "termos",
    de: "nutzungsbedingungen",
  },
  "cerez-politikasi": {
    tr: "cerez-politikasi",
    en: "cookies",
    es: "cookies",
    "pt-BR": "cookies",
    de: "cookie-richtlinie",
  },
  onboarding: {
    tr: "onboarding",
    en: "onboarding",
    es: "bienvenida",
    "pt-BR": "bem-vindo",
    de: "willkommen",
  },
  "onboarding.tamamla": {
    tr: "onboarding/tamamla",
    en: "onboarding/finish",
    es: "bienvenida/finalizar",
    "pt-BR": "bem-vindo/concluir",
    de: "willkommen/abschliessen",
  },
  "onboarding.hazir": {
    tr: "onboarding/hazir",
    en: "onboarding/ready",
    es: "bienvenida/listo",
    "pt-BR": "bem-vindo/pronto",
    de: "willkommen/fertig",
  },
  "onboarding.kurulum": {
    tr: "onboarding/kurulum/:step",
    en: "onboarding/setup/:step",
    es: "bienvenida/configuracion/:step",
    "pt-BR": "bem-vindo/configuracao/:step",
    de: "willkommen/einrichtung/:step",
  },
};

export type RouteParams = Record<string, string>;

function segmentsOf(pattern: string): string[] {
  return pattern.split("/").filter(Boolean);
}

/** Route'un o dildeki tam yolu. Türkçe öneksizdir, kök `/` döner. */
export function pathFor(key: RouteKey, locale: Locale, params: RouteParams = {}): string {
  const filled = segmentsOf(ROUTE_SLUGS[key][locale]).map((segment) =>
    segment.startsWith(":") ? (params[segment.slice(1)] ?? segment) : segment,
  );
  const prefix = prefixForLocale(locale);
  const path = [prefix, ...filled].filter(Boolean).join("/");
  return `/${path}`;
}

export interface ParsedPath {
  locale: Locale;
  key: RouteKey;
  params: RouteParams;
}

/**
 * Bir yolu dile ve route'a çözer; uygulama route'u değilse `null`.
 *
 * Dil önekinden sonra **yalnız o dilin slug'ları** kabul edilir: `/de/privacy`
 * Almanca sayfanın adresi değildir ve 404 olmalıdır. Aksi hâlde her sayfanın
 * beş dilde beş geçerli adresi olur ve kanoniklik dağılır.
 */
export function parseLocalizedPath(pathname: string): ParsedPath | null {
  const segments = pathname.split("/").filter(Boolean);

  const prefixed = localeFromPrefix(segments[0] ?? "");
  const locale = prefixed ?? DEFAULT_LOCALE;
  const rest = prefixed ? segments.slice(1) : segments;

  for (const key of ROUTE_KEYS) {
    const pattern = segmentsOf(ROUTE_SLUGS[key][locale]);
    if (pattern.length !== rest.length) continue;

    const params: RouteParams = {};
    const matched = pattern.every((segment, index) => {
      const actual = rest[index] ?? "";
      if (segment.startsWith(":")) {
        if (!actual) return false;
        params[segment.slice(1)] = actual;
        return true;
      }
      return segment === actual;
    });

    if (matched) return { locale, key, params };
  }

  return null;
}

/**
 * Aynı sayfanın hedef dildeki adresi.
 *
 * Uygulama route'u değilse (profil sayfaları — L9) yol dilden bağımsızdır ve
 * olduğu gibi döner: dil değiştirmek kullanıcıyı bulunduğu sayfadan atmaz.
 * Sorgu dizesi ve çapa taşınmaz; çağıran gerekiyorsa kendisi ekler.
 */
export function localizePath(pathname: string, target: Locale): string {
  const parsed = parseLocalizedPath(pathname);
  if (parsed) return pathFor(parsed.key, target, parsed.params);

  const segments = pathname.split("/").filter(Boolean);
  if (localeFromPrefix(segments[0] ?? "")) segments.shift();
  return `/${segments.join("/")}`;
}

/**
 * Katalog içindeki bir bağlantıyı hedef dile çevirir.
 *
 * Kataloglar adresleri **Türkçe hâliyle** tutar (`/gizlilik`); okunur kalsın
 * ve dil boyutu her satıra sızmasın diye. Çeviri render anında burada olur.
 *
 * Dokunulmayanlar: şema taşıyan bağlantılar (`https:`, `mailto:`) ve salt
 * çapa (`#urun`). Sorgu dizesi ve çapa korunur.
 */
export function localizeHref(href: string, locale: Locale): string {
  if (!href.startsWith("/")) return href;

  const hashIndex = href.indexOf("#");
  const hash = hashIndex === -1 ? "" : href.slice(hashIndex);
  const withoutHash = hashIndex === -1 ? href : href.slice(0, hashIndex);

  const queryIndex = withoutHash.indexOf("?");
  const query = queryIndex === -1 ? "" : withoutHash.slice(queryIndex);
  const pathname = queryIndex === -1 ? withoutHash : withoutHash.slice(0, queryIndex);

  return localizePath(pathname, locale) + query + hash;
}
