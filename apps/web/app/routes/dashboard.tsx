// Dashboard: sol side panelde sayfa menüsü, ortada telefon çerçevesinde
// canlı sayfa önizlemesi.
import { useEffect, useState } from "react";
import { env } from "cloudflare:workers";
import {
  BarChart3,
  Check,
  Copy,
  ExternalLink,
  Files,
  Pencil,
  Settings,
} from "lucide-react";
import { Link, NavLink, redirect } from "react-router";

import { logoBlack } from "~/assets/brand";
import { ProfileCanvas } from "~/components/profile-block";
import { SignOutLink } from "~/components/sign-out-link";
import { noIndexMeta } from "~/lib/seo";
import { ensureLayoutPositions, normalizeTheme, parseProfileLayout } from "@caka/shared";
import { getSession } from "../../server/auth";
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
  return {
    username: profile.username,
    layout: ensureLayoutPositions(layout),
    theme: normalizeTheme(profile.theme),
  };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { username, layout, theme } = loaderData;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(`https://caka.app/${username}`);
      setCopied(true);
    } catch {
      // Pano izni yoksa sessiz geç; adres elle kopyalanabilir.
    }
  }

  return (
    <main className="dash-shell">
      <aside className="dash-sidebar">
        <header className="dash-sidebar-header">
          <Link to="/" aria-label="Ana sayfa">
            <img src={logoBlack} alt="Caka" />
          </Link>
          <span className="dash-logo-sep" aria-hidden />
          <div className="dash-address">
            <span>caka.app/{username}</span>
            <button
              type="button"
              aria-label={copied ? "Kopyalandı" : "Bağlantıyı kopyala"}
              onClick={() => void copyAddress()}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </header>

        <section>
          <div className="dash-page-list">
            <NavLink to="/dashboard">
              <Files size={17} /> Sayfalar
            </NavLink>
            <button type="button" disabled>
              <BarChart3 size={17} /> Analitik <em>Yakında</em>
            </button>
            <button type="button" disabled>
              <Settings size={17} /> Ayarlar <em>Yakında</em>
            </button>
          </div>
        </section>

        <footer>
          <SignOutLink />
        </footer>
      </aside>

      <section className="dash-main">
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
            <ProfileCanvas layout={layout} theme={theme} compact />
          </div>
        </div>
      </section>
    </main>
  );
}
