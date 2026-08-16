import type { ProfileBlock, ProfileLayout, ProfileTheme } from "@caka/shared";

import { SocialIcon } from "~/components/icons/social";
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
    const content = (
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
    return block.data.url ? (
      <a className="profile-block profile-block-social" href={block.data.url} target="_blank" rel="noreferrer">
        {content}
      </a>
    ) : (
      <article className="profile-block profile-block-social">{content}</article>
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
    return <article className="profile-block profile-block-text">{block.data.text}</article>;
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

  return block.data.url ? (
    <a className="profile-block profile-block-status" href={block.data.url} target="_blank" rel="noreferrer">
      {block.data.text}
    </a>
  ) : (
    <article className="profile-block profile-block-status">{block.data.text}</article>
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
          {bentoBlocks.map((block) => (
            <div key={block.id} className={`profile-grid-item size-${block.size}`}>
              <ProfileBlockCard block={block} />
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
