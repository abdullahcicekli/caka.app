// Kullanım Koşulları. Kabuk `LegalPage`, gövde metni `content/legal/{tr,en}/kullanim-kosullari.ts`.
//
// Bölümler `loaderData` ile taşınır, doğrudan import EDİLMEZ (L13): iki dilin
// metnini birden import etmek ~90 KB hukuki metni istemci paketine düşürürdü.
import { env } from "cloudflare:workers";
import { DEFAULT_LOCALE, LEGAL_DOCUMENTS } from "@caka/shared";

import { LegalPage } from "~/components/legal-page";
import { legalSections, publishedLegalDocumentIds } from "~/content/legal";
import { legalDescription, legalTitles } from "~/content/legal/meta";
import { STATIC_OG_IMAGE, buildSeoMeta } from "~/lib/seo";
import { legalPlaceholderGate } from "../../server/legal";
import { localeFromRequest } from "../../server/locale";
import { getNavUser } from "../../server/nav-user";
import type { Route } from "./+types/kullanim-kosullari";

const DOC_ID = "kullanim-kosullari" as const;
const doc = LEGAL_DOCUMENTS["kullanim-kosullari"];

export function meta({ loaderData }: Route.MetaArgs) {
  const locale = loaderData?.locale ?? DEFAULT_LOCALE;
  return buildSeoMeta({
    title: `${legalTitles(locale, DOC_ID).title} — Caka`,
    description: legalDescription(locale, DOC_ID),
    locale,
    routeKey: DOC_ID,
    // Sabit görsel: `meta()` sunucuda ve istemcide ayrı ayrı çalışır, rastgele
    // seçim `og:image`'ı hidrasyonda oynatırdı.
    image: STATIC_OG_IMAGE,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  const locale = localeFromRequest(request);
  const sections = legalSections(locale, DOC_ID);
  // R33/L12: o dilde doldurulmamış alan varsa prod'da 404 atar, dev'de uyarır.
  const warnings = legalPlaceholderGate(locale, doc, sections);
  const user = await getNavUser(env, request);
  return {
    user,
    warnings,
    sections,
    locale,
    titles: legalTitles(locale, DOC_ID),
    publishedLegal: publishedLegalDocumentIds(locale),
  };
}

export default function KullanimKosullari({ loaderData }: Route.ComponentProps) {
  return (
    <LegalPage
      document={doc}
      titles={loaderData.titles}
      sections={loaderData.sections}
      warnings={loaderData.warnings}
      publishedLegal={loaderData.publishedLegal}
      user={loaderData.user}
    />
  );
}
