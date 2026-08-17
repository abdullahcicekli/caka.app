// Çerez Politikası. Kabuk `LegalPage`, gövde metni
// `content/legal/cerez-politikasi.ts` (U19 doldurur).
import { env } from "cloudflare:workers";
import { LEGAL_DOCUMENTS } from "@caka/shared";

import { LegalPage, legalPlaceholderGate } from "~/components/legal-page";
import { cerezPolitikasiSections } from "~/content/legal/cerez-politikasi";
import { buildSeoMeta } from "~/lib/seo";
import { getNavUser } from "../../server/nav-user";
import type { Route } from "./+types/cerez-politikasi";

const doc = LEGAL_DOCUMENTS["cerez-politikasi"];

export function meta({}: Route.MetaArgs) {
  return buildSeoMeta({
    title: "Çerez Politikası — Caka",
    description:
      "Caka'nın kullandığı çerezler: adı, amacı, kategorisi, süresi ve birinci/üçüncü taraf bilgisi.",
    path: doc.path,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  // R33: doldurulmamış alan varsa prod'da 404 atar, dev'de uyarı döner.
  const warnings = legalPlaceholderGate(doc, cerezPolitikasiSections);
  const user = await getNavUser(env, request);
  return { user, warnings };
}

export default function CerezPolitikasi({ loaderData }: Route.ComponentProps) {
  return (
    <LegalPage
      document={doc}
      sections={cerezPolitikasiSections}
      warnings={loaderData.warnings}
      user={loaderData.user}
    />
  );
}
