/**
 * GitHub katkı takvimi HTML parçasının ("fragment") saf ayrıştırıcısı.
 *
 * Kaynak: `https://github.com/users/<login>/contributions` — GitHub'ın profil
 * sayfasının kendi içine gömdüğü, token istemeyen genel HTML parçası.
 *
 * NEDEN GraphQL DEĞİL: `contributionsCollection` yalnızca token'ın GÖREBİLDİĞİ
 * katkıları sayar. "Include private contributions on my profile" seçeneğini
 * açmış bir kullanıcının gerçek toplamını (herkese açık profilde görünen sayı)
 * üçüncü bir taraf GraphQL'den ALAMAZ; bu parça ise ziyaretçinin gördüğünün
 * birebir aynısını döndürür.
 *
 * ⚠️ BU BİR SCRAPE'TİR, API DEĞİL. GitHub markup'ı habersiz değiştirebilir.
 * Bağımlı olduğumuz üç şey (2026-08 itibarıyla doğrulandı):
 *   1. Her gün bir `<td class="ContributionCalendar-day">`; üzerinde
 *      `data-date="YYYY-MM-DD"`, `data-level="0..4"`, `data-ix="<hafta>"`
 *      ve `id="contribution-day-component-<haftanınGünü>-<hafta>"` bulunur.
 *   2. Gün başına sayı, o `id`'yi işaret eden `<tool-tip for="...">` metnindedir:
 *      "3 contributions on August 17th." / "No contributions on October 5th."
 *   3. Toplam, "3,476 contributions in the last year" biçiminde bir başlıkta
 *      geçer (boşluk/satır sonu serbest).
 *
 * BOZULDUĞUNDA NE OLUR: `parseGithubContributionsHtml` `null` döner, çağıran
 * taraf özelliği sessizce kapatır (kart heatmap'siz render edilir). Bozulmayı
 * teşhis için önce (1)'i kontrol et: `data-date`/`data-level` içeren `<td>`
 * kalmadıysa grid tamamen değişmiştir ve buradaki üç regex'in de gözden
 * geçirilmesi gerekir. Yalnız (2) kaybolduysa gün sayıları 0'a düşer ama
 * seviyeler doğru kalır (aşağıdaki `countsAvailable` bayrağına bak).
 */

/** GitHub'ın 5 kademeli yoğunluk skalası. */
export type GithubContributionLevel = 0 | 1 | 2 | 3 | 4;

export type GithubContributionDay = {
  /** ISO gün (YYYY-MM-DD) */
  date: string;
  count: number;
  level: GithubContributionLevel;
};

export type GithubContributionWeek = { days: GithubContributionDay[] };

/**
 * Ayrıştırma sonucu. Alan adları `apps/web/app/lib/github-calendar.ts`
 * içindeki `GithubCalendar` ile birebir aynıdır (yapısal olarak atanabilir):
 * önbellekteki JSON şeması bu yüzden değişmez.
 */
export type GithubContributionCalendar = {
  /** Son bir yıldaki toplam katkı */
  total: number;
  weeks: GithubContributionWeek[];
};

export type GithubContributionsParseResult = GithubContributionCalendar & {
  /**
   * Gün başına sayıların tooltip'lerden gerçekten okunabildiğini bildirir.
   * `false` ise seviyeler doğrudur ama `count` alanları 0'dır — uydurulmuş
   * sayı yazmaktansa 0 bırakılır (tooltip markup'ı değişmiş demektir).
   */
  countsAvailable: boolean;
  /**
   * Toplamın başlıktan mı okunduğu. `false` ise günlerin toplamı kullanılmıştır
   * (tooltip'ler de yoksa 0 olur).
   */
  totalFromHeader: boolean;
};

// Tek tek gün hücreleri. Sıra belgedeki sıradır (satır = haftanın günü),
// haftalara `data-ix` ile gruplanır; `data-ix` yoksa `id`'nin son parçasından
// türetilir, o da yoksa gün tarihine göre haftalık kova hesaplanır.
const DAY_CELL_PATTERN = /<td\b[^>]*\bclass="[^"]*\bContributionCalendar-day\b[^"]*"[^>]*>/gi;
const ATTR = {
  date: /\bdata-date="(\d{4}-\d{2}-\d{2})"/i,
  level: /\bdata-level="(\d)"/i,
  ix: /\bdata-ix="(\d+)"/i,
  id: /\bid="(contribution-day-component-\d+-\d+)"/i,
};

// <tool-tip ... for="contribution-day-component-0-0" ...>3 contributions on ...
const TOOLTIP_PATTERN =
  /<tool-tip\b[^>]*\bfor="(contribution-day-component-\d+-\d+)"[^>]*>([\s\S]*?)<\/tool-tip>/gi;

// "3,476 contributions in the last year" — sayı ayıracı virgül/nokta/boşluk
// olabilir (GitHub varsayılan olarak İngilizce servis eder ama biçim garanti
// değil); "1 contribution" tekil hâli de kapsanır.
const TOTAL_PATTERN = /(\d[\d.,\u00a0\u202f\s]*?)\s*contributions?\s+in\s+the\s+last\s+year/i;

// Tooltip metni: "3 contributions on August 17th." | "No contributions on ...".
const TOOLTIP_COUNT_PATTERN = /^\s*(\d[\d.,\u00a0\u202f]*)\s*contribution/i;

/** "3,476" / "3.476" / "3 476" → 3476. Ayıraçlar atılır. */
function parseGroupedInteger(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  const value = Number.parseInt(digits, 10);
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function toLevel(raw: string | undefined): GithubContributionLevel {
  switch (raw) {
    case "1":
      return 1;
    case "2":
      return 2;
    case "3":
      return 3;
    case "4":
      return 4;
    default:
      return 0;
  }
}

/** ISO günün, sabit bir referans pazarına göre kaçıncı haftaya düştüğü. */
function weekBucketFromDate(date: string): number {
  const time = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(time)) return 0;
  // 1970-01-04 bir pazardır: GitHub grid'i de pazar başlangıçlıdır.
  return Math.floor((time / 86_400_000 - 3) / 7);
}

/**
 * HTML parçasını takvime çevirir. Beklenen hücreleri bulamazsa `null` döner —
 * çağıran taraf bunu "özellik bu görüntülemede kapalı" olarak ele almalıdır.
 */
export function parseGithubContributionsHtml(html: string): GithubContributionsParseResult | null {
  if (typeof html !== "string" || html.length === 0) return null;

  const counts = new Map<string, number>();
  let sawTooltipCount = false;
  TOOLTIP_PATTERN.lastIndex = 0;
  for (let match = TOOLTIP_PATTERN.exec(html); match; match = TOOLTIP_PATTERN.exec(html)) {
    const [, id, text] = match;
    const numeric = TOOLTIP_COUNT_PATTERN.exec(text);
    if (numeric) {
      const value = parseGroupedInteger(numeric[1]);
      if (value !== null) {
        counts.set(id, value);
        sawTooltipCount = true;
        continue;
      }
    }
    // "No contributions on ..." (ve tanınmayan her metin) → 0.
    counts.set(id, 0);
  }

  // Hafta indeksi → o haftanın günleri. Belge sırası satır-öncelikli olduğu
  // için gruplar dolarken gün sırası karışır; sonda tarihe göre sıralanır.
  const weekBuckets = new Map<number, GithubContributionDay[]>();
  let dayCount = 0;
  let summedCount = 0;

  DAY_CELL_PATTERN.lastIndex = 0;
  for (let match = DAY_CELL_PATTERN.exec(html); match; match = DAY_CELL_PATTERN.exec(html)) {
    const tag = match[0];
    const date = ATTR.date.exec(tag)?.[1];
    // Tarihsiz hücre grid dolgusudur (GitHub bazen boş `<td>` basar) — atlanır.
    if (!date) continue;
    const id = ATTR.id.exec(tag)?.[1];
    const level = toLevel(ATTR.level.exec(tag)?.[1]);
    const count = (id && counts.get(id)) || 0;

    const ixAttr = ATTR.ix.exec(tag)?.[1];
    const idWeek = id ? /-(\d+)$/.exec(id)?.[1] : undefined;
    const week =
      ixAttr !== undefined
        ? Number.parseInt(ixAttr, 10)
        : idWeek !== undefined
          ? Number.parseInt(idWeek, 10)
          : weekBucketFromDate(date);

    const bucket = weekBuckets.get(week);
    if (bucket) bucket.push({ date, count, level });
    else weekBuckets.set(week, [{ date, count, level }]);
    dayCount += 1;
    summedCount += count;
  }

  // Tek bir gün hücresi bile yoksa markup tanınmıyor demektir.
  if (dayCount === 0) return null;

  const weeks: GithubContributionWeek[] = [...weekBuckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, days]) => ({ days: days.sort((a, b) => (a.date < b.date ? -1 : 1)) }));

  const headerTotal = parseGroupedInteger(TOTAL_PATTERN.exec(html)?.[1] ?? "");
  return {
    total: headerTotal ?? summedCount,
    weeks,
    countsAvailable: sawTooltipCount,
    totalFromHeader: headerTotal !== null,
  };
}
