import type { CSSProperties } from "react";

import { remoteImageProxyPath } from "@caka/shared";
import type { ProfileBlock, ProfileLayout, ProfileTheme } from "@caka/shared";

import { SocialIcon } from "~/components/icons/social";
import { RichTextView } from "~/components/rich-text";
import {
  githubDayTitle,
  githubFootHint,
  githubHeatmapAriaLabel,
  githubTotalLine,
} from "~/content/github";
import { platformById } from "~/content/onboarding";
import { githubLoginKey, type GithubCalendar, type GithubCalendarMap } from "~/lib/github-calendar";
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

export function ProfileBlockCard({
  block,
  githubCalendars,
}: {
  block: ProfileBlock;
  githubCalendars?: GithubCalendarMap;
}) {
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
    // servis edilir (backlog #6 — ziyaretçi IP/UA sızıntısı ve üçüncü taraf
    // çerezi). Adres saf bir fonksiyonla türetilir; SSR ve hydration aynı.
    const ogImage = block.size !== "1x1" && block.data.ogImage
      ? remoteImageProxyPath(block.data.ogImage)
      : "";
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

    case "link":
      return (
      <a className="profile-block profile-block-link" href={block.data.url || undefined} target="_blank" rel="noreferrer">
        <span>↗</span>
        <strong>{block.data.title}</strong>
        <small>{block.data.url.replace(/^https?:\/\//, "")}</small>
      </a>
    );

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
}: {
  layout: ProfileLayout;
  theme: ProfileTheme;
  compact?: boolean;
  /** login → GitHub katkı takvimi (loader doldurur; yoksa özellik kapalı) */
  githubCalendars?: GithubCalendarMap;
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
                <ProfileBlockCard block={block} githubCalendars={githubCalendars} />
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
