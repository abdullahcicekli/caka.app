import {
  type BlockIssueId,
  type BlockGridLimits,
  MAX_GALLERY_BLOCKS,
  type ProfileBlock,
} from "@caka/shared";

import type { AppContent } from "./index";

export const ptBR = {
  titles: {
    editor: "Editor — Caka",
    dashboard: "Painel — Caka",
    settings: "Configurações — Caka",
    login: "Entrar — Caka",
    setup: "Prepare sua página — Caka",
    onboardingFinish: "Preparando sua conta — Caka",
    onboardingReady: "Sua página está pronta — Caka",
    notFound: "Página não encontrada — Caka",
  },

  blockTypes: {
    profile: "Perfil",
    social: "Redes sociais",
    link: "Link",
    text: "Texto",
    image: "Imagem",
    status: "Aviso",
    gallery: "Galeria de fotos",
    youtube: "YouTube",
    spotify: "Spotify",
  } satisfies Record<ProfileBlock["type"], string>,

  blockIssues: {
    profile_name: "Escreva seu nome",
    social_target: "Escreva um link ou um nome de usuário",
    link_url: "Escreva o endereço do link",
    link_title: "Escreva um título",
    text_empty: "Escreva um texto",
    status_empty: "Escreva o aviso",
    image_missing: "Envie uma imagem",
    gallery_empty: "Adicione uma foto à galeria",
    youtube_video_url: "Escreva um link de vídeo do YouTube",
    youtube_channel_url: "Escreva um link de canal do YouTube",
    spotify_url: "Escreva um link do Spotify",
  } satisfies Record<BlockIssueId, string>,

  gridLimit: (blockLabel: string, limits: BlockGridLimits) =>
    `Um bloco de ${blockLabel} pode ter no mínimo ${limits.minW}×${limits.minH} e no máximo ${limits.maxW}×${limits.maxH}`,

  galleryCountLimit: `Sua página pode ter no máximo ${MAX_GALLERY_BLOCKS} blocos de galeria`,

  editor: {
    layoutUnreadable: "Não foi possível ler o layout da página",
    backToDashboard: "Voltar ao painel",
    toolbarLabel: "Ferramentas do editor",
    addLink: "Adicionar um link",
    addImage: "Adicionar uma imagem",
    addGallery: "Adicionar uma galeria de fotos",
    mobilePreview: "Prévia no celular",
    desktopPreview: "Visão de desktop",
    pickTheme: "Escolher tema",
    editProfileInfo: "Editar as informações gerais do perfil",
    saveFailed: "Não foi possível salvar — verifique sua conexão.",

    draftTitle: "Você tem alterações não publicadas",
    liveTitle: "Sua página no ar",
    draftShort: "Rascunho",
    liveShort: "No ar",
    addressLabel: (username: string, hasDraft: boolean) =>
      `caka.app/${username} — ${hasDraft ? "tem rascunho" : "no ar"}`,
    publishing: "Publicando",
    publishingProgress: "Publicando…",
    publishFinish: "Concluir e publicar",
    publishShort: "Publicar",
    blockedTitle:
      "Sua página não pode ser publicada enquanto estes blocos não estiverem completos. Preencha ou remova:",

    fieldDescription: "Descrição",
    fieldTitle: "Título",
    fieldLink: "Link",

    imageUploading: "Enviando…",
    imageReplace: "Trocar a imagem",
    imageDrop: "Arraste ou escolha",
    imageUploadFailed: "Não foi possível enviar a imagem",

    galleryEmpty: "Ainda não há fotos.",
    galleryAltPlaceholder: "Texto alternativo (opcional)",
    galleryAdd: "Adicionar fotos (JPEG ou PNG)",
    galleryMultiHint: "Você pode selecionar mais de uma foto",

    resolving: "Resolvendo…",
    youtubeFailed: "Não foi possível resolver o link do YouTube.",
    youtubeFailedHint: "Não foi possível resolver o link do YouTube — confira o link.",
    youtubeTitlePlaceholder: "Se deixar vazio, o card mostra só o vídeo",
    spotifyFailed: "Não foi possível resolver o link do Spotify.",
    spotifyFailedHint: "Não foi possível resolver o link do Spotify — confira o link.",
    spotifyAdded: (kindLabel: string) => `Adicionado como ${kindLabel.toLowerCase()}`,

    dragHint: "segure → arraste",
    closePanel: "Fechar o painel",
    deleteBlock: "Excluir bloco",

    richText: {
      placeholder: "Escreva alguma coisa…",
      linkUrl: "Endereço do link",
      bold: "Negrito",
      italic: "Itálico",
      orderedList: "Lista numerada",
      quote: "Citação",
      link: "Link",
      toolbarLabel: "Formatação de texto",
    },
  },

  setup: {
    stepsLabel: "Etapas da configuração",
    nameRequired: "Você precisa escrever seu nome",
    photoInvalid: "Não foi possível verificar a foto",
    linkInvalid: "Um dos links não é válido",
    photoUploadFailed: "Não foi possível enviar a foto",
    photoUploading: "Enviando…",
    photoReplace: "Trocar a foto",
    nameLabel: "Seu nome",
    bioLabel: "Descrição curta",
    bioPlaceholder: "Fale um pouco sobre você.",

    platformsTitle: "Em quais plataformas você está?",
    platformsBody:
      "Cada plataforma que você escolher aparece como um bloco na sua página. Os nomes de usuário você pode preencher depois.",
    purposeTitle: "Para que você vai usar o Caka?",
    purposeBody: "Escolha o que combina com você. A gente prepara sua página de acordo, sem você mexer em configurações.",
    discoveryKicker: "Uma última pergunta antes da sua página",
    discoveryTitle: "Como você conheceu o Caka?",
    templateTitle: "Escolha um modelo",
    templateBody: "Escolha o estilo que combina com você e adicione seu conteúdo depois.",
    templatePreviewRole: "Design · Istambul",
    templateUse: "Começar com este modelo",
    linksTitle: "Adicione seus links",
    linksBody: "Escreva os nomes de usuário das plataformas que você escolheu.",
    linksChosen: "Suas escolhas",
    usernameLabel: "Nome de usuário",
    extraLinks: "Links extras",

    buildingContent: "Buscando seu conteúdo…",
    buildingLinks: "Colocando seus links na página",
    readyKicker: "Ficou bom",
    readyBody:
      "Sua página teve um bom começo. Continuando a editar, você pode deixá-la ainda melhor.",
    readyTitle: "Sua nova página está no ar",
    readyCta: "Continuar editando minha página",

    claimTitle: "Boas-vindas",
    claimBody: "Em qual endereço sua página deve ficar no ar?",
    claimAvailable: "✓ este endereço está livre",
    claimTaken: "Este endereço acabou de ser pego, tente outro",
    claimUnknownError: "Algo deu errado, tente de novo",
  },

  auth: {
    loginTitle: "Que bom te ver de novo",
    loginBody: "Continue de onde parou.",
    loginCta: "entrar",
    signOut: "Sair",
    accountMenu: "Menu da conta",
  },

  nav: {
    copied: "Copiado",
    copyLink: "Copiar link",
    comingSoon: "Em breve",
  },

  profile: {
    menuLabel: "Menu do Caka",
    blocksLabel: "Links e conteúdo",
    addImage: "Adicionar uma imagem",
    availableAddress: "Este endereço está livre",
    availableCta: "este endereço está livre, pegue!",
  },

  api: {
    origin: "Origem da requisição inválida",
    layoutReadFailed: "Não foi possível ler os dados da página; atualize a página",
    layoutTooManyBlocks: (max: number) => `Sua página pode ter no máximo ${max} blocos`,
    draftInvalid: "Os dados do rascunho são inválidos",
    blocksIncomplete: "Alguns blocos estão incompletos",

    spotifyInvalid:
      "Isso não parece um link. Cole o endereço obtido em “Compartilhar → Copiar link” no Spotify.",
    spotifyNotSpotify:
      "Este endereço não é do Spotify. Cole um endereço open.spotify.com ou um link no formato spotify:track:…",
    spotifyUnsupported:
      "Este endereço do Spotify não é um conteúdo que dê para adicionar. Faixas, álbuns, playlists, artistas, podcasts e episódios podem ser adicionados; perfis de usuário, buscas e páginas de biblioteca não.",
    spotifyNotFound: (kind: string) =>
      `Este ${kind} não foi encontrado no Spotify. Pode ter sido removido ou o link pode ter sido copiado incompleto.`,
    spotifyUnavailable: "O Spotify não respondeu agora. Tente de novo daqui a pouco.",

    youtubeInvalid: "Isso não parece um link. Cole o endereço de um vídeo ou de um canal.",
    youtubeNotYoutube: "Este endereço não é do YouTube. Cole um endereço youtube.com ou youtu.be.",
    youtubeUnsupported:
      "Este endereço do YouTube não é um vídeo nem um canal. Playlists, buscas e páginas de feed não podem ser adicionadas.",
    youtubeChannelNotFound:
      "Este canal não foi encontrado. Confira o endereço ou tente o endereço /channel/UC… do canal.",
    youtubeVideoNotFound:
      "O vídeo não foi encontrado. Pode ter sido excluído ou estar privado, ou o link pode ter sido copiado incompleto.",

    uploadOnlyJpegPng: "Você só pode enviar JPEG ou PNG",
    uploadTooLarge: "A foto pode ter no máximo 5 MB",
    uploadTypeUnverified: "Não foi possível verificar o tipo da foto",
    uploadSaveFailed: "Não foi possível salvar a foto",
  },

  errors: {
    genericTitle: "Algo deu errado",
    genericBody: "Ocorreu um erro inesperado. Tente de novo.",
    notFoundTitle: "Página não encontrada",
    notFoundBody: "A página que você procura não existe ou pode ter sido movida.",
    profileErrorTitle: "Não dá para exibir esta página",
    profileErrorBody: "Algo deu errado; tente mais tarde.",
    backHome: "Voltar para o início",
  },
} satisfies AppContent;
