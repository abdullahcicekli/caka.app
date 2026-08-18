// Bileşenlerin dile ve dile bağlı içeriğe eriştiği tek yol.
//
// Dil kök loader'da bir kez çözülür (`root.tsx`); buradaki hooklar onu okur.
// Prop drilling yoktur: `profile-block` gibi derindeki bileşenler de kataloğu
// doğrudan seçebilir.

import { useRouteLoaderData } from "react-router";

import { DEFAULT_LOCALE, type Locale, localizePath, pathFor, type RouteKey } from "@caka/shared";

import type { loader as rootLoader } from "~/root";

/**
 * İsteğin dili. Kök loader verisi yoksa (hata sınırı) Türkçeye düşer — dilin
 * çözülememesi sayfanın çökmesine yol açmaz.
 */
export function useLocale(): Locale {
  return useRouteLoaderData<typeof rootLoader>("root")?.locale ?? DEFAULT_LOCALE;
}

/**
 * Bir katalogdan aktif dilin metinlerini seçer.
 *
 * Kataloglar beş dili birden taşır ve istemciye birlikte iner (LKD5): arayüz
 * metni küçüktür ve Vite zaten route başına böler. Bir katalog büyürse hukuki
 * belgelerin desenine geçirilir — sunucuda kalıp `loaderData` ile taşınır.
 */
export function useCatalog<T>(catalog: Record<Locale, T>): T {
  return catalog[useLocale()];
}

/** Bir route'un aktif dildeki yolu — `<Link to={...}>` için. */
export function useLocalizedPath(): (key: RouteKey, params?: Record<string, string>) => string {
  const locale = useLocale();
  return (key, params) => pathFor(key, locale, params);
}

/** Bulunulan sayfanın hedef dildeki adresi — dil değiştirici için. */
export function switchLocalePath(pathname: string, target: Locale): string {
  return localizePath(pathname, target);
}
