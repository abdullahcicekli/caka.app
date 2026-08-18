// Kanal widget'ının loader tarafı (plan KTD36/R67).
//
// NEDEN AYRI DOSYA: route dosyasına iş mantığı yazılmaz (AGENTS.md). Bu
// yardımcı `server/github.ts`'in `getGithubCalendars`'ıyla aynı sözleşmeyi
// izler — blok kimliğine anahtarlı bir sözlük döner, blok verisine dokunmaz.
//
// HATA SAYFAYI DÜŞÜRMEZ: akış çekilemez, ayrıştırılamaz veya küçük görsel
// imzalanamazsa ilgili blok sözlükte hiç görünmez ve kart kayıt anında
// saklanan bilgiye (kanal adı, handle) düşer.
import { youtubeThumbnailUrl, youtubeVideoUrl, type ProfileLayout } from "@caka/shared";

import { youtubeGoruntulenme, youtubeYayinZamani } from "../app/content/widget";
import type { YoutubeFeedCard, YoutubeFeedMap } from "../app/lib/youtube-feed";
import { signImageProxyPath } from "./image-proxy";
import { getYouTubeChannelFeed } from "./youtube";

/** Düzendeki kanal bloklarının blok kimliği → `UC…` eşlemesi. */
function channelTargets(layout: ProfileLayout): { id: string; channelId: string }[] {
  return layout.blocks.flatMap((block) =>
    block.type === "youtube" && block.data.kind === "channel" && block.data.channelId
      ? [{ id: block.id, channelId: block.data.channelId }]
      : [],
  );
}

/**
 * Kanal bloklarının en son videosu. Akış Cache API'de 15 dakika durur, yani
 * widget'ın "canlılık" gecikmesi budur; kayıt anındaki çözümleme tekrar
 * edilmez (AE12).
 *
 * Aynı kanal birden fazla blokta olabilir; akış kanal başına bir kez okunur.
 */
export async function getYoutubeChannelCards(
  env: Env,
  layout: ProfileLayout,
  now: number = Date.now(),
): Promise<YoutubeFeedMap> {
  const targets = channelTargets(layout);
  if (targets.length === 0) return {};

  const channelIds = [...new Set(targets.map((target) => target.channelId))];
  const cards = new Map<string, YoutubeFeedCard>();

  await Promise.all(
    channelIds.map(async (channelId) => {
      try {
        const feed = await getYouTubeChannelFeed(channelId);
        const video = feed?.videos[0];
        if (!feed || !video) return;
        // Küçük görsel uzak host'ta; ziyaretçi tarayıcısı YouTube'a doğrudan
        // istek atmasın diye birinci taraf proxy'sinden geçer (R58).
        const thumbnail =
          (await signImageProxyPath(env, youtubeThumbnailUrl(video.videoId, "mq"))) ?? "";
        cards.set(channelId, {
          channelName: feed.channelTitle,
          videoId: video.videoId,
          title: video.title,
          url: youtubeVideoUrl(video.videoId),
          thumbnail,
          short: video.short,
          published: youtubeYayinZamani(video.publishedAt, now),
          views: video.views === null ? "" : youtubeGoruntulenme(video.views),
        });
      } catch {
        // Ağ/imza hatası: bu kanal bu görüntülemede canlı veri almaz.
      }
    }),
  );

  const map: Record<string, YoutubeFeedCard> = {};
  for (const target of targets) {
    const card = cards.get(target.channelId);
    if (card) map[target.id] = card;
  }
  return map;
}
