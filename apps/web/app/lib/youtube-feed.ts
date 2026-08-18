/**
 * Kanal widget'ının canlı verisi (plan KTD36/R67). `server/youtube-widget.ts`
 * üretir, `ProfileBlockCard` çizer; tip bu yüzden iki tarafın da güvenle
 * import edebileceği yalın bir app modülünde yaşar — `github-calendar.ts`
 * ile birebir aynı desen.
 *
 * Alanların hepsi GÖSTERİME HAZIR dizedir: görüntülenme ve yayın zamanı
 * loader'da biçimlenir. Neden: bunlar `Date.now()`'a bağlı; bileşende
 * hesaplansalar SSR ile hidrasyon farklı metin üretebilirdi.
 */
export type YoutubeFeedCard = {
  /** Akıştan okunan kanal başlığı; blokta saklanan ad boşsa buna düşülür. */
  channelName: string;
  videoId: string;
  title: string;
  /** Videonun kanonik izleme adresi (kart bilgi amaçlı gösterir). */
  url: string;
  /** İmzalı birinci taraf küçük görsel yolu; imzalanamazsa boş (R58). */
  thumbnail: string;
  short: boolean;
  /** "3 gün önce" gibi hazır etiket; çözülemezse boş. */
  published: string;
  /** "1,2 Mn görüntülenme"; akış vermezse boş. */
  views: string;
};

/** Blok kimliği → kanalın en son videosu. */
export type YoutubeFeedMap = Readonly<Record<string, YoutubeFeedCard>>;
