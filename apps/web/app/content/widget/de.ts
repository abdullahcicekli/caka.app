import { formatFileSize, formatUploadDate, type SpotifyKind } from "@caka/shared";

import type { WidgetContent } from "./index";

import { type NumberFormat, clock24, relativeTime, shortNumber } from "./shared";

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

  document: {
    badge: "PDF",
    download: "Herunterladen",
    preview: "Vorschau",
    downloadLabel: (name: string) => `Herunterladen: ${name}`,
    previewLabel: (name: string) => `Vorschau: ${name} (öffnet in einem neuen Tab)`,
    empty: "Dokument hinzufügen",
    fallbackName: "Dokument",
    size: (bytes: number) => formatFileSize(bytes, numbers.decimal),
    date: (epochMs: number) =>
      formatUploadDate(
        epochMs,
        ["Januar", "Februar", "März", "April", "Mai", "Juni",
         "Juli", "August", "September", "Oktober", "November", "Dezember"],
        (day, month, year) => `${day}. ${month} ${year}`,
      ),
  },

  location: {
    fallbackLabel: "Standort",
    cardLabel: (label: string) => `Standort: ${label}`,
    clock: (hour: number, minute: number) => clock24(hour, minute),
  },

  ayet: {
    name: "Koranvers",
    empty: "Vers auswählen",
    reference: (surahName: string, verse: number) => `Sure ${surahName}, Vers ${verse}`,
    label: (surahName: string, verse: number) => `Sure ${surahName}, Vers ${verse}`,
    mealCredit: (translator: string) => `Türkische Übersetzung: ${translator}`,
  },

  github: {
    heatmapLabel: (total: number) => `${total} Beiträge im letzten Jahr`,
  },
} satisfies WidgetContent;
