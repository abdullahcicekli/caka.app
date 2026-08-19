import { formatFileSize, formatUploadDate, type SpotifyKind } from "@caka/shared";

import type { WidgetContent } from "./index";

import { type NumberFormat, clock24, relativeTime, shortNumber } from "./shared";

const numbers: NumberFormat = { decimal: ",", thousand: "mil", million: "M", billion: "MM" };

const photoName = "Foto";

const youtubeEmbedNotice = "Al reproducir se conecta con YouTube";
const spotifyEmbedNotice = "Al reproducir se conecta con Spotify";

export const es = {
  photo: {
    name: photoName,
    empty: "Añadir fotos",
    label: (title: string) => title.trim() || photoName,
    openLabel: (index: number, total: number) => `Ampliar la foto ${index} (${index}/${total})`,
    lightboxTitle: (title: string) => title.trim() || photoName,
    close: "Cerrar",
    previous: "Foto anterior",
    next: "Foto siguiente",
    counter: (index: number, total: number) => `${index} / ${total}`,
    dotsLabel: "Elegir una foto",
    goTo: (index: number, total: number) => `Ir a la foto ${index} (${index}/${total})`,
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

  document: {
    badge: "PDF",
    download: "Descargar",
    preview: "Vista previa",
    downloadLabel: (name: string) => `Descargar: ${name}`,
    previewLabel: (name: string) => `Vista previa: ${name} (se abre en una pestaña nueva)`,
    empty: "Añadir un documento",
    fallbackName: "Documento",
    size: (bytes: number) => formatFileSize(bytes, numbers.decimal),
    date: (epochMs: number) =>
      formatUploadDate(
        epochMs,
        ["enero", "febrero", "marzo", "abril", "mayo", "junio",
         "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
        (day, month, year) => `${day} de ${month} de ${year}`,
      ),
  },

  location: {
    fallbackLabel: "Ubicación",
    cardLabel: (label: string) => `Ubicación: ${label}`,
    clock: (hour: number, minute: number) => clock24(hour, minute),
  },

  ayet: {
    name: "Versículo del Corán",
    empty: "Elige un versículo",
    reference: (surahName: string, verse: number) => `Sura ${surahName}, versículo ${verse}`,
    label: (surahName: string, verse: number) => `Sura ${surahName}, versículo ${verse}`,
    mealCredit: (translator: string) => `Traducción al turco: ${translator}`,
  },

  github: {
    heatmapLabel: (total: number) => `${total} contribuciones en el último año`,
  },
} satisfies WidgetContent;
