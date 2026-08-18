import {
  USERNAME_CHANGE_COOLDOWN_DAYS,
  USERNAME_MAX,
  USERNAME_MIN,
  USERNAME_REDIRECT_DAYS,
  formatDate,
} from "@caka/shared";

import type { AyarlarContent } from "./index";

export const ptBR = {
  title: "Configurações",
  sectionNavLabel: "Seções das configurações",
  sectionLabels: {
    adres: "Endereço",
    dil: "Idioma",
    "paylasim-gorseli": "Imagem de compartilhamento",
    hesap: "Conta",
  },

  address: {
    title: "Endereço",
    hint: "O endereço em que sua página está no ar. Se você trocar, o endereço antigo continua funcionando por um tempo e depois para.",
    currentLabel: "Seu endereço atual",
    fieldLabel: "Novo endereço",
    domain: "caka.app/",
    placeholder: "seunovonome",
    hintFormat: `${USERNAME_MIN}-${USERNAME_MAX} caracteres; letras minúsculas, números e hífens.`,
    consequencesTitle: "Saiba disto antes de trocar",
    consequences: [
      `Seu endereço antigo redireciona temporariamente para o novo por ${USERNAME_REDIRECT_DAYS} dias. Quando esse prazo acaba, o redirecionamento para e o endereço antigo deixa de funcionar.`,
      `Nesses mesmos ${USERNAME_REDIRECT_DAYS} dias seu endereço antigo fica bloqueado; ninguém mais pode pegá-lo nesse período.`,
      "QR codes que você imprimiu, seus cartões de visita e links antigos que você deixou em outros lugares vão quebrar quando o prazo acabar — você vai precisar atualizá-los.",
      `Depois de uma troca, você não pode trocar seu endereço de novo por ${USERNAME_CHANGE_COOLDOWN_DAYS} dias.`,
    ],
    confirmLabel: "Li o que está acima e quero trocar meu endereço.",
    submit: "Trocar endereço",
    submitting: "Trocando…",
    checking: "verificando…",
    available: "este endereço está livre",
    unavailable: "Este endereço já está em uso",
    activeRedirectsTitle: "Seus endereços antigos que ainda redirecionam",
  },

  language: {
    title: "Idioma",
    hint: "O idioma em que você vê o Caka. Sua escolha fica salva neste navegador.",
    fieldLabel: "Idioma da interface",
    note: "O conteúdo da sua própria página não é traduzido; muda só a interface do Caka.",
  },

  share: {
    title: "Imagem de compartilhamento",
    hint: "Esta imagem aparece quando o link da sua página é compartilhado no WhatsApp, no X, no LinkedIn e em outros lugares.",
    templateTitle: "Modelo",
    templateGroupLabel: "Escolha de modelo",
    previewAlt: (label: string) => `Prévia da imagem de compartilhamento selecionada — ${label}`,
    photoTitle: "Origem da foto",
    photoGroupLabel: "Escolha da origem da foto",
    photoHint: "A foto usada nos modelos Retrato e Sangria total.",
    photoEmptyHint:
      "Os modelos Retrato e Sangria total usam sua foto de perfil. Se você adicionar um bloco de imagem à sua página e publicar, poderá escolher essa imagem aqui também.",
    photoDefaultLabel: "Minha foto de perfil",
    photoFallbackLabel: (index: number) => `Imagem ${index + 1}`,
  },

  account: {
    title: "Conta",
    hint: "Estes dados vêm da conta que você usou para entrar; não são alterados aqui.",
    providerLabel: "Forma de entrada",
    providerUnknown: "Desconhecida",
    emailLabel: "E-mail",
    emailVerified: "verificado",
    dataTitle: "Seus dados e exclusão da conta",
    dataBody:
      "Excluir sua conta ou pedir uma cópia dos seus dados ainda não é feito por você mesmo no painel. Se escrever para hello@caka.app, seu pedido pelo artigo 11 da lei turca de proteção de dados (KVKK) será processado.",
    dataMailLabel: "hello@caka.app",
    dataMailHref: "mailto:hello@caka.app",
    privacyLinkLabel: "Política de Privacidade",
    privacyLinkHref: "/gizlilik",
    privacyLinkPrefix: "Detalhes:",
  },

  addressErrors: {
    same: "Esse já é o seu endereço",
    cooldown: `Você trocou seu endereço nos últimos ${USERNAME_CHANGE_COOLDOWN_DAYS} dias; ainda não dá para trocar de novo`,
    taken: "Este endereço já está em uso, tente outro",
    locked: "Este endereço é o endereço antigo de outro usuário e está bloqueado no momento",
    no_profile: "Seu perfil não foi encontrado",
    conflict: "Seu endereço foi alterado em outro lugar; atualize a página",
    origin: "Origem da requisição inválida",
    unknown: "Algo deu errado, tente de novo",
  },

  notices: {
    cooldown: (availableOn: string, remainingDays: number) =>
      `Você trocou seu endereço há pouco tempo. Poderá trocar de novo depois de ${formatDate(availableOn, "pt-BR")} (cerca de ${remainingDays} dias).`,
    redirect: (oldUsername: string, expiresOn: string) =>
      `caka.app/${oldUsername} — redirecionando para cá e bloqueado até ${formatDate(expiresOn, "pt-BR")}.`,
    success: (previousUsername: string, username: string, expiresOn: string) =>
      `Seu endereço agora é caka.app/${username}. caka.app/${previousUsername} vai redirecionar para cá até ${formatDate(expiresOn, "pt-BR")}.`,
  },
} satisfies AyarlarContent;
