import { count, desc, isNotNull } from "drizzle-orm";
import { Hono } from "hono";

import { createDb, profile } from "@caka/db";
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

function urlset(entries: Array<{ loc: string; lastmod?: Date }>): string {
  const urls = entries
    .map(
      ({ loc, lastmod }) =>
        `  <url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${lastmod.toISOString()}</lastmod>` : ""}</url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function sitemapIndex(locations: string[]): string {
  const entries = locations
    .map((loc) => `  <sitemap><loc>${escapeXml(loc)}</loc></sitemap>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>\n`;
}

function crawlerRules(userAgent: string): string {
  return [
    `User-agent: ${userAgent}`,
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /edit",
    "Disallow: /login",
    "Disallow: /onboarding",
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

seoRoutes.get("/sitemaps/core.xml", (c) =>
  c.body(
    urlset([
      { loc: `${SITE_URL}/` },
      { loc: `${SITE_URL}/gizlilik` },
      { loc: `${SITE_URL}/kullanim-kosullari` },
      { loc: `${SITE_URL}/cerez-politikasi` },
    ]),
    200,
    XML_HEADERS,
  ),
);

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
- \`/api/\`, \`/edit\`, \`/login\` ve \`/onboarding\` yollarını taramayın.
- Site dili ağırlıklı olarak Türkçedir.
`;
  return c.body(document, 200, TEXT_HEADERS);
});
