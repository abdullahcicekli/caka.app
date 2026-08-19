// Editörün konum arama ucu: `/api/konum?q=…`.
//
// Deseni `/api/spotify` ve `/api/youtube` ile birebir aynı: çapraz köken
// kapısı, OTURUM ZORUNLU, sonuç kayıt anında bir kez çözülür ve blokta durur.
// Fark, çözülen şeyin bir adres değil bir YER olması.
//
// NEDEN OTURUM ZORUNLU: coğrafi kodlama kotalı bir dış servis. Uç açık
// bırakılsaydı ziyaretçi trafiğiyle (ya da yabancı bir siteyle) tükenirdi.
// Ayrıca R58 açısından da önemli: ARAMA ziyaretçinin değil, düzenleyenin
// eylemidir; profil sayfası açıldığında bu uç hiç çağrılmaz.
import { Hono } from "hono";

import { appCatalog } from "../app/content/app";
import { getSession } from "./auth";
import { LOCATION_QUERY_MAX, searchLocations } from "./location";
import { signMapFramePaths } from "./map-frame";
import { localeFromRequest } from "./locale";
import { isCrossOriginRequest } from "./request";

export const locationApi = new Hono<{ Bindings: Env }>();

locationApi.get("/", async (c) => {
  const locale = localeFromRequest(c.req.raw);
  const app = appCatalog[locale].api;
  if (isCrossOriginRequest(c.req.raw)) return c.json({ error: app.origin }, 403);
  const session = await getSession(c.env, c.req.raw);
  if (!session) return c.json({ error: "Oturum gerekli" }, 401);

  const query = (c.req.query("q") ?? "").trim();
  if (!query) return c.json({ results: [] });
  if (query.length > LOCATION_QUERY_MAX) {
    return c.json({ error: app.locationQueryTooLong(LOCATION_QUERY_MAX) }, 400);
  }

  const result = await searchLocations(query, locale);
  if (result.status === "unavailable") {
    return c.json({ error: app.locationUnavailable }, 502);
  }
  // Her sonuca imzalı harita karelerini de ekle. NEDEN BURADA: editör, blok
  // kaydedilmeden önce haritayı göstermek zorunda (WYSIWYG) ve imza sırra
  // bağlı olduğu için istemcide üretilemez. `/api/youtube`'un `proxied`
  // alanıyla aynı gerekçe.
  const results = await Promise.all(
    result.results.map(async (item) => ({
      ...item,
      frames: await signMapFramePaths(c.env, item.lat, item.lon),
    })),
  );
  // Boş liste bir HATA DEĞİL: "bulunamadı" cümlesini istemci kurar, çünkü
  // aranan metni o biliyor.
  return c.json({ results });
});
