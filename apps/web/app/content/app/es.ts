import {
  type BlockIssueId,
  type BlockGridLimits,
  MAX_GALLERY_BLOCKS,
  type ProfileBlock,
} from "@caka/shared";

import type { AppContent } from "./index";

export const es = {
  titles: {
    editor: "Editor — Caka",
    dashboard: "Panel — Caka",
    settings: "Ajustes — Caka",
    login: "Iniciar sesión — Caka",
    setup: "Prepara tu página — Caka",
    onboardingFinish: "Preparando tu cuenta — Caka",
    onboardingReady: "Tu página está lista — Caka",
    notFound: "Página no encontrada — Caka",
  },

  blockTypes: {
    profile: "Perfil",
    social: "Redes sociales",
    link: "Enlace",
    text: "Texto",
    image: "Imagen",
    status: "Anuncio",
    gallery: "Galería de fotos",
    youtube: "YouTube",
    spotify: "Spotify",
  } satisfies Record<ProfileBlock["type"], string>,

  blockIssues: {
    profile_name: "Escribe tu nombre",
    social_target: "Escribe un enlace o un nombre de usuario",
    link_url: "Escribe la dirección del enlace",
    link_title: "Escribe un título",
    text_empty: "Escribe un texto",
    status_empty: "Escribe el anuncio",
    image_missing: "Sube una imagen",
    gallery_empty: "Añade una foto a la galería",
    youtube_video_url: "Escribe un enlace de vídeo de YouTube",
    youtube_channel_url: "Escribe un enlace de canal de YouTube",
    spotify_url: "Escribe un enlace de Spotify",
  } satisfies Record<BlockIssueId, string>,

  gridLimit: (blockLabel: string, limits: BlockGridLimits) =>
    `Un bloque de ${blockLabel} puede ser como mínimo ${limits.minW}×${limits.minH} y como máximo ${limits.maxW}×${limits.maxH}`,

  galleryCountLimit: `Tu página puede tener como máximo ${MAX_GALLERY_BLOCKS} bloques de galería`,

  editor: {
    layoutUnreadable: "No se ha podido leer la composición de la página",
    backToDashboard: "Volver al panel",
    toolbarLabel: "Herramientas del editor",
    addLink: "Añadir un enlace",
    addImage: "Añadir una imagen",
    addGallery: "Añadir una galería de fotos",
    mobilePreview: "Vista móvil",
    desktopPreview: "Vista de escritorio",
    pickTheme: "Elegir tema",
    editProfileInfo: "Editar la información general del perfil",
    saveFailed: "No se pudo guardar: comprueba tu conexión.",

    draftTitle: "Tienes cambios sin publicar",
    liveTitle: "Tu página publicada",
    draftShort: "Borrador",
    liveShort: "Publicada",
    addressLabel: (username: string, hasDraft: boolean) =>
      `caka.app/${username} — ${hasDraft ? "tiene un borrador" : "publicada"}`,
    publishing: "Publicando",
    publishingProgress: "Publicando…",
    publishFinish: "Terminar y publicar",
    publishShort: "Publicar",
    blockedTitle:
      "Tu página no se puede publicar hasta que estos bloques estén completos. Complétalos o quítalos:",

    fieldDescription: "Descripción",
    fieldTitle: "Título",
    fieldLink: "Enlace",

    imageUploading: "Subiendo…",
    imageReplace: "Cambiar la imagen",
    imageDrop: "Arrastra o elige",
    imageUploadFailed: "No se ha podido subir la imagen",

    galleryEmpty: "Todavía no hay fotos.",
    galleryAltPlaceholder: "Texto alternativo (opcional)",
    galleryAdd: "Añadir fotos (JPEG o PNG)",
    galleryMultiHint: "Puedes seleccionar más de una foto",

    resolving: "Resolviendo…",
    youtubeFailed: "No se ha podido resolver el enlace de YouTube.",
    youtubeFailedHint: "No se ha podido resolver el enlace de YouTube: comprueba el enlace.",
    youtubeTitlePlaceholder: "Si lo dejas vacío, la tarjeta muestra solo el vídeo",
    spotifyFailed: "No se ha podido resolver el enlace de Spotify.",
    spotifyFailedHint: "No se ha podido resolver el enlace de Spotify: comprueba el enlace.",
    spotifyAdded: (kindLabel: string) => `Añadido como ${kindLabel.toLowerCase()}`,

    dragHint: "mantén pulsado → arrastra",
    closePanel: "Cerrar el panel",
    deleteBlock: "Eliminar bloque",

    fieldName: "Nombre",
    fieldPlatform: "Plataforma",
    fieldSocialTarget: "Enlace o nombre de usuario",
    socialHint:
      "Puedes pegar el enlace del perfil o escribir solo el nombre de usuario: entendemos las dos cosas.",
    fieldImage: "Imagen",
    fieldAnnouncement: "Anuncio",
    galleryTitleHint:
      "El título solo se ve en las galerías de dos filas de alto. En las galerías bajas se usa para los lectores de pantalla.",
    photosLegend: (count: number, max: number) => `Fotos (${count}/${max})`,
    galleryMaxPhotos: (max: number, room: number) =>
      `Una galería puede tener como máximo ${max} fotos; se han añadido las ${room} primeras de tu selección.`,
    photoAltAria: (index: number) => `Texto alternativo de la foto ${index}`,
    photoUpAria: (index: number) => `Subir la foto ${index}`,
    photoDownAria: (index: number) => `Bajar la foto ${index}`,
    photoRemoveAria: (index: number) => `Quitar la foto ${index}`,
    pickerSocial: "Redes sociales",
    pickerContent: "Contenido",
    pickerNoResults: (query: string) => `Sin resultados para “${query}”.`,

    galleryFullHint: (max: number) =>
      `Una galería puede tener como máximo ${max} fotos. Quita una antes de añadir otra.`,
    galleryUploadStep: (done: number, total: number) => `Subiendo… (${done}/${total})`,
    galleryBlockLimit: (max: number) =>
      `Tu página puede tener como máximo ${max} galerías de fotos. Quita una antes de añadir otra.`,
    youtubeLinkLabel: "Enlace de YouTube",
    youtubeHint:
      "Distinguimos las direcciones de vídeo y de canal: añadimos lo que pegues.",
    optionalTitle: "Título (opcional)",
    spotifyLinkLabel: "Enlace de Spotify",
    spotifyHint:
      "Se pueden añadir canciones, álbumes, listas, artistas, pódcast y episodios: añadimos lo que pegues.",
    fixIssue: "Corregir",
    removeBlock: "Quitar",
    editedElsewhere: "La página se ha editado en otro sitio.",

    richText: {
      placeholder: "Escribe algo…",
      linkUrl: "Dirección del enlace",
      bold: "Negrita",
      italic: "Cursiva",
      orderedList: "Lista numerada",
      quote: "Cita",
      link: "Enlace",
      toolbarLabel: "Formato de texto",
    },
  },

  setup: {
    stepsLabel: "Pasos de configuración",
    nameRequired: "Tienes que escribir tu nombre",
    photoInvalid: "No se ha podido verificar la foto",
    linkInvalid: "Uno de los enlaces no es válido",
    photoUploadFailed: "No se ha podido subir la foto",
    photoUploading: "Subiendo…",
    photoReplace: "Cambiar la foto",
    nameLabel: "Tu nombre",
    bioLabel: "Descripción breve",
    bioPlaceholder: "Cuéntanos algo de ti en pocas palabras.",

    platformsTitle: "¿En qué plataformas estás?",
    platformsBody:
      "Cada plataforma que elijas aparece como un bloque en tu página. Los nombres de usuario los puedes poner después.",
    purposeTitle: "¿Para qué vas a usar Caka?",
    purposeBody: "Elige lo que encaje contigo. Preparamos tu página en consecuencia, sin pelearte con los ajustes.",
    discoveryKicker: "Una última pregunta antes de tu página",
    discoveryTitle: "¿Cómo conociste Caka?",
    templateTitle: "Elige una plantilla",
    templateBody: "Elige el estilo que encaje contigo y añade tu contenido después.",
    templatePreviewRole: "Diseño · Estambul",
    templateUse: "Empezar con esta plantilla",
    linksTitle: "Añade tus enlaces",
    linksBody: "Escribe los nombres de usuario de las plataformas que elegiste.",
    linksChosen: "Tu selección",
    usernameLabel: "Nombre de usuario",
    extraLinks: "Enlaces adicionales",

    buildingContent: "Buscando tu contenido…",
    buildingLinks: "Colocando tus enlaces en la página",
    readyKicker: "Tiene buena pinta",
    readyBody:
      "Tu página ha tenido un buen comienzo. Si sigues editándola, puedes mejorarla todavía más.",
    readyTitle: "Tu nueva página está publicada",
    readyCta: "Seguir editando mi página",

    bioTooLong: (max: number) => `La descripción puede tener como máximo ${max} caracteres`,
    bioOverBy: (over: number) =>
      `La descripción sobra por ${over} caracteres. Acórtala para continuar.`,
    stepAria: (current: number, total: number) => `Paso ${current} de ${total}`,
    skipStep: "Saltar este paso",
    takenFromAccount: (username: string) => `tomado de tu cuenta ${username}`,
    haveAccountSignIn: "¿Ya tienes cuenta? Inicia sesión",
    claimingAddress: (username: string) => `Estás reservando caka.app/${username}.`,
    termsNotice:
      "Al registrarte aceptas los términos de uso y la política de privacidad.",
    gridSoon: "El editor de cuadrícula llega muy pronto: tu página ya está publicada.",

    almostDone: "Casi listo",
    claimTitle: "Bienvenido",
    claimBody: "¿En qué dirección quieres publicar tu página?",
    claimAvailable: "✓ esta dirección está libre",
    claimTaken: "Esta dirección la acaban de ocupar, prueba con otra",
    claimUnknownError: "Algo ha salido mal, inténtalo de nuevo",
  },

  auth: {
    loginTitle: "Bienvenido de nuevo",
    loginBody: "Continúa donde lo dejaste.",
    loginCta: "iniciar sesión",
    signInGoogle: "Iniciar sesión con Google",
    signInApple: "Iniciar sesión con Apple",
    noAccount: "¿No tienes cuenta?",
    claimAddress: "Consigue tu dirección",
    homeAria: "Página de inicio de Caka",
    demoRole: "taller de cerámica · İzmir",
    demoLinkCalendar: "Calendario del taller",
    demoLinkContact: "Contacto",

    signOut: "Cerrar sesión",
    accountMenu: "Menú de la cuenta",
  },

  nav: {
    copied: "Copiado",
    copyLink: "Copiar enlace",
    pages: "Páginas",
    analytics: "Analíticas",
    settings: "Ajustes",
    viewProfile: "Ver el perfil",
    editProfile: "Editar el perfil",
    accountSettings: "Ajustes de la cuenta",
    draftNotice:
      "Tienes cambios sin publicar: la vista previa de abajo muestra la versión publicada.",
    editPage: "Editar la página",
    openPage: "Abrir la página",

    comingSoon: "Próximamente",
  },

  profile: {
    menuLabel: "Menú de Caka",
    blocksLabel: "Enlaces y contenido",
    addImage: "Añadir una imagen",
    shareImageAlt: (name: string) => `Imagen para compartir del perfil de ${name} en Caka`,
    description: (name: string) => `Los enlaces, los proyectos y el trabajo de ${name}.`,
    edit: "Editar",
    unclaimed: (username: string) => `caka.app/${username} todavía no es de nadie.`,

    availableAddress: "Esta dirección está libre",
    availableCta: "esta dirección está libre, ¡pillala!",
  },

  api: {
    origin: "Origen de la solicitud no válido",
    layoutReadFailed: "No se han podido leer los datos de la página; actualízala",
    layoutTooManyBlocks: (max: number) => `Tu página puede tener como máximo ${max} bloques`,
    draftInvalid: "Los datos del borrador no son válidos",
    blocksIncomplete: "Algunos bloques están incompletos",

    spotifyInvalid:
      "Esto no parece un enlace. Pega la dirección que obtienes con “Compartir → Copiar enlace” en Spotify.",
    spotifyNotSpotify:
      "Esta dirección no es de Spotify. Pega una dirección open.spotify.com o un enlace con el formato spotify:track:…",
    spotifyUnsupported:
      "Esta dirección de Spotify no es contenido que se pueda añadir. Se pueden añadir canciones, álbumes, listas, artistas, pódcast y episodios; los perfiles de usuario, las búsquedas y las páginas de biblioteca no.",
    spotifyNotFound: (kind: string) =>
      `No se ha encontrado este ${kind} en Spotify. Puede que se haya eliminado o que el enlace se haya copiado incompleto.`,
    spotifyUnavailable: "Spotify no ha respondido ahora mismo. Inténtalo en un momento.",

    youtubeInvalid: "Esto no parece un enlace. Pega la dirección de un vídeo o de un canal.",
    youtubeNotYoutube: "Esta dirección no es de YouTube. Pega una dirección youtube.com o youtu.be.",
    youtubeUnsupported:
      "Esta dirección de YouTube no es un vídeo ni un canal. Las listas de reproducción, las búsquedas y las páginas de feed no se pueden añadir.",
    youtubeChannelNotFound:
      "No se ha encontrado este canal. Comprueba la dirección o prueba con la dirección /channel/UC… del canal.",
    youtubeVideoNotFound:
      "No se ha encontrado el vídeo. Puede que se haya eliminado o sea privado, o que el enlace se haya copiado incompleto.",

    uploadOnlyJpegPng: "Solo puedes subir JPEG o PNG",
    uploadTooLarge: "La foto puede pesar como máximo 5 MB",
    uploadTypeUnverified: "No se ha podido verificar el tipo de la foto",
    uploadSaveFailed: "No se ha podido guardar la foto",
  },

  errors: {
    genericTitle: "Algo ha salido mal",
    genericBody: "Se ha producido un error inesperado. Inténtalo de nuevo.",
    notFoundTitle: "Página no encontrada",
    notFoundBody: "La página que buscas no existe o puede que se haya movido.",
    profileErrorTitle: "Esta página no se puede mostrar",
    profileErrorBody: "Algo ha salido mal; inténtalo más tarde.",
    backHome: "Volver al inicio",
  },
} satisfies AppContent;
