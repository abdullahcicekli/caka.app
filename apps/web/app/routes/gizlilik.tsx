// Aydınlatma ve Gizlilik Metni. Şimdilik iskelet: gövde metni U17'de gelir.
import { Navbar } from "~/components/landing/navbar";
import { SiteFooter } from "~/components/landing/site-footer";
import { landing } from "~/content/landing";
import { buildSeoMeta } from "~/lib/seo";
import type { Route } from "./+types/gizlilik";

export function meta({}: Route.MetaArgs) {
  return buildSeoMeta({
    title: "Gizlilik ve Aydınlatma Metni — Caka",
    description:
      "Caka'da kişisel verilerinin nasıl işlendiğini, hangi amaçlarla toplandığını ve haklarını açıklayan aydınlatma ve gizlilik metni.",
    path: "/gizlilik",
  });
}

export default function Gizlilik() {
  return (
    <div className="bg-kirec">
      <Navbar items={landing.nav.items} login={landing.nav.login} cta={landing.nav.cta} />
      <main className="mx-auto max-w-3xl px-6 py-20 sm:px-10">
        <h1 className="text-3xl font-semibold text-murekkep sm:text-4xl">
          Gizlilik ve Aydınlatma Metni
        </h1>
        <p className="mt-6 text-lg text-murekkep/70">
          Bu sayfanın metni hazırlanıyor.
        </p>
      </main>
      <SiteFooter footer={landing.footer} />
    </div>
  );
}
