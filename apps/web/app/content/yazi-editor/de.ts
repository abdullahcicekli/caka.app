import { MAX_POSTS_PER_PROFILE, POST_BODY_MAX_BYTES } from "@caka/shared";

import type { YaziEditorContent } from "./index";

const MAX_KB = POST_BODY_MAX_BYTES / 1024;

export const de = {
  nav: "Beiträge",

  list: {
    title: "Beiträge",
    intro: `Lange Texte, die unter deinem Profil an einer eigenen Adresse erscheinen. Du kannst bis zu ${MAX_POSTS_PER_PROFILE} Beiträge haben; Entwürfe zählen mit.`,
    empty: "Noch keine Beiträge. Starte unten deinen ersten.",
    newPost: "Neuer Beitrag",
    limitReason: `Du hast das Limit von ${MAX_POSTS_PER_PROFILE} Beiträgen erreicht. Lösche zuerst einen Beitrag, bevor du einen neuen beginnst.`,
    statusDraft: "Entwurf",
    statusPublished: "Veröffentlicht",
  },

  editor: {
    metaTitle: "Beitragseditor",
    backToList: "Zurück zu den Beiträgen",
    titlePlaceholder: "Titel",
    bodyPlaceholder: "Fang an zu schreiben…",
    slugLabel: "Adresse",
    slugHint: "Die Adresse lässt sich ändern, bis der Beitrag zum ersten Mal veröffentlicht wird.",
    slugAutoHint: "Die Adresse wird automatisch aus dem Titel erstellt. Du kannst sie bei Bedarf bearbeiten.",
    slugEdit: "Bearbeiten",
    slugDone: "Fertig",
    slugLockedReason:
      "Die Adresse eines veröffentlichten Beitrags kann nicht geändert werden, damit geteilte Links nicht brechen.",
    slugStatus: {
      checking: "Adresse wird geprüft…",
      available: "Diese Adresse ist frei.",
      taken: "Diese Adresse nutzt bereits ein anderer deiner Beiträge.",
      too_short: "Die Adresse muss mindestens 3 Zeichen haben.",
      too_long: "Die Adresse darf höchstens 80 Zeichen haben.",
      invalid_chars: "Die Adresse darf nur Kleinbuchstaben, Ziffern und Bindestriche enthalten.",
      reserved: "Diese Adresse ist reserviert; wähle eine andere.",
    },
    save: {
      pending: "Der Entwurf wird automatisch gespeichert, sobald du einen Titel eingibst.",
      saving: "Wird gespeichert…",
      saved: "Gespeichert",
      error:
        "Speichern fehlgeschlagen — prüfe deine Verbindung. Deine Änderungen bleiben in diesem Tab.",
      conflict:
        "Dieser Beitrag wurde in einem anderen Tab aktualisiert. Deine letzten Änderungen hier wurden nicht gespeichert — kopiere deinen Text, bevor du neu lädst.",
      unauthenticated:
        "Du scheinst abgemeldet zu sein. Melde dich in einem neuen Tab an; deine Änderungen bleiben in diesem Tab.",
      tooLarge: `Der Beitrag überschreitet das Limit von ${MAX_KB} KB und wird nicht gespeichert. Kürze den Inhalt, um zu speichern.`,
    },
    sizeIndicator: (kb: string): string => `${kb} / ${MAX_KB} KB`,
    publish: "Veröffentlichen",
    unpublish: "Auf Entwurf zurücksetzen",
    remove: "Löschen",
    removeConfirm: "Diesen Beitrag dauerhaft löschen?",
    viewPost: "Beitrag öffnen",
    actionFailed: "Die Aktion konnte nicht abgeschlossen werden; versuch es erneut.",
    validationTitle: "Gib vor dem Veröffentlichen einen Titel ein.",
    validationSlug: "Wähle vor dem Veröffentlichen eine gültige, freie Adresse.",
    publishedToast: {
      title: "Dein Beitrag ist online",
      body: "Du kannst eine Karte hinzufügen, die deine Beiträge automatisch auf deiner Seite auflistet.",
      addToPage: "Zu meiner Seite hinzufügen",
      dismiss: "Jetzt nicht",
    },
    toolbar: {
      h2: "Überschrift",
      h3: "Zwischenüberschrift",
      codeBlock: "Codeblock",
      image: "Bild einfügen",
    },
    imageUploadFailed: "Bild-Upload fehlgeschlagen",
  },
} satisfies YaziEditorContent;
