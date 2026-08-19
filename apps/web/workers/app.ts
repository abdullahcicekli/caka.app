import { createRequestHandler } from "react-router";
import { honoApp } from "../server";
import { localeRedirect } from "../server/locale";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);

    if (
      pathname === "/api" ||
      pathname.startsWith("/api/") ||
      pathname.startsWith("/i/") ||
      // Belge servisi (`/b/<assetId>`) — görsel yoluyla aynı sınıf. Burada
      // sayılmazsa istek React Router'a düşer ve `:username` catch-all'una
      // takılıp 404 olur.
      pathname.startsWith("/b/") ||
      pathname === "/sitemap.xml" ||
      pathname.startsWith("/sitemaps/") ||
      pathname === "/robots.txt" ||
      pathname === "/llms.txt" ||
      // Kullanıcıya özel og:image (KTD7'nin `/:username/og.png`u yerine
      // hash'li URL — bkz. server/og-image.ts). Statik /og/*.png marka
      // görselleri assets katmanından döner, Worker'a hiç düşmez.
      pathname.startsWith("/og/u/")
    ) {
      return honoApp.fetch(request, env, ctx);
    }

    // Dil kapısı (L7): API ve sitemap yollarından SONRA, React Router'dan
    // ÖNCE. Böylece yalnız sayfa istekleri değerlendirilir ve karar tek
    // noktada verilir.
    const redirect = localeRedirect(request);
    if (redirect) return redirect;

    return requestHandler(request);
  },
} satisfies ExportedHandler<Env>;
