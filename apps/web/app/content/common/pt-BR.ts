import { USERNAME_MAX, USERNAME_MIN } from "@caka/shared";

import type { CommonContent } from "./index";

export const ptBR = {
  saveState: {
    saving: "Salvando…",
    saved: "Salvo",
    error: "Não foi possível salvar — tente de novo",
  },
  usernameErrors: {
    too_short: `Precisa ter no mínimo ${USERNAME_MIN} caracteres`,
    too_long: `Pode ter no máximo ${USERNAME_MAX} caracteres`,
    invalid_chars: "Apenas letras minúsculas, números e hífens; sem hífen no início ou no fim",
    reserved: "Este endereço não está disponível",
  },
} satisfies CommonContent;
