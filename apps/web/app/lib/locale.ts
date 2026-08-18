// Bileşenlerin dile ve dile bağlı içeriğe eriştiği tek yol.
//
// Dil kök loader'da bir kez çözülür (`root.tsx`); buradaki hooklar onu okur.
// Prop drilling yoktur: `profile-block` gibi derindeki bileşenler de kataloğu
// doğrudan seçebilir.

import { useLocation, useRouteLoaderData } from "react-router";

import {
  DEFAULT_LOCALE,
  type Locale,
  localeFromPathname,
  localizeHref,
  localizePath,
  pathFor,
  type RouteKey,
} from "@caka/shared";

import type { loader as rootLoader } from "~/root";

/**
 * İsteğin dili.
 *
 * Normalde kök loader'dan gelir. Hata sınırı çalıştığında loader verisi
 * olmayabilir (404'te hiçbir route eşleşmez); o hâlde dil ADRESİN ÖNEKİNDEN
 * okunur — `/en/olmayan-sayfa` hatası İngilizce yazılmalı, Türkçe değil.
 * Önek de yoksa Türkçeye düşülür, çünkü Türkçe öneksiz olandır.
 */
export function useLocale(): Locale {
  const fromLoader = useRouteLoaderData<typeof rootLoader>("root")?.locale;
  const { pathname } = useLocation();
  return fromLoader ?? localeFromPathname(pathname) ?? DEFAULT_LOCALE;
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

/**
 * Katalogdaki bir bağlantıyı aktif dile çevirir.
 *
 * Kataloglar adresleri Türkçe hâliyle tutar; her bağlantı render'da buradan
 * geçer. Dış bağlantılara ve salt çapaya dokunulmaz.
 */
export function useHref(): (href: string) => string {
  const locale = useLocale();
  return (href) => localizeHref(href, locale);
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
