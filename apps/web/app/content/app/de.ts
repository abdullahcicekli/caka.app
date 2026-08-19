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

export const de = {
  titles: {
    editor: "Editor — Caka",
    dashboard: "Übersicht — Caka",
    settings: "Einstellungen — Caka",
    login: "Anmelden — Caka",
    setup: "Seite einrichten — Caka",
    onboardingFinish: "Dein Konto wird vorbereitet — Caka",
    onboardingReady: "Deine Seite ist fertig — Caka",
    notFound: "Seite nicht gefunden — Caka",
  },

  blockTypes: {
    profile: "Profil",
    social: "Soziale Medien",
    link: "Link",
    text: "Text",
    status: "Ankündigung",
    gallery: "Foto",
    youtube: "YouTube",
    spotify: "Spotify",
    document: "Dokument",
    location: "Standort",
    ayet: "Koranvers",
  } satisfies Record<ProfileBlock["type"], string>,

  blockIssues: {
    profile_name: "Gib deinen Namen ein",
    social_target: "Gib einen Link oder einen Benutzernamen ein",
    link_url: "Gib die Adresse des Links ein",
    link_title: "Gib einen Titel ein",
    text_empty: "Schreib einen Text",
    status_empty: "Schreib die Ankündigung",
    gallery_empty: "Füg ein Foto hinzu",
    youtube_video_url: "Gib einen YouTube-Videolink ein",
    youtube_channel_url: "Gib einen YouTube-Kanallink ein",
    spotify_url: "Gib einen Spotify-Link ein",
    document_missing: "Lade ein Dokument hoch",
    location_missing: "Suche deinen Ort und wähle ihn aus",
    ayet_verse: "Wähle einen Vers",
  } satisfies Record<BlockIssueId, string>,

  gridLimit: (blockLabel: string, limits: BlockGridLimits) =>
    `Ein ${blockLabel}-Block kann mindestens ${limits.minW}×${limits.minH} und höchstens ${limits.maxW}×${limits.maxH} groß sein`,

  galleryCountLimit: `Deine Seite kann höchstens ${MAX_GALLERY_BLOCKS} Blöcke mit mehreren Fotos haben`,

  editor: {
    documentField: "Dokument (PDF)",
    documentDrop: "PDF ziehen oder auswählen",
    documentReplace: "Dokument ersetzen",
    documentUploading: "Wird hochgeladen…",
    documentUploadFailed: "Das Dokument konnte nicht hochgeladen werden",
    documentHint: (maxMb: number) =>
      `Vorerst nur PDF, höchstens ${maxMb} MB. Dateiname, Größe und Datum schreibt die Karte selbst.`,
    documentTitlePlaceholder: "Leer lassen: dann zeigt die Karte den Dateinamen",
    documentServeHint:
      "Das Dokument wird über caka.app ausgeliefert und beim Klick heruntergeladen; „Vorschau“ öffnet es in einem neuen Tab.",

    layoutUnreadable: "Das Layout der Seite konnte nicht gelesen werden",
    backToDashboard: "Zurück zur Übersicht",
    toolbarLabel: "Editor-Werkzeuge",
    addLink: "Link hinzufügen",
    addPhoto: "Foto hinzufügen",
    mobilePreview: "Mobile Vorschau",
    desktopPreview: "Desktop-Ansicht",
    pickTheme: "Theme wählen",
    editProfileInfo: "Allgemeine Profilangaben bearbeiten",
    saveFailed: "Konnte nicht gespeichert werden — prüf deine Verbindung.",

    draftTitle: "Du hast unveröffentlichte Änderungen",
    liveTitle: "Deine veröffentlichte Seite",
    draftShort: "Entwurf",
    liveShort: "Online",
    addressLabel: (username: string, hasDraft: boolean) =>
      `caka.app/${username} — ${hasDraft ? "hat einen Entwurf" : "online"}`,
    publishing: "Wird veröffentlicht",
    publishingProgress: "Wird veröffentlicht…",
    publishFinish: "Fertigstellen und veröffentlichen",
    publishShort: "Veröffentlichen",
    blockedTitle:
      "Deine Seite kann erst veröffentlicht werden, wenn diese Blöcke fertig sind. Füll sie aus oder entferne sie:",

    fieldDescription: "Beschreibung",
    fieldTitle: "Titel",
    fieldLink: "Link",

    imageUploading: "Wird hochgeladen…",
    imageUploadFailed: "Das Bild konnte nicht hochgeladen werden",

    galleryEmpty: "Noch keine Fotos.",
    galleryAltPlaceholder: "Alternativtext (optional)",
    galleryAdd: "Fotos hinzufügen (JPEG oder PNG)",
    galleryMultiHint: "Du kannst mehrere Fotos auswählen",

    resolving: "Wird aufgelöst…",
    youtubeFailed: "Der YouTube-Link konnte nicht aufgelöst werden.",
    youtubeFailedHint: "Der YouTube-Link konnte nicht aufgelöst werden — prüf deinen Link.",
    youtubeTitlePlaceholder: "Lässt du es leer, zeigt die Karte nur das Video",
    spotifyFailed: "Der Spotify-Link konnte nicht aufgelöst werden.",
    spotifyFailedHint: "Der Spotify-Link konnte nicht aufgelöst werden — prüf deinen Link.",
    spotifyAdded: (kindLabel: string) => `Als ${kindLabel} hinzugefügt`,

    dragHint: "gedrückt halten → ziehen",
    closePanel: "Panel schließen",
    deleteBlock: "Block löschen",

    fieldName: "Name",
    fieldPlatform: "Plattform",
    fieldSocialTarget: "Link oder Benutzername",
    socialHint:
      "Du kannst den Profillink einfügen oder nur den Benutzernamen schreiben — wir verstehen beides.",
    fieldAnnouncement: "Ankündigung",
    galleryTitleHint:
      "Der Titel erscheint nur auf Karten, die höher als zwei Zeilen sind. Auf kurzen Karten dient er Screenreadern.",
    photosLegend: (count: number, max: number) => `Fotos (${count}/${max})`,
    galleryMaxPhotos: (max: number, room: number) =>
      `Ein Block kann höchstens ${max} Fotos enthalten; die ersten ${room} deiner Auswahl wurden hinzugefügt.`,
    photoAltAria: (index: number) => `Alternativtext für Foto ${index}`,
    photoUpAria: (index: number) => `Foto ${index} nach oben schieben`,
    photoDownAria: (index: number) => `Foto ${index} nach unten schieben`,
    photoRemoveAria: (index: number) => `Foto ${index} entfernen`,

    uploadPercent: (percent: number) => `Wird hochgeladen… ${percent} %`,
    uploadProgress: (done: number, total: number, percent: number) =>
      `Wird hochgeladen… ${done}/${total} · ${percent} %`,

    photoLayoutLegend: "Layout",
    photoLayoutGrid: "Raster",
    photoLayoutSlider: "Slider",
    photoLayoutHint:
      "Im Raster sind alle Fotos gleichzeitig zu sehen; im Slider wechseln sie alle 4 Sekunden.",
    photoLinkHint:
      "Der Link wirkt nur bei einem Block mit einem einzigen Foto; bei mehreren Fotos vergrößert ein Klick das Foto.",
    photoLimitHint: (max: number) =>
      `Deine Seite kann höchstens ${max} Blöcke mit mehreren Fotos haben. Entferne zuerst ein Foto aus einer anderen Galerie.`,

    pickerSocial: "Soziale Medien",
    pickerContent: "Inhalt",
    pickerNoResults: (query: string) => `Keine Treffer für „${query}“.`,

    galleryFullHint: (max: number) =>
      `Ein Block kann höchstens ${max} Fotos enthalten. Entferne eines, bevor du ein neues hinzufügst.`,
    galleryBlockLimit: (max: number) =>
      `Deine Seite kann höchstens ${max} Fotoblöcke haben. Entferne einen, bevor du einen neuen hinzufügst.`,
    youtubeLinkLabel: "YouTube-Link",
    youtubeHint:
      "Wir unterscheiden Video- und Kanaladressen — wir fügen das ein, was du einfügst.",
    linkTitlePlaceholder: "z. B. Portfolio",
    optionalTitle: "Titel (optional)",
    spotifyLinkLabel: "Spotify-Link",
    spotifyHint:
      "Titel, Alben, Playlists, Künstler, Podcasts und Folgen lassen sich hinzufügen — wir fügen das ein, was du einfügst.",
    locationSearchLabel: "Wo du bist",
    locationSearchPlaceholder: "Stadt oder Bezirk suchen…",
    locationSearching: "Wird gesucht…",
    locationNoResults: (query: string) => `Kein Ort für „${query}“ gefunden.`,
    locationSelected: (label: string) => `${label} ausgewählt`,
    locationClear: "Standort entfernen",
    locationPrivacyHint:
      "Die Suche bleibt auf Stadt-/Bezirksebene, und die Koordinate wird vor dem Speichern auf etwa 1 km gerundet. Auf deiner Seite erscheinen Ortsname, Land, eine ungefähre Position und die dortige Ortszeit — nicht deine genaue Adresse.",
    locationTimeZone: (zone: string) => `Zeitzone: ${zone}`,
    locationNoTimeZone: "Für diesen Ort wurde keine Zeitzone gefunden; die Karte zeigt keine Uhr.",
    ayetVariantLegend: "Kartenvariante",
    ayetVariantArabic: "Nur Arabisch",
    ayetVariantMeal: "Nur Übersetzung",
    ayetVariantBoth: "Beides zusammen",
    ayetVariantHint:
      "Die Variante bestimmt Typografie und Mindestgröße der Karte: arabische Schrift braucht mehr Platz, beides zusammen am meisten.",
    ayetSearchLabel: "Verse suchen",
    ayetSearchPlaceholder: "Bakara 255 oder ein Stichwort",
    ayetSearchHint:
      "Gib Surenname und Versnummer ein („Bakara 255“, „2:255“) oder suche nach einem Wort in der türkischen Übersetzung.",
    ayetSearching: "Verse werden gesucht…",
    ayetSuggestionsLabel: "Versvorschläge",
    ayetResultCount: (count: number) =>
      `${count === 1 ? "1 Vers" : `${count} Verse`} aufgelistet. Mit den Pfeiltasten navigieren, mit der Eingabetaste auswählen.`,
    ayetNoResults: (query: string) => `Kein Vers für „${query}“ gefunden.`,
    ayetFailed: "Die Versquelle war nicht erreichbar — prüf deine Verbindung.",
    ayetPickedLegend: "Ausgewählter Vers",
    ayetSearchOpen: "Anderen Vers wählen",
    ayetSearchClose: "Suche schließen",
    ayetClear: "Vers entfernen",
    ayetSelected: (surahName: string, verse: number) => `${surahName} ${verse} ausgewählt`,
    ayetSourceNote: (translator: string) =>
      `Der arabische Text steht in Uthmani-Schrift (Hafs); die türkische Übersetzung stammt von ${translator} und wird unten auf der Karte genannt.`,
    fixIssue: "Beheben",
    removeBlock: "Entfernen",
    editedElsewhere: "Die Seite wurde an anderer Stelle bearbeitet.",

    blockPickerAria: "Blockgalerie",
    searchPlaceholder: "Suchen…",
    categoriesAria: "Kategorien",
    clearFilterAria: "Filter zurücksetzen",
    doneAria: "Fertig",
    deleteAction: "Löschen",
    applyAction: "Übernehmen",
    actionRequired: "Aktion erforderlich",
    refresh: "Neu laden",
    generalInfo: "Allgemeine Angaben",
    addBlock: "Block hinzufügen",
    themeAria: "Theme",
    addText: "Text hinzufügen",
    addStatus: "Ankündigung hinzufügen",
    addYoutube: "YouTube hinzufügen",
    youtubePlaceholder: "youtube.com/watch?v=… oder youtube.com/@kanal",
    spotifyPlaceholder: "open.spotify.com/track/… oder spotify:album:…",

    richText: {
      placeholder: "Schreib etwas…",
      linkUrl: "Adresse des Links",
      bold: "Fett",
      italic: "Kursiv",
      orderedList: "Nummerierte Liste",
      quote: "Zitat",
      link: "Link",
      toolbarLabel: "Textformatierung",
    },
  },

  setup: {
    stepsLabel: "Schritte der Einrichtung",
    nameRequired: "Du musst deinen Namen eingeben",
    photoInvalid: "Das Foto konnte nicht geprüft werden",
    linkInvalid: "Einer der Links ist ungültig",
    photoUploadFailed: "Das Foto konnte nicht hochgeladen werden",
    photoUploading: "Wird hochgeladen…",
    photoReplace: "Foto ersetzen",
    nameLabel: "Dein Name",
    bioLabel: "Kurzbeschreibung",
    bioPlaceholder: "Erzähl in ein paar Worten von dir.",

    platformsTitle: "Auf welchen Plattformen bist du?",
    platformsBody:
      "Jede Plattform, die du auswählst, erscheint als Block auf deiner Seite. Die Benutzernamen kannst du später eintragen.",
    purposeTitle: "Wofür wirst du Caka nutzen?",
    purposeBody: "Wähl aus, was zu dir passt. Wir richten deine Seite danach ein, ohne dass du dich mit Einstellungen herumschlägst.",
    discoveryKicker: "Eine letzte Frage vor deiner Seite",
    discoveryTitle: "Woher kennst du Caka?",
    templateTitle: "Wähl eine Vorlage",
    templateBody: "Wähl den Stil, der zu dir passt, und füg deine Inhalte später hinzu.",
    templatePreviewRole: "Design · Istanbul",
    templateUse: "Mit dieser Vorlage starten",
    linksTitle: "Füg deine Links hinzu",
    linksBody: "Gib die Benutzernamen der Plattformen ein, die du ausgewählt hast.",
    linksChosen: "Deine Auswahl",
    usernameLabel: "Benutzername",
    extraLinks: "Weitere Links",

    buildingContent: "Deine Inhalte werden gesucht…",
    buildingLinks: "Deine Links werden auf der Seite platziert",
    readyKicker: "Sieht gut aus",
    readyBody:
      "Deine Seite hat einen guten Start hingelegt. Wenn du weiter daran arbeitest, wird sie noch besser.",
    readyTitle: "Deine neue Seite ist online",
    readyCta: "Meine Seite weiter bearbeiten",

    bioTooLong: (max: number) => `Die Kurzbeschreibung darf höchstens ${max} Zeichen haben`,
    bioOverBy: (over: number) =>
      `Die Kurzbeschreibung ist ${over} Zeichen zu lang. Kürze sie, um weiterzumachen.`,
    stepAria: (current: number, total: number) => `Schritt ${current} von ${total}`,
    skipStep: "Diesen Schritt überspringen",
    takenFromAccount: (username: string) => `aus deinem Konto ${username} übernommen`,
    haveAccountSignIn: "Schon ein Konto? Meld dich an",
    claimingAddress: (username: string) => `Du sicherst dir caka.app/${username}.`,
    termsNotice:
      "Mit der Registrierung akzeptierst du die Nutzungsbedingungen und die Datenschutzerklärung.",
    gridSoon: "Der Grid-Editor kommt sehr bald — deine Seite ist schon online.",

    goToPage: "Zu deiner Seite",
    back: "Zurück",
    addressPlaceholder: "adresse",
    handlePlaceholder: "du",
    continueAria: "Weiter",
    checking: "wird geprüft…",
    claimCta: "Adresse sichern",
    signUpGoogle: "Mit Google registrieren",
    signUpApple: "Mit Apple registrieren",
    almostDone: "Fast fertig",
    claimTitle: "Willkommen",
    claimBody: "Unter welcher Adresse soll deine Seite online gehen?",
    claimAvailable: "✓ diese Adresse ist frei",
    claimTaken: "Diese Adresse wurde gerade vergeben, versuch eine andere",
    claimUnknownError: "Etwas ist schiefgelaufen, bitte versuch es noch mal",
  },

  auth: {
    loginTitle: "Willkommen zurück",
    loginBody: "Mach da weiter, wo du aufgehört hast.",
    loginCta: "anmelden",
    signInGoogle: "Mit Google anmelden",
    signInApple: "Mit Apple anmelden",
    noAccount: "Noch kein Konto?",
    claimAddress: "Sichere dir deine Adresse",
    homeAria: "Caka Startseite",
    demoRole: "Keramikwerkstatt · İzmir",
    demoLinkCalendar: "Werkstattkalender",
    demoLinkContact: "Kontakt",

    signOut: "Abmelden",
    accountMenu: "Kontomenü",
  },

  nav: {
    copied: "Kopiert",
    copyLink: "Link kopieren",
    pages: "Seiten",
    analytics: "Analytics",
    settings: "Einstellungen",
    homeAria: "Startseite",
    dashboard: "Übersicht",
    viewProfile: "Profil ansehen",
    editProfile: "Profil bearbeiten",
    accountSettings: "Kontoeinstellungen",
    draftNotice:
      "Du hast unveröffentlichte Änderungen — die Vorschau unten zeigt die veröffentlichte Fassung.",
    editPage: "Seite bearbeiten",
    openPage: "Seite öffnen",
  },

  profile: {
    menuLabel: "Caka-Menü",
    profileInfoAria: "Profilangaben",
    blocksLabel: "Links und Inhalte",
    shareImageAlt: (name: string) => `Teilen-Bild des Caka-Profils von ${name}`,
    description: (name: string) => `Die Links, Projekte und Arbeiten von ${name}.`,
    edit: "Bearbeiten",
    unclaimed: (username: string) => `caka.app/${username} gehört noch niemandem.`,

    availableAddress: "Diese Adresse ist frei",
    claimThisAddress: "Sichere dir diese Adresse",
    availableCta: "diese Adresse ist frei, schnapp sie dir!",
  },

  api: {
    documentOnlyPdf: "Du kannst vorerst nur PDF hochladen",
    documentTooLarge: `Das Dokument darf höchstens ${DOCUMENT_MAX_BYTES / (1024 * 1024)} MB groß sein`,
    documentTypeUnverified: "Die Datei konnte nicht als PDF geprüft werden",
    documentSaveFailed: "Das Dokument konnte nicht gespeichert werden",
    quota: {
      count: `Du kannst höchstens ${ASSET_MAX_COUNT} Dateien hochladen. Entferne zuerst die Dateien, die du nicht mehr brauchst.`,
      bytes: `Dein gesamter Speicher beträgt ${Math.round(ASSET_MAX_TOTAL_BYTES / (1024 * 1024))} MB und diese Datei passt nicht. Entferne zuerst die Dateien, die du nicht mehr brauchst.`,
    },

    origin: "Ungültiger Ursprung der Anfrage",
    layoutReadFailed: "Die Seitendaten konnten nicht gelesen werden; lade die Seite neu",
    layoutTooManyBlocks: (max: number) => `Deine Seite kann höchstens ${max} Blöcke haben`,
    draftInvalid: "Die Entwurfsdaten sind ungültig",
    blocksIncomplete: "Einige Blöcke sind unvollständig",

    layoutInvalid: "Die Seitendaten sind ungültig",
    profileNotFound: "Profil nicht gefunden",
    layoutConflict: "Die Seite wurde an anderer Stelle aktualisiert",
    layoutTooLarge: "Die Seitendaten sind zu groß",
    settingsInvalid: "Die Einstellungsdaten sind ungültig",
    settingsTooLarge: "Die Einstellungsdaten sind zu groß",
    imageNotOnPage: "Das gewählte Bild ist nicht auf deiner Seite",
    requestInvalid: "Die Anfragedaten sind ungültig",
    requestTooLarge: "Die Anfragedaten sind zu groß",
    publishFailed: "Die Seite konnte nicht veröffentlicht werden",

    spotifyInvalid:
      "Das sieht nicht nach einem Link aus. Füg die Adresse ein, die du bei Spotify über „Teilen → Link kopieren“ bekommst.",
    spotifyNotSpotify:
      "Diese Adresse gehört nicht zu Spotify. Füg eine open.spotify.com-Adresse oder einen Link im Format spotify:track:… ein.",
    spotifyUnsupported:
      "Diese Spotify-Adresse ist kein Inhalt, den man hinzufügen kann. Titel, Alben, Playlists, Künstler, Podcasts und Folgen gehen; Nutzerprofile, Suchen und Bibliotheksseiten nicht.",
    spotifyNotFound: (kind: string) =>
      `Dieser Inhalt (${kind}) wurde bei Spotify nicht gefunden. Er wurde vielleicht entfernt, oder der Link wurde unvollständig kopiert.`,
    spotifyUnavailable: "Spotify hat gerade nicht geantwortet. Versuch es gleich noch mal.",

    youtubeInvalid: "Das sieht nicht nach einem Link aus. Füg die Adresse eines Videos oder Kanals ein.",
    youtubeNotYoutube: "Diese Adresse gehört nicht zu YouTube. Füg eine youtube.com- oder youtu.be-Adresse ein.",
    youtubeUnsupported:
      "Diese YouTube-Adresse ist weder ein Video noch ein Kanal. Playlists, Suchen und Feed-Seiten lassen sich nicht hinzufügen.",
    youtubeChannelNotFound:
      "Dieser Kanal wurde nicht gefunden. Prüf die Adresse oder versuch die /channel/UC…-Adresse des Kanals.",
    youtubeVideoNotFound:
      "Das Video wurde nicht gefunden. Es wurde vielleicht gelöscht oder ist privat, oder der Link wurde unvollständig kopiert.",

    locationQueryTooLong: (max: number) => `Die Suche darf höchstens ${max} Zeichen lang sein`,
    locationUnavailable: "Der Standortdienst hat nicht geantwortet. Bitte versuche es gleich noch einmal.",
    ayetUnavailable: "Die Versquelle hat gerade nicht geantwortet. Versuch es gleich noch mal.",
    ayetSurahUnknown: "Diese Sure gibt es nicht. Gib eine Zahl zwischen 1 und 114 oder einen Surennamen ein.",
    ayetVerseOutOfRange: (surahName: string, count: number) =>
      `Die Sure ${surahName} hat ${count} Verse; einen Vers mit dieser Nummer gibt es nicht.`,
    ayetQueryTooShort: (min: number) => `Gib mindestens ${min} Buchstaben ein, um zu suchen.`,

    uploadOnlyJpegPng: "Du kannst nur JPEG oder PNG hochladen",
    uploadTooLarge: "Das Foto darf höchstens 5 MB groß sein",
    uploadTypeUnverified: "Der Typ des Fotos konnte nicht geprüft werden",
    uploadSaveFailed: "Das Foto konnte nicht gespeichert werden",
  },

  errors: {
    genericTitle: "Etwas ist schiefgelaufen",
    genericBody: "Es ist ein unerwarteter Fehler aufgetreten. Bitte versuch es noch mal.",
    notFoundTitle: "Seite nicht gefunden",
    notFoundBody: "Die Seite, die du suchst, gibt es nicht oder sie wurde verschoben.",
    profileErrorTitle: "Diese Seite kann nicht angezeigt werden",
    profileErrorBody: "Etwas ist schiefgelaufen; versuch es später noch mal.",
    illustrationAlt:
      "Eine Miniaturlandschaft aus gestrickter Wolle und Knete: runde Büsche und ein blauer Bach, der sich dazwischen schlängelt",
    createPage: "Erstell deine eigene Seite",
    backHome: "Zur Startseite",
  },
} satisfies AppContent;
