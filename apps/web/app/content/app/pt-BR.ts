import {
  ASSET_MAX_COUNT,
  ASSET_MAX_TOTAL_BYTES,
  DOCUMENT_MAX_BYTES,
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
    status: "Aviso",
    gallery: "Foto",
    youtube: "YouTube",
    spotify: "Spotify",
    document: "Documento",
    location: "Localização",
    ayet: "Versículo do Alcorão",
  } satisfies Record<ProfileBlock["type"], string>,

  blockIssues: {
    profile_name: "Escreva seu nome",
    social_target: "Escreva um link ou um nome de usuário",
    link_url: "Escreva o endereço do link",
    link_title: "Escreva um título",
    text_empty: "Escreva um texto",
    status_empty: "Escreva o aviso",
    gallery_empty: "Adicione uma foto",
    youtube_video_url: "Escreva um link de vídeo do YouTube",
    youtube_channel_url: "Escreva um link de canal do YouTube",
    spotify_url: "Escreva um link do Spotify",
    document_missing: "Envie um documento",
    location_missing: "Busque e escolha o seu lugar",
    ayet_verse: "Escolha um versículo",
  } satisfies Record<BlockIssueId, string>,

  gridLimit: (blockLabel: string, limits: BlockGridLimits) =>
    `Um bloco de ${blockLabel} pode ter no mínimo ${limits.minW}×${limits.minH} e no máximo ${limits.maxW}×${limits.maxH}`,

  galleryCountLimit: `Sua página pode ter no máximo ${MAX_GALLERY_BLOCKS} blocos com várias fotos`,

  editor: {
    documentField: "Documento (PDF)",
    documentDrop: "Arraste ou escolha um PDF",
    documentReplace: "Trocar o documento",
    documentUploading: "Enviando…",
    documentUploadFailed: "Não foi possível enviar o documento",
    documentHint: (maxMb: number) =>
      `Por enquanto só PDF, até ${maxMb} MB. O cartão escreve sozinho o nome, o tamanho e a data.`,
    documentTitlePlaceholder: "Se deixar vazio, o cartão mostra o nome do arquivo",
    documentServeHint:
      "O documento é servido pelo caka.app e baixa ao clicar; “Prévia” abre em uma nova aba.",

    layoutUnreadable: "Não foi possível ler o layout da página",
    backToDashboard: "Voltar ao painel",
    toolbarLabel: "Ferramentas do editor",
    addLink: "Adicionar um link",
    addPhoto: "Adicionar uma foto",
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

    fieldName: "Nome",
    fieldPlatform: "Plataforma",
    fieldSocialTarget: "Link ou nome de usuário",
    socialHint:
      "Você pode colar o link do perfil ou escrever só o nome de usuário — a gente entende os dois.",
    fieldAnnouncement: "Aviso",
    galleryTitleHint:
      "O título só aparece em cartões com mais de duas linhas de altura. Em cartões curtos, ele serve aos leitores de tela.",
    photosLegend: (count: number, max: number) => `Fotos (${count}/${max})`,
    galleryMaxPhotos: (max: number, room: number) =>
      `Um bloco pode ter no máximo ${max} fotos; as primeiras ${room} da sua seleção foram adicionadas.`,
    photoAltAria: (index: number) => `Texto alternativo da foto ${index}`,
    photoUpAria: (index: number) => `Mover a foto ${index} para cima`,
    photoDownAria: (index: number) => `Mover a foto ${index} para baixo`,
    photoRemoveAria: (index: number) => `Remover a foto ${index}`,

    uploadPercent: (percent: number) => `Enviando… ${percent}%`,
    uploadProgress: (done: number, total: number, percent: number) =>
      `Enviando… ${done}/${total} · ${percent}%`,

    photoLayoutLegend: "Layout",
    photoLayoutGrid: "Grade",
    photoLayoutSlider: "Carrossel",
    photoLayoutHint:
      "Na grade todas as fotos aparecem ao mesmo tempo; no carrossel elas trocam a cada 4 segundos.",
    photoLinkHint:
      "O link só funciona em um bloco com uma única foto; com várias fotos, o clique amplia a foto.",
    photoLimitHint: (max: number) =>
      `Sua página pode ter no máximo ${max} blocos com várias fotos. Remova uma foto de outra galeria antes de adicionar a segunda aqui.`,

    pickerSocial: "Redes sociais",
    pickerContent: "Conteúdo",
    pickerNoResults: (query: string) => `Nenhum resultado para “${query}”.`,

    galleryFullHint: (max: number) =>
      `Um bloco pode ter no máximo ${max} fotos. Remova uma antes de adicionar outra.`,
    galleryBlockLimit: (max: number) =>
      `Sua página pode ter no máximo ${max} blocos de foto. Remova um antes de adicionar outro.`,
    youtubeLinkLabel: "Link do YouTube",
    youtubeHint:
      "A gente diferencia endereços de vídeo e de canal — adicionamos o que você colar.",
    linkTitlePlaceholder: "Ex. Portfólio",
    optionalTitle: "Título (opcional)",
    spotifyLinkLabel: "Link do Spotify",
    spotifyHint:
      "Dá para adicionar faixas, álbuns, playlists, artistas, podcasts e episódios — adicionamos o que você colar.",
    locationSearchLabel: "Onde você está",
    locationSearchPlaceholder: "Busque uma cidade ou bairro…",
    locationSearching: "Buscando…",
    locationNoResults: (query: string) => `Nenhum lugar encontrado para “${query}”.`,
    locationClear: "Remover localização",
    locationPrivacyHint:
      "A busca fica no nível de cidade ou bairro e a coordenada é arredondada para cerca de 1 km antes de ser salva. Sua página mostra o nome do lugar, o país, uma posição aproximada e a hora local de lá — não o seu endereço exato.",
    locationNoTimeZone: "Nenhum fuso horário encontrado para este lugar; o cartão não vai mostrar a hora.",
    ayetVariantLegend: "Versão do card",
    ayetVariantArabic: "Só árabe",
    ayetVariantMeal: "Só tradução",
    ayetVariantBoth: "As duas juntas",
    ayetVariantHint:
      "A versão define a tipografia do card e o tamanho mínimo dele: a escrita árabe pede mais espaço, e mostrar as duas pede o máximo.",
    ayetSearchLabel: "Buscar versículos",
    ayetSearchPlaceholder: "Bakara 255 ou uma palavra",
    ayetSearchHint:
      "Escreva o nome da surata e o número do versículo (“Bakara 255”, “2:255”) ou busque uma palavra na tradução para o turco.",
    ayetSearching: "Buscando versículos…",
    ayetSuggestionsLabel: "Sugestões de versículos",
    ayetResultCount: (count: number) =>
      `${count === 1 ? "1 versículo" : `${count} versículos`} na lista. Use as setas para navegar e Enter para selecionar.`,
    ayetNoResults: (query: string) => `Nenhum versículo encontrado para “${query}”.`,
    ayetFailed: "Não foi possível acessar a fonte dos versículos — verifique sua conexão.",
    ayetPickedLegend: "Versículo selecionado",
    ayetSearchOpen: "Escolher outro versículo",
    ayetSearchClose: "Fechar a busca",
    ayetClear: "Remover o versículo",
    ayetSelected: (surahName: string, verse: number) => `${surahName} ${verse} selecionado`,
    ayetSourceNote: (translator: string) =>
      `O texto árabe está em escrita uthmani (Hafs); a tradução para o turco é de ${translator} e aparece como crédito no rodapé do card.`,
    fixIssue: "Corrigir",
    removeBlock: "Remover",
    editedElsewhere: "A página foi editada em outro lugar.",

    blockPickerAria: "Galeria de blocos",
    searchPlaceholder: "Buscar…",
    categoriesAria: "Categorias",
    clearFilterAria: "Limpar o filtro",
    doneAria: "Pronto",
    deleteAction: "Excluir",
    applyAction: "Aplicar",
    actionRequired: "Ação necessária",
    refresh: "Atualizar",
    generalInfo: "Informações gerais",
    addBlock: "Adicionar bloco",
    themeAria: "Tema",
    addText: "Adicionar texto",
    addStatus: "Adicionar aviso",
    addLocation: "Adicionar localização",
    youtubePlaceholder: "youtube.com/watch?v=… ou youtube.com/@canal",
    spotifyPlaceholder: "open.spotify.com/track/… ou spotify:album:…",

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

    bioTooLong: (max: number) => `A descrição pode ter no máximo ${max} caracteres`,
    bioOverBy: (over: number) =>
      `A descrição está ${over} caracteres maior. Encurte para continuar.`,
    stepAria: (current: number, total: number) => `Etapa ${current} de ${total}`,
    skipStep: "Pular esta etapa",
    takenFromAccount: (username: string) => `obtido da sua conta ${username}`,
    haveAccountSignIn: "Já tem conta? Entre",
    claimingAddress: (username: string) => `Você está pegando caka.app/${username}.`,
    termsNotice:
      "Ao se cadastrar, você aceita os termos de uso e a política de privacidade.",
    gridSoon: "O editor em grade chega muito em breve — sua página já está no ar.",

    goToPage: "Ir para sua página",
    back: "Voltar",
    addressPlaceholder: "endereço",
    handlePlaceholder: "voce",
    continueAria: "Continuar",
    checking: "verificando…",
    claimCta: "Pegar o endereço",
    signUpGoogle: "Cadastrar com o Google",
    signUpApple: "Cadastrar com a Apple",
    almostDone: "Quase lá",
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
    signInGoogle: "Entrar com o Google",
    signInApple: "Entrar com a Apple",
    noAccount: "Não tem conta?",
    claimAddress: "Pegue seu endereço",
    homeAria: "Página inicial do Caka",
    demoAlt: "Uma página real do Caka: o link de agendamento, o plano alimentar e a galeria da nutricionista Büşra Kaya",

    signOut: "Sair",
    accountMenu: "Menu da conta",
  },

  nav: {
    copied: "Copiado",
    copyLink: "Copiar link",
    pages: "Páginas",
    analytics: "Analytics",
    settings: "Configurações",
    homeAria: "Início",
    dashboard: "Painel",
    viewProfile: "Ver o perfil",
    editProfile: "Editar o perfil",
    accountSettings: "Configurações da conta",
    draftNotice:
      "Você tem alterações não publicadas — a prévia abaixo mostra a versão no ar.",
    editPage: "Editar a página",
    openPage: "Abrir a página",
  },

  profile: {
    menuLabel: "Menu do Caka",
    profileInfoAria: "Informações do perfil",
    blocksLabel: "Links e conteúdo",
    shareImageAlt: (name: string) => `Imagem de compartilhamento do perfil de ${name} no Caka`,
    description: (name: string) => `Os links, os projetos e os trabalhos de ${name}.`,
    edit: "Editar",
    unclaimed: (username: string) => `caka.app/${username} ainda não é de ninguém.`,

    availableAddress: "Este endereço está livre",
    claimThisAddress: "Pegue este endereço",
    availableCta: "este endereço está livre, pegue!",
  },

  api: {
    documentOnlyPdf: "Por enquanto você só pode enviar PDF",
    documentTooLarge: `O documento pode ter no máximo ${DOCUMENT_MAX_BYTES / (1024 * 1024)} MB`,
    documentTypeUnverified: "Não foi possível verificar se o arquivo é um PDF",
    documentSaveFailed: "Não foi possível salvar o documento",
    quota: {
      count: `Você pode enviar no máximo ${ASSET_MAX_COUNT} arquivos. Para adicionar outro, remova antes os que não usa mais.`,
      bytes: `Seu espaço total é de ${Math.round(ASSET_MAX_TOTAL_BYTES / (1024 * 1024))} MB e este arquivo não cabe. Para adicionar outro, remova antes os que não usa mais.`,
    },

    origin: "Origem da requisição inválida",
    layoutReadFailed: "Não foi possível ler os dados da página; atualize a página",
    layoutTooManyBlocks: (max: number) => `Sua página pode ter no máximo ${max} blocos`,
    draftInvalid: "Os dados do rascunho são inválidos",
    blocksIncomplete: "Alguns blocos estão incompletos",

    layoutInvalid: "Os dados da página são inválidos",
    profileNotFound: "Perfil não encontrado",
    layoutConflict: "A página foi atualizada em outro lugar",
    layoutTooLarge: "Os dados da página são grandes demais",
    settingsInvalid: "Os dados das configurações são inválidos",
    settingsTooLarge: "Os dados das configurações são grandes demais",
    imageNotOnPage: "A imagem escolhida não está na sua página",
    requestInvalid: "Os dados da requisição são inválidos",
    requestTooLarge: "Os dados da requisição são grandes demais",
    publishFailed: "Não foi possível publicar a página",

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

    locationQueryTooLong: (max: number) => `A busca pode ter no máximo ${max} caracteres`,
    locationUnavailable: "O serviço de localização não respondeu. Tente de novo em instantes.",
    ayetUnavailable: "A fonte dos versículos não respondeu agora. Tente de novo daqui a pouco.",
    ayetSurahUnknown: "Não existe essa surata. Escreva um número de 1 a 114 ou o nome de uma surata.",
    ayetVerseOutOfRange: (surahName: string, count: number) =>
      `A surata ${surahName} tem ${count} versículos; não há versículo com esse número.`,
    ayetQueryTooShort: (min: number) => `Escreva pelo menos ${min} letras para buscar.`,

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
    illustrationAlt:
      "Uma paisagem em miniatura feita de lã tricotada e massinha: arbustos redondos e um riacho azul serpenteando entre eles",
    createPage: "Crie sua própria página",
    backHome: "Voltar para o início",
  },
} satisfies AppContent;
