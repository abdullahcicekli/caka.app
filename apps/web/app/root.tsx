import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useMatches,
  useRouteLoaderData,
} from "react-router";

import {
  DEFAULT_LOCALE,
  type Locale,
  localeFromPathname,
  type ProfileTheme,
} from "@caka/shared";

import type { Route } from "./+types/root";
import { localeFromRequest } from "../server/locale";
import "./app.css";
import { ErrorPage } from "./components/error-page";
import { appCatalog } from "./content/app";
import { useCatalog } from "./lib/locale";

/** Public profil sayfasında kök zemin (html/body) ve tarayıcı çubuğu
 * (theme-color) tema rengine boyanır; iOS overscroll'da açık renkli şerit
 * görünmesin. Değerler app.css'teki `--profile-bg` token'larının aynasıdır —
 * meta/attribute CSS değişkeni okuyamadığı için burada düz değer gerekir;
 * app.css'te bir tema zemini değişirse burası da güncellenmeli. Record tipi
 * ProfileTheme'e bağlıdır: yeni tema eklenip burası unutulursa typecheck kırılır
 * (aksi hâlde o temada beyaz şerit sessizce geri gelirdi). */
const PROFILE_THEME_COLORS: Record<ProfileTheme, string> = {
  light: "#f7f6f2", // --color-zemin
  dark: "#14141a", // --color-murekkep
  lavanta: "#f4f2fb",
  ufuk: "#eae7e0",
  neon: "#171123",
  zumrut: "#0d1615",
};

/** Marka mavisi — public profil dışındaki sayfaların theme-color'ı. */
const BRAND_THEME_COLOR = "#2A55F5";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
  { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
  { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
  { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
  { rel: "manifest", href: "/site.webmanifest" },
  { rel: "preconnect", href: "https://api.fontshare.com" },
  { rel: "preconnect", href: "https://cdn.fontshare.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    // Clash Display yalnız Ufuk temasının başlıklarında kullanılır; tarayıcı
    // font dosyasını sayfada o aile gerçekten kullanılmadıkça indirmez.
    href: "https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&f[]=clash-display@600&display=swap",
  },
];

/**
 * Kök loader tek iş yapar: isteğin dilini çözüp ağaca duyurur (L2). Bütün
 * sayfalar `useLocale()` ile buradan okur, böylece dil tek noktada belirlenir.
 */
export function loader({ request }: Route.LoaderArgs) {
  return { locale: localeFromRequest(request) };
}

export function Layout({ children }: { children: React.ReactNode }) {
  // Hata sınırı çalıştığında kök loader verisi olmayabilir (404'te hiçbir
  // route eşleşmez). O hâlde dil ADRESİN ÖNEKİNDEN okunur; `/en/olmayan-sayfa`
  // sayfası `lang="en"` olmalı. Önek de yoksa Türkçe — öneksiz olan odur.
  const rootData = useRouteLoaderData<typeof loader>("root");
  const { pathname } = useLocation();
  const locale: Locale =
    rootData?.locale ?? localeFromPathname(pathname) ?? DEFAULT_LOCALE;

  // Yalnız /:username route'u eşleşince tema kök elemana taşınır; landing,
  // panel ve editör zeminleri (bg-zemin) etkilenmez. Route hata verdiğinde
  // (404 vb.) data boş kalır ve varsayılan zemin kullanılır.
  const matches = useMatches();
  const profileData = matches.find((match) => match.id === "routes/username")?.loaderData as
    | { theme?: string }
    | undefined;
  const profileTheme =
    profileData?.theme && Object.hasOwn(PROFILE_THEME_COLORS, profileData.theme)
      ? (profileData.theme as ProfileTheme)
      : null;
  return (
    <html lang={locale} data-profile-theme={profileTheme ?? undefined}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="theme-color"
          content={profileTheme ? PROFILE_THEME_COLORS[profileTheme] : BRAND_THEME_COLOR}
        />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const app = useCatalog(appCatalog);
  let message = app.errors.genericTitle;
  let details = app.errors.genericBody;
  let stack: string | undefined;

  const notFound = isRouteErrorResponse(error) && error.status === 404;
  if (isRouteErrorResponse(error)) {
    message = notFound ? app.errors.notFoundTitle : app.errors.genericTitle;
    details = notFound ? app.errors.notFoundBody : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <ErrorPage
      kicker={notFound ? "404" : undefined}
      title={message}
      body={details}
      primary={{ label: app.errors.backHome, href: "/" }}
      secondary={{ label: app.errors.createPage, href: "/onboarding" }}
    >
      {stack ? (
        <pre className="mt-8 w-full overflow-x-auto text-left text-xs">
          <code>{stack}</code>
        </pre>
      ) : null}
    </ErrorPage>
  );
}
