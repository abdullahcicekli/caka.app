import { count, desc, isNotNull } from "drizzle-orm";
import { Hono } from "hono";

import { createDb, profile } from "@caka/db";
import {
  DEFAULT_LOCALE,
  type Locale,
  ROUTE_KEYS,
  SUPPORTED_LOCALES,
  type RouteKey,
  pathFor,
} from "@caka/shared";
import { PUBLISHED_LEGAL_DOCUMENT_IDS } from "../app/content/legal";
import { SITE_URL } from "../app/lib/seo";

const SITEMAP_PAGE_SIZE = 45_000;
const XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
  "X-Content-Type-Options": "nosniff",
};
const TEXT_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
  "X-Content-Type-Options": "nosniff",
};

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
      "'": "&apos;",
    };
    return entities[character] ?? character;
  });
}

interface SitemapEntry {
  loc: string;
  lastmod?: Date;
  /** Sayfanın diğer dillerdeki adresleri (L16). */
  alternates?: { locale: Locale | "x-default"; href: string }[];
}

function urlset(entries: SitemapEntry[]): string {
  const urls = entries
    .map(({ loc, lastmod, alternates }) => {
      const links = (alternates ?? [])
        .map(
          (alternate) =>
            `<xhtml:link rel="alternate" hreflang="${alternate.locale}" href="${escapeXml(alternate.href)}"/>`,
        )
        .join("");
      return `  <url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${lastmod.toISOString()}</lastmod>` : ""}${links}</url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
}

/**
 * Bir route'un beş dildeki girdisi (L16). Her girdi bütün dilleri
 * `xhtml:link` ile gösterir; arama motoru sürümleri birbirine bağlayabilsin.
 */
function localizedEntries(key: RouteKey): SitemapEntry[] {
  const alternates = [
    ...SUPPORTED_LOCALES.map((locale) => ({
      locale,
      href: `${SITE_URL}${pathFor(key, locale)}`,
    })),
    { locale: "x-default" as const, href: `${SITE_URL}${pathFor(key, DEFAULT_LOCALE)}` },
  ];
  return SUPPORTED_LOCALES.map((locale) => ({
    loc: `${SITE_URL}${pathFor(key, locale)}`,
    alternates,
  }));
}

function sitemapIndex(locations: string[]): string {
  const entries = locations
    .map((loc) => `  <sitemap><loc>${escapeXml(loc)}</loc></sitemap>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>\n`;
}

/**
 * Taramaya kapalı uygulama alanları. Dil önekli karşılıkları da yazılır (L16):
 * `/edit` kapalıyken `/de/bearbeiten` açık kalırsa aynı özel alan başka bir
 * adresten indekslenir.
 */
const PRIVATE_ROUTE_KEYS: RouteKey[] = [
  "edit",
  "login",
  "dashboard",
  "ayarlar",
  "onboarding",
  "onboarding.tamamla",
  "onboarding.hazir",
  "onboarding.kurulum",
];

function disallowPaths(): string[] {
  const paths = new Set<string>(["/api/"]);
  for (const key of PRIVATE_ROUTE_KEYS) {
    for (const locale of SUPPORTED_LOCALES) {
      // Parametreli yolun kök segmenti yeterli: `/onboarding/kurulum` altındaki
      // her adım kapanır.
      paths.add(pathFor(key, locale).replace(/\/:.*$/, ""));
    }
  }
  return [...paths].sort();
}

function crawlerRules(userAgent: string): string {
  return [
    `User-agent: ${userAgent}`,
    "Allow: /",
    ...disallowPaths().map((path) => `Disallow: ${path}`),
  ].join("\n");
}

export const seoRoutes = new Hono<{ Bindings: Env }>();

seoRoutes.get("/sitemap.xml", async (c) => {
  const db = createDb(c.env.DB);
  const [row] = await db
    .select({ value: count() })
    .from(profile)
    .where(isNotNull(profile.onboardingCompletedAt));
  const profileCount = row?.value ?? 0;
  const pages = Math.ceil(profileCount / SITEMAP_PAGE_SIZE);
  const locations = [`${SITE_URL}/sitemaps/core.xml`];
  for (let page = 1; page <= pages; page += 1) {
    locations.push(`${SITE_URL}/sitemaps/profiles-${page}.xml`);
  }
  return c.body(sitemapIndex(locations), 200, XML_HEADERS);
});

// Hukuki yollar elle yazılmaz: künyeden türetilir (yeniden adlandırılan bir
// route sitemap'te 404 bırakamaz) ve yalnız yayındaki belgeler listelenir —
// R33 kapısının 404'lediği bir belgeyi arama motoruna göndermek yanlış.
seoRoutes.get("/sitemaps/core.xml", (c) => {
  const keys: RouteKey[] = ["home", ...PUBLISHED_LEGAL_DOCUMENT_IDS];
  return c.body(urlset(keys.flatMap(localizedEntries)), 200, XML_HEADERS);
});

seoRoutes.get("/sitemaps/profiles-*", async (c) => {
  const pageMatch = c.req.path.match(/^\/sitemaps\/profiles-(\d+)\.xml$/);
  const page = Number(pageMatch?.[1]);
  if (!Number.isInteger(page) || page < 1) return c.notFound();

  const rows = await createDb(c.env.DB)
    .select({ username: profile.username, updatedAt: profile.updatedAt })
    .from(profile)
    .where(isNotNull(profile.onboardingCompletedAt))
    .orderBy(desc(profile.updatedAt))
    .limit(SITEMAP_PAGE_SIZE)
    .offset((page - 1) * SITEMAP_PAGE_SIZE);
  if (rows.length === 0) return c.notFound();

  return c.body(
    urlset(
      rows.map((row) => ({
        loc: `${SITE_URL}/${encodeURIComponent(row.username)}`,
        lastmod: row.updatedAt,
      })),
    ),
    200,
    XML_HEADERS,
  );
});

seoRoutes.get("/robots.txt", (c) => {
  const rules = [
    crawlerRules("*"),
    crawlerRules("OAI-SearchBot"),
    crawlerRules("GPTBot"),
    crawlerRules("ChatGPT-User"),
    crawlerRules("ClaudeBot"),
    crawlerRules("PerplexityBot"),
    `Sitemap: ${SITE_URL}/sitemap.xml`,
  ].join("\n\n");
  return c.body(`${rules}\n`, 200, TEXT_HEADERS);
});

seoRoutes.get("/llms.txt", (c) => {
  const document = `# Caka

> Caka, insanların bağlantılarını, ürettiklerini ve projelerini tek bir kişisel sayfada toplamasını sağlayan bir platformdur.

Caka'daki tamamlanmış kullanıcı profilleri herkese açık sayfalardır. Editör, giriş ve kurulum yolları özel uygulama alanlarıdır; kaynak veya alıntı hedefi olarak kullanılmamalıdır.

## Ana kaynaklar

- [Caka](${SITE_URL}/): Ürün ve platform hakkında genel bilgi.
- [Sitemap](${SITE_URL}/sitemap.xml): Yayındaki kullanıcı profillerinin güncel ve makine tarafından okunabilir dizini.
- [Robots kuralları](${SITE_URL}/robots.txt): Tarama izinleri ve özel alanlar.

## Kullanıcı profilleri

- Her public profil \`${SITE_URL}/{kullanici-adi}\` biçimindedir.
- Profil sahibinin adı, açıklaması, görseli ve seçtiği dış bağlantılar sayfanın birincil içeriğidir.
- Profil içeriği kullanıcılar tarafından oluşturulur ve zaman içinde değişebilir; alıntı yaparken profil URL'sini kaynak gösterin.

## Tarama notları

- Yalnızca sitemap'te yer alan tamamlanmış profilleri keşif kaynağı olarak tercih edin.
- \`/api/\` ile editör, giriş, panel, ayarlar ve kurulum yollarını (her dildeki karşılıklarıyla birlikte) taramayın; tam liste \`robots.txt\`tedir.
- Site beş dilde yayındadır: Türkçe (öneksiz, kanonik), İngilizce (/en), İspanyolca (/es), Portekizce (/pt-br) ve Almanca (/de).\n- Kullanıcı profilleri dil öneki taşımaz; her profilin tek kanonik adresi vardır.
`;
  return c.body(document, 200, TEXT_HEADERS);
});
