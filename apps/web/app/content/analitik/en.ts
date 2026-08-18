import {
  formatDayKey,
  OLCUM_BILINMEYEN_ULKE,
  OLCUM_DIGER_ULKE,
  OLCUM_PENCERE_GUN,
  OLCUM_ULKE_ESIGI,
} from "@caka/shared";

import type { AnalitikContent } from "./index";

const COUNTRIES: Record<string, string> = {
  TR: "Türkiye",
  DE: "Germany",
  US: "United States",
  GB: "United Kingdom",
  NL: "Netherlands",
  FR: "France",
  AZ: "Azerbaijan",
  AT: "Austria",
  BE: "Belgium",
  CH: "Switzerland",
  SE: "Sweden",
  IT: "Italy",
  ES: "Spain",
  CA: "Canada",
  AU: "Australia",
  RU: "Russia",
  UA: "Ukraine",
  IN: "India",
  JP: "Japan",
  BR: "Brazil",
};

const BLOCK_LABELS: Record<string, string> = {
  social: "Social media",
  link: "Link",
  image: "Image",
  status: "Status",
};

export const en = {
  title: "Page stats",
  windowLabel: "Last 30 days",

  viewsTitle: "Views",
  clicksTitle: "Engagement",
  todayTitle: "Today",

  chartTitle: "Daily views",
  chartAria: (total: string) => `Daily views chart for the last 30 days, ${total} in total`,
  dayLabel: (day: string, count: string) => `${formatDayKey(day)}: ${count} views`,

  linksTitle: "Clicks and plays",
  linksEmpty:
    "There's no measurable link or media card on your page yet. Add a link, a YouTube video or a Spotify item and you'll follow it here.",

  countriesTitle: "Countries",

  countryThresholdNote:
    `Countries with fewer than ${OLCUM_ULKE_ESIGI} visits aren't listed separately; ` +
    "they're grouped into the “Few visits” row so that a single visitor's location can't be read off this table. Those visits still count in the total.",

  startNote: (day: string) =>
    `Measurement started on ${formatDayKey(day)}. The numbers above, however, ` +
    `cover only the last ${OLCUM_PENCERE_GUN} days; older records ` +
    "are kept but don't appear in these tables.",

  emptyTitle: "No measurement data yet",
  emptyBody:
    "As your page gets visited, views and link clicks build up here. It's normal for these tables to be empty on a new page.",

  privacyNote:
    "Measurement is first-party and cookie-free: nothing is written to the visitor's device, raw IP addresses aren't stored, and the data isn't shared with third parties. Visitors aren't deduplicated — these numbers are total views, not unique people.",

  scopeNote:
    "We filter out the bot traffic we can recognise; the filter looks at the name the browser gives for itself, so a bot that hides itself can still be counted. Looking at your own page while signed in doesn't count; if you open the same page in a signed-out browser or a private tab we can't recognise you and that visit counts. Clicks can't be counted when JavaScript is off in the browser — the links still work, they just don't reach the counter.",

  timezoneNote: "Days are cut according to Türkiye time.",

  linkName: (label: string, type: string) => label.trim() || BLOCK_LABELS[type] || "Link",

  countryName: (code: string): string => {
    if (code === OLCUM_BILINMEYEN_ULKE) return "Unknown";
    if (code === OLCUM_DIGER_ULKE) return "Few visits";
    return COUNTRIES[code] ?? code;
  },
} satisfies AnalitikContent;
