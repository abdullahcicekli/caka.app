import type { SpotifyKind } from "@caka/shared";

import { type NumberFormat, relativeTime, shortNumber } from "./shared";

const numbers: NumberFormat = { decimal: ",", thousand: "B", million: "Mn", billion: "Mr" };

/**
 * Widget'ın adı bilinçli olarak "Fotoğraf galerisi": editördeki blok seçici
 * zaten "Blok galerisi" adını taşıyor ve yalnız "galeri" demek ikisini
 * karıştırır.
 */
const galleryName = "Fotoğraf galerisi";

const youtubeEmbedNotice = "Oynatınca YouTube'a bağlanılır";
const spotifyEmbedNotice = "Oynatınca Spotify'a bağlanılır";

export const tr = {
  gallery: {
    name: galleryName,
    /** Boş galeri bloğunun (taslak) kart içi yer tutucusu. */
    empty: "Fotoğraf ekle",
    /** Kartın ekran okuyucu etiketi; kullanıcı başlık yazdıysa o kazanır. */
    label: (title: string) => title.trim() || galleryName,
    /** Sığmayan fotoğrafların pili: "+2". */
    more: (count: number) => `+${count}`,
    moreLabel: (count: number) => `${count} fotoğraf daha`,
  },

  youtube: {
    channelBadge: "Kanal",
    shortsBadge: "Shorts",
    latestVideoTitle: "Son video",
    videoFallbackTitle: "YouTube videosu",
    channelFallbackTitle: "YouTube kanalı",
    /* Kart açılışta üçüncü tarafa hiç istek atmaz; oynatıcı ancak tıklamayla
       doğar. "Bilinçli tıklama" için ne olacağının önceden söylenmesi gerek —
       aşağıdaki iki metin bunun için. */
    embedNotice: youtubeEmbedNotice,
    playLabel: (title: string) => `Oynat: ${title} — ${youtubeEmbedNotice}`,
    playerTitle: (title: string) => `${title} — YouTube oynatıcı`,
    views: (count: number) =>
      !Number.isFinite(count) || count < 0
        ? ""
        : `${shortNumber(Math.floor(count), numbers)} görüntülenme`,
    published: (isoDate: string, now: number) =>
      relativeTime(isoDate, now, {
        today: "bugün",
        yesterday: "dün",
        days: (n) => `${n} gün önce`,
        weeks: (n) => `${n} hafta önce`,
        months: (n) => `${n} ay önce`,
        years: (n) => `${n} yıl önce`,
      }),
  },

  spotify: {
    embedNotice: spotifyEmbedNotice,
    playLabel: (title: string) => `Oynat: ${title} — ${spotifyEmbedNotice}`,
    playerTitle: (title: string) => `${title} — Spotify oynatıcı`,
    fallbackTitle: "Spotify içeriği",
    /**
     * Tür rozeti. Sanatçı adı için yuva YOK (oEmbed vermiyor); rozet, kartın
     * neyi çaldığını söyleyen tek işaret olduğu için her boyutta basılır.
     */
    kind: (kind: SpotifyKind): string => {
      switch (kind) {
        case "track":
          return "Parça";
        case "album":
          return "Albüm";
        case "playlist":
          return "Liste";
        case "artist":
          return "Sanatçı";
        case "episode":
          return "Bölüm";
        case "show":
          return "Program";
      }
    },
  },

  /** GitHub katkı grafiğinin ekran okuyucu etiketi. */
  github: {
    heatmapLabel: (total: number) => `${total} katkı, son bir yıl`,
  },
};
