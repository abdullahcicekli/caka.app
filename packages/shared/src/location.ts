// Konum bloğunun saf kuralları: koordinat doğrulama/yuvarlama, statik harita
// adresi kurma, saat dilimi biçimleme ve coğrafi kodlama yanıtı ayrıştırma.
// Ağ çağrısı YOK — çağrı katmanı `apps/web/server/location.ts`.
//
// NEDEN BU KATMAN VAR: `packages/shared` tek test edilebilir paket
// (AGENTS.md). Buradaki dört kural da sessizce yanlış olabilecek türden:
// yuvarlama gizlilik kararıdır, saat biçimleme hidrasyonla ilgilidir, adres
// kurma bir dış servisin sözleşmesidir, ayrıştırma da yabancı JSON okur.
//
// KULLANICIYA GÖRÜNEN METİN TAŞIMAZ (Değişmez #5): saat "2:31" gibi sayısal
// parçalar hâlinde döner, "öğleden sonra" gibi sözcükleri katalog kurar.

/**
 * Koordinat kaç ondalıkla saklanır.
 *
 * GİZLİLİK KARARI: 2 ondalık ≈ 1,1 km. Bu, "İstanbul'un Kadıköy tarafı"
 * çözünürlüğüdür — sokağı değil semti gösterir. Ev adresi hassas veridir ve
 * kullanıcı bir harita kartı koyarken kendi kapısını yayınladığını fark
 * etmeyebilir; bu yüzden yuvarlama İSTEĞE BAĞLI DEĞİL, kayıt yolunun
 * zorunlu bir adımıdır (`server/location.ts` sonucu buradan geçirir).
 *
 * Neden 3 değil: 3 ondalık 110 m eder, yani bir sokak. Neden 1 değil:
 * 11 km bir şehri kaydırır, kart yanlış yeri gösterirdi.
 */
export const LOCATION_COORD_PRECISION = 2;

/** Yuvarlama adımının metre karşılığı (ekvatorda); editör metni bunu yazar. */
export const LOCATION_COORD_METERS = 1100;

/**
 * Koordinatı saklama çözünürlüğüne indirir. `-0` bilinçli olarak `0`'a
 * çekilir: JSON'da `-0` `0` olarak serileşir ve gidiş-dönüşte değer
 * değişmiş görünürdü.
 */
export function roundCoordinate(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** LOCATION_COORD_PRECISION;
  const rounded = Math.round(value * factor) / factor;
  return rounded === 0 ? 0 : rounded;
}

export function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

/**
 * IANA saat dilimi kimliğinin ŞEKLİ. Listeye karşı doğrulanmaz (liste
 * çalışma zamanında yok ve gömmek yüzlerce satır eder); amaç, kimliğin
 * `Intl.DateTimeFormat`'a ve adres kurmaya güvenle verilebilmesi.
 * "UTC", "Europe/Istanbul", "America/Argentina/Buenos_Aires" geçer.
 */
const TIME_ZONE_PATTERN = /^[A-Za-z][A-Za-z0-9_+-]*(?:\/[A-Za-z0-9_+-]+){0,2}$/;

export function isValidTimeZone(value: string): boolean {
  return value.length > 0 && value.length <= 64 && TIME_ZONE_PATTERN.test(value);
}

/**
 * Kartın iki kademesi. "Uzak" ülke/bölge ölçeği, "yakın" şehir ölçeği;
 * yakınlaşma efekti bu iki KARE arasında yapılır (ara kare yok — statik
 * görüntüyle sürekli zoom mümkün değil ve iki kademe referans tasarımın
 * kendisi).
 *
 * Ölçüm (Web Mercator): z=4'te bir kare ~2.700 km enine, yani Türkiye
 * komşularıyla birlikte görünüyor; z=11'de ~19 km, yani şehir ve ilçeleri.
 */
export const LOCATION_ZOOM = { far: 4, near: 11 } as const;
export type LocationZoomStep = keyof typeof LOCATION_ZOOM;

export const LOCATION_ZOOM_STEPS = ["far", "near"] as const;

/**
 * Statik harita karesinin İSTENEN ölçüsü (nokta cinsinden; sağlayıcıdan
 * `@2x` istendiği için gerçek piksel iki katı → 1024×768).
 *
 * 4:3 seçildi çünkü kart 4×4 (368×324, oran 1,14) ile 8×4 (748×324, oran
 * 2,31) arasında değişebiliyor ve kare `object-fit: cover` ile yerleşiyor;
 * 4:3 iki uçta da en az kırpılan ara oran. Daha büyüğü hem kredi hem bant
 * genişliği demek, daha küçüğü 748px'lik kartta bulanıklaşıyor.
 */
export const LOCATION_FRAME = { width: 512, height: 384 } as const;

// ---------------------------------------------------------------------------
// Statik harita karesi
// ---------------------------------------------------------------------------

/**
 * Harita karesinin `signedImages` eşlemesindeki anahtarı. Adres sağlayıcı
 * jetonunu taşıdığı için render sırasında saf bir fonksiyonla türetilemez
 * (jeton yalnız sunucu ortamında var); loader'da bir kez kurulup eşlemeyle
 * bileşene taşınır — `faviconImageKey` ile aynı desen.
 *
 * ANAHTAR BLOK KİMLİĞİ DEĞİL KOORDİNATTIR. Blok kimliğine bağlansaydı
 * editörde bayat bir kare gösterilebilirdi: kullanıcı mevcut bir konum
 * bloğunun yerini değiştirdiğinde anahtar aynı kalır ve kart, kaydedip
 * sayfayı yenileyene kadar **eski şehrin haritasını** çizmeye devam ederdi
 * (hakem incelemesinde bulundu). Koordinatla anahtarlandığında bayat girdi
 * hiç eşleşmez; en kötü hâl, kaydedilene kadar haritasız tasarım.
 */
export function mapFrameImageKey(
  step: LocationZoomStep,
  lat: number,
  lon: number,
): string {
  return `map-${step}@${lat},${lon}`;
}

/**
 * Sağlayıcının statik harita adresi — **ziyaretçinin tarayıcısı doğrudan bu
 * adrese bağlanır**.
 *
 * SAĞLAYICI: **Mapbox**, Static Images API, `dark-v11` stili.
 *
 * NEDEN PROXY YOK (mimari kararın dayanağı): Mapbox Product Terms (21 Temmuz
 * 2026) §2.8.1 kareyi sunucuda önbelleğe alıp kendi alan adımızdan servis
 * etmeyi AÇIKÇA yasaklıyor — "Customer shall not distribute Licensed Map
 * Content, including from a cache, by proxying, or by using a screenshot or
 * other static image instead of accessing Licensed Map Content directly from
 * the Mapping APIs." §1.9(iv)-(v) aynı şeyi tekrar eder: içerik "directly
 * from Mapbox APIs" alınır, "export, download, cache or store" edilemez.
 * İzin verilen tek önbellek SON KULLANICININ CİHAZINDA ve 30 günlüktür,
 * üstelik "directly from the Mapping APIs" doldurulmak zorundadır — yani
 * tarayıcının kendi HTTP önbelleği. Bu yüzden `/api/harita` ucu kaldırıldı;
 * yerine tarayıcının doğrudan çektiği bir `<img src>` var.
 *
 * GİZLİLİK BEDELİ, açıkça yazılıdır: konum kartı taşıyan bir profil
 * görüntülendiğinde ziyaretçinin IP adresi ve User Agent'ı Mapbox'a ulaşır.
 * `docs/legal/vendor-register.md` A bölümü, `/gizlilik` §6 ve
 * `/cerez-politikasi` bunu ifşa eder.
 *
 * JETON HERKESE AÇIKTIR (`pk.*`) ve HTML'e basılır — Değişmez #6 anlamında
 * sır değildir, ama korumasız da bırakılmaz: jetona Mapbox panelinden URL
 * kısıtlaması takılır (yalnız `caka.app` ve `localhost`), aksi hâlde yabancı
 * siteler bizim kotamızdan harita çeker. Kısıtlama `Referer` başlığıyla
 * uygulanır; bu yüzden `<img>` referrer göndermek zorundadır (bileşende
 * `referrerPolicy="strict-origin-when-cross-origin"`). Jeton tanımsızsa
 * özellik KAPALIDIR ve kart haritasız tasarımına düşer (fail-closed).
 *
 * `attribution=false&logo=false`: gömülü atıf kapatılır ve yükümlülük bize
 * geçer (`MAP_ATTRIBUTION_LINKS`). Zorunluydu, tercih değil: kare kartta
 * `object-fit: cover` ile kırpılıyor ve yakınlaşma efektinde ölçekleniyor —
 * görüntüye gömülü atıf kadraj dışında kalır, yani hiç görünmez.
 *
 * İŞARETÇİ SAĞLAYICIDAN İSTENMEZ: nokta CSS ile çizilir. Böylece hem marka
 * token'larıyla aynı renkte olur hem de adres kısalır.
 */
export function mapboxStaticMapUrl(options: {
  lat: number;
  lon: number;
  zoom: number;
  width: number;
  height: number;
  /** Herkese açık `pk.*` jetonu; tarayıcıya çıkar. */
  token: string;
  /** Retina kareler için `@2x`. */
  retina?: boolean;
}): string {
  const size = `${options.width}x${options.height}${options.retina === false ? "" : "@2x"}`;
  // Mapbox merkezi ENLEM DEĞİL BOYLAMLA başlatır (`{lon},{lat},{zoom}`);
  // ters yazılırsa adres geçerli kalır ama başka bir yerin haritası gelir.
  // Yön (bearing) ve eğim (pitch) açıkça sıfırlanır ki sağlayıcı varsayılanı
  // değişse bile kare aynı kalsın.
  const center = `${options.lon},${options.lat},${options.zoom},0,0`;
  const query = new URLSearchParams({
    attribution: "false",
    logo: "false",
    access_token: options.token,
  });
  return `https://api.mapbox.com/styles/v1/mapbox/${MAPBOX_MAP_STYLE}/static/${center}/${size}?${query.toString()}`;
}

/**
 * Koyu, sakin, etiketleri okunur bir OSM stili — referans tasarımın istediği
 * görünüm. Mapbox'ın `navigation-night-v1` stili sürüş için renklendirilmiş
 * (turuncu yollar), `satellite-streets-v12` uydu görüntüsü.
 */
export const MAPBOX_MAP_STYLE = "dark-v11";

/**
 * Kartta GÖRÜNÜR olmak zorunda olan atıf — kare `attribution=false&logo=false`
 * ile isteniyor, yükümlülük bize geçiyor. Mapbox Product Terms §1.4.1 atfın
 * "© Mapbox" ve "© OpenStreetMap" bağlantılarını, §1.4.2 de "Improve this
 * map" bağlantısını istiyor; sağlayıcının atıf kılavuzu statik görseller için
 * aynı üçlüyü "in a textual description near the image" diye tarif ediyor.
 *
 * ÇEVRİLMEZ ve bu yüzden katalogda değil: metinler sağlayıcının şartlarında
 * BİREBİR yazılı (marka adları + tanımlı bağlantı etiketi). Çevirseydik
 * yükümlülüğü karşılamış olmazdık.
 */
export const MAP_ATTRIBUTION_LINKS = [
  { label: "© Mapbox", href: "https://www.mapbox.com/about/maps/" },
  { label: "© OpenStreetMap", href: "https://www.openstreetmap.org/copyright" },
  { label: "Improve this map", href: "https://apps.mapbox.com/feedback/" },
] as const;

/**
 * Coğrafi kodlamanın (Photon/OSM) atfı. Ayrı, çünkü haritayı çizen veriyle
 * arama sonucunu veren veri aynı sağlayıcıdan gelmiyor; ODbL kaynağın
 * belirtilmesini istiyor ve editör bunu arama kutusunun altında yazar.
 */
export const GEOCODE_ATTRIBUTION = "© OpenStreetMap contributors — Photon (Komoot)";

// ---------------------------------------------------------------------------
// Saat
// ---------------------------------------------------------------------------

/**
 * Bir saat diliminde o anın saat/dakikası ve UTC farkı.
 *
 * NEDEN SAYI, NEDEN METİN DEĞİL: `Intl.DateTimeFormat().format()` çıktısı
 * ortama göre değişiyor (ICU sürümü AM/PM'den önce dar boşluk koyabiliyor)
 * ve bu depoda tarih/sayı biçimleyicileri bu yüzden zaten elle yazılıyor
 * (bkz. `app/content/widget/shared.ts`). Burada `Intl` yalnız SAYI çıkarmak
 * için kullanılır; cümleyi katalog kurar.
 */
export interface LocalClock {
  /** 0–23 */
  hour: number;
  /** 0–59 */
  minute: number;
  /** UTC'ye göre dakika farkı; +03:00 → 180, -04:30 → -270. */
  offsetMinutes: number;
}

/**
 * `Intl.DateTimeFormat.formatToParts` çıktısından saat/dakika okur.
 *
 * Ayrı ve saf tutulmasının sebebi test: gerçek `Intl` yerine sabit parçalar
 * verip sınır durumlarını (gece yarısı "24", eksik parça) doğrulayabiliyoruz.
 */
export function clockFromParts(parts: readonly { type: string; value: string }[]): {
  hour: number;
  minute: number;
} | null {
  const find = (type: string) => parts.find((part) => part.type === type)?.value;
  const hourText = find("hour");
  const minuteText = find("minute");
  if (hourText === undefined || minuteText === undefined) return null;
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  // `hourCycle: "h23"` istenmesine rağmen bazı ortamlar gece yarısını "24"
  // veriyor (h24 davranışı). 24 → 0; aksi hâlde kart "24:05" yazardı.
  const normalized = hour === 24 ? 0 : hour;
  if (normalized < 0 || normalized > 23 || minute < 0 || minute > 59) return null;
  return { hour: normalized, minute };
}

/**
 * Bir saat diliminin UTC farkını DAKİKA olarak verir.
 *
 * Yaz saati yüzünden fark sabit değildir, bu yüzden kayıtta SAKLANMAZ:
 * yalnız saat dilimi kimliği saklanır ve fark render anında hesaplanır.
 * Hesap, aynı anın UTC ve hedef dilimdeki "duvar saati" farkından çıkar.
 */
export function timeZoneOffsetMinutes(timeZone: string, at: Date = new Date()): number | null {
  let formatted: string;
  try {
    formatted = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(at);
  } catch {
    // Tanınmayan saat dilimi: kart saat pilini hiç göstermez.
    return null;
  }
  const match = formatted.match(/(\d{2})\/(\d{2})\/(\d{4}),?\s+(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, month, day, year, hour, minute, second] = match;
  const wall = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour) === 24 ? 0 : Number(hour),
    Number(minute),
    Number(second),
  );
  // Saniye altı fark yuvarlansın diye tam dakikaya çekilir.
  return Math.round((wall - at.getTime()) / 60_000);
}

/** `180` → `"+3"`, `-270` → `"-4:30"`, `0` → `"+0"`. */
export function formatUtcOffset(offsetMinutes: number): string {
  const sign = offsetMinutes < 0 ? "-" : "+";
  const total = Math.abs(offsetMinutes);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return minutes === 0
    ? `${sign}${hours}`
    : `${sign}${hours}:${String(minutes).padStart(2, "0")}`;
}

/**
 * O saat diliminde şu an gece mi? Kartın ay/güneş işareti buna bakar.
 * Sınırlar bilinçli olarak kaba: 6'dan önce ve 20'den sonra gece.
 */
export function isNightHour(hour: number): boolean {
  return hour < 6 || hour >= 20;
}

/**
 * Saat dilimindeki güncel saati okur. `Intl` erişimi burada, tek yerde.
 * Başarısızlıkta `null` — çağıran kart pilini hiç basmaz.
 *
 * SUNUCUDA ÇAĞRILMAZ: çıktı zamana bağlı olduğu için SSR ile hidrasyon
 * arasında değişir. Kart bunu `useEffect` içinde, bağlandıktan sonra çağırır
 * (bkz. `components/location-card.tsx`).
 */
export function readLocalClock(timeZone: string, at: Date = new Date()): LocalClock | null {
  if (!isValidTimeZone(timeZone)) return null;
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(at);
  } catch {
    return null;
  }
  const clock = clockFromParts(parts);
  if (!clock) return null;
  const offsetMinutes = timeZoneOffsetMinutes(timeZone, at);
  if (offsetMinutes === null) return null;
  return { ...clock, offsetMinutes };
}

// ---------------------------------------------------------------------------
// Coğrafi kodlama yanıtı
// ---------------------------------------------------------------------------

/**
 * Editörün arama listesinde görünen ve seçilince bloğa yazılan sonuç.
 * Kayıtta yalnız bu alanlar durur; render bir daha arama YAPMAZ.
 */
export interface LocationSuggestion {
  /** Kartta görünen ad: "Kadıköy, İstanbul". */
  label: string;
  /** Ülke adı (sağlayıcının verdiği hâliyle). */
  country: string;
  /** ISO 3166-1 alpha-2, büyük harf; yoksa boş. */
  countryCode: string;
  lat: number;
  lon: number;
  /** IANA kimliği; sağlayıcı vermezse boş (kart saat pilini basmaz). */
  timeZone: string;
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Photon (Komoot) yanıtını — GeoJSON FeatureCollection —
 * `LocationSuggestion` listesine indirir.
 *
 * NEDEN PHOTON: anahtarsız. Ürünün yerleşik kararı (plan KD5) vendor API
 * anahtarı almamak; YouTube ve Spotify çözümleyicileri de bu yüzden
 * anahtarsız uçlar kullanıyor. Nominatim'in kullanım politikası **otomatik
 * tamamlamayı açıkça yasaklıyor** ("you must not implement such a service on
 * the client side using the API"), yani yazdıkça arayan bir kutu orada
 * mümkün değildi. Photon aynı OSM verisini tam da bu iş için sunuyor ve
 * sonucun saklanmasına dair bir yasağı yok — veri ODbL, yükümlülük atıftan
 * ibaret (`GEOCODE_ATTRIBUTION`).
 *
 * SAAT DİLİMİ BURADAN GELMEZ: Photon vermiyor. Koordinattan ÇEVRİMDIŞI
 * hesaplanıp (`server/location.ts`, `@photostructure/tz-lookup`) sonuca
 * eklenir. Yani saat dilimi hiçbir tedarikçiye bağlı değil.
 *
 * SAĞLAM OKUMA: alanların hiçbiri zorunlu sayılmaz. Adı kurulamayan ya da
 * koordinatı geçersiz olan sonuç sessizce DÜŞÜRÜLÜR — yarım bir öneri
 * seçilirse blok yarım kaydedilirdi.
 */
export function parseGeocodeResponse(raw: unknown, limit = 6): LocationSuggestion[] {
  if (!raw || typeof raw !== "object") return [];
  const features = (raw as { features?: unknown }).features;
  if (!Array.isArray(features)) return [];

  const out: LocationSuggestion[] = [];
  const seen = new Set<string>();
  for (const feature of features) {
    if (out.length >= limit) break;
    if (!feature || typeof feature !== "object") continue;
    const props = (feature as { properties?: unknown }).properties;
    const geometry = (feature as { geometry?: unknown }).geometry;
    if (!props || typeof props !== "object") continue;
    const p = props as Record<string, unknown>;

    // GeoJSON sırası [lon, lat] — ters okumak koordinatı sessizce dünyanın
    // öbür ucuna taşırdı.
    const coordinates = (geometry as { coordinates?: unknown } | undefined)?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) continue;
    const lon = typeof coordinates[0] === "number" ? coordinates[0] : Number.NaN;
    const lat = typeof coordinates[1] === "number" ? coordinates[1] : Number.NaN;
    if (!isValidLatitude(lat) || !isValidLongitude(lon)) continue;

    const country = text(p.country, 80);
    const label = buildLocationLabel({
      city: text(p.city, 80),
      county: text(p.county, 80),
      district: text(p.district, 80),
      state: text(p.state, 80),
      name: text(p.name, 80),
      country,
    });
    if (!label) continue;

    // Kırpma DOĞRULAMADAN SONRA olmalı: 2'ye kırpsaydık "deu" gibi hatalı bir
    // değer sessizce geçerli "DE"ye dönüşürdü.
    const code = text(p.countrycode, 8).toUpperCase();
    const rounded = { lat: roundCoordinate(lat), lon: roundCoordinate(lon) };
    // Photon aynı yeri birden çok OSM nesnesiyle (düğüm + ilişki) döndürebiliyor;
    // yuvarlamadan sonra ikisi de aynı satıra iner ve listede tekrar görünürdü.
    const key = `${label}|${rounded.lat}|${rounded.lon}`;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      label,
      country,
      countryCode: /^[A-Z]{2}$/.test(code) ? code : "",
      // Yuvarlama BURADA: uç yalnız bu fonksiyonun çıktısını döner, yani tam
      // çözünürlüklü koordinat editöre hiç ulaşmaz.
      ...rounded,
      // Çağıran doldurur (çevrimdışı hesap); ayrıştırıcı saat dilimi bilmez.
      timeZone: "",
    });
  }
  return out;
}

/**
 * "Kadıköy, İstanbul" — eşleşen yerin ADI, sonra onu konumlandıran bir üst
 * kademe. En fazla iki parça; ülke ayrı alanda taşınır.
 *
 * SIRA ÖNEMLİ ve ölçümle düzeltildi: `name` EN BAŞTA. Photon, eşleşen yerin
 * kendi adını `name` alanına, onu içeren şehri `city`/`state` alanına
 * koyuyor. Önce `city`'ye bakıldığında "kadikoy" araması **"İzmit, Kocaeli"**
 * diye görünüyordu — kullanıcının aradığı ad listede hiç yoktu (canlı yanıtla
 * doğrulandı, 2026-08-19). Bu, yanlış yeri seçtirecek türden bir kusurdu.
 *
 * `formatted` (sağlayıcı verirse) sokak ve posta kodu da içerebiliyor
 * ("Moda Cd. 12, 34710 Kadıköy/İstanbul"). Kart bunu basmamalı: kullanıcı bir
 * semt aradığında bile tam adres dönebilir ve ev adresi yayınlanmış olurdu.
 * Bu yüzden ad İDARİ alanlardan kurulur; `formatted` yalnız hiçbiri yoksa ve
 * virgülsüz tek parçaysa kullanılır.
 */
export function buildLocationLabel(parts: {
  city?: string;
  county?: string;
  district?: string;
  state?: string;
  name?: string;
  country?: string;
  formatted?: string;
}): string {
  const city = parts.city ?? "";
  const county = parts.county ?? "";
  const district = parts.district ?? "";
  const state = parts.state ?? "";
  const name = parts.name ?? "";
  const country = parts.country ?? "";

  const primary = name || district || city || county || state;
  if (!primary) {
    const formatted = parts.formatted ?? "";
    // Virgüllü `formatted` tam adres demek; parçalanamıyorsa kullanılmaz.
    return formatted && !formatted.includes(",") ? formatted : "";
  }
  // İkinci parça, birinciyi konumlandıran en dar üst kademe. Hepsi birinciyle
  // aynıysa (ör. şehir devleti) ülkeye düşer; o da aynıysa tek parça kalır.
  const secondary =
    [city, county, state, country].find((value) => value && value !== primary) ?? "";
  return secondary ? `${primary}, ${secondary}` : primary;
}
