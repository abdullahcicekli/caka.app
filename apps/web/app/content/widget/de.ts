import type { SpotifyKind } from "@caka/shared";

import type { WidgetContent } from "./index";
import { type NumberFormat, relativeTime, shortNumber } from "./shared";

const numbers: NumberFormat = { decimal: ",", thousand: "Tsd.", million: "Mio.", billion: "Mrd." };

const photoName = "Foto";

const youtubeEmbedNotice = "Beim Abspielen wird eine Verbindung zu YouTube hergestellt";
const spotifyEmbedNotice = "Beim Abspielen wird eine Verbindung zu Spotify hergestellt";

export const de = {
  photo: {
    name: photoName,
    empty: "Fotos hinzufügen",
    label: (title: string) => title.trim() || photoName,
    openLabel: (index: number, total: number) => `Foto ${index} vergrößern (${index}/${total})`,
    lightboxTitle: (title: string) => title.trim() || photoName,
    close: "Schließen",
    previous: "Vorheriges Foto",
    next: "Nächstes Foto",
    counter: (index: number, total: number) => `${index} / ${total}`,
    dotsLabel: "Foto auswählen",
    goTo: (index: number, total: number) => `Zu Foto ${index} (${index}/${total})`,
  },

  youtube: {
    channelBadge: "Kanal",
    shortsBadge: "Shorts",
    latestVideoTitle: "Neuestes Video",
    videoFallbackTitle: "YouTube-Video",
    channelFallbackTitle: "YouTube-Kanal",
    embedNotice: youtubeEmbedNotice,
    playLabel: (title: string) => `Abspielen: ${title} — ${youtubeEmbedNotice}`,
    playerTitle: (title: string) => `${title} — YouTube-Player`,
    views: (count: number) =>
      !Number.isFinite(count) || count < 0
        ? ""
        : `${shortNumber(Math.floor(count), numbers)} Aufrufe`,
    published: (isoDate: string, now: number) =>
      relativeTime(isoDate, now, {
        today: "heute",
        yesterday: "gestern",
        days: (n) => `vor ${n} Tag${n === 1 ? "" : "en"}`,
        weeks: (n) => `vor ${n} Woche${n === 1 ? "" : "n"}`,
        months: (n) => `vor ${n} Monat${n === 1 ? "" : "en"}`,
        years: (n) => `vor ${n} Jahr${n === 1 ? "" : "en"}`,
      }),
  },

  spotify: {
    embedNotice: spotifyEmbedNotice,
    playLabel: (title: string) => `Abspielen: ${title} — ${spotifyEmbedNotice}`,
    playerTitle: (title: string) => `${title} — Spotify-Player`,
    fallbackTitle: "Spotify-Inhalt",
    kind: (kind: SpotifyKind): string => {
      switch (kind) {
        case "track":
          return "Titel";
        case "album":
          return "Album";
        case "playlist":
          return "Playlist";
        case "artist":
          return "Künstler";
        case "episode":
          return "Folge";
        case "show":
          return "Sendung";
      }
    },
  },

  github: {
    heatmapLabel: (total: number) => `${total} Beiträge im letzten Jahr`,
  },
} satisfies WidgetContent;
