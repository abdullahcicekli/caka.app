// Panel sol menüsü — Dashboard ve Ayarlar sayfalarının ortak sidebar'ı.
// routes/dashboard.tsx'ten çıkarıldı; görünüm birebir korunur (dash-* CSS).
import { useEffect, useState } from "react";
import { BarChart3, Check, Copy, Files, Settings } from "lucide-react";
import { Link, NavLink } from "react-router";

import { logoBlack } from "~/assets/brand";
import { SidebarUserMenu } from "~/components/user-menu";

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
          <NavLink to="/ayarlar">
            <Settings size={17} /> Ayarlar
          </NavLink>
        </div>
      </section>

      <footer>
        <SidebarUserMenu user={account} />
      </footer>
    </aside>
  );
}
