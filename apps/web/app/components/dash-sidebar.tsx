// Panel sol menüsü — PanelShell iskeletindeki sayfaların ortak sidebar'ı.
// Girişler standart: Sayfam, Analitik, Yazılar, Ayarlar + belirgin
// "Sayfayı düzenle" bağlantısı (tuval editörü iskelete girmez, tam ekrandır).
// Aktif sayfa vurgusu NavLink'in aria-current'ından gelir (dash-* CSS).
import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  EditPencil,
  MultiplePages,
  PageEdit,
  Settings,
  StatsReport,
} from "iconoir-react";
import { Link, NavLink } from "react-router";

import { logoBlack } from "~/assets/brand";
import { SidebarUserMenu } from "~/components/user-menu";
import { appCatalog } from "~/content/app";
import { yaziEditorCatalog } from "~/content/yazi-editor";
import { useCatalog, useLocalizedPath } from "~/lib/locale";

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
  const yaziNav = useCatalog(yaziEditorCatalog).nav;
  const path = useLocalizedPath();
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
        <Link to="/" aria-label={nav.homeAria}>
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

      {/* Tuval editörüne belirgin giriş: liste bağlantısı değil, eylem düğmesi. */}
      <Link
        to={path("edit")}
        className="flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-murekkep px-4 text-sm font-semibold text-zemin hover:bg-murekkep/85"
      >
        <EditPencil width={16} height={16} /> {nav.editPage}
      </Link>

      <section>
        <div className="dash-page-list">
          {/* Adresler slug tablosundan gelir (path): route'lar dilli. */}
          <NavLink to={path("dashboard")}>
            <MultiplePages width={17} height={17} /> {nav.pages}
          </NavLink>
          <NavLink to={path("analitik")}>
            <StatsReport width={17} height={17} /> {nav.analytics}
          </NavLink>
          {/* Yazı yönetimi (U7). */}
          <NavLink to={path("edit.yazilar")}>
            <PageEdit width={17} height={17} /> {yaziNav}
          </NavLink>
          <NavLink to={path("ayarlar")}>
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
