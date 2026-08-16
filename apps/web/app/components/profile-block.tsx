import type { CSSProperties } from "react";

import type { ProfileBlock, ProfileLayout, ProfileTheme } from "@caka/shared";

import { SocialIcon } from "~/components/icons/social";
import { RichTextView } from "~/components/rich-text";
import { platformById } from "~/content/onboarding";
import { ProfileAvatar } from "./profile-avatar";

export function ProfileBlockCard({ block }: { block: ProfileBlock }) {
  if (block.type === "profile") {
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
  }

  if (block.type === "social") {
    const platform = platformById(block.data.platform);
    // og görseli her boyutta saklanır; yalnız 1x1'den büyük kartlarda gösterilir.
    const ogImage = block.size !== "1x1" ? block.data.ogImage : "";
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
    const content = ogImage ? (
      <>
        <span className="social-head">{head}</span>
        <img className="social-og" src={ogImage} alt="" loading="lazy" />
      </>
    ) : (
      head
    );
    const className = `profile-block profile-block-social${ogImage ? " has-og" : ""}`;
    return block.data.url ? (
      <a className={className} href={block.data.url} target="_blank" rel="noreferrer">
        {content}
      </a>
    ) : (
      <article className={className}>{content}</article>
    );
  }

  if (block.type === "link") {
    return (
      <a className="profile-block profile-block-link" href={block.data.url || undefined} target="_blank" rel="noreferrer">
        <span>↗</span>
        <strong>{block.data.title}</strong>
        <small>{block.data.url.replace(/^https?:\/\//, "")}</small>
      </a>
    );
  }

  if (block.type === "text") {
    return (
      <article className="profile-block profile-block-text">
        {block.data.doc ? <RichTextView doc={block.data.doc} /> : block.data.text}
      </article>
    );
  }

  if (block.type === "image") {
    const content = block.data.assetId ? (
      <img src={`/i/${block.data.assetId}`} alt={block.data.title} />
    ) : (
      <span className="profile-image-placeholder">{block.data.title || "Görsel ekle"}</span>
    );
    return block.data.url ? (
      <a className="profile-block profile-block-image" href={block.data.url} target="_blank" rel="noreferrer">{content}</a>
    ) : (
      <article className="profile-block profile-block-image">{content}</article>
    );
  }

  const statusContent = block.data.doc ? <RichTextView doc={block.data.doc} /> : block.data.text;
  return block.data.url ? (
    <a className="profile-block profile-block-status" href={block.data.url} target="_blank" rel="noreferrer">
      {statusContent}
    </a>
  ) : (
    <article className="profile-block profile-block-status">{statusContent}</article>
  );
}

export function ProfileCanvas({
  layout,
  theme,
  compact = false,
}: {
  layout: ProfileLayout;
  theme: ProfileTheme;
  compact?: boolean;
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
                className={`profile-grid-item size-${block.size} ${pos ? "has-pos" : ""}`}
                style={style}
              >
                <ProfileBlockCard block={block} />
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
