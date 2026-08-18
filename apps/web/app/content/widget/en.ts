import type { SpotifyKind } from "@caka/shared";

import type { WidgetContent } from "./index";
import { type NumberFormat, relativeTime, shortNumber } from "./shared";

const numbers: NumberFormat = { decimal: ".", thousand: "K", million: "M", billion: "B" };

const galleryName = "Photo gallery";

const youtubeEmbedNotice = "Playing connects to YouTube";
const spotifyEmbedNotice = "Playing connects to Spotify";

export const en = {
  gallery: {
    name: galleryName,
    empty: "Add photos",
    label: (title: string) => title.trim() || galleryName,
    more: (count: number) => `+${count}`,
    moreLabel: (count: number) => `${count} more photo${count === 1 ? "" : "s"}`,
  },

  youtube: {
    channelBadge: "Channel",
    shortsBadge: "Shorts",
    latestVideoTitle: "Latest video",
    videoFallbackTitle: "YouTube video",
    channelFallbackTitle: "YouTube channel",
    embedNotice: youtubeEmbedNotice,
    playLabel: (title: string) => `Play: ${title} — ${youtubeEmbedNotice}`,
    playerTitle: (title: string) => `${title} — YouTube player`,
    views: (count: number) =>
      !Number.isFinite(count) || count < 0
        ? ""
        : `${shortNumber(Math.floor(count), numbers)} views`,
    published: (isoDate: string, now: number) =>
      relativeTime(isoDate, now, {
        today: "today",
        yesterday: "yesterday",
        days: (n) => `${n} day${n === 1 ? "" : "s"} ago`,
        weeks: (n) => `${n} week${n === 1 ? "" : "s"} ago`,
        months: (n) => `${n} month${n === 1 ? "" : "s"} ago`,
        years: (n) => `${n} year${n === 1 ? "" : "s"} ago`,
      }),
  },

  spotify: {
    embedNotice: spotifyEmbedNotice,
    playLabel: (title: string) => `Play: ${title} — ${spotifyEmbedNotice}`,
    playerTitle: (title: string) => `${title} — Spotify player`,
    fallbackTitle: "Spotify content",
    kind: (kind: SpotifyKind): string => {
      switch (kind) {
        case "track":
          return "Track";
        case "album":
          return "Album";
        case "playlist":
          return "Playlist";
        case "artist":
          return "Artist";
        case "episode":
          return "Episode";
        case "show":
          return "Show";
      }
    },
  },

  github: {
    heatmapLabel: (total: number) => `${total} contributions in the last year`,
  },
} satisfies WidgetContent;
