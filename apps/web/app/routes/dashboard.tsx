// Dashboard: sol side panelde sayfa menüsü, ortada telefon çerçevesinde
// canlı sayfa önizlemesi.
import { env } from "cloudflare:workers";
import { EditPencil, OpenNewWindow } from "iconoir-react";
import { Link, redirect } from "react-router";

import { analitikCatalog, kisaAdres } from "~/content/analitik";
import { useCatalog } from "~/lib/locale";
import { DashSidebar } from "~/components/dash-sidebar";
import { ProfileCanvas } from "~/components/profile-block";
import { noIndexMeta } from "~/lib/seo";
import { DEFAULT_LOCALE,
  buildDailySeries,
  buildLinkBreakdown,
  collectTrackableLinks,
  ensureLayoutPositions,
  formatCount,
  normalizeTheme,
  OLCUM_PENCERE_GUN,
  parseProfileLayout,
  shiftDayKey,
  sumSince,
  topCountries,
  type ProfileBlock,
} from "@caka/shared";
import { getProfileAnalytics } from "../../server/analytics";
import { getSession } from "../../server/auth";
import { collectGithubLogins, getGithubCalendars } from "../../server/github";
import { signLayoutImages } from "../../server/layout-images";
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

  // Ölçüm okuması (R48). Toplulaştırma saf fonksiyonlarda yapılır; loader
  // yalnızca ham kovaları çeker ve panele hazır seriyi döndürür. Ölçüm hattı
  // arızalanırsa panel yine açılır: hata boş veriye düşer.
  const raw = await getProfileAnalytics(env, profile.id).catch(() => null);
  const today = raw?.today ?? "";
  const windowStart = today ? shiftDayKey(today, -(OLCUM_PENCERE_GUN - 1)) : "";
  const trackable = collectTrackableLinks(layout);
  const analytics = {
    since: raw?.since ?? null,
    series: raw ? buildDailySeries(raw.views, today, OLCUM_PENCERE_GUN) : [],
    totalViews: raw ? sumSince(raw.views, windowStart) : 0,
    todayViews: raw ? sumSince(raw.views, today) : 0,
    totalClicks: raw
      ? raw.clicks.reduce((sum, row) => sum + row.clicks, 0)
      : 0,
    countries: raw ? topCountries(raw.countries) : [],
    links: buildLinkBreakdown(
      trackable,
      raw?.clicks ?? [],
    ),
  };

  // Önizleme canlı sayfayla aynı veriyi görsün. Üçü bağımsız; paralel.
  const [githubCalendars, signedImages, youtubeFeeds] = await Promise.all([
    getGithubCalendars(env, collectGithubLogins(layout)),
    signLayoutImages(env, layout),
    getYoutubeChannelCards(env, layout, localeFromRequest(request)),
  ]);

  return {
    // Sekme başlığı `meta`da katalogdan okunuyor; `meta` hook kullanamaz.
    locale: localeFromRequest(request),
    analytics,
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
    account: {
      name: card?.data.name || profile.username,
      username: profile.username,
      avatarUrl: card?.data.avatarAssetId ? `/i/${card.data.avatarAssetId}` : null,
    },
  };
}

type Analytics = Awaited<ReturnType<typeof loader>>["analytics"];

/** Küçük sayı kutusu — dash yüzeyinin kart dilini (beyaz + sinir) tekrarlar. */
function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-sinir bg-zemin px-4 py-3">
      <span className="text-xs font-semibold tracking-wide text-murekkep/55">{label}</span>
      <strong className="text-2xl font-bold tabular-nums">{formatCount(value)}</strong>
    </div>
  );
}

function DashAnalytics({ analytics }: { analytics: Analytics }) {
  const a = useCatalog(analitikCatalog);
  const { since, series, totalViews, todayViews, totalClicks, countries, links } = analytics;
  const peak = series.reduce((max, day) => Math.max(max, day.count), 0);
  const topCountryTotal = countries.reduce((max, row) => Math.max(max, row.count), 0);

  return (
    // `id`, sidebar'daki "Analitik" bağlantısının hedefi (dash-sidebar.tsx).
    <section
      id="analitik"
      className="w-full max-w-[560px] scroll-mt-8 rounded-2xl border border-sinir bg-white p-6 text-left"
    >
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-bold">{a.title}</h2>
        <span className="text-xs font-semibold text-murekkep/45">{a.windowLabel}</span>
      </header>

      {since === null ? (
        // Yeni profil: her şey sıfır. "Bozuk" görünmesin diye tablolar yerine
        // ne olacağını anlatan bir açıklama gösterilir.
        <div className="mt-4 rounded-xl border border-sinir bg-zemin px-4 py-5">
          <strong className="text-sm font-semibold">{a.emptyTitle}</strong>
          <p className="mt-1.5 text-[13px] leading-relaxed text-murekkep/60">{a.emptyBody}</p>
        </div>
      ) : (
        <>
          <p className="mt-1 text-xs text-murekkep/50">{a.startNote(since)}</p>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <StatTile label={a.viewsTitle} value={totalViews} />
            <StatTile label={a.clicksTitle} value={totalClicks} />
            <StatTile label={a.todayTitle} value={todayViews} />
          </div>

          <h3 className="mt-6 text-xs font-bold tracking-wide text-murekkep/60 uppercase">
            {a.chartTitle}
          </h3>
          <div
            className="mt-2 flex h-16 items-end gap-[3px]"
            role="img"
            aria-label={a.chartAria(formatCount(totalViews))}
          >
            {series.map((day) => (
              <span
                key={day.day}
                title={a.dayLabel(day.day, formatCount(day.count))}
                className={`min-h-[3px] flex-1 rounded-sm ${
                  day.count > 0 ? "bg-murekkep/70" : "bg-sinir"
                }`}
                style={{ height: peak > 0 ? `${(day.count / peak) * 100}%` : "3px" }}
              />
            ))}
          </div>

          <h3 className="mt-6 text-xs font-bold tracking-wide text-murekkep/60 uppercase">
            {a.linksTitle}
          </h3>
          {links.length === 0 ? (
            <p className="mt-2 text-[13px] text-murekkep/55">{a.linksEmpty}</p>
          ) : (
            <ul className="mt-2 flex flex-col">
              {links.map((link) => (
                <li
                  key={link.blockId}
                  className="flex items-center gap-3 border-b border-sinir py-2.5 last:border-b-0"
                >
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-[13.5px] font-semibold">
                      {a.linkName(link.label, link.type)}
                    </strong>
                    <small className="block truncate text-xs text-murekkep/45">
                      {kisaAdres(link.url)}
                    </small>
                  </span>
                  <span className="tabular-nums text-sm font-semibold">
                    {formatCount(link.clicks)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {countries.length > 0 ? (
            <>
              <h3 className="mt-6 text-xs font-bold tracking-wide text-murekkep/60 uppercase">
                {a.countriesTitle}
              </h3>
              <ul className="mt-2 flex flex-col gap-1.5">
                {countries.map((row) => (
                  <li key={row.country} className="flex items-center gap-3 text-[13.5px]">
                    <span className="w-28 shrink-0 truncate">{a.countryName(row.country)}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-sinir">
                      <span
                        className="block h-full rounded-full bg-murekkep/70"
                        style={{
                          width:
                            topCountryTotal > 0
                              ? `${(row.count / topCountryTotal) * 100}%`
                              : "0%",
                        }}
                      />
                    </span>
                    <span className="w-10 shrink-0 text-right tabular-nums font-semibold">
                      {formatCount(row.count)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11.5px] leading-relaxed text-murekkep/45">
                {a.countryThresholdNote}
              </p>
            </>
          ) : null}
        </>
      )}

      <p className="mt-5 border-t border-sinir pt-3 text-[11.5px] leading-relaxed text-murekkep/45">
        {a.privacyNote} {a.scopeNote} {a.timezoneNote}
      </p>
    </section>
  );
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const app = useCatalog(appCatalog);
  const {
    username,
    layout,
    theme,
    account,
    hasDraft,
    githubCalendars,
    analytics,
    signedImages,
    youtubeFeeds,
  } =
    loaderData;

  return (
    <main className="dash-shell">
      <DashSidebar username={username} account={account} />

      <section className="dash-main">
        {hasDraft ? (
          <p className="dash-draft-note">
            {app.nav.draftNotice}
          </p>
        ) : null}
        <div className="dash-actions">
          <Link className="dash-edit" to="/edit">
            <EditPencil width={16} height={16} /> {app.nav.editPage}
          </Link>
          <a href={`/${username}`} target="_blank" rel="noreferrer">
            <OpenNewWindow width={16} height={16} /> {app.nav.openPage}
          </a>
        </div>
        <div className="dashboard-preview" aria-hidden>
          <div className="dashboard-preview-scale">
            <ProfileCanvas
              layout={layout}
              theme={theme}
              compact
              githubCalendars={githubCalendars}
              signedImages={signedImages}
              youtubeFeeds={youtubeFeeds}
            />
          </div>
        </div>
        <DashAnalytics analytics={analytics} />
      </section>
    </main>
  );
}
