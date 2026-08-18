import {
  formatDayKey,
  OLCUM_BILINMEYEN_ULKE,
  OLCUM_DIGER_ULKE,
  OLCUM_PENCERE_GUN,
  OLCUM_ULKE_ESIGI,
} from "@caka/shared";

import type { AnalitikContent } from "./index";

const COUNTRIES: Record<string, string> = {
  TR: "Turquía",
  DE: "Alemania",
  US: "Estados Unidos",
  GB: "Reino Unido",
  NL: "Países Bajos",
  FR: "Francia",
  AZ: "Azerbaiyán",
  AT: "Austria",
  BE: "Bélgica",
  CH: "Suiza",
  SE: "Suecia",
  IT: "Italia",
  ES: "España",
  CA: "Canadá",
  AU: "Australia",
  RU: "Rusia",
  UA: "Ucrania",
  IN: "India",
  JP: "Japón",
  BR: "Brasil",
};

const BLOCK_LABELS: Record<string, string> = {
  social: "Redes sociales",
  link: "Enlace",
  image: "Imagen",
  status: "Estado",
};

export const es = {
  title: "Estadísticas de la página",
  windowLabel: "Últimos 30 días",

  viewsTitle: "Visualizaciones",
  clicksTitle: "Interacción",
  todayTitle: "Hoy",

  chartTitle: "Visualizaciones diarias",
  chartAria: (total: string) => `Gráfico de visualizaciones diarias de los últimos 30 días, ${total} en total`,
  dayLabel: (day: string, count: string) => `${formatDayKey(day)}: ${count} visualizaciones`,

  linksTitle: "Clics y reproducciones",
  linksEmpty:
    "Todavía no hay ningún enlace ni tarjeta de medios medible en tu página. Añade un enlace, un vídeo de YouTube o algo de Spotify y podrás seguirlo desde aquí.",

  countriesTitle: "Países",

  countryThresholdNote:
    `Los países con menos de ${OLCUM_ULKE_ESIGI} visitas no se muestran por separado; ` +
    "se agrupan en la fila “Pocas visitas” para que no se pueda deducir de esta tabla de dónde viene una sola persona. Esas visitas siguen contando en el total.",

  startNote: (day: string) =>
    `La medición empezó el ${formatDayKey(day)}. Los números de arriba, en cambio, ` +
    `cubren solo los últimos ${OLCUM_PENCERE_GUN} días; los registros más antiguos ` +
    "se conservan, pero no entran en estas tablas.",

  emptyTitle: "Todavía no hay datos de medición",
  emptyBody:
    "A medida que visiten tu página, las visualizaciones y los clics en enlaces se irán acumulando aquí. Es normal que estas tablas estén vacías en una página nueva.",

  privacyNote:
    "La medición es de origen propio y sin cookies: no se escribe nada en el dispositivo del visitante, no se guardan direcciones IP en bruto y los datos no se comparten con terceros. No se deduplican los visitantes: estos números son visualizaciones totales, no personas únicas.",

  scopeNote:
    "Filtramos el tráfico de bots que podemos reconocer; el filtro se fija en el nombre con el que se presenta el navegador, así que un bot que se oculte puede contarse igualmente. Ver tu propia página con la sesión iniciada no cuenta; si abres esa misma página en un navegador sin sesión o en una pestaña privada no podemos reconocerte y esa visita cuenta. Los clics no se pueden contar si JavaScript está desactivado en el navegador: los enlaces siguen funcionando, simplemente no llegan al contador.",

  timezoneNote: "Los días se cortan según la hora de Turquía.",

  linkName: (label: string, type: string) => label.trim() || BLOCK_LABELS[type] || "Enlace",

  countryName: (code: string): string => {
    if (code === OLCUM_BILINMEYEN_ULKE) return "Desconocido";
    if (code === OLCUM_DIGER_ULKE) return "Pocas visitas";
    return COUNTRIES[code] ?? code;
  },
} satisfies AnalitikContent;
