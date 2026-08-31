// Sayfam: panel iskeletinde telefon çerçeveli canlı sayfa önizlemesi,
// taslak uyarısı ve düzenle/sayfayı aç eylemleri. Analitik kodu
// routes/analitik.tsx'e taşındı; bu loader ölçüm sorgusu çalıştırmaz.
import { env } from "cloudflare:workers";
import { EditPencil, MultiplePages, OpenNewWindow } from "iconoir-react";
import { Link } from "react-router";

import { useCatalog, useLocalizedPath } from "~/lib/locale";
import { PanelShell } from "~/components/panel-shell";
import { ProfileCanvas } from "~/components/profile-block";
import { noIndexMeta } from "~/lib/seo";
import { DEFAULT_LOCALE,
  ensureLayoutPositions,
  normalizeTheme,
  parseProfileLayout,
  type ProfileBlock,
} from "@caka/shared";
import { getSession } from "../../server/auth";
import { collectGithubLogins, getGithubCalendars } from "../../server/github";
import { signLayoutImages } from "../../server/layout-images";
import { getProfilePostFeed } from "../../server/post-list";
import { getProfileByUserId } from "../../server/profile";
import { getYoutubeChannelCards } from "../../server/youtube-widget";
import type { Route } from "./+types/dashboard";
import { localeFromRequest, localizedRedirect } from "../../server/locale";
import { appCatalog } from "~/content/app";

export function meta({ loaderData }: Route.MetaArgs) {
  return noIndexMeta(appCatalog[loaderData?.locale ?? DEFAULT_LOCALE].titles.dashboard);
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(env, request);
  if (!session) throw localizedRedirect(request, "/login");
  const profile = await getProfileByUserId(env, session.user.id);
  if (!profile) throw localizedRedirect(request, "/onboarding");
  if (!profile.onboardingCompletedAt) throw localizedRedirect(request, "/onboarding/kurulum/profil");
  const layout = parseProfileLayout(profile.layout);
  if (!layout) throw new Response(appCatalog[localeFromRequest(request)].editor.layoutUnreadable, { status: 500 });
  // Hesap menüsünün adı/avatarı profil bloğundan gelir; ek sorgu gerekmez.
  const card = layout.blocks.find(
    (block): block is Extract<ProfileBlock, { type: "profile" }> => block.type === "profile",
  );

  // Önizleme canlı sayfayla aynı veriyi görsün. Hepsi bağımsız; paralel.
  const [githubCalendars, signedImages, youtubeFeeds, posts] = await Promise.all([
    getGithubCalendars(env, collectGithubLogins(layout)),
    signLayoutImages(env, layout),
    getYoutubeChannelCards(env, layout, localeFromRequest(request)),
    getProfilePostFeed(env, layout, profile),
  ]);

  return {
    // Sekme başlığı `meta`da katalogdan okunuyor; `meta` hook kullanamaz.
    locale: localeFromRequest(request),
    username: profile.username,
    layout: ensureLayoutPositions(layout),
    theme: normalizeTheme(profile.theme),
    // Önizleme yayındaki hâli gösterir; taslak varsa kullanıcı uyarılır.
    // Ölçüt editörle (routes/edit.tsx) aynı olmalı: okunamayan taslak yok sayılır.
    hasDraft: profile.draftLayout ? parseProfileLayout(profile.draftLayout) !== null : false,
    // Önizlemedeki GitHub kartları da canlı sayfayla aynı grafiği göstersin.
    githubCalendars,
    signedImages,
    youtubeFeeds,
    // Yazı blokları da canlı sayfayla aynı listeyi görsün (U6).
    posts,
    account: {
      name: card?.data.name || profile.username,
      username: profile.username,
      avatarUrl: card?.data.avatarAssetId ? `/i/${card.data.avatarAssetId}` : null,
    },
  };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const app = useCatalog(appCatalog);
  const lpath = useLocalizedPath();
  const {
    username,
    layout,
    theme,
    account,
    hasDraft,
    githubCalendars,
    signedImages,
    youtubeFeeds,
    posts,
  } = loaderData;

  return (
    <PanelShell
      icon={MultiplePages}
      title={app.nav.pages}
      description={app.panel.pageDescription}
      username={username}
      account={account}
    >
      <div className="flex flex-col items-center gap-6">
        {hasDraft ? (
          <p className="dash-draft-note">
            {app.nav.draftNotice}
          </p>
        ) : null}
        <div className="dash-actions">
          <Link className="dash-edit" to={lpath("edit")}>
            <EditPencil width={16} height={16} /> {app.nav.editPage}
          </Link>
          <a href={`/${username}`} target="_blank" rel="noreferrer">
            <OpenNewWindow width={16} height={16} /> {app.nav.openPage}
          </a>
        </div>
        <div className="dashboard-preview panel-preview" aria-hidden>
          <div className="dashboard-preview-scale">
            <ProfileCanvas
              layout={layout}
              theme={theme}
              compact
              githubCalendars={githubCalendars}
              signedImages={signedImages}
              youtubeFeeds={youtubeFeeds}
              posts={posts}
            />
          </div>
        </div>
      </div>
    </PanelShell>
  );
}
