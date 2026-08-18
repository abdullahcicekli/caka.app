import {
  formatDayKey,
  OLCUM_BILINMEYEN_ULKE,
  OLCUM_DIGER_ULKE,
  OLCUM_PENCERE_GUN,
  OLCUM_ULKE_ESIGI,
} from "@caka/shared";

import type { AnalitikContent } from "./index";

const COUNTRIES: Record<string, string> = {
  TR: "Türkei",
  DE: "Deutschland",
  US: "Vereinigte Staaten",
  GB: "Vereinigtes Königreich",
  NL: "Niederlande",
  FR: "Frankreich",
  AZ: "Aserbaidschan",
  AT: "Österreich",
  BE: "Belgien",
  CH: "Schweiz",
  SE: "Schweden",
  IT: "Italien",
  ES: "Spanien",
  CA: "Kanada",
  AU: "Australien",
  RU: "Russland",
  UA: "Ukraine",
  IN: "Indien",
  JP: "Japan",
  BR: "Brasilien",
};

const BLOCK_LABELS: Record<string, string> = {
  social: "Soziale Medien",
  link: "Link",
  image: "Bild",
  status: "Status",
};

export const de = {
  title: "Seitenstatistik",
  windowLabel: "Letzte 30 Tage",

  viewsTitle: "Aufrufe",
  clicksTitle: "Interaktion",
  todayTitle: "Heute",

  chartTitle: "Tägliche Aufrufe",
  chartAria: (total: string) => `Diagramm der täglichen Aufrufe der letzten 30 Tage, insgesamt ${total}`,
  dayLabel: (day: string, count: string) => `${formatDayKey(day)}: ${count} Aufrufe`,

  linksTitle: "Klicks und Wiedergaben",
  linksEmpty:
    "Auf deiner Seite gibt es noch keinen messbaren Link und keine Medienkarte. Füg einen Link, ein YouTube-Video oder etwas von Spotify hinzu, dann verfolgst du das hier.",

  countriesTitle: "Länder",

  countryThresholdNote:
    `Länder mit weniger als ${OLCUM_ULKE_ESIGI} Besuchen werden nicht einzeln aufgeführt; ` +
    "sie landen gesammelt in der Zeile „Wenige Besuche“, damit sich aus dieser Tabelle nicht ablesen lässt, woher eine einzelne Person kommt. Die Besuche zählen weiterhin zur Gesamtzahl.",

  startNote: (day: string) =>
    `Die Messung hat am ${formatDayKey(day)} begonnen. Die Zahlen oben ` +
    `umfassen dagegen nur die letzten ${OLCUM_PENCERE_GUN} Tage; ältere Einträge ` +
    "werden aufbewahrt, tauchen in diesen Tabellen aber nicht auf.",

  emptyTitle: "Noch keine Messdaten",
  emptyBody:
    "Sobald deine Seite besucht wird, sammeln sich hier Aufrufe und Linkklicks. Bei einer neuen Seite ist es normal, dass diese Tabellen leer sind.",

  privacyNote:
    "Die Messung ist First-Party und cookiefrei: Auf dem Gerät der Besucher wird nichts gespeichert, rohe IP-Adressen werden nicht aufbewahrt und die Daten werden nicht an Dritte weitergegeben. Besucher werden nicht zusammengeführt — die Zahlen sind Gesamtaufrufe, keine eindeutigen Personen.",

  scopeNote:
    "Bot-Traffic, den wir erkennen können, filtern wir heraus; der Filter schaut auf den Namen, mit dem sich der Browser meldet, ein Bot der sich versteckt kann also trotzdem gezählt werden. Wenn du angemeldet auf deine eigene Seite schaust, zählt das nicht; öffnest du dieselbe Seite in einem abgemeldeten Browser oder einem privaten Tab, können wir dich nicht erkennen und der Besuch zählt. Klicks lassen sich nicht zählen, wenn JavaScript im Browser aus ist — die Links funktionieren weiterhin, sie erreichen nur den Zähler nicht.",

  timezoneNote: "Die Tage werden nach türkischer Zeit abgegrenzt.",

  linkName: (label: string, type: string) => label.trim() || BLOCK_LABELS[type] || "Link",

  countryName: (code: string): string => {
    if (code === OLCUM_BILINMEYEN_ULKE) return "Unbekannt";
    if (code === OLCUM_DIGER_ULKE) return "Wenige Besuche";
    return COUNTRIES[code] ?? code;
  },
} satisfies AnalitikContent;
