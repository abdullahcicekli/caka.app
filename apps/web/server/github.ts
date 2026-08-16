// GitHub katkı takvimi: resmî GraphQL API + Personal Access Token.
// `GITHUB_TOKEN` sırrı tanımlı değilse özellik sessizce kapalıdır (boş sözlük
// döner); hata/timeout durumunda da sayfa ASLA bu yüzden düşmez.
//
// Önbellek D1'dedir (github_calendar tablosu), Cache API DEĞİL: Cache API
// colo-başına çalışır ve aynı login her veri merkezinde ayrı GitHub isteği
// doğururdu — tek token'ın saatlik puanı colo sayısıyla çarpılıp erirdi.
// D1 global tek kayıttır: istek sayısı ≈ benzersiz login × günde 4.
import { waitUntil } from "cloudflare:workers";
import { and, eq, inArray, lt } from "drizzle-orm";

import { createDb, githubCalendar } from "@caka/db";
import type { ProfileLayout } from "@caka/shared";

import {
  githubLoginKey,
  type GithubCalendar,
  type GithubCalendarLevel,
  type GithubCalendarMap,
} from "../app/lib/github-calendar";

const GRAPHQL_URL = "https://api.github.com/graphql";
const FETCH_TIMEOUT_MS = 4000;
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

const LEVEL_BY_ENUM: Record<string, GithubCalendarLevel> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

const CALENDAR_QUERY = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`;

type GraphQLPayload = {
  data?: {
    user?: {
      contributionsCollection?: {
        contributionCalendar?: {
          totalContributions?: number;
          weeks?: {
            contributionDays?: {
              date?: string;
              contributionCount?: number;
              contributionLevel?: string;
            }[];
          }[];
        };
      };
    } | null;
  };
  // GitHub, HTTP 200 + data.user: null kombinasyonunu FORBIDDEN /
  // SAML_ENFORCEMENT / askıya alınmış hesap gibi durumlarda da döndürür;
  // ayrım errors[].type üzerinden yapılır.
  errors?: { type?: string }[];
};

type FetchOutcome =
  | { kind: "ok"; calendar: GithubCalendar }
  | { kind: "not_found" }
  | { kind: "error" };

async function fetchCalendar(token: string, login: string): Promise<FetchOutcome> {
  try {
    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        // GitHub API User-Agent başlığı olmadan 403 döner.
        "User-Agent": "caka.app",
      },
      body: JSON.stringify({ query: CALENDAR_QUERY, variables: { login } }),
    });
    if (!response.ok) return { kind: "error" };
    const payload = (await response.json()) as GraphQLPayload;
    const raw = payload.data?.user?.contributionsCollection?.contributionCalendar;
    if (raw?.weeks) {
      return {
        kind: "ok",
        calendar: {
          total: raw.totalContributions ?? 0,
          weeks: raw.weeks.map((week) => ({
            days: (week.contributionDays ?? []).map((day) => ({
              date: day.date ?? "",
              count: day.contributionCount ?? 0,
              level: LEVEL_BY_ENUM[day.contributionLevel ?? ""] ?? 0,
            })),
          })),
        },
      };
    }
    // errors varsa yalnız açık NOT_FOUND kesin bilgidir; FORBIDDEN /
    // SAML_ENFORCEMENT / RATE_LIMITED vb. geçici sayılır — 24 saatlik negatif
    // önbelleğe girmesinler.
    if (Array.isArray(payload.errors) && payload.errors.length > 0) {
      return payload.errors.some((error) => error?.type === "NOT_FOUND")
        ? { kind: "not_found" }
        : { kind: "error" };
    }
    // errors yok + user: null → login gerçekten yok (kesin bilgi, negatif önbellek).
    if (payload.data && payload.data.user === null) return { kind: "not_found" };
    return { kind: "error" };
  } catch {
    // Timeout / ağ hatası: sayfa yaşar, kart heatmap'siz kalır.
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
  token: string,
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

  const outcome = await fetchCalendar(token, login);
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
 * login → takvim sözlüğü. Token yoksa/boşsa özellik kapalıdır: boş sözlük
 * döner, log'a hiçbir şey yazılmaz.
 *
 * Okuma yolu sayfayı GitHub'a bekletmez: D1'deki kayıt bayat olsa bile hemen
 * döndürülür, tazeleme `waitUntil` ile arka plana atılır. Yalnız D1'de hiç
 * görülmemiş login satır içi (kısa timeout'la) çekilir.
 */
export async function getGithubCalendars(env: Env, logins: string[]): Promise<GithubCalendarMap> {
  const token = typeof env.GITHUB_TOKEN === "string" ? env.GITHUB_TOKEN.trim() : "";
  if (!token) return {};
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
        async (login) => [login, await fetchAndStore(env, token, login, { kind: "missing" })] as const,
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
          fetchAndStore(env, token, login, { kind: "stale", staleBefore, hasPayload }),
        ),
      ),
    );
  }

  return map;
}
