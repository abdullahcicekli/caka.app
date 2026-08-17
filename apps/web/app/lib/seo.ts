import type { MetaDescriptor } from "react-router";

export const SITE_NAME = "Caka";
export const SITE_URL = "https://caka.app";
export const DEFAULT_DESCRIPTION =
  "Ürettiklerini, bağlantılarını ve projelerini tek bir kişisel sayfada bir araya getir.";

// Varsayılan paylaşım görselleri (landing ve profil dışı sayfalar). Profil
// sayfaları kendi üretilen görselini kullanır (server/og-image.ts).
const OG_IMAGES = ["/og/caka-og-bento-A.png", "/og/caka-og-bento-B.png"] as const;

export type JsonLd = Record<string, unknown>;

export function absoluteSiteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

/**
 * Sabit marka paylaşım görseli. `pickRandomOgImage()` her çağrıda başka bir
 * görsel seçtiği için `meta()` içinden çağrılamaz: sunucu ve istemci bağımsız
 * seçer, `og:image` hidrasyonda değişir. Pazarlama dışı sayfalar (hukuki
 * metinler) çeşitlemeden fayda görmez; sabit görsel hem deterministik hem de
 * loader'dan veri taşımayı gerektirmez.
 */
export const STATIC_OG_IMAGE = absoluteSiteUrl(OG_IMAGES[0]);

/**
 * Her SSR meta isteğinde başka bir varsayılan paylaşım görseli seçer. Sosyal
 * ağların aynı sayfa URL'si için tuttuğu cache'i ayırmak üzere kısa bir sürüm
 * anahtarı da eklenir.
 */
export function pickRandomOgImage(): string {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  const value = values[0] ?? 0;
  const image = OG_IMAGES[value % OG_IMAGES.length];
  return `${absoluteSiteUrl(image)}?v=${value.toString(36)}`;
}

interface SeoMetaOptions {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "profile";
  schema?: JsonLd | JsonLd[];
}

export function buildSeoMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  image = pickRandomOgImage(),
  imageAlt = `${SITE_NAME} kişisel sayfa oluşturucu`,
  type = "website",
  schema,
}: SeoMetaOptions): MetaDescriptor[] {
  const canonical = absoluteSiteUrl(path);
  const meta: MetaDescriptor[] = [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: canonical },
    {
      name: "robots",
      content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: "tr_TR" },
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
