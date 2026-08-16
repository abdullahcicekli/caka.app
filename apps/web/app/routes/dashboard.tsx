// Dashboard: sol side panelde sayfa menüsü, ortada telefon çerçevesinde
// canlı sayfa önizlemesi.
import { env } from "cloudflare:workers";
import { ExternalLink, Pencil } from "lucide-react";
import { Link, redirect } from "react-router";

import { DashSidebar } from "~/components/dash-sidebar";
import { ProfileCanvas } from "~/components/profile-block";
import { noIndexMeta } from "~/lib/seo";
import {
  ensureLayoutPositions,
  normalizeTheme,
  parseProfileLayout,
  type ProfileBlock,
} from "@caka/shared";
import { getSession } from "../../server/auth";
import { collectGithubLogins, getGithubCalendars } from "../../server/github";
import { getProfileByUserId } from "../../server/profile";
import type { Route } from "./+types/dashboard";

export function meta({}: Route.MetaArgs) {
  return noIndexMeta("Panel — Caka");
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(env, request);
  if (!session) throw redirect("/login");
  const profile = await getProfileByUserId(env, session.user.id);
  if (!profile) throw redirect("/onboarding");
  if (!profile.onboardingCompletedAt) throw redirect("/onboarding/kurulum/profil");
  const layout = parseProfileLayout(profile.layout);
  if (!layout) throw new Response("Sayfa düzeni okunamadı", { status: 500 });
  // Hesap menüsünün adı/avatarı profil bloğundan gelir; ek sorgu gerekmez.
  const card = layout.blocks.find(
    (block): block is Extract<ProfileBlock, { type: "profile" }> => block.type === "profile",
  );
  return {
    username: profile.username,
    layout: ensureLayoutPositions(layout),
    theme: normalizeTheme(profile.theme),
    // Önizleme yayındaki hâli gösterir; taslak varsa kullanıcı uyarılır.
    // Ölçüt editörle (routes/edit.tsx) aynı olmalı: okunamayan taslak yok sayılır.
    hasDraft: profile.draftLayout ? parseProfileLayout(profile.draftLayout) !== null : false,
    // Önizlemedeki GitHub kartları da canlı sayfayla aynı grafiği göstersin.
    githubCalendars: await getGithubCalendars(env, collectGithubLogins(layout)),
    account: {
      name: card?.data.name || profile.username,
      username: profile.username,
      avatarUrl: card?.data.avatarAssetId ? `/i/${card.data.avatarAssetId}` : null,
    },
  };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { username, layout, theme, account, hasDraft, githubCalendars } = loaderData;

  return (
    <main className="dash-shell">
      <DashSidebar username={username} account={account} />

      <section className="dash-main">
        {hasDraft ? (
          <p className="dash-draft-note">
            Yayınlanmamış değişikliklerin var — aşağıdaki önizleme yayındaki hâli gösteriyor.
          </p>
        ) : null}
        <div className="dash-actions">
          <Link className="dash-edit" to="/edit">
            <Pencil size={16} /> Sayfayı düzenle
          </Link>
          <a href={`/${username}`} target="_blank" rel="noreferrer">
            <ExternalLink size={16} /> Sayfayı aç
          </a>
        </div>
        <div className="dashboard-preview" aria-hidden>
          <div className="dashboard-preview-scale">
            <ProfileCanvas layout={layout} theme={theme} compact githubCalendars={githubCalendars} />
          </div>
        </div>
      </section>
    </main>
  );
}
