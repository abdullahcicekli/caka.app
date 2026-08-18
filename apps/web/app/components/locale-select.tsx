// L17/L18 — dil değiştirici. Ayarlar sayfasında ve footer'da aynı bileşen
// kullanılır; ikisi de aynı iki işi yapar:
//
//  1. `caka_dil` çerezini yazar (seçim bu tarayıcıda hatırlanır),
//  2. bulunulan sayfanın hedef dildeki adresine gider.
//
// İkinci adım önemli: yalnız çerez yazılsa kullanıcı Türkçe adreste kalır ve
// hiçbir şey değişmemiş görünürdü. Uygulama route'u olmayan sayfalarda
// (profil — L9) adres değişmez, yalnız çerez yazılır.

import { useLocation, useNavigate } from "react-router";

import {
  LOCALE_LABELS,
  type Locale,
  SUPPORTED_LOCALES,
  localeCookieString,
  localizePath,
} from "@caka/shared";

import { useLocale } from "~/lib/locale";

export function LocaleSelect({
  id,
  label,
  className,
}: {
  id?: string;
  /** Görünür etiketi olmayan yerlerde (footer) erişilebilir ad. */
  label: string;
  className?: string;
}) {
  const locale = useLocale();
  const location = useLocation();
  const navigate = useNavigate();

  function change(next: Locale) {
    if (next === locale) return;
    document.cookie = localeCookieString(next);
    navigate(localizePath(location.pathname, next) + location.search + location.hash);
  }

  return (
    <select
      id={id}
      aria-label={label}
      className={className}
      value={locale}
      onChange={(event) => change(event.target.value as Locale)}
    >
      {SUPPORTED_LOCALES.map((option) => (
        <option key={option} value={option}>
          {LOCALE_LABELS[option]}
        </option>
      ))}
    </select>
  );
}
