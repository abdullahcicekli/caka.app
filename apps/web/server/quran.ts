// Kur'an metni çağrı katmanı: saf kurallar `@caka/shared/quran`'da, ağ burada.
//
// KAYNAK VE LİSANS (2026-08-19'da denetlendi, ayrıntı `docs/legal/vendor-register.md`):
//
//   • Görev tanımında önerilen `github.com/diyanet-bid/Kuran` VERİ DEPOSU
//     DEĞİL. Apache-2.0 lisansı yalnız uygulama koduna ait; depo tek bir ayet
//     taşımıyor, metni `DIB_KURAN_API_BASE_URL` + `DIB_KURAN_API_TOKEN` ile
//     korunan kapalı bir Diyanet ucundan çekiyor. Token başvuruya bağlı,
//     metnin kendisi için bir kullanım izni yayımlanmamış → kullanılamadı.
//
//   • Arapça: `ara-quranuthmanihaf` — Osmanî hat (Hafs), kaynağı Kral Fahd
//     Kur'an Basım Kompleksi. Kur'an'ın Arapça metni ~1400 yıllık, telifsiz
//     bir metindir; korunan şey dijital edisyonun kendisidir ve kaynak
//     kayıtta gösterilir.
//
//   • Meal: `tur-elmalilihamdiya` — Elmalılı Hamdi Yazır (ö. 27 Mayıs 1942).
//     FSEK m.27 uyarınca koruma süresi (ölüm + 70 yıl) 31.12.2012'de dolmuş,
//     yani meal KAMU MALIDIR. Diyanet İşleri meali BİLİNÇLİ OLARAK
//     KULLANILMADI: güncel bir eser, telifi Diyanet'te ve Tanzil üzerinden
//     dağıtılan kopyası açıkça "yalnız ticari olmayan kullanım" diyor.
//     Çevirmen adı yine de her kartta basılır (`mealTranslator`).
//
//   • Taşıyıcı: fawazahmed0/quran-api (Unlicense) — jsDelivr CDN'inden statik
//     JSON. Anahtar yok, kota yok, üçüncü taraf çerezi yok.
//
// NEREYE DOKUNULUYOR: bu dosyadaki HER istek editörden, oturumlu kullanıcı
// için atılır (`server/quran-api.ts`). Seçilen ayet bloğun verisine yazılır ve
// ziyaretçi sayfası hiçbir dış kaynağa gitmez (R58) — YouTube/Spotify'daki
// "kayıt anında çöz, kayıttan render et" deseninin aynısı.
//
// NEDEN METİN PAKETE GÖMÜLMÜYOR: 6236 ayetin Arapçası 1,6 MB, meali 1,1 MB.
// İkisi Worker paketine girseydi yükleme sınırına dayanırdı; bu yüzden
// dizin (114 sure, ~6 KB) pakette, metin dışarıda.
import {
  AYET_ARABIC_MAX,
  AYET_MEAL_MAX,
  SURAHS,
  foldTurkish,
  truncateVerse,
  verseRefIssue,
} from "@caka/shared";

const CDN_ORIGIN = "https://cdn.jsdelivr.net";
const CDN_BASE = `${CDN_ORIGIN}/gh/fawazahmed0/quran-api@1`;

/** Arapça edisyonu — Osmanî hat, Hafs kıraati. */
export const ARABIC_EDITION = "ara-quranuthmanihaf";
/** Türkçe meal edisyonu. */
export const MEAL_EDITION = "tur-elmalilihamdiya";
/** Kartta ve kayıtta gösterilen çevirmen adı (atıf). */
export const MEAL_TRANSLATOR = "Elmalılı Hamdi Yazır";

const FETCH_TIMEOUT_MS = 5000;
/** Tek ayet dosyaları ölçülen en büyük hâlinde < 3 KB; tavan bolca üstünde. */
const VERSE_MAX_BYTES = 32 * 1024;
/** Meal edisyonunun tamamı 1,1 MB, en büyük tek sure dosyası 98 KB (ölçüldü). */
const EDITION_MAX_BYTES = 4 * 1024 * 1024;
/** Arama sonucu satırlarında gösterilen meal önizlemesinin uzunluğu. */
const SNIPPET_MAX = 160;
/** Bir aramada dönen en fazla satır. */
export const AYET_SEARCH_LIMIT = 12;

export type ResolvedVerse = {
  surah: number;
  verse: number;
  surahName: string;
  arabic: string;
  meal: string;
  mealEdition: string;
  mealTranslator: string;
};

export type VerseSearchHit = {
  surah: number;
  verse: number;
  surahName: string;
  /** Kısaltılmış meal; tam metin ancak seçim yapılınca çekilir. */
  snippet: string;
};

/**
 * Yalnız jsDelivr'e, yalnız https ve varsayılan portla gider. Hedef sabit
 * olduğu için yönlendirme İZLENMEZ: 3xx gelirse istek başarısız sayılır
 * (spotify.ts'teki kapının daha katı hâli — orada oEmbed gerçekten
 * yönlendiriyor, burada gerekçe yok).
 *
 * `redirect: "manual"` + elle 3xx kontrolü, `redirect: "error"` DEĞİL:
 * workerd `"error"`'ü uygulamıyor ve `TypeError` atıyor (ölçüldü — hata
 * `cdnFetch`'in catch'ine düşüp özelliği sessizce kapatıyordu).
 */
async function cdnFetch(path: string): Promise<Response | null> {
  const target = `${CDN_BASE}${path}`;
  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  if (parsed.origin !== CDN_ORIGIN) return null;

  try {
    const response = await fetch(parsed.toString(), {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "application/json" },
      // Metin değişmez: CDN yanıtı kenarda bir gün tutulur, aynı ayet ikinci
      // kez istendiğinde dış istek hiç atılmaz.
      cf: { cacheEverything: true, cacheTtl: 86_400 },
    });
    if (!response.ok) {
      await response.body?.cancel().catch(() => {});
      return null;
    }
    return response;
  } catch {
    return null;
  }
}

/** Gövdeyi tavana kadar okur; tavan aşılırsa okuma kesilir ve null döner. */
async function readCappedJson(response: Response, maxBytes: number): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder("utf-8", { fatal: false });
  let text = "";
  let total = 0;
  let overflow = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > maxBytes) {
        overflow = true;
        break;
      }
      text += decoder.decode(value, { stream: true });
    }
  } catch {
    return null;
  }
  await reader.cancel().catch(() => {});
  if (overflow) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function verseText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const text = (payload as { text?: unknown }).text;
  return typeof text === "string" ? text.trim() : "";
}

/**
 * Tek bir ayetin Arapçasını ve mealini çeker. İki dosya PARALEL istenir:
 * ikisi de küçük, sırayla beklemenin tek etkisi kullanıcının bekleme süresi
 * olurdu. Biri gelmezse blok yarım kalmasın diye o alan boş döner —
 * `blockIssue` zaten sürümün istediği metin yoksa yayını engelliyor.
 */
export async function resolveVerse(surah: number, verse: number): Promise<ResolvedVerse | null> {
  if (verseRefIssue({ surah, verse })) return null;
  const entry = SURAHS[surah - 1];

  const [arabicResponse, mealResponse] = await Promise.all([
    cdnFetch(`/editions/${ARABIC_EDITION}/${surah}/${verse}.json`),
    cdnFetch(`/editions/${MEAL_EDITION}/${surah}/${verse}.json`),
  ]);
  const [arabicPayload, mealPayload] = await Promise.all([
    arabicResponse ? readCappedJson(arabicResponse, VERSE_MAX_BYTES) : null,
    mealResponse ? readCappedJson(mealResponse, VERSE_MAX_BYTES) : null,
  ]);

  const arabic = verseText(arabicPayload);
  const meal = verseText(mealPayload);
  // İkisi de boşsa çözümleme başarısızdır; yarım veri kaydetmenin anlamı yok.
  if (!arabic && !meal) return null;
  // Şema tavanını aşan metin GERİ DÖNÜLMEZ. Bugün böyle bir ayet yok (en uzunu
  // Bakara 282: 1224/1333, tavanlar 1400/1600) — bu, edisyon değiştiğinde
  // devreye girecek bir emniyet. Kesip göndermek daha kötü olurdu: kullanıcı
  // eksik bir ayeti eksik olduğunu bilmeden kaydederdi. Kesmek yerine
  // "kaynak veremedi" demek dürüst olan.
  if (arabic.length > AYET_ARABIC_MAX || meal.length > AYET_MEAL_MAX) return null;

  return {
    surah,
    verse,
    surahName: entry.name,
    arabic,
    meal,
    mealEdition: MEAL_EDITION,
    mealTranslator: MEAL_TRANSLATOR,
  };
}

/**
 * Bir surenin ayetlerini meal önizlemesiyle listeler ("bakara" yazıldığında
 * ya da "bakara 255" ile bir ayete gidildiğinde çevresini göstermek için).
 * `from` verilirse listeleme o ayetten başlar.
 *
 * Tek sure dosyası en büyük hâlinde (Bakara) 98 KB — tam edisyonu (1,1 MB)
 * yüklemeye gerek yok.
 */
export async function listSurahVerses(
  surah: number,
  from = 1,
  limit = AYET_SEARCH_LIMIT,
): Promise<VerseSearchHit[]> {
  const entry = SURAHS[surah - 1];
  if (!entry) return [];
  const response = await cdnFetch(`/editions/${MEAL_EDITION}/${surah}.json`);
  if (!response) return [];
  const payload = await readCappedJson(response, EDITION_MAX_BYTES);
  const rows = (payload as { chapter?: unknown } | null)?.chapter;
  if (!Array.isArray(rows)) return [];

  const hits: VerseSearchHit[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const { verse, text } = row as { verse?: unknown; text?: unknown };
    if (typeof verse !== "number" || typeof text !== "string") continue;
    if (verse < from) continue;
    hits.push({
      surah,
      verse,
      surahName: entry.name,
      snippet: truncateVerse(text, SNIPPET_MAX),
    });
    if (hits.length >= limit) break;
  }
  return hits;
}

type MealIndexEntry = { surah: number; verse: number; text: string; folded: string };

/**
 * Meal edisyonunun tamamı, aranabilir hâlde.
 *
 * NEDEN İZOLATE DÜZEYİNDE ÖNBELLEK: dosya 1,1 MB ve her tuş vuruşunda
 * yeniden ayrıştırılamaz. İkinci arama ölçülen sürede 0 ms.
 *
 * NEDEN SÖZ (PROMISE) DEĞİL, ÇÖZÜLMÜŞ DEĞER SAKLANIYOR: Workers'ta bir
 * isteğin I/O bağlamında doğan bekleyen bir sözü BAŞKA bir istek `await`
 * edemez — workerd "Cannot perform I/O on behalf of a different request"
 * atar. Söz saklamak, soğuk izolatta 1,1 MB inerken gelen ikinci aramayı
 * 500'e düşürürdü. Bunun bedeli, eşzamanlı iki soğuk isteğin dosyayı ayrı
 * ayrı indirmesi; CDN yanıtı zaten kenarda önbellekli olduğu için ucuz.
 *
 * NEDEN D1 YA DA R2 DEĞİL: D1'e yazmak elle SQL seed'i isterdi (Değişmez #3
 * migration'ları yalnız `drizzle-kit generate`e bırakıyor) ve her arama 6236
 * satır okurdu; R2 ise deploy script'inin (Değişmez #11) bilmediği bir
 * yükleme adımı eklerdi — yeni bir ortamda özellik sessizce boş kalırdı.
 * CDN her iki maliyeti de doğurmuyor ve ziyaretçi tarafına hiç dokunmuyor.
 */
let mealIndexCache: MealIndexEntry[] | null = null;

async function loadMealIndex(): Promise<MealIndexEntry[] | null> {
  const response = await cdnFetch(`/editions/${MEAL_EDITION}.min.json`);
  if (!response) return null;
  const payload = await readCappedJson(response, EDITION_MAX_BYTES);
  const rows = (payload as { quran?: unknown } | null)?.quran;
  if (!Array.isArray(rows)) return null;

  const index: MealIndexEntry[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const { chapter, verse, text } = row as { chapter?: unknown; verse?: unknown; text?: unknown };
    if (typeof chapter !== "number" || typeof verse !== "number" || typeof text !== "string") {
      continue;
    }
    index.push({ surah: chapter, verse, text: text.trim(), folded: foldTurkish(text) });
  }
  return index.length > 0 ? index : null;
}

async function mealIndex(): Promise<MealIndexEntry[] | null> {
  if (mealIndexCache) return mealIndexCache;
  const loaded = await loadMealIndex().catch(() => null);
  // Başarısızlık ÖNBELLEĞE ALINMAZ: bir ağ tökezlemesi izolate ömrü boyunca
  // aramayı kapatmamalı.
  if (loaded) mealIndexCache = loaded;
  return loaded;
}

/**
 * Mealde metin araması. Türkçe katlaması `foldTurkish` ile yapılır, yani
 * "sabir" yazan da "sabır" bulur.
 *
 * Sonuçlar mushaf sırasında döner (alaka sıralaması YOK): kullanıcı aradığı
 * ayeti sure/ayet numarasıyla tanıyor, uydurma bir puanlama listeyi
 * öngörülemez kılardı. Tek istisna, eşleşmenin metnin başında olması —
 * o satırlar öne alınır.
 */
export async function searchMeal(query: string, limit = AYET_SEARCH_LIMIT): Promise<VerseSearchHit[]> {
  const needle = foldTurkish(query);
  if (needle.length < 3) return [];
  const index = await mealIndex();
  if (!index) return [];

  const early: MealIndexEntry[] = [];
  const rest: MealIndexEntry[] = [];
  for (const entry of index) {
    const at = entry.folded.indexOf(needle);
    if (at < 0) continue;
    (at < 40 ? early : rest).push(entry);
    // İki kova da dolduğunda taramayı bırak: "ve" gibi çok geçen bir dize
    // aksi hâlde 6236 satırın tamamını gezdirirdi ve sonuç yine ilk 12 satır
    // olurdu.
    if (early.length >= limit || rest.length >= limit) break;
  }
  return [...early, ...rest].slice(0, limit).map((entry) => ({
    surah: entry.surah,
    verse: entry.verse,
    surahName: SURAHS[entry.surah - 1]?.name ?? "",
    snippet: truncateVerse(entry.text, SNIPPET_MAX),
  }));
}
