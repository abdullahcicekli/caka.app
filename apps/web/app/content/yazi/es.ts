import type { YaziContent } from "./index";
import { parseDayKey } from "./tr";

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export const es = {
  date: (day: string): string => {
    const parsed = parseDayKey(day);
    const name = parsed ? MESES[parsed.m - 1] : undefined;
    if (!parsed || !name) return day;
    return `${parsed.d} de ${name} de ${parsed.y}`;
  },
  backToProfile: (username: string) => `Volver al Caka de ${username}`,
  draftNotice: "Borrador — por ahora solo tú puedes ver esta publicación.",
  shareImageAlt: (title: string) => `${title} — una publicación en Caka`,
  notFound: {
    title: "Publicación no encontrada",
    body: "No hay ninguna publicación en esta dirección; puede que se haya eliminado o que su dirección haya cambiado.",
  },
} satisfies YaziContent;
