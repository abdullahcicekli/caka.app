// Belge (CV) bloğunun saf kuralları: tür doğrulaması, dosya adı temizliği ve
// kartın yazdığı biçimlendirmeler. Katman dil BİLMEZ (Değişmez #5) — buradaki
// tek "metin" indirilen dosyanın adıdır ve o bir kimliktir, arayüz kopyası
// değil: aynı dosya her ziyaretçide aynı adla inmelidir.

/** Bir belge en fazla bu kadar olabilir (10 MB). */
export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

/** Saklanan dosya adının üst sınırı; kart ayrıca `shortenFileName` ile kısaltır. */
export const DOCUMENT_FILE_NAME_MAX = 120;

/** Bugün desteklenen tek belge türü. */
export const DOCUMENT_CONTENT_TYPE = "application/pdf";

/**
 * Adı kurtarılamayan belgenin dosya adı. Dile göre DEĞİŞMEZ: bu bir arayüz
 * metni değil, indirilen nesnenin kimliği — aynı dosyanın ziyaretçinin diline
 * göre farklı adla inmesi kafa karıştırırdı.
 */
export const DOCUMENT_FALLBACK_FILE_NAME = "belge.pdf";

/**
 * Gövde gerçekten PDF mi? İSTEMCİNİN `Content-Type`'INA GÜVENİLMEZ: `accept`
 * ve başlık tamamen istemci tarafındadır, `fetch` ile istediğini yazabilir.
 *
 * Kontrol KATI — imza dosyanın ilk baytında aranır. Spec, `%PDF-` başlığının
 * ilk 1024 bayt içinde olmasına da izin verir ve bazı okuyucular bunu kabul
 * eder; biz etmiyoruz. Öne HTML koyup arkaya PDF başlığı iliştiren bir dosya
 * hem PDF hem HTML sayılabilirdi (içerik türü karışıklığı), `nosniff` ve
 * `sandbox` başlıklarının üstüne bir de bu kapıyı kapatmak ucuz.
 */
export function isPdfBytes(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 && // %
    bytes[1] === 0x50 && // P
    bytes[2] === 0x44 && // D
    bytes[3] === 0x46 && // F
    bytes[4] === 0x2d // -
  );
}

/**
 * Yüklenen dosya adını saklanabilir/servis edilebilir hâle getirir.
 *
 * Temizlenenler ve NEDENLERİ:
 *  - yol parçaları (`../`, `C:\…`) — ad hiçbir yerde yol olarak kullanılmıyor
 *    (R2 anahtarı düz UUID, Değişmez #9) ama adın yol gibi görünmesi de gerekmez;
 *  - kontrol karakterleri (CR/LF dahil) — `Content-Disposition` bir HTTP
 *    başlığıdır, satır sonu enjeksiyonu başlık uydurmaya açardı;
 *  - `"` ve `\` — aynı başlığın tırnaklı biçiminden kaçış;
 *  - iki yönlü yazım (bidi) işaretleri — `cv\u202Efdp.exe` numarasıyla uzantı
 *    ters gösterilebiliyor;
 *  - baştaki noktalar — gizli dosya adı üretmesin.
 *
 * Uzantı yoksa `.pdf` eklenir: bugün tek kabul edilen tür bu ve indirilen
 * dosyanın uzantısız inmesi işletim sisteminde açılmamasına yol açardı.
 * Ad tümden kurtarılamıyorsa boş döner — çağıran yedek ada düşer.
 */
export function sanitizeDocumentFileName(input: string): string {
  const base = input.split(/[\\/]/).pop() ?? "";
  const cleaned = base
    // eslint-disable-next-line no-control-regex -- başlık enjeksiyonu kapısı
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\u202a-\u202e\u2066-\u2069]/g, "")
    .replace(/["\\]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^\.+/, "")
    .trim();
  // Yalnız uzantıdan ibaret ad (".pdf", "pdf") kurtarılamaz sayılır; aksi
  // hâlde baştaki nokta kırpıldığı için "pdf.pdf" gibi bir ad üretilirdi.
  if (!cleaned || cleaned.toLowerCase() === "pdf") return "";
  const withExt = /\.pdf$/i.test(cleaned) ? cleaned : `${cleaned}.pdf`;
  if (withExt.length <= DOCUMENT_FILE_NAME_MAX) return withExt;
  return `${withExt.slice(0, DOCUMENT_FILE_NAME_MAX - 4).trimEnd()}.pdf`;
}

const EXT_VALUE_ESCAPES = /['()*]/g;

/**
 * `Content-Disposition` başlığının değeri. İki biçim birden yazılır: ASCII'ye
 * indirgenmiş `filename=` (eski istemciler) ve RFC 5987 `filename*=` (Türkçe
 * karakterler). Ad her hâlükârda `sanitizeDocumentFileName`'den geçirilir —
 * bu fonksiyon bir başlık üretiyor, güvenilmeyen metni oraya olduğu gibi
 * koymak başlık enjeksiyonu olurdu.
 */
export function contentDispositionHeader(
  disposition: "inline" | "attachment",
  fileName: string,
): string {
  const safe = sanitizeDocumentFileName(fileName) || DOCUMENT_FALLBACK_FILE_NAME;
  const ascii = safe.replace(/[^\x20-\x7e]/g, "_");
  const encoded = encodeURIComponent(safe).replace(
    EXT_VALUE_ESCAPES,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `${disposition}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

/**
 * Uzun dosya adını ortadan kısaltır ve UZANTIYI KORUR: "ozgecmis…-2026.pdf".
 * Baştan kesmek "ozgecmis-abdullah-cicek…" gibi iki farklı dosyayı aynı
 * gösterirdi; kullanıcının ayırt ettiği bilgi çoğu zaman sonda (yıl, sürüm).
 * Kırpma CSS'e bırakılamıyor: kart adı iki satıra sarıyor ve `text-overflow`
 * yalnız son satırın sonunu keserdi, uzantı da o kesikte kaybolurdu.
 */
export function shortenFileName(name: string, max: number): string {
  const trimmed = name.trim();
  if (max <= 0) return "";
  if (trimmed.length <= max) return trimmed;
  if (max === 1) return "…";
  const dot = trimmed.lastIndexOf(".");
  // Uzantı yalnız makul uzunluktaysa korunur; noktalı ama uzantısız adlarda
  // (ör. "2026.01.12 guncel ozgecmis") sondaki parça uzantı sayılmamalı.
  const ext = dot > 0 && trimmed.length - dot <= 6 ? trimmed.slice(dot) : "";
  const stem = ext ? trimmed.slice(0, dot) : trimmed;
  const room = max - ext.length - 1;
  if (room <= 0) return `${trimmed.slice(0, max - 1)}…`;
  const head = Math.ceil(room / 2);
  const tail = room - head;
  return `${stem.slice(0, head)}…${tail > 0 ? stem.slice(stem.length - tail) : ""}${ext}`;
}

/**
 * "842 B" / "512 KB" / "1,2 MB". `Intl` KULLANILMAZ (bkz. `content/widget/
 * shared.ts`): çıktı Worker'da ve tarayıcıda birebir aynı olmalı. Ondalık
 * ayırıcı dışarıdan gelir; KB/MB kısaltmaları beş dilde de aynı yazılıyor.
 */
export function formatFileSize(bytes: number, decimal: string): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  const value = Math.floor(bytes);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  const mb = Math.round((value / (1024 * 1024)) * 10) / 10;
  return `${mb >= 10 ? Math.round(mb) : String(mb).replace(".", decimal)} MB`;
}

/**
 * Yükleme tarihi: "12 Ağustos 2026". Ay adları dışarıdan (katalogdan) gelir —
 * bu katman dil bilmez. Zaman dilimi UTC: damga sunucuda üretiliyor ve kartı
 * gören herkes aynı tarihi görmeli (SSR + hidrasyon farkı da doğmaz).
 * Geçersiz/boş damgada boş döner ve kart tarih satırını hiç basmaz.
 */
export function formatUploadDate(
  epochMs: number,
  months: readonly string[],
  pattern: (day: number, month: string, year: number) => string,
): string {
  if (!Number.isFinite(epochMs) || epochMs <= 0) return "";
  const date = new Date(epochMs);
  const month = months[date.getUTCMonth()];
  if (!month) return "";
  return pattern(date.getUTCDate(), month, date.getUTCFullYear());
}
