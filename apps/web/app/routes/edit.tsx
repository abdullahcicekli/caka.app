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
import { ProfileBlockCard } from "~/components/profile-block";
import { onboardingTemplates, platformById } from "~/content/onboarding";
import { noIndexMeta } from "~/lib/seo";
import {
  BLOCK_GRID_LIMITS,
  GRID_COLUMNS,
  createBlockId,
  ensureLayoutPositions,
  normalizeTheme,
  parseProfileLayout,
  placeNewBlock,
  sizeFromDims,
  sizeToDims,
  withDerivedSmPositions,
  type BlockSize,
  type ProfileBlock,
  type ProfileLayout,
  type ProfileTheme,
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
  if (type === "social") return { id, type, size: "1x1", data: { platform: "instagram", handle: "", url: "", label: "Instagram" } };
  if (type === "text") return { id, type, size: "2x1", data: { text: "Yeni metin bloğu" } };
  if (type === "image") return { id, type, size: "2x1", data: { title: "Görsel", url: "" } };
  if (type === "status") return { id, type, size: "2x1", data: { text: "Yeni duyuru", url: "" } };
  return { id, type: "profile", size: "1x1", data: { name: "Adın", title: "Kısa açıklaman" } };
}

function Inspector({
  block,
  update,
  resize,
  remove,
  close,
}: {
  block: ProfileBlock;
  update: (patch: Partial<ProfileBlock["data"]>) => void;
  resize: (size: BlockSize) => void;
  remove: () => void;
  close: () => void;
}) {
  const [uploading, setUploading] = useState(false);

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
                  const config = platformById(event.target.value as typeof block.data.platform);
                  update({ platform: config.id, label: config.label });
                }}
              >
                {(["instagram", "x", "tiktok", "youtube", "linkedin", "github", "website"] as const).map((id) => (
                  <option key={id} value={id}>{platformById(id).label}</option>
                ))}
              </select>
            </label>
            <label>Kullanıcı adı<input value={block.data.handle} onChange={(event) => update({ handle: event.target.value })} /></label>
            <label>Bağlantı<input value={block.data.url} onChange={(event) => update({ url: event.target.value })} /></label>
          </>
        ) : null}
        {block.type === "link" ? (
          <>
            <label>Başlık<input value={block.data.title} onChange={(event) => update({ title: event.target.value })} /></label>
            <label>Bağlantı<input value={block.data.url} onChange={(event) => update({ url: event.target.value })} /></label>
          </>
        ) : null}
        {block.type === "text" ? <label>Metin<textarea value={block.data.text} onChange={(event) => update({ text: event.target.value })} /></label> : null}
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
        {block.type !== "profile" ? (
          <fieldset>
            <legend>Boyut</legend>
            <div className="size-picker">
              {(["1x1", "2x1", "2x2"] as BlockSize[]).map((size) => (
                <button key={size} type="button" className={block.size === size ? "is-active" : ""} onClick={() => resize(size)}>{size.replace("x", "×")}</button>
              ))}
            </div>
          </fieldset>
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
      data: { platform: pick.platform, handle: "", url: "", label: config.label },
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

  function resizeSelected(size: BlockSize) {
    setLayout((current) => {
      const blocks = current.blocks.map((block) => {
        if (block.id !== selectedId || block.type === "profile" || !block.pos) return block;
        const limits = BLOCK_GRID_LIMITS[block.type];
        const dims = sizeToDims(size);
        const w = Math.min(Math.max(dims.w, limits.minW), limits.maxW);
        const h = Math.min(Math.max(dims.h, limits.minH), limits.maxH);
        const x = Math.min(block.pos.lg.x, GRID_COLUMNS.lg - w);
        return {
          ...block,
          size: sizeFromDims(w, h),
          pos: { ...block.pos, lg: { ...block.pos.lg, x, w, h } },
        } as ProfileBlock;
      });
      return { ...current, blocks: withDerivedSmPositions(blocks) };
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
              onSelect={setSelectedId}
              onChange={applyGridChange}
              onManual={markSmManual}
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
        <div className="theme-popover" role="group" aria-label="Tema seç">
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

      {panel === "gallery" ? <BlockGallery onPick={addFromGallery} onClose={() => setPanel(null)} /> : null}

      {selected ? (
        <Inspector
          block={selected}
          update={updateSelected}
          resize={resizeSelected}
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
