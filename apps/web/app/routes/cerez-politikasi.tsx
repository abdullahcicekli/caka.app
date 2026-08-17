// Çerez Politikası. Şimdilik iskelet: gövde metni U19'da gelir.
import { Navbar } from "~/components/landing/navbar";
import { SiteFooter } from "~/components/landing/site-footer";
import { landing } from "~/content/landing";
import { buildSeoMeta } from "~/lib/seo";
import type { Route } from "./+types/cerez-politikasi";

export function meta({}: Route.MetaArgs) {
  return buildSeoMeta({
    title: "Çerez Politikası — Caka",
    description:
      "Caka'nın kullandığı çerezler: adı, amacı, kategorisi, süresi ve birinci/üçüncü taraf bilgisi.",
    path: "/cerez-politikasi",
  });
}

export default function CerezPolitikasi() {
  return (
    <div className="bg-kirec">
      <Navbar items={landing.nav.items} login={landing.nav.login} cta={landing.nav.cta} />
      <main className="mx-auto max-w-3xl px-6 py-20 sm:px-10">
        <h1 className="text-3xl font-semibold text-murekkep sm:text-4xl">
          Çerez Politikası
        </h1>
        <p className="mt-6 text-lg text-murekkep/70">
          Bu sayfanın metni hazırlanıyor.
        </p>
      </main>
      <SiteFooter footer={landing.footer} />
    </div>
  );
}
