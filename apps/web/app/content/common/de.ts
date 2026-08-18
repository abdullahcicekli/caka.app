import { USERNAME_MAX, USERNAME_MIN } from "@caka/shared";

import type { CommonContent } from "./index";

export const de = {
  saveState: {
    saving: "Wird gespeichert…",
    saved: "Gespeichert",
    error: "Konnte nicht gespeichert werden — versuch es noch mal",
  },
  usernameErrors: {
    too_short: `Muss mindestens ${USERNAME_MIN} Zeichen haben`,
    too_long: `Darf höchstens ${USERNAME_MAX} Zeichen haben`,
    invalid_chars: "Nur Kleinbuchstaben, Ziffern und Bindestriche; kein Bindestrich am Anfang oder Ende",
    reserved: "Diese Adresse ist nicht verfügbar",
  },
} satisfies CommonContent;
