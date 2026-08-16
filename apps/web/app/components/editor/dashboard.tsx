// Editörün sol üst butonundan açılan dashboard side panel'i (own.page
// dashboard referansı, sol drawer olarak): adres + kopyala/aç aksiyonları,
// telefon çerçevesinde mini sayfa önizlemesi ve hesap menüsü.
import { useEffect, useState } from "react";
import { BarChart3, Check, Copy, ExternalLink, Settings, X } from "lucide-react";

import { ProfileAvatar } from "~/components/profile-avatar";
import { ProfileCanvas } from "~/components/profile-block";
import { SignOutLink } from "~/components/sign-out-link";
import type { ProfileLayout, ProfileTheme } from "@caka/shared";

export function EditorDashboard({
  username,
  layout,
  theme,
  onClose,
}: {
  username: string;
  layout: ProfileLayout;
  theme: ProfileTheme;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const profileBlock = layout.blocks.find((block) => block.type === "profile");
  const name = profileBlock?.type === "profile" ? profileBlock.data.name : username;
  const avatarUrl =
    profileBlock?.type === "profile" && profileBlock.data.avatarAssetId
      ? `/i/${profileBlock.data.avatarAssetId}`
      : null;

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(`https://caka.app/${username}`);
      setCopied(true);
    } catch {
      // Pano izni yoksa sessiz geç; adres pilinden manuel kopyalanabilir.
    }
  }

  return (
    <div
      className="editor-dashboard-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside className="editor-dashboard" role="dialog" aria-modal="true" aria-label="Hesap paneli">
        <header>
          <div className="dashboard-user">
            <ProfileAvatar name={name} avatarUrl={avatarUrl} className="size-11" />
            <div>
              <strong>{name}</strong>
              <small>@{username}</small>
            </div>
          </div>
          <button type="button" aria-label="Paneli kapat" onClick={onClose}>
            <X size={19} />
          </button>
        </header>

        <div className="dashboard-address">
          <span>caka.app/{username}</span>
          <div className="dashboard-address-actions">
            <button
              type="button"
              aria-label="Bağlantıyı kopyala"
              data-tooltip={copied ? "Kopyalandı" : "Kopyala"}
              onClick={() => void copyAddress()}
            >
              {copied ? <Check size={17} /> : <Copy size={17} />}
            </button>
            <a
              href={`/${username}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Sayfayı yeni sekmede aç"
              data-tooltip="Sayfayı aç"
            >
              <ExternalLink size={17} />
            </a>
          </div>
        </div>

        <div className="dashboard-preview" aria-hidden>
          <div className="dashboard-preview-scale">
            <ProfileCanvas layout={layout} theme={theme} compact />
          </div>
        </div>

        <nav className="dashboard-nav" aria-label="Hesap menüsü">
          <button type="button" disabled>
            <BarChart3 size={18} /> Analitik <em>Yakında</em>
          </button>
          <button type="button" disabled>
            <Settings size={18} /> Ayarlar <em>Yakında</em>
          </button>
        </nav>

        <footer>
          <SignOutLink className="text-white/60 hover:text-white" />
        </footer>
      </aside>
    </div>
  );
}
