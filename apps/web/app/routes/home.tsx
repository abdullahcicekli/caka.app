import { env } from "cloudflare:workers";

import type { Route } from "./+types/home";
import { AudienceSection } from "~/components/landing/audience-section";
import { CtaSection } from "~/components/landing/cta-section";
import { EditorialSection } from "~/components/landing/editorial-section";
import { FaqSection } from "~/components/landing/faq-section";
import { Hero } from "~/components/landing/hero";
import { MinutesSection } from "~/components/landing/minutes-section";
import { Navbar } from "~/components/landing/navbar";
import { OutroSection } from "~/components/landing/outro-section";
import { ScrollIndicator } from "~/components/landing/scroll-indicator";
import { ShareSection } from "~/components/landing/share-section";
import { ShowcaseSection } from "~/components/landing/showcase-section";
import { SiteFooter } from "~/components/landing/site-footer";
import type { SessionUser } from "~/components/user-menu";
import { publishedLegalDocumentIds } from "~/content/legal";
import { landingCatalog } from "~/content/landing";
import { useCatalog } from "~/lib/locale";
import { parseSeedProfile } from "~/lib/profile-view";
import { DEFAULT_LOCALE, pathFor } from "@caka/shared";
import {
  SITE_URL,
  absoluteSiteUrl,
  buildSeoMeta,
  STATIC_OG_IMAGE,
} from "~/lib/seo";
import { getSession } from "../../server/auth";
import { localeFromRequest } from "../../server/locale";
import { ensureProfileAvatar, getProfileByUserId } from "../../server/profile";

export function meta({ loaderData }: Route.MetaArgs) {
  const locale = loaderData?.locale ?? DEFAULT_LOCALE;
  const landing = landingCatalog[locale];
  const title = landing.seo.title;
  return buildSeoMeta({
    title,
    description: landing.seo.description,
    locale,
    routeKey: "home",
    image: loaderData?.ogImage,
    imageAlt: landing.seo.imageAlt,
    schema: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": `${SITE_URL}/#organization`,
          name: "Caka",
          url: SITE_URL,
          logo: {
            "@type": "ImageObject",
            url: absoluteSiteUrl("/android-chrome-512x512.png"),
            width: 512,
            height: 512,
          },
          sameAs: landing.footer.social.map((item) => item.href),
        },
        {
          "@type": "FAQPage",
          "@id": `${SITE_URL}/#faq`,
          url: `${SITE_URL}/`,
          name: landing.faq.title,
          inLanguage: locale,
          isPartOf: { "@id": `${SITE_URL}/#website` },
          mainEntity: landing.faq.items.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        },
        {
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          url: absoluteSiteUrl(pathFor("home", locale)),
          name: "Caka",
          description: landing.seo.description,
          inLanguage: locale,
          publisher: { "@id": `${SITE_URL}/#organization` },
        },
      ],
    },
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  const ogImage = STATIC_OG_IMAGE;
  const locale = localeFromRequest(request);
  // Footer ve SSS yalnız yayındaki hukuki belgeleri reklam eder (R33).
  const publishedLegal = publishedLegalDocumentIds(locale);
  const session = await getSession(env, request);
  if (!session) return { user: null, ogImage, publishedLegal, locale };

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
  return { user, ogImage, publishedLegal, locale };
}

/**
 * Kaydirma gostergesinin izledigi bolumler. Gosterge dekoratif; ayni
 * capalarin gercek baglantilari menu katmaninda ve footer'da.
 */
const SECTION_IDS = ["hero", "urun", "vitrin", "sss", "kapanis"] as const;

export default function Home({ loaderData }: Route.ComponentProps) {
  const landing = useCatalog(landingCatalog);
  return (
    <div className="lp">
      <Navbar nav={landing.nav} user={loaderData.user} />
      <main>
        <Hero hero={landing.hero} cta={landing.nav.cta} />
        <EditorialSection editorial={landing.editorial} />
        <MinutesSection minutes={landing.minutes} />
        <ShareSection share={landing.share} />
        <AudienceSection audience={landing.audience} />
        <ShowcaseSection showcase={landing.showcase} />
        <FaqSection
          faq={landing.faq}
          publishedLegal={loaderData.publishedLegal}
        />
        <div id="kapanis">
          <CtaSection cta={landing.closingCta} />
        </div>
      </main>
      <SiteFooter
        footer={landing.footer}
        publishedLegal={loaderData.publishedLegal}
      />
      <OutroSection outro={landing.outro} />
      <ScrollIndicator ids={SECTION_IDS} />
    </div>
  );
}
