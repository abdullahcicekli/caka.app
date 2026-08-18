// Uygulama içi yüzeylerin metinleri: editör, kurulum, giriş, panel gezinmesi,
// public profil çerçevesi ve hata sayfaları.
//
// Bu modül Değişmez #5'in kalan borcunu kapatır: bu metinler daha önce
// `routes/edit.tsx` ve `routes/onboarding.kurulum.tsx` içine gömülüydü ve o
// yüzden çevrilemiyordu.

import type { Locale } from "@caka/shared";

import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { ptBR } from "./pt-BR";
import { tr } from "./tr";

export type AppContent = typeof tr;

export const appCatalog: Record<Locale, AppContent> = {
  tr,
  en,
  es,
  "pt-BR": ptBR,
  de,
};
