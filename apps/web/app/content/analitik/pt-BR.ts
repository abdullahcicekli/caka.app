import {
  formatDayKey,
  OLCUM_BILINMEYEN_ULKE,
  OLCUM_DIGER_ULKE,
  OLCUM_PENCERE_GUN,
  OLCUM_ULKE_ESIGI,
} from "@caka/shared";

import type { AnalitikContent } from "./index";

const COUNTRIES: Record<string, string> = {
  TR: "Turquia",
  DE: "Alemanha",
  US: "Estados Unidos",
  GB: "Reino Unido",
  NL: "Países Baixos",
  FR: "França",
  AZ: "Azerbaijão",
  AT: "Áustria",
  BE: "Bélgica",
  CH: "Suíça",
  SE: "Suécia",
  IT: "Itália",
  ES: "Espanha",
  CA: "Canadá",
  AU: "Austrália",
  RU: "Rússia",
  UA: "Ucrânia",
  IN: "Índia",
  JP: "Japão",
  BR: "Brasil",
};

const BLOCK_LABELS: Record<string, string> = {
  social: "Redes sociais",
  link: "Link",
  image: "Imagem",
  status: "Status",
};

export const ptBR = {
  title: "Estatísticas da página",
  windowLabel: "Últimos 30 dias",

  viewsTitle: "Visualizações",
  clicksTitle: "Interação",
  todayTitle: "Hoje",

  chartTitle: "Visualizações por dia",
  chartAria: (total: string) => `Gráfico de visualizações diárias dos últimos 30 dias, ${total} no total`,
  dayLabel: (day: string, count: string) => `${formatDayKey(day)}: ${count} visualizações`,

  linksTitle: "Cliques e reproduções",
  linksEmpty:
    "Ainda não há nenhum link ou card de mídia mensurável na sua página. Adicione um link, um vídeo do YouTube ou algo do Spotify e você acompanha por aqui.",

  countriesTitle: "Países",

  countryThresholdNote:
    `Países com menos de ${OLCUM_ULKE_ESIGI} visitas não aparecem separadamente; ` +
    "eles são agrupados na linha “Poucas visitas” para que não dê para saber por esta tabela de onde veio uma única pessoa. Essas visitas continuam contando no total.",

  startNote: (day: string) =>
    `A medição começou em ${formatDayKey(day)}. Já os números acima ` +
    `cobrem apenas os últimos ${OLCUM_PENCERE_GUN} dias; registros mais antigos ` +
    "são guardados, mas não entram nestas tabelas.",

  emptyTitle: "Ainda não há dados de medição",
  emptyBody:
    "Conforme sua página for visitada, as visualizações e os cliques em links vão se acumular aqui. É normal que estas tabelas fiquem vazias numa página nova.",

  privacyNote:
    "A medição é de primeira parte e sem cookies: nada é gravado no dispositivo do visitante, endereços IP brutos não são armazenados e os dados não são compartilhados com terceiros. Os visitantes não são deduplicados — estes números são visualizações totais, não pessoas únicas.",

  scopeNote:
    "Filtramos o tráfego de bots que conseguimos reconhecer; o filtro olha para o nome com que o navegador se apresenta, então um bot que se esconde ainda pode ser contado. Ver sua própria página com a sessão aberta não conta; se você abrir a mesma página em um navegador sem sessão ou em uma aba anônima, não temos como reconhecer você e essa visita conta. Cliques não podem ser contados quando o JavaScript está desligado no navegador — os links continuam funcionando, só não chegam ao contador.",

  timezoneNote: "Os dias são cortados pelo horário da Turquia.",

  linkName: (label: string, type: string) => label.trim() || BLOCK_LABELS[type] || "Link",

  countryName: (code: string): string => {
    if (code === OLCUM_BILINMEYEN_ULKE) return "Desconhecido";
    if (code === OLCUM_DIGER_ULKE) return "Poucas visitas";
    return COUNTRIES[code] ?? code;
  },
} satisfies AnalitikContent;
