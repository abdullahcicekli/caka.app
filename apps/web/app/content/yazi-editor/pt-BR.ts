import { MAX_POSTS_PER_PROFILE, POST_BODY_MAX_BYTES } from "@caka/shared";

import type { YaziEditorContent } from "./index";

const MAX_KB = POST_BODY_MAX_BYTES / 1024;

export const ptBR = {
  nav: "Publicações",

  list: {
    title: "Publicações",
    intro: `Textos longos publicados no seu perfil, cada um com o próprio endereço. Você pode ter até ${MAX_POSTS_PER_PROFILE} publicações; rascunhos também contam.`,
    empty: "Você ainda não tem publicações. Comece a primeira aqui embaixo.",
    newPost: "Nova publicação",
    limitReason: `Você atingiu o limite de ${MAX_POSTS_PER_PROFILE} publicações. Exclua uma antes de começar outra.`,
    statusDraft: "Rascunho",
    statusPublished: "Publicada",
  },

  editor: {
    metaTitle: "Editor de publicações",
    backToList: "Voltar às publicações",
    titlePlaceholder: "Título",
    bodyPlaceholder: "Comece a escrever…",
    slugLabel: "Endereço",
    slugHint: "O endereço pode ser alterado até a publicação ser publicada pela primeira vez.",
    slugLockedReason:
      "O endereço de uma publicação já publicada não pode ser alterado, para que os links compartilhados não quebrem.",
    slugStatus: {
      checking: "Verificando endereço…",
      available: "Este endereço está disponível.",
      taken: "Este endereço já é usado por outra publicação sua.",
      too_short: "O endereço precisa ter pelo menos 3 caracteres.",
      too_long: "O endereço pode ter no máximo 80 caracteres.",
      invalid_chars: "O endereço só pode conter letras minúsculas, dígitos e hífens.",
      reserved: "Este endereço é reservado; escolha outro.",
    },
    save: {
      pending: "O rascunho é salvo automaticamente quando você adiciona um título.",
      saving: "Salvando…",
      saved: "Salvo",
      error: "Não foi possível salvar — verifique sua conexão. Suas alterações continuam nesta aba.",
      conflict:
        "Esta publicação foi atualizada em outra aba. Suas últimas alterações aqui não foram salvas — copie seu texto antes de recarregar.",
      unauthenticated:
        "Parece que você saiu da conta. Entre em uma nova aba; suas alterações continuam nesta aba.",
      tooLarge: `A publicação passa do limite de ${MAX_KB} KB e não está sendo salva. Encurte o conteúdo para salvar.`,
    },
    sizeIndicator: (kb: string): string => `${kb} / ${MAX_KB} KB`,
    publish: "Publicar",
    unpublish: "Voltar a rascunho",
    remove: "Excluir",
    removeConfirm: "Excluir esta publicação permanentemente?",
    viewPost: "Abrir publicação",
    actionFailed: "Não foi possível concluir a ação; tente de novo.",
    toolbar: {
      h2: "Título de seção",
      h3: "Subtítulo",
      codeBlock: "Bloco de código",
      image: "Adicionar imagem",
    },
    imageUploadFailed: "Falha ao enviar a imagem",
  },
} satisfies YaziEditorContent;
