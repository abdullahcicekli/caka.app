// Analitik sayfası: sayfanın ziyaret/tıklama ölçümleri (R48). Kod
// routes/dashboard.tsx'ten TAŞINDI — panel iskeletinde analitik artık kendi
// sayfasında yaşar; dashboard yalnız "Sayfam" önizlemesini gösterir.
import { env } from "cloudflare:workers";
import { StatsReport } from "iconoir-react";

import { analitikCatalog, kisaAdres } from "~/content/analitik";
import { appCatalog } from "~/content/app";
import { PanelShell } from "~/components/panel-shell";
import { useCatalog } from "~/lib/locale";
import { noIndexMeta } from "~/lib/seo";
import {
  DEFAULT_LOCALE,
  buildDailySeries,
  buildLinkBreakdown,
  collectTrackableLinks,
  formatCount,
  OLCUM_PENCERE_GUN,
  parseProfileLayout,
  shiftDayKey,
  sumSince,
  topCountries,
  topSources,
  type ProfileBlock,
} from "@caka/shared";
import { getProfileAnalytics } from "../../server/analytics";
import { getSession } from "../../server/auth";
import { localeFromRequest, localizedRedirect } from "../../server/locale";
import { getProfileByUserId } from "../../server/profile";
import type { Route } from "./+types/analitik";

export function meta({ loaderData }: Route.MetaArgs) {
  return noIndexMeta(appCatalog[loaderData?.locale ?? DEFAULT_LOCALE].titles.analytics);
}

export async function loader({ request }: Route.LoaderArgs) {
  // Oturum koruması dashboard ile birebir aynı.
  const session = await getSession(env, request);
  if (!session) throw localizedRedirect(request, "/login");
  const profile = await getProfileByUserId(env, session.user.id);
  if (!profile) throw localizedRedirect(request, "/onboarding");
  if (!profile.onboardingCompletedAt) throw localizedRedirect(request, "/onboarding/kurulum/profil");
  const layout = parseProfileLayout(profile.layout);
  if (!layout) throw new Response(appCatalog[localeFromRequest(request)].editor.layoutUnreadable, { status: 500 });
  // Sidebar hesap menüsünün adı/avatarı profil bloğundan gelir; ek sorgu gerekmez.
  const card = layout.blocks.find(
    (block): block is Extract<ProfileBlock, { type: "profile" }> => block.type === "profile",
  );

  // Ölçüm okuması (R48). Toplulaştırma saf fonksiyonlarda yapılır; loader
  // yalnızca ham kovaları çeker ve panele hazır seriyi döndürür. Ölçüm hattı
  // arızalanırsa sayfa yine açılır: hata boş veriye düşer.
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
    sources: raw ? topSources(raw.sources) : [],
    links: buildLinkBreakdown(
      trackable,
      raw?.clicks ?? [],
    ),
  };

  return {
    // Sekme başlığı `meta`da katalogdan okunuyor; `meta` hook kullanamaz.
    locale: localeFromRequest(request),
    analytics,
    username: profile.username,
    account: {
      name: card?.data.name || profile.username,
      username: profile.username,
      avatarUrl: card?.data.avatarAssetId ? `/i/${card.data.avatarAssetId}` : null,
    },
  };
}

type Analytics = Awaited<ReturnType<typeof loader>>["analytics"];

/** Küçük sayı kutusu — panel yüzeyinin kart dilini (beyaz + sinir) tekrarlar. */
function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-sinir bg-zemin px-4 py-3">
      <span className="text-xs font-semibold tracking-wide text-murekkep/55">{label}</span>
      <strong className="text-2xl font-bold tabular-nums">{formatCount(value)}</strong>
    </div>
  );
}

/**
 * Halka dilimlerinin ve liste noktalarının tek renk skalası: koyudan açığa
 * mürekkep. Panel tek renklidir (Değişmez #4'teki token diline uyar); oran
 * zaten yanındaki sayı ve yüzdeyle okunur, renk yalnızca dilimleri ayırır.
 */
const DONUT_OPACITY = [0.85, 0.62, 0.44, 0.3, 0.19, 0.11] as const;

interface DonutRow {
  key: string;
  label: string;
  count: number;
}

/**
 * Tek renk halka + satır listesi. SVG ekran okuyucudan gizlidir (aria-hidden);
 * veriyi yanındaki liste taşır, grafik onun süsüdür — tersi değil.
 *
 * r=15.9155 → çevre 100: dilim yüzdesi doğrudan `stroke-dasharray` olur.
 */
function DonutBreakdown({ rows, percent }: { rows: DonutRow[]; percent: (share: number) => string }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (total === 0) return null;

  let cursor = 0;
  const slices = rows.map((row, index) => {
    const share = (row.count / total) * 100;
    const slice = {
      ...row,
      share,
      // 25'lik başlangıç kayması dilimleri saat 12'den başlatır.
      dashoffset: 25 - cursor,
      opacity: DONUT_OPACITY[Math.min(index, DONUT_OPACITY.length - 1)],
    };
    cursor += share;
    return slice;
  });

  return (
    <div className="mt-2 flex items-center gap-5">
      <svg viewBox="0 0 42 42" className="h-24 w-24 shrink-0" aria-hidden="true">
        {slices.map((slice) => (
          <circle
            key={slice.key}
            cx="21"
            cy="21"
            r="15.9155"
            fill="none"
            className="stroke-murekkep"
            strokeWidth="5"
            strokeOpacity={slice.opacity}
            strokeDasharray={`${slice.share} ${100 - slice.share}`}
            strokeDashoffset={slice.dashoffset}
          />
        ))}
      </svg>
      <ul className="min-w-0 flex-1 flex flex-col gap-1.5">
        {slices.map((slice) => (
          <li key={slice.key} className="flex items-center gap-2.5 text-[13.5px]">
            <span
              className="size-2 shrink-0 rounded-full bg-murekkep"
              style={{ opacity: slice.opacity }}
            />
            <span className="min-w-0 flex-1 truncate">{slice.label}</span>
            <span className="shrink-0 tabular-nums font-semibold">{formatCount(slice.count)}</span>
            <span className="w-11 shrink-0 text-right tabular-nums text-xs text-murekkep/50">
              {percent(Math.round(slice.share))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DashAnalytics({ analytics }: { analytics: Analytics }) {
  const a = useCatalog(analitikCatalog);
  const { since, series, totalViews, todayViews, totalClicks, countries, sources, links } =
    analytics;
  const peak = series.reduce((max, day) => Math.max(max, day.count), 0);

  return (
    <section className="w-full rounded-2xl border border-sinir bg-white p-6 text-left">
      {since === null ? (
        // Yeni profil: her şey sıfır. "Bozuk" görünmesin diye tablolar yerine
        // ne olacağını anlatan bir açıklama gösterilir.
        <div className="rounded-xl border border-sinir bg-zemin px-4 py-5">
          <strong className="text-sm font-semibold">{a.emptyTitle}</strong>
          <p className="mt-1.5 text-[13px] leading-relaxed text-murekkep/60">{a.emptyBody}</p>
        </div>
      ) : (
        <>
          {/* Sayfa başlığı iskelette (h1); kart yalnız pencere bilgisini taşır. */}
          <header className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="text-xs text-murekkep/50">{a.startNote(since)}</p>
            <span className="text-xs font-semibold text-murekkep/45">{a.windowLabel}</span>
          </header>

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

          <h3 className="mt-6 text-xs font-bold tracking-wide text-murekkep/60 uppercase">
            {a.sourcesTitle}
          </h3>
          {sources.length === 0 ? (
            // Kaynak ölçümü ülke ölçümünden sonra eklendi: satır yokluğu
            // "ölçüm yeni başladı" demektir, sıfır ziyaret değil.
            <p className="mt-2 text-[13px] text-murekkep/55">{a.sourcesEmpty}</p>
          ) : (
            <DonutBreakdown
              percent={a.percent}
              rows={sources.map((row) => ({
                key: row.source,
                label: a.sourceName(row.source),
                count: row.count,
              }))}
            />
          )}

          {countries.length > 0 ? (
            <>
              <h3 className="mt-6 text-xs font-bold tracking-wide text-murekkep/60 uppercase">
                {a.countriesTitle}
              </h3>
              <DonutBreakdown
                percent={a.percent}
                rows={countries.map((row) => ({
                  key: row.country,
                  label: a.countryName(row.country),
                  count: row.count,
                }))}
              />
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

export default function Analitik({ loaderData }: Route.ComponentProps) {
  const app = useCatalog(appCatalog);
  const { username, account, analytics } = loaderData;

  return (
    <PanelShell
      icon={StatsReport}
      title={app.nav.analytics}
      description={app.panel.analyticsDescription}
      username={username}
      account={account}
    >
      <DashAnalytics analytics={analytics} />
    </PanelShell>
  );
}
