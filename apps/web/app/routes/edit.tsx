import { useEffect, useMemo, useRef, useState } from "react";
import { env } from "cloudflare:workers";
import {
  ChevronLeft,
  ExternalLink,
  ImageIcon,
  LayoutGrid,
  Link2,
  Megaphone,
  Monitor,
  Palette,
  Plus,
  Smartphone,
  Trash2,
  Type,
  X,
} from "lucide-react";
import { Link, redirect, useSearchParams } from "react-router";

import { BlockGallery, type GalleryPick } from "~/components/editor/gallery";
import { EditorGrid, type EditorDevice, type GridUpdate } from "~/components/editor/grid";
import { InlineTextEditor } from "~/components/editor/rich-text-editor";
import { ProfileBlockCard } from "~/components/profile-block";
import { onboardingPlatforms, onboardingTemplates, platformById } from "~/content/onboarding";
import { noIndexMeta } from "~/lib/seo";
import {
  GRID_COLUMNS,
  createBlockId,
  detectSocialFromUrl,
  ensureLayoutPositions,
  normalizeTheme,
  parseProfileLayout,
  placeNewBlock,
  sizeFromDims,
  sizeToDims,
  socialUrl,
  withDerivedSmPositions,
  type ProfileBlock,
  type ProfileLayout,
  type ProfileTheme,
  type SocialPlatform,
} from "@caka/shared";
import { getSession } from "../../server/auth";
import { getProfileByUserId } from "../../server/profile";
import type { Route } from "./+types/edit";

export function meta({}: Route.MetaArgs) {
  return noIndexMeta("Editör — Caka");
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
    version: profile.version,
  };
}

type SaveState = "saved" | "saving" | "error" | "conflict";

function defaultBlock(type: ProfileBlock["type"]): ProfileBlock {
  const id = createBlockId();
  if (type === "link") return { id, type, size: "1x1", data: { title: "Yeni bağlantı", url: "" } };
  if (type === "social") return { id, type, size: "1x1", data: { platform: "instagram", handle: "", url: "", label: "Instagram", ogImage: "" } };
  if (type === "text") return { id, type, size: "2x1", data: { text: "Yeni metin bloğu" } };
  if (type === "image") return { id, type, size: "2x1", data: { title: "Görsel", url: "" } };
  if (type === "status") return { id, type, size: "2x1", data: { text: "Yeni duyuru", url: "" } };
  return { id, type: "profile", size: "1x1", data: { name: "Adın", title: "Kısa açıklaman" } };
}

function Inspector({
  block,
  update,
  remove,
  close,
}: {
  block: ProfileBlock;
  update: (patch: Partial<ProfileBlock["data"]>) => void;
  remove: () => void;
  close: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  // Sosyal blokta tek bağlantı alanı: kullanıcı ne yazdıysa o görünür;
  // platform/handle/url bloğa çözümlenmiş halleriyle yazılır.
  const [socialLink, setSocialLink] = useState(() =>
    block.type === "social" ? block.data.url || block.data.handle : "",
  );
  useEffect(() => {
    setSocialLink(block.type === "social" ? block.data.url || block.data.handle : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnız blok değişince
  }, [block.id]);

  // Yapıştırılan URL'den platform + kullanıcı adını çıkarır (nsosyal.com/ad
  // gibi); düz kullanıcı adı yazıldıysa URL'yi platform tabanından üretir.
  function applySocialLink(value: string) {
    if (block.type !== "social") return;
    const detected = detectSocialFromUrl(value);
    if (detected?.handle) {
      const config = platformById(detected.platform);
      update({
        platform: detected.platform,
        label: config.label,
        handle: detected.handle,
        url: detected.url,
        ogImage: "",
      });
      return;
    }
    if (block.data.platform === "website") {
      update({ handle: "", url: value, ogImage: "" });
      return;
    }
    const handle = value.trim().replace(/^@/, "");
    update({ handle, url: socialUrl(block.data.platform, value), ogImage: "" });
  }

  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const response = await fetch("/api/onboarding/avatar", {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const result = (await response.json()) as { id?: string };
      if (response.ok && result.id) update({ assetId: result.id });
    } finally {
      setUploading(false);
    }
  }

  return (
    <aside className="editor-inspector">
      <header>
        <strong>{block.type === "profile" ? "Profil" : block.type === "social" ? "Sosyal medya" : block.type === "link" ? "Bağlantı" : block.type === "text" ? "Metin" : block.type === "image" ? "Görsel" : "Duyuru"} bloğu</strong>
        <button type="button" aria-label="Paneli kapat" onClick={close}><X size={18} /></button>
      </header>
      <div className="inspector-fields">
        {block.type === "profile" ? (
          <>
            <label>Ad<input value={block.data.name} onChange={(event) => update({ name: event.target.value })} /></label>
            <label>Açıklama<textarea value={block.data.title} onChange={(event) => update({ title: event.target.value })} /></label>
          </>
        ) : null}
        {block.type === "social" ? (
          <>
            <label>Platform
              <select
                value={block.data.platform}
                onChange={(event) => {
                  const config = platformById(event.target.value as SocialPlatform);
                  update({
                    platform: config.id,
                    label: config.label,
                    url: socialUrl(config.id, block.data.handle),
                    ogImage: "",
                  });
                }}
              >
                {onboardingPlatforms.map((platform) => (
                  <option key={platform.id} value={platform.id}>{platform.label}</option>
                ))}
              </select>
            </label>
            <label>Bağlantı
              <input
                value={socialLink}
                placeholder={platformById(block.data.platform).placeholder}
                onChange={(event) => {
                  setSocialLink(event.target.value);
                  applySocialLink(event.target.value);
                }}
              />
            </label>
          </>
        ) : null}
        {block.type === "link" ? (
          <>
            <label>Başlık<input value={block.data.title} onChange={(event) => update({ title: event.target.value })} /></label>
            <label>Bağlantı<input value={block.data.url} onChange={(event) => update({ url: event.target.value })} /></label>
          </>
        ) : null}
        {block.type === "image" ? (
          <>
            <label>Görsel
              <span className="inspector-upload">
                <ImageIcon size={18} />
                {uploading ? "Yükleniyor…" : block.data.assetId ? "Görseli değiştir" : "Sürükle veya seç"}
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  disabled={uploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadImage(file);
                  }}
                />
              </span>
            </label>
            <label>Başlık<input value={block.data.title} onChange={(event) => update({ title: event.target.value })} /></label>
            <label>Bağlantı<input value={block.data.url} onChange={(event) => update({ url: event.target.value })} /></label>
          </>
        ) : null}
        {block.type === "status" ? (
          <>
            <label>Duyuru<textarea value={block.data.text} onChange={(event) => update({ text: event.target.value })} /></label>
            <label>Bağlantı<input value={block.data.url} onChange={(event) => update({ url: event.target.value })} /></label>
          </>
        ) : null}
      </div>
      <footer>
        {block.type !== "profile" ? <button type="button" onClick={remove}><Trash2 size={16} /> Sil</button> : <span />}
        <button type="button" onClick={close}>Uygula</button>
      </footer>
    </aside>
  );
}

export default function Editor({ loaderData }: Route.ComponentProps) {
  const [layout, setLayout] = useState<ProfileLayout>(loaderData.layout);
  const [theme, setTheme] = useState<ProfileTheme>(loaderData.theme);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [device, setDevice] = useState<EditorDevice>("desktop");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [panel, setPanel] = useState<"theme" | "gallery" | null>(null);

  // Açık popover (tema/galeri) dışarı tıklayınca veya Escape ile kapanır.
  // Araç çubuğu hariç: oradaki butonlar kendi aç/kapa davranışını yönetir.
  useEffect(() => {
    if (!panel) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target?.closest(".editor-popover, .editor-toolbar, .editor-add-tile")) return;
      setPanel(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanel(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [panel]);

  // Seçili blok (ve onunla açılan dialog/inline editör) dışarı tıklanınca
  // veya Escape ile kapanır. Blokların, inspector'ın, yüzen araç çubuğunun
  // ve editör kontrollerinin içi "dışarısı" sayılmaz.
  useEffect(() => {
    if (!selectedId) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (
        target?.closest(
          ".grid-stack-item, .editor-profile-identity, .editor-inspector, .inline-text-toolbar, .editor-toolbar, .editor-popover, .editor-add-tile",
        )
      )
        return;
      setSelectedId(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedId(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [selectedId]);
  const [searchParams, setSearchParams] = useSearchParams();
  const versionRef = useRef(loaderData.version);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const firstRender = useRef(true);
  const selected = useMemo(
    () => layout.blocks.find((block) => block.id === selectedId) ?? null,
    [layout.blocks, selectedId],
  );
  const profileBlock = layout.blocks.find((block) => block.type === "profile");
  const bentoBlocks = layout.blocks.filter((block) => block.type !== "profile");

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (saveState === "conflict") return;
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      saveQueueRef.current = saveQueueRef.current.then(async () => {
        try {
          const response = await fetch("/api/profile/layout", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ layout, theme, version: versionRef.current }),
          });
          const result = (await response.json()) as { version?: number };
          if (response.status === 409) return setSaveState("conflict");
          if (!response.ok || !result.version) return setSaveState("error");
          versionRef.current = result.version;
          setSaveState("saved");
        } catch {
          setSaveState("error");
        }
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [layout, theme]);

  // og:image çekimi: bağlantısı olup görseli olmayan sosyal bloklar için
  // (yeni eklenen, bağlantısı değişen ya da onboarding'den görselsiz gelen).
  // Görsel her boyutta çekilip saklanır; kart büyütülünce hazır olur.
  const ogAttemptedRef = useRef(new Set<string>());
  useEffect(() => {
    const timer = window.setTimeout(() => {
      for (const block of layout.blocks) {
        if (block.type !== "social" || !block.data.url || block.data.ogImage) continue;
        const key = `${block.id}|${block.data.url}`;
        if (ogAttemptedRef.current.has(key)) continue;
        ogAttemptedRef.current.add(key);
        const { id } = block;
        const url = block.data.url;
        void fetch(`/api/og-image?url=${encodeURIComponent(url)}`)
          .then((response) =>
            response.ok ? (response.json() as Promise<{ image?: string | null }>) : null,
          )
          .then((result) => {
            const image = result?.image;
            if (!image) return;
            setLayout((current) => ({
              ...current,
              blocks: current.blocks.map((item) =>
                item.id === id && item.type === "social" && item.data.url === url
                  ? ({ ...item, data: { ...item.data, ogImage: image } } as ProfileBlock)
                  : item,
              ),
            }));
          })
          .catch(() => {});
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [layout.blocks]);

  function insertBlock(block: ProfileBlock) {
    setLayout((current) => {
      const { w, h } = sizeToDims(block.size);
      const lg = placeNewBlock(current.blocks, w, h);
      const positioned = {
        ...block,
        pos: { lg, sm: { ...lg, w: Math.min(w, GRID_COLUMNS.sm) } },
      } as ProfileBlock;
      return { ...current, blocks: withDerivedSmPositions([...current.blocks, positioned]) };
    });
    setSelectedId(block.id);
    setPanel(null);
    // Yeni blok grid'in altına eklenir ve düzenleme dialogu açılır; blok
    // dialogun arkasında kalmasın diye görünür alana kaydırılır (gridstack
    // konumu bir sonraki efektte uyguladığı için kısa gecikmeyle).
    window.setTimeout(() => {
      document
        .querySelector(`.editor-grid-stack [gs-id="${block.id}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  }

  function add(type: ProfileBlock["type"]) {
    insertBlock(defaultBlock(type));
  }

  // Dashboard kısayolları: /edit?add=link|social|text|image|status bloğu
  // hemen ekler (social galeriyi açar); /edit?panel=theme|gallery paneli açar.
  // Parametreler işlendikten sonra URL'den temizlenir.
  useEffect(() => {
    const addParam = searchParams.get("add");
    const panelParam = searchParams.get("panel");
    if (!addParam && !panelParam) return;
    if (addParam === "link" || addParam === "text" || addParam === "image" || addParam === "status") {
      add(addParam);
    } else if (addParam === "social") {
      setPanel("gallery");
    }
    if (panelParam === "theme" || panelParam === "gallery") setPanel(panelParam);
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnız ilk yüklemede
  }, []);

  function addFromGallery(pick: GalleryPick) {
    if (pick.kind === "content") return add(pick.type);
    const config = platformById(pick.platform);
    insertBlock({
      id: createBlockId(),
      type: "social",
      size: "1x1",
      data: { platform: pick.platform, handle: "", url: "", label: config.label, ogImage: "" },
    });
  }

  function updateSelected(patch: Record<string, unknown>) {
    setLayout((current) => ({
      ...current,
      blocks: current.blocks.map((block) => {
        if (block.id !== selectedId) return block;
        return { ...block, data: { ...block.data, ...patch } } as ProfileBlock;
      }),
    }));
  }

  function applyGridChange(updates: GridUpdate[], changeDevice: EditorDevice) {
    setLayout((current) => {
      const key = changeDevice === "mobile" ? "sm" : "lg";
      let changed = false;
      let blocks = current.blocks.map((block) => {
        const update = updates.find((item) => item.id === block.id);
        if (!update || block.type === "profile" || !block.pos) return block;
        const prev = block.pos[key];
        if (prev.x === update.x && prev.y === update.y && prev.w === update.w && prev.h === update.h) {
          return block;
        }
        changed = true;
        const pos = { ...block.pos, [key]: { x: update.x, y: update.y, w: update.w, h: update.h } };
        const size = changeDevice === "desktop" ? sizeFromDims(update.w, update.h) : block.size;
        return { ...block, pos, size } as ProfileBlock;
      });
      if (!changed) return current;
      // R7: desktop değişikliği smManual olmayan blokların mobilini yeniden türetir.
      if (changeDevice === "desktop") blocks = withDerivedSmPositions(blocks);
      return { ...current, blocks };
    });
  }

  function markSmManual(id: string) {
    setLayout((current) => {
      const block = current.blocks.find((item) => item.id === id);
      if (!block || block.smManual) return current;
      return {
        ...current,
        blocks: current.blocks.map((item) => (item.id === id ? { ...item, smManual: true } : item)),
      };
    });
  }

  return (
    <main className="editor-shell">
      <Link to="/dashboard" className="editor-back" aria-label="Panele dön">
        <ChevronLeft size={20} />
      </Link>
      <a
        className="editor-address-pill"
        href={`/${loaderData.username}`}
        target="_blank"
        rel="noreferrer"
      >
        <span className={`save-dot is-${saveState}`} aria-hidden />
        caka.app/{loaderData.username}
        <ExternalLink size={13} aria-hidden />
      </a>
      {saveState === "conflict" || saveState === "error" ? (
        <div className="editor-alert" role="alert">
          {saveState === "conflict" ? (
            <>
              Sayfa başka bir yerde düzenlendi.
              <button type="button" onClick={() => window.location.reload()}>Yenile</button>
            </>
          ) : (
            "Kaydedilemedi — bağlantını kontrol et."
          )}
        </div>
      ) : null}

      <section
        className={`editor-page ${device === "mobile" ? "is-mobile" : ""}`}
        data-profile-theme={theme}
      >
        <div className="editor-profile-layout">
          {profileBlock ? (
            <div
              className={`profile-identity editor-profile-identity ${selectedId === profileBlock.id ? "is-selected" : ""}`}
              role="button"
              tabIndex={0}
              aria-label="Genel profil bilgilerini düzenle"
              onClick={() => setSelectedId(profileBlock.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") setSelectedId(profileBlock.id);
              }}
            >
              <ProfileBlockCard block={profileBlock} />
              {selectedId === profileBlock.id ? <span className="selected-label">Genel bilgi</span> : null}
            </div>
          ) : null}
          <div className="editor-grid-area">
            <EditorGrid
              blocks={bentoBlocks}
              device={device}
              selectedId={selectedId}
              editingId={
                selected && (selected.type === "text" || selected.type === "status")
                  ? selected.id
                  : null
              }
              onSelect={setSelectedId}
              onChange={applyGridChange}
              onManual={markSmManual}
              onRemove={(id) => {
                setLayout((current) => ({
                  ...current,
                  blocks: current.blocks.filter((item) => item.id !== id),
                }));
                setSelectedId(null);
              }}
              renderBlock={(block) =>
                (block.type === "text" || block.type === "status") && selectedId === block.id ? (
                  <InlineTextEditor
                    key={block.id}
                    variant={block.type}
                    doc={block.data.doc}
                    fallbackText={block.data.text}
                    onChange={(doc, plain) =>
                      updateSelected(
                        block.type === "status"
                          ? { doc, text: (plain.trim() || "Duyuru").slice(0, 140) }
                          : { doc, text: (plain.trim() || "Metin").slice(0, 280) },
                      )
                    }
                    onClose={() => setSelectedId(null)}
                  />
                ) : (
                  <ProfileBlockCard block={block} />
                )
              }
            />
            <button type="button" className="editor-add-tile" onClick={() => setPanel("gallery")}>
              <Plus size={20} /> Blok ekle
            </button>
          </div>
        </div>
      </section>

      <nav className="editor-toolbar" aria-label="Editör araçları">
        <button
          type="button"
          data-tooltip="Tema"
          aria-label="Tema"
          className={panel === "theme" ? "is-active" : ""}
          onClick={() => setPanel(panel === "theme" ? null : "theme")}
        >
          <Palette size={19} />
        </button>
        <span className="toolbar-sep" aria-hidden />
        <button type="button" data-tooltip="Bağlantı ekle" aria-label="Bağlantı ekle" onClick={() => add("link")}>
          <Link2 size={19} />
        </button>
        <button type="button" data-tooltip="Metin ekle" aria-label="Metin ekle" onClick={() => add("text")}>
          <Type size={19} />
        </button>
        <button type="button" data-tooltip="Duyuru ekle" aria-label="Duyuru ekle" onClick={() => add("status")}>
          <Megaphone size={18} />
        </button>
        <button type="button" data-tooltip="Görsel ekle" aria-label="Görsel ekle" onClick={() => add("image")}>
          <ImageIcon size={19} />
        </button>
        <button
          type="button"
          data-tooltip="Blok galerisi"
          aria-label="Blok galerisi"
          className={panel === "gallery" ? "is-active" : ""}
          onClick={() => setPanel(panel === "gallery" ? null : "gallery")}
        >
          <LayoutGrid size={19} />
        </button>
        <span className="toolbar-sep" aria-hidden />
        <button
          type="button"
          data-tooltip={device === "desktop" ? "Mobil önizleme" : "Masaüstü görünümü"}
          aria-label={device === "desktop" ? "Mobil önizleme" : "Masaüstü görünümü"}
          className={device === "mobile" ? "is-active" : ""}
          onClick={() => setDevice(device === "desktop" ? "mobile" : "desktop")}
        >
          {device === "desktop" ? <Smartphone size={18} /> : <Monitor size={19} />}
        </button>
      </nav>

      {panel === "theme" ? (
        <div className="theme-popover editor-popover" role="group" aria-label="Tema seç">
          {onboardingTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              className={theme === template.theme ? "is-active" : ""}
              onClick={() => setTheme(template.theme)}
            >
              <span className={`swatch ${template.className}`} aria-hidden />
              {template.label}
            </button>
          ))}
        </div>
      ) : null}

      {panel === "gallery" ? <BlockGallery onPick={addFromGallery} /> : null}

      {/* Metin ve duyuru blokları dialog yerine tuvalde düzenlenir (InlineTextEditor). */}
      {selected && selected.type !== "text" && selected.type !== "status" ? (
        <Inspector
          block={selected}
          update={updateSelected}
          close={() => setSelectedId(null)}
          remove={() => {
            setLayout((current) => ({ ...current, blocks: current.blocks.filter((block) => block.id !== selected.id) }));
            setSelectedId(null);
          }}
        />
      ) : null}
    </main>
  );
}
