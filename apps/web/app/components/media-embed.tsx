/**
 * Yerinde oynatılan medya kartları: YouTube videosu ve Spotify içeriği.
 *
 * TASARIM: facade (tıkla-yükle), doğrudan iframe DEĞİL.
 *
 * Sayfa açılışında `<iframe>` basmak, ziyaretçinin tarayıcısını HER yüklemede
 * YouTube/Spotify'a bağlar: üçüncü taraf çerezi yazılır, IP/UA sızar ve R58
 * ile kazandığımız proxy disiplini çöpe gider (yayındaki hukuki metinler
 * "üçüncü tarafa istek atılmaz" diyor — kod bunu yanlışa düşüremez). Bir
 * YouTube oynatıcısı ayrıca ~1 MB JS'tir; üç videolu bir profil ölçülemez
 * hâle gelirdi.
 *
 * Bu yüzden kart iki durumludur:
 *   1. Varsayılan — bizim proxy'lediğimiz kapak + oynat tuşu. Üçüncü tarafa
 *      SIFIR istek.
 *   2. Kullanıcı oynata basınca — facade yerini `<iframe>`e bırakır ve
 *      otomatik oynar.
 *
 * HİDRASYON: geçiş tek bir `useState` ile olur ve başlangıç değeri her zaman
 * `false`. Sunucu çıktısı ile ilk istemci render'ı bu yüzden birebir aynıdır;
 * iframe hidrasyondan sonra, yalnız kullanıcı eylemiyle DOM'a girer.
 *
 * RIZA: tıklama, çerez yazılmasına verilen bilinçli onaydır — ancak ne
 * olacağı ÖNCEDEN söylenirse. Metinler `content/widget.ts`'te (Değişmez #5):
 * oynat tuşunun `aria-label`/`title`'ı her boyutta uyarıyı taşır, kartta
 * görünen kısa satır ise yer olan boyutlarda CSS ile açılır.
 */
import { useState } from "react";

import type { ProfileBlock } from "@caka/shared";

import {
  spotifyGommeUyarisi,
  spotifyOynatEtiketi,
  spotifyOynaticiBasligi,
  spotifyTurRozeti,
  spotifyYedekBasligi,
  youtubeGommeUyarisi,
  youtubeOynatEtiketi,
  youtubeOynaticiBasligi,
  youtubeShortsRozeti,
  youtubeVideoYedekBasligi,
} from "~/content/widget";

type YoutubeVideoData = Extract<
  Extract<ProfileBlock, { type: "youtube" }>["data"],
  { kind: "video" }
>;
type SpotifyData = Extract<ProfileBlock, { type: "spotify" }>["data"];

/**
 * Ortak `<iframe>` özellikleri. `loading="lazy"` burada bir tasarruf değil
 * güvenlik ağı: iframe zaten yalnız tıklamayla doğuyor, ama kart görünür
 * alanın dışındayken (uzun profil) tarayıcı yine de bekleyebilsin.
 */
const EMBED_ALLOW = "autoplay; encrypted-media; picture-in-picture; clipboard-write";

/**
 * Gömme adresi. Kimlikler şemada charset ile sınırlı ([A-Za-z0-9_-] /
 * [A-Za-z0-9]), yani enjeksiyon zaten mümkün değil; `encodeURIComponent`
 * yine de duruyor ki adres kurma güvenliği şemanın uzağındaki bir dosyaya
 * bağımlı kalmasın.
 */
function youtubeEmbedSrc(videoId: string): string {
  // `youtube-nocookie.com`: oynatılana kadar profilleme çerezi yazmayan
  // varyant. `rel=0` bitişte YABANCI kanal önermesin, `modestbranding=1`
  // oynatıcıyı kartın içinde sakin tutsun diye.
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0&modestbranding=1`;
}

function spotifyEmbedSrc(kind: SpotifyData["kind"], entityId: string): string {
  return `https://open.spotify.com/embed/${encodeURIComponent(kind)}/${encodeURIComponent(entityId)}`;
}

/**
 * YouTube oynatma göstergesi. Kırmızı çip + beyaz üçgen; tamamı CSS, ek
 * istek yok. Video kartını kanal kartından ayıran ilk işaret bu.
 */
export function YoutubePlayMark({ small = false }: { small?: boolean }) {
  return <span className={`yt-play${small ? " is-small" : ""}`} aria-hidden />;
}

/**
 * Kartın tamamını kaplayan görünmez oynat tuşu.
 *
 * Neden görsel işaretin kendisi tuş DEĞİL: kart içeriği (kapak, başlık,
 * rozet) olduğu gibi kalsın, dokunma hedefi yine kartın tamamı olsun ve
 * `<button>` içine `<a>` gibi iç içe etkileşimli öğe girmesin. Erişilebilir
 * ad `aria-label`da; `title` aynı metni imleç üstünde de gösterir ki uyarı
 * ekran okuyucuya özel bir ayrıcalık olmasın.
 */
function MediaHit({ label, onPlay }: { label: string; onPlay: () => void }) {
  return (
    <button
      type="button"
      className="media-hit"
      // Ölçüm işareti: kart artık <a> değil, yani tıklama dinleyicisi onu
      // göremezdi ve blok panelde sonsuza kadar sıfır görünürdü. Oynatma
      // zaten tıklamadan daha anlamlı bir etkileşim.
      data-measure="play"
      aria-label={label}
      title={label}
      onClick={onPlay}
    />
  );
}

export function YoutubeVideoCard({
  data,
  thumbnail,
  allowEmbeds,
}: {
  data: YoutubeVideoData;
  /** İmzalı birinci taraf kapak adresi; yoksa kart sade yüzeye düşer. */
  thumbnail: string;
  allowEmbeds: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  // Kimlik çözülmemişse (taslak blok) gömecek bir şey yok; kart eski
  // davranışına — adrese giden bağlantıya — düşer.
  const canPlay = allowEmbeds && data.videoId !== "";
  // DÜZEN, OYNATMA YETKİSİNE BAĞLI DEĞİL. `is-embed` eskiden `canPlay` ile
  // veriliyordu; oynatma yalnız public profilde açık olduğu için editör
  // tuvali bambaşka bir düzen kuruyordu (aynı 542×324 hücrede kapak tam
  // kanama ve kırpılmış, canlıda ise 16:9 ve yan yana). `is-embed` artık
  // "bu kartta oynatılabilir bir medya VAR" demek — kutu üç yüzeyde de aynı,
  // tıklamayı yine `canPlay` açıyor.
  const hasMedia = data.videoId !== "";
  // Başlık İSTEĞE BAĞLI: yoksa kart yazısız durur. Eskiden "YouTube videosu"
  // yedek başlığı basılıyordu — hiçbir şey söylemeyen bir satırdı. Yedek
  // metin yalnız erişilebilir adda yaşıyor: oynat tuşunun bir adı olmalı.
  const title = data.title.trim();
  const playLabel = youtubeOynatEtiketi(title || youtubeVideoYedekBasligi);

  // 9:16 çerçeve yalnız küçük görsel GERÇEKTEN dikeyse doğru. Bir Short'un
  // `mqdefault`'u da 16:9 gelir; `shorts` bayrağına bakarak çerçeve seçmek o
  // görselin genişliğinin çoğunu kırpıyordu.
  const className = `profile-block profile-block-youtube is-video${
    data.verticalThumbnail ? " is-shorts" : ""
  }${hasMedia ? " is-embed" : ""}${playing ? " is-playing" : ""}`;

  if (playing) {
    return (
      <article className={className}>
        {title ? (
          <span className="youtube-meta">
            <strong>{title}</strong>
            {data.channelName ? <small>{data.channelName}</small> : null}
          </span>
        ) : null}
        <span className="yt-media">
          <iframe
            className="media-frame"
            src={youtubeEmbedSrc(data.videoId)}
            title={youtubeOynaticiBasligi(title)}
            allow={EMBED_ALLOW}
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </span>
      </article>
    );
  }

  const media = (
    <span className="yt-media">
      {thumbnail ? (
        <img className="youtube-thumb" src={thumbnail} alt="" loading="lazy" draggable={false} />
      ) : (
        <span className="youtube-thumb yt-thumb-empty" aria-hidden />
      )}
      <YoutubePlayMark />
      {data.shorts ? <span className="yt-pill">{youtubeShortsRozeti}</span> : null}
    </span>
  );
  // Yazacak bir şey yoksa metin bloğu hiç basılmaz: boş bir `<strong>` kartta
  // ölü boşluk bırakıyordu. Sıra MEDYADAN ÖNCE — başlık videonun üstünde
  // durur (yan yana dizilen bantlarda CSS `order` ile kapak yine solda
  // kalır; bkz. app.css "youtube-meta order").
  const meta =
    title || data.channelName || canPlay ? (
      <span className="youtube-meta">
        {title ? <strong>{title}</strong> : null}
        {data.channelName ? <small>{data.channelName}</small> : null}
        {/* Uyarı satırı basılır; kısa/dar bantlarda CSS gizler ve bilgi
            tuşun `aria-label`/`title`'ında yaşamaya devam eder. */}
        {canPlay ? <small className="media-note">{youtubeGommeUyarisi}</small> : null}
      </span>
    ) : null;

  if (canPlay) {
    return (
      <article className={className}>
        {meta}
        {media}
        <MediaHit label={playLabel} onPlay={() => setPlaying(true)} />
      </article>
    );
  }

  return data.url ? (
    <a className={className} href={data.url} target="_blank" rel="noreferrer">
      {meta}
      {media}
    </a>
  ) : (
    <article className={className}>
      {meta}
      {media}
    </article>
  );
}

/**
 * Spotify kartı: kapak + tür rozeti + başlık + yeşil oynat çipi.
 *
 * Sanatçı adı YOK — oEmbed yalnız `title` veriyor (parçada şarkı adı,
 * albümde albüm adı), yani dolduramayacağımız bir yuva olurdu (bkz. şema).
 */
export function SpotifyCard({
  data,
  thumbnail,
  allowEmbeds,
}: {
  data: SpotifyData;
  thumbnail: string;
  allowEmbeds: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const canPlay = allowEmbeds && data.entityId !== "";
  // Başlık isteğe bağlı (YouTube kartıyla aynı kural): yedek metin yalnız
  // erişilebilir adda yaşar, kartta hiçbir şey söylemeyen bir satır olmaz.
  const title = data.title.trim();
  const playLabel = spotifyOynatEtiketi(title || spotifyYedekBasligi);
  const kindLabel = spotifyTurRozeti(data.kind);

  const className = `profile-block profile-block-spotify${canPlay ? " is-embed" : ""}${
    playing ? " is-playing" : ""
  }`;

  if (playing) {
    // Spotify gömmesi kendi köşe yuvarlaklığını ve iç boşluğunu getiriyor,
    // ayrıca verilen yüksekliğe göre kompakt/tam düzen seçiyor. Bu yüzden
    // kartın dolgusu kaldırılır ve çerçeve tile'ın tamamını kaplar.
    return (
      <article className={className}>
        <iframe
          className="media-frame"
          src={spotifyEmbedSrc(data.kind, data.entityId)}
          title={spotifyOynaticiBasligi(title)}
          allow={EMBED_ALLOW}
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </article>
    );
  }

  const content = (
    <>
      <span className="sp-cover">
        {thumbnail ? (
          <img src={thumbnail} alt="" loading="lazy" draggable={false} />
        ) : (
          // Kapak imzalanamadıysa (sır yok / uzak hata) kart kırık <img>
          // göstermez, sade bir yüzeye düşer.
          <span className="sp-cover-empty" aria-hidden />
        )}
      </span>
      {/* Metin ve oynat çipi TEK bir satır kabında: kart 2×1'de yatay
          (kapak solda, bu satır sağda), 2×2'de dikey (kapak üstte, bu satır
          altta) diziliyor. Aynı DOM iki düzeni de veriyor. */}
      <span className="sp-foot">
        <span className="spotify-meta">
          <span className="sp-kind-pill">{kindLabel}</span>
          {title ? <strong>{title}</strong> : null}
          {canPlay ? <small className="media-note">{spotifyGommeUyarisi}</small> : null}
        </span>
        <span className="sp-play" aria-hidden />
      </span>
    </>
  );

  if (canPlay) {
    return (
      <article className={className}>
        {content}
        <MediaHit label={playLabel} onPlay={() => setPlaying(true)} />
      </article>
    );
  }

  return data.url ? (
    <a className={className} href={data.url} target="_blank" rel="noreferrer">
      {content}
    </a>
  ) : (
    <article className={className}>{content}</article>
  );
}
