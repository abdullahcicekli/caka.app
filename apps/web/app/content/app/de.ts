import {
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
    image: "Bild",
    status: "Ankündigung",
    gallery: "Fotogalerie",
    youtube: "YouTube",
    spotify: "Spotify",
  } satisfies Record<ProfileBlock["type"], string>,

  blockIssues: {
    profile_name: "Gib deinen Namen ein",
    social_target: "Gib einen Link oder einen Benutzernamen ein",
    link_url: "Gib die Adresse des Links ein",
    link_title: "Gib einen Titel ein",
    text_empty: "Schreib einen Text",
    status_empty: "Schreib die Ankündigung",
    image_missing: "Lade ein Bild hoch",
    gallery_empty: "Füg der Galerie ein Foto hinzu",
    youtube_video_url: "Gib einen YouTube-Videolink ein",
    youtube_channel_url: "Gib einen YouTube-Kanallink ein",
    spotify_url: "Gib einen Spotify-Link ein",
  } satisfies Record<BlockIssueId, string>,

  gridLimit: (blockLabel: string, limits: BlockGridLimits) =>
    `Ein ${blockLabel}-Block kann mindestens ${limits.minW}×${limits.minH} und höchstens ${limits.maxW}×${limits.maxH} groß sein`,

  galleryCountLimit: `Deine Seite kann höchstens ${MAX_GALLERY_BLOCKS} Galerieblöcke haben`,

  editor: {
    layoutUnreadable: "Das Layout der Seite konnte nicht gelesen werden",
    backToDashboard: "Zurück zur Übersicht",
    toolbarLabel: "Editor-Werkzeuge",
    addLink: "Link hinzufügen",
    addImage: "Bild hinzufügen",
    addGallery: "Fotogalerie hinzufügen",
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
    imageReplace: "Bild ersetzen",
    imageDrop: "Ziehen oder auswählen",
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
    signOut: "Abmelden",
    accountMenu: "Kontomenü",
  },

  nav: {
    copied: "Kopiert",
    copyLink: "Link kopieren",
    comingSoon: "Demnächst",
  },

  profile: {
    menuLabel: "Caka-Menü",
    blocksLabel: "Links und Inhalte",
    addImage: "Bild hinzufügen",
    availableAddress: "Diese Adresse ist frei",
    availableCta: "diese Adresse ist frei, schnapp sie dir!",
  },

  api: {
    origin: "Ungültiger Ursprung der Anfrage",
    layoutReadFailed: "Die Seitendaten konnten nicht gelesen werden; lade die Seite neu",
    layoutTooManyBlocks: (max: number) => `Deine Seite kann höchstens ${max} Blöcke haben`,
    draftInvalid: "Die Entwurfsdaten sind ungültig",
    blocksIncomplete: "Einige Blöcke sind unvollständig",

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
    backHome: "Zur Startseite",
  },
} satisfies AppContent;
