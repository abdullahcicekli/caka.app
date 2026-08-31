// Blok galerisi: arama + kategori çipleriyle eklenebilir blok kataloğu.
// Sosyal platform kartları marka tonlarını (platform-*) kullanır; içerik
// blokları nötr kartlardır. Araç çubuğunun üstünde popover olarak açılır;
// dışarı tıklama/Escape ile kapanma editördeki ortak panel handler'ındadır.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link as LinkIcon,
  MapPin,
  MediaImage,
  MediaVideo,
  Megaphone,
  MultiplePages,
  MusicDoubleNote,
  Page,
  PageStar,
  OpenBook,
  Search,
  Text,
} from "iconoir-react";

import { SocialIcon } from "~/components/icons/social";
import type { ProfileBlock, SocialPlatform } from "@caka/shared";
import { useOnboardingLists } from "~/lib/onboarding";
import { appCatalog } from "~/content/app";
import { Link } from "react-router";
import { useCatalog, useLocalizedPath } from "~/lib/locale";

export type GalleryPick =
  | { kind: "content"; type: Exclude<ProfileBlock["type"], "profile" | "social"> }
  | { kind: "social"; platform: SocialPlatform };

type Category = "all" | "social" | "content" | "posts";

type ContentBlockType = Exclude<ProfileBlock["type"], "profile" | "social">;

type CatalogItem = { icon: typeof LinkIcon; enabled: boolean };

// Record: yeni bir içerik bloğu tipi eklendiğinde katalog derleme hatası
// verir (dizi olarak yazılsaydı tip sessizce galeride görünmezdi).
// `enabled`: şeması hazır ama editör/render tarafı henüz gelmemiş tip
// katalogda görünmez. Kayıt tipi böylece eksiksiz kalır (yeni tip eklemeyi
// unutmak hâlâ derleme hatası) ama kullanıcıya yarım bir blok sunulmaz.
// Etiketler burada DEĞİL, `content/app`'teki `blockTypes`'ta: aynı adlar
// editörün başlığında ve yayın engeli listesinde de görünüyor, tek sözlükten
// okunmaları gerekiyor. Burada yalnız ikon ve açık/kapalı durumu var.
const CONTENT_CATALOG: Record<ContentBlockType, CatalogItem> = {
  link: { icon: LinkIcon, enabled: true },
  text: { icon: Text, enabled: true },
  status: { icon: Megaphone, enabled: true },
  // Tek "Fotoğraf" girişi: `image` ve `gallery` birleşti, kullanıcı kaç
  // fotoğraf koyacağını blok tipi seçerek değil fotoğraf ekleyerek söylüyor.
  gallery: { icon: MediaImage, enabled: true },
  // YOUTUBE KAPALI (kullanıcı kararı): blok galeriden de araç çubuğundan da
  // kaldırıldı, yani YENİ bir YouTube bloğu eklenemiyor. Tip ve render'ı
  // yerinde duruyor — mevcut sayfalardaki kartlar çalışmaya, sahibi de onları
  // düzenlemeye devam ediyor; yalnız EKLEME yolu kapalı. Geri açmak için
  // burayı `true` yapmak yeter.
  youtube: { icon: MediaVideo, enabled: false },
  spotify: { icon: MusicDoubleNote, enabled: true },
  document: { icon: Page, enabled: true },
  location: { icon: MapPin, enabled: true },
  ayet: { icon: OpenBook, enabled: true },
  // Yazı blokları (U6): liste yayındaki yazılardan kendiliğinden dolar,
  // öne çıkan tek bir yazıyı vitrine koyar (seçim panelde).
  posts: { icon: MultiplePages, enabled: true },
  featuredPost: { icon: PageStar, enabled: true },
};

/** Tip → eklemenin neden kapalı olduğunu anlatan Türkçe cümle. */
export type BlockAddBlockers = Partial<Record<ContentBlockType, string>>;

const CONTENT_ITEMS = (Object.entries(CONTENT_CATALOG) as [ContentBlockType, CatalogItem][])
  .filter(([, item]) => item.enabled)
  .map(([type, item]) => ({ type, ...item }));

// Yazı blokları galeride kendi bölümünde durur (kullanıcı geri bildirimi):
// blok eklemek yazı OLUŞTURMAZ; bölümün eylem satırı yazma/düzenleme
// sayfalarına götürerek bu ayrımı galeri anında görünür kılar.
const POST_BLOCK_TYPES: readonly ContentBlockType[] = ["posts", "featuredPost"];

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
  const onboarding = useOnboardingLists();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  // Galeri ilk açıldığında bütün seçenekler görünür. Filtreler birbirini
  // dışlar; "tekrar tıkla" ile ne olduğunu belirsizleştiren kapalı hâl yok.
  const [category, setCategory] = useState<Category>("all");

  const app = useCatalog(appCatalog);
  const needle = query.trim().toLocaleLowerCase("tr");
  const matches = (label: string) => !needle || label.toLocaleLowerCase("tr").includes(needle);

  const socialItems = useMemo(
    () => onboarding.platforms.filter((platform) => matches(platform.label)),
    [needle],
  );
  const contentItems = useMemo(
    () =>
      CONTENT_ITEMS.filter(
        (item) => !POST_BLOCK_TYPES.includes(item.type) && matches(app.blockTypes[item.type]),
      ),
    [needle, app],
  );
  const postItems = useMemo(
    () =>
      CONTENT_ITEMS.filter(
        (item) => POST_BLOCK_TYPES.includes(item.type) && matches(app.blockTypes[item.type]),
      ),
    [needle, app],
  );
  const lpath = useLocalizedPath();
  // Aramaya odak YALNIZCA fiziksel imleçli cihazlarda. Dokunmatikte odak
  // klavyeyi açar; galeri klavyenin altında kalır ve listeyi kaydırmak
  // imkânsızlaşır — kullanıcı önce blokları görmeli, arama isteğe bağlı.
  useEffect(() => {
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      searchRef.current?.focus();
    }
  }, []);

  const showSocial = (category === "all" || category === "social") && socialItems.length > 0;
  const showContent = (category === "all" || category === "content") && contentItems.length > 0;
  const showPosts = (category === "all" || category === "content" || category === "posts") && postItems.length > 0;

  return (
    <div className="block-gallery editor-popover" role="dialog" aria-label={app.editor.blockPickerAria}>
        <label className="gallery-search">
          <Search width={19} height={19} aria-hidden />
          <input
            ref={searchRef}
            type="search"
            placeholder={app.editor.searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="gallery-chips" role="group" aria-label={app.editor.categoriesAria}>
          <button
            type="button"
            className={category === "all" ? "is-active" : ""}
            aria-pressed={category === "all"}
            onClick={() => setCategory("all")}
          >
            {app.editor.pickerAll}
          </button>
          <button
            type="button"
            className={category === "social" ? "is-active" : ""}
            aria-pressed={category === "social"}
            onClick={() => setCategory("social")}
          >
            {app.editor.pickerSocial}
          </button>
          <button
            type="button"
            className={category === "content" ? "is-active" : ""}
            aria-pressed={category === "content"}
            onClick={() => setCategory("content")}
          >
            {app.editor.pickerContent}
          </button>
          <button
            type="button"
            className={category === "posts" ? "is-active" : ""}
            aria-pressed={category === "posts"}
            onClick={() => setCategory("posts")}
          >
            {app.editor.pickerPostsTitle}
          </button>
        </div>
        <div className="gallery-scroll">
          {showContent ? (
            <section className="gallery-section" aria-label={app.editor.pickerContent}>
              <h2>{app.editor.pickerContent}</h2>
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
                      <item.icon width={30} height={30} strokeWidth={1.8} />
                    </span>
                    {app.blockTypes[item.type]}
                    {blocked ? (
                      <small className="text-center text-[11px] leading-tight font-normal opacity-80">
                        {blocked}
                      </small>
                    ) : null}
                  </button>
                );
                })}
              </div>
            </section>
          ) : null}
          {showPosts ? (
            <section className="gallery-section" aria-label={app.editor.pickerPostsTitle}>
              <div className="gallery-section-heading">
                <h2>{app.editor.pickerPostsTitle}</h2>
                <span className="flex items-center gap-3 text-[12.5px] font-medium">
                  <Link to={lpath("edit.yazi", { id: "yeni" })} className="underline underline-offset-2">
                    {app.editor.pickerPostsWrite}
                  </Link>
                  <Link to={lpath("edit.yazilar")} className="underline underline-offset-2">
                    {app.editor.pickerPostsManage}
                  </Link>
                </span>
              </div>
              <div className="gallery-grid">
                {postItems.map((item) => {
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
                        <item.icon width={30} height={30} strokeWidth={1.8} />
                      </span>
                      {app.blockTypes[item.type]}
                      {blocked ? (
                        <small className="text-center text-[11px] leading-tight font-normal opacity-80">
                          {blocked}
                        </small>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}
          {showSocial ? (
            <section className="gallery-section" aria-label={app.editor.pickerSocial}>
              <h2>{app.editor.pickerSocial}</h2>
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
            </section>
          ) : null}
          {!showSocial && !showContent ? (
            <p className="gallery-empty">{app.editor.pickerNoResults(query)}</p>
          ) : null}
        </div>
    </div>
  );
}
