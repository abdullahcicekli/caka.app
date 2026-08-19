import type { CSSProperties } from "react";

import { Download, Eye } from "iconoir-react";

import {
  classifyYouTubeUrl,
  faviconImageKey,
  shortenFileName,
  mapFrameImageKey,
  type ProfileBlock,
  type ProfileLayout,
  type ProfileTheme,
} from "@caka/shared";

import { SocialIcon } from "~/components/icons/social";
import { LocationCard } from "~/components/location-card";
import { SpotifyCard, YoutubePlayMark, YoutubeVideoCard } from "~/components/media-embed";
import { RichTextView } from "~/components/rich-text";
import {
  githubDayTitle,
  githubFootHint,
  githubTotalLine,
} from "~/content/github";
import { widgetCatalog } from "~/content/widget";
import { useCatalog } from "~/lib/locale";
import { githubLoginKey, type GithubCalendar, type GithubCalendarMap } from "~/lib/github-calendar";
import { linkBrand, prettyLinkTarget } from "~/lib/link-preview";
import type { YoutubeFeedCard, YoutubeFeedMap } from "~/lib/youtube-feed";
import { PhotoBlockCard } from "./photo-block";
import { ProfileAvatar } from "./profile-avatar";
import { useOnboardingLists } from "~/lib/onboarding";
import { appCatalog } from "~/content/app";

function GithubHeatmap({ calendar }: { calendar: GithubCalendar }) {
  const w = useCatalog(widgetCatalog);
  return (
    <>
      {/* role="img": grid SR'a tek etiketle okunur, tek tek kareler gürültü
          yapmaz. 52+ haftanın tamamı DOM'a basılır; kart genişliğine göre
          fazlası container query ile gizlenir (JS ölçümü/hydration derdi yok). */}
      <span className="gh-heatmap" role="img" aria-label={w.github.heatmapLabel(calendar.total)}>
        {calendar.weeks.map((week, index) => (
          <span className="gh-week" key={index}>
            {week.days.map((day, dayIndex) => (
              // key sıradan gelir: bozuk payload'da date boş/tekrarlı
              // olabilir; hafta 7 günlük sabit dizidir, sıra kararlıdır.
              <i
                key={dayIndex}
                className="gh-day"
                data-level={day.level}
                title={githubDayTitle(day.count, day.date)}
              />
            ))}
          </span>
        ))}
      </span>
      {/* Kartın tamamı zaten bir <a> (mobil UX: her yeri tıklanabilir); içine
          ikinci bir <a> koymak geçersiz HTML olur. İpucu bu yüzden bağlantı
          değil, aynı hizada duran soluk bir metindir. */}
      <span className="gh-foot" aria-hidden>
        <span>{githubTotalLine(calendar.total)}</span>
        <span className="gh-foot-hint">{githubFootHint}</span>
      </span>
    </>
  );
}

export function ProfileBlockCard({
  block,
  githubCalendars,
  signedImages,
  youtubeFeeds,
  allowEmbeds = false,
  eagerImages = false,
}: {
  block: ProfileBlock;
  githubCalendars?: GithubCalendarMap;
  /** blok kimliği → imzalı proxy yolu (loader doldurur; bkz.
      `server/layout-images.ts`). Proxy imzalı olduğu için adres render
      sırasında saf fonksiyonla türetilemez. */
  signedImages?: Readonly<Record<string, string>>;
  /** blok kimliği → kanalın en son videosu (loader doldurur; editörde boş
      kalır ve kart kayıt anında saklanan bilgiye düşer). */
  youtubeFeeds?: YoutubeFeedMap;
  /**
   * Medya kartları YERİNDE oynatılabilir mi? Yalnız public profil (`/:username`)
   * true geçer. Editör tuvalinde oynatma sürükleme/yeniden boyutlandırmayla
   * çakışır, panel önizlemesinde de gereksiz — oralarda facade görünür ama
   * tıklama oynatmaz.
   */
  allowEmbeds?: boolean;
  /**
   * Kart GÖRSELLERİ hemen mi insin? Varsayılan tembel ve profil sayfasında
   * doğrusu o. Yalnız landing şeridi true geçer: orada kartlar CSS
   * `transform` ile kaydırılıyor ve tarayıcı tembel görselleri dönüşümle
   * görünür alana giren öğeler için YENİDEN DEĞERLENDİRMİYOR — kart kayıp
   * gelse de boş kalıyordu (ölçüldü: görünür alandaki üç kart hiç yüklenmedi,
   * `loading` eager yapılınca anında indi).
   */
  eagerImages?: boolean;
}) {
  const imgLoading = eagerImages ? "eager" : "lazy";
  const onboarding = useOnboardingLists();
  const w = useCatalog(widgetCatalog);
  // Bloğun uzak görselinin birinci taraf adresi. Eşlemede yoksa (imza sırrı
  // tanımsız veya blokta görsel yok) kart görselsiz tasarımına düşer.
  const signedImage = signedImages?.[block.id] ?? "";
  // Sitenin favicon'u — baş harf çipinin/globe ikonunun ÜSTÜNE biner.
  // Yüklenemezse (adres türetilmiş `/favicon.ico` olabilir) alttaki işaret
  // görünmeye devam eder; `alt=""` olduğu için kırık görsel çıkmaz.
  const signedFavicon = signedImages?.[faviconImageKey(block.id)] ?? "";
  // switch + never: yeni bir blok tipi eklendiğinde bu dosya derleme hatası
  // verir. Eskiden `if` zinciriydi ve tanınmayan tip sessizce `status`
  // dalına düşüp `block.data.text` üzerinde çalışma anında patlıyordu.
  switch (block.type) {
    case "profile": {
      // Avatar önce KAYITLI asset'ten gelir (`/i/<uuid>`), yoksa eşlemeden.
      // Eşleme dalı üründe hiç çalışmaz — `server/layout-images.ts` profil
      // bloğu için "" döndürüyor, yani `signedImages` bu kimliği taşımıyor.
      // Dal, görselini doğrudan veren çağıranlar için var (landing şeridi):
      // orada avatar boş kalsaydı kart baş harf çipine düşerdi ("KA") ve
      // ziyaretçi ürünü yer tutucularla tanırdı.
      const avatarUrl = block.data.avatarAssetId
        ? `/i/${block.data.avatarAssetId}`
        : signedImage || null;
      return (
        <article className="profile-block profile-block-profile">
          <ProfileAvatar name={block.data.name} avatarUrl={avatarUrl} className="size-16" />
          <strong>{block.data.name}</strong>
          <p>{block.data.title}</p>
        </article>
      );
    }

    case "social": {
    // YAPIŞTIRILAN ADRES BLOĞUN TİPİNDEN DAHA GÜÇLÜDÜR. Sosyal kart bir
    // PROFİL kartıdır; oraya bir video adresi (youtube.com/watch?v=…)
    // yapıştırıldığında kart "YouTube / watch" diye anlamsız bir kimlik
    // satırına dönüşüyor ve tıklayınca ziyaretçiyi siteden çıkarıyordu —
    // oysa aynı adres YouTube bloğuna girseydi kartın içinde oynayacaktı.
    // Kimlik adresten türetiliyor, kayıtlı veri değişmiyor (aynı desen:
    // `server/layout-images.ts` küçük görseli de adresten türetiyor).
    const videoRef =
      block.data.platform === "youtube" ? classifyYouTubeUrl(block.data.url) : null;
    if (videoRef?.kind === "video") {
      return (
        <YoutubeVideoCard
          data={{
            kind: "video",
            url: block.data.url,
            videoId: videoRef.videoId,
            // Başlık ve kanal adı ağ çağrısı ister; sosyal blokta ikisi de
            // yok (label "YouTube", handle "watch"). Kart yedek başlığa
            // düşer — uydurmaktansa boş bırakmak doğru.
            title: "",
            channelName: "",
            shorts: videoRef.shorts,
            // Türetilen küçük görsel `mqdefault`, yani 16:9. Shorts'un
            // dikey karesi ancak kayıt anında doğrulanabiliyor.
            verticalThumbnail: false,
            thumbnail: "",
          }}
          thumbnail={signedImage}
          allowEmbeds={allowEmbeds}
          eagerImages={eagerImages}
        />
      );
    }
    const platform = onboarding.byId(block.data.platform);
    // GitHub kartında görsel odak katkı grafiğidir. Veri yoksa (token yok /
    // hata / bilinmeyen kullanıcı) kart eski davranışına döner.
    const calendar =
      block.data.platform === "github" && block.data.handle
        ? githubCalendars?.[githubLoginKey(block.data.handle)]
        : undefined;
    // og görseli her boyutta saklanır; yalnız 1x1'den büyük kartlarda gösterilir.
    // Katkı grafiği varken de DOM'a basılır ama CSS'te gizlidir: grafiğin hiç
    // sığmadığı en kısa kartta (dashboard önizlemesi) kart çıplak bir etikete
    // düşmesin diye o bantta og'a geri çekilir. display:none + loading={imgLoading}
    // olduğundan grafik görünürken tarayıcı görseli indirmez.
    // Uzak host'a doğrudan gidilmez: görsel birinci taraf proxy'sinden
    // servis edilir (ziyaretçi IP/UA sızıntısı ve üçüncü taraf çerezi).
    // Adres loader'da imzalanır; imza sırra ve HMAC'e bağlı olduğu için
    // burada türetilemez.
    const ogImage = block.size !== "1x1" ? signedImage : "";
    // BAŞLIK İSTEĞE BAĞLI. `label` yeni bloklarda platformun kendi adıyla
    // doğuyor ("Web sitesi", "Instagram") — kartın üstünde hiçbir şey
    // söylemeyen bir satırdı ve ikonun zaten anlattığını tekrar ediyordu.
    // Varsayılana eşitse basılmaz; kullanıcı kendi başlığını yazarsa görünür.
    // (Eşitlik testi geriye dönük de çalışır: mevcut blokların hepsinde
    // varsayılan yazılı, veri taşımaya gerek yok.)
    const customLabel = block.data.label.trim() === platform.label ? "" : block.data.label.trim();
    // Favicon yalnız "web sitesi" kartında: marka platformlarında kendi
    // ikonları favicon'dan daha okunur ve tek renk oldukları için kart
    // tonuyla uyumlu.
    const showFavicon = platform.id === "website" && signedFavicon !== "";
    const head = (
      <>
        <span className={`platform-mark ${platform.tone}`}>
          <SocialIcon platform={platform.id} width={18} height={18} strokeWidth={2.2} />
          {showFavicon ? (
            <img className="mark-favicon" src={signedFavicon} alt="" loading={imgLoading} draggable={false} />
          ) : null}
        </span>
        <span>
          {customLabel ? <strong>{customLabel}</strong> : null}
          <small>{block.data.handle}</small>
        </span>
      </>
    );
    const content = calendar ? (
      <>
        <span className="social-head">{head}</span>
        <GithubHeatmap calendar={calendar} />
        {ogImage ? (
          <img className="social-og" src={ogImage} alt="" loading={imgLoading} draggable={false} />
        ) : null}
      </>
    ) : ogImage ? (
      <>
        <span className="social-head">{head}</span>
        <img className="social-og" src={ogImage} alt="" loading={imgLoading} draggable={false} />
      </>
    ) : (
      head
    );
    // has-og ve has-gh birlikte verilmez: grafik varken düzeni has-gh kurar,
    // og yalnız onun içindeki dar bantta açılan bir yedektir.
    const className = `profile-block profile-block-social${ogImage && !calendar ? " has-og" : ""}${calendar ? " has-gh" : ""}`;
    if (block.data.url) {
      return (
        <a className={className} href={block.data.url} target="_blank" rel="noreferrer">
          {content}
        </a>
      );
    }
    // E-posta platformu http(s) URL üretmez (KTD8); adres biçimi doğrulanmışsa
    // mailto: bağlantısı bizim ürettiğimiz sabit şemadır, kullanıcı metni değil.
    if (block.data.platform === "email" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(block.data.handle)) {
      return (
        <a className={className} href={`mailto:${encodeURIComponent(block.data.handle)}`}>
          {content}
        </a>
      );
    }
    return <article className={className}>{content}</article>;
    }

    // R60/R61. Önizleme görseli varsa kart onun etrafında kurulur; YOKSA
    // (ölçüm: hedeflerin çoğunluğu) kart "bozuk" değil "sade" görünmeli.
    // Görsel çapa marka renginde bir çip + alan adının baş harfidir; favicon
    // için uzak istek atılmaz (bkz. `lib/link-preview.ts`).
    case "link": {
      const target = prettyLinkTarget(block.data.url);
      const brand = linkBrand(block.data.url);
      const preview = signedImage;
      return (
        <a
          className={`profile-block profile-block-link${preview ? " has-og" : ""}`}
          href={block.data.url || undefined}
          target="_blank"
          rel="noreferrer"
        >
          {preview ? (
            <img className="link-og" src={preview} alt="" loading={imgLoading} draggable={false} />
          ) : null}
          <span className="link-body">
            <span className={`platform-mark link-mark ${brand.tone}`} aria-hidden>
              {brand.initial}
              {/* Favicon varsa harfin üstünü kapatır; yüklenemezse harf kalır
                  (bkz. `.mark-favicon`, app.css). Uzak host'a gidilmez —
                  adres imzalı birinci taraf proxy'sinden geçer (R58). */}
              {signedFavicon ? (
                <img className="mark-favicon" src={signedFavicon} alt="" loading={imgLoading} draggable={false} />
              ) : null}
            </span>
            <span className="link-lines">
              {/* BAŞLIK İSTEĞE BAĞLI: yoksa alan adı satırı tek başına yeter.
                  Eskiden başlık boşken alan adı `strong`a da yazılıyordu,
                  yani aynı metin kartta iki kez görünüyordu. */}
              {block.data.title ? <strong>{block.data.title}</strong> : null}
              <small>{target}</small>
            </span>
          </span>
          {/* Ok yalnız görselsiz kartta: görselli kartta önizlemenin kendisi
              zaten "burada bir şey var" diyor, ok gürültü olurdu. */}
          <span className="link-go" aria-hidden>
            ↗
          </span>
        </a>
      );
    }

    case "text":
      return (
      <article className="profile-block profile-block-text">
        {block.data.doc ? <RichTextView doc={block.data.doc} /> : block.data.text}
      </article>
    );

    case "status": {
    const statusContent = block.data.doc ? <RichTextView doc={block.data.doc} /> : block.data.text;
    return block.data.url ? (
    <a className="profile-block profile-block-status" href={block.data.url} target="_blank" rel="noreferrer">
      {statusContent}
    </a>
  ) : (
    <article className="profile-block profile-block-status">{statusContent}</article>
  );
    }

    // U32 / KTD37-KTD39. FOTOĞRAF (eski `image` + `gallery`). Kart durum
    // tutuyor (slider sırası, ışık kutusu) ve hook'lar bir `switch` dalının
    // içinde yaşayamaz; bu yüzden ayrı bileşen.
    case "gallery":
      return (
        <PhotoBlockCard
          title={block.data.title}
          photos={block.data.photos}
          layout={block.data.layout}
          url={block.data.url}
          interactive={allowEmbeds}
        />
      );

    // U33/U34. Video ve kanal AYNI kartın iki varyantı gibi görünmemeli:
    //  • Video → 16:9 (Short ise 9:16) kapak kartı domine eder, ortasında
    //    kırmızı oynatma çipi; altında başlık + kanal adı.
    //  • Kanal → yuvarlak avatar + "Kanal" rozetiyle bir kimlik satırı,
    //    altında RSS'ten gelen SON VİDEO şeridi (KTD36 — ürünün en ucuz
    //    canlılığı; statik logo-ve-handle kartı bilinçli olarak yapılmadı).
    case "youtube": {
      const data = block.data;
      // Küçük görsel uzak host'tan gelir; ziyaretçi tarayıcısı YouTube'a
      // doğrudan istek atmasın diye birinci taraf proxy'sinden geçer (R58).
      const thumbnail = signedImage;

      // Video kartı kendi oynatma durumunu tutuyor (facade → iframe), bu
      // yüzden ayrı bir bileşen: hook'lar bir `switch` dalının içinde
      // yaşayamaz (blok tipi değişince çağrı sırası bozulurdu).
      if (data.kind === "video") {
        return (
          <YoutubeVideoCard
            data={data}
            thumbnail={thumbnail}
            allowEmbeds={allowEmbeds}
            eagerImages={eagerImages}
          />
        );
      }

      const latest: YoutubeFeedCard | undefined = youtubeFeeds?.[block.id];
      const handle = data.handle ? `@${data.handle}` : "";
      const channelName = data.channelName || latest?.channelName || w.youtube.channelFallbackTitle;
      const channelMeta = handle;
      const content = (
        <>
          <span className="yt-channel-head">
            {thumbnail ? (
              <img className="yt-avatar" src={thumbnail} alt="" loading={imgLoading} draggable={false} />
            ) : (
              // Avatar çözülemediyse baş harf çipi; kart yarım görünmez.
              <span className="yt-avatar yt-avatar-empty" aria-hidden>
                {(data.handle || channelName).slice(0, 1).toLocaleUpperCase("tr")}
              </span>
            )}
            <span className="youtube-meta">
              <strong>{channelName}</strong>
              <small>{channelMeta}</small>
            </span>
            <span className="yt-kind-pill">{w.youtube.channelBadge}</span>
          </span>
          {latest ? (
            // Kartın tamamı zaten bir <a>; iç içe bağlantı geçersiz HTML
            // olurdu. Son video bu yüzden bağlantı değil, bilgi şerididir.
            <span className={`yt-latest${latest.short ? " is-shorts" : ""}`}>
              <span className="yt-latest-media">
                {latest.thumbnail ? (
                  <img src={latest.thumbnail} alt="" loading={imgLoading} draggable={false} />
                ) : (
                  <span className="yt-thumb-empty" aria-hidden />
                )}
                <YoutubePlayMark small />
              </span>
              <span className="yt-latest-lines">
                <small className="yt-latest-kicker">{w.youtube.latestVideoTitle}</small>
                <strong>{latest.title}</strong>
                <small>{[latest.published, latest.views].filter(Boolean).join(" · ")}</small>
              </span>
            </span>
          ) : null}
        </>
      );
      const className = `profile-block profile-block-youtube is-channel${latest ? " has-latest" : ""}`;
      return data.url ? (
        <a className={className} href={data.url} target="_blank" rel="noreferrer">
          {content}
        </a>
      ) : (
        <article className={className}>{content}</article>
      );
    }

    /**
     * Kur'an ayeti. Kartın TAMAMI kayıtlı veriden render edilir: Arapça metin,
     * meal, sure adı ve çevirmen adı bloğun içinde durur, hiçbir dış istek
     * atılmaz (R58). Ayeti çözen tek yer editördür (`server/quran.ts`).
     *
     * Üç sürüm aynı iskeleti paylaşır; ayıran şey hangi metnin basıldığı ve
     * kartın tipografisi (bkz. `.profile-block-ayet`, app.css). Ölçü tabanı
     * da sürüme bağlıdır (`AYET_GRID_LIMITS`).
     */
    case "ayet": {
      const { variant, arabic, meal, surahName, verse, mealTranslator } = block.data;
      const showArabic = variant !== "meal" && arabic !== "";
      const showMeal = variant !== "arabic" && meal !== "";
      // Taslak kart (henüz ayet seçilmemiş): "bozuk" değil "boş" görünür,
      // görsel bloğundaki yer tutucuyla aynı desen.
      if (!showArabic && !showMeal) {
        return (
          <article
            className={`profile-block profile-block-ayet is-${variant}`}
            aria-label={w.ayet.name}
          >
            <span className="profile-image-placeholder">{w.ayet.empty}</span>
          </article>
        );
      }
      return (
        <article
          className={`profile-block profile-block-ayet is-${variant}`}
          aria-label={w.ayet.label(surahName, verse)}
        >
          {/* Gövde KAYDIRILIR, kısaltılmaz: kutsal metnin ortasından "…" ile
              kesmek anlamı değiştiren bir müdahale olurdu. Sığmayan uzun
              ayette kart kırılmaz, içeriği kayar (bkz. `.ayet-body`). */}
          <div className="ayet-body">
            {showArabic ? (
              // dir/lang Arapça metnin İKİ İŞİNİ birden yapar: sağdan sola
              // akış ve tarayıcının Arapça yazı tipi seçimi. Karışık içerikte
              // (meal + Arapça) yalnız gövdeye vermek yetmez, bu yüzden
              // öznitelikler paragrafın kendisindedir.
              <p className="ayet-arabic" lang="ar" dir="rtl">
                {arabic}
              </p>
            ) : null}
            {/* Meal HER ARAYÜZ DİLİNDE Türkçedir; `lang="tr"` ekran
                okuyucunun doğru sesletimi seçmesi için şart. */}
            {showMeal ? (
              <p className="ayet-meal" lang="tr">
                {meal}
              </p>
            ) : null}
          </div>
          <footer className="ayet-source">
            <span>{w.ayet.reference(surahName, verse)}</span>
            {/* Atıf: meal gösteriliyorsa çevirmen adı kartta görünür. */}
            {showMeal && mealTranslator ? <small>{w.ayet.mealCredit(mealTranslator)}</small> : null}
          </footer>
        </article>
      );
    }

    // Spotify: YouTube videosuyla aynı facade → iframe deseni. Kart, çalacak
    // şeyi kapak + tür rozeti + başlıkla anlatır; oynatıcı ancak tıklamayla
    // doğar (bkz. `components/media-embed.tsx`).
    case "spotify":
      return (
        <SpotifyCard
          data={block.data}
          thumbnail={signedImage}
          allowEmbeds={allowEmbeds}
          eagerImages={eagerImages}
        />
      );

    /**
     * Belge (CV) kartı. Kart bir NESNE gösterir: solda A4 oranlı bir sayfa
     * kapağı (kıvrık köşe + PDF etiketi + satır izleri), sağda dosya adı,
     * "PDF · 1,2 MB · 12 Ağustos 2026" satırı ve iki eylem.
     *
     * KAPAK PDF'İN İLK SAYFASI DEĞİL, TİPOGRAFİK BİR SAYFADIR. Gerçek ilk
     * sayfayı basmak Worker'da PDF ayrıştırıp raster'lamayı gerektiriyor;
     * depodaki tek raster katmanı `server/og-render.ts` ve o satori + resvg,
     * yani SVG çizer — PDF motoru değil. PDFium/pdf.js sınıfı bir WASM motoru
     * ne bundle boyutuna ne de yükleme isteğinin CPU bütçesine sığar. Uydurma
     * bir küçük görsel basmaktansa kapak dürüstçe tipografik.
     *
     * Kartın tamamı tek bir <a> DEĞİL: iki farklı eylem var (indir / yeni
     * sekmede önizle) ve iç içe bağlantı geçersiz HTML olurdu. İndirme ayrıca
     * kazara dokunuşla tetiklenmemeli — bilinçli bir eylem.
     */
    case "document": {
      const data = block.data;
      const displayName = data.fileName || w.document.fallbackName;
      const title = data.title || displayName;
      // Meta satırı: olmayan parça hiç basılmaz. Taslak blokta boyut ve tarih
      // sıfırdır ve "PDF · 0 B" yazmak, henüz dosya yokken dosya varmış gibi
      // görünürdü — rozet tek başına kalır.
      const meta = [
        w.document.badge,
        data.bytes > 0 ? w.document.size(data.bytes) : "",
        w.document.date(data.uploadedAt),
      ]
        .filter(Boolean)
        .join(" · ");
      return (
        <article className={`profile-block profile-block-document${data.assetId ? "" : " is-empty"}`}>
          <span className="doc-cover" aria-hidden>
            <span className="doc-sheet">
              <span className="doc-fold" />
              {/* Satır izleri: sayfada yazı olduğunu söyleyen çubuklar. Yedi
                  tane basılır, KAÇININ görüneceğine CSS karar verir — 124px'lik
                  kapakta yedi satır lapa olur, 292px'lik kapakta dört satır
                  sayfayı boş bırakır (bkz. app.css `.doc-rules`). */}
              <span className="doc-rules">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
              <span className="doc-badge">{w.document.badge}</span>
            </span>
          </span>
          <span className="doc-lines">
            <strong>{title}</strong>
            {/* Dosya adı başlığın kendisi değilse ayrıca yazılır: kullanıcı
                "Özgeçmiş" başlığı verdiyse ziyaretçi neyin ineceğini de
                görmeli. Ad ortadan kısaltılır, uzantı korunur. */}
            {data.fileName && data.title ? (
              <small className="doc-file">{shortenFileName(data.fileName, 32)}</small>
            ) : null}
            <small className="doc-meta">{meta}</small>
          </span>
          {data.assetId ? (
            <span className="doc-actions">
              <a
                className="doc-action is-primary"
                href={`/b/${data.assetId}`}
                aria-label={w.document.downloadLabel(displayName)}
              >
                <Download width={16} height={16} aria-hidden />
                {w.document.download}
              </a>
              {/* Önizleme YENİ SEKMEDE açılır ve sunucu orada satır içi servis
                  eder (`?onizleme=1`). Karta gömülü bir PDF sayfanın üstünü
                  kaplayıp sayfaya bürünebilirdi. */}
              <a
                className="doc-action"
                href={`/b/${data.assetId}?onizleme=1`}
                target="_blank"
                rel="noreferrer"
                // Ölçümden MUAF: paneldeki sayaç "kaç kişi indirdi" demek
                // zorunda; önizleme de sayılsaydı sayı iki farklı olayın
                // toplamı olur ama indirme diye okunurdu.
                data-measure="skip"
                aria-label={w.document.previewLabel(displayName)}
              >
                <Eye width={16} height={16} aria-hidden />
                {w.document.preview}
              </a>
            </span>
          ) : (
            <span className="doc-actions">
              <span className="doc-action is-empty">{w.document.empty}</span>
            </span>
          )}
        </article>
      );
    }
    // Konum: koyu harita + yerel saat pili. Harita kareleri sağlayıcının
    // adresleri (bkz. `server/map-frame.ts` — proxy'lemek şartlarca yasak);
    // eşlemeden gelmelerinin nedeni jetonun yalnız sunucuda bulunması.
    // Kart kendi saat/yakınlaşma durumunu tuttuğu için ayrı
    // bileşen — hook'lar bir `switch` dalının içinde yaşayamaz.
    case "location":
      return (
        <LocationCard
          data={block.data}
          frames={
            block.data.lat === null || block.data.lon === null
              ? { far: "", near: "" }
              : {
                  far:
                    signedImages?.[
                      mapFrameImageKey("far", block.data.lat, block.data.lon)
                    ] ?? "",
                  near:
                    signedImages?.[
                      mapFrameImageKey("near", block.data.lat, block.data.lon)
                    ] ?? "",
                }
          }
          eagerImages={eagerImages}
        />
      );

    default: {
      // Tanınmayan tip: derleyici burada hata verir. Çalışma anında (eski
      // deploy + yeni blok) sessizce boş kalır, sayfayı düşürmez.
      const exhaustive: never = block;
      void exhaustive;
      return null;
    }
  }
}

export function ProfileCanvas({
  layout,
  theme,
  compact = false,
  githubCalendars,
  signedImages,
  youtubeFeeds,
  allowEmbeds = false,
}: {
  layout: ProfileLayout;
  theme: ProfileTheme;
  compact?: boolean;
  /** login → GitHub katkı takvimi (loader doldurur; yoksa özellik kapalı) */
  githubCalendars?: GithubCalendarMap;
  /** blok kimliği → imzalı proxy yolu (loader doldurur) */
  signedImages?: Readonly<Record<string, string>>;
  /** blok kimliği → kanalın en son videosu (loader doldurur) */
  youtubeFeeds?: YoutubeFeedMap;
  /** Medya kartları yerinde oynatılabilsin mi? Yalnız public profil true geçer. */
  allowEmbeds?: boolean;
}) {
  const app = useCatalog(appCatalog);
  const profileBlock = layout.blocks.find((block) => block.type === "profile");
  const bentoBlocks = layout.blocks.filter((block) => block.type !== "profile");

  return (
    <div className={`profile-canvas ${compact ? "is-compact" : ""}`} data-profile-theme={theme}>
      <div className="profile-standard-layout">
        <aside className="profile-identity" aria-label={app.profile.profileInfoAria}>
          {profileBlock ? <ProfileBlockCard block={profileBlock} /> : null}
        </aside>
        <section className="profile-grid" aria-label={app.profile.blocksLabel}>
          {bentoBlocks.map((block) => {
            const pos = block.pos;
            // pos varsa editörle birebir aynı hücrelere yerleştir (KTD13);
            // pos'suz eski kayıtlar size-* sınıflarıyla akışta kalır.
            const style = pos
              ? ({
                  "--lg-col": `${pos.lg.x + 1} / span ${pos.lg.w}`,
                  "--lg-row": `${pos.lg.y + 1} / span ${pos.lg.h}`,
                  "--sm-col": `${pos.sm.x + 1} / span ${pos.sm.w}`,
                  "--sm-row": `${pos.sm.y + 1} / span ${pos.sm.h}`,
                } as CSSProperties)
              : undefined;
            return (
              <div
                key={block.id}
                // Tıklama ölçümünün kimliği (R48): sayaç blok id'sine yazılır,
                // adrese değil. Öznitelik yalnızca bir kanca — sayım kararını
                // public sayfadaki LinkClickBeacon verir, panel önizlemesinde
                // dinleyici hiç kurulmaz.
                data-block-id={block.id}
                className={`profile-grid-item size-${block.size} ${pos ? "has-pos" : ""}`}
                style={style}
              >
                <ProfileBlockCard
                  block={block}
                  githubCalendars={githubCalendars}
                  signedImages={signedImages}
                  youtubeFeeds={youtubeFeeds}
                  allowEmbeds={allowEmbeds}
                />
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
