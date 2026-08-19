import { useEffect, useMemo, useRef, useState } from "react";
import { env } from "cloudflare:workers";
import {
  Computer,
  Link as LinkIcon,
  MediaImage,
  MediaImageList,
  MediaVideo,
  Megaphone,
  NavArrowDown,
  NavArrowLeft,
  NavArrowUp,
  OpenNewWindow,
  Palette,
  Plus,
  SendDiagonal,
  SmartphoneDevice,
  Text,
  Trash,
  ViewGrid,
  WarningTriangle,
  Xmark,
} from "iconoir-react";
import { Link, redirect, useNavigate, useSearchParams } from "react-router";

import {
  BlockGallery,
  type BlockAddBlockers,
  type GalleryPick,
} from "~/components/editor/gallery";
import { EditorGrid, type EditorDevice, type GridUpdate } from "~/components/editor/grid";
import { InlineTextEditor } from "~/components/editor/rich-text-editor";
import { ProfileBlockCard } from "~/components/profile-block";
import { linkHostLabel } from "~/lib/link-preview";
import { noIndexMeta } from "~/lib/seo";
import {
  GALLERY_MAX_PHOTOS,
  GRID_COLUMNS,
  MAX_GALLERY_BLOCKS,
  blockIssue,
  createBlockId,
  detectSocialFromUrl,
  faviconImageKey,
  GEOCODE_ATTRIBUTION,
  mapFrameImageKey,
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
  type LocationSuggestion,
  type LocationZoomStep,
  type ProfileTheme,
  type SocialPlatform,
  type SpotifyKind,
} from "@caka/shared";
import { getSession } from "../../server/auth";
import { collectGithubLogins, getGithubCalendars } from "../../server/github";
import { signLayoutImages } from "../../server/layout-images";
import { getProfileByUserId } from "../../server/profile";
import type { Route } from "./+types/edit";
import { localizedRedirect } from "../../server/locale";
import { DEFAULT_LOCALE } from "@caka/shared";
import { appCatalog } from "~/content/app";
import { widgetCatalog } from "~/content/widget";
import { useCatalog } from "~/lib/locale";
import { useOnboardingLists } from "~/lib/onboarding";
import { localeFromRequest } from "../../server/locale";

export function meta({ loaderData }: Route.MetaArgs) {
  return noIndexMeta(appCatalog[loaderData?.locale ?? DEFAULT_LOCALE].titles.editor);
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(env, request);
  if (!session) throw localizedRedirect(request, "/login");
  const profile = await getProfileByUserId(env, session.user.id);
  if (!profile) throw localizedRedirect(request, "/onboarding");
  if (!profile.onboardingCompletedAt) throw localizedRedirect(request, "/onboarding/kurulum/profil");
  const published = parseProfileLayout(profile.layout);
  if (!published) throw new Response(appCatalog[localeFromRequest(request)].editor.layoutUnreadable, { status: 500 });
  // Editör her zaman taslağı açar; taslak yoksa yayınlanmış hâlden devam eder.
  const draft = profile.draftLayout ? parseProfileLayout(profile.draftLayout) : null;
  const layout = ensureLayoutPositions(draft ?? published);
  return {
    locale: localeFromRequest(request),
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
      return { id, type, size: "1x1", data: { title: "", url: "", ogImage: "", favicon: "" } };
    case "social":
      return { id, type, size: "1x1", data: { platform: "instagram", handle: "", url: "", label: "Instagram", ogImage: "", favicon: "" } };
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
    // Konum bloğu BOŞ doğar: yer, kullanıcı arayıp seçince yazılır. `2x2`
    // (368×324) `BLOCK_GRID_LIMITS.location`'ın tabanı — daha küçüğünde harita
    // etiketleri okunmuyor.
    case "location":
      return {
        id,
        type,
        size: "2x2",
        data: { label: "", country: "", countryCode: "", lat: null, lon: null, timeZone: "" },
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
  // Panelde kısayolu yok; araç çubuğundan ya da blok galerisinden eklenir.
  location: false,
};

/**
 * Editörde gösterilecek blok adı. Katalogdaki `blockTypes` şemanın
 * adlandırmasının editör karşılığıdır: "Galeri" adı blok seçicinin adıyla
 * çarpıştığı için fotoğraf bloğu orada tam adıyla ("Fotoğraf galerisi")
 * durur.
 */
function useBlockLabel(): (type: ProfileBlock["type"]) => string {
  const app = useCatalog(appCatalog);
  return (type) => app.blockTypes[type];
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

/** `/api/konum` başarılı yanıtı; hata dalında yalnız `error` döner. */
type LocationHit = LocationSuggestion & {
  /** İmzalı birinci taraf harita kareleri; anahtar/sır yoksa null. */
  frames: Record<LocationZoomStep, string> | null;
};
type LocationSearchResponse = { results: LocationHit[] } | { error: string };

function Inspector({
  block,
  update,
  setData,
  setSize,
  remove,
  close,
  onSignedImage,
  rememberImage,
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
  /** Aynı eşlemeye ANAHTARIYLA yazar. Harita kareleri blok kimliğine değil
      koordinata anahtarlandığı için (bkz. `mapFrameImageKey`) blok kimliğini
      varsayan `onSignedImage` yetmiyor. */
  rememberImage: (key: string, path: string) => void;
}) {
  const app = useCatalog(appCatalog);
  const widget = useCatalog(widgetCatalog);
  const onboarding = useOnboardingLists();
  const [uploading, setUploading] = useState(false);
  // Çoklu seçimde tek bir "Yükleniyor…" beş fotoğraf boyunca donmuş görünür;
  // kaçıncı dosyada olduğumuz yazılınca bekleme anlaşılır oluyor.
  const [uploadStep, setUploadStep] = useState<{ done: number; total: number } | null>(null);
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
  // Konum: arama metni bloğun DIŞINDA tutulur. Bloğa yalnız SEÇİLEN sonuç
  // yazılır (YouTube/Spotify ile aynı gerekçe) — yarım yazılmış bir arama
  // hiçbir zaman kaydedilmez.
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<LocationHit[] | null>(null);
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const locationAttemptedRef = useRef("");
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
    setLocationQuery("");
    setLocationResults(null);
    setLocationError(null);
    locationAttemptedRef.current = "";
    setUploadError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnız blok değişince
  }, [block.id]);

  // Yapıştırılan URL'den platform + kullanıcı adını çıkarır (nsosyal.com/ad
  // gibi); düz kullanıcı adı yazıldıysa URL'yi platform tabanından üretir.
  function applySocialLink(value: string) {
    if (block.type !== "social") return;
    const detected = detectSocialFromUrl(value);
    if (detected?.handle) {
      const config = onboarding.byId(detected.platform);
      update({
        platform: detected.platform,
        label: config.label,
        handle: detected.handle,
        url: detected.url,
        ogImage: "",
        favicon: "",
      });
      return;
    }
    if (block.data.platform === "website") {
      update({ handle: "", url: value, ogImage: "", favicon: "" });
      return;
    }
    const handle = value.trim().replace(/^@/, "");
    update({ handle, url: socialUrl(block.data.platform, value), ogImage: "", favicon: "" });
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
      setUploadError(result.error ?? app.editor.imageUploadFailed);
      return null;
    } catch {
      setUploadError(app.editor.imageUploadFailed);
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function uploadImage(file: File) {
    const id = await uploadAsset(file);
    if (id) update({ assetId: id });
  }

  /**
   * Seçilen fotoğrafları SIRAYLA yükler ve hepsini TEK `update` ile ekler.
   * Sıralı: `uploadAsset` tek bir `uploading`/hata durumu paylaşıyor, paralel
   * istekler o durumu birbirinin üstüne yazardı. Tek update: `block` bu
   * kapanışta sabit, her dosyada ayrı ayrı güncelleseydik ikinci yazım
   * birincisini silerdi.
   */
  async function addGalleryPhotos(files: File[]) {
    if (block.type !== "gallery") return;
    // İkinci savunma hattı: arayüz zaten kapanıyor ama yarışan bir tıklama
    // sınırı aşmasın (şema 5'te reddediyor, kullanıcı hatayı kayıtta görürdü).
    const room = GALLERY_MAX_PHOTOS - block.data.photos.length;
    if (room <= 0) return;
    const picked = files.slice(0, room);
    const added: { assetId: string; alt: string }[] = [];
    setUploadStep({ done: 0, total: picked.length });
    for (const file of picked) {
      const id = await uploadAsset(file);
      // Bir dosya reddedildiyse (kota/tür/boyut) sıradakiler de aynı duvara
      // çarpar; sunucunun gerekçesi yazıldı, döngü orada durur.
      if (!id) break;
      added.push({ assetId: id, alt: "" });
      setUploadStep({ done: added.length, total: picked.length });
    }
    setUploadStep(null);
    if (added.length > 0) update({ photos: [...block.data.photos, ...added] });
    // Sınırın üstünde seçim sessizce kırpılmaz; kaçının alındığı yazılır.
    // Yükleme hatası varsa o mesaj kalır — daha acil olan odur.
    if (added.length === picked.length && files.length > room) {
      setUploadError(
        app.editor.galleryMaxPhotos(GALLERY_MAX_PHOTOS, room),
      );
    }
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
          ("error" in result && result.error) || app.editor.youtubeFailed,
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
      setYoutubeError(app.editor.youtubeFailedHint);
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
          ("error" in result && result.error) || app.editor.spotifyFailed,
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
      setSpotifyError(app.editor.spotifyFailedHint);
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

  /**
   * Yeri `/api/konum`'a sorar. Sonuç LİSTE olarak gösterilir ve kullanıcı
   * seçer — YouTube/Spotify'dan farkı bu: orada yapıştırılan adres hangi
   * içerik olduğunu tek başına söylüyordu, burada "Antalya" beş yer olabilir.
   */
  async function searchLocation(value: string) {
    locationAttemptedRef.current = value;
    setLocationBusy(true);
    setLocationError(null);
    try {
      const response = await fetch(`/api/konum?q=${encodeURIComponent(value)}`);
      const result = (await response.json()) as LocationSearchResponse;
      // Yavaş bir yanıt, kullanıcının o sırada yazdığı yeni aramanın
      // sonucunun üstüne yazmasın.
      if (locationAttemptedRef.current !== value) return;
      if (!response.ok || !("results" in result)) {
        setLocationResults(null);
        setLocationError(
          ("error" in result && result.error) || app.api.locationUnavailable,
        );
        return;
      }
      setLocationResults(result.results);
    } catch {
      if (locationAttemptedRef.current !== value) return;
      setLocationResults(null);
      setLocationError(app.api.locationUnavailable);
    } finally {
      if (locationAttemptedRef.current === value) setLocationBusy(false);
    }
  }

  // Yazdıkça ara. 500 ms: Photon'un politikası "adil kullanım" istiyor ve her
  // tuş vuruşunda istek atmak adil değil.
  useEffect(() => {
    if (block.type !== "location") return;
    const value = locationQuery.trim();
    if (value.length < 2 || value === locationAttemptedRef.current) return;
    const timer = window.setTimeout(() => void searchLocation(value), 500);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnız arama değişince
  }, [locationQuery, block.id]);

  // Alanlar tip başına tek bir switch'te toplanır: `never` default'u sayesinde
  // yeni bir blok tipi eklendiğinde derleyici burada durur (eskiden art arda
  // `if` bloklarıydı; unutulan tip sessizce alansız bir panel açıyordu).
  function fields() {
    switch (block.type) {
      case "profile":
        return (
          <>
            <label>{app.editor.fieldName}<input value={block.data.name} onChange={(event) => update({ name: event.target.value })} /></label>
            <label>{app.editor.fieldDescription}<textarea value={block.data.title} onChange={(event) => update({ title: event.target.value })} /></label>
          </>
        );
      case "social":
        return (
          <>
            <label>{app.editor.fieldPlatform}
              <select
                value={block.data.platform}
                onChange={(event) => {
                  const config = onboarding.byId(event.target.value as SocialPlatform);
                  // Kullanıcı kendi başlığını yazdıysa platform değişince
                  // silinmez; yalnız varsayılan etiket yeni platformunkine
                  // döner (varsayılan zaten kartta görünmüyor).
                  const current = block.data.label.trim();
                  const wasDefault =
                    current === "" || current === onboarding.byId(block.data.platform).label;
                  update({
                    platform: config.id,
                    label: wasDefault ? config.label : current,
                    url: socialUrl(config.id, block.data.handle),
                    ogImage: "",
                    favicon: "",
                  });
                }}
              >
                {onboarding.platforms.map((platform) => (
                  <option key={platform.id} value={platform.id}>{platform.label}</option>
                ))}
              </select>
            </label>
            <label>{app.editor.fieldSocialTarget}
              <input
                value={socialLink}
                placeholder={onboarding.byId(block.data.platform).placeholder}
                onChange={(event) => {
                  setSocialLink(event.target.value);
                  applySocialLink(event.target.value);
                }}
              />
              <small className="inspector-hint">
                {app.editor.socialHint}
              </small>
            </label>
            {/* Başlık İSTEĞE BAĞLI: boşken kart yalnız ikon + kullanıcı adı
                gösterir. Placeholder platformun kendi adı — yazmazsan o metin
                kartta ÇIKMAZ, yalnız burada ne yazabileceğini anlatır. */}
            <label>
              {app.editor.optionalTitle}
              <input
                value={
                  block.data.label.trim() === onboarding.byId(block.data.platform).label
                    ? ""
                    : block.data.label
                }
                placeholder={onboarding.byId(block.data.platform).label}
                onChange={(event) =>
                  update({
                    label: event.target.value.trim()
                      ? event.target.value
                      : onboarding.byId(block.data.platform).label,
                  })
                }
              />
            </label>
          </>
        );
      case "link":
        return (
          <>
            {/* Başlık İSTEĞE BAĞLI: boşsa kart yalnız adresi yazar (eskiden
                alan adı başlığa da kopyalanıyordu, aynı metin iki kez). */}
            <label>
              {app.editor.optionalTitle}
              <input
                value={block.data.title}
                placeholder={linkHostLabel(block.data.url) || app.editor.linkTitlePlaceholder}
                onChange={(event) => update({ title: event.target.value })}
              />
            </label>
            <label>
              {app.editor.fieldLink}
              <input
                value={block.data.url}
                // Adres değişince eski önizleme görselini SİL: zenginleştirme
                // döngüsü `ogImage` doluysa atlıyor, yani nytimes.com'dan
                // gelen görsel yeni adrese yapışıp o hâliyle yayınlanıyordu.
                // `social` bloğu bunu zaten yapıyor (`onSocialLink`).
                onChange={(event) => update({ url: event.target.value, ogImage: "", favicon: "" })}
              />
            </label>
          </>
        );
      case "image":
        return (
          <>
            <label>{app.editor.fieldImage}
              <span className="inspector-upload">
                <MediaImage width={18} height={18} />
                {uploading
                  ? app.editor.imageUploading
                  : block.data.assetId
                    ? app.editor.imageReplace
                    : app.editor.imageDrop}
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
            <label>{app.editor.fieldTitle}<input value={block.data.title} onChange={(event) => update({ title: event.target.value })} /></label>
            <label>{app.editor.fieldLink}<input value={block.data.url} onChange={(event) => update({ url: event.target.value })} /></label>
          </>
        );
      case "status":
        return (
          <>
            <label>{app.editor.fieldAnnouncement}<textarea value={block.data.text} onChange={(event) => update({ text: event.target.value })} /></label>
            <label>{app.editor.fieldLink}<input value={block.data.url} onChange={(event) => update({ url: event.target.value })} /></label>
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
              {app.editor.fieldTitle}
              <input
                value={block.data.title}
                onChange={(event) => update({ title: event.target.value })}
              />
            </label>
            {/* Başlık kısa tile'da hücrelerin üstüne binmeden sığmıyor ve
                gizleniyor. Kullanıcı yazdığı şeyi neden göremediğini bilmeli. */}
            <p className="inspector-hint">
              {app.editor.galleryTitleHint}
            </p>
            <fieldset>
              <legend>{app.editor.photosLegend(photos.length, GALLERY_MAX_PHOTOS)}</legend>
              {photos.length === 0 ? (
                <p className="inspector-hint">{app.editor.galleryEmpty}</p>
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
                        placeholder={app.editor.galleryAltPlaceholder}
                        aria-label={app.editor.photoAltAria(index + 1)}
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
                          aria-label={app.editor.photoUpAria(index + 1)}
                          disabled={index === 0}
                          className="disabled:opacity-30"
                          onClick={() => move(index, -1)}
                        >
                          <NavArrowUp width={15} height={15} />
                        </button>
                        <button
                          type="button"
                          aria-label={app.editor.photoDownAria(index + 1)}
                          disabled={index === photos.length - 1}
                          className="disabled:opacity-30"
                          onClick={() => move(index, 1)}
                        >
                          <NavArrowDown width={15} height={15} />
                        </button>
                      </span>
                      <button
                        type="button"
                        aria-label={app.editor.photoRemoveAria(index + 1)}
                        className="flex-none text-destructive"
                        onClick={() =>
                          update({ photos: photos.filter((_, other) => other !== index) })
                        }
                      >
                        <Trash width={15} height={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {/* Sınıra ulaşınca ekleme kapanır ve NEDENİ yazar; sessizce
                  reddedilen bir buton kullanıcıya sınırı öğretmez. */}
              {full ? (
                <p className="inspector-hint">
                  {app.editor.galleryFullHint(GALLERY_MAX_PHOTOS)}
                </p>
              ) : (
                <span className="inspector-upload">
                  <MediaImage width={18} height={18} />
                  {uploading
                    ? uploadStep && uploadStep.total > 1
                      ? app.editor.galleryUploadStep(Math.min(uploadStep.done + 1, uploadStep.total), uploadStep.total)
                      : app.editor.imageUploading
                    : app.editor.galleryAdd}
                  {uploading ? null : (
                    <small className="opacity-70">{app.editor.galleryMultiHint}</small>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    // Toplu seçim: dosya seçicide birden fazla fotoğraf
                    // işaretlenir, sıraya alınıp tek seferde eklenir.
                    multiple
                    disabled={uploading}
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []);
                      // Aynı dosya art arda seçilebilsin diye alan sıfırlanır.
                      event.target.value = "";
                      if (files.length > 0) void addGalleryPhotos(files);
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
            <label>{app.editor.youtubeLinkLabel}
              <input
                value={youtubeInput}
                placeholder="youtube.com/watch?v=… ya da youtube.com/@kanal"
                onChange={(event) => setYoutubeInput(event.target.value)}
              />
              <small className="inspector-hint">
                {app.editor.youtubeHint}
              </small>
            </label>
            {youtubeBusy ? <p className="inspector-hint">{app.editor.resolving}</p> : null}
            {youtubeError ? (
              <p className="inspector-error" role="alert">{youtubeError}</p>
            ) : null}
            {!youtubeBusy && !youtubeError && resolved ? (
              <p className="inspector-hint">{resolved}</p>
            ) : null}
            {/* Başlık İSTEĞE BAĞLI. Adres çözülürken YouTube'un kendi başlığı
                buraya yazılır ama kilitli değil: silersen kart yazısız,
                yalnız video olarak durur. */}
            {block.data.kind === "video" ? (
              <label>
                {app.editor.optionalTitle}
                <input
                  value={block.data.title}
                  placeholder={app.editor.youtubeTitlePlaceholder}
                  onChange={(event) => update({ title: event.target.value })}
                />
              </label>
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
          ? `${app.editor.spotifyAdded(widget.spotify.kind(block.data.kind))}${
              block.data.title ? ` — ${block.data.title}` : ""
            }`
          : null;
        return (
          <>
            <label>{app.editor.spotifyLinkLabel}
              <input
                value={spotifyInput}
                placeholder="open.spotify.com/track/… ya da spotify:album:…"
                onChange={(event) => setSpotifyInput(event.target.value)}
              />
              <small className="inspector-hint">
                {app.editor.spotifyHint}
              </small>
            </label>
            {spotifyBusy ? <p className="inspector-hint">{app.editor.resolving}</p> : null}
            {spotifyError ? (
              <p className="inspector-error" role="alert">{spotifyError}</p>
            ) : null}
            {!spotifyBusy && !spotifyError && resolved ? (
              <p className="inspector-hint">{resolved}</p>
            ) : null}
          </>
        );
      }
      case "location": {
        const picked = block.data.lat !== null && block.data.lon !== null;
        return (
          <>
            <label>{app.editor.locationSearchLabel}
              <input
                type="search"
                value={locationQuery}
                placeholder={app.editor.locationSearchPlaceholder}
                onChange={(event) => setLocationQuery(event.target.value)}
              />
              {/* Ne yayınlandığı AÇIKÇA yazar: ev adresi hassas veridir ve
                  kullanıcı bir harita kartı koyarken bunu düşünmeyebilir. */}
              <small className="inspector-hint">{app.editor.locationPrivacyHint}</small>
            </label>
            {locationBusy ? (
              <p className="inspector-hint">{app.editor.locationSearching}</p>
            ) : null}
            {locationError ? (
              <p className="inspector-error" role="alert">{locationError}</p>
            ) : null}
            {!locationBusy && !locationError && locationResults?.length === 0 ? (
              <p className="inspector-hint">
                {/* ARANAN metin yazılır, kutunun o anki içeriği değil:
                    kullanıcı yazmaya devam etmişse ikisi ayrışır. */}
                {app.editor.locationNoResults(locationAttemptedRef.current)}
              </p>
            ) : null}
            {locationResults?.length ? (
              <ul className="inspector-options">
                {locationResults.map((result) => (
                  <li key={`${result.label}|${result.lat}|${result.lon}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setData({
                          label: result.label,
                          country: result.country,
                          countryCode: result.countryCode,
                          lat: result.lat,
                          lon: result.lon,
                          timeZone: result.timeZone,
                        });
                        // Kareleri hemen eşlemeye yaz: kullanıcı haritayı
                        // kaydedip sayfayı yenilemeden görmeli.
                        if (result.frames) {
                          for (const step of ["far", "near"] as const) {
                            rememberImage(
                              mapFrameImageKey(step, result.lat, result.lon),
                              result.frames[step],
                            );
                          }
                        }
                        setLocationResults(null);
                        setLocationQuery("");
                        locationAttemptedRef.current = "";
                      }}
                    >
                      <strong>{result.label}</strong>
                      {result.country ? <small>{result.country}</small> : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {picked ? (
              <>
                <p className="inspector-hint">
                  {app.editor.locationSelected(block.data.label)}
                </p>
                <p className="inspector-hint">
                  {block.data.timeZone
                    ? app.editor.locationTimeZone(block.data.timeZone)
                    : app.editor.locationNoTimeZone}
                </p>
                <button
                  type="button"
                  className="inspector-secondary"
                  onClick={() =>
                    setData({
                      label: "",
                      country: "",
                      countryCode: "",
                      lat: null,
                      lon: null,
                      timeZone: "",
                    })
                  }
                >
                  {app.editor.locationClear}
                </button>
              </>
            ) : null}
            <small className="inspector-hint">{GEOCODE_ATTRIBUTION}</small>
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
        <strong>{app.blockTypes[block.type]}</strong>
        <button type="button" aria-label={app.editor.closePanel} onClick={close}><Xmark width={18} height={18} /></button>
      </header>
      <div className="inspector-fields">
        {fields()}
      </div>
      <footer>
        {block.type !== "profile" ? <button type="button" onClick={remove}><Trash width={16} height={16} /> Sil</button> : <span />}
        <button type="button" onClick={close}>Uygula</button>
      </footer>
    </aside>
  );
}

export default function Editor({ loaderData }: Route.ComponentProps) {
  const app = useCatalog(appCatalog);
  const blockLabel = useBlockLabel();
  const onboarding = useOnboardingLists();
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
      ? app.editor.galleryBlockLimit(MAX_GALLERY_BLOCKS)
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
    // Kural katmanı kimlik döndürür; metin burada, kullanıcının dilinde kurulur.
    return layoutIssues(layout).map((issue) => ({
      blockId: issue.blockId,
      label: blockLabel(issue.type),
      message: app.blockIssues[issue.issue],
    }));
  }, [publishTried, layout, app, blockLabel]);

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
        if (!block.data.url || (block.data.ogImage && block.data.favicon)) continue;
        const key = `${block.id}|${block.data.url}`;
        if (ogAttemptedRef.current.has(key)) continue;
        ogAttemptedRef.current.add(key);
        const { id } = block;
        const url = block.data.url;
        void fetch(`/api/og-image?url=${encodeURIComponent(url)}`)
          .then((response) =>
            response.ok
              ? (response.json() as Promise<{
                  image?: string | null;
                  proxied?: string | null;
                  favicon?: string | null;
                  faviconProxied?: string | null;
                }>)
              : null,
          )
          .then((result) => {
            const image = result?.image ?? "";
            const favicon = result?.favicon ?? "";
            if (!image && !favicon) return;
            // İmzalı yol layout'a YAZILMAZ (kaynak adres kaybolurdu); ayrı
            // eşlemede durur — bkz. server/layout-images.ts.
            if (result?.proxied) rememberSignedImage(id, result.proxied);
            if (result?.faviconProxied) {
              rememberSignedImage(faviconImageKey(id), result.faviconProxied);
            }
            setLayout((current) => ({
              ...current,
              blocks: current.blocks.map((item) =>
                item.id === id &&
                (item.type === "social" || item.type === "link") &&
                item.data.url === url
                  ? ({
                      ...item,
                      data: {
                        ...item.data,
                        ogImage: item.data.ogImage || image,
                        favicon: item.data.favicon || favicon,
                      },
                    } as ProfileBlock)
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

    const config = onboarding.byId(pick.platform);
    insertBlock({
      id: createBlockId(),
      type: "social",
      size: "1x1",
      data: { platform: pick.platform, handle: "", url: "", label: config.label, ogImage: "", favicon: "" },
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
      <Link to="/dashboard" className="editor-back" aria-label={app.editor.backToDashboard}>
        <NavArrowLeft width={20} height={20} />
      </Link>
      <div className="editor-topbar">
        <a
          className="editor-address-pill"
          href={`/${loaderData.username}`}
          target="_blank"
          rel="noreferrer"
          title={hasDraft ? app.editor.draftTitle : app.editor.liveTitle}
          aria-label={app.editor.addressLabel(loaderData.username, hasDraft)}
        >
          <span className={`save-dot is-${saveState}`} aria-hidden />
          {/* Dar ekranda adres gizlenir; yalnız nokta + durum metni kalır (CSS) */}
          <span className="address-host" aria-hidden>caka.app/{loaderData.username}</span>
          {hasDraft ? <span className="draft-chip" aria-hidden>{app.editor.draftShort}</span> : null}
          <span className="address-status" aria-hidden>{hasDraft ? app.editor.draftShort : app.editor.liveShort}</span>
          <OpenNewWindow width={13} height={13} aria-hidden className="address-open" />
        </a>
        <button
          type="button"
          className="editor-publish"
          onClick={() => void publish()}
          disabled={publishing || !hasDraft}
          aria-label={
            publishing
              ? app.editor.publishing
              : hasDraft
                ? app.editor.publishFinish
                : app.editor.liveShort
          }
        >
          <SendDiagonal width={15} height={15} aria-hidden />
          {/* Mobilde kısa etiket görünür ("Yayınla"); erişilebilir ad aria-label'da */}
          <span className="publish-label" aria-hidden>
            {publishing
              ? app.editor.publishingProgress
              : hasDraft
                ? app.editor.publishFinish
                : app.editor.liveShort}
          </span>
          <span className="publish-label-short" aria-hidden>
            {publishing
              ? app.editor.publishingProgress
              : hasDraft
                ? app.editor.publishShort
                : app.editor.liveShort}
          </span>
        </button>
      </div>

      {issues.length ? (
        <div className="editor-issue-panel" role="alert">
          <strong>
            <WarningTriangle width={15} height={15} aria-hidden /> Aksiyon gerekli
          </strong>
          <p>{app.editor.blockedTitle}</p>
          <ul>
            {issues.map((issue) => (
              <li key={issue.blockId}>
                <span>
                  <b>{issue.label}</b> — {issue.message}
                </span>
                <button type="button" onClick={() => focusBlock(issue.blockId)}>
                  {app.editor.fixIssue}
                </button>
                {/* Profil kartı zorunludur (düzende tam bir tane); kaldırılamaz. */}
                {issue.blockId === profileBlock?.id ? null : (
                  <button
                    type="button"
                    className="is-remove"
                    onClick={() => removeBlock(issue.blockId)}
                  >
                    {app.editor.removeBlock}
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
              {app.editor.editedElsewhere}
              <button type="button" onClick={() => window.location.reload()}>Yenile</button>
            </>
          ) : (
            app.editor.saveFailed
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
              aria-label={app.editor.editProfileInfo}
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
              <Plus width={20} height={20} /> Blok ekle
            </button>
          </div>
        </div>
      </section>

      <nav className="editor-toolbar" aria-label={app.editor.toolbarLabel}>
        <button
          type="button"
          data-tooltip="Tema"
          aria-label="Tema"
          className={panel === "theme" ? "is-active" : ""}
          onClick={() => setPanel(panel === "theme" ? null : "theme")}
        >
          <Palette width={19} height={19} />
        </button>
        <span className="toolbar-sep" aria-hidden />
        <button type="button" data-tooltip={app.editor.addLink} aria-label={app.editor.addLink} onClick={() => add("link")}>
          <LinkIcon width={19} height={19} />
        </button>
        <button type="button" data-tooltip="Metin ekle" aria-label="Metin ekle" onClick={() => add("text")}>
          <Text width={19} height={19} />
        </button>
        <button type="button" data-tooltip="Duyuru ekle" aria-label="Duyuru ekle" onClick={() => add("status")}>
          <Megaphone width={18} height={18} />
        </button>
        <button type="button" data-tooltip={app.editor.addImage} aria-label={app.editor.addImage} onClick={() => add("image")}>
          <MediaImage width={19} height={19} />
        </button>
        {/* "Fotoğraf galerisi": bu çubuktaki son düğme zaten "Blok galerisi"
            adını taşıyor; ikisi aynı adı taşısaydı hangisinin ne yaptığı
            arayüzde okunmazdı. */}
        <button
          type="button"
          data-tooltip={galleryBlocked ?? app.editor.addGallery}
          aria-label={galleryBlocked ?? app.editor.addGallery}
          disabled={Boolean(galleryBlocked)}
          className={galleryBlocked ? "cursor-not-allowed opacity-40" : ""}
          onClick={() => add("gallery")}
        >
          <MediaImageList width={19} height={19} />
        </button>
        <button type="button" data-tooltip="YouTube ekle" aria-label="YouTube ekle" onClick={() => add("youtube")}>
          <MediaVideo width={19} height={19} />
        </button>
        <button
          type="button"
          data-tooltip="Blok galerisi"
          aria-label="Blok galerisi"
          className={panel === "gallery" ? "is-active" : ""}
          onClick={() => setPanel(panel === "gallery" ? null : "gallery")}
        >
          <ViewGrid width={19} height={19} />
        </button>
        <span className="toolbar-sep" aria-hidden />
        <button
          type="button"
          data-tooltip={device === "desktop" ? app.editor.mobilePreview : app.editor.desktopPreview}
          aria-label={device === "desktop" ? app.editor.mobilePreview : app.editor.desktopPreview}
          className={device === "mobile" ? "is-active" : ""}
          onClick={() => setDevice(device === "desktop" ? "mobile" : "desktop")}
        >
          {device === "desktop" ? <SmartphoneDevice width={18} height={18} /> : <Computer width={19} height={19} />}
        </button>
      </nav>

      {panel === "theme" ? (
        <div className="theme-popover editor-popover" role="group" aria-label={app.editor.pickTheme}>
          {onboarding.templates.map((template) => (
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
          rememberImage={rememberSignedImage}
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
