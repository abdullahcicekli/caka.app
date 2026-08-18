// Blok galerisi: arama + kategori çipleriyle eklenebilir blok kataloğu.
// Sosyal platform kartları marka tonlarını (platform-*) kullanır; içerik
// blokları nötr kartlardır. Araç çubuğunun üstünde popover olarak açılır;
// dışarı tıklama/Escape ile kapanma editördeki ortak panel handler'ındadır.
import { useMemo, useState } from "react";
import { ImageIcon, Images, Link2, Megaphone, MonitorPlay, Search, Type, X } from "lucide-react";

import { SocialIcon } from "~/components/icons/social";
import { onboardingPlatforms } from "~/content/onboarding";
import type { ProfileBlock, SocialPlatform } from "@caka/shared";

export type GalleryPick =
  | { kind: "content"; type: Exclude<ProfileBlock["type"], "profile" | "social"> }
  | { kind: "social"; platform: SocialPlatform };

type Category = "social" | "content";

type ContentBlockType = Exclude<ProfileBlock["type"], "profile" | "social">;

type CatalogItem = { label: string; icon: typeof Link2; enabled: boolean };

// Record: yeni bir içerik bloğu tipi eklendiğinde katalog derleme hatası
// verir (dizi olarak yazılsaydı tip sessizce galeride görünmezdi).
// `enabled`: şeması hazır ama editör/render tarafı henüz gelmemiş tip
// katalogda görünmez. Kayıt tipi böylece eksiksiz kalır (yeni tip eklemeyi
// unutmak hâlâ derleme hatası) ama kullanıcıya yarım bir blok sunulmaz.
const CONTENT_CATALOG: Record<ContentBlockType, CatalogItem> = {
  link: { label: "Bağlantı", icon: Link2, enabled: true },
  text: { label: "Metin", icon: Type, enabled: true },
  image: { label: "Görsel", icon: ImageIcon, enabled: true },
  status: { label: "Duyuru", icon: Megaphone, enabled: true },
  // "Galeri" DEĞİL: bu panelin kendi adı zaten "Blok galerisi". Aynı arayüzde
  // iki ayrı şeyin aynı adı taşıması kullanıcıyı yanıltırdı.
  gallery: { label: "Fotoğraf galerisi", icon: Images, enabled: true },
  youtube: { label: "YouTube", icon: MonitorPlay, enabled: true },
};

/** Tip → eklemenin neden kapalı olduğunu anlatan Türkçe cümle. */
export type BlockAddBlockers = Partial<Record<ContentBlockType, string>>;

const CONTENT_ITEMS = (Object.entries(CONTENT_CATALOG) as [ContentBlockType, CatalogItem][])
  .filter(([, item]) => item.enabled)
  .map(([type, item]) => ({ type, ...item }));

export function BlockGallery({
  onPick,
  blockers,
}: {
  onPick: (pick: GalleryPick) => void;
  /** Sınıra takılan tipler burada gerekçesiyle gelir; kart tıklanmaz olur ve
      gerekçe kartın altında yazar. Sessizce reddedilen bir buton kabul
      edilemez — kullanıcı neden olmadığını görmeli. */
  blockers?: BlockAddBlockers;
}) {
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
              {contentItems.map((item) => {
                const blocked = blockers?.[item.type];
                return (
                  <button
                    key={item.type}
                    type="button"
                    className={`gallery-item ${blocked ? "cursor-not-allowed opacity-45" : ""}`}
                    disabled={Boolean(blocked)}
                    title={blocked}
                    onClick={() => onPick({ kind: "content", type: item.type })}
                  >
                    <span className="tile tile-content" aria-hidden>
                      <item.icon size={30} strokeWidth={1.8} />
                    </span>
                    {item.label}
                    {blocked ? (
                      <small className="text-center text-[11px] leading-tight font-normal opacity-80">
                        {blocked}
                      </small>
                    ) : null}
                  </button>
                );
              })}
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
