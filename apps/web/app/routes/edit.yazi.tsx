// Yazı editörü (U7): başlık + adres + Tiptap gövde, 800ms debounce'lu
// otomatik kayıt (edit.tsx'in latestRef + saveTimerRef + saveQueueRef
// zincirinin satır düzeyi karşılığı) ve yayınla/taslağa al/sil eylemleri.
//
// `:id` parametresi ya gerçek yazı kimliğidir ya da `yeni` nöbetçi değeri:
// yeni yazı SUNUCUDA HEMEN AÇILMAZ — başlık ve geçerli adres oluşana kadar
// yalnız bu sekmede yaşar, ilk başarılı POST'tan sonra adres gerçek kimliğe
// `replace` ile döner. Böylece vazgeçilen "yeni yazı" tıklamaları 20'lik
// sınırı (R8) yiyen çöp taslaklar bırakmaz. (`yeni` bir UUID ile çakışamaz;
// nöbetçi değer bilinçli olarak dilden bağımsızdır.)
//
// "İçerik kaybettirmez" üç parçayla doğru (R7): 50 KB'a yaklaşırken canlı
// bayt göstergesi; aşımda kayıt REDDEDİLİR ve editörde açık hata durur;
// kaydedilmemiş değişiklik varken sayfadan ayrılış `beforeunload` onayına
// bağlıdır. Autosave'in sessizliği sessiz redde dönüşmez.
import { useEffect, useMemo, useRef, useState } from "react";
import { env } from "cloudflare:workers";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  Bold,
  Code,
  Italic,
  Link as LinkIcon,
  List,
  Lock,
  MediaImage,
  NavArrowLeft,
  NumberedListLeft,
  OpenNewWindow,
  Quote,
  Trash,
} from "iconoir-react";
import { Link, useNavigate } from "react-router";

import {
  DEFAULT_LOCALE,
  MAX_POSTS_PER_PROFILE,
  POST_BODY_MAX_BYTES,
  POST_SLUG_MAX,
  POST_TITLE_MAX,
  postBodyByteLength,
  validatePostSlug,
} from "@caka/shared";
import { richTextExtensions } from "~/components/editor/rich-text-editor";
import { appCatalog } from "~/content/app";
import { yaziEditorCatalog, type SlugStatusId } from "~/content/yazi-editor";
import { prepareImageForUpload } from "~/lib/image-upload";
import { useCatalog, useLocalizedPath } from "~/lib/locale";
import { noIndexMeta } from "~/lib/seo";
import { getSession } from "../../server/auth";
import { localeFromRequest, localizedRedirect } from "../../server/locale";
import { getOwnPostFull, getOwnPostOptions } from "../../server/post-list";
import { getProfileByUserId } from "../../server/profile";
import type { Route } from "./+types/edit.yazi";

export function meta({ loaderData }: Route.MetaArgs) {
  return noIndexMeta(yaziEditorCatalog[loaderData?.locale ?? DEFAULT_LOCALE].editor.metaTitle);
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await getSession(env, request);
  if (!session) throw localizedRedirect(request, "/login");
  const profile = await getProfileByUserId(env, session.user.id);
  if (!profile) throw localizedRedirect(request, "/onboarding");
  if (!profile.onboardingCompletedAt) throw localizedRedirect(request, "/onboarding/kurulum/profil");

  const locale = localeFromRequest(request);
  if (params.id === "yeni") {
    // R8 kapısı için sayım (taslaklar dahil); asıl kapı sunucu POST'unda.
    const posts = await getOwnPostOptions(env, profile.id);
    return { locale, username: profile.username, post: null, postCount: posts.length };
  }
  const row = await getOwnPostFull(env, profile.id, params.id);
  if (!row) throw localizedRedirect(request, "/edit/yazilar");
  return { locale, username: profile.username, post: row, postCount: 0 };
}

type SaveState =
  | "pending" // yeni yazı: başlık/adres oluşana dek sunucuda bir şey yok
  | "saving"
  | "saved"
  | "error"
  | "conflict"
  | "unauthenticated"
  | "tooLarge";

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

function parseDoc(body: string | null): unknown {
  if (!body) return EMPTY_DOC;
  try {
    return JSON.parse(body);
  } catch {
    return EMPTY_DOC;
  }
}

/**
 * Başlıktan adres taslağı türetir (yalnız yeni yazıda, kullanıcı adrese
 * dokunana kadar). `normalizePostSlug` yetmez: o yalnız kanonikleştirir,
 * burada boşluk ve noktalama tireye, aksanlı harfler ASCII'ye iner —
 * `validatePostSlug`'ın kabul ettiği alfabeye.
 */
function slugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replaceAll("ı", "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, POST_SLUG_MAX);
}

/** API yanıtlarının ortak yazı zarfı (post-api `toMeta`). */
type PostMeta = {
  id: string;
  slug: string;
  title: string;
  status: string;
  publishedAt: number | null;
  updatedAt: number;
};

export default function EditYazi({ loaderData }: Route.ComponentProps) {
  const { username, post, postCount } = loaderData;
  const content = useCatalog(yaziEditorCatalog);
  const rt = useCatalog(appCatalog).editor.richText;
  const path = useLocalizedPath();
  const navigate = useNavigate();

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  // Mevcut yazıda adres "dokunulmuş" sayılır: başlık değişince ezilmez.
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [status, setStatus] = useState(post?.status ?? "draft");
  const [publishedAt, setPublishedAt] = useState<number | null>(post?.publishedAt ?? null);
  const [saveState, setSaveState] = useState<SaveState>(post ? "saved" : "pending");
  const [slugStatus, setSlugStatus] = useState<SlugStatusId | null>(null);
  const [bodyBytes, setBodyBytes] = useState(() => postBodyByteLength(post?.body ?? ""));
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Autosave zinciri — edit.tsx deseni: en son içerik ref'te, gönderim tek
  // kuyruktan (yarışan PUT'lar birbirini ezmesin), debounce 800ms.
  const latestRef = useRef({
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    body: post?.body ?? JSON.stringify(EMPTY_DOC),
  });
  const persistedRef = useRef<{ id: string | null; updatedAt: number; slug: string }>({
    id: post?.id ?? null,
    updatedAt: post?.updatedAt ?? 0,
    slug: post?.slug ?? "",
  });
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const saveTimerRef = useRef<number | null>(null);
  // Kaydedilmemiş değişiklik var mı (beforeunload + yayına engel). Sayaçla
  // izlenir: kuyruk uçuştayken yazılan yeni harfler "kaydedildi" sayılmasın.
  const editSeqRef = useRef(0);
  const savedSeqRef = useRef(0);
  // Çakışmada (409 kilit) autosave DURUR: karşı sürümün üstüne körlemesine
  // yazmak öteki sekmenin işini ezerdi; kullanıcı metnini kopyalayıp yeniler.
  const conflictRef = useRef(false);

  // R18/AE9: bir kez yayınlanmış (taslağa dönmüş olsa da) yazının adresi
  // kilitli GÖSTERİLİR — alan kaybolmaz, yanında nedeni yazar.
  const slugLocked = publishedAt !== null;

  // R8: sınırda "yeni yazı" ekranı hiç açılmaz; kimlikli engel + sebep.
  const blocked = !post && postCount >= MAX_POSTS_PER_PROFILE;

  const overLimit = bodyBytes > POST_BODY_MAX_BYTES;
  const dirty = () => editSeqRef.current !== savedSeqRef.current;

  /** Sunucu yanıtı geldi: kilit damgası tazelenir ve — kuyruk uçuştayken yeni
   *  harf yazılmadıysa — içerik "kaydedildi" sayılır. */
  function markSaved(meta: PostMeta, seq: number) {
    persistedRef.current = { id: meta.id, updatedAt: meta.updatedAt, slug: meta.slug };
    if (editSeqRef.current === seq) savedSeqRef.current = seq;
    setSaveState("saved");
  }

  function queueSave(): Promise<void> {
    saveQueueRef.current = saveQueueRef.current.then(async () => {
      if (conflictRef.current) return;
      const snapshot = { ...latestRef.current, seq: editSeqRef.current };
      // R7: aşan gövde YOLA ÇIKMAZ; durum açık hatayla söylenir.
      if (postBodyByteLength(snapshot.body) > POST_BODY_MAX_BYTES) {
        setSaveState("tooLarge");
        return;
      }
      try {
        if (!persistedRef.current.id) {
          // Oluşturma: başlık ve geçerli adres olmadan sunucuya gidilmez.
          const slugResult = validatePostSlug(snapshot.slug);
          if (!snapshot.title.trim() || !slugResult.ok) {
            setSaveState("pending");
            return;
          }
          const response = await fetch("/api/yazi", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              slug: snapshot.slug,
              title: snapshot.title,
              body: snapshot.body,
            }),
          });
          if (response.status === 401) return setSaveState("unauthenticated");
          // PUT dalıyla aynı ayrım: ilk kayıtta da 413 "bağlantını kontrol et"
          // değil, boyut hatasıdır.
          if (response.status === 413) return setSaveState("tooLarge");
          const result = (await response.json()) as { post?: PostMeta };
          if (response.status === 409) {
            setSlugStatus("taken");
            return setSaveState("error");
          }
          if (!response.ok || !result.post) return setSaveState("error");
          markSaved(result.post, snapshot.seq);
          // Adres artık gerçek kimlik; `replace` — geri tuşu "yeni"ye dönmesin.
          // Route aynı kaldığı için bileşen ve editör durumu korunur.
          void navigate(path("edit.yazi", { id: result.post.id }), { replace: true });
          return;
        }

        const response = await fetch(`/api/yazi/${persistedRef.current.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: snapshot.slug,
            title: snapshot.title,
            body: snapshot.body,
            updatedAt: persistedRef.current.updatedAt,
          }),
        });
        if (response.status === 401) return setSaveState("unauthenticated");
        if (response.status === 413) return setSaveState("tooLarge");
        const result = (await response.json()) as { post?: PostMeta; issue?: string };
        if (response.status === 409) {
          // İki 409 kaynağı var: adres çakışması ve iyimser kilit. Ayrımı
          // sunucunun makine-okur `issue` alanı yapar — slug karşılaştırmalı
          // tahmin, kanonik olmayan girişte gerçek kilidi "adres dolu" diye
          // okuyup çakışma korumasını hiç devreye sokmuyordu.
          if (result.issue === "slug_taken") {
            setSlugStatus("taken");
            return setSaveState("error");
          }
          conflictRef.current = true;
          return setSaveState("conflict");
        }
        if (!response.ok || !result.post) return setSaveState("error");
        markSaved(result.post, snapshot.seq);
      } catch {
        setSaveState("error");
      }
    });
    return saveQueueRef.current;
  }

  /** Her içerik değişikliğinin tek girişi: sayaç + gösterge + debounce. */
  function scheduleSave() {
    editSeqRef.current += 1;
    const bytes = postBodyByteLength(latestRef.current.body);
    setBodyBytes(bytes);
    if (conflictRef.current) return;
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    if (bytes > POST_BODY_MAX_BYTES) {
      // Kayıt reddediliyor ve bu SÖYLENİYOR — sessiz kayıp yok (R7).
      saveTimerRef.current = null;
      setSaveState("tooLarge");
      return;
    }
    setSaveState(persistedRef.current.id ? "saving" : "pending");
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      void queueSave();
    }, 800);
  }

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editable: !blocked,
    extensions: richTextExtensions("post", content.editor.bodyPlaceholder),
    content: parseDoc(post?.body ?? null) as object,
    onUpdate: ({ editor: instance }) => {
      latestRef.current.body = JSON.stringify(instance.getJSON());
      scheduleSave();
    },
  });

  // Kaydedilmemiş değişiklikle ayrılış onaya bağlı (R7'nin üçüncü parçası).
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!dirty()) return;
      event.preventDefault();
      // Eski tarayıcılar preventDefault'u değil returnValue'yu okur.
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ref okur, bağımlılık yok
  }, []);

  // Canlı adres denetimi (R19): önce yerel kural (kimlikli sebep, sunucusuz),
  // geçerse `/api/yazi/adres-denetim`. Denetim bir kolaylıktır; kapı sunucuda.
  useEffect(() => {
    if (slugLocked) return;
    const raw = slug.trim();
    if (!raw) {
      setSlugStatus(null);
      return;
    }
    const local = validatePostSlug(raw);
    if (!local.ok) {
      setSlugStatus(local.error);
      return;
    }
    if (local.slug === persistedRef.current.slug) {
      setSlugStatus(null);
      return;
    }
    let cancelled = false;
    setSlugStatus("checking");
    const timer = window.setTimeout(async () => {
      try {
        const query = new URLSearchParams({ slug: raw });
        if (persistedRef.current.id) query.set("haric", persistedRef.current.id);
        const response = await fetch(`/api/yazi/adres-denetim?${query}`);
        if (!response.ok || cancelled) return;
        const result = (await response.json()) as { available?: boolean; reason?: string };
        if (cancelled) return;
        setSlugStatus(
          result.available ? "available" : ((result.reason as SlugStatusId | undefined) ?? "taken"),
        );
      } catch {
        // Denetim düşerse sessiz: kayıt yolu kendi hatasını gösterir.
      }
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [slug, slugLocked]);

  function onTitleChange(value: string) {
    setTitle(value);
    latestRef.current.title = value;
    if (!slugTouched && !persistedRef.current.id) {
      const derived = slugFromTitle(value);
      setSlug(derived);
      latestRef.current.slug = derived;
    }
    scheduleSave();
  }

  function onSlugChange(value: string) {
    setSlugTouched(true);
    setSlug(value);
    latestRef.current.slug = value;
    scheduleSave();
  }

  /** Görsel: birinci taraf yükleme hattı (küçültme + R2), sonra `/i/<id>`
   *  kaynaklı image düğümü. Kaynak deseni sunucuda `validatePostDoc` ile
   *  her kayıtta yeniden denetlenir (R9). */
  async function insertImage(file: File) {
    setActionError(null);
    const prepared = await prepareImageForUpload(file);
    try {
      const response = await fetch("/api/onboarding/avatar", {
        method: "POST",
        headers: { "Content-Type": prepared.type },
        body: prepared,
      });
      const result = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !result.id) {
        setActionError(result.error ?? content.editor.imageUploadFailed);
        return;
      }
      editor
        ?.chain()
        .focus()
        .insertContent({ type: "image", attrs: { src: `/i/${result.id}`, alt: "" } })
        .run();
    } catch {
      setActionError(content.editor.imageUploadFailed);
    }
  }

  function setLink() {
    if (!editor) return;
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const href = window.prompt(rt.linkUrl);
    if (!href) return;
    const url = /^[a-z][a-z\d+.-]*:/i.test(href) ? href : `https://${href}`;
    editor.chain().focus().setLink({ href: url }).run();
  }

  /** Yayınla / taslağa al: önce bekleyen taslak KESİNLEŞİR (edit.tsx'in
   *  publish deseni), sonra eylem iyimser kilit damgasıyla gider. */
  async function runAction(kind: "yayinla" | "taslak") {
    // Sınır aşımı yalnız YAYINLAMAYI durdurur (düğmesi de kapalı). Taslağa
    // alma gövde göndermez ({updatedAt} yalnız) — aşırı büyümüş bir yazıyı
    // yayından ÇEKEBİLMEK tam da bu durumda gerekir; sessiz no-op olmaz.
    if (busy || (kind === "yayinla" && overLimit)) return;
    setActionError(null);
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setBusy(true);
    try {
      await queueSave();
      // Taslak kesinleşmediyse (oluşturulamadı ya da kayıt düştü) son
      // içerik sunucuda değil demektir; bayat sürümü yayınlamak yanlış olur.
      if (!persistedRef.current.id || dirty()) {
        if (kind === "yayinla") setActionError(content.editor.actionFailed);
        return;
      }
      const response = await fetch(`/api/yazi/${persistedRef.current.id}/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updatedAt: persistedRef.current.updatedAt }),
      });
      if (response.status === 401) {
        setSaveState("unauthenticated");
        return;
      }
      const result = (await response.json()) as { post?: PostMeta };
      if (response.status === 409) {
        conflictRef.current = true;
        setSaveState("conflict");
        return;
      }
      if (!response.ok || !result.post) {
        setActionError(content.editor.actionFailed);
        return;
      }
      persistedRef.current.updatedAt = result.post.updatedAt;
      setStatus(result.post.status);
      setPublishedAt(result.post.publishedAt);
    } catch {
      setActionError(content.editor.actionFailed);
    } finally {
      setBusy(false);
    }
  }

  async function removePost() {
    if (busy) return;
    // Sunucuda hiç doğmamış yazı: silinecek satır yok, listeye dön.
    if (!persistedRef.current.id) {
      savedSeqRef.current = editSeqRef.current;
      void navigate(path("edit.yazilar"));
      return;
    }
    if (!window.confirm(content.editor.removeConfirm)) return;
    setActionError(null);
    setBusy(true);
    try {
      const response = await fetch(`/api/yazi/${persistedRef.current.id}`, { method: "DELETE" });
      if (!response.ok) {
        setActionError(content.editor.actionFailed);
        return;
      }
      savedSeqRef.current = editSeqRef.current;
      void navigate(path("edit.yazilar"));
    } catch {
      setActionError(content.editor.actionFailed);
    } finally {
      setBusy(false);
    }
  }

  const saveText = content.editor.save[saveState];
  const saveAlarming =
    saveState === "error" ||
    saveState === "conflict" ||
    saveState === "unauthenticated" ||
    saveState === "tooLarge";
  // Gösterge %80'den itibaren görünür; aşımda hatayla aynı renge döner.
  const showBytes = bodyBytes >= POST_BODY_MAX_BYTES * 0.8;
  const slugStatusText = slugStatus && slugStatus !== "available"
    ? content.editor.slugStatus[slugStatus]
    : null;

  type Tool = {
    label: string;
    active: boolean;
    run: () => void;
    icon?: React.ComponentType<{ width?: number; height?: number }>;
    text?: string;
  };
  const tools: Tool[] = editor
    ? [
        { label: content.editor.toolbar.h2, text: "H2", active: editor.isActive("heading", { level: 2 }), run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
        { label: content.editor.toolbar.h3, text: "H3", active: editor.isActive("heading", { level: 3 }), run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
        { label: rt.bold, icon: Bold, active: editor.isActive("bold"), run: () => editor.chain().focus().toggleBold().run() },
        { label: rt.italic, icon: Italic, active: editor.isActive("italic"), run: () => editor.chain().focus().toggleItalic().run() },
        { label: rt.bulletList, icon: List, active: editor.isActive("bulletList"), run: () => editor.chain().focus().toggleBulletList().run() },
        { label: rt.orderedList, icon: NumberedListLeft, active: editor.isActive("orderedList"), run: () => editor.chain().focus().toggleOrderedList().run() },
        { label: rt.quote, icon: Quote, active: editor.isActive("blockquote"), run: () => editor.chain().focus().toggleBlockquote().run() },
        { label: content.editor.toolbar.codeBlock, icon: Code, active: editor.isActive("codeBlock"), run: () => editor.chain().focus().toggleCodeBlock().run() },
        { label: rt.link, icon: LinkIcon, active: editor.isActive("link"), run: setLink },
      ]
    : [];

  // Bilerek memo DEĞİL: sunucunun kabul ettiği slug bir ref'te yaşıyor ve
  // memo bağımlılığı olamaz — kayıt tamamlanınca gelen re-render taze değeri
  // böyle okur (memo'lu hâli yayın sonrası bayat adres gösterebiliyordu).
  const publicPath = `/${username}/${persistedRef.current.slug || slug}`;

  if (blocked) {
    return (
      <main className="min-h-svh bg-zemin text-murekkep">
        <div className="mx-auto w-full max-w-2xl px-5 py-12">
          <Link
            to={path("edit.yazilar")}
            className="inline-flex items-center gap-1 text-sm font-medium text-murekkep/60 hover:text-murekkep"
          >
            <NavArrowLeft width={16} height={16} /> {content.editor.backToList}
          </Link>
          <p className="mt-8 rounded-xl bg-kum px-4 py-3 text-sm font-medium">
            {content.list.limitReason}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-svh bg-zemin text-murekkep">
      <header className="sticky top-0 z-10 border-b border-murekkep/10 bg-zemin/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
          <Link
            to={path("edit.yazilar")}
            className="inline-flex items-center gap-1 text-sm font-medium text-murekkep/60 hover:text-murekkep"
          >
            <NavArrowLeft width={16} height={16} /> {content.editor.backToList}
          </Link>

          <span
            aria-live="polite"
            className={`text-xs ${saveAlarming ? "font-semibold text-sinir" : "text-murekkep/50"}`}
          >
            {saveText}
          </span>

          {showBytes ? (
            <span className={`text-xs tabular-nums ${overLimit ? "font-semibold text-sinir" : "text-murekkep/50"}`}>
              {content.editor.sizeIndicator((bodyBytes / 1024).toFixed(1))}
            </span>
          ) : null}

          <div className="ms-auto flex items-center gap-2">
            {status === "published" ? (
              <a
                href={publicPath}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-murekkep/60 hover:text-murekkep"
              >
                <OpenNewWindow width={14} height={14} /> {content.editor.viewPost}
              </a>
            ) : null}
            {status === "published" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void runAction("taslak")}
                className="rounded-xl border border-murekkep/20 px-3 py-1.5 text-sm font-semibold hover:bg-murekkep/5 disabled:opacity-50"
              >
                {content.editor.unpublish}
              </button>
            ) : (
              <button
                type="button"
                disabled={busy || overLimit}
                onClick={() => void runAction("yayinla")}
                className="rounded-xl bg-murekkep px-3 py-1.5 text-sm font-semibold text-zemin hover:bg-murekkep/85 disabled:opacity-50"
              >
                {content.editor.publish}
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => void removePost()}
              aria-label={content.editor.remove}
              title={content.editor.remove}
              className="rounded-xl p-1.5 text-murekkep/50 hover:bg-murekkep/5 hover:text-sinir disabled:opacity-50"
            >
              <Trash width={16} height={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl px-5 py-8">
        {actionError ? (
          <p className="mb-4 rounded-xl bg-kum px-4 py-3 text-sm font-medium text-sinir">
            {actionError}
          </p>
        ) : null}

        <span
          className={
            status === "published"
              ? "inline-block rounded-lg bg-kirec px-2.5 py-1 text-xs font-semibold"
              : "inline-block rounded-lg bg-murekkep/10 px-2.5 py-1 text-xs font-semibold text-murekkep/60"
          }
        >
          {status === "published" ? content.list.statusPublished : content.list.statusDraft}
        </span>

        <input
          type="text"
          value={title}
          maxLength={POST_TITLE_MAX}
          placeholder={content.editor.titlePlaceholder}
          onChange={(event) => onTitleChange(event.target.value)}
          className="mt-4 w-full bg-transparent text-3xl font-bold leading-tight outline-none placeholder:text-murekkep/30 sm:text-4xl"
        />

        {/* Adres alanı: taslakta düzenlenebilir + canlı denetim; yayınlanmışsa
            kilitli GÖRÜNÜR ve yanında nedeni yazar (R18/AE9) — hata değil. */}
        <div className="mt-4">
          <label className="flex flex-wrap items-center gap-1 text-sm">
            <span className="font-medium text-murekkep/60">{content.editor.slugLabel}:</span>
            <span className="text-murekkep/40">caka.app/{username}/</span>
            <input
              type="text"
              value={slug}
              disabled={slugLocked}
              maxLength={POST_SLUG_MAX}
              onChange={(event) => onSlugChange(event.target.value)}
              className="min-w-40 flex-1 rounded-lg border border-murekkep/15 bg-transparent px-2 py-1 font-mono text-sm outline-none focus:border-murekkep/40 disabled:border-transparent disabled:px-0 disabled:text-murekkep/60"
              aria-describedby="slug-durum"
            />
          </label>
          <p id="slug-durum" className="mt-1.5 text-xs text-murekkep/50">
            {slugLocked ? (
              <span className="inline-flex items-center gap-1">
                <Lock width={13} height={13} className="shrink-0" />
                {content.editor.slugLockedReason}
              </span>
            ) : slugStatus === "available" ? (
              <span className="text-murekkep/70">{content.editor.slugStatus.available}</span>
            ) : slugStatusText ? (
              <span className={slugStatus === "checking" ? "" : "font-medium text-sinir"}>
                {slugStatusText}
              </span>
            ) : (
              content.editor.slugHint
            )}
          </p>
        </div>

        <div
          role="toolbar"
          aria-label={rt.toolbarLabel}
          className="sticky top-14 z-10 mt-6 flex flex-wrap items-center gap-1 rounded-xl border border-murekkep/10 bg-zemin/95 p-1 backdrop-blur"
        >
          {tools.map((tool) => (
            <button
              key={tool.label}
              type="button"
              aria-label={tool.label}
              title={tool.label}
              onMouseDown={(event) => event.preventDefault()}
              onClick={tool.run}
              className={`rounded-lg px-2 py-1.5 text-xs font-semibold ${
                tool.active ? "bg-murekkep text-zemin" : "text-murekkep/70 hover:bg-murekkep/5"
              }`}
            >
              {tool.icon ? <tool.icon width={15} height={15} /> : tool.text}
            </button>
          ))}
          <label
            aria-label={content.editor.toolbar.image}
            title={content.editor.toolbar.image}
            className="cursor-pointer rounded-lg px-2 py-1.5 text-murekkep/70 hover:bg-murekkep/5"
          >
            <MediaImage width={15} height={15} />
            <input
              type="file"
              // Yükleme hattı JPEG/PNG işler (image-upload.ts); "image/*"
              // webp/gif seçtirip avatar ucundan anlaşılmaz bir 400 döndürüyordu.
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void insertImage(file);
              }}
            />
          </label>
        </div>

        <EditorContent editor={editor} className="yazi-editor-body mt-6" />
      </div>
    </main>
  );
}
