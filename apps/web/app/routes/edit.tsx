import { useEffect, useMemo, useRef, useState } from "react";
import { env } from "cloudflare:workers";
import {
  AlertTriangle,
  ChevronLeft,
  ExternalLink,
  ImageIcon,
  LayoutGrid,
  Link2,
  Megaphone,
  Monitor,
  Palette,
  Plus,
  Send,
  Smartphone,
  Trash2,
  Type,
  X,
} from "lucide-react";
import { Link, redirect, useNavigate, useSearchParams } from "react-router";

import { BlockGallery, type GalleryPick } from "~/components/editor/gallery";
import { EditorGrid, type EditorDevice, type GridUpdate } from "~/components/editor/grid";
import { InlineTextEditor } from "~/components/editor/rich-text-editor";
import { ProfileBlockCard } from "~/components/profile-block";
import { onboardingPlatforms, onboardingTemplates, platformById } from "~/content/onboarding";
import { noIndexMeta } from "~/lib/seo";
import {
  BLOCK_TYPE_LABELS,
  GRID_COLUMNS,
  blockIssue,
  createBlockId,
  detectSocialFromUrl,
  layoutIssues,
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
import { collectGithubLogins, getGithubCalendars } from "../../server/github";
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
  const published = parseProfileLayout(profile.layout);
  if (!published) throw new Response("Sayfa düzeni okunamadı", { status: 500 });
  // Editör her zaman taslağı açar; taslak yoksa yayınlanmış hâlden devam eder.
  const draft = profile.draftLayout ? parseProfileLayout(profile.draftLayout) : null;
  const layout = ensureLayoutPositions(draft ?? published);
  return {
    username: profile.username,
    layout,
    theme: normalizeTheme(draft ? (profile.draftTheme ?? profile.theme) : profile.theme),
    version: profile.version,
    hasDraft: Boolean(draft),
    // Editör WYSIWYG kalsın: GitHub kartı canlıdaki heatmap'iyle görünür.
    githubCalendars: await getGithubCalendars(env, collectGithubLogins(layout)),
  };
}

type SaveState = "saved" | "saving" | "error" | "conflict";

// Yeni bloklar BOŞ doğar: örnek metin gömülürse kullanıcı yazmaya başlayınca
// başta kalıyor. Eksik alanlar "Aksiyon gerekli" rozetiyle işaretlenir ve
// yayınlamayı bloklar (blockIssue).
// switch + never: yeni bir blok tipi eklendiğinde derleyici burayı işaret
// eder. Eskiden `if` zinciriydi ve unutulan tip sessizce İKİNCİ bir profil
// bloğuna dönüşüp "tam olarak bir profil bloğu" kuralını kırıyordu.
function defaultBlock(type: ProfileBlock["type"]): ProfileBlock {
  const id = createBlockId();
  switch (type) {
    case "link":
      return { id, type, size: "1x1", data: { title: "", url: "", ogImage: "" } };
    case "social":
      return { id, type, size: "1x1", data: { platform: "instagram", handle: "", url: "", label: "Instagram", ogImage: "" } };
    case "text":
      return { id, type, size: "2x1", data: { text: "" } };
    case "image":
      return { id, type, size: "2x1", data: { title: "", url: "" } };
    case "status":
      return { id, type, size: "2x1", data: { text: "", url: "" } };
    // KTD39: beş fotoğrafın 145,6×140'lık neredeyse kare hücrelere düştüğü
    // tek konfigürasyon 4×1.
    case "gallery":
      return { id, type, size: "4x1", data: { title: "", photos: [] } };
    // Varsayılan video: kanal bloğu aynı tipin `kind: "channel"` hâli ve
    // ayrım yapıştırılan adresten kayıt anında çözülür (KTD34).
    case "youtube":
      return {
        id,
        type,
        size: "2x1",
        data: { kind: "video", url: "", videoId: "", title: "", channelName: "", duration: "", shorts: false, thumbnail: "" },
      };
    case "profile":
      return { id, type: "profile", size: "1x1", data: { name: "", title: "" } };
    default: {
      const exhaustive: never = type;
      throw new Error(`Bilinmeyen blok tipi: ${String(exhaustive)}`);
    }
  }
}

// Dashboard kısayolu (/edit?add=…) ile eklenebilen tipler. Record olduğu için
// yeni bir tip eklendiğinde burada da karar vermek zorunludur.
const DEEP_LINK_ADDABLE: Record<ProfileBlock["type"], boolean> = {
  profile: false,
  // social galeriyi açar, doğrudan eklenmez.
  social: false,
  link: true,
  text: true,
  image: true,
  status: true,
  // Panelde kısayolu yok; blok galerisinden eklenir (U32/U33 açar).
  gallery: false,
  youtube: false,
};

function isDeepLinkAddable(value: string): value is ProfileBlock["type"] {
  return Object.hasOwn(DEEP_LINK_ADDABLE, value) && DEEP_LINK_ADDABLE[value as ProfileBlock["type"]];
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
  // Yükleme hatası (kota, tür, boyut) sessizce yutulmaz: sunucunun Türkçe
  // mesajı panelde gösterilir.
  const [uploadError, setUploadError] = useState<string | null>(null);
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
    setUploadError(null);
    try {
      const response = await fetch("/api/onboarding/avatar", {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const result = (await response.json()) as { id?: string; error?: string };
      if (response.ok && result.id) update({ assetId: result.id });
      else setUploadError(result.error ?? "Görsel yüklenemedi");
    } catch {
      setUploadError("Görsel yüklenemedi");
    } finally {
      setUploading(false);
    }
  }

  // Alanlar tip başına tek bir switch'te toplanır: `never` default'u sayesinde
  // yeni bir blok tipi eklendiğinde derleyici burada durur (eskiden art arda
  // `if` bloklarıydı; unutulan tip sessizce alansız bir panel açıyordu).
  function fields() {
    switch (block.type) {
      case "profile":
        return (
          <>
            <label>Ad<input value={block.data.name} onChange={(event) => update({ name: event.target.value })} /></label>
            <label>Açıklama<textarea value={block.data.title} onChange={(event) => update({ title: event.target.value })} /></label>
          </>
        );
      case "social":
        return (
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
            <label>Bağlantı ya da kullanıcı adı
              <input
                value={socialLink}
                placeholder={platformById(block.data.platform).placeholder}
                onChange={(event) => {
                  setSocialLink(event.target.value);
                  applySocialLink(event.target.value);
                }}
              />
              <small className="inspector-hint">
                Profil bağlantısını yapıştırabilir ya da sadece kullanıcı adını yazabilirsin —
                ikisini de anlıyoruz.
              </small>
            </label>
          </>
        );
      case "link":
        return (
          <>
            <label>Başlık<input value={block.data.title} onChange={(event) => update({ title: event.target.value })} /></label>
            <label>Bağlantı<input value={block.data.url} onChange={(event) => update({ url: event.target.value })} /></label>
          </>
        );
      case "image":
        return (
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
            {uploadError ? <p className="inspector-error" role="alert">{uploadError}</p> : null}
            <label>Başlık<input value={block.data.title} onChange={(event) => update({ title: event.target.value })} /></label>
            <label>Bağlantı<input value={block.data.url} onChange={(event) => update({ url: event.target.value })} /></label>
          </>
        );
      case "status":
        return (
          <>
            <label>Duyuru<textarea value={block.data.text} onChange={(event) => update({ text: event.target.value })} /></label>
            <label>Bağlantı<input value={block.data.url} onChange={(event) => update({ url: event.target.value })} /></label>
          </>
        );
      case "gallery":
        return (
          <label>Başlık<input value={block.data.title} onChange={(event) => update({ title: event.target.value })} /></label>
        );
      case "youtube":
        // Tek alan: adres. Video mu kanal mı olduğu ve başlık/küçük görsel
        // gibi alanlar kayıt anında sunucuda çözülür (KTD34), kullanıcı
        // ikisini ayrı ayrı seçmez — yapıştırdığı bağlantı zaten söylüyor.
        return (
          <label>YouTube bağlantısı
            <input
              value={block.data.url}
              placeholder="youtube.com/watch?v=… ya da youtube.com/@kanal"
              onChange={(event) => update({ url: event.target.value })}
            />
          </label>
        );
      // Metin bloğu tuval üzerinde Tiptap ile düzenlenir; panelde alanı yok.
      case "text":
        return null;
      default: {
        const exhaustive: never = block;
        void exhaustive;
        return null;
      }
    }
  }

  return (
    <aside className="editor-inspector">
      <header>
        <strong>{BLOCK_TYPE_LABELS[block.type]} bloğu</strong>
        <button type="button" aria-label="Paneli kapat" onClick={close}><X size={18} /></button>
      </header>
      <div className="inspector-fields">
        {fields()}
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
  // Yayın durumu: taslak canlıdan farklıysa "Bitir ve yayınla" beklenir.
  const [hasDraft, setHasDraft] = useState(loaderData.hasDraft);
  const [publishing, setPublishing] = useState(false);
  // Eksik blok rozetleri her zaman görünür (boş kutu tıklanabilir/anlaşılır
  // olsun diye). Toplu "Aksiyon gerekli" paneli ise yalnız yayın denendikten
  // sonra açılır ve kullanıcı eksikleri kapattıkça kendiliğinden kaybolur.
  const [publishTried, setPublishTried] = useState(false);
  const navigate = useNavigate();

  // Gerçek telefonda editör mobil düzeni yönetmeli. Aksi hâlde sürükleme
  // masaüstü (lg) konumlarına yazılır, telefondan bakan ziyaretçi ise sm
  // konumlarını görür — kullanıcının yaptığı düzen "kaybolmuş" görünür.
  useEffect(() => {
    if (window.matchMedia("(max-width: 640px)").matches) setDevice("mobile");
  }, []);

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

  // Otomatik kaydetme TASLAĞA yazar; canlı sayfa yalnız "yayınla" ile değişir.
  const latestRef = useRef({ layout, theme });
  const saveTimerRef = useRef<number | null>(null);
  // Yayın sürerken autosave devreye girmemeli: araya giren PUT versiyonu
  // kaydırıp publish'i 409'a düşürür, kullanıcı ise sayfadan ayrılmış olur.
  const publishingRef = useRef(false);
  // Yayın sürerken yapılan düzenleme kaydedilmeden kalmasın: bayrakla işaretle,
  // yayın bitince (422/no-op dallarında editörde kalınır) taslağı tekrar yaz.
  const dirtyWhilePublishingRef = useRef(false);
  useEffect(() => {
    latestRef.current = { layout, theme };
  }, [layout, theme]);

  function queueSave(): Promise<boolean> {
    let ok = false;
    saveQueueRef.current = saveQueueRef.current.then(async () => {
      try {
        const response = await fetch("/api/profile/layout", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...latestRef.current, version: versionRef.current }),
        });
        const result = (await response.json()) as { version?: number };
        if (response.status === 409) return setSaveState("conflict");
        if (!response.ok || !result.version) return setSaveState("error");
        versionRef.current = result.version;
        setSaveState("saved");
        setHasDraft(true);
        ok = true;
      } catch {
        setSaveState("error");
      }
    });
    return saveQueueRef.current.then(() => ok);
  }

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (saveState === "conflict") return;
    if (publishingRef.current) {
      dirtyWhilePublishingRef.current = true;
      return;
    }
    setSaveState("saving");
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      void queueSave();
    }, 800);
    return () => {
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnız içerik değişince
  }, [layout, theme]);

  // Yayına engel olan eksik bloklar (boş sosyal kutu, metinsiz blok…).
  const issues = useMemo(() => (publishTried ? layoutIssues(layout) : []), [publishTried, layout]);

  function focusBlock(id: string) {
    setSelectedId(id);
    window.setTimeout(() => {
      // Profil kartı grid'de değil, sol/üst kimlik alanındadır.
      const target =
        document.querySelector(`.editor-grid-stack [gs-id="${id}"]`) ??
        document.querySelector(".editor-profile-identity");
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  function removeBlock(id: string) {
    setLayout((current) => ({
      ...current,
      blocks: current.blocks.filter((block) => block.id !== id),
    }));
    setSelectedId(null);
  }

  async function publish() {
    if (publishing) return;
    // Bekleyen debounce'u iptal et, taslağı kesinleştir, sonra yayınla.
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setPublishing(true);
    publishingRef.current = true;
    const stop = () => {
      publishingRef.current = false;
      setPublishing(false);
      // Yayın sürerken yazılanlar effect tarafından atlandı; şimdi kaydet.
      if (dirtyWhilePublishingRef.current) {
        dirtyWhilePublishingRef.current = false;
        setSaveState("saving");
        void queueSave();
      }
    };
    const saved = await queueSave();
    if (!saved) return stop();
    try {
      const response = await fetch("/api/profile/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: versionRef.current }),
      });
      const result = (await response.json()) as {
        version?: number;
        published?: boolean;
        issues?: { blockId: string; label: string; message: string }[];
      };
      if (response.status === 422) {
        stop();
        setPublishTried(true);
        if (result.issues?.[0]) focusBlock(result.issues[0].blockId);
        return;
      }
      if (response.status === 409) {
        stop();
        return setSaveState("conflict");
      }
      if (!response.ok || !result.version) {
        stop();
        return setSaveState("error");
      }
      versionRef.current = result.version;
      setPublishTried(false);
      setHasDraft(false);
      // Yayınlanacak yeni bir şey yoktu: sayfa zaten canlı, editörde kal.
      if (result.published === false) return stop();
      // Yayın sonrası doğrudan sayfanın kendisine (önizlemeye) geçilir.
      // stop() önce çağrılır: yönlendirme gerçekleşmezse editör kilitli kalmasın.
      stop();
      void navigate(`/${loaderData.username}`);
    } catch {
      stop();
      setSaveState("error");
    }
  }

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
    if (addParam && isDeepLinkAddable(addParam)) {
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
      <div className="editor-topbar">
        <a
          className="editor-address-pill"
          href={`/${loaderData.username}`}
          target="_blank"
          rel="noreferrer"
          title={hasDraft ? "Yayınlanmamış değişiklikler var" : "Yayındaki sayfan"}
          aria-label={`caka.app/${loaderData.username} — ${hasDraft ? "taslak var" : "yayında"}`}
        >
          <span className={`save-dot is-${saveState}`} aria-hidden />
          {/* Dar ekranda adres gizlenir; yalnız nokta + durum metni kalır (CSS) */}
          <span className="address-host" aria-hidden>caka.app/{loaderData.username}</span>
          {hasDraft ? <span className="draft-chip" aria-hidden>Taslak</span> : null}
          <span className="address-status" aria-hidden>{hasDraft ? "Taslak" : "Yayında"}</span>
          <ExternalLink size={13} aria-hidden className="address-open" />
        </a>
        <button
          type="button"
          className="editor-publish"
          onClick={() => void publish()}
          disabled={publishing || !hasDraft}
          aria-label={publishing ? "Yayınlanıyor" : hasDraft ? "Bitir ve yayınla" : "Yayında"}
        >
          <Send size={15} aria-hidden />
          {/* Mobilde kısa etiket görünür ("Yayınla"); erişilebilir ad aria-label'da */}
          <span className="publish-label" aria-hidden>
            {publishing ? "Yayınlanıyor…" : hasDraft ? "Bitir ve yayınla" : "Yayında"}
          </span>
          <span className="publish-label-short" aria-hidden>
            {publishing ? "Yayınlanıyor…" : hasDraft ? "Yayınla" : "Yayında"}
          </span>
        </button>
      </div>

      {issues.length ? (
        <div className="editor-issue-panel" role="alert">
          <strong>
            <AlertTriangle size={15} aria-hidden /> Aksiyon gerekli
          </strong>
          <p>Şu bloklar tamamlanmadan sayfan yayınlanamaz. Doldur ya da kaldır:</p>
          <ul>
            {issues.map((issue) => (
              <li key={issue.blockId}>
                <span>
                  <b>{issue.label}</b> — {issue.message}
                </span>
                <button type="button" onClick={() => focusBlock(issue.blockId)}>
                  Düzelt
                </button>
                {/* Profil kartı zorunludur (düzende tam bir tane); kaldırılamaz. */}
                {issue.blockId === profileBlock?.id ? null : (
                  <button
                    type="button"
                    className="is-remove"
                    onClick={() => removeBlock(issue.blockId)}
                  >
                    Kaldır
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

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
              className={`profile-identity editor-profile-identity ${selectedId === profileBlock.id ? "is-selected" : ""} ${blockIssue(profileBlock) ? "is-incomplete" : ""}`}
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
          {/* Düzenleme modunda kart tıklaması bloğu seçer, bağlantıyı AÇMAZ:
              kullanıcı düzenlemek için tıklıyor, hedef siteye gitmek için değil. */}
          <div
            className="editor-grid-area"
            onClickCapture={(event) => {
              if ((event.target as Element).closest("a")) event.preventDefault();
            }}
          >
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
              issueOf={blockIssue}
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
                          ? { doc, text: plain.trim().slice(0, 140) }
                          : { doc, text: plain.trim().slice(0, 280) },
                      )
                    }
                    onClose={() => setSelectedId(null)}
                  />
                ) : (
                  <ProfileBlockCard block={block} githubCalendars={loaderData.githubCalendars} />
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
