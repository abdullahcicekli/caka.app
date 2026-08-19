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
    status: "Anuncio",
    gallery: "Foto",
    youtube: "YouTube",
    spotify: "Spotify",
    document: "Documento",
    location: "Ubicación",
    ayet: "Versículo del Corán",
  } satisfies Record<ProfileBlock["type"], string>,

  blockIssues: {
    profile_name: "Escribe tu nombre",
    social_target: "Escribe un enlace o un nombre de usuario",
    link_url: "Escribe la dirección del enlace",
    link_title: "Escribe un título",
    text_empty: "Escribe un texto",
    status_empty: "Escribe el anuncio",
    gallery_empty: "Añade una foto",
    youtube_video_url: "Escribe un enlace de vídeo de YouTube",
    youtube_channel_url: "Escribe un enlace de canal de YouTube",
    spotify_url: "Escribe un enlace de Spotify",
    document_missing: "Sube un documento",
    location_missing: "Busca y elige tu lugar",
    ayet_verse: "Elige un versículo",
  } satisfies Record<BlockIssueId, string>,

  gridLimit: (blockLabel: string, limits: BlockGridLimits) =>
    `Un bloque de ${blockLabel} puede ser como mínimo ${limits.minW}×${limits.minH} y como máximo ${limits.maxW}×${limits.maxH}`,

  galleryCountLimit: `Tu página puede tener como máximo ${MAX_GALLERY_BLOCKS} bloques con varias fotos`,

  editor: {
    documentField: "Documento (PDF)",
    documentDrop: "Arrastra o elige un PDF",
    documentReplace: "Cambiar el documento",
    documentUploading: "Subiendo…",
    documentUploadFailed: "No se ha podido subir el documento",
    documentHint: (maxMb: number) =>
      `De momento solo PDF, hasta ${maxMb} MB. La tarjeta escribe sola el nombre, el tamaño y la fecha.`,
    documentTitlePlaceholder: "Si lo dejas vacío, la tarjeta muestra el nombre del archivo",
    documentServeHint:
      "El documento se sirve desde caka.app y se descarga al hacer clic; «Vista previa» lo abre en una pestaña nueva.",

    layoutUnreadable: "No se ha podido leer la composición de la página",
    backToDashboard: "Volver al panel",
    toolbarLabel: "Herramientas del editor",
    addLink: "Añadir un enlace",
    addPhoto: "Añadir una foto",
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
    fieldAnnouncement: "Anuncio",
    galleryTitleHint:
      "El título solo aparece en tarjetas de más de dos filas de alto. En tarjetas cortas se usa para lectores de pantalla.",
    photosLegend: (count: number, max: number) => `Fotos (${count}/${max})`,
    galleryMaxPhotos: (max: number, room: number) =>
      `Un bloque puede tener como máximo ${max} fotos; se añadieron las primeras ${room} de tu selección.`,
    photoAltAria: (index: number) => `Texto alternativo de la foto ${index}`,
    photoUpAria: (index: number) => `Subir la foto ${index}`,
    photoDownAria: (index: number) => `Bajar la foto ${index}`,
    photoRemoveAria: (index: number) => `Quitar la foto ${index}`,

    uploadPercent: (percent: number) => `Subiendo… ${percent} %`,
    uploadProgress: (done: number, total: number, percent: number) =>
      `Subiendo… ${done}/${total} · ${percent} %`,

    photoLayoutLegend: "Diseño",
    photoLayoutGrid: "Cuadrícula",
    photoLayoutSlider: "Carrusel",
    photoLayoutHint:
      "En la cuadrícula se ven todas las fotos a la vez; en el carrusel cambian cada 4 segundos.",
    photoLinkHint:
      "El enlace solo funciona en un bloque de una sola foto; con varias fotos, al hacer clic la foto se amplía.",
    photoLimitHint: (max: number) =>
      `Tu página puede tener como máximo ${max} bloques con varias fotos. Quita una foto de otra galería antes de añadir la segunda aquí.`,

    pickerSocial: "Redes sociales",
    pickerContent: "Contenido",
    pickerNoResults: (query: string) => `Sin resultados para “${query}”.`,

    galleryFullHint: (max: number) =>
      `Un bloque puede tener como máximo ${max} fotos. Quita una antes de añadir otra.`,
    galleryBlockLimit: (max: number) =>
      `Tu página puede tener como máximo ${max} bloques de fotos. Quita uno antes de añadir otro.`,
    youtubeLinkLabel: "Enlace de YouTube",
    youtubeHint:
      "Distinguimos las direcciones de vídeo y de canal: añadimos lo que pegues.",
    linkTitlePlaceholder: "Ej. Portafolio",
    optionalTitle: "Título (opcional)",
    spotifyLinkLabel: "Enlace de Spotify",
    spotifyHint:
      "Se pueden añadir canciones, álbumes, listas, artistas, pódcast y episodios: añadimos lo que pegues.",
    locationSearchLabel: "Dónde estás",
    locationSearchPlaceholder: "Busca una ciudad o distrito…",
    locationSearching: "Buscando…",
    locationNoResults: (query: string) => `No se encontró ningún lugar para «${query}».`,
    locationSelected: (label: string) => `${label} seleccionado`,
    locationClear: "Quitar ubicación",
    locationPrivacyHint:
      "La búsqueda se limita al nivel de ciudad o distrito y la coordenada se redondea a aproximadamente 1 km antes de guardarse. En tu página se ven el nombre del lugar, el país, una posición aproximada y la hora local de allí, no tu dirección exacta.",
    locationTimeZone: (zone: string) => `Zona horaria: ${zone}`,
    locationNoTimeZone: "No se encontró zona horaria para este lugar; la tarjeta no mostrará la hora.",
    ayetVariantLegend: "Versión de la tarjeta",
    ayetVariantArabic: "Solo árabe",
    ayetVariantMeal: "Solo traducción",
    ayetVariantBoth: "Las dos juntas",
    ayetVariantHint:
      "La versión define la tipografía de la tarjeta y su tamaño mínimo: la escritura árabe necesita más espacio y mostrar las dos necesita el máximo.",
    ayetSearchLabel: "Buscar versículos",
    ayetSearchPlaceholder: "Bakara 255 o una palabra",
    ayetSearchHint:
      "Escribe el nombre de la sura y el número de versículo («Bakara 255», «2:255») o busca una palabra en la traducción al turco.",
    ayetSearching: "Buscando versículos…",
    ayetSuggestionsLabel: "Sugerencias de versículos",
    ayetResultCount: (count: number) =>
      `${count === 1 ? "1 versículo" : `${count} versículos`} en la lista. Usa las flechas para navegar y Intro para seleccionar.`,
    ayetNoResults: (query: string) => `No se encontró ningún versículo para «${query}».`,
    ayetFailed: "No se pudo acceder a la fuente de versículos — revisa tu conexión.",
    ayetSelected: (surahName: string, verse: number) => `${surahName} ${verse} añadido`,
    ayetSourceNote: (translator: string) =>
      `El texto árabe está en escritura uthmani (Hafs); la traducción al turco es de ${translator} y se acredita al pie de la tarjeta.`,
    fixIssue: "Corregir",
    removeBlock: "Quitar",
    editedElsewhere: "La página se ha editado en otro sitio.",

    blockPickerAria: "Galería de bloques",
    searchPlaceholder: "Buscar…",
    categoriesAria: "Categorías",
    clearFilterAria: "Quitar el filtro",
    doneAria: "Listo",
    deleteAction: "Eliminar",
    applyAction: "Aplicar",
    actionRequired: "Acción necesaria",
    refresh: "Actualizar",
    generalInfo: "Información general",
    addBlock: "Añadir bloque",
    themeAria: "Tema",
    addText: "Añadir texto",
    addStatus: "Añadir anuncio",
    addYoutube: "Añadir YouTube",
    youtubePlaceholder: "youtube.com/watch?v=… o youtube.com/@canal",
    spotifyPlaceholder: "open.spotify.com/track/… o spotify:album:…",

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

    goToPage: "Ir a tu página",
    back: "Atrás",
    addressPlaceholder: "dirección",
    handlePlaceholder: "tu",
    continueAria: "Continuar",
    checking: "comprobando…",
    claimCta: "Conseguir la dirección",
    signUpGoogle: "Registrarse con Google",
    signUpApple: "Registrarse con Apple",
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
    homeAria: "Inicio",
    dashboard: "Panel",
    viewProfile: "Ver el perfil",
    editProfile: "Editar el perfil",
    accountSettings: "Ajustes de la cuenta",
    draftNotice:
      "Tienes cambios sin publicar: la vista previa de abajo muestra la versión publicada.",
    editPage: "Editar la página",
    openPage: "Abrir la página",
  },

  profile: {
    menuLabel: "Menú de Caka",
    profileInfoAria: "Información del perfil",
    blocksLabel: "Enlaces y contenido",
    shareImageAlt: (name: string) => `Imagen para compartir del perfil de ${name} en Caka`,
    description: (name: string) => `Los enlaces, los proyectos y el trabajo de ${name}.`,
    edit: "Editar",
    unclaimed: (username: string) => `caka.app/${username} todavía no es de nadie.`,

    availableAddress: "Esta dirección está libre",
    claimThisAddress: "Consigue esta dirección",
    availableCta: "esta dirección está libre, ¡pillala!",
  },

  api: {
    documentOnlyPdf: "De momento solo puedes subir PDF",
    documentTooLarge: `El documento puede pesar como máximo ${DOCUMENT_MAX_BYTES / (1024 * 1024)} MB`,
    documentTypeUnverified: "No se ha podido verificar que el archivo sea un PDF",
    documentSaveFailed: "No se ha podido guardar el documento",
    quota: {
      count: `Puedes subir como máximo ${ASSET_MAX_COUNT} archivos. Para añadir otro, quita primero los que ya no uses.`,
      bytes: `Tu espacio total es de ${Math.round(ASSET_MAX_TOTAL_BYTES / (1024 * 1024))} MB y este archivo no cabe. Para añadir otro, quita primero los que ya no uses.`,
    },

    origin: "Origen de la solicitud no válido",
    layoutReadFailed: "No se han podido leer los datos de la página; actualízala",
    layoutTooManyBlocks: (max: number) => `Tu página puede tener como máximo ${max} bloques`,
    draftInvalid: "Los datos del borrador no son válidos",
    blocksIncomplete: "Algunos bloques están incompletos",

    layoutInvalid: "Los datos de la página no son válidos",
    profileNotFound: "No se ha encontrado el perfil",
    layoutConflict: "La página se ha actualizado en otro sitio",
    layoutTooLarge: "Los datos de la página son demasiado grandes",
    settingsInvalid: "Los datos de los ajustes no son válidos",
    settingsTooLarge: "Los datos de los ajustes son demasiado grandes",
    imageNotOnPage: "La imagen seleccionada no está en tu página",
    requestInvalid: "Los datos de la solicitud no son válidos",
    requestTooLarge: "Los datos de la solicitud son demasiado grandes",
    publishFailed: "No se ha podido publicar la página",

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

    locationQueryTooLong: (max: number) => `La búsqueda puede tener como máximo ${max} caracteres`,
    locationUnavailable: "El servicio de ubicación no respondió. Vuelve a intentarlo en un momento.",
    ayetUnavailable: "La fuente de versículos no ha respondido ahora mismo. Inténtalo en un momento.",
    ayetSurahUnknown: "No existe esa sura. Escribe un número del 1 al 114 o el nombre de una sura.",
    ayetVerseOutOfRange: (surahName: string, count: number) =>
      `La sura ${surahName} tiene ${count} versículos; no hay ninguno con ese número.`,
    ayetQueryTooShort: (min: number) => `Escribe al menos ${min} letras para buscar.`,

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
    illustrationAlt:
      "Un paisaje en miniatura de lana tejida y plastilina: arbustos redondos y un arroyo azul serpenteando entre ellos",
    createPage: "Crea tu propia página",
    backHome: "Volver al inicio",
  },
} satisfies AppContent;
