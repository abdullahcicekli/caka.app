import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { env } from "cloudflare:workers";
import {
  Computer,
  Link as LinkIcon,
  MapPin,
  MediaImage,
  Megaphone,
  NavArrowDown,
  NavArrowLeft,
  NavArrowUp,
  OpenNewWindow,
  Page,
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
  AYET_GRID_DEFAULTS,
  AYET_GRID_LIMITS,
  BLOCK_GRID_LIMITS,
  blockGridLimits,
  blockIssue,
  createBlockId,
  detectSocialFromUrl,
  DOCUMENT_CONTENT_TYPE,
  DOCUMENT_MAX_BYTES,
  ensureLayoutPositions,
  faviconImageKey,
  GALLERY_MAX_PHOTOS,
  galleryBlockCount,
  GEOCODE_ATTRIBUTION,
  GRID_COLUMNS,
  layoutIssues,
  LINK_GRID_LIMITS,
  LINK_IMAGE_DIMS,
  mapFrameImageKey,
  MAX_GALLERY_BLOCKS,
  normalizeTheme,
  parseProfileLayout,
  PHOTO_LAYOUTS,
  photoBlockCount,
  photoRecommendedSize,
  placeNewBlock,
  sizeFromDims,
  sizeToDims,
  socialUrl,
  spotifyDefaultSize,
  withDerivedSmPositions,
  type AyetVariant,
  type LinkVariant,
  type BlockSize,
  type LocationSuggestion,
  type LocationZoomStep,
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
      // Sürüm `card` doğar: yeni blokta henüz og:image yok, "yalnız görsel"
      // boş bir kutu demek olurdu.
      return {
        id,
        type,
        size: "1x1",
        data: { title: "", url: "", ogImage: "", favicon: "", variant: "card" },
      };
    case "social":
      return {
        id,
        type,
        size: "1x1",
        data: {
          platform: "instagram",
          handle: "",
          url: "",
          label: "Instagram",
          ogImage: "",
          favicon: "",
          variant: "card",
        },
      };
    case "text":
      return { id, type, size: "2x1", data: { text: "" } };
    case "status":
      return { id, type, size: "2x1", data: { text: "", url: "" } };
    // Blok BOŞ doğar, yani tek fotoğrafın tabanıyla (1×1 = 178×156). Fotoğraf
    // eklendikçe editör bloğu `photoRecommendedSize` ile büyütür; sabit bir
    // 4×1 ile doğmak, tek fotoğraf koyan kullanıcıya tam genişlik bir şerit
    // bırakıyordu.
    case "gallery":
      return { id, type, size: "1x1", data: { title: "", url: "", layout: "grid", photos: [] } };
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
    // Belge kartı 2x1 doğar: `BLOCK_GRID_LIMITS.document` tabanı olan
    // 4×2 birim (368×156) tam olarak bu etiketin karşılığı.
    case "document":
      return {
        id,
        type,
        size: "2x1",
        data: { title: "", fileName: "", bytes: 0, uploadedAt: 0 },
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
    // Ayet bloğu BOŞ doğar: hangi ayet olduğu ancak arama sonucundan seçilince
    // belli olur. Varsayılan sürüm "ikisi birlikte" — kartın tam hâli budur ve
    // kullanıcı istemediğini kapatır. Başlangıç ölçüsü o sürümün varsayılanıdır
    // (`AYET_GRID_DEFAULTS.both`); `size` sözlüğünde 3 satırlık bir etiket
    // olmadığı için en yakın etiket yazılır, gerçek yerleşim `pos`tan okunur.
    case "ayet":
      return {
        id,
        type,
        size: "2x2",
        data: {
          variant: "both",
          surah: 1,
          verse: 1,
          surahName: "",
          arabic: "",
          meal: "",
          mealEdition: "",
          mealTranslator: "",
        },
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
  status: true,
  // Panelde kısayolu yok; araç çubuğundan ya da blok galerisinden eklenir.
  // Fotoğraf bloğu ayrıca sayfa başına 2 ile sınırlı (R62) — derin bağlantı
  // bu sınırı atlatabilecek ikinci bir yol açmasın.
  gallery: false,
  youtube: false,
  spotify: false,
  // Panelde kısayolu yok; araç çubuğundan ya da blok galerisinden eklenir.
  document: false,
  location: false,
  // Ayet bloğu boş doğuyor ve kullanılabilir olması için arama gerekiyor;
  // panelden tek tıkla eklenen bir kısayol boş kart bırakırdı.
  ayet: false,
};

/**
 * Editörde gösterilecek blok adı. Katalogdaki `blockTypes` şemanın
 * adlandırmasının editör karşılığıdır: depodaki ayrımcı `"gallery"` olarak
 * kalsa da kullanıcı "Fotoğraf" görür (eski `image` bloğu bu tipte eridi).
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

/**
 * Dosyayı R2'ye yükler ve ilerlemeyi YÜZDEYLE bildirir.
 *
 * NEDEN `fetch` DEĞİL: `fetch` gövdenin ne kadarının gittiğini söylemiyor
 * (istek gövdesi için `ReadableStream` yükleme akışı hâlâ yaygın değil ve
 * HTTP/2 olmadan çalışmıyor). `XMLHttpRequest.upload.onprogress` bu bilgiyi
 * her tarayıcıda veriyor; uç nokta aynı kalıyor.
 *
 * Aynı köken POST'unda tarayıcı `Origin` başlığını gönderir, yani uçtaki
 * `hasSameOrigin` kapısı XHR'de de sağlanır.
 */
function uploadPhotoFile(
  file: File,
  onProgress: (percent: number) => void,
): Promise<{ id?: string; error?: string }> {
  return new Promise((resolve) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/onboarding/avatar");
    request.setRequestHeader("Content-Type", file.type);
    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      // %100 dosya SUNUCUYA VARDI demek, "kaydedildi" demek değil; yanıt
      // gelene kadar 99'da bekletiliyor ki gösterge yalan söylemesin.
      onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    };
    request.onload = () => {
      let result: { id?: string; error?: string } = {};
      try {
        result = JSON.parse(request.responseText) as { id?: string; error?: string };
      } catch {
        result = {};
      }
      resolve(request.status >= 200 && request.status < 300 ? result : { error: result.error });
    };
    request.onerror = () => resolve({});
    request.onabort = () => resolve({});
    request.send(file);
  });
}
/** `/api/konum` başarılı yanıtı; hata dalında yalnız `error` döner. */
type LocationHit = LocationSuggestion & {
  /** Sağlayıcının harita karesi adresleri; jeton yoksa null. */
  frames: Record<LocationZoomStep, string> | null;
};
type LocationSearchResponse = { results: LocationHit[] } | { error: string };
/** `/api/ayet` arama satırı; tam metin taşımaz (bkz. `server/quran-api.ts`). */
type AyetSearchHit = { surah: number; verse: number; surahName: string; snippet: string };

type AyetSearchResponse = { hits: AyetSearchHit[] } | { error: string };

/** `/api/ayet/sec` yanıtı — doğrudan bloğun verisine yazılır. */
type AyetResolveResponse =
  | {
      surah: number;
      verse: number;
      surahName: string;
      arabic: string;
      meal: string;
      mealEdition: string;
      mealTranslator: string;
    }
  | { error: string };

function Inspector({
  block,
  update,
  setData,
  setSize,
  setDims,
  remove,
  close,
  onSignedImage,
  multiPhotoBlocked,
  rememberImage,
  signedImages,
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
  /** Bloğu YARIM BİRİM ölçüsüyle boyutlandırır. `setSize`in sözlüğü kaba
      (genişlik 2/4/8, yükseklik 2/4); fotoğraf bloğu ara basamaklarda da
      durabildiği için büyütme oradan geçemez. */
  /** Bloğu ham ızgara ölçüsüyle boyutlandırır. Ayet kartında şart: "ikisi
      birlikte" sürümü 3 satır ister ve boyut sözlüğünde o etiket yok. */
  setDims: (w: number, h: number) => void;
  remove: () => void;
  close: () => void;
  /** Bloğun uzak görselinin imzalı yolu; editörün `signedImages` eşlemesine
      eklenir ki kullanıcı kaydetmeyi beklemeden önizlemeyi görsün. */
  onSignedImage: (path: string) => void;
  /**
   * Bu bloğa İKİNCİ fotoğrafı eklemek sayfa sınırını aşıyor mu? Aşıyorsa
   * gerekçe. Sınır çok fotoğraflı blokları sayıyor (bkz. `galleryCountIssue`);
   * kapı burada olmasa kullanıcı fotoğrafı yükler, sonra kaydederken 400
   * alırdı.
   */
  multiPhotoBlocked?: string | null;
  /** Aynı eşlemeye ANAHTARIYLA yazar. Harita kareleri blok kimliğine değil
      koordinata anahtarlandığı için (bkz. `mapFrameImageKey`) blok kimliğini
      varsayan `onSignedImage` yetmiyor. */
  rememberImage: (key: string, path: string) => void;
  /** Panelin içindeki önizleme kartı da tuvaldeki kartla AYNI eşlemeyi okur;
      yoksa harita kareleri boş kalırdı. */
  signedImages: Readonly<Record<string, string>>;
}) {
  const app = useCatalog(appCatalog);
  const widget = useCatalog(widgetCatalog);
  const onboarding = useOnboardingLists();
  // "Yalnız görsel" sürümünün ön koşulu: İMZALI bir önizleme adresi. Ham
  // `data.ogImage`'a bakmak yetmez — imza sırrı yoksa ya da adres reddedilmişse
  // kart görseli hiç çizmiyor, sürüm de boş bir kutu üretirdi.
  const hasLinkPreview = Boolean(signedImages[block.id]);
  const [uploading, setUploading] = useState(false);
  // Çoklu seçimde tek bir "Yükleniyor…" beş fotoğraf boyunca donmuş görünür;
  // kaçıncı dosyada olunduğu ve o dosyanın yüzdesi yazılınca bekleme
  // anlaşılır oluyor ("3/5 · %62").
  const [uploadStep, setUploadStep] = useState<{
    done: number;
    total: number;
    percent: number;
  } | null>(null);
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
  // Ayet: YouTube/Spotify'daki desenin arama yapan hâli. Ham sorgu ayrı
  // tutulur; blok yalnız listeden BİR SATIR SEÇİLİNCE değişir — yazarken
  // kartın altından ayetin kayması kabul edilemezdi.
  const [ayetQuery, setAyetQuery] = useState("");
  const [ayetHits, setAyetHits] = useState<AyetSearchHit[]>([]);
  const [ayetBusy, setAyetBusy] = useState(false);
  const [ayetError, setAyetError] = useState<string | null>(null);
  const [ayetEmpty, setAyetEmpty] = useState(false);
  // Öneri listesi combobox: `ayetOpen` listenin AÇIK olup olmadığı (Escape ve
  // odak kaybı kapatır, yazmak yeniden açar), `ayetActive` klavyeyle üzerinde
  // durulan satırın sırası (-1 = hiçbiri). Odak HER ZAMAN alanda kalır;
  // satırlar `aria-activedescendant` ile işaretlenir, düğme değildir.
  const [ayetOpen, setAyetOpen] = useState(false);
  const [ayetActive, setAyetActive] = useState(-1);
  const ayetAttemptedRef = useRef("");
  // BAYAT YANIT KALKANI: her arama/seçim bir bilet numarası alır. Yanıt
  // döndüğünde bilet hâlâ güncel değilse yazılmaz — hızlı yazan kullanıcıda
  // geç gelen eski yanıt yenisini ezmesin (konum aramasındaki kusurun aynısı).
  // Sayaç, konumdaki "sorgu metnini karşılaştır" yönteminden daha sağlam:
  // kullanıcı "aşk" → "aşkı" → "aşk" yazarsa metin karşılaştırması eski
  // yanıtı güncel sanardı.
  const ayetTicketRef = useRef(0);
  const ayetListboxId = useId();
  // Seçim yapıldıktan sonra panelin varsayılan görünümü "şu ayet seçili"dir;
  // arama alanı geri çekilir. Bu bayrak kullanıcının onu bilerek geri
  // açtığını söyler. Seçim yoksa alan zaten açıktır (aşağıda `ayetPicking`).
  const [ayetSearchOpen, setAyetSearchOpen] = useState(false);
  const ayetInputRef = useRef<HTMLInputElement | null>(null);
  const ayetChangeButtonRef = useRef<HTMLButtonElement | null>(null);
  const ayetPickedLegendId = useId();
  // Seçim duyurusu GEÇİCİDİR: yalnız seçim yapıldığı anda dolar. Blok
  // verisinden türetilseydi, liste Escape ile kapandığında canlı bölge hiçbir
  // şey olmamışken eski seçimi yeniden okurdu (hakem bulgusu).
  const [ayetAnnounce, setAyetAnnounce] = useState("");
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
    setAyetQuery("");
    ayetAttemptedRef.current = "";
    ayetTicketRef.current += 1;
    setAyetHits([]);
    setAyetError(null);
    setAyetEmpty(false);
    setAyetOpen(false);
    setAyetActive(-1);
    setAyetSearchOpen(false);
    setAyetAnnounce("");
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
  async function uploadAsset(
    file: File,
    step: { done: number; total: number },
  ): Promise<string | null> {
    setUploading(true);
    setUploadError(null);
    setUploadStep({ ...step, percent: 0 });
    const result = await uploadPhotoFile(file, (percent) =>
      setUploadStep({ ...step, percent }),
    );
    setUploading(false);
    if (result.id) return result.id;
    setUploadError(result.error ?? app.editor.imageUploadFailed);
    return null;
  }

  /**
   * Bloğu önerilen ölçüye BÜYÜTÜR; zaten o kadar yer kaplıyorsa dokunmaz.
   * Yalnız büyütmek şart: kullanıcının elle genişlettiği bir bloğu fotoğraf
   * eklerken küçültmek, onun kararını geri almak olurdu.
   *
   * Karşılaştırma EKSEN EKSEN, alanla DEĞİL: 748×156 (alan 16) ile 368×324
   * (alan 16) aynı alanı kaplıyor ama biri şerit biri kutu. Alanla
   * bakıldığında ızgaradan kaydırmalıya geçen beş fotoğraflı bir blok
   * 156px'lik şeritte kalıyor ve tam da `photoRecommendedSize`'ın kaçındığı
   * kırpmaya düşüyordu.
   */
  function growTo(size: BlockSize) {
    if (block.type === "profile") return;
    const target = sizeToDims(size);
    const current = block.pos?.lg ?? sizeToDims(block.size);
    const w = Math.max(current.w, target.w);
    const h = Math.max(current.h, target.h);
    if (w === current.w && h === current.h) return;
    setDims(w, h);
  }

  /**
   * Belgeyi `/api/belge`'ye yükler. Dosya adı `X-Caka-File-Name` başlığında
   * yüzde-kodlu gider (başlıklar yalnız ASCII taşır; "Özgeçmiş.pdf" ham hâlde
   * geçersiz bir başlık olurdu). Sunucu adı ayrıca temizler.
   *
   * Kartın yazdığı üç bilgi (ad, boyut, tarih) YANITTAN alınır, dosyadan
   * değil: boyutu ve zamanı ölçen sunucudur, `File.size` yalnız tarayıcının
   * dediğidir. Sunucunun reddetme gerekçesi (tür, boyut, kota) panelde olduğu
   * gibi gösterilir.
   */
  async function uploadDocument(file: File) {
    // Tavanı AŞAN dosya hiç yola çıkmasın: sunucu zaten 413 dönüyor ama
    // 200 MB'lık bir dosyayı yükleyip reddedilmesini beklemek, mobil veride
    // bedava olmayan bir bekleyiş. Karar yine sunucunun (bu kontrol yalnız
    // istemci kolaylığı; `readLimitedBody` akış sırasında da kesiyor).
    if (file.size > DOCUMENT_MAX_BYTES) {
      setUploadError(app.api.documentTooLarge);
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const response = await fetch("/api/belge", {
        method: "POST",
        headers: {
          "Content-Type": DOCUMENT_CONTENT_TYPE,
          "X-Caka-File-Name": encodeURIComponent(file.name),
        },
        body: file,
      });
      const result = (await response.json()) as {
        id?: string;
        fileName?: string;
        bytes?: number;
        uploadedAt?: number;
        error?: string;
      };
      if (!response.ok || !result.id) {
        setUploadError(result.error ?? app.editor.documentUploadFailed);
        return;
      }
      update({
        assetId: result.id,
        fileName: result.fileName ?? file.name,
        bytes: result.bytes ?? 0,
        uploadedAt: result.uploadedAt ?? 0,
      });
    } catch {
      setUploadError(app.editor.documentUploadFailed);
    } finally {
      setUploading(false);
    }
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
    const current = block.data.photos;
    const room =
      // Sayfa sınırı: bu blok tek fotoğraflıyken ikinciyi eklemek onu
      // "galeri" yapar ve sayfadaki galeri sayısını artırır.
      multiPhotoBlocked && current.length <= 1
        ? Math.max(0, 1 - current.length)
        : GALLERY_MAX_PHOTOS - current.length;
    if (room <= 0) {
      if (multiPhotoBlocked) setUploadError(multiPhotoBlocked);
      return;
    }
    const picked = files.slice(0, room);
    const added: { assetId: string; alt: string }[] = [];
    for (const [index, file] of picked.entries()) {
      const id = await uploadAsset(file, { done: index, total: picked.length });
      // Bir dosya reddedildiyse (kota/tür/boyut) sıradakiler de aynı duvara
      // çarpar; sunucunun gerekçesi yazıldı, döngü orada durur.
      if (!id) break;
      added.push({ assetId: id, alt: "" });
    }
    setUploadStep(null);
    if (added.length > 0) {
      const photos = [...current, ...added];
      update({ photos });
      // Blok fotoğraf sayısına göre BÜYÜR (küçülmez): beş fotoğraf 178×156'lık
      // bir kartta 60px'lik kıymıklara düşerdi. Aynı desen Spotify kartında
      // (`spotifyDefaultSize`) da var: kullanıcıya kırpılmış bir kartı elle
      // düzelttirmek yerine kayıt anında doğru boyut veriliyor.
      growTo(photoRecommendedSize(photos.length, block.data.layout));
    }
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

  /**
   * Ayet arar: `/api/ayet?q=…` hem "Bakara 255" gibi adresleri hem mealde
   * metin aramasını çözer, ayrımı SUNUCU yapar (kural `@caka/shared/quran`'da,
   * iki tarafın da göreceği yerde). Yanıt yalnız kısaltılmış meal taşır —
   * tam metin ancak bir satır seçilince istenir.
   */
  async function searchAyet(value: string) {
    ayetAttemptedRef.current = value;
    ayetTicketRef.current += 1;
    const ticket = ayetTicketRef.current;
    setAyetBusy(true);
    setAyetError(null);
    setAyetEmpty(false);
    try {
      const response = await fetch(`/api/ayet?q=${encodeURIComponent(value)}`);
      const result = (await response.json()) as AyetSearchResponse;
      if (ayetTicketRef.current !== ticket) return;
      if (!response.ok || !("hits" in result)) {
        setAyetHits([]);
        setAyetActive(-1);
        setAyetOpen(false);
        setAyetError(("error" in result && result.error) || app.editor.ayetFailed);
        return;
      }
      setAyetHits(result.hits);
      setAyetEmpty(result.hits.length === 0);
      // Yeni sonuç geldi: liste açılır ama HİÇBİR SATIR seçili doğmaz.
      // Otomatik ilk satır seçimi, Enter'a basan kullanıcıya görmediği bir
      // ayeti yazdırırdı; gezinmeyi kullanıcı ok tuşuyla başlatır.
      setAyetActive(-1);
      setAyetOpen(result.hits.length > 0);
    } catch {
      if (ayetTicketRef.current !== ticket) return;
      setAyetHits([]);
      setAyetActive(-1);
      setAyetOpen(false);
      setAyetError(app.editor.ayetFailed);
    } finally {
      if (ayetTicketRef.current === ticket) setAyetBusy(false);
    }
  }

  /**
   * Seçilen ayetin TAM metnini alır ve bloğa yazar. Arapça, meal, sure adı ve
   * çevirmen adı buradan sonra kayıttadır; ziyaretçi sayfası bir daha hiçbir
   * dış kaynağa gitmez (R58).
   */
  async function pickAyet(surah: number, verse: number) {
    if (block.type !== "ayet") return;
    // Seçim de bilet alır: uçuşta kalmış bir arama yanıtı, seçimden sonra
    // gelip listeyi yeniden açmasın.
    ayetTicketRef.current += 1;
    const ticket = ayetTicketRef.current;
    setAyetBusy(true);
    setAyetError(null);
    setAyetOpen(false);
    setAyetActive(-1);
    try {
      const response = await fetch(`/api/ayet/sec?sure=${surah}&ayet=${verse}`);
      const result = (await response.json()) as AyetResolveResponse;
      if (ayetTicketRef.current !== ticket) return;
      if (!response.ok || !("arabic" in result)) {
        setAyetError(("error" in result && result.error) || app.editor.ayetFailed);
        return;
      }
      setData({ ...block.data, ...result });
      // Sonuç listesi kapanır: kullanıcı seçtiğini kartta görsün, panel de
      // "hâlâ arıyorsun" demesin. Arama alanı da geri çekilir; seçimden
      // sonraki varsayılan görünüm "şu ayet seçili" kutusudur.
      setAyetHits([]);
      setAyetEmpty(false);
      setAyetQuery("");
      setAyetSearchOpen(false);
      ayetAttemptedRef.current = "";
      setAyetAnnounce(app.editor.ayetSelected(result.surahName, result.verse));
      // ODAK ELDEN BIRAKILMAZ: seçim alanı DOM'dan kaldırıyor ve odak
      // `<body>`ye düşerdi — klavye kullanıcısı panelin yerini kaybeder,
      // sonraki Tab belgenin başından başlardı. Odak seçim kutusunun ilk
      // düğmesine geçer; kutu bir sonraki kareye doğuyor.
      requestAnimationFrame(() => ayetChangeButtonRef.current?.focus());
    } catch {
      if (ayetTicketRef.current !== ticket) return;
      setAyetError(app.editor.ayetFailed);
    } finally {
      if (ayetTicketRef.current === ticket) setAyetBusy(false);
    }
  }

  /**
   * Seçimi kaldırır: blok yeni doğmuş hâline döner ve arama alanı açılır.
   * Sürüm KORUNUR — kullanıcı "bu kart Arapça olsun" demişse ayet değişikliği
   * o kararı geri almamalı.
   */
  function clearAyet() {
    if (block.type !== "ayet") return;
    ayetTicketRef.current += 1;
    setData({
      ...block.data,
      surah: 1,
      verse: 1,
      surahName: "",
      arabic: "",
      meal: "",
      mealEdition: "",
      mealTranslator: "",
    });
    setAyetQuery("");
    ayetAttemptedRef.current = "";
    setAyetHits([]);
    setAyetEmpty(false);
    setAyetError(null);
    setAyetBusy(false);
    setAyetOpen(false);
    setAyetActive(-1);
    setAyetSearchOpen(false);
    setAyetAnnounce("");
  }

  /** Arama alanını açıp odağı oraya taşır (seçim kutusundaki "değiştir"). */
  function openAyetSearch() {
    // Alan boş açılır: kapatılırken kalan sorgu geri gelseydi, `ayetAttemptedRef`
    // onu "zaten arandı" sayıp yeniden aramaz ve kullanıcı dolu bir alanla boş
    // bir liste görürdü.
    setAyetQuery("");
    ayetAttemptedRef.current = "";
    setAyetHits([]);
    setAyetEmpty(false);
    setAyetError(null);
    setAyetOpen(false);
    setAyetActive(-1);
    setAyetAnnounce("");
    setAyetSearchOpen(true);
    // Alan bu render'da doğuyor; odak bir sonraki kareye bırakılır.
    requestAnimationFrame(() => ayetInputRef.current?.focus());
  }

  /**
   * Sürüm değiştirir ve kartı yeni sürümün TABANINA büyütür. Spotify'daki
   * gerekçenin aynısı: kırpılmış bir kartı kullanıcıya elle düzelttirmek
   * kabul edilemez. Küçültme yapılmaz — kullanıcı kartı bilerek büyütmüş
   * olabilir, sürüm değişikliği onu geri almamalı.
   */
  /**
   * Bağlantı kartının sürümünü değiştirir.
   *
   * "Yalnız görsel"e geçerken kart 1,91:1'e EN YAKIN ızgara kutusuna oturur
   * (`LINK_IMAGE_DIMS`): sürümün bütün anlamı görselin kırpılmadan durması,
   * kullanıcıyı doğru kutuyu elle aramaya bırakmak o anlamı boşa çıkarırdı.
   * Geri dönerken ölçüye dokunulmaz, yalnız sürümün sınırlarına çekilir —
   * kullanıcının kendi seçtiği boy sebepsiz yere sıfırlanmasın.
   */
  /**
   * Sürüm seçici. İki yerde birden çiziliyor — bağlantı bloğunda ve sosyal
   * bloğun "web sitesi" platformunda — çünkü ikisi de aynı kartı (`WebLinkCard`)
   * çiziyor. Ayet kartındaki seçicinin aynısı: sürüm hem kartın çizimini hem
   * taban ölçüsünü değiştirdiği için açılır liste değil, sonucu görünür düğme.
   * Önizleme görseli YOKSA "yalnız görsel" boş bir kutu olurdu: düğme kapanır
   * ve gerekçesi yazılır.
   */
  function variantPicker(current: LinkVariant) {
    return (
      <fieldset className="inspector-choices">
        <legend>{app.editor.linkVariantLegend}</legend>
        {(
          [
            ["card", app.editor.linkVariantCard],
            ["image", app.editor.linkVariantImage],
          ] as const
        ).map(([variant, label]) => (
          <button
            key={variant}
            type="button"
            className={current === variant ? "is-active" : ""}
            aria-pressed={current === variant}
            disabled={variant === "image" && !hasLinkPreview}
            onClick={() => setLinkVariant(variant)}
          >
            {label}
          </button>
        ))}
        <small className="inspector-hint">
          {hasLinkPreview ? app.editor.linkVariantHint : app.editor.linkVariantNoPreview}
        </small>
      </fieldset>
    );
  }

  function setLinkVariant(variant: LinkVariant) {
    if (block.type !== "link" && block.type !== "social") return;
    update({ variant });
    // Sınır yalnız BAĞLANTI bloğunda sürüme bağlı; sosyal kartın tavanı
    // (8×6) zaten iki sürüme de yetiyor ve onu daraltmak yayındaki blokları
    // kırpardı.
    const limits =
      block.type === "link" ? LINK_GRID_LIMITS[variant] : BLOCK_GRID_LIMITS.social;
    const current = block.pos?.lg;
    const target =
      variant === "image"
        ? LINK_IMAGE_DIMS
        : { w: current?.w ?? limits.minW, h: current?.h ?? limits.minH };
    setDims(
      Math.min(Math.max(target.w, limits.minW), limits.maxW),
      Math.min(Math.max(target.h, limits.minH), limits.maxH),
    );
  }

  /**
   * Sürüm değişince ölçü, YALNIZCA kullanıcı henüz kartı elle boyutlandırmamışsa
   * yeni sürümün varsayılanına geçer (mevcut ölçü eski sürümün varsayılanına
   * eşitse). Elle küçültülmüş bir kartı "ikisi birlikte"ye geçince büyütmek,
   * kullanıcının kararını sessizce geri almak olurdu — sınır artık sürümden
   * bağımsız olduğu için buna gerek de yok.
   */
  function setAyetVariant(variant: AyetVariant) {
    if (block.type !== "ayet") return;
    const previous = AYET_GRID_DEFAULTS[block.data.variant];
    update({ variant });
    const limits = AYET_GRID_LIMITS[variant];
    const next = AYET_GRID_DEFAULTS[variant];
    const current = block.pos?.lg;
    const untouched = !current || (current.w === previous.w && current.h === previous.h);
    const target = untouched ? next : current;
    setDims(
      Math.min(Math.max(target.w, limits.minW), limits.maxW),
      Math.min(Math.max(target.h, limits.minH), limits.maxH),
    );
  }

  // Yazdıktan kısa süre sonra kendiliğinden ara. 400ms: arama bir ağ çağrısı
  // ama sonuç listesi anlık geri bildirim; 700ms (Spotify'ın adres çözümleme
  // gecikmesi) burada donuk hissettiriyordu.
  useEffect(() => {
    if (block.type !== "ayet") return;
    const value = ayetQuery.trim();
    if (!value) {
      // Alan boşaldı: uçuştaki yanıt da geçersizleşir, yoksa boş alanın
      // altında eski sorgunun listesi açılırdı.
      ayetTicketRef.current += 1;
      setAyetHits([]);
      setAyetEmpty(false);
      setAyetError(null);
      setAyetBusy(false);
      setAyetOpen(false);
      setAyetActive(-1);
      ayetAttemptedRef.current = "";
      return;
    }
    if (value === ayetAttemptedRef.current) return;
    const timer = window.setTimeout(() => void searchAyet(value), 400);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnız sorgu değişince
  }, [ayetQuery, block.id]);

  const ayetActiveOptionRef = useRef<HTMLLIElement | null>(null);
  const ayetListRef = useRef<HTMLUListElement | null>(null);
  /** Liste yalnız açıkken VE gösterecek satır varken açıktır. */
  const ayetListOpen = ayetOpen && ayetHits.length > 0;
  /**
   * Ekran okuyucuya giden tek cümle. Hata bilerek DIŞARIDA: onu zaten
   * `role="alert"` olan görünür satır duyuruyor, buraya da koymak aynı
   * cümleyi iki kez okuturdu.
   */
  const ayetStatusMessage = ayetBusy
    ? app.editor.ayetSearching
    : ayetError
      ? ""
      : ayetEmpty
        ? app.editor.ayetNoResults(ayetQuery.trim())
        : ayetListOpen
          ? app.editor.ayetResultCount(ayetHits.length)
          : // Seçim yapıldığı ANDA doldurulan geçici duyuru. Gören kullanıcı
            // seçim kutusunu görüyor, ekran okuyucu kullanan onu duymalı.
            ayetAnnounce;

  // Klavyeyle gezilen satır listenin kaydırma penceresine girsin: liste 232
  // pikselde tavana vurup kayıyor, yoksa ok tuşu görünmeyen bir satırı
  // işaretlerdi.
  useEffect(() => {
    if (ayetActive < 0) return;
    ayetActiveOptionRef.current?.scrollIntoView({ block: "nearest" });
  }, [ayetActive]);

  // Liste açılınca panelin kaydırma penceresine girsin: panel dar, sürüm
  // seçici ve ipuçları yer kaplıyor; sonuçlar aksi hâlde alanın altında
  // görünmeden doğuyordu (ölçüldü).
  useEffect(() => {
    if (!ayetListOpen) return;
    ayetListRef.current?.scrollIntoView({ block: "nearest" });
  }, [ayetListOpen]);

  /**
   * Öneri listesinin klavyesi (WAI-ARIA combobox deseni). Odak alandan
   * ÇIKMAZ — gezinilen satır `aria-activedescendant` ile bildirilir, böylece
   * yazmaya devam etmek için geri Tab'lamak gerekmez.
   *
   * Escape'te `stopImmediatePropagation` ŞART (ölçüldü): editörün belge
   * düzeyindeki Escape dinleyicisi seçili bloğu bırakıp paneli tümden
   * kapatıyor. React Router SSR'ında React `document`'e hidrate olduğu için
   * React'in kök dinleyicisi de o dinleyiciyle AYNI düğümde duruyor —
   * `stopPropagation` aynı düğümdeki diğer dinleyiciyi durdurmuyor, yalnız
   * `stopImmediatePropagation` durduruyor. Kullanıcı listeyi kapatmak
   * isterken panelin de yok olması kabul edilemezdi; ikinci Escape (liste
   * zaten kapalıyken) paneli kapatmaya devam eder.
   */
  function onAyetKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    const open = ayetOpen && ayetHits.length > 0;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (ayetHits.length === 0) return;
      event.preventDefault();
      if (!open) {
        setAyetOpen(true);
        setAyetActive(event.key === "ArrowDown" ? 0 : ayetHits.length - 1);
        return;
      }
      const step = event.key === "ArrowDown" ? 1 : -1;
      const count = ayetHits.length;
      // Uçlarda başa/sona sarar: en çok 12 satırlık kısa listede sarmalamak,
      // kullanıcıyı ucun nerede olduğunu tahmin etmeye zorlamaktan iyi.
      setAyetActive(
        ayetActive < 0 ? (step === 1 ? 0 : count - 1) : (ayetActive + step + count) % count,
      );
      return;
    }
    // Home/End BİLEREK ele alınmıyor: yazılabilir bir combobox'ta o tuşlar
    // imleci satır başına/sonuna götürür (WAI-ARIA APG). Listeyi gezdirmek
    // için kaçırmak, yazdığını düzeltmek isteyen kullanıcıyı şaşırtırdı.
    if (event.key === "Enter") {
      if (!open || ayetActive < 0) return;
      const hit = ayetHits[ayetActive];
      if (!hit) return;
      // Panel bir formun içinde: seçim gönderim sayılmamalı.
      event.preventDefault();
      void pickAyet(hit.surah, hit.verse);
      return;
    }
    if (event.key === "Escape") {
      if (!open) return;
      event.preventDefault();
      event.stopPropagation();
      event.nativeEvent.stopImmediatePropagation();
      setAyetOpen(false);
      setAyetActive(-1);
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
            {/* Sürüm YALNIZ "web sitesi" platformunda: marka kartları bir
                PROFİLİ gösteriyor, önizleme görseli tek başına kimliği
                anlatmaz. Web sitesi kartı ise bağlantı kartıyla aynı bileşen
                (`WebLinkCard`), yani aynı sürümleri alabilir. */}
            {block.data.platform === "website" ? variantPicker(block.data.variant) : null}
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
            {variantPicker(block.data.variant)}
          </>
        );
      case "status":
        return (
          <>
            <label>{app.editor.fieldAnnouncement}<textarea value={block.data.text} onChange={(event) => update({ text: event.target.value })} /></label>
            <label>{app.editor.fieldLink}<input value={block.data.url} onChange={(event) => update({ url: event.target.value })} /></label>
          </>
        );
      case "document":
        return (
          <>
            <label>
              {app.editor.documentField}
              <span className="inspector-upload">
                <Page width={18} height={18} />
                {uploading
                  ? app.editor.documentUploading
                  : block.data.assetId
                    ? app.editor.documentReplace
                    : app.editor.documentDrop}
                {/* `accept` yalnızca dosya seçicinin filtresidir; sunucu
                    türü ayrıca sihirli baytla doğruluyor (KTD: istemcinin
                    söylediği türe güvenilmez). */}
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={uploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    // Aynı dosya art arda seçilebilsin diye alan sıfırlanır.
                    event.target.value = "";
                    if (file) void uploadDocument(file);
                  }}
                />
              </span>
            </label>
            {uploadError ? <p className="inspector-error" role="alert">{uploadError}</p> : null}
            <p className="inspector-hint">
              {app.editor.documentHint(Math.round(DOCUMENT_MAX_BYTES / (1024 * 1024)))}
            </p>
            {block.data.fileName ? (
              <p className="inspector-hint">
                {`${block.data.fileName} · ${widget.document.size(block.data.bytes)}`}
              </p>
            ) : null}
            <label>
              {app.editor.optionalTitle}
              <input
                value={block.data.title}
                placeholder={app.editor.documentTitlePlaceholder}
                onChange={(event) => update({ title: event.target.value })}
              />
            </label>
            {/* Ziyaretçinin ne yaşayacağı editörde de yazmalı: kart tıklanınca
                dosya iner, "Önizle" yeni sekmede açar. */}
            <p className="inspector-hint">{app.editor.documentServeHint}</p>
          </>
        );
      case "gallery": {
        const photos = block.data.photos;
        const full = photos.length >= GALLERY_MAX_PHOTOS;
        // Sayfa sınırı: bu bloğu TEK fotoğraflıyken ikinciye çıkarmak onu
        // "galeri" yapar ve sayfadaki galeri sayısını artırır. FOTOĞRAFSIZ
        // blokta kapı kapanmaz — ilk fotoğrafı hiç ekleyemeyen blok
        // `gallery_empty` verip yayını da kilitlerdi.
        const limited = photos.length === 1 ? multiPhotoBlocked : null;
        const uploadLabel = uploadStep
          ? uploadStep.total > 1
            ? app.editor.uploadProgress(
                Math.min(uploadStep.done + 1, uploadStep.total),
                uploadStep.total,
                uploadStep.percent,
              )
            : app.editor.uploadPercent(uploadStep.percent)
          : app.editor.imageUploading;
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
            <fieldset>
              <legend>{app.editor.photosLegend(photos.length, GALLERY_MAX_PHOTOS)}</legend>
              {/* EKLEME DÜĞMESİ LİSTENİN ÜSTÜNDE ve liste kendi içinde kayar.
                  Eskiden düğme listenin altındaydı: beşinci fotoğraftan sonra
                  ekranın dışına düşüyor ve kullanıcı onu görmek için paneli
                  kaydırmak zorunda kalıyordu. */}
              {full ? (
                <p className="inspector-hint">{app.editor.galleryFullHint(GALLERY_MAX_PHOTOS)}</p>
              ) : limited ? (
                <p className="inspector-hint">{limited}</p>
              ) : (
                <span className="inspector-upload">
                  <MediaImage width={18} height={18} />
                  {uploading ? uploadLabel : app.editor.galleryAdd}
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
              {uploadError ? <p className="inspector-error" role="alert">{uploadError}</p> : null}
              {photos.length === 0 ? (
                <p className="inspector-hint">{app.editor.galleryEmpty}</p>
              ) : (
                <ul className="photo-list">
                  {photos.map((photo, index) => (
                    <li
                      key={`${photo.assetId}-${index}`}
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
            </fieldset>

            {/* Düzen seçimi yalnız 2+ fotoğrafta: tek fotoğrafta ızgara da
                kaydırmalı da aynı şeyi (kartı dolduran tek fotoğraf) gösterir
                ve seçim boş bir soru olurdu. */}
            {photos.length > 1 ? (
              <fieldset>
                <legend>{app.editor.photoLayoutLegend}</legend>
                {/* `radiogroup` DEĞİL: o rol ok tuşuyla gezinme ve gezici
                    `tabIndex` ister (WAI-ARIA radio group deseni). İki
                    seçenekli bu anahtarda `aria-pressed`li düğmeler hem
                    doğru hem klavyede olduğu gibi çalışıyor. */}
                <div className="segmented" role="group" aria-label={app.editor.photoLayoutLegend}>
                  {PHOTO_LAYOUTS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={block.data.layout === option}
                      className={block.data.layout === option ? "is-active" : ""}
                      onClick={() => {
                        update({ layout: option });
                        growTo(photoRecommendedSize(photos.length, option));
                      }}
                    >
                      {option === "grid"
                        ? app.editor.photoLayoutGrid
                        : app.editor.photoLayoutSlider}
                    </button>
                  ))}
                </div>
                <p className="inspector-hint">{app.editor.photoLayoutHint}</p>
              </fieldset>
            ) : null}

            <label>
              {app.editor.fieldTitle}
              <input
                value={block.data.title}
                onChange={(event) => update({ title: event.target.value })}
              />
            </label>
            {/* Başlık kısa kartta hücrelerin üstüne binmeden sığmıyor ve
                gizleniyor. Kullanıcı yazdığı şeyi neden göremediğini bilmeli. */}
            <p className="inspector-hint">{app.editor.galleryTitleHint}</p>

            {/* Bağlantı eski `image` bloğundan geliyor ve YALNIZ tek
                fotoğraflı blokta çalışıyor; çok fotoğrafta tıklama ışık
                kutusunu açar. Alan yine de gösteriliyor: kullanıcının
                yazdığı adresi sessizce yutmak olmaz. */}
            <label>
              {app.editor.fieldLink}
              <input
                value={block.data.url}
                onChange={(event) => update({ url: event.target.value })}
              />
            </label>
            {photos.length > 1 && block.data.url ? (
              <p className="inspector-hint">{app.editor.photoLinkHint}</p>
            ) : null}
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
                placeholder={app.editor.youtubePlaceholder}
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
                placeholder={app.editor.spotifyPlaceholder}
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
                {/* SEÇİMİN KANITI KARTIN KENDİSİ. Burada eskiden iki düz satır
                    vardı ("Elazığ, Turkey seçildi" + "Saat dilimi: …");
                    kullanıcı haritanın doğru yeri gösterip göstermediğini
                    ancak paneli kapatıp tuvale bakarak anlıyordu. Önizleme
                    tuvaldeki kartın TA KENDİSİ (`ProfileBlockCard`), aynı
                    imzalı kareleri okur — ayrı bir "panel içi harita" yazmak
                    iki ayrı doğruluk kaynağı üretirdi.
                    `inert`: kartın atıf bağlantıları panelin sekme sırasına
                    girmesin; bu bir önizleme, etkileşim yüzeyi değil. Atıf
                    METNİ görünür kalır (sağlayıcının şartı bunu istiyor);
                    tıklanabilir hâli tuvaldeki kartta ve yayındaki sayfada.
                    Konum adı ve yerel saat kartın üstünde zaten yazıyor. */}
                <div className="inspector-preview" inert>
                  <ProfileBlockCard block={block} signedImages={signedImages} />
                </div>
                {/* Saat dilimi ÇÖZÜLEMEDİYSE uyarı kalır: kartta saat hiç
                    görünmeyeceği için önizleme bunu tek başına anlatamaz. */}
                {block.data.timeZone ? null : (
                  <p className="inspector-hint">{app.editor.locationNoTimeZone}</p>
                )}
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
      case "ayet": {
        const data = block.data;
        const picked = Boolean(data.surahName && (data.arabic || data.meal));
        // Seçim yapılmadan önce arama alanı panelin işidir; yapıldıktan sonra
        // geri çekilir ve yerini "şu ayet seçili" kutusu alır. Kullanıcı
        // kutudaki düğmeyle onu geri açabilir.
        const searchOpen = !picked || ayetSearchOpen;
        return (
          <>
            {/* Sürüm ÖNCE gelir: kartın hem tipografisini hem taban ölçüsünü
                o belirliyor, yani "hangi ayet" sorusundan daha yapısal. */}
            <fieldset className="inspector-choices">
              <legend>{app.editor.ayetVariantLegend}</legend>
              {(
                [
                  ["arabic", app.editor.ayetVariantArabic],
                  ["meal", app.editor.ayetVariantMeal],
                  ["both", app.editor.ayetVariantBoth],
                ] as const
              ).map(([variant, label]) => (
                <button
                  key={variant}
                  type="button"
                  className={data.variant === variant ? "is-active" : ""}
                  aria-pressed={data.variant === variant}
                  onClick={() => setAyetVariant(variant)}
                >
                  {label}
                </button>
              ))}
              <small className="inspector-hint">{app.editor.ayetVariantHint}</small>
            </fieldset>

            {/* SEÇİLEN AYET KENDİ KUTUSUNDA. Önceki hâl tek satır bir ipucuydu
                ("Hûd 88 eklendi") ve arama alanının altında kayboluyordu:
                kullanıcı bir şey olduğunu fark etmiyordu. Kutu ne seçildiğini
                (sure + ayet), metnin önizlemesini ve iki açık yolu — değiştir,
                kaldır — bir arada gösterir. Görsel dil arama sonucu
                satırlarının (`.ayet-result`) aynısıdır, yeni bir dil değil. */}
            {picked ? (
              <section className="ayet-picked" aria-labelledby={ayetPickedLegendId}>
                <p className="ayet-picked-legend" id={ayetPickedLegendId}>
                  {app.editor.ayetPickedLegend}
                </p>
                <strong>{widget.ayet.reference(data.surahName, data.verse)}</strong>
                {data.variant !== "meal" && data.arabic ? (
                  <p className="ayet-picked-arabic" lang="ar" dir="rtl">
                    {data.arabic}
                  </p>
                ) : null}
                {/* Meal sürümden bağımsız gösterilir: "yalnız Arapça" kartında
                    bile kullanıcının doğru ayeti seçtiğini anlaması gerekir. */}
                {data.meal ? (
                  <p className="ayet-picked-meal" lang="tr">
                    {data.meal}
                  </p>
                ) : null}
                <div className="ayet-picked-actions">
                  {/* Durum düğmenin ETİKETİNDE taşınıyor ("Başka ayet seç" ↔
                      "Aramayı kapat"), `aria-expanded` ile değil: alanı saran
                      bir kutu yok, dolayısıyla `aria-controls` verecek bir id
                      de yok; hedefsiz bir `aria-expanded` yalnız gürültü. */}
                  <button
                    ref={ayetChangeButtonRef}
                    type="button"
                    className="inspector-secondary"
                    onClick={() =>
                      searchOpen ? setAyetSearchOpen(false) : openAyetSearch()
                    }
                  >
                    {searchOpen ? app.editor.ayetSearchClose : app.editor.ayetSearchOpen}
                  </button>
                  <button type="button" className="inspector-secondary" onClick={clearAyet}>
                    {app.editor.ayetClear}
                  </button>
                </div>
              </section>
            ) : null}

            {/* Durum, ekran okuyucuya tek yerden bildirilir. Bölge arama
                alanının DIŞINDA: seçim yapılınca alan kapanıyor ve bölge
                onunla birlikte kaybolsaydı "şu ayet seçildi" cümlesi hiç
                duyulmazdı. Görünür arayüzde bunun karşılığı seçim kutusu. */}
            <p className="sr-only" role="status" aria-live="polite">
              {ayetStatusMessage}
            </p>
            {/* Arama alanı ve öneri listesi birlikte gizlenir: `aria-controls`
                hedefi alanla aynı ömürde olmalı, yoksa kırık bir başvuru
                kalırdı. */}
            {searchOpen ? (
              <>
              <label>
                {app.editor.ayetSearchLabel}
                <input
                  ref={ayetInputRef}
                  type="search"
                  value={ayetQuery}
                  placeholder={app.editor.ayetSearchPlaceholder}
                  autoComplete="off"
                  // Combobox deseni: alan hem yazı alanı hem listenin sahibidir.
                  // Liste kapalıyken de `aria-controls` hedefi DOM'da durur
                  // (aşağıdaki <ul> her zaman basılır), yoksa kırık bir başvuru
                  // kalırdı.
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={ayetListOpen}
                  aria-controls={ayetListboxId}
                  aria-activedescendant={
                    ayetListOpen && ayetActive >= 0 ? `${ayetListboxId}-${ayetActive}` : undefined
                  }
                  onChange={(event) => {
                    setAyetQuery(event.target.value);
                    // Yazmak listeyi geri açar (Escape'ten sonra da) ve
                    // vurguyu sıfırlar: eski satır yeni sorguya ait değil.
                    setAyetOpen(true);
                    setAyetActive(-1);
                  }}
                  onKeyDown={onAyetKeyDown}
                  onBlur={() => {
                    setAyetOpen(false);
                    setAyetActive(-1);
                  }}
                />
                <small className="inspector-hint">{app.editor.ayetSearchHint}</small>
              </label>
              {ayetBusy ? <p className="inspector-hint">{app.editor.ayetSearching}</p> : null}
              {ayetError ? (
                <p className="inspector-error" role="alert">
                  {ayetError}
                </p>
              ) : null}
              {!ayetBusy && !ayetError && ayetEmpty ? (
                <p className="inspector-hint">{app.editor.ayetNoResults(ayetQuery.trim())}</p>
              ) : null}
              {/* Liste HER ZAMAN basılır (kapalıyken boş): `aria-controls`
                  hedefi kaybolmasın. Açılır kutu DEĞİL, akış içinde duran bir
                  liste — panel dar ve kaydırmalı, üstüne binen bir katman
                  kırpılma ve odak tuzağı sorunları getirirdi. */}
              <ul
                id={ayetListboxId}
                ref={ayetListRef}
                className="ayet-results"
                role="listbox"
                aria-label={app.editor.ayetSuggestionsLabel}
              >
                {ayetListOpen
                  ? ayetHits.map((hit, index) => (
                      <li
                        key={`${hit.surah}:${hit.verse}`}
                        id={`${ayetListboxId}-${index}`}
                        ref={index === ayetActive ? ayetActiveOptionRef : null}
                        role="option"
                        aria-selected={index === ayetActive}
                        className={`ayet-result${index === ayetActive ? " is-active" : ""}`}
                        // Fare basışı alanın odağını ALMAZ: odak alanda kalınca
                        // `aria-activedescendant` sözleşmesi bozulmuyor ve
                        // onBlur listeyi tıklama gerçekleşmeden kapatmıyor.
                        onMouseDown={(event) => event.preventDefault()}
                        onMouseEnter={() => setAyetActive(index)}
                        onClick={() => void pickAyet(hit.surah, hit.verse)}
                      >
                        <strong>{widget.ayet.reference(hit.surahName, hit.verse)}</strong>
                        <small lang="tr">{hit.snippet}</small>
                      </li>
                    ))
                  : null}
              </ul>
              </>
            ) : null}
            {data.mealTranslator ? (
              <p className="inspector-hint">{app.editor.ayetSourceNote(data.mealTranslator)}</p>
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
        <strong>{app.blockTypes[block.type]}</strong>
        <button type="button" aria-label={app.editor.closePanel} onClick={close}><Xmark width={18} height={18} /></button>
      </header>
      <div className="inspector-fields">
        {fields()}
      </div>
      <footer>
        {block.type !== "profile" ? <button type="button" onClick={remove}><Trash width={16} height={16} /> {app.editor.deleteAction}</button> : <span />}
        <button type="button" onClick={close}>{app.editor.applyAction}</button>
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
    resizeBlockDims(blockId, w, h);
  }

  /**
   * Boyutlandırmanın ölçü tabanlı hâli. `size` etiketi de yeniden türetilir:
   * o alan yalnız `pos`suz eski kayıtların akış sınıfı, ama bayat kalırsa
   * blok başka bir deploy'da yanlış genişlikte akardı.
   * Aynı iş, ama boyut SÖZLÜĞÜNDEN geçmeden. Ayet kartının "ikisi birlikte"
   * sürümü 3 satır ister ve sözlükte üç satırlık bir etiket yok (`BlockSize`
   * yüksekliği 1 ya da 2). `size` yine yazılır — pos'suz eski kayıtların akış
   * sınıfı odur — ama en yakın etikete yuvarlanır; gerçek yerleşimi `pos`
   * taşıdığı için görünürde kayıp yok.
   */
  function resizeBlockDims(blockId: string, w: number, h: number) {
    const size = sizeFromDims(w, h);
    setLayout((current) => ({
      ...current,
      blocks: withDerivedSmPositions(
        current.blocks.map((block) => {
          if (block.id !== blockId || block.type === "profile") return block;
          if (!block.pos) return { ...block, size } as ProfileBlock;
          const lgW = Math.min(w, GRID_COLUMNS.lg);
          // Mobil ölçü ELLE AYARLANMIŞSA (smManual) üstüne yazılmaz, yalnız
          // yeni tabana kadar büyütülür. Aksi hâlde kullanıcının mobilde
          // bilerek uzattığı kart, masaüstünde bir sürüm değiştirildiği için
          // sessizce kısalırdı. smManual olmayan bloklarda sm zaten aşağıda
          // `withDerivedSmPositions` ile lg'den yeniden türetiliyor.
          const smW = block.smManual
            ? Math.max(block.pos.sm.w, Math.min(w, GRID_COLUMNS.sm))
            : Math.min(w, GRID_COLUMNS.sm);
          const smH = block.smManual ? Math.max(block.pos.sm.h, h) : h;
          return {
            ...block,
            size,
            pos: {
              lg: { ...block.pos.lg, x: Math.min(block.pos.lg.x, GRID_COLUMNS.lg - lgW), w: lgW, h },
              sm: {
                ...block.pos.sm,
                x: Math.min(block.pos.sm.x, GRID_COLUMNS.sm - smW),
                w: smW,
                h: smH,
              },
            },
          } as ProfileBlock;
        }),
      ),
    }));
  }

  // R62: sayfa başına fotoğraf bloğu sınırı. Arayüz sınıra ULAŞMADAN
  // kapanmalı — kullanıcı bloğu ekleyip kaydederken hata almamalı.
  //
  // BU KAPI SUNUCUDAN DAHA SIKI ve bilerek öyle: sunucu yalnız çok
  // fotoğraflı blokları sayıyor (bkz. `galleryCountIssue` — üç görselli
  // canlı bir sayfayı kaydedilemez hâle getirmemek için), kural ise "sayfada
  // en fazla iki fotoğraf bloğu". Sınırın üstünde kalmış eski bir sayfada
  // düğme kapalı görünür ve gerekçesini yazar; kullanıcı bir blok kaldırıp
  // yenisini ekleyebilir. Kaydetmesi hiçbir zaman engellenmez.
  const galleryBlocked =
    photoBlockCount(layout) >= MAX_GALLERY_BLOCKS
      ? app.editor.galleryBlockLimit(MAX_GALLERY_BLOCKS)
      : null;
  // Sunucudaki kural ÇOK FOTOĞRAFLI blokları sayıyor (bkz. galleryCountIssue);
  // seçili blok tek fotoğraflıyken ikinciyi eklemek onu o kümeye sokar.
  // Kapı burada olmasa kullanıcı fotoğrafı yükler, sonra 400 alırdı.
  const multiPhotoBlocked =
    galleryBlockCount(layout) >= MAX_GALLERY_BLOCKS
      ? app.editor.photoLimitHint(MAX_GALLERY_BLOCKS)
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
      const dims = sizeToDims(block.size);
      // Boyut sözlüğü tip tabanını BİLMEZ: ayet kartının "ikisi birlikte"
      // sürümü 3 satır istiyor ama sözlükte üç satırlık etiket yok. Taban
      // burada uygulanmazsa blok sınırın altında doğar ve ilk otomatik kayıt
      // (`profileLayoutWriteSchema`) 400 döner — kullanıcı sayfasını
      // kaydedemez hâle gelirdi.
      const limits = blockGridLimits(block);
      // Ayet kartının başlangıç ölçüsü sözlükten DEĞİL sürümün varsayılanından
      // gelir: sınır artık 2×2'ye indi (kullanıcı küçültebilsin diye), o yüzden
      // sınırdan türetilseydi blok minik doğardı.
      const start = block.type === "ayet" ? AYET_GRID_DEFAULTS[block.data.variant] : dims;
      const w = Math.min(Math.max(start.w, limits?.minW ?? 1), limits?.maxW ?? GRID_COLUMNS.lg);
      const h = Math.min(Math.max(start.h, limits?.minH ?? 1), limits?.maxH ?? 4);
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

  // Dashboard kısayolları: /edit?add=link|social|text|status bloğu
  // hemen ekler (social galeriyi açar); /edit?panel=theme|gallery paneli açar.
  // Parametreler işlendikten sonra URL'den temizlenir.
  useEffect(() => {
    const addParam = searchParams.get("add");
    const panelParam = searchParams.get("panel");
    if (!addParam && !panelParam) return;
    if (addParam && isDeepLinkAddable(addParam)) {
      add(addParam);
    } else if (addParam === "image") {
      // Eski kısayol: `image` bloğu fotoğraf bloğunda eridi, kayıtlı bir
      // bağlantı sessizce hiçbir şey yapmasın.
      add("gallery");
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
      data: {
        platform: pick.platform,
        handle: "",
        url: "",
        label: config.label,
        ogImage: "",
        favicon: "",
        variant: "card",
      },
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
            <WarningTriangle width={15} height={15} aria-hidden /> {app.editor.actionRequired}
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
              <button type="button" onClick={() => window.location.reload()}>{app.editor.refresh}</button>
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
              {selectedId === profileBlock.id ? <span className="selected-label">{app.editor.generalInfo}</span> : null}
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
              <Plus width={20} height={20} /> {app.editor.addBlock}
            </button>
          </div>
        </div>
      </section>

      <nav className="editor-toolbar" aria-label={app.editor.toolbarLabel}>
        <button
          type="button"
          data-tooltip="Tema"
          aria-label={app.editor.themeAria}
          className={panel === "theme" ? "is-active" : ""}
          onClick={() => setPanel(panel === "theme" ? null : "theme")}
        >
          <Palette width={19} height={19} />
        </button>
        <span className="toolbar-sep" aria-hidden />
        <button type="button" data-tooltip={app.editor.addLink} aria-label={app.editor.addLink} onClick={() => add("link")}>
          <LinkIcon width={19} height={19} />
        </button>
        <button type="button" data-tooltip="Metin ekle" aria-label={app.editor.addText} onClick={() => add("text")}>
          <Text width={19} height={19} />
        </button>
        <button type="button" data-tooltip="Duyuru ekle" aria-label={app.editor.addStatus} onClick={() => add("status")}>
          <Megaphone width={18} height={18} />
        </button>
        {/* TEK fotoğraf düğmesi: `image` ve `gallery` birleşti. Kullanıcı
            kaç fotoğraf koyacağını blok tipi seçerek değil, bloğa fotoğraf
            ekleyerek söylüyor. */}
        <button
          type="button"
          data-tooltip={galleryBlocked ?? app.editor.addPhoto}
          aria-label={galleryBlocked ?? app.editor.addPhoto}
          disabled={Boolean(galleryBlocked)}
          className={galleryBlocked ? "cursor-not-allowed opacity-40" : ""}
          onClick={() => add("gallery")}
        >
          <MediaImage width={19} height={19} />
        </button>
        {/* Konum, YouTube'un yerini aldı: çubuk en sık eklenen altı bloğu
            taşıyor ve YouTube bloğu artık kullanıcı isteğiyle listelerden
            çıkarıldı (bkz. `CONTENT_CATALOG`, gallery.tsx). */}
        <button
          type="button"
          data-tooltip={app.editor.addLocation}
          aria-label={app.editor.addLocation}
          onClick={() => add("location")}
        >
          <MapPin width={19} height={19} />
        </button>
        <button
          type="button"
          data-tooltip="Blok galerisi"
          aria-label={app.editor.blockPickerAria}
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
          setDims={(w, h) => resizeBlockDims(selected.id, w, h)}
          onSignedImage={(path) => rememberSignedImage(selected.id, path)}
          multiPhotoBlocked={multiPhotoBlocked}
          rememberImage={rememberSignedImage}
          signedImages={signedImages}
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
