// Editörün ayet arama ve çözümleme uçları: `/api/ayet`.
//
// Deseni `/api/spotify` (server/spotify-api.ts) ve `/api/youtube` ile birebir
// aynı: çapraz köken kapısı, oturum zorunlu, sonuç kayda yazılacak hâliyle
// döner. Ziyaretçi tarafı bu uçlara HİÇ dokunmaz — profil sayfası ayeti
// bloğun kendi verisinden render eder (R58).
//
// İKİ UÇ, ÇÜNKÜ İKİ FARKLI MALİYET:
//   GET /api/ayet?q=…            → arama. Yalnız kısaltılmış meal döner.
//   GET /api/ayet/sec?sure&ayet  → seçim. Arapça + tam meal + atıf döner.
// Arama her tuş vuruşunda çalışıyor; tam metni orada da döndürmek her satır
// için 1,5 KB'lık gereksiz gövde olurdu.
//
// HATALAR SESSİZ DEĞİL: kullanıcı neyin yanlış olduğunu görmeli — "Bakara
// suresinde 300. ayet yok" ile "kaynak yanıt vermedi" ayrı cümlelerdir ve
// metni tek kaynak olan katalog verir (istemci kendi metnini üretmez).
import { Hono } from "hono";

import { SURAHS, parseSurahQuery, verseRefIssue } from "@caka/shared";

import { appCatalog } from "../app/content/app";
import { getSession } from "./auth";
import { localeFromRequest } from "./locale";
import { listSurahVerses, resolveVerse, searchMeal, type VerseSearchHit } from "./quran";
import { isCrossOriginRequest } from "./request";

/** Metin araması için en az bu kadar harf gerekir (yoksa yarım Kur'an döner). */
const MIN_QUERY_LENGTH = 3;

export const quranApi = new Hono<{ Bindings: Env }>();

quranApi.get("/", async (c) => {
  const app = appCatalog[localeFromRequest(c.req.raw)].api;
  if (isCrossOriginRequest(c.req.raw)) return c.json({ error: app.origin }, 403);
  const session = await getSession(c.env, c.req.raw);
  if (!session) return c.json({ error: "Oturum gerekli" }, 401);

  const query = (c.req.query("q") ?? "").trim();
  if (!query) return c.json({ hits: [] });

  // Önce ADRES olarak dene: "bakara 255" ya da "2:255" yazan kullanıcı
  // aramayı değil, o ayeti istiyor. Adres değilse metin aramasına düşülür.
  const reference = parseSurahQuery(query);
  if (reference) {
    const surah = SURAHS[reference.surah - 1];
    if (reference.verse !== null && verseRefIssue({ surah: reference.surah, verse: reference.verse })) {
      return c.json({ error: app.ayetVerseOutOfRange(surah.name, surah.verses) }, 400);
    }
    const hits = await listSurahVerses(reference.surah, reference.verse ?? 1);
    if (hits.length === 0) return c.json({ error: app.ayetUnavailable }, 502);
    return c.json({ hits } satisfies { hits: VerseSearchHit[] });
  }

  if (query.length < MIN_QUERY_LENGTH) {
    return c.json({ error: app.ayetQueryTooShort(MIN_QUERY_LENGTH) }, 400);
  }
  const hits = await searchMeal(query);
  return c.json({ hits } satisfies { hits: VerseSearchHit[] });
});

quranApi.get("/sec", async (c) => {
  const app = appCatalog[localeFromRequest(c.req.raw)].api;
  if (isCrossOriginRequest(c.req.raw)) return c.json({ error: app.origin }, 403);
  const session = await getSession(c.env, c.req.raw);
  if (!session) return c.json({ error: "Oturum gerekli" }, 401);

  const surah = Number(c.req.query("sure"));
  const verse = Number(c.req.query("ayet"));
  // Ağa çıkmadan önce şekli eler: dizinde olmayan bir adres için dış istek
  // atmanın anlamı yok ve hata mesajı da buradan daha net çıkıyor.
  const issue = verseRefIssue({ surah, verse });
  if (issue === "surah") return c.json({ error: app.ayetSurahUnknown }, 400);
  if (issue === "verse") {
    const entry = SURAHS[surah - 1];
    return c.json({ error: app.ayetVerseOutOfRange(entry.name, entry.verses) }, 400);
  }

  const resolved = await resolveVerse(surah, verse);
  if (!resolved) return c.json({ error: app.ayetUnavailable }, 502);
  return c.json(resolved);
});
