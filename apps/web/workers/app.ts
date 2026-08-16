import { createRequestHandler } from "react-router";
import { honoApp } from "../server";

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

    return requestHandler(request);
  },
} satisfies ExportedHandler<Env>;
