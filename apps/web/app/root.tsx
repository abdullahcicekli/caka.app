import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
} from "react-router";

import type { ProfileTheme } from "@caka/shared";

import type { Route } from "./+types/root";
import "./app.css";

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

export function Layout({ children }: { children: React.ReactNode }) {
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
    <html lang="tr" data-profile-theme={profileTheme ?? undefined}>
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
  let message = "Bir şeyler ters gitti";
  let details = "Beklenmeyen bir hata oluştu. Lütfen tekrar dene.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "Sayfa bulunamadı" : "Bir şeyler ters gitti";
    details =
      error.status === 404
        ? "Aradığın sayfa yok ya da taşınmış olabilir."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1 className="text-2xl font-bold">{message}</h1>
      <p className="mt-2">{details}</p>
      <a href="/" className="mt-6 inline-block font-medium underline">
        Ana sayfaya dön
      </a>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
