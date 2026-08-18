import { useEffect, useMemo, useRef, useState } from "react";
import { env } from "cloudflare:workers";
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  ExternalLink,
  ImageIcon,
  Images,
  LayoutGrid,
  Link2,
  Megaphone,
  Monitor,
  MonitorPlay,
  Palette,
  Plus,
  Send,
  Smartphone,
  Trash2,
  Type,
  X,
} from "lucide-react";
import { Link, redirect, useNavigate, useSearchParams } from "react-router";

import {
  BlockGallery,
  type BlockAddBlockers,
  type GalleryPick,
} from "~/components/editor/gallery";
import { EditorGrid, type EditorDevice, type GridUpdate } from "~/components/editor/grid";
import { InlineTextEditor } from "~/components/editor/rich-text-editor";
import { ProfileBlockCard } from "~/components/profile-block";
import { onboardingPlatforms, onboardingTemplates, platformById } from "~/content/onboarding";
import { noIndexMeta } from "~/lib/seo";
import {
  BLOCK_TYPE_LABELS,
  GALLERY_MAX_PHOTOS,
  GRID_COLUMNS,
  MAX_GALLERY_BLOCKS,
  SPOTIFY_KIND_LABELS,
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
  spotifyDefaultSize,
  withDerivedSmPositions,
  type BlockSize,
  type ProfileBlock,
  type ProfileLayout,
  type ProfileTheme,
  type SocialPlatform,
  type SpotifyKind,
} from "@caka/shared";
import { getSession } from "../../server/auth";
import { collectGithubLogins, getGithubCalendars } from "../../server/github";
import { signLayoutImages } from "../../server/layout-images";
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
    // Yüklenişteki bloklar için imzalı görsel yolları. Editörde SONRADAN
    // eklenen bloklar burada yok; onların imzalı yolu /api/og-image
    // yanıtındaki `proxied` alanından gelir.
    signedImages: await signLayoutImages(env, layout),
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
        data: {
          kind: "video",
          url: "",
          videoId: "",
          title: "",
          channelName: "",
          shorts: false,
          verticalThumbnail: false,
          thumbnail: "",
        },
      };
    // Blok ilk eklendiğinde tür HENÜZ bilinmiyor: adres yapıştırılmadan
    // parça mı albüm mü olduğu söylenemez. Kompakt oynatıcının boyutuyla
    // (2x1) başlar, adres çözülünce `spotifyDefaultSize` türe göre büyütür.
    case "spotify":
      return {
        id,
        type,
        size: "2x1",
        data: { kind: "track", url: "", entityId: "", title: "", thumbnail: "" },
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
  // Panelde kısayolu yok; araç çubuğundan ya da blok galerisinden eklenir.
  // Galeri ayrıca hesap başına 2 ile sınırlı (R62) — derin bağlantı bu
  // sınırı atlatabilecek ikinci bir yol açmasın.
  gallery: false,
  youtube: false,
  spotify: false,
};

/**
 * Editörde gösterilecek blok adı. `BLOCK_TYPE_LABELS` şemanın adlandırması;
 * editörde "Galeri" adı ZATEN blok seçicinin ("Blok galerisi") adı, ikisi aynı
 * arayüzde çarpışıyor. Fotoğraf bloğu bu yüzden burada "Fotoğraf galerisi"
 * olarak görünür.
 */
function editorBlockLabel(type: ProfileBlock["type"]): string {
  return type === "gallery" ? "Fotoğraf galerisi" : BLOCK_TYPE_LABELS[type];
}

function isDeepLinkAddable(value: string): value is ProfileBlock["type"] {
  return Object.hasOwn(DEEP_LINK_ADDABLE, value) && DEEP_LINK_ADDABLE[value as ProfileBlock["type"]];
}

/** `/api/youtube` başarılı yanıtı; hata dalında yalnız `error` döner. */
type YoutubeResolveResponse =
  | {
      kind: "video";
      url: string;
      videoId: string;
      title: string;
      channelName: string;
      shorts: boolean;
      verticalThumbnail: boolean;
      thumbnail: string;
      proxied: string | null;
    }
  | {
      kind: "channel";
      url: string;
      channelId: string;
      channelName: string;
      handle: string;
      thumbnail: string;
      proxied: string | null;
    }
  | { error: string };

/** `/api/spotify` başarılı yanıtı; hata dalında yalnız `error` döner. */
type SpotifyResolveResponse =
  | {
      kind: SpotifyKind;
      kindLabel: string;
      url: string;
      entityId: string;
      title: string;
      thumbnail: string;
      proxied: string | null;
    }
  | { error: string };

function Inspector({
  block,
  update,
  setData,
  setSize,
  remove,
  close,
  onSignedImage,
}: {
  block: ProfileBlock;
  update: (patch: Partial<ProfileBlock["data"]>) => void;
  /** Veriyi bütünüyle değiştirir. YouTube'da şart: video ↔ kanal geçişi
      ayrımlı birleşimin DALINI değiştirir, alan yamalamakla olmaz. */
  setData: (data: ProfileBlock["data"]) => void;
  /** Bloğu yeniden boyutlandırır. Spotify'da şart: gömme yüksekliği türe
      bağlı (parça 152px, diğerleri 352px) ve tür ancak adres çözülünce
      biliniyor — kullanıcıyı elle boyutlandırmaya bırakmak, kırpılmış bir
      oynatıcıyı ona düzelttirmek olurdu. */
  setSize: (size: BlockSize) => void;
  remove: () => void;
  close: () => void;
  /** Bloğun uzak görselinin imzalı yolu; editörün `signedImages` eşlemesine
      eklenir ki kullanıcı kaydetmeyi beklemeden önizlemeyi görsün. */
  onSignedImage: (path: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  // Yükleme hatası (kota, tür, boyut) sessizce yutulmaz: sunucunun Türkçe
  // mesajı panelde gösterilir.
  const [uploadError, setUploadError] = useState<string | null>(null);
  // YouTube: kullanıcının yazdığı ham adres ayrı tutulur; blok yalnız
  // çözümleme başarılı olunca güncellenir (KTD34).
  const [youtubeInput, setYoutubeInput] = useState(() =>
    block.type === "youtube" ? block.data.url : "",
  );
  const [youtubeBusy, setYoutubeBusy] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  // Aynı adres için tekrar tekrar istek atma; çözülen adres de buraya yazılır.
  const youtubeAttemptedRef = useRef("");
  // Spotify: YouTube ile aynı desen — ham adres ayrı tutulur, blok yalnız
  // çözümleme başarılı olunca güncellenir.
  const [spotifyInput, setSpotifyInput] = useState(() =>
    block.type === "spotify" ? block.data.url : "",
  );
  const [spotifyBusy, setSpotifyBusy] = useState(false);
  const [spotifyError, setSpotifyError] = useState<string | null>(null);
  const spotifyAttemptedRef = useRef("");
  // Sosyal blokta tek bağlantı alanı: kullanıcı ne yazdıysa o görünür;
  // platform/handle/url bloğa çözümlenmiş halleriyle yazılır.
  const [socialLink, setSocialLink] = useState(() =>
    block.type === "social" ? block.data.url || block.data.handle : "",
  );
  useEffect(() => {
    setSocialLink(block.type === "social" ? block.data.url || block.data.handle : "");
    setYoutubeInput(block.type === "youtube" ? block.data.url : "");
    youtubeAttemptedRef.current = block.type === "youtube" ? block.data.url : "";
    setYoutubeError(null);
    setSpotifyInput(block.type === "spotify" ? block.data.url : "");
    spotifyAttemptedRef.current = block.type === "spotify" ? block.data.url : "";
    setSpotifyError(null);
    setUploadError(null);
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

  /**
   * Dosyayı R2'ye yükler ve asset kimliğini döner. Sunucunun reddetme
   * gerekçesi (R16 kotası → 403, tür, boyut) olduğu gibi panele yazılır;
   * "yükleyemedik" gibi bir örtü metin kullanıcıya kotasının dolduğunu
   * söylemezdi.
   */
  async function uploadAsset(file: File): Promise<string | null> {
    setUploading(true);
    setUploadError(null);
    try {
      const response = await fetch("/api/onboarding/avatar", {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const result = (await response.json()) as { id?: string; error?: string };
      if (response.ok && result.id) return result.id;
      setUploadError(result.error ?? "Görsel yüklenemedi");
      return null;
    } catch {
      setUploadError("Görsel yüklenemedi");
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function uploadImage(file: File) {
    const id = await uploadAsset(file);
    if (id) update({ assetId: id });
  }

  async function addGalleryPhoto(file: File) {
    if (block.type !== "gallery") return;
    // İkinci savunma hattı: arayüz zaten kapanıyor ama yarışan bir tıklama
    // sınırı aşmasın (şema 5'te reddediyor, kullanıcı hatayı kayıtta görürdü).
    if (block.data.photos.length >= GALLERY_MAX_PHOTOS) return;
    const id = await uploadAsset(file);
    if (!id) return;
    update({ photos: [...block.data.photos, { assetId: id, alt: "" }] });
  }

  /**
   * Adresi `/api/youtube`'a sorar; video mu kanal mı olduğu ORADA çözülür.
   * Başarıda bloğun verisi bütünüyle değişir (dal değişebilir), hatada blok
   * olduğu gibi kalır ve sunucunun Türkçe gerekçesi gösterilir.
   */
  async function resolveYoutube(value: string) {
    youtubeAttemptedRef.current = value;
    setYoutubeBusy(true);
    setYoutubeError(null);
    try {
      const response = await fetch(`/api/youtube?url=${encodeURIComponent(value)}`);
      const result = (await response.json()) as YoutubeResolveResponse;
      if (!response.ok || !("kind" in result)) {
        setYoutubeError(
          ("error" in result && result.error) || "YouTube bağlantısı çözümlenemedi.",
        );
        return;
      }
      if (result.kind === "channel") {
        setData({
          kind: "channel",
          url: result.url,
          channelId: result.channelId,
          channelName: result.channelName,
          handle: result.handle,
          thumbnail: result.thumbnail,
        });
      } else {
        setData({
          kind: "video",
          url: result.url,
          videoId: result.videoId,
          title: result.title,
          channelName: result.channelName,
          shorts: result.shorts,
          // Sunucu `oardefault`'u kayıt anında doğruluyor; bu bayrak düşerse
          // 9:16 çerçeve hiç uygulanmaz ve dikey görsel yatay kırpılır.
          verticalThumbnail: result.verticalThumbnail,
          thumbnail: result.thumbnail,
        });
      }
      // `proxied` yoksa (kanal: avatar dönmüyor) eski kaydı temizle.
      onSignedImage(result.proxied ?? "");
      // Kanonik adresi alana yaz: kullanıcı neyin eklendiğini görsün. Ref de
      // güncellenir, yoksa değişen değer yeni bir çözümleme tetiklerdi.
      youtubeAttemptedRef.current = result.url;
      setYoutubeInput(result.url);
    } catch {
      setYoutubeError("YouTube bağlantısı çözümlenemedi — bağlantını kontrol et.");
    } finally {
      setYoutubeBusy(false);
    }
  }

  // Yapıştırdıktan kısa süre sonra kendiliğinden çözümle: kullanıcıya ayrıca
  // "çözümle" düğmesi tıklatmak, ayrımın otomatik olduğu vaadiyle çelişirdi.
  useEffect(() => {
    if (block.type !== "youtube") return;
    const value = youtubeInput.trim();
    if (!value || value === youtubeAttemptedRef.current) return;
    const timer = window.setTimeout(() => void resolveYoutube(value), 700);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnız adres değişince
  }, [youtubeInput, block.id]);

  /**
   * Adresi `/api/spotify`'ye sorar; tür (parça/albüm/liste/…) ORADA çözülür.
   * Başarıda blok verisi bütünüyle değişir ve boyut türe göre ayarlanır;
   * hatada blok olduğu gibi kalır ve sunucunun Türkçe gerekçesi gösterilir.
   */
  async function resolveSpotify(value: string) {
    spotifyAttemptedRef.current = value;
    setSpotifyBusy(true);
    setSpotifyError(null);
    try {
      const response = await fetch(`/api/spotify?url=${encodeURIComponent(value)}`);
      const result = (await response.json()) as SpotifyResolveResponse;
      if (!response.ok || !("kind" in result)) {
        setSpotifyError(
          ("error" in result && result.error) || "Spotify bağlantısı çözümlenemedi.",
        );
        return;
      }
      setData({
        kind: result.kind,
        url: result.url,
        entityId: result.entityId,
        title: result.title,
        thumbnail: result.thumbnail,
      });
      // Gömme yüksekliği türe bağlı: parça 152px (2x1), diğerleri 352px (2x2).
      setSize(spotifyDefaultSize(result.kind));
      // `proxied` yoksa (kapaksız içerik) eski kaydı temizle — parçadan
      // listeye geçen kullanıcı, aksi hâlde bayat bir kapak görürdü.
      onSignedImage(result.proxied ?? "");
      // Kanonik adresi alana yaz: `?si=…` takip parametreleri ve ülke öneki
      // temizlenmiş hâlini görsün. Ref de güncellenir, yoksa değişen değer
      // yeni bir çözümleme tetiklerdi.
      spotifyAttemptedRef.current = result.url;
      setSpotifyInput(result.url);
    } catch {
      setSpotifyError("Spotify bağlantısı çözümlenemedi — bağlantını kontrol et.");
    } finally {
      setSpotifyBusy(false);
    }
  }

  // YouTube'daki gerekçenin aynısı: yapıştırdıktan kısa süre sonra kendiliğinden
  // çözümle, kullanıcıya ayrıca "çözümle" düğmesi tıklatma.
  useEffect(() => {
    if (block.type !== "spotify") return;
    const value = spotifyInput.trim();
    if (!value || value === spotifyAttemptedRef.current) return;
    const timer = window.setTimeout(() => void resolveSpotify(value), 700);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnız adres değişince
  }, [spotifyInput, block.id]);

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
            <label>
              Bağlantı
              <input
                value={block.data.url}
                // Adres değişince eski önizleme görselini SİL: zenginleştirme
                // döngüsü `ogImage` doluysa atlıyor, yani nytimes.com'dan
                // gelen görsel yeni adrese yapışıp o hâliyle yayınlanıyordu.
                // `social` bloğu bunu zaten yapıyor (`onSocialLink`).
                onChange={(event) => update({ url: event.target.value, ogImage: "" })}
              />
            </label>
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
      case "gallery": {
        const photos = block.data.photos;
        const full = photos.length >= GALLERY_MAX_PHOTOS;
        // Sıra değiştirme: fotoğrafı bir yukarı/aşağı taşır. Sürükle-bırak
        // yerine düğme — dokunmatikte ızgara sürüklemesiyle çakışmıyor.
        const move = (index: number, delta: number) => {
          const target = index + delta;
          if (target < 0 || target >= photos.length) return;
          const next = [...photos];
          const [moved] = next.splice(index, 1);
          next.splice(target, 0, moved!);
          update({ photos: next });
        };
        return (
          <>
            <label>
              Başlık
              <input
                value={block.data.title}
                onChange={(event) => update({ title: event.target.value })}
              />
            </label>
            {/* Başlık kısa tile'da hücrelerin üstüne binmeden sığmıyor ve
                gizleniyor. Kullanıcı yazdığı şeyi neden göremediğini bilmeli. */}
            <p className="inspector-hint">
              Başlık yalnız iki satır yüksekliğindeki galerilerde görünür. Kısa
              galerilerde ekran okuyucular için kullanılır.
            </p>
            <fieldset>
              <legend>Fotoğraflar ({photos.length}/{GALLERY_MAX_PHOTOS})</legend>
              {photos.length === 0 ? (
                <p className="inspector-hint">Henüz fotoğraf yok.</p>
              ) : (
                <ul className="flex list-none flex-col gap-2 p-0">
                  {photos.map((photo, index) => (
                    <li
                      key={photo.assetId}
                      className="flex items-center gap-2 rounded-lg border border-sinir p-2"
                    >
                      <img
                        src={`/i/${photo.assetId}`}
                        alt=""
                        className="size-11 flex-none rounded-md object-cover"
                        draggable={false}
                      />
                      <input
                        className="min-w-0 flex-1"
                        value={photo.alt}
                        placeholder="Alt metin (isteğe bağlı)"
                        aria-label={`${index + 1}. fotoğrafın alt metni`}
                        onChange={(event) =>
                          update({
                            photos: photos.map((item, other) =>
                              other === index ? { ...item, alt: event.target.value } : item,
                            ),
                          })
                        }
                      />
                      <span className="flex flex-none flex-col">
                        <button
                          type="button"
                          aria-label={`${index + 1}. fotoğrafı yukarı taşı`}
                          disabled={index === 0}
                          className="disabled:opacity-30"
                          onClick={() => move(index, -1)}
                        >
                          <ChevronUp size={15} />
                        </button>
                        <button
                          type="button"
                          aria-label={`${index + 1}. fotoğrafı aşağı taşı`}
                          disabled={index === photos.length - 1}
                          className="disabled:opacity-30"
                          onClick={() => move(index, 1)}
                        >
                          <ChevronDown size={15} />
                        </button>
                      </span>
                      <button
                        type="button"
                        aria-label={`${index + 1}. fotoğrafı kaldır`}
                        className="flex-none text-destructive"
                        onClick={() =>
                          update({ photos: photos.filter((_, other) => other !== index) })
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {/* Sınıra ulaşınca ekleme kapanır ve NEDENİ yazar; sessizce
                  reddedilen bir buton kullanıcıya sınırı öğretmez. */}
              {full ? (
                <p className="inspector-hint">
                  Bir galeride en fazla {GALLERY_MAX_PHOTOS} fotoğraf olabilir. Yeni fotoğraf
                  eklemek için önce birini kaldır.
                </p>
              ) : (
                <span className="inspector-upload">
                  <ImageIcon size={18} />
                  {uploading ? "Yükleniyor…" : "Fotoğraf ekle (JPEG veya PNG)"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    disabled={uploading}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      // Aynı dosya art arda seçilebilsin diye alan sıfırlanır.
                      event.target.value = "";
                      if (file) void addGalleryPhoto(file);
                    }}
                  />
                </span>
              )}
            </fieldset>
            {uploadError ? <p className="inspector-error" role="alert">{uploadError}</p> : null}
          </>
        );
      }
      case "youtube": {
        // Tek alan: adres. Video mu kanal mı olduğu ve başlık/küçük görsel
        // gibi alanlar kayıt anında sunucuda çözülür (KTD34), kullanıcı
        // ikisini ayrı ayrı seçmez — yapıştırdığı bağlantı zaten söylüyor.
        // Ama SONUÇ gösterilir: yanlış şeyi eklediyse anlaması gerek.
        const resolved =
          block.data.kind === "video"
            ? block.data.videoId
              ? `Video olarak eklendi${block.data.title ? ` — ${block.data.title}` : ""}`
              : null
            : block.data.channelId
              ? `Kanal olarak eklendi${block.data.channelName ? ` — ${block.data.channelName}` : ""}`
              : null;
        return (
          <>
            <label>YouTube bağlantısı
              <input
                value={youtubeInput}
                placeholder="youtube.com/watch?v=… ya da youtube.com/@kanal"
                onChange={(event) => setYoutubeInput(event.target.value)}
              />
              <small className="inspector-hint">
                Video ve kanal adresini ayırt ediyoruz — hangisini yapıştırdıysan onu ekleriz.
              </small>
            </label>
            {youtubeBusy ? <p className="inspector-hint">Çözümleniyor…</p> : null}
            {youtubeError ? (
              <p className="inspector-error" role="alert">{youtubeError}</p>
            ) : null}
            {!youtubeBusy && !youtubeError && resolved ? (
              <p className="inspector-hint">{resolved}</p>
            ) : null}
          </>
        );
      }
      case "spotify": {
        // Tek alan: adres. Tür (parça/albüm/liste/sanatçı/podcast/bölüm)
        // kayıt anında sunucuda çözülür, kullanıcı listeden seçmez —
        // yapıştırdığı bağlantı zaten söylüyor. Ama SONUÇ gösterilir:
        // yanlış şeyi eklediyse anlaması gerek.
        const resolved = block.data.entityId
          ? `${SPOTIFY_KIND_LABELS[block.data.kind]} olarak eklendi${
              block.data.title ? ` — ${block.data.title}` : ""
            }`
          : null;
        return (
          <>
            <label>Spotify bağlantısı
              <input
                value={spotifyInput}
                placeholder="open.spotify.com/track/… ya da spotify:album:…"
                onChange={(event) => setSpotifyInput(event.target.value)}
              />
              <small className="inspector-hint">
                Parça, albüm, çalma listesi, sanatçı, podcast ve bölüm eklenebilir — ne
                yapıştırdıysan onu ekleriz.
              </small>
            </label>
            {spotifyBusy ? <p className="inspector-hint">Çözümleniyor…</p> : null}
            {spotifyError ? (
              <p className="inspector-error" role="alert">{spotifyError}</p>
            ) : null}
            {!spotifyBusy && !spotifyError && resolved ? (
              <p className="inspector-hint">{resolved}</p>
            ) : null}
          </>
        );
      }
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
        <strong>{editorBlockLabel(block.type)} bloğu</strong>
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

  // Loader yalnız AÇILIŞTAKİ blokların uzak görsellerini imzalar. Editörde
  // sonradan eklenen ya da adresi değişen blokların imzalı yolu uçlardan
  // (`/api/og-image`, `/api/youtube`) döner ve burada birikir; iki kaynak
  // birleştirilip karta verilir, böylece önizleme kaydetmeyi beklemez.
  const [editorSignedImages, setEditorSignedImages] = useState<Record<string, string>>({});
  const signedImages = useMemo(
    () => ({ ...loaderData.signedImages, ...editorSignedImages }),
    [loaderData.signedImages, editorSignedImages],
  );
  /**
   * Blok için imzalı görsel yolunu hatırlar. Boş yol kaydı SİLER: video
   * bloğunu kanal adresiyle değiştiren kullanıcı, aksi hâlde editörde eski
   * videonun kapağını kanal avatarı sanıyordu (yayında ise baş harf çipi
   * çıkıyordu) — WYSIWYG kırılması.
   */
  function rememberSignedImage(blockId: string, path: string) {
    setEditorSignedImages((current) => {
      if (!path) {
        if (!(blockId in current)) return current;
        const { [blockId]: _drop, ...rest } = current;
        return rest;
      }
      return current[blockId] === path ? current : { ...current, [blockId]: path };
    });
  }

  /**
   * Bloğu sözlük ölçüsüne göre yeniden boyutlandırır (Spotify'da tür
   * çözülünce çağrılır). `size` tek başına yetmez: gerçek yerleşim `pos`tan
   * okunuyor, o yüzden lg/sm konumları da güncellenir. Genişleyen blok
   * kolonların dışına taşmasın diye `x` sola çekilir; mobil konumlar sonra
   * `withDerivedSmPositions` ile yeniden türetilir.
   */
  function resizeBlock(blockId: string, size: BlockSize) {
    const { w, h } = sizeToDims(size);
    setLayout((current) => ({
      ...current,
      blocks: withDerivedSmPositions(
        current.blocks.map((block) => {
          if (block.id !== blockId || block.type === "profile") return block;
          if (!block.pos) return { ...block, size } as ProfileBlock;
          const lgW = Math.min(w, GRID_COLUMNS.lg);
          const smW = Math.min(w, GRID_COLUMNS.sm);
          return {
            ...block,
            size,
            pos: {
              lg: { ...block.pos.lg, x: Math.min(block.pos.lg.x, GRID_COLUMNS.lg - lgW), w: lgW, h },
              sm: { ...block.pos.sm, x: Math.min(block.pos.sm.x, GRID_COLUMNS.sm - smW), w: smW, h },
            },
          } as ProfileBlock;
        }),
      ),
    }));
  }

  // R62: hesap başına galeri sınırı sunucuda (`profileLayoutWriteSchema`)
  // uygulanıyor. Arayüz sınıra ULAŞMADAN kapanmalı — kullanıcı bloğu ekleyip
  // kaydederken hata almamalı.
  const galleryBlocked =
    layout.blocks.filter((block) => block.type === "gallery").length >= MAX_GALLERY_BLOCKS
      ? `Sayfanda en fazla ${MAX_GALLERY_BLOCKS} fotoğraf galerisi olabilir. Yenisini eklemek için önce birini kaldır.`
      : null;
  const addBlockers: BlockAddBlockers = useMemo(
    () => (galleryBlocked ? { gallery: galleryBlocked } : {}),
    [galleryBlocked],
  );

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
  const issues = useMemo(() => {
    if (!publishTried) return [];
    // Etiketler editör adlandırmasına çevrilir (bkz. editorBlockLabel).
    const typeOf = new Map(layout.blocks.map((block) => [block.id, block.type]));
    return layoutIssues(layout).map((issue) => {
      const type = typeOf.get(issue.blockId);
      return type ? { ...issue, label: editorBlockLabel(type) } : issue;
    });
  }, [publishTried, layout]);

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
        if (block.type !== "social" && block.type !== "link") continue;
        if (!block.data.url || block.data.ogImage) continue;
        const key = `${block.id}|${block.data.url}`;
        if (ogAttemptedRef.current.has(key)) continue;
        ogAttemptedRef.current.add(key);
        const { id } = block;
        const url = block.data.url;
        void fetch(`/api/og-image?url=${encodeURIComponent(url)}`)
          .then((response) =>
            response.ok
              ? (response.json() as Promise<{ image?: string | null; proxied?: string | null }>)
              : null,
          )
          .then((result) => {
            const image = result?.image;
            if (!image) return;
            // İmzalı yol layout'a YAZILMAZ (kaynak adres kaybolurdu); ayrı
            // eşlemede durur — bkz. server/layout-images.ts.
            if (result?.proxied) rememberSignedImage(id, result.proxied);
            setLayout((current) => ({
              ...current,
              blocks: current.blocks.map((item) =>
                item.id === id &&
                (item.type === "social" || item.type === "link") &&
                item.data.url === url
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
    // Sınır arayüzde zaten kapalı; buradaki kontrol derin bağlantı ve yarışan
    // tıklamalar için son kapı.
    if (type === "gallery" && galleryBlocked) return;
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
              <ProfileBlockCard block={profileBlock} signedImages={signedImages} />
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
                  <ProfileBlockCard
                    block={block}
                    githubCalendars={loaderData.githubCalendars}
                    signedImages={signedImages}
                  />
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
        {/* "Fotoğraf galerisi": bu çubuktaki son düğme zaten "Blok galerisi"
            adını taşıyor; ikisi aynı adı taşısaydı hangisinin ne yaptığı
            arayüzde okunmazdı. */}
        <button
          type="button"
          data-tooltip={galleryBlocked ?? "Fotoğraf galerisi ekle"}
          aria-label={galleryBlocked ?? "Fotoğraf galerisi ekle"}
          disabled={Boolean(galleryBlocked)}
          className={galleryBlocked ? "cursor-not-allowed opacity-40" : ""}
          onClick={() => add("gallery")}
        >
          <Images size={19} />
        </button>
        <button type="button" data-tooltip="YouTube ekle" aria-label="YouTube ekle" onClick={() => add("youtube")}>
          <MonitorPlay size={19} />
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

      {panel === "gallery" ? <BlockGallery onPick={addFromGallery} blockers={addBlockers} /> : null}

      {/* Metin ve duyuru blokları dialog yerine tuvalde düzenlenir (InlineTextEditor). */}
      {selected && selected.type !== "text" && selected.type !== "status" ? (
        <Inspector
          block={selected}
          update={updateSelected}
          setData={(data) =>
            setLayout((current) => ({
              ...current,
              blocks: current.blocks.map((block) =>
                block.id === selected.id ? ({ ...block, data } as ProfileBlock) : block,
              ),
            }))
          }
          setSize={(size) => resizeBlock(selected.id, size)}
          onSignedImage={(path) => rememberSignedImage(selected.id, path)}
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
