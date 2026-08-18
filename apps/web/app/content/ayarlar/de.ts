import {
  USERNAME_CHANGE_COOLDOWN_DAYS,
  USERNAME_MAX,
  USERNAME_MIN,
  USERNAME_REDIRECT_DAYS,
  formatDate,
} from "@caka/shared";

import type { AyarlarContent } from "./index";

export const de = {
  title: "Einstellungen",
  sectionNavLabel: "Bereiche der Einstellungen",
  sectionLabels: {
    adres: "Adresse",
    dil: "Sprache",
    "paylasim-gorseli": "Teilen-Bild",
    hesap: "Konto",
  },

  address: {
    title: "Adresse",
    hint: "Die Adresse, unter der deine Seite online ist. Wenn du sie änderst, funktioniert deine alte Adresse noch eine Weile und hört dann auf.",
    currentLabel: "Deine aktuelle Adresse",
    fieldLabel: "Neue Adresse",
    domain: "caka.app/",
    placeholder: "deinneuername",
    hintFormat: `${USERNAME_MIN}–${USERNAME_MAX} Zeichen; Kleinbuchstaben, Ziffern und Bindestriche.`,
    consequencesTitle: "Das solltest du vor der Änderung wissen",
    consequences: [
      `Deine alte Adresse leitet ${USERNAME_REDIRECT_DAYS} Tage lang vorübergehend auf die neue weiter. Danach endet die Weiterleitung und die alte Adresse funktioniert nicht mehr.`,
      `Dieselben ${USERNAME_REDIRECT_DAYS} Tage bleibt deine alte Adresse gesperrt; in dieser Zeit kann sie niemand anders nehmen.`,
      "Gedruckte QR-Codes, deine Visitenkarten und alte Links, die du anderswo hinterlassen hast, funktionieren nach Ablauf der Frist nicht mehr — du musst sie aktualisieren.",
      `Nach einer Änderung kannst du deine Adresse ${USERNAME_CHANGE_COOLDOWN_DAYS} Tage lang nicht erneut ändern.`,
    ],
    confirmLabel: "Ich habe das oben Stehende gelesen und möchte meine Adresse ändern.",
    submit: "Adresse ändern",
    submitting: "Wird geändert…",
    checking: "wird geprüft…",
    available: "diese Adresse ist frei",
    unavailable: "Diese Adresse ist vergeben",
    activeRedirectsTitle: "Deine alten Adressen, die noch weiterleiten",
  },

  language: {
    title: "Sprache",
    hint: "Die Sprache, in der du Caka siehst. Deine Wahl wird in diesem Browser gemerkt.",
    fieldLabel: "Sprache der Oberfläche",
    note: "Die Inhalte deiner eigenen Seite werden nicht übersetzt; es ändert sich nur die Oberfläche von Caka.",
  },

  share: {
    title: "Teilen-Bild",
    hint: "Dieses Bild erscheint, wenn der Link zu deiner Seite auf WhatsApp, X, LinkedIn und anderswo geteilt wird.",
    templateTitle: "Vorlage",
    templateGroupLabel: "Auswahl der Vorlage",
    previewAlt: (label: string) => `Vorschau des gewählten Teilen-Bilds — ${label}`,
    photoTitle: "Bildquelle",
    photoGroupLabel: "Auswahl der Bildquelle",
    photoHint: "Das Foto für die Vorlagen Porträt und Randabfallend.",
    photoEmptyHint:
      "Die Vorlagen Porträt und Randabfallend nutzen dein Profilbild. Wenn du einen Bildblock auf deiner Seite hinzufügst und veröffentlichst, kannst du ihn hier ebenfalls auswählen.",
    photoDefaultLabel: "Mein Profilbild",
    photoFallbackLabel: (index: number) => `Bild ${index + 1}`,
  },

  account: {
    title: "Konto",
    hint: "Diese Angaben stammen aus dem Konto, mit dem du dich angemeldet hast; sie werden hier nicht geändert.",
    providerLabel: "Anmeldemethode",
    providerUnknown: "Unbekannt",
    emailLabel: "E-Mail",
    emailVerified: "bestätigt",
    dataTitle: "Deine Daten und Kontolöschung",
    dataBody:
      "Dein Konto zu löschen oder eine Kopie deiner Daten anzufordern, geht im Dashboard noch nicht selbstständig. Schreib an hello@caka.app, dann wird dein Anliegen nach Artikel 11 des türkischen Datenschutzgesetzes (KVKK) bearbeitet.",
    dataMailLabel: "hello@caka.app",
    dataMailHref: "mailto:hello@caka.app",
    privacyLinkLabel: "Datenschutzerklärung",
    privacyLinkHref: "/gizlilik",
    privacyLinkPrefix: "Details:",
  },

  addressErrors: {
    same: "Das ist bereits deine Adresse",
    cooldown: `Du hast deine Adresse in den letzten ${USERNAME_CHANGE_COOLDOWN_DAYS} Tagen geändert; du kannst sie vorerst nicht erneut ändern`,
    taken: "Diese Adresse ist vergeben, versuch eine andere",
    locked: "Diese Adresse ist die alte Adresse einer anderen Person und derzeit gesperrt",
    no_profile: "Dein Profil wurde nicht gefunden",
    conflict: "Deine Adresse wurde an anderer Stelle geändert; lade die Seite neu",
    origin: "Ungültiger Ursprung der Anfrage",
    unknown: "Etwas ist schiefgelaufen, bitte versuch es noch mal",
  },

  notices: {
    cooldown: (availableOn: string, remainingDays: number) =>
      `Du hast deine Adresse vor Kurzem geändert. Ab dem ${formatDate(availableOn, "de")} (etwa ${remainingDays} Tage) kannst du sie erneut ändern.`,
    redirect: (oldUsername: string, expiresOn: string) =>
      `caka.app/${oldUsername} — leitet hierher weiter und ist bis zum ${formatDate(expiresOn, "de")} gesperrt.`,
    success: (previousUsername: string, username: string, expiresOn: string) =>
      `Deine Adresse ist jetzt caka.app/${username}. caka.app/${previousUsername} leitet bis zum ${formatDate(expiresOn, "de")} hierher weiter.`,
  },
} satisfies AyarlarContent;
