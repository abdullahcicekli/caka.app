// Konum arama çağrı katmanı: saf kurallar `@caka/shared/location`'da, ağ
// burada.
//
// BU YOL YALNIZ EDİTÖRDE ÇALIŞIR. Ziyaretçi bir arama tetikleyemez: uç
// oturum ister (`server/location-api.ts`). Render hiç arama yapmaz — sonuç
// kayıt anında bir kez çözülür ve blokta durur (YouTube/Spotify'daki KTD34
// deseni).
//
// SAĞLAYICI: **Photon (Komoot)**, anahtarsız. Nominatim'in kullanım
// politikası yazdıkça-arama (autocomplete) uygulamayı AÇIKÇA yasakladığı
// için orası baştan elendi; Photon aynı OSM verisini tam da bu iş için
// sunuyor ve sonucun saklanmasına dair bir yasağı yok. Anahtarsız oluşu
// plan KD5 ile uyumlu (ürün vendor API anahtarı almıyor) — tek jetonlu
// tedarikçi harita KARESİ (Mapbox) ve o jeton da herkese açık bir `pk.*`.
//
// SAAT DİLİMİ TEDARİKÇİDEN GELMEZ: koordinattan ÇEVRİMDIŞI hesaplanır
// (`@photostructure/tz-lookup`, CC0, ~28 KB gzip, sıfır bağımlılık). Alternatif
// `geo-tz` 73 MB ve `fs` kullanıyor — Worker'da çalışmaz. Sonuç: kartın
// "konumun yerel saati" vaadi hiçbir dış servise bağlı değil ve saat dilimi
// sağlayıcı kotasına takılıp boş kalmaz.
//
// HATA YUTULMAZ: arama kullanıcının gözünün önünde çalışıyor; başarısızlık
// "sonuç yok" değil, "servis yanıt vermedi" diye söylenir.
import tzLookup from "@photostructure/tz-lookup";

import {
  type LocationSuggestion,
  isValidTimeZone,
  parseGeocodeResponse,
} from "@caka/shared";

const FETCH_TIMEOUT_MS = 5000;
/** Ölçüm: 6 sonuçlu Photon yanıtı ~10 KB. Tavan bolca üstünde. */
const MAX_BYTES = 256 * 1024;
/** Editörün listesinde gösterilen öneri sayısı. */
export const LOCATION_SUGGESTION_LIMIT = 6;
/** Arama metni tavanı; uzun girdi sağlayıcıya hiç gitmez. */
export const LOCATION_QUERY_MAX = 120;

/**
 * Photon'un politikası kendini tanıtan bir istemci istiyor ("please be
 * fair"); GitHub kazımasındaki (`server/github.ts`) User-Agent'la aynı
 * biçim.
 */
const USER_AGENT = "caka.app (+https://caka.app; profile location widget)";

/** Sağlayıcının yalnız bu host'una istek atılır (SSRF kapısı). */
const GEOCODE_HOST = "photon.komoot.io";

/**
 * Photon'un `osm_tag` süzgeci: sonuçları YERLEŞİM YERLERİYLE sınırlar.
 *
 * GİZLİLİK KARARI, kozmetik değil: süzgeç olmasa "Moda Caddesi 12" de
 * çözülürdü ve kullanıcı kendi kapısını yayınlayabilirdi. `place:city`,
 * `place:town`, `place:village`, `place:suburb` ve `place:borough` ilçe/semt
 * kademesine kadar iner, sokak ve binaya inmez. Koordinat ayrıca
 * `roundCoordinate` ile 2 ondalığa (≈1,1 km) indirilir.
 */
const PLACE_TAGS = [
  "place:city",
  "place:town",
  "place:village",
  "place:borough",
  "place:suburb",
  "place:state",
  "place:country",
] as const;

export type LocationSearchResult =
  | { status: "ok"; results: LocationSuggestion[] }
  /** Ağ, zaman aşımı, kısıtlama ya da bozuk gövde. */
  | { status: "unavailable" };

/**
 * Koordinatın IANA saat dilimi — çevrimdışı, dış istek yok.
 *
 * Okyanus ortası gibi verisiz noktalarda kütüphane `Etc/GMT±N` döndürüyor;
 * bu geçerli bir kimlik ve `Intl` onu tanıyor, o yüzden reddedilmez. Tanımsız
 * bir sonuç ise boş dize olur ve kart saat pilini hiç basmaz.
 */
export function timeZoneForCoordinates(lat: number, lon: number): string {
  try {
    const zone = tzLookup(lat, lon);
    return typeof zone === "string" && isValidTimeZone(zone) ? zone : "";
  } catch {
    return "";
  }
}

/**
 * Aramayı sağlayıcıya sorar, sonucu `LocationSuggestion` listesine indirir ve
 * her satıra çevrimdışı hesaplanan saat dilimini ekler.
 *
 * `lang` ziyaretçinin değil DÜZENLEYENİN dili: adları kendi dilinde arıyor ve
 * kendi dilinde görüyor. Kartta görünen ad ise seçim anındaki hâliyle DONAR —
 * profil beş dilde açılıyor ve yer adının ziyaretçiye göre değişmesi,
 * kaydedilen veriyle çelişirdi.
 */
export async function searchLocations(
  query: string,
  lang: string,
): Promise<LocationSearchResult> {
  const text = query.trim().slice(0, LOCATION_QUERY_MAX);
  if (!text) return { status: "ok", results: [] };

  const url = new URL(`https://${GEOCODE_HOST}/api`);
  url.searchParams.set("q", text);
  url.searchParams.set("limit", String(LOCATION_SUGGESTION_LIMIT * 2));
  // Photon yalnız birkaç dil biliyor (de/en/fr/it); tanımadığı bir kodda
  // 400 dönüyor, o yüzden desteklenmeyen diller `en`e düşer. Ad zaten
  // çoğunlukla yerel dilde geliyor (OSM `name` etiketi).
  url.searchParams.set("lang", PHOTON_LANGS.has(lang) ? lang : "en");
  for (const tag of PLACE_TAGS) url.searchParams.append("osm_tag", tag);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      // Yönlendirme beklenmiyor; "manual" ile 3xx doğrudan başarısızlıktır.
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    });
  } catch {
    return { status: "unavailable" };
  }
  if (!response.ok) {
    await response.body?.cancel().catch(() => {});
    return { status: "unavailable" };
  }

  const body = await readCappedText(response, MAX_BYTES);
  let parsed: LocationSuggestion[];
  try {
    parsed = parseGeocodeResponse(JSON.parse(body), LOCATION_SUGGESTION_LIMIT);
  } catch {
    return { status: "unavailable" };
  }
  return {
    status: "ok",
    results: parsed.map((result) => ({
      ...result,
      timeZone: timeZoneForCoordinates(result.lat, result.lon),
    })),
  };
}

/** Photon'un `lang` parametresinin kabul ettiği kodlar (ölçüldü 2026-08-19). */
const PHOTON_LANGS = new Set(["de", "en", "fr", "it"]);

/** Gövdeyi tavana kadar metin olarak okur; tavan aşılırsa okuma kesilir. */
async function readCappedText(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder("utf-8", { fatal: false });
  let text = "";
  let total = 0;
  try {
    while (total < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      text += decoder.decode(value, { stream: true });
    }
  } catch {
    // Yarım gövde: elde ne varsa onunla ayrıştırmayı dene.
  }
  await reader.cancel().catch(() => {});
  // Son flush: akışın sonundaki çok baytlı karakter aksi hâlde düşerdi
  // ("Kadıköy" → "Kadıkö").
  return text + decoder.decode();
}
