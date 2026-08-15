import type { Route } from "./+types/home";
import { Hero } from "~/components/landing/hero";
import { MinutesSection } from "~/components/landing/minutes-section";
import { Navbar } from "~/components/landing/navbar";
import { landing } from "~/content/landing";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Caka — sana göre bir bio linki" },
    {
      name: "description",
      content:
        "Instagram, TikTok ve YouTube profillerindeki tek link; paylaştığın, ürettiğin ve sattığın her şeyi bir araya getirsin.",
    },
  ];
}

export default function Home() {
  return (
    <div className="bg-kirec">
      <Navbar items={landing.nav.items} login={landing.nav.login} cta={landing.nav.cta} />
      <main>
        <Hero hero={landing.hero} />
        <MinutesSection minutes={landing.minutes} />
      </main>
    </div>
  );
}
