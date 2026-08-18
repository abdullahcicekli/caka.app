/**
 * `<link rel="icon">` etiketlerinden EN İYİ favicon'u seçen saf kural.
 *
 * Neden burada: seçim kuralı üç ölçüme dayanıyor ve sessizce yanlış olabilir
 * (yanlış seçim kırık görsel değil, hiç görünmeyen bir favicon üretir —
 * kart sessizce baş harfe düşer ve kimse sebebini görmez). Bu yüzden akıştan
 * ayrıldı ve testlendi; toplama işi `apps/web/server/og.ts`'te kalıyor.
 *
 * Kurallar:
 *  1. SVG ELENİR. Görsel proxy'si SVG servis etmiyor (script/dış kaynak
 *     taşıyabilir, `PROXY_IMAGE_TYPES`). Ölçüm: cicekli.me'nin İLK `icon`
 *     etiketi SVG; körlemesine ilkini almak favicon'u hiç göstermemek olurdu.
 *  2. `rel` sözcük kümesi olarak okunur: GitHub `rel="alternate icon"`
 *     yazıyor, Instagram `rel="apple-touch-icon"`. `mask-icon`/`fluid-icon`
 *     tek sözcüktür ve "icon" sayılmaz — ikisi de favicon değil.
 *  3. Aynı türde birden çok aday varsa `sizes` büyük olan kazanır (16px bir
 *     .ico 36px'lik çipte bulanık).
 *  4. Tür sırası: apple-touch-icon (genelde 180px PNG) > icon > shortcut icon.
 */

/** İyiden kötüye favicon `rel` türleri. */
const ICON_RELS = ["apple-touch-icon-precomposed", "apple-touch-icon", "icon", "shortcut icon"];

function attr(tag: string, name: string): string {
  const match = new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i").exec(tag);
  return match?.[1]?.trim() ?? "";
}

/** `sizes="32x32 16x16"` → 32. Yoksa 0. */
function declaredSize(tag: string): number {
  let best = 0;
  for (const part of attr(tag, "sizes").toLowerCase().split(/\s+/)) {
    const value = Number.parseInt(part.split("x")[0] ?? "", 10);
    if (Number.isFinite(value) && value > best) best = value;
  }
  return best;
}

function isSvg(tag: string, href: string): boolean {
  return attr(tag, "type").toLowerCase().includes("svg") || /\.svg(?:[?#]|$)/i.test(href);
}

/** Ham `<link …>` etiketlerinden en iyi favicon href'ini döner; yoksa null. */
export function pickFaviconHref(tags: readonly string[]): string | null {
  const best = new Map<string, { href: string; size: number }>();
  for (const tag of tags) {
    const href = attr(tag, "href");
    if (!href || isSvg(tag, href)) continue;
    const words = attr(tag, "rel").toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;
    const size = declaredSize(tag);
    for (const rel of ICON_RELS) {
      const needed = rel.split(" ");
      if (!needed.every((word) => words.includes(word))) continue;
      const current = best.get(rel);
      if (!current || size > current.size) best.set(rel, { href, size });
    }
  }
  for (const rel of ICON_RELS) {
    const found = best.get(rel);
    if (found) return found.href;
  }
  return null;
}
