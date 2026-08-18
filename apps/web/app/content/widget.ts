/**
 * Galeri, YouTube ve Spotify widget'larının kullanıcıya görünen metinleri.
 * İçerik/görünüm ayrımı (Değişmez #5) gereği bileşende değil burada yaşar.
 *
 * Sayı ve tarih biçimleyicileri `Intl` KULLANMAZ: çıktı hem Worker'da hem
 * tarayıcıda birebir aynı olmalı (SSR + hidrasyon) ve ICU verisi ortama göre
 * değişebiliyor. Türkçe ondalık ayırıcı virgüldür.
 */
import type { SpotifyKind } from "@caka/shared";

/**
 * Widget'ın adı bilinçli olarak "Fotoğraf galerisi": editördeki blok seçici
 * zaten "Blok galerisi" adını taşıyor ve yalnız "galeri" demek ikisini
 * karıştırır.
 */
export const fotografGalerisiAdi = "Fotoğraf galerisi";

/** Boş galeri bloğunun (taslak) kart içi yer tutucusu. */
export const galeriBosMetni = "Fotoğraf ekle";

/** Kartın ekran okuyucu etiketi; kullanıcı başlık yazdıysa o kazanır. */
export function galeriEtiketi(title: string): string {
  return title.trim() || fotografGalerisiAdi;
}

/** Sığmayan fotoğrafların pili: "+2". */
export function galeriDahaFazla(count: number): string {
  return `+${count}`;
}

/** Pilin ekran okuyucu karşılığı. */
export function galeriDahaFazlaEtiketi(count: number): string {
  return `${count} fotoğraf daha`;
}

/** Kanal kartını videodan ayıran rozet. */
export const youtubeKanalRozeti = "Kanal";

/** Dikey video rozeti. */
export const youtubeShortsRozeti = "Shorts";

/** Kanal kartındaki akış satırının üst başlığı (plan KTD36). */
export const youtubeSonVideoBasligi = "Son video";

/** Başlığı çözülememiş video kartı için yedek metin. */
export const youtubeVideoYedekBasligi = "YouTube videosu";

/** Adı çözülememiş kanal kartı için yedek metin. */
export const youtubeKanalYedekBasligi = "YouTube kanalı";

/* ------------------------------------------------------------------ *
 * Yerinde oynatma (facade → iframe).
 *
 * Kart açılışta ÜÇÜNCÜ TARAFA HİÇ İSTEK ATMAZ: görünen şey bizim
 * proxy'lediğimiz kapak. Oynatıcı ancak kullanıcı tıklayınca doğar, yani
 * YouTube/Spotify çerezi ziyaretçinin bilinçli bir eylemiyle yazılır.
 * "Bilinçli" olması için ne olacağının ÖNCEDEN söylenmesi gerekiyor —
 * aşağıdaki iki metin bunun için var: biri kartta görünür (yer olan
 * boyutlarda), diğeri oynat tuşunun erişilebilir adı ve `title`'ıdır.
 * ------------------------------------------------------------------ */

/** Kartta görünen kısa satır (yalnız yer olan boyutlarda; CSS karar verir). */
export const youtubeGommeUyarisi = "Oynatınca YouTube'a bağlanılır";

/** Spotify karşılığı. */
export const spotifyGommeUyarisi = "Oynatınca Spotify'a bağlanılır";

/** Oynat tuşunun ekran okuyucu adı ve imleç ipucu — uyarıyı da taşır. */
export function youtubeOynatEtiketi(title: string): string {
  return `Oynat: ${title} — ${youtubeGommeUyarisi}`;
}

/** Spotify karşılığı. */
export function spotifyOynatEtiketi(title: string): string {
  return `Oynat: ${title} — ${spotifyGommeUyarisi}`;
}

/** `<iframe title>`: ekran okuyucu çerçeveyi bu adla duyurur. */
export function youtubeOynaticiBasligi(title: string): string {
  return `${title} — YouTube oynatıcı`;
}

/** Spotify karşılığı. */
export function spotifyOynaticiBasligi(title: string): string {
  return `${title} — Spotify oynatıcı`;
}

/** Başlığı çözülememiş Spotify kartı için yedek metin. */
export const spotifyYedekBasligi = "Spotify içeriği";

/**
 * Tür rozeti. Sanatçı adı için yuva YOK (oEmbed vermiyor); rozet, kartın
 * neyi çaldığını söyleyen tek işaret olduğu için her boyutta basılır.
 *
 * `Record` yerine `switch`: şemaya yeni bir tür eklenirse burası derleme
 * hatası verir (bkz. `spotifyKindSchema`).
 */
export function spotifyTurRozeti(kind: SpotifyKind): string {
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
}

function ondalik(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  if (rounded >= 10) return String(Math.round(rounded));
  return String(rounded).replace(".", ",");
}

/** "842" / "1,2 B" / "3,4 Mn" / "1,1 Mr" */
function kisaSayi(count: number): string {
  if (count < 1_000) return String(count);
  if (count < 1_000_000) return `${ondalik(count / 1_000)} B`;
  if (count < 1_000_000_000) return `${ondalik(count / 1_000_000)} Mn`;
  return `${ondalik(count / 1_000_000_000)} Mr`;
}

/** "1,2 Mn görüntülenme"; sayı okunamazsa boş. */
export function youtubeGoruntulenme(count: number): string {
  if (!Number.isFinite(count) || count < 0) return "";
  return `${kisaSayi(Math.floor(count))} görüntülenme`;
}

/**
 * "bugün" / "dün" / "3 gün önce" / "2 hafta önce" / "5 ay önce" / "1 yıl önce".
 * `now` dışarıdan verilir ki fonksiyon saf kalsın ve test edilebilsin.
 */
export function youtubeYayinZamani(isoDate: string, now: number): string {
  const published = Date.parse(isoDate);
  if (!Number.isFinite(published)) return "";
  const days = Math.floor((now - published) / 86_400_000);
  if (days < 0) return "";
  if (days === 0) return "bugün";
  if (days === 1) return "dün";
  if (days < 7) return `${days} gün önce`;
  if (days < 30) return `${Math.floor(days / 7)} hafta önce`;
  if (days < 365) return `${Math.floor(days / 30)} ay önce`;
  return `${Math.floor(days / 365)} yıl önce`;
}
