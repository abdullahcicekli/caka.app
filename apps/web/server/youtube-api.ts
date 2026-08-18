// Editörün YouTube çözümleme ucu (plan KTD34): `/api/youtube?url=…`.
//
// NEDEN AYRI BİR UÇ: video/kanal ayrımı KAYIT ANINDA bir kez yapılır ve
// sonucu blokta durur; render bu işi tekrarlamaz. Editör bu yüzden bloğu
// yazmadan önce buraya sorar ve dönen veriyi olduğu gibi bloğa geçirir.
// Deseni `/api/og-image` (server/og.ts) ile aynıdır: oturum zorunlu, yanıt
// hem ham adresi hem `<img src>`'e konabilecek imzalı `proxied` yolunu taşır.
//
// HATALAR SESSİZ DEĞİL: kullanıcı neyin yanlış olduğunu bilmeli — "bir şeyler
// ters gitti" değil, "bu adres YouTube'a ait değil". Mesajlar bu yüzden
// sınıflandırma sonucuna birebir bağlı ve tek kaynak burası (istemci kendi
// metnini üretmez, yanıttakini gösterir).
import { Hono } from "hono";

import { classifyYouTubeUrl, youtubeVideoUrl } from "@caka/shared";
import { getSession } from "./auth";
import { isCrossOriginRequest } from "./request";
import { signImageProxyPath } from "./image-proxy";
import { resolveYouTubeLink } from "./youtube";
import { appCatalog, type AppContent } from "../app/content/app";
import { localeFromRequest } from "./locale";

/** `classifyYouTubeUrl` reddetme sebebi → kullanıcıya gösterilecek cümle. */
/** Sınıflandırma hatası → katalog anahtarı. Metin dile göre çözülür. */
const CLASSIFY_KEYS = {
  invalid: "youtubeInvalid",
  "not-youtube": "youtubeNotYoutube",
  unsupported: "youtubeUnsupported",
} as const satisfies Record<"invalid" | "not-youtube" | "unsupported", keyof AppContent["api"]>;

export const youtubeApi = new Hono<{ Bindings: Env }>();

youtubeApi.get("/", async (c) => {
  const app = appCatalog[localeFromRequest(c.req.raw)].api;
  if (isCrossOriginRequest(c.req.raw)) return c.json({ error: app.origin }, 403);
  const session = await getSession(c.env, c.req.raw);
  if (!session) return c.json({ error: "Oturum gerekli" }, 401);

  const url = c.req.query("url") ?? "";
  // Ağa çıkmadan önce şekli eler: YouTube olmayan bir adres için dış istek
  // atmanın anlamı yok ve hata mesajı da buradan daha net çıkıyor.
  const ref = classifyYouTubeUrl(url);
  if (ref.kind === "none") return c.json({ error: app[CLASSIFY_KEYS[ref.reason]] }, 400);

  const resolved = await resolveYouTubeLink(url);
  if (!resolved) {
    // Buraya yalnız `@handle` / `/c/` / `/user/` yolları düşer: şekil doğru
    // ama kanal sayfası okunamadı (yok, kapalı ya da ad yanlış yazılmış).
    return c.json(
      { error: app.youtubeChannelNotFound },
      404,
    );
  }

  if (resolved.kind === "channel") {
    return c.json({
      kind: "channel" as const,
      url: resolved.channelUrl,
      channelId: resolved.channelId,
      channelName: resolved.channelName ?? "",
      handle: ref.kind === "channel-ref" && ref.refKind === "handle" ? ref.ref : "",
      thumbnail: resolved.avatarUrl ?? "",
      proxied: resolved.avatarUrl ? await signImageProxyPath(c.env, resolved.avatarUrl) : null,
    });
  }

  // oEmbed hem başlığı hem kanal adını veremediyse video gerçekten yok
  // (silinmiş, gizli ya da kimlik yanlış). Boş başlıklı bir kart kaydetmek
  // yerine kullanıcıya söyle: düzeltebileceği tek an bu.
  if (!resolved.title && !resolved.channelName) {
    return c.json(
      { error: app.youtubeVideoNotFound },
      404,
    );
  }

  return c.json({
    kind: "video" as const,
    url: youtubeVideoUrl(resolved.videoId),
    videoId: resolved.videoId,
    title: resolved.title ?? "",
    channelName: resolved.channelName ?? "",
    shorts: resolved.shorts,
    verticalThumbnail: resolved.verticalThumbnail,
    thumbnail: resolved.thumbnailUrl,
    // Editörde blok daha kaydedilmeden önizleme görünsün diye imzalı yol da
    // dönülür; loader'ın `signedImages` eşlemesine buradan eklenir.
    proxied: await signImageProxyPath(c.env, resolved.thumbnailUrl),
  });
});
