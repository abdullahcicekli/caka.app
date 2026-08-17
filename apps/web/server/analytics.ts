/**
 * Panel analitiği yazma/okuma hattı (R48).
 *
 * ── Ziyaretçinin cihazına dokunulmaz ───────────────────────────────────────
 * Bu dosyada `Set-Cookie` yazan, `document.cookie`/`localStorage`/
 * `sessionStorage`/IndexedDB'ye erişen ya da istemciye durum döndüren tek bir
 * satır yoktur: yazma yolları gövdesiz `204` döner, okuma yolu yalnızca sayfa
 * sahibinin oturumunda çalışır. Cihazda tanımlayıcı olmadığı için `@caka/shared`
 * çerez envanterine (`COOKIE_INVENTORY`) girecek yeni bir kalem de yoktur —
 * yayındaki `/cerez-politikasi` metni olduğu gibi doğru kalır (KTD21).
 *
 * ── Ham IP saklanmaz ───────────────────────────────────────────────────────
 * İstekten yalnızca `request.cf.country` okunur (iki harfli ülke kodu).
 * `CF-Connecting-IP` hiç okunmaz; IP hash'lenmez, tuzlanmaz, türev üretilmez.
 * Kullanıcı-ajanı yalnız bot ayıklama kararı için okunur ve saklanmaz.
 *
 * ── Üçüncü taraf yok ───────────────────────────────────────────────────────
 * Ölçüm kendi D1'imize yazılır; dışarıya istek çıkmaz, çapraz site bağlantısı
 * kurulmaz. Veri yalnızca profil sahibine kendi panelinde gösterilir.
 */
import { waitUntil } from "cloudflare:workers";
import { and, eq, gte, sql } from "drizzle-orm";
import { isbot } from "isbot";

import { createDb, linkClickDaily, profileViewDaily } from "@caka/db";
import {
  dayKey,
  earliestDay,
  normalizeCountry,
  OLCUM_PENCERE_GUN,
  shiftDayKey,
  type CountryRow,
  type DailyRow,
  type LinkClickRow,
} from "@caka/shared";

/** Kaç günlük ham gün-kovası panele çekilir. */
const WINDOW_DAYS = OLCUM_PENCERE_GUN;

/**
 * Ölçülecek bir ziyaret mi? Bot trafiği sayaçları şişirmesin (isbot, zaten
 * bağımlılıkta). Kullanıcı-ajanı olmayan istekler de sayılmaz: tarayıcılar
 * her zaman gönderir, göndermeyen taraf script'tir.
 *
 * Ön-getirme/ön-render de sayılmaz — ziyaretçi sayfayı henüz görmedi.
 */
export function isMeasurableVisit(request: Request): boolean {
  const purpose =
    request.headers.get("Sec-Purpose") ??
    request.headers.get("Purpose") ??
    request.headers.get("X-Moz") ??
    "";
  if (/prefetch|prerender/i.test(purpose)) return false;

  const userAgent = request.headers.get("User-Agent");
  if (!userAgent) return false;
  return !isbot(userAgent);
}

/** İstekten alınan TEK konum verisi. Ham IP'ye bilerek dokunulmaz. */
function visitorCountry(request: Request): string {
  const cf = (request as Request & { cf?: { country?: string | null } }).cf;
  return normalizeCountry(cf?.country ?? null);
}

/**
 * Yazmayı istek yanıtından ayırır. `waitUntil` yoksa (test/ön-render gibi
 * istek bağlamı dışı çağrılar) yazma sessizce atlanır — ölçüm hiçbir koşulda
 * sayfayı geciktirmez veya kırmaz.
 */
function fireAndForget(work: () => Promise<unknown>): void {
  try {
    waitUntil(
      work().catch(() => {
        // Ölçüm best-effort: D1 hatası ziyaretçiye görünmez, sayfa etkilenmez.
      }),
    );
  } catch {
    // İstek bağlamı yoksa `waitUntil` fırlatır; ölçüm atlanır.
  }
}

/**
 * Profil görüntülenmesini sayar. Çağıran taraf `await` ETMEZ: fonksiyon
 * senkron döner, D1 yazması `waitUntil` içinde yanıt akışının dışında koşar.
 * Böylece render ne yavaşlar ne de yazma hatasından etkilenir.
 */
export function recordProfileView(
  env: Env,
  request: Request,
  options: { profileId: string; isOwner: boolean },
): void {
  // Sahip kendi sayfasına baktığında sayaç şişmesin.
  if (options.isOwner) return;
  if (!isMeasurableVisit(request)) return;

  const day = dayKey(new Date());
  const country = visitorCountry(request);
  fireAndForget(() =>
    createDb(env.DB)
      .insert(profileViewDaily)
      .values({ profileId: options.profileId, day, country, views: 1 })
      .onConflictDoUpdate({
        target: [
          profileViewDaily.profileId,
          profileViewDaily.day,
          profileViewDaily.country,
        ],
        // Tek deyimde atomik artış: eşzamanlı istekler birbirini ezmez.
        set: { views: sql`${profileViewDaily.views} + 1` },
      }),
  );
}

/** Bağlantı tıklamasını sayar. Görüntülenmeyle aynı bloklamayan yol. */
export function recordLinkClick(
  env: Env,
  request: Request,
  options: { profileId: string; blockId: string },
): void {
  if (!isMeasurableVisit(request)) return;

  const day = dayKey(new Date());
  fireAndForget(() =>
    createDb(env.DB)
      .insert(linkClickDaily)
      .values({
        profileId: options.profileId,
        blockId: options.blockId,
        day,
        clicks: 1,
      })
      .onConflictDoUpdate({
        target: [
          linkClickDaily.profileId,
          linkClickDaily.day,
          linkClickDaily.blockId,
        ],
        set: { clicks: sql`${linkClickDaily.clicks} + 1` },
      }),
  );
}

export interface ProfileAnalytics {
  /** Pencerenin son günü (Türkiye günü) */
  today: string;
  /** Pencere içindeki günlük görüntülenme satırları (seyrek) */
  views: DailyRow[];
  /** Pencere içindeki ülke kırılımı */
  countries: CountryRow[];
  /** Pencere içindeki blok başına tıklama */
  clicks: LinkClickRow[];
  /** Kayıt altına alınmış en eski gün; hiç veri yoksa null */
  since: string | null;
}

/**
 * Panelin ihtiyacı olan ham kovaları tek turda çeker. Toplulaştırma saf
 * fonksiyonlarda (`@caka/shared`) yapılır; burada yalnız I/O var.
 */
export async function getProfileAnalytics(
  env: Env,
  profileId: string,
  now: Date = new Date(),
): Promise<ProfileAnalytics> {
  const db = createDb(env.DB);
  const today = dayKey(now);
  const windowStart = shiftDayKey(today, -(WINDOW_DAYS - 1));

  const [viewRows, clickRows, oldestView, oldestClick] = await Promise.all([
    db
      .select({
        day: profileViewDaily.day,
        country: profileViewDaily.country,
        views: profileViewDaily.views,
      })
      .from(profileViewDaily)
      .where(
        and(
          eq(profileViewDaily.profileId, profileId),
          gte(profileViewDaily.day, windowStart),
        ),
      ),
    db
      .select({
        blockId: linkClickDaily.blockId,
        clicks: linkClickDaily.clicks,
      })
      .from(linkClickDaily)
      .where(
        and(
          eq(linkClickDaily.profileId, profileId),
          gte(linkClickDaily.day, windowStart),
        ),
      ),
    db
      .select({ day: sql<string | null>`min(${profileViewDaily.day})` })
      .from(profileViewDaily)
      .where(eq(profileViewDaily.profileId, profileId)),
    db
      .select({ day: sql<string | null>`min(${linkClickDaily.day})` })
      .from(linkClickDaily)
      .where(eq(linkClickDaily.profileId, profileId)),
  ]);

  const oldest = [oldestView[0]?.day, oldestClick[0]?.day]
    .filter((day): day is string => typeof day === "string" && day.length > 0)
    .map((day) => ({ day }));

  return {
    today,
    views: viewRows.map((row) => ({ day: row.day, count: row.views })),
    countries: viewRows.map((row) => ({ country: row.country, count: row.views })),
    clicks: clickRows.map((row) => ({ blockId: row.blockId, clicks: row.clicks })),
    since: earliestDay(oldest),
  };
}
