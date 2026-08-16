import { useEffect, useMemo, useRef, useState } from "react";
import { env } from "cloudflare:workers";
import {
  BarChart3,
  Eye,
  ImageIcon,
  Link2,
  Monitor,
  Palette,
  Plus,
  Settings,
  Smartphone,
  Trash2,
  Type,
  Users,
  X,
} from "lucide-react";
import { Link, redirect } from "react-router";

import { logoBlack } from "~/assets/brand";
import { ProfileBlockCard } from "~/components/profile-block";
import { onboardingTemplates, platformById } from "~/content/onboarding";
import {
  createBlockId,
  parseProfileLayout,
  type BlockSize,
  type ProfileBlock,
  type ProfileLayout,
  type ProfileTheme,
} from "@caka/shared";
import { getSession } from "../../server/auth";
import { getProfileByUserId } from "../../server/profile";
import type { Route } from "./+types/edit";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Editör — Caka" }];
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
    layout,
    theme: profile.theme as ProfileTheme,
    version: profile.version,
  };
}

type SaveState = "saved" | "saving" | "error" | "conflict";

function defaultBlock(type: ProfileBlock["type"]): ProfileBlock {
  const id = createBlockId();
  if (type === "link") return { id, type, size: "1x1", data: { title: "Yeni bağlantı", url: "" } };
  if (type === "social") return { id, type, size: "1x1", data: { platform: "instagram", handle: "@kullaniciadi", url: "https://instagram.com/", label: "Instagram" } };
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
                <button key={size} type="button" className={block.size === size ? "is-active" : ""} onClick={() => update({ size } as never)}>{size.replace("x", "×")}</button>
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
  const [selectedId, setSelectedId] = useState<string | null>(layout.blocks[0]?.id ?? null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [draggedId, setDraggedId] = useState<string | null>(null);
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

  function add(type: ProfileBlock["type"]) {
    const block = defaultBlock(type);
    setLayout((current) => ({ ...current, blocks: [...current.blocks, block] }));
    setSelectedId(block.id);
  }

  function updateSelected(patch: Record<string, unknown>) {
    setLayout((current) => ({
      ...current,
      blocks: current.blocks.map((block) => {
        if (block.id !== selectedId) return block;
        if ("size" in patch) return { ...block, size: patch.size as BlockSize };
        return { ...block, data: { ...block.data, ...patch } } as ProfileBlock;
      }),
    }));
  }

  function moveBefore(targetId: string) {
    if (!draggedId || draggedId === targetId) return;
    setLayout((current) => {
      const source = current.blocks.find((block) => block.id === draggedId);
      if (!source) return current;
      const blocks = current.blocks.filter((block) => block.id !== draggedId);
      const targetIndex = blocks.findIndex((block) => block.id === targetId);
      blocks.splice(Math.max(0, targetIndex), 0, source);
      return { ...current, blocks };
    });
  }

  return (
    <main className="editor-shell">
      <header className="editor-topbar">
        <div className="editor-address"><img src={logoBlack} alt="Caka" /><span>caka.app/{loaderData.username}</span><span className={`save-dot is-${saveState}`} /> <small>{saveState === "saved" ? "Kaydedildi" : saveState === "saving" ? "Kaydediliyor" : saveState === "conflict" ? "Başka yerde düzenlendi" : "Kaydedilemedi"}</small></div>
        <div className="editor-actions">
          <div className="device-switch">
            <button type="button" className={device === "desktop" ? "is-active" : ""} onClick={() => setDevice("desktop")} aria-label="Masaüstü görünümü"><Monitor size={17} /></button>
            <button type="button" className={device === "mobile" ? "is-active" : ""} onClick={() => setDevice("mobile")} aria-label="Mobil görünüm"><Smartphone size={16} /></button>
          </div>
          <Link to={`/${loaderData.username}`} target="_blank"><Eye size={16} /> Önizle</Link>
          <Link className="publish-button" to={`/${loaderData.username}`} target="_blank">Yayınla</Link>
        </div>
      </header>

      <aside className="editor-sidebar">
        <h2>Blok ekle</h2>
        <button type="button" onClick={() => add("link")}><Link2 size={17} /> Bağlantı</button>
        <button type="button" onClick={() => add("social")}><Users size={17} /> Sosyal medya</button>
        <button type="button" onClick={() => add("text")}><Type size={17} /> Metin</button>
        <button type="button" onClick={() => add("image")}><ImageIcon size={17} /> Görsel</button>
        <hr />
        <h2>Sayfa</h2>
        <button
          type="button"
          onClick={() => {
            const themes = onboardingTemplates.map((item) => item.theme);
            setTheme(themes[(themes.indexOf(theme) + 1) % themes.length]!);
          }}
        ><Palette size={17} /> Tema</button>
        <button type="button"><BarChart3 size={17} /> Analitik</button>
        <button type="button"><Settings size={17} /> Ayarlar</button>
      </aside>

      <section className={`editor-workspace is-${device}`} data-profile-theme={theme}>
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
          <div className="editor-grid">
            {bentoBlocks.map((block) => (
              <div
                key={block.id}
                draggable
                className={`editor-grid-item size-${block.size} ${selectedId === block.id ? "is-selected" : ""}`}
                onDragStart={() => setDraggedId(block.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => moveBefore(block.id)}
                onDragEnd={() => setDraggedId(null)}
                onClick={() => setSelectedId(block.id)}
              >
                <ProfileBlockCard block={block} />
                {selectedId === block.id ? <span className="selected-label">{block.type}</span> : null}
              </div>
            ))}
            <button type="button" className="editor-add-tile" onClick={() => add("link")}><Plus size={20} /> Blok ekle</button>
          </div>
        </div>
      </section>

      {selected ? (
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
