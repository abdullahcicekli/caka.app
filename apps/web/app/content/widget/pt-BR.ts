import type { SpotifyKind } from "@caka/shared";

import type { WidgetContent } from "./index";
import { type NumberFormat, relativeTime, shortNumber } from "./shared";

const numbers: NumberFormat = { decimal: ",", thousand: "mil", million: "mi", billion: "bi" };

const galleryName = "Galeria de fotos";

const youtubeEmbedNotice = "Ao reproduzir, conecta ao YouTube";
const spotifyEmbedNotice = "Ao reproduzir, conecta ao Spotify";

export const ptBR = {
  gallery: {
    name: galleryName,
    empty: "Adicionar fotos",
    label: (title: string) => title.trim() || galleryName,
    more: (count: number) => `+${count}`,
    moreLabel: (count: number) => `mais ${count} foto${count === 1 ? "" : "s"}`,
  },

  youtube: {
    channelBadge: "Canal",
    shortsBadge: "Shorts",
    latestVideoTitle: "Último vídeo",
    videoFallbackTitle: "Vídeo do YouTube",
    channelFallbackTitle: "Canal do YouTube",
    embedNotice: youtubeEmbedNotice,
    playLabel: (title: string) => `Reproduzir: ${title} — ${youtubeEmbedNotice}`,
    playerTitle: (title: string) => `${title} — player do YouTube`,
    views: (count: number) =>
      !Number.isFinite(count) || count < 0
        ? ""
        : `${shortNumber(Math.floor(count), numbers)} visualizações`,
    published: (isoDate: string, now: number) =>
      relativeTime(isoDate, now, {
        today: "hoje",
        yesterday: "ontem",
        days: (n) => `há ${n} dia${n === 1 ? "" : "s"}`,
        weeks: (n) => `há ${n} semana${n === 1 ? "" : "s"}`,
        months: (n) => `há ${n} ${n === 1 ? "mês" : "meses"}`,
        years: (n) => `há ${n} ano${n === 1 ? "" : "s"}`,
      }),
  },

  spotify: {
    embedNotice: spotifyEmbedNotice,
    playLabel: (title: string) => `Reproduzir: ${title} — ${spotifyEmbedNotice}`,
    playerTitle: (title: string) => `${title} — player do Spotify`,
    fallbackTitle: "Conteúdo do Spotify",
    kind: (kind: SpotifyKind): string => {
      switch (kind) {
        case "track":
          return "Faixa";
        case "album":
          return "Álbum";
        case "playlist":
          return "Playlist";
        case "artist":
          return "Artista";
        case "episode":
          return "Episódio";
        case "show":
          return "Programa";
      }
    },
  },

  ayet: {
    name: "Versículo do Alcorão",
    empty: "Escolha um versículo",
    reference: (surahName: string, verse: number) => `Surata ${surahName}, versículo ${verse}`,
    label: (surahName: string, verse: number) => `Surata ${surahName}, versículo ${verse}`,
    mealCredit: (translator: string) => `Tradução para o turco: ${translator}`,
  },

  github: {
    heatmapLabel: (total: number) => `${total} contribuições no último ano`,
  },
} satisfies WidgetContent;
