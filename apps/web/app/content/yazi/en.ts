import type { YaziContent } from "./index";
import { parseDayKey } from "./tr";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const en = {
  date: (day: string): string => {
    const parsed = parseDayKey(day);
    const name = parsed ? MONTHS[parsed.m - 1] : undefined;
    if (!parsed || !name) return day;
    return `${name} ${parsed.d}, ${parsed.y}`;
  },
  backToProfile: (username: string) => `Back to ${username}'s Caka`,
  draftNotice: "Draft — only you can see this post right now.",
  shareImageAlt: (title: string) => `${title} — a post on Caka`,
  notFound: {
    title: "Post not found",
    body: "There is no published post at this address; it may have been removed or its address may have changed.",
  },
} satisfies YaziContent;
