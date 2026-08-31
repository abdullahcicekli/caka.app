import type { YaziContent } from "./index";
import { parseDayKey } from "./tr";

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export const ptBR = {
  date: (day: string): string => {
    const parsed = parseDayKey(day);
    const name = parsed ? MESES[parsed.m - 1] : undefined;
    if (!parsed || !name) return day;
    return `${parsed.d} de ${name} de ${parsed.y}`;
  },
  backToProfile: (username: string) => `Voltar ao Caka de ${username}`,
  draftNotice: "Rascunho — por enquanto só você pode ver esta publicação.",
  shareImageAlt: (title: string) => `${title} — uma publicação no Caka`,
  notFound: {
    title: "Publicação não encontrada",
    body: "Não há nenhuma publicação neste endereço; ela pode ter sido removida ou o endereço pode ter mudado.",
  },
} satisfies YaziContent;
