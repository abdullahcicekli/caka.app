// Yazı (uzun metin) içeriğinin saf sınırları — tek kaynak (R7, R8, R22).
// Sınırlar taslakları da kapsar (R22): taslak da aynı tabloda yaşar, "sonra
// yayınlarım" diyerek sınırın dışına çıkılamaz. Düğüm (blok) doğrulaması
// U4'ün işi; burada yalnız boyut/sayı sabitleri ve gövde boyut denetimi var.

/**
 * Başlık üst sınırı (R8). 120 karakter: `<title>` ve OG başlığı için rahat
 * sığan, tek satır düşünceden uzun bir cümleye yetecek ölçü.
 */
export const POST_TITLE_MAX = 120;

/**
 * Gövdenin (JSON metin) üst sınırı: 50 KB (R7). Mevcut blok başına 8 KB
 * sınırından (layout.ts) AYRIDIR ve onu değiştirmez — bu sınır yazının
 * tamamını kapatır. 50 KB düz metinde ~25-40 sayfa demektir; D1 satırını ve
 * SSR render'ını makul tutar.
 */
export const POST_BODY_MAX_BYTES = 50 * 1024;

/**
 * Profil başına yazı üst sınırı (R8), taslaklar dahil (R22). Ürün blog
 * platformu değil link-in-bio; 20 yazı "birkaç uzun metin" ihtiyacını
 * fazlasıyla karşılar, listeleme arayüzünü de sayfalamasız tutar.
 */
export const MAX_POSTS_PER_PROFILE = 20;

/**
 * Yazı durumları. Yalnız iki durum var: taslak (yalnız sahibi görür) ve
 * yayında. "Arşiv" gibi ara durumlar bilinçli yok — yayından kaldırma
 * taslağa döndürmektir.
 */
export const POST_STATUSES = ["draft", "published"] as const;

export type PostStatus = (typeof POST_STATUSES)[number];

/**
 * Gövde boyutu BAYT üstünden ölçülür, karakter değil: sınır depolama/aktarım
 * sınırıdır ve Türkçe metin UTF-8'de karakter başına 1-2 bayt tutar —
 * `string.length` ile ölçmek çok baytlı metinde sınırı sessizce aşardı.
 */
export function postBodyByteLength(body: string): number {
  return new TextEncoder().encode(body).length;
}

/** Serileştirilmiş gövde 50 KB sınırının içinde mi (R7)? */
export function isPostBodyWithinLimit(body: string): boolean {
  return postBodyByteLength(body) <= POST_BODY_MAX_BYTES;
}

// ── Gövde düğüm doğrulaması (U4, R6/R9) ─────────────────────────────────────
//
// Blok tarafındaki `richDocSchema` (layout.ts) düğüm tipi DOĞRULAMAZ; render
// bilinmeyeni sessizce düz metne düşürür ve bu tuval blokları için kabul
// edilmiş davranıştır. Yazı gövdesinde ise sessiz düşme kabul edilmez (R6):
// kayıt anında izin listesi dışındaki her düğüm/mark kimlikli hatayla
// reddedilir, böylece render izin listesi editörle eşzamanlı kalır.
// Katman metin yazmaz (Değişmez #5): kimlik döner, cümleyi katalog kurar.

/** Yazı gövdesinin taşıyabileceği düğüm tipleri — render ile eşzamanlı. */
export const POST_DOC_NODE_TYPES = [
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "hardBreak",
  "codeBlock",
  "image",
  "text",
] as const;

/** Yazı gövdesinin taşıyabileceği mark tipleri (bloklarla aynı küme). */
export const POST_DOC_MARK_TYPES = ["bold", "italic", "strike", "underline", "link"] as const;

const POST_DOC_NODE_SET: ReadonlySet<string> = new Set(POST_DOC_NODE_TYPES);
const POST_DOC_MARK_SET: ReadonlySet<string> = new Set(POST_DOC_MARK_TYPES);

export type PostDocIssueId =
  | "invalid_doc"
  | "body_too_large"
  | "unknown_node"
  | "unknown_mark"
  | "invalid_image_src"
  | "invalid_image_alt";

export type PostDocResult =
  | { ok: true }
  | { ok: false; issue: PostDocIssueId; detail?: string };

// Görsel yalnız birinci taraftan gelir (R9): `/i/<assetId>` ve asset kimliği
// düz UUID'dir (Değişmez #9). Desen dışı her şey — mutlak URL, path traversal,
// `/b/` gibi başka birinci taraf yollar — reddedilir.
const POST_IMAGE_SRC_PATTERN =
  /^\/i\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

/**
 * Birinci taraf görsel adresinden asset kimliğini çıkarır; desen dışıysa
 * null. Hem şema (kayıt reddi) hem render (savunma katmanı) bunu kullanır —
 * iki yüzeyin "birinci taraf" tanımı ayrışamaz.
 */
export function postImageAssetId(src: unknown): string | null {
  if (typeof src !== "string") return null;
  const match = POST_IMAGE_SRC_PATTERN.exec(src);
  return match ? match[1] : null;
}

/**
 * Başlık düğümünün render'da düşeceği HTML seviyesi: h1 sayfa başlığına
 * ayrılmıştır, gövde başlıkları h2/h3'tür. Deterministik eşleme: 1-2 → h2,
 * 3+ → h3; sayı olmayan/eksik seviye h2 sayılır.
 */
export function postHeadingLevel(level: unknown): 2 | 3 {
  return typeof level === "number" && level >= 3 ? 3 : 2;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateNode(node: unknown): PostDocResult {
  if (!isRecord(node) || typeof node.type !== "string") {
    return { ok: false, issue: "invalid_doc" };
  }
  if (!POST_DOC_NODE_SET.has(node.type)) {
    return { ok: false, issue: "unknown_node", detail: node.type };
  }
  if (node.type === "image") {
    const attrs = isRecord(node.attrs) ? node.attrs : {};
    if (postImageAssetId(attrs.src) === null) {
      return { ok: false, issue: "invalid_image_src" };
    }
    if (attrs.alt !== undefined && typeof attrs.alt !== "string") {
      return { ok: false, issue: "invalid_image_alt" };
    }
  }
  if (node.marks !== undefined) {
    if (!Array.isArray(node.marks)) return { ok: false, issue: "invalid_doc" };
    for (const mark of node.marks) {
      if (!isRecord(mark) || typeof mark.type !== "string") {
        return { ok: false, issue: "invalid_doc" };
      }
      if (!POST_DOC_MARK_SET.has(mark.type)) {
        return { ok: false, issue: "unknown_mark", detail: mark.type };
      }
    }
  }
  if (node.content !== undefined) {
    if (!Array.isArray(node.content)) return { ok: false, issue: "invalid_doc" };
    for (const child of node.content) {
      const result = validateNode(child);
      if (!result.ok) return result;
    }
  }
  return { ok: true };
}

/**
 * Yazı gövdesini (Tiptap JSON) kayıt anında doğrular: kök `doc` olmalı,
 * serileştirilmiş boyut 50 KB'ı aşmamalı (R7) ve her düğüm/mark izin
 * listesinde olmalı. İlk ihlalde kimlikli hata döner.
 */
export function validatePostDoc(docValue: unknown): PostDocResult {
  if (!isRecord(docValue) || docValue.type !== "doc" || !Array.isArray(docValue.content)) {
    return { ok: false, issue: "invalid_doc" };
  }
  // Boyut önce ölçülür: 50 KB'lık tavan düğüm yürüyüşünü de sınırlar.
  if (!isPostBodyWithinLimit(JSON.stringify(docValue))) {
    return { ok: false, issue: "body_too_large" };
  }
  for (const node of docValue.content) {
    const result = validateNode(node);
    if (!result.ok) return result;
  }
  return { ok: true };
}
