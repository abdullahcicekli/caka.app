import type { MetaDescriptor } from "react-router";

import {
  DEFAULT_LOCALE,
  type Locale,
  OG_LOCALES,
  SUPPORTED_LOCALES,
  type RouteKey,
  pathFor,
} from "@caka/shared";

export const SITE_NAME = "Caka";
export const SITE_URL = "https://caka.app";
export const DEFAULT_DESCRIPTION =
  "Ürettiklerini, bağlantılarını ve projelerini tek bir kişisel sayfada bir araya getir.";

// Varsayılan paylaşım görseli (landing ve profil dışı sayfalar). Profil
// sayfaları kendi üretilen görselini kullanır (server/og-image.ts).
//
// TEK GÖRSEL: eskiden iki varyant (A/B) vardı ve her SSR isteğinde rastgele
// biri seçiliyordu. A kaldırıldı; marka tek bir kapakla temsil ediliyor.
const OG_IMAGE = "/og/caka-og-bento-B.png";

export type JsonLd = Record<string, unknown>;

export function absoluteSiteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

/**
 * Marka paylaşım görseli. Tek ve SABİT: adres her istekte aynı olduğu için
 * `meta()` içinden de güvenle çağrılabilir (rastgele seçim, sunucu ile
 * istemcinin farklı görsel seçmesine ve `og:image`'in hidrasyonda
 * değişmesine yol açıyordu).
 */
export const STATIC_OG_IMAGE = absoluteSiteUrl(OG_IMAGE);

/**
 * Dil alternatifleri (L14). `routeKey` verildiğinde beş dilin adresi ve
 * `x-default` (Türkçe kanonik) yayılır.
 *
 * Adresler `pathFor` ile üretilir — slug tablosuyla aynı kaynak. Elle yazılsa
 * bir slug değiştiğinde hreflang sessizce 404'e bağlanırdı.
 */
function alternateLinks(routeKey: RouteKey, params?: Record<string, string>): MetaDescriptor[] {
  const links: MetaDescriptor[] = SUPPORTED_LOCALES.map((alternate) => ({
    tagName: "link",
    rel: "alternate",
    hrefLang: alternate,
    href: absoluteSiteUrl(pathFor(routeKey, alternate, params)),
  }));

  links.push({
    tagName: "link",
    rel: "alternate",
    hrefLang: "x-default",
    href: absoluteSiteUrl(pathFor(routeKey, DEFAULT_LOCALE, params)),
  });

  return links;
}

interface SeoMetaOptions {
  title: string;
  description?: string;
  /** Sayfanın dili; `og:locale` ve alternatifler buradan türer. */
  locale?: Locale;
  /**
   * Uygulama route'u. Verilirse canonical ve beş dilin hreflang'i bundan
   * üretilir. Verilmezse (profil sayfaları — L9) yalnız `path` kullanılır ve
   * hreflang yayılmaz: o sayfanın dil sürümü yoktur.
   */
  routeKey?: RouteKey;
  routeParams?: Record<string, string>;
  path?: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "profile";
  schema?: JsonLd | JsonLd[];
}

export function buildSeoMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  locale = DEFAULT_LOCALE,
  routeKey,
  routeParams,
  path,
  image = STATIC_OG_IMAGE,
  imageAlt = `${SITE_NAME} kişisel sayfa oluşturucu`,
  type = "website",
  schema,
}: SeoMetaOptions): MetaDescriptor[] {
  const canonical = absoluteSiteUrl(
    routeKey ? pathFor(routeKey, locale, routeParams) : (path ?? "/"),
  );
  const meta: MetaDescriptor[] = [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: canonical },
    {
      name: "robots",
      content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: OG_LOCALES[locale] },
    ...SUPPORTED_LOCALES.filter((alternate) => alternate !== locale).map((alternate) => ({
      property: "og:locale:alternate",
      content: OG_LOCALES[alternate],
    })),
    { property: "og:type", content: type },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: canonical },
    { property: "og:image", content: image },
    { property: "og:image:secure_url", content: image },
    { property: "og:image:type", content: "image/png" },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: imageAlt },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
    { name: "twitter:image:alt", content: imageAlt },
  ];

  if (routeKey) meta.push(...alternateLinks(routeKey, routeParams));
  if (schema) meta.push({ "script:ld+json": schema });
  return meta;
}

export function noIndexMeta(title: string): MetaDescriptor[] {
  return [
    { title },
    { name: "robots", content: "noindex, nofollow, noarchive" },
    { name: "googlebot", content: "noindex, nofollow, noarchive" },
  ];
}
