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

import { SPOTIFY_KIND_LABELS, classifySpotifyUrl } from "@caka/shared";
import { getSession } from "./auth";
import { isCrossOriginRequest } from "./request";
import { signImageProxyPath } from "./image-proxy";
import { resolveSpotifyLink } from "./spotify";

/** `classifySpotifyUrl` reddetme sebebi → kullanıcıya gösterilecek cümle. */
const CLASSIFY_ERRORS: Record<"invalid" | "not-spotify" | "unsupported", string> = {
  invalid: "Bu bir bağlantı gibi görünmüyor. Spotify'da “Paylaş → Bağlantıyı kopyala” ile aldığın adresi yapıştır.",
  "not-spotify":
    "Bu adres Spotify'a ait değil. open.spotify.com adresi ya da spotify:track:… biçimindeki bağlantıyı yapıştır.",
  unsupported:
    "Bu Spotify adresi eklenebilir bir içerik değil. Parça, albüm, çalma listesi, sanatçı, podcast ve bölüm eklenebilir; kullanıcı profili, arama ve kitaplık sayfaları eklenemez.",
};

export const spotifyApi = new Hono<{ Bindings: Env }>();

spotifyApi.get("/", async (c) => {
  if (isCrossOriginRequest(c.req.raw)) return c.json({ error: "Geçersiz istek kaynağı" }, 403);
  const session = await getSession(c.env, c.req.raw);
  if (!session) return c.json({ error: "Oturum gerekli" }, 401);

  const url = c.req.query("url") ?? "";
  // Ağa çıkmadan önce şekli eler: Spotify olmayan bir adres için dış istek
  // atmanın anlamı yok ve hata mesajı da buradan daha net çıkıyor.
  const ref = classifySpotifyUrl(url);
  if (ref.kind === "none") return c.json({ error: CLASSIFY_ERRORS[ref.reason] }, 400);

  const resolved = await resolveSpotifyLink(url);
  // `classifySpotifyUrl` geçtiyse buraya düşmez; yine de tip daraltmanın
  // ötesinde bir güvence olsun diye açık bir dal.
  if (!resolved) return c.json({ error: CLASSIFY_ERRORS.unsupported }, 400);

  if (resolved.status === "not-found") {
    return c.json(
      {
        error: `Bu ${SPOTIFY_KIND_LABELS[resolved.kind].toLocaleLowerCase("tr")} Spotify'da bulunamadı. İçerik kaldırılmış olabilir ya da bağlantı eksik kopyalanmış.`,
      },
      404,
    );
  }
  if (resolved.status === "unavailable") {
    return c.json(
      { error: "Spotify şu anda yanıt vermedi. Birazdan tekrar dene." },
      502,
    );
  }

  return c.json({
    kind: resolved.kind,
    // Türün Türkçe adı da dönülür: editörün "Parça olarak eklendi" cümlesi
    // ile ucun hata mesajları aynı sözlükten okusun.
    kindLabel: SPOTIFY_KIND_LABELS[resolved.kind],
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
