import type { YaziContent } from "./index";
import { parseDayKey } from "./tr";

const MONATE = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

export const de = {
  date: (day: string): string => {
    const parsed = parseDayKey(day);
    const name = parsed ? MONATE[parsed.m - 1] : undefined;
    if (!parsed || !name) return day;
    return `${parsed.d}. ${name} ${parsed.y}`;
  },
  backToProfile: (username: string) => `Zurück zu ${username}s Caka`,
  draftNotice: "Entwurf — diesen Beitrag kannst derzeit nur du sehen.",
  shareImageAlt: (title: string) => `${title} — ein Beitrag auf Caka`,
  notFound: {
    title: "Beitrag nicht gefunden",
    body: "Unter dieser Adresse gibt es keinen veröffentlichten Beitrag; er wurde möglicherweise entfernt oder seine Adresse hat sich geändert.",
  },
} satisfies YaziContent;
