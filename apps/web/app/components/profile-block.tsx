import type { CSSProperties } from "react";

import type { ProfileBlock, ProfileLayout, ProfileTheme } from "@caka/shared";

import { SocialIcon } from "~/components/icons/social";
import { SpotifyCard, YoutubePlayMark, YoutubeVideoCard } from "~/components/media-embed";
import { RichTextView } from "~/components/rich-text";
import {
  githubDayTitle,
  githubFootHint,
  githubHeatmapAriaLabel,
  githubTotalLine,
} from "~/content/github";
import { platformById } from "~/content/onboarding";
import {
  galeriBosMetni,
  galeriDahaFazla,
  galeriDahaFazlaEtiketi,
  galeriEtiketi,
  youtubeKanalRozeti,
  youtubeKanalYedekBasligi,
  youtubeSonVideoBasligi,
} from "~/content/widget";
import { githubLoginKey, type GithubCalendar, type GithubCalendarMap } from "~/lib/github-calendar";
import { linkBrand, linkHostLabel, prettyLinkTarget } from "~/lib/link-preview";
import type { YoutubeFeedCard, YoutubeFeedMap } from "~/lib/youtube-feed";
import { ProfileAvatar } from "./profile-avatar";

function GithubHeatmap({ calendar }: { calendar: GithubCalendar }) {
  return (
    <>
      {/* role="img": grid SR'a tek etiketle okunur, tek tek kareler gürültü
          yapmaz. 52+ haftanın tamamı DOM'a basılır; kart genişliğine göre
          fazlası container query ile gizlenir (JS ölçümü/hydration derdi yok). */}
      <span className="gh-heatmap" role="img" aria-label={githubHeatmapAriaLabel(calendar.total)}>
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

/**
 * Galeri `+N` pilinin olası kapasiteleri. Bir bandın kapasitesi (o ölçüde kaç
 * fotoğraf görünür) yalnız CSS'te bilinir; bileşen her kapasite için bir pil
 * basar, CSS bandına uyanı gösterir. Beş fotoğraf tavanında (R62) 5'lik slota
 * hiç gerek olmaz — o bantta gizlenen fotoğraf kalmaz.
 */
const GALLERY_BADGE_SLOTS = [1, 2, 3, 4] as const;

export function ProfileBlockCard({
  block,
  githubCalendars,
  signedImages,
  youtubeFeeds,
  allowEmbeds = false,
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
}) {
  // Bloğun uzak görselinin birinci taraf adresi. Eşlemede yoksa (imza sırrı
  // tanımsız veya blokta görsel yok) kart görselsiz tasarımına düşer.
  const signedImage = signedImages?.[block.id] ?? "";
  // switch + never: yeni bir blok tipi eklendiğinde bu dosya derleme hatası
  // verir. Eskiden `if` zinciriydi ve tanınmayan tip sessizce `status`
  // dalına düşüp `block.data.text` üzerinde çalışma anında patlıyordu.
  switch (block.type) {
    case "profile":
      return (
      <article className="profile-block profile-block-profile">
        <ProfileAvatar
          name={block.data.name}
          avatarUrl={block.data.avatarAssetId ? `/i/${block.data.avatarAssetId}` : null}
          className="size-16"
        />
        <strong>{block.data.name}</strong>
        <p>{block.data.title}</p>
      </article>
    );

    case "social": {
    const platform = platformById(block.data.platform);
    // GitHub kartında görsel odak katkı grafiğidir. Veri yoksa (token yok /
    // hata / bilinmeyen kullanıcı) kart eski davranışına döner.
    const calendar =
      block.data.platform === "github" && block.data.handle
        ? githubCalendars?.[githubLoginKey(block.data.handle)]
        : undefined;
    // og görseli her boyutta saklanır; yalnız 1x1'den büyük kartlarda gösterilir.
    // Katkı grafiği varken de DOM'a basılır ama CSS'te gizlidir: grafiğin hiç
    // sığmadığı en kısa kartta (dashboard önizlemesi) kart çıplak bir etikete
    // düşmesin diye o bantta og'a geri çekilir. display:none + loading="lazy"
    // olduğundan grafik görünürken tarayıcı görseli indirmez.
    // Uzak host'a doğrudan gidilmez: görsel birinci taraf proxy'sinden
    // servis edilir (ziyaretçi IP/UA sızıntısı ve üçüncü taraf çerezi).
    // Adres loader'da imzalanır; imza sırra ve HMAC'e bağlı olduğu için
    // burada türetilemez.
    const ogImage = block.size !== "1x1" ? signedImage : "";
    const head = (
      <>
        <span className={`platform-mark ${platform.tone}`}>
          <SocialIcon platform={platform.id} width={18} height={18} strokeWidth={2.2} />
        </span>
        <span>
          <strong>{block.data.label}</strong>
          <small>{block.data.handle}</small>
        </span>
      </>
    );
    const content = calendar ? (
      <>
        <span className="social-head">{head}</span>
        <GithubHeatmap calendar={calendar} />
        {ogImage ? (
          <img className="social-og" src={ogImage} alt="" loading="lazy" draggable={false} />
        ) : null}
      </>
    ) : ogImage ? (
      <>
        <span className="social-head">{head}</span>
        <img className="social-og" src={ogImage} alt="" loading="lazy" draggable={false} />
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
            <img className="link-og" src={preview} alt="" loading="lazy" draggable={false} />
          ) : null}
          <span className="link-body">
            <span className={`platform-mark link-mark ${brand.tone}`} aria-hidden>
              {brand.initial}
            </span>
            <span className="link-lines">
              {/* Başlık boşsa (taslak) alan adı başlığın yerine geçer; alt
                  satır zaten yollu hâli yazıyor, aynı metin iki kez çıkmasın. */}
              <strong>{block.data.title || linkHostLabel(block.data.url)}</strong>
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

    case "image": {
    const content = block.data.assetId ? (
      <img src={`/i/${block.data.assetId}`} alt={block.data.title} draggable={false} />
    ) : (
      <span className="profile-image-placeholder">{block.data.title || "Görsel ekle"}</span>
    );
    return block.data.url ? (
      <a className="profile-block profile-block-image" href={block.data.url} target="_blank" rel="noreferrer">{content}</a>
    ) : (
      <article className="profile-block profile-block-image">{content}</article>
    );
    }

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

    // U32 / KTD37-KTD39. Düzeni İKİ bilgi belirler: fotoğraf sayısı (burada
    // bilinir) ve tile'ın gerçek ölçüsü (yalnız CSS bilir). Bu yüzden sayı
    // `data-count` ile DOM'a yazılır, ölçü kartın konteyner sorgularıyla
    // okunur — JS ölçümü ve hidrasyon kayması yok.
    //
    // Sığmayan fotoğraflar DOM'da kalır ama CSS ile gizlenir; `+N` pili de
    // olası her kapasite için ayrı bir slot olarak basılır ve bandın
    // kapasitesine uyanı görünür. Sayıyı CSS hesaplayamadığı için tek yol bu.
    case "gallery": {
      const photos = block.data.photos;
      const count = photos.length;
      return (
        <article
          className="profile-block profile-block-gallery"
          data-count={count}
          aria-label={galeriEtiketi(block.data.title)}
        >
          {photos.map((photo) => (
            // Yerel görseller R2'den gelir (Değişmez #9); proxy gerekmez.
            <img
              key={photo.assetId}
              src={`/i/${photo.assetId}`}
              alt={photo.alt}
              loading="lazy"
              draggable={false}
            />
          ))}
          {count === 0 ? (
            <span className="profile-image-placeholder">{galeriBosMetni}</span>
          ) : null}
          {/* Başlık her zaman basılır, GÖRÜNÜRLÜĞÜNE CSS karar verir: kısa
              tile'larda (138-156px) hücrelerin üstüne bindirmeden sığmıyor.
              Editörde başlık alanı var; hiçbir yerde göstermemek kullanıcının
              yazdığı şeyi kaybetmek olurdu. */}
          {block.data.title ? (
            <span className="gallery-title">{block.data.title}</span>
          ) : null}
          {GALLERY_BADGE_SLOTS.filter((capacity) => count > capacity).map((capacity) => (
            <span
              key={capacity}
              className="gallery-more"
              data-slot={capacity}
              aria-label={galeriDahaFazlaEtiketi(count - capacity)}
            >
              {galeriDahaFazla(count - capacity)}
            </span>
          ))}
        </article>
      );
    }

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
          <YoutubeVideoCard data={data} thumbnail={thumbnail} allowEmbeds={allowEmbeds} />
        );
      }

      const latest: YoutubeFeedCard | undefined = youtubeFeeds?.[block.id];
      const handle = data.handle ? `@${data.handle}` : "";
      const channelName = data.channelName || latest?.channelName || youtubeKanalYedekBasligi;
      const channelMeta = handle;
      const content = (
        <>
          <span className="yt-channel-head">
            {thumbnail ? (
              <img className="yt-avatar" src={thumbnail} alt="" loading="lazy" draggable={false} />
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
            <span className="yt-kind-pill">{youtubeKanalRozeti}</span>
          </span>
          {latest ? (
            // Kartın tamamı zaten bir <a>; iç içe bağlantı geçersiz HTML
            // olurdu. Son video bu yüzden bağlantı değil, bilgi şerididir.
            <span className={`yt-latest${latest.short ? " is-shorts" : ""}`}>
              <span className="yt-latest-media">
                {latest.thumbnail ? (
                  <img src={latest.thumbnail} alt="" loading="lazy" draggable={false} />
                ) : (
                  <span className="yt-thumb-empty" aria-hidden />
                )}
                <YoutubePlayMark small />
              </span>
              <span className="yt-latest-lines">
                <small className="yt-latest-kicker">{youtubeSonVideoBasligi}</small>
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

    // Spotify: YouTube videosuyla aynı facade → iframe deseni. Kart, çalacak
    // şeyi kapak + tür rozeti + başlıkla anlatır; oynatıcı ancak tıklamayla
    // doğar (bkz. `components/media-embed.tsx`).
    case "spotify":
      return (
        <SpotifyCard data={block.data} thumbnail={signedImage} allowEmbeds={allowEmbeds} />
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
  const profileBlock = layout.blocks.find((block) => block.type === "profile");
  const bentoBlocks = layout.blocks.filter((block) => block.type !== "profile");

  return (
    <div className={`profile-canvas ${compact ? "is-compact" : ""}`} data-profile-theme={theme}>
      <div className="profile-standard-layout">
        <aside className="profile-identity" aria-label="Profil bilgileri">
          {profileBlock ? <ProfileBlockCard block={profileBlock} /> : null}
        </aside>
        <section className="profile-grid" aria-label="Bağlantılar ve içerikler">
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
