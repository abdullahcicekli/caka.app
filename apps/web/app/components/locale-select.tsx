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
import { DropdownSelect } from "~/components/ui/dropdown-select";

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
    <DropdownSelect
      id={id}
      value={locale}
      label={label}
      className={className}
      onValueChange={change}
      options={SUPPORTED_LOCALES.map((option) => ({
        value: option,
        label: LOCALE_LABELS[option],
      }))}
    />
  );
}
