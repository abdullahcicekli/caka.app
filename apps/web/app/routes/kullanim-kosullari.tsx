// Kullanım Koşulları. Kabuk `LegalPage`, gövde metni
// `content/legal/kullanim-kosullari.ts` (U18 doldurur).
import { env } from "cloudflare:workers";
import { LEGAL_DOCUMENTS } from "@caka/shared";

import { LegalPage } from "~/components/legal-page";
import { PUBLISHED_LEGAL_DOCUMENT_IDS } from "~/content/legal";
import { kullanimKosullariSections } from "~/content/legal/kullanim-kosullari";
import { STATIC_OG_IMAGE, buildSeoMeta } from "~/lib/seo";
import { legalPlaceholderGate } from "../../server/legal";
import { getNavUser } from "../../server/nav-user";
import type { Route } from "./+types/kullanim-kosullari";

const doc = LEGAL_DOCUMENTS["kullanim-kosullari"];

export function meta({}: Route.MetaArgs) {
  return buildSeoMeta({
    title: "Kullanım Koşulları — Caka",
    description:
      "Caka'yı kullanırken geçerli olan koşullar: hesap kuralları, yasak içerik, içerik sorumluluğu ve hizmetin sınırları.",
    path: doc.path,
    // Sabit görsel: `meta()` sunucuda ve istemcide ayrı ayrı çalışır, rastgele
    // seçim `og:image`'ı hidrasyonda oynatırdı.
    image: STATIC_OG_IMAGE,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  // R33: doldurulmamış alan varsa prod'da 404 atar, dev'de uyarı döner.
  const warnings = legalPlaceholderGate(doc, kullanimKosullariSections);
  const user = await getNavUser(env, request);
  return { user, warnings, publishedLegal: PUBLISHED_LEGAL_DOCUMENT_IDS };
}

export default function KullanimKosullari({ loaderData }: Route.ComponentProps) {
  return (
    <LegalPage
      document={doc}
      sections={kullanimKosullariSections}
      warnings={loaderData.warnings}
      publishedLegal={loaderData.publishedLegal}
      user={loaderData.user}
    />
  );
}
