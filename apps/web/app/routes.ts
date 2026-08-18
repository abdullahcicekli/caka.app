import { type RouteConfig, type RouteConfigEntry, index, route } from "@react-router/dev/routes";

import {
  DEFAULT_LOCALE,
  ROUTE_KEYS,
  type RouteKey,
  SUPPORTED_LOCALES,
  pathFor,
} from "@caka/shared";

// Route tablosu elle YAZILMAZ: `@caka/shared`'daki slug tablosundan üretilir
// (L6). Tek kaynak orasıdır; buraya elle bir satır eklenirse o adres
// hreflang'de, sitemap'te ve dil değiştiricide görünmez.
//
// Uygulama route'ları her zaman `:username` catch-all'undan ÖNCE gelir ve dil
// önekleri rezerve isim listesindedir (Değişmez #1 / L20).
//
// `/:username` bilinçli olarak dil öneki ALMAZ (L9): kullanıcının içeriği
// çevrilmediği için önekli kopyalar yalnızca kopya içerik üretirdi.

const ROUTE_FILES: Record<RouteKey, string> = {
  home: "routes/home.tsx",
  login: "routes/login.tsx",
  edit: "routes/edit.tsx",
  dashboard: "routes/dashboard.tsx",
  ayarlar: "routes/ayarlar.tsx",
  gizlilik: "routes/gizlilik.tsx",
  "kullanim-kosullari": "routes/kullanim-kosullari.tsx",
  "cerez-politikasi": "routes/cerez-politikasi.tsx",
  onboarding: "routes/onboarding.tsx",
  "onboarding.tamamla": "routes/onboarding.tamamla.tsx",
  "onboarding.hazir": "routes/onboarding.hazir.tsx",
  "onboarding.kurulum": "routes/onboarding.kurulum.tsx",
};

const localized: RouteConfigEntry[] = [];

for (const locale of SUPPORTED_LOCALES) {
  for (const key of ROUTE_KEYS) {
    const file = ROUTE_FILES[key];

    // Türkçe kök tek `index` route'udur; kalan her şey yol taşır.
    if (key === "home" && locale === DEFAULT_LOCALE) {
      localized.push(index(file));
      continue;
    }

    // Aynı modül beş kez kullanıldığı için kimlik elle verilir; React Router
    // route kimliklerinin benzersiz olmasını ister.
    localized.push(route(pathFor(key, locale).slice(1), file, { id: `${locale}/${key}` }));
  }
}

export default [
  ...localized,
  route(":username", "routes/username.tsx"),
] satisfies RouteConfig;
