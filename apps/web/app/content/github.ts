/**
 * GitHub katkı kartının kullanıcıya görünen metinleri. İçerik/görünüm ayrımı
 * (Değişmez #5) gereği bileşende değil burada yaşar.
 *
 * BİLİNÇLİ İSTİSNA — ürün dili Türkçe olmasına rağmen bu metinler İNGİLİZCE:
 * kullanıcı, katkı grafiğinin GitHub'ın kendi biçimini birebir izlemesini
 * açıkça istedi ("12 contributions on Aug 16, 2026" vb.). aria-label'lar
 * Türkçe kalır (sayfa lang="tr", ekran okuyucu dili Türkçe).
 */

// GitHub'ın kısa ay adları. Tarih "YYYY-MM-DD" string'inden parçalanır —
// Date/locale kullanılmaz ki SSR ve tarayıcı aynı metni üretsin.
const GH_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Gün tooltip'i: "12 contributions on Aug 16, 2026" / tekil "1 contribution
 * on ..." / sıfır "No contributions on ...". Tarih biçimsizse (boş/bozuk
 * payload) "Jan , 0" gibi kırık metin üretmemek için tarih kısmı atılır.
 */
export function githubDayTitle(count: number, date: string): string {
  const contributions =
    count === 0 ? "No contributions" : `${count} contribution${count === 1 ? "" : "s"}`;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const month = match ? GH_MONTHS[Number(match[2]) - 1] : undefined;
  if (!match || !month) return contributions;
  return `${contributions} on ${month} ${Number(match[3])}, ${match[1]}`;
}

/** Alt satır: "428 contributions in the last year" */
export function githubTotalLine(total: number): string {
  return `${total} contribution${total === 1 ? "" : "s"} in the last year`;
}

/** Kart altındaki soluk ipucu metni (bağlantı değil; kartın tamamı <a>). */
export const githubFootHint = "GitHub ↗";

/** Heatmap grid'inin ekran okuyucu etiketi — Türkçe (sayfa lang="tr"). */
export function githubHeatmapAriaLabel(total: number): string {
  return `${total} katkı, son bir yıl`;
}
