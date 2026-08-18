import { USERNAME_MAX, USERNAME_MIN } from "@caka/shared";

export const tr = {
  saveState: {
    saving: "Kaydediliyor…",
    saved: "Kaydedildi",
    error: "Kaydedilemedi — tekrar dene",
  },
  /** `validateUsername`'in döndürdüğü hata kimliklerinin karşılığı. */
  usernameErrors: {
    too_short: `En az ${USERNAME_MIN} karakter olmalı`,
    too_long: `En fazla ${USERNAME_MAX} karakter olabilir`,
    invalid_chars: "Yalnızca küçük harf, rakam ve tire; başta/sonda tire olamaz",
    reserved: "Bu adres kullanılamaz",
  },
};
