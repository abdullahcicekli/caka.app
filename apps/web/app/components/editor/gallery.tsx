// Blok galerisi: arama + kategori çipleriyle eklenebilir blok kataloğu.
// Sosyal platform kartları marka tonlarını (platform-*) kullanır; içerik
// blokları nötr kartlardır. Araç çubuğunun üstünde popover olarak açılır;
// dışarı tıklama/Escape ile kapanma editördeki ortak panel handler'ındadır.
import { useMemo, useState } from "react";
import { ImageIcon, Link2, Megaphone, Search, Type, X } from "lucide-react";

import { SocialIcon } from "~/components/icons/social";
import { onboardingPlatforms } from "~/content/onboarding";
import type { ProfileBlock, SocialPlatform } from "@caka/shared";

export type GalleryPick =
  | { kind: "content"; type: Exclude<ProfileBlock["type"], "profile" | "social"> }
  | { kind: "social"; platform: SocialPlatform };

type Category = "social" | "content";

type ContentBlockType = Exclude<ProfileBlock["type"], "profile" | "social">;

// Record: yeni bir içerik bloğu tipi eklendiğinde katalog derleme hatası
// verir (dizi olarak yazılsaydı tip sessizce galeride görünmezdi).
const CONTENT_CATALOG: Record<ContentBlockType, { label: string; icon: typeof Link2 }> = {
  link: { label: "Bağlantı", icon: Link2 },
  text: { label: "Metin", icon: Type },
  image: { label: "Görsel", icon: ImageIcon },
  status: { label: "Duyuru", icon: Megaphone },
};

const CONTENT_ITEMS = (Object.entries(CONTENT_CATALOG) as [
  ContentBlockType,
  { label: string; icon: typeof Link2 },
][]).map(([type, item]) => ({ type, ...item }));

export function BlockGallery({ onPick }: { onPick: (pick: GalleryPick) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | null>(null);

  const needle = query.trim().toLocaleLowerCase("tr");
  const matches = (label: string) => !needle || label.toLocaleLowerCase("tr").includes(needle);

  const socialItems = useMemo(
    () => onboardingPlatforms.filter((platform) => matches(platform.label)),
    [needle],
  );
  const contentItems = useMemo(
    () => CONTENT_ITEMS.filter((item) => matches(item.label)),
    [needle],
  );
  const showSocial = category !== "content" && socialItems.length > 0;
  const showContent = category !== "social" && contentItems.length > 0;

  return (
    <div className="block-gallery editor-popover" role="dialog" aria-label="Blok galerisi">
        <label className="gallery-search">
          <Search size={19} aria-hidden />
          <input
            autoFocus
            type="search"
            placeholder="Ara…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="gallery-chips" role="group" aria-label="Kategoriler">
          <button
            type="button"
            className={category === "social" ? "is-active" : ""}
            onClick={() => setCategory(category === "social" ? null : "social")}
          >
            Sosyal medya
          </button>
          <button
            type="button"
            className={category === "content" ? "is-active" : ""}
            onClick={() => setCategory(category === "content" ? null : "content")}
          >
            İçerik
          </button>
          {category !== null ? (
            <button type="button" aria-label="Filtreyi temizle" onClick={() => setCategory(null)}>
              <X size={16} />
            </button>
          ) : null}
        </div>
        <div className="gallery-scroll">
          {showContent ? (
            <div className="gallery-grid">
              {contentItems.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  className="gallery-item"
                  onClick={() => onPick({ kind: "content", type: item.type })}
                >
                  <span className="tile tile-content" aria-hidden>
                    <item.icon size={30} strokeWidth={1.8} />
                  </span>
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
          {showSocial ? (
            <div className="gallery-grid">
              {socialItems.map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  className="gallery-item"
                  onClick={() => onPick({ kind: "social", platform: platform.id })}
                >
                  <span className={`tile ${platform.tone}`} aria-hidden>
                    <SocialIcon platform={platform.id} width={32} height={32} strokeWidth={1.9} />
                  </span>
                  {platform.label}
                </button>
              ))}
            </div>
          ) : null}
          {!showSocial && !showContent ? (
            <p className="gallery-empty">“{query}” için sonuç yok.</p>
          ) : null}
        </div>
    </div>
  );
}
