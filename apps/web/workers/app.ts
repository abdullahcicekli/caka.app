import { createRequestHandler } from "react-router";
import { honoApp } from "../server";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

// /:username/og.png — tek path segmenti + og.png (KTD7'nin route'u)
const OG_IMAGE_PATH = /^\/[^/]+\/og\.png$/;

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);

    if (
      pathname === "/api" ||
      pathname.startsWith("/api/") ||
      pathname.startsWith("/i/") ||
      OG_IMAGE_PATH.test(pathname)
    ) {
      return honoApp.fetch(request, env, ctx);
    }

    return requestHandler(request);
  },
} satisfies ExportedHandler<Env>;
