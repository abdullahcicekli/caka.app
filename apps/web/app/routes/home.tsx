import { env } from "cloudflare:workers";

import type { Route } from "./+types/home";
import { AudienceSection } from "~/components/landing/audience-section";
import { CtaSection } from "~/components/landing/cta-section";
import { FaqSection } from "~/components/landing/faq-section";
import { Hero } from "~/components/landing/hero";
import { MinutesSection } from "~/components/landing/minutes-section";
import { Navbar } from "~/components/landing/navbar";
import { ProofSection } from "~/components/landing/proof-section";
import { QuoteSection } from "~/components/landing/quote-section";
import { ShareSection } from "~/components/landing/share-section";
import { SiteFooter } from "~/components/landing/site-footer";
import type { SessionUser } from "~/components/user-menu";
import { landing } from "~/content/landing";
import { parseSeedProfile } from "~/lib/profile-view";
import { getSession } from "../../server/auth";
import { ensureProfileAvatar, getProfileByUserId } from "../../server/profile";

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

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(env, request);
  if (!session) return { user: null };

  const profile = await getProfileByUserId(env, session.user.id);
  // Avatarsız kalmış eski kayıtları girişte kendiliğinden onarır.
  const repairedAvatarId = profile
    ? await ensureProfileAvatar(env, session.user, profile)
    : null;
  const seed = profile ? parseSeedProfile(profile.layout) : null;
  const user: SessionUser = {
    name: session.user.name,
    username: profile?.username ?? null,
    avatarUrl:
      (repairedAvatarId ? `/i/${repairedAvatarId}` : seed?.avatarUrl) ??
      session.user.image ??
      null,
  };
  return { user };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <div className="bg-kirec">
      <Navbar
        items={landing.nav.items}
        login={landing.nav.login}
        cta={landing.nav.cta}
        user={loaderData.user}
      />
      <main>
        <Hero hero={landing.hero} />
        <MinutesSection minutes={landing.minutes} />
        <ShareSection share={landing.share} />
        <AudienceSection audience={landing.audience} />
        <ProofSection proof={landing.proof} />
        <QuoteSection quote={landing.quote} />
        <FaqSection faq={landing.faq} />
        <CtaSection cta={landing.closingCta} />
      </main>
      <SiteFooter footer={landing.footer} />
    </div>
  );
}
