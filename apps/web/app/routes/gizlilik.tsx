// Aydınlatma ve Gizlilik Metni. Kabuk `LegalPage`, gövde metni
// `content/legal/gizlilik.ts` (U17 doldurur).
import { env } from "cloudflare:workers";
import { LEGAL_DOCUMENTS } from "@caka/shared";

import { LegalPage, legalPlaceholderGate } from "~/components/legal-page";
import { gizlilikSections } from "~/content/legal/gizlilik";
import { buildSeoMeta } from "~/lib/seo";
import { getNavUser } from "../../server/nav-user";
import type { Route } from "./+types/gizlilik";

const doc = LEGAL_DOCUMENTS.gizlilik;

export function meta({}: Route.MetaArgs) {
  return buildSeoMeta({
    title: "Gizlilik ve Aydınlatma Metni — Caka",
    description:
      "Caka'da kişisel verilerinin nasıl işlendiğini, hangi amaçlarla toplandığını ve haklarını açıklayan aydınlatma ve gizlilik metni.",
    path: doc.path,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  // R33: doldurulmamış alan varsa prod'da 404 atar, dev'de uyarı döner.
  const warnings = legalPlaceholderGate(doc, gizlilikSections);
  const user = await getNavUser(env, request);
  return { user, warnings };
}

export default function Gizlilik({ loaderData }: Route.ComponentProps) {
  return (
    <LegalPage
      document={doc}
      sections={gizlilikSections}
      warnings={loaderData.warnings}
      user={loaderData.user}
    />
  );
}
