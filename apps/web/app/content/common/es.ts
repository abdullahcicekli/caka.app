import { USERNAME_MAX, USERNAME_MIN } from "@caka/shared";

import type { CommonContent } from "./index";

export const es = {
  saveState: {
    saving: "Guardando…",
    saved: "Guardado",
    error: "No se pudo guardar: inténtalo de nuevo",
  },
  usernameErrors: {
    too_short: `Debe tener al menos ${USERNAME_MIN} caracteres`,
    too_long: `Puede tener como máximo ${USERNAME_MAX} caracteres`,
    invalid_chars: "Solo minúsculas, números y guiones; sin guion al principio ni al final",
    reserved: "Esta dirección no está disponible",
  },
} satisfies CommonContent;
