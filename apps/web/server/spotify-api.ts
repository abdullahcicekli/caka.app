// Editörün Spotify çözümleme ucu: `/api/spotify?url=…`.
//
// NEDEN AYRI BİR UÇ: tür (parça/albüm/liste/…) ve kimlik KAYIT ANINDA bir kez
// çözülür ve blokta durur; render tekrarlamaz. Editör bu yüzden bloğu
// yazmadan önce buraya sorar ve dönen veriyi olduğu gibi bloğa geçirir.
// Deseni `/api/youtube` (server/youtube-api.ts) ile birebir aynı: çapraz
// köken kapısı, oturum zorunlu, imzalı `proxied` görsel yolu.
//
// HATALAR SESSİZ DEĞİL: kullanıcı neyin yanlış olduğunu bilmeli — "bir şeyler
// ters gitti" değil, "bu adres Spotify'a ait değil". Mesajlar sınıflandırma
// sonucuna birebir bağlı ve tek kaynak burası (istemci kendi metnini
// üretmez, yanıttakini gösterir).
import { Hono } from "hono";

import { classifySpotifyUrl, type SpotifyKind } from "@caka/shared";

import { appCatalog, type AppContent } from "../app/content/app";
import { widgetCatalog } from "../app/content/widget";
import { localeFromRequest } from "./locale";

/** Tür rozetinin isteğin dilindeki adı — widget kataloğuyla aynı sözlük. */
function kindLabel(request: Request, kind: SpotifyKind): string {
  return widgetCatalog[localeFromRequest(request)].spotify.kind(kind);
}
import { getSession } from "./auth";
import { isCrossOriginRequest } from "./request";
import { signImageProxyPath } from "./image-proxy";
import { resolveSpotifyLink } from "./spotify";

/** `classifySpotifyUrl` reddetme sebebi → kullanıcıya gösterilecek cümle. */
/** Sınıflandırma hatası → katalog anahtarı. Metin dile göre çözülür. */
const CLASSIFY_KEYS = {
  invalid: "spotifyInvalid",
  "not-spotify": "spotifyNotSpotify",
  unsupported: "spotifyUnsupported",
} as const satisfies Record<"invalid" | "not-spotify" | "unsupported", keyof AppContent["api"]>;

export const spotifyApi = new Hono<{ Bindings: Env }>();

spotifyApi.get("/", async (c) => {
  const app = appCatalog[localeFromRequest(c.req.raw)].api;
  if (isCrossOriginRequest(c.req.raw)) return c.json({ error: app.origin }, 403);
  const session = await getSession(c.env, c.req.raw);
  if (!session) return c.json({ error: "Oturum gerekli" }, 401);

  const url = c.req.query("url") ?? "";
  // Ağa çıkmadan önce şekli eler: Spotify olmayan bir adres için dış istek
  // atmanın anlamı yok ve hata mesajı da buradan daha net çıkıyor.
  const ref = classifySpotifyUrl(url);
  if (ref.kind === "none") return c.json({ error: app[CLASSIFY_KEYS[ref.reason]] }, 400);

  const resolved = await resolveSpotifyLink(url);
  // `classifySpotifyUrl` geçtiyse buraya düşmez; yine de tip daraltmanın
  // ötesinde bir güvence olsun diye açık bir dal.
  if (!resolved) return c.json({ error: app.spotifyUnsupported }, 400);

  if (resolved.status === "not-found") {
    return c.json(
      {
        error: app.spotifyNotFound(kindLabel(c.req.raw, resolved.kind)),
      },
      404,
    );
  }
  if (resolved.status === "unavailable") {
    return c.json(
      { error: app.spotifyUnavailable },
      502,
    );
  }

  return c.json({
    kind: resolved.kind,
    // Türün adı da dönülür: editörün "Parça olarak eklendi" cümlesi ile ucun
    // hata mesajları aynı sözlükten, aynı dilde okusun.
    kindLabel: kindLabel(c.req.raw, resolved.kind),
    url: resolved.url,
    entityId: resolved.entityId,
    title: resolved.title ?? "",
    thumbnail: resolved.thumbnailUrl ?? "",
    // Editörde blok daha kaydedilmeden önizleme görünsün diye imzalı yol da
    // dönülür; loader'ın `signedImages` eşlemesine buradan eklenir.
    proxied: resolved.thumbnailUrl
      ? await signImageProxyPath(c.env, resolved.thumbnailUrl)
      : null,
  });
});
