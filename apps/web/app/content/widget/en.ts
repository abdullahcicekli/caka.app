import { formatFileSize, formatUploadDate, type SpotifyKind } from "@caka/shared";

import type { WidgetContent } from "./index";

import { type NumberFormat, clock12, relativeTime, shortNumber } from "./shared";

const numbers: NumberFormat = { decimal: ".", thousand: "K", million: "M", billion: "B" };

const photoName = "Photo";

const youtubeEmbedNotice = "Playing connects to YouTube";
const spotifyEmbedNotice = "Playing connects to Spotify";

export const en = {
  photo: {
    name: photoName,
    empty: "Add photos",
    label: (title: string) => title.trim() || photoName,
    openLabel: (index: number, total: number) => `Enlarge photo ${index} (${index}/${total})`,
    lightboxTitle: (title: string) => title.trim() || photoName,
    close: "Close",
    previous: "Previous photo",
    next: "Next photo",
    counter: (index: number, total: number) => `${index} / ${total}`,
    dotsLabel: "Choose a photo",
    goTo: (index: number, total: number) => `Go to photo ${index} (${index}/${total})`,
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

  document: {
    badge: "PDF",
    download: "Download",
    preview: "Preview",
    downloadLabel: (name: string) => `Download: ${name}`,
    previewLabel: (name: string) => `Preview: ${name} (opens in a new tab)`,
    empty: "Add a document",
    fallbackName: "Document",
    size: (bytes: number) => formatFileSize(bytes, numbers.decimal),
    date: (epochMs: number) =>
      formatUploadDate(
        epochMs,
        ["January", "February", "March", "April", "May", "June",
         "July", "August", "September", "October", "November", "December"],
        (day, month, year) => `${month} ${day}, ${year}`,
      ),
  },

  location: {
    fallbackLabel: "Location",
    cardLabel: (label: string) => `Location: ${label}`,
    /** English uses the 12-hour clock. */
    clock: (hour: number, minute: number) => clock12(hour, minute, "AM", "PM"),
  },

  ayet: {
    name: "Qur'an verse",
    empty: "Choose a verse",
    reference: (surahName: string, verse: number) => `Surah ${surahName}, verse ${verse}`,
    label: (surahName: string, verse: number) => `Surah ${surahName}, verse ${verse}`,
    /* The translation is Turkish in every interface language; the credit says so. */
    mealCredit: (translator: string) => `Turkish translation: ${translator}`,
  },

  github: {
    heatmapLabel: (total: number) => `${total} contributions in the last year`,
  },
} satisfies WidgetContent;
