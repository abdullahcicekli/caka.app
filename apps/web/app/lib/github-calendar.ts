/**
 * GitHub katkı takvimi tipleri. Veriyi `server/github.ts` üretir,
 * `ProfileBlockCard` çizer; tip bu yüzden iki tarafın da güvenle import
 * edebileceği yalın bir app modülünde yaşar (packages/shared'a taşımadık:
 * bu tip ürün şemasının parçası değil, tek uygulamanın görsel/sunucu sözleşmesi).
 */
export type GithubCalendarLevel = 0 | 1 | 2 | 3 | 4;

export type GithubCalendarDay = {
  /** ISO gün (YYYY-MM-DD) */
  date: string;
  count: number;
  level: GithubCalendarLevel;
};

export type GithubCalendar = {
  /** Son bir yıldaki toplam katkı */
  total: number;
  weeks: { days: GithubCalendarDay[] }[];
};

/** login → takvim sözlüğü; anahtarlar `githubLoginKey` ile normalize edilir. */
export type GithubCalendarMap = Record<string, GithubCalendar>;

/**
 * Sözlük anahtarı: baştaki @ atılır, küçük harfe çekilir. Sunucu (yazan) ve
 * bileşen (okuyan) aynı anahtarı üretsin diye tek yerde durur.
 */
export function githubLoginKey(handle: string): string {
  return handle.trim().replace(/^@/, "").toLowerCase();
}
