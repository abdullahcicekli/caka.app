import type { SpotifyKind } from "@caka/shared";

import type { WidgetContent } from "./index";
import { type NumberFormat, relativeTime, shortNumber } from "./shared";

const numbers: NumberFormat = { decimal: ",", thousand: "mil", million: "M", billion: "MM" };

const galleryName = "Galería de fotos";

const youtubeEmbedNotice = "Al reproducir se conecta con YouTube";
const spotifyEmbedNotice = "Al reproducir se conecta con Spotify";

export const es = {
  gallery: {
    name: galleryName,
    empty: "Añadir fotos",
    label: (title: string) => title.trim() || galleryName,
    more: (count: number) => `+${count}`,
    moreLabel: (count: number) => `${count} foto${count === 1 ? "" : "s"} más`,
  },

  youtube: {
    channelBadge: "Canal",
    shortsBadge: "Shorts",
    latestVideoTitle: "Último vídeo",
    videoFallbackTitle: "Vídeo de YouTube",
    channelFallbackTitle: "Canal de YouTube",
    embedNotice: youtubeEmbedNotice,
    playLabel: (title: string) => `Reproducir: ${title} — ${youtubeEmbedNotice}`,
    playerTitle: (title: string) => `${title} — reproductor de YouTube`,
    views: (count: number) =>
      !Number.isFinite(count) || count < 0
        ? ""
        : `${shortNumber(Math.floor(count), numbers)} visualizaciones`,
    published: (isoDate: string, now: number) =>
      relativeTime(isoDate, now, {
        today: "hoy",
        yesterday: "ayer",
        days: (n) => `hace ${n} día${n === 1 ? "" : "s"}`,
        weeks: (n) => `hace ${n} semana${n === 1 ? "" : "s"}`,
        months: (n) => `hace ${n} mes${n === 1 ? "" : "es"}`,
        years: (n) => `hace ${n} año${n === 1 ? "" : "s"}`,
      }),
  },

  spotify: {
    embedNotice: spotifyEmbedNotice,
    playLabel: (title: string) => `Reproducir: ${title} — ${spotifyEmbedNotice}`,
    playerTitle: (title: string) => `${title} — reproductor de Spotify`,
    fallbackTitle: "Contenido de Spotify",
    kind: (kind: SpotifyKind): string => {
      switch (kind) {
        case "track":
          return "Canción";
        case "album":
          return "Álbum";
        case "playlist":
          return "Lista";
        case "artist":
          return "Artista";
        case "episode":
          return "Episodio";
        case "show":
          return "Programa";
      }
    },
  },

  github: {
    heatmapLabel: (total: number) => `${total} contribuciones en el último año`,
  },
} satisfies WidgetContent;
