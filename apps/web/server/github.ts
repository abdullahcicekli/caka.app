// GitHub katkı takvimi: profil sayfasının GENEL HTML parçası
// (`https://github.com/users/<login>/contributions`). Token gerekmez; hata/
// timeout/markup değişikliği durumunda özellik sessizce kapanır (boş sözlük
// döner) ve sayfa ASLA bu yüzden düşmez.
//
// NEDEN GraphQL DEĞİL: `contributionsCollection` yalnızca token'ın görebildiği
// katkıları sayar. "Include private contributions on my profile" açık olan bir
// kullanıcıda üçüncü taraf token'ı yalnız genel katkıları görür — ölçüldü:
// abdullahcicekli için GraphQL 2.005, GitHub profili 3.476 diyordu (367 günün
// 214'ü boş görünüyordu, gerçekte 143). Bu parça ise ziyaretçinin gördüğünün
// birebir aynısıdır.
//
// TAKAS: bu bir scrape'tir, API değil — GitHub markup'ı habersiz değiştirebilir.
// Ayrıştırıcının bağımlı olduğu markup ve bozulunca nereye bakılacağı
// `packages/shared/src/github-contributions.ts` başındaki notta yazılı;
// gerçek bir parça üzerinde test edilir (github-contributions.test.ts).
//
// Önbellek D1'dedir (github_calendar tablosu), Cache API DEĞİL: Cache API
// colo-başına çalışır ve aynı login her veri merkezinde ayrı GitHub isteği
// doğururdu. D1 global tek kayıttır: istek sayısı ≈ benzersiz login × günde 4.
// Bu, kimliksiz istekler için GitHub'ın IP başına hız sınırına karşı da asıl
// korumadır (aşağıda tek deneme; retry YOK).
import { waitUntil } from "cloudflare:workers";
import { and, eq, inArray, lt } from "drizzle-orm";

import { createDb, githubCalendar } from "@caka/db";
import { parseGithubContributionsHtml, type ProfileLayout } from "@caka/shared";

import {
  githubLoginKey,
  type GithubCalendar,
  type GithubCalendarMap,
} from "../app/lib/github-calendar";

const CONTRIBUTIONS_URL = "https://github.com/users";
const FETCH_TIMEOUT_MS = 4000;
// Parça ~230 KB'dır. Beklenmedik bir yanıt (hata sayfası, yönlendirme gövdesi)
// worker belleğini/CPU'sunu yemesin diye üst sınır konur.
const MAX_HTML_BYTES = 2 * 1024 * 1024;
// Katkı verisi günde bir değişir; başarılı kayıt 6 saat taze sayılır.
const FRESH_TTL_MS = 6 * 60 * 60 * 1000;
// Negatif kayıt YALNIZCA kesin "kullanıcı yok" içindir (NOT_FOUND); geçici
// hata asla 24 saatlik kayıt bırakmaz (aşağıda RETRY_DELAY_MS'e bak).
const NEGATIVE_TTL_MS = 24 * 60 * 60 * 1000;
// Geçici hata (timeout/5xx/rate limit/ağ) sonrası bir sonraki deneme bu kadar
// sonra: kilit sayesinde 15 dk boyunca tek istek dener, herd oluşmaz; veri de
// 6/24 saat rehin kalmaz.
const RETRY_DELAY_MS = 15 * 60 * 1000;

// GitHub login kuralı: alfanumerik + tekil tire, en çok 39 karakter.
// Biçimsiz handle'lar için API'ye hiç gidilmez.
const LOGIN_PATTERN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

type FetchOutcome =
  | { kind: "ok"; calendar: GithubCalendar }
  | { kind: "not_found" }
  | { kind: "error" };

/** Teşhis için tek satır; gürültü olmasın diye YALNIZ beklenmedik durumlarda. */
function logFailure(login: string, reason: string, detail?: unknown) {
  console.warn(`github-calendar: ${login}: ${reason}`, detail ?? "");
}

/**
 * Genel katkı parçasını çeker ve ayrıştırır. Tek deneme yapılır — retry YOK:
 * kimliksiz istekler GitHub'ın IP başına sınırına tabidir ve tazeleme zaten
 * D1 kilidi + TTL ile seyrekleştirilmiştir. Başarısızlık her zaman `error`
 * (geçici) sayılır; yalnız 404 kesin "kullanıcı yok"tur.
 */
async function fetchCalendar(login: string): Promise<FetchOutcome> {
  try {
    const response = await fetch(`${CONTRIBUTIONS_URL}/${encodeURIComponent(login)}/contributions`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        Accept: "text/html",
        // GitHub, User-Agent'sız isteklere 403 döner; kim olduğumuz da belli olsun.
        "User-Agent": "caka.app (+https://caka.app; profile contribution graph)",
      },
    });
    // 404 = login gerçekten yok → 24 saatlik negatif önbellek hak eder.
    if (response.status === 404) return { kind: "not_found" };
    // 429/5xx/403 (hız sınırı, geçici blok) → geçici hata, ~15 dk sonra yeniden.
    if (!response.ok) {
      logFailure(login, `HTTP ${response.status}`);
      return { kind: "error" };
    }
    const contentLength = Number(response.headers.get("content-length") ?? "0");
    if (contentLength > MAX_HTML_BYTES) {
      logFailure(login, `yanıt çok büyük (${contentLength} bayt)`);
      return { kind: "error" };
    }
    const html = await response.text();
    if (html.length > MAX_HTML_BYTES) {
      logFailure(login, `yanıt çok büyük (${html.length} karakter)`);
      return { kind: "error" };
    }
    const parsed = parseGithubContributionsHtml(html);
    // Ayrıştırma başarısız: büyük ihtimalle markup değişti ya da GitHub bir
    // ara sayfa (hız sınırı/challenge) döndürdü. Sayfa yaşar, kart heatmap'siz
    // kalır. Teşhis için yanıtın başı loglanır.
    if (!parsed) {
      logFailure(login, "katkı grid'i ayrıştırılamadı", html.slice(0, 200));
      return { kind: "error" };
    }
    if (!parsed.countsAvailable) {
      // Seviyeler doğru, gün sayıları 0: tooltip markup'ı değişmiş demektir.
      // Kart yine çizilir (tooltip başlıkları yanlış olur) ama iz bırakılır.
      logFailure(login, "gün başına sayı okunamadı (tooltip markup'ı değişmiş olabilir)");
    }
    return { kind: "ok", calendar: { total: parsed.total, weeks: parsed.weeks } };
  } catch (error) {
    // Timeout / ağ hatası: sayfa yaşar, kart heatmap'siz kalır.
    logFailure(login, "istek başarısız", error instanceof Error ? error.message : error);
    return { kind: "error" };
  }
}

/**
 * Kilitlenecek satırın durumu. `staleBefore`: satırı bayat saydığımız eşik —
 * kilit koşulu da aynı eşiği kullanır ki iki eşzamanlı istek aynı satırı
 * ancak birinin kilitleyebilmesi garanti olsun.
 */
type ClaimTarget =
  | { kind: "missing" }
  | { kind: "stale"; staleBefore: Date; hasPayload: boolean };

/**
 * Thundering-herd korumalı fetch: GitHub'a gitmeden ÖNCE D1'de atomik "kilit"
 * alınır (fetched_at öne yazılır); kilidi alamayan istek fetch'i atlar —
 * viral bir profilde TTL dolduğunda tek istek GitHub'a gider, gerisi bayat
 * veriyi (ya da heatmap'siz kartı) gösterir.
 *
 * Fetch sonucuna göre:
 * - ok        → payload + fetchedAt=now (6 saat taze).
 * - not_found → payload=NULL + fetchedAt=now (24 saat negatif; KESİN bilgi).
 * - error     → kilit GERİ ALINIR: fetchedAt, ilgili TTL'e göre ~15 dk sonra
 *   bayat sayılacak değere çekilir. Geçici hata asla 24 saatlik kayıt
 *   bırakmaz ve mevcut İYİ payload'u EZMEZ.
 */
async function fetchAndStore(
  env: Env,
  login: string,
  target: ClaimTarget,
): Promise<GithubCalendar | null> {
  const db = createDb(env.DB);
  try {
    if (target.kind === "missing") {
      // INSERT ... ON CONFLICT DO NOTHING RETURNING: boş dönerse başka bir
      // istek satırı zaten oluşturdu (kilidi kaptı) → fetch'i atla.
      const claimed = await db
        .insert(githubCalendar)
        .values({ login, payload: null, fetchedAt: new Date() })
        .onConflictDoNothing()
        .returning({ login: githubCalendar.login });
      if (claimed.length === 0) return null;
    } else {
      // Koşullu UPDATE ... RETURNING: fetched_at hâlâ eşiğin altındaysa öne
      // yaz; boş dönerse başka bir istek zaten tazeliyor → fetch'i atla.
      const claimed = await db
        .update(githubCalendar)
        .set({ fetchedAt: new Date() })
        .where(and(eq(githubCalendar.login, login), lt(githubCalendar.fetchedAt, target.staleBefore)))
        .returning({ login: githubCalendar.login });
      if (claimed.length === 0) return null;
    }
  } catch {
    // Kilit yazılamadıysa fetch'e hiç gitme: kilitsiz fetch herd riskidir.
    return null;
  }

  const outcome = await fetchCalendar(login);
  // Hata geri almasında satırın TABİ OLDUĞU TTL esas alınır: iyi payload'lu
  // satır 6 saatlik, payload'suz (negatif/yeni) satır 24 saatlik sayaçtadır.
  const ttlMs = target.kind === "stale" && target.hasPayload ? FRESH_TTL_MS : NEGATIVE_TTL_MS;
  try {
    if (outcome.kind === "ok") {
      await db
        .update(githubCalendar)
        .set({ payload: JSON.stringify(outcome.calendar), fetchedAt: new Date() })
        .where(eq(githubCalendar.login, login));
    } else if (outcome.kind === "not_found") {
      await db
        .update(githubCalendar)
        .set({ payload: null, fetchedAt: new Date() })
        .where(eq(githubCalendar.login, login));
    } else {
      // Geçici hata: kilit yüzünden fetchedAt=now kaldıysa satır 6/24 saat
      // rehin kalırdı. now - TTL + 15dk'ya çekilir → 15 dk sonra yeniden
      // bayat sayılır; payload'a DOKUNULMAZ (iyi veri korunur).
      await db
        .update(githubCalendar)
        .set({ fetchedAt: new Date(Date.now() - ttlMs + RETRY_DELAY_MS) })
        .where(eq(githubCalendar.login, login));
    }
  } catch {
    // D1 yazımı başarısız olsa da sayfa render'ı etkilenmez.
  }
  return outcome.kind === "ok" ? outcome.calendar : null;
}

function parsePayload(payload: string | null): GithubCalendar | null {
  if (!payload) return null;
  try {
    const value = JSON.parse(payload) as GithubCalendar;
    return value && typeof value.total === "number" && Array.isArray(value.weeks) ? value : null;
  } catch {
    return null;
  }
}

/** Layout'taki GitHub sosyal bloklarından login listesi çıkarır (tekil). */
export function collectGithubLogins(layout: ProfileLayout): string[] {
  const logins = new Set<string>();
  for (const block of layout.blocks) {
    if (block.type === "social" && block.data.platform === "github" && block.data.handle) {
      logins.add(githubLoginKey(block.data.handle));
    }
  }
  return [...logins];
}

/**
 * login → takvim sözlüğü. Kimlik doğrulama gerekmez; GitHub'ın genel katkı
 * parçası okunur. Parça çekilemez/ayrıştırılamazsa ilgili login sözlükte hiç
 * görünmez ve kart heatmap'siz render edilir.
 *
 * Okuma yolu sayfayı GitHub'a bekletmez: D1'deki kayıt bayat olsa bile hemen
 * döndürülür, tazeleme `waitUntil` ile arka plana atılır. Yalnız D1'de hiç
 * görülmemiş login satır içi (kısa timeout'la) çekilir.
 */
export async function getGithubCalendars(env: Env, logins: string[]): Promise<GithubCalendarMap> {
  const unique = [...new Set(logins.map(githubLoginKey))].filter((login) =>
    LOGIN_PATTERN.test(login),
  );
  if (unique.length === 0) return {};

  const map: GithubCalendarMap = {};
  const missing: string[] = [];
  const stale: { login: string; staleBefore: Date; hasPayload: boolean }[] = [];
  const now = Date.now();

  let rows: (typeof githubCalendar.$inferSelect)[] = [];
  try {
    rows = await createDb(env.DB)
      .select()
      .from(githubCalendar)
      .where(inArray(githubCalendar.login, unique));
  } catch {
    // D1 okunamazsa özellik bu görüntülemede kapalı kalır.
    return {};
  }

  for (const login of unique) {
    const row = rows.find((item) => item.login === login);
    if (!row) {
      missing.push(login);
      continue;
    }
    const calendar = parsePayload(row.payload);
    if (calendar) map[login] = calendar;
    const ttl = calendar ? FRESH_TTL_MS : NEGATIVE_TTL_MS;
    if (now - row.fetchedAt.getTime() > ttl) {
      stale.push({ login, staleBefore: new Date(now - ttl), hasPayload: Boolean(calendar) });
    }
  }

  // İlk kez görülen login: bir kez satır içi beklenir (aksi hâlde kart ilk
  // görüntülemede hiç heatmap alamaz); sonraki tüm istekler D1'den okur.
  // Kilidi kapan istek olmayabiliriz — o durumda kart bu görüntülemede
  // heatmap'siz render edilir.
  if (missing.length > 0) {
    const fetched = await Promise.all(
      missing.map(
        async (login) => [login, await fetchAndStore(env, login, { kind: "missing" })] as const,
      ),
    );
    for (const [login, calendar] of fetched) {
      if (calendar) map[login] = calendar;
    }
  }

  // Bayat kayıtlar yanıtı bekletmez. `waitUntil` export'u `cloudflare:workers`
  // modülünde mevcut (worker-configuration.d.ts) — istek bağlamına bağlanır,
  // yanıt döndükten sonra da promise tamamlanana dek worker açık kalır.
  if (stale.length > 0) {
    waitUntil(
      Promise.allSettled(
        stale.map(({ login, staleBefore, hasPayload }) =>
          fetchAndStore(env, login, { kind: "stale", staleBefore, hasPayload }),
        ),
      ),
    );
  }

  return map;
}
