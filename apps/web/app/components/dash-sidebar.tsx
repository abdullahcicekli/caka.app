// Panel sol menüsü — Dashboard ve Ayarlar sayfalarının ortak sidebar'ı.
// routes/dashboard.tsx'ten çıkarıldı; görünüm birebir korunur (dash-* CSS).
import { useEffect, useState } from "react";
import { Check, Copy, MultiplePages, Settings, StatsReport } from "iconoir-react";
import { Link, NavLink } from "react-router";

import { logoBlack } from "~/assets/brand";
import { SidebarUserMenu } from "~/components/user-menu";
import { appCatalog } from "~/content/app";
import { useCatalog } from "~/lib/locale";

export interface DashAccount {
  name: string;
  username: string;
  avatarUrl: string | null;
}

export function DashSidebar({
  username,
  account,
}: {
  username: string;
  account: DashAccount;
}) {
  const nav = useCatalog(appCatalog).nav;
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
            aria-label={copied ? nav.copied : nav.copyLink}
            onClick={() => void copyAddress()}
          >
            {copied ? <Check width={16} height={16} /> : <Copy width={16} height={16} />}
          </button>
        </div>
      </header>

      <section>
        <div className="dash-page-list">
          <NavLink to="/dashboard">
            <MultiplePages width={17} height={17} /> {nav.pages}
          </NavLink>
          {/* Analitik ayrı bir sayfa değil; sayfanın istatistikleri
              /dashboard'da önizlemenin altında duruyor. nav.comingSoon etiketi
              artık gerçeği yansıtmıyordu. */}
          <NavLink to="/dashboard#analitik">
            <StatsReport width={17} height={17} /> {nav.analytics}
          </NavLink>
          <NavLink to="/ayarlar">
            <Settings width={17} height={17} /> {nav.settings}
          </NavLink>
        </div>
      </section>

      <footer>
        <SidebarUserMenu user={account} />
      </footer>
    </aside>
  );
}
