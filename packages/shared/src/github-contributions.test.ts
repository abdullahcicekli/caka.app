import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { parseGithubContributionsHtml } from "./github-contributions";

/**
 * GERÇEK parça: 2026-08-18'de `https://github.com/users/abdullahcicekli/contributions`
 * adresinden olduğu gibi kaydedildi. Ayrıştırıcı bir scrape olduğu için testin
 * değeri tam da burada: GitHub markup'ı değiştirirse bu fixture eskir, ama
 * regex'lerin BUGÜNKÜ gerçek markup'ta çalıştığı kanıtlanmış olur.
 *
 * Fixture'ı tazelemek için:
 *   curl -sS -A "caka.app" https://github.com/users/<login>/contributions \
 *     -o packages/shared/src/fixtures/github-contributions-<login>.html
 */
const fixture = readFileSync(
  fileURLToPath(new URL("./fixtures/github-contributions-abdullahcicekli.html", import.meta.url)),
  "utf8",
);

describe("parseGithubContributionsHtml — gerçek GitHub parçası", () => {
  const parsed = parseGithubContributionsHtml(fixture);

  it("başlıktaki toplamı okur (GitHub profilinde görünen sayı)", () => {
    expect(parsed?.total).toBe(3476);
    expect(parsed?.totalFromHeader).toBe(true);
  });

  it("gün sayıları tooltip'lerden gelir ve toplamı başlıkla tutar", () => {
    expect(parsed?.countsAvailable).toBe(true);
    const days = parsed!.weeks.flatMap((week) => week.days);
    expect(days.reduce((sum, day) => sum + day.count, 0)).toBe(3476);
  });

  it("bir yıllık grid'i haftalara böler: 53 sütun, son hafta kısmi", () => {
    expect(parsed?.weeks).toHaveLength(53);
    const days = parsed!.weeks.flatMap((week) => week.days);
    expect(days).toHaveLength(367);
    // İlk 52 sütun tam hafta; son sütun bugüne kadar olan kısmi hafta.
    expect(parsed!.weeks.slice(0, 52).every((week) => week.days.length === 7)).toBe(true);
    expect(parsed!.weeks[52]!.days.length).toBeLessThanOrEqual(7);
  });

  it("her hafta içinde günler tarih sırasındadır ve grid kronolojiktir", () => {
    const days = parsed!.weeks.flatMap((week) => week.days);
    const sorted = [...days].map((day) => day.date).sort();
    expect(days.map((day) => day.date)).toEqual(sorted);
    expect(days[0]!.date).toBe("2025-08-17");
    expect(days.at(-1)!.date).toBe("2026-08-18");
  });

  it("özel katkılar dâhil seviye dağılımını çıkarır", () => {
    const days = parsed!.weeks.flatMap((week) => week.days);
    const distribution = [0, 0, 0, 0, 0];
    for (const day of days) distribution[day.level] += 1;
    // GraphQL aynı kullanıcı için 214 boş gün veriyordu; genel HTML 143 diyor.
    expect(distribution).toEqual([143, 196, 18, 7, 3]);
    expect(days.filter((day) => day.count === 0)).toHaveLength(143);
  });

  it("örnek bir günü tarih + sayı + seviye olarak doğru çözer", () => {
    const days = parsed!.weeks.flatMap((week) => week.days);
    expect(days[0]).toEqual({ date: "2025-08-17", count: 3, level: 1 });
  });
});

describe("parseGithubContributionsHtml — sentetik kenar durumlar", () => {
  const cell = (id: string, ix: number, date: string, level: number) =>
    `<td tabindex="0" data-ix="${ix}" style="width: 10px" data-date="${date}" id="${id}" data-level="${level}" role="gridcell" class="ContributionCalendar-day"></td>`;
  const tip = (id: string, text: string) =>
    `<tool-tip for="${id}" data-type="label" class="sr-only">${text}</tool-tip>`;

  it("tanınmayan markup'ta null döner (özellik sessizce kapanır)", () => {
    expect(parseGithubContributionsHtml("")).toBeNull();
    expect(parseGithubContributionsHtml("<html><body>nope</body></html>")).toBeNull();
    // Rate limit / oturum duvarı sayfaları: gün hücresi yok → null.
    expect(parseGithubContributionsHtml("<h2>3,476 contributions in the last year</h2>")).toBeNull();
  });

  it("tooltip'ler kaybolursa seviyeler korunur, sayılar uydurulmaz", () => {
    const html = `<h2>5 contributions in the last year</h2>${cell("contribution-day-component-0-0", 0, "2026-01-04", 3)}`;
    const parsed = parseGithubContributionsHtml(html);
    expect(parsed?.countsAvailable).toBe(false);
    expect(parsed?.total).toBe(5);
    expect(parsed?.weeks[0]!.days[0]).toEqual({ date: "2026-01-04", count: 0, level: 3 });
  });

  it("başlık yoksa toplam günlerin toplamıdır", () => {
    const html =
      cell("contribution-day-component-0-0", 0, "2026-01-04", 1) +
      cell("contribution-day-component-1-0", 0, "2026-01-05", 2) +
      tip("contribution-day-component-0-0", "1 contribution on January 4th.") +
      tip("contribution-day-component-1-0", "4 contributions on January 5th.");
    const parsed = parseGithubContributionsHtml(html);
    expect(parsed?.totalFromHeader).toBe(false);
    expect(parsed?.total).toBe(5);
  });

  it("'No contributions' metnini 0 olarak çözer", () => {
    const html =
      cell("contribution-day-component-0-0", 0, "2026-01-04", 0) +
      tip("contribution-day-component-0-0", "No contributions on January 4th.");
    expect(parseGithubContributionsHtml(html)?.weeks[0]!.days[0]!.count).toBe(0);
  });

  it("binlik ayıraçlarını (virgül/nokta/ince boşluk) tolere eder", () => {
    for (const raw of ["3,476", "3.476", "3 476", "3 476"]) {
      const html = `<h2>${raw} contributions in the last year</h2>${cell("contribution-day-component-0-0", 0, "2026-01-04", 4)}`;
      expect(parseGithubContributionsHtml(html)?.total).toBe(3476);
    }
  });

  it("tarihsiz dolgu hücrelerini atar", () => {
    const html =
      `<td class="ContributionCalendar-day" role="presentation"></td>` +
      cell("contribution-day-component-0-0", 0, "2026-01-04", 1);
    expect(parseGithubContributionsHtml(html)?.weeks[0]!.days).toHaveLength(1);
  });

  it("data-ix yoksa hafta indeksini id'den, o da yoksa tarihten türetir", () => {
    const withoutIx =
      `<td data-date="2026-01-04" id="contribution-day-component-0-7" data-level="1" class="ContributionCalendar-day"></td>` +
      `<td data-date="2026-01-11" id="contribution-day-component-0-8" data-level="2" class="ContributionCalendar-day"></td>`;
    expect(parseGithubContributionsHtml(withoutIx)?.weeks).toHaveLength(2);

    const bare =
      `<td data-date="2026-01-04" data-level="1" class="ContributionCalendar-day"></td>` +
      `<td data-date="2026-01-07" data-level="2" class="ContributionCalendar-day"></td>` +
      `<td data-date="2026-01-11" data-level="3" class="ContributionCalendar-day"></td>`;
    const parsed = parseGithubContributionsHtml(bare);
    // 2026-01-04 ve 2026-01-07 aynı pazar-başlangıçlı haftada, 01-11 sonrakinde.
    expect(parsed?.weeks.map((week) => week.days.length)).toEqual([2, 1]);
  });

  it("bozuk data-level değerlerini 0'a düşürür", () => {
    const html = `<td data-date="2026-01-04" data-ix="0" data-level="9" class="ContributionCalendar-day"></td>`;
    expect(parseGithubContributionsHtml(html)?.weeks[0]!.days[0]!.level).toBe(0);
  });
});
