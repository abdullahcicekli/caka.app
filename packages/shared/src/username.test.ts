import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  RESERVED_USERNAMES,
  USERNAME_CHANGE_COOLDOWN_DAYS,
  USERNAME_REDIRECT_DAYS,
  checkUsernameChange,
  normalizeUsername,
  usernameChangeWindow,
  usernameRedirectExpiresAt,
  usernameWindowDayKey,
  validateUsername,
} from "./username";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("normalizeUsername", () => {
  it("kırpar ve küçük harfe çevirir", () => {
    expect(normalizeUsername("  John ")).toBe("john");
  });

  it("Türkçe noktasız ı'yı i'ye indirger", () => {
    expect(normalizeUsername("IŞIL")).toBe("işil");
  });
});

describe("validateUsername", () => {
  it("geçerli adresi kanonik haliyle döner", () => {
    expect(validateUsername("Deniz-42")).toEqual({ ok: true, username: "deniz-42" });
  });

  it.each(["al", "a"])("kısa adresi reddeder: %s", (u) => {
    expect(validateUsername(u)).toEqual({ ok: false, error: "too_short" });
  });

  it("31 karakteri reddeder", () => {
    expect(validateUsername("a".repeat(31))).toEqual({ ok: false, error: "too_long" });
  });

  it.each(["ali veli", "ali_veli", "ali.veli", "-ali", "ali-", "çilek"])(
    "geçersiz karakter/biçimi reddeder: %s",
    (u) => {
      expect(validateUsername(u).ok).toBe(false);
    },
  );

  it.each([
    "edit",
    "ONBOARDING",
    "Api",
    "caka",
    "admin",
    "settings",
    "giris",
    "ayarlar",
    "postmaster",
    "billing",
    "kvkk",
    "null",
    "www",
  ])("rezerve adresi reddeder: %s", (u) => {
    expect(validateUsername(u)).toEqual({ ok: false, error: "reserved" });
  });

  // Bugün route'u yok; rıza sistemi geldiğinde kullanılacak, o zamana dek
  // kapılmamalı. Route tablosundan türetilemediği için elle tutulur.
  it("route'u olmayan planlı slug'ı rezerve tutar: cerez-tercihleri", () => {
    expect(validateUsername("cerez-tercihleri")).toEqual({
      ok: false,
      error: "reserved",
    });
  });

  it.each(["cakateam", "caka-resmi", "cakahq"])(
    "marka prefix'ini reddeder: %s",
    (u) => {
      expect(validateUsername(u)).toEqual({ ok: false, error: "reserved" });
    },
  );

  it.each([
    "erdogan",
    "receptayyiperdogan",
    "ataturk",
    "mustafakemal",
    "kilicdaroglu",
    "imamoglu",
    "bahceli",
    "feto",
    "akparti",
    "cumhurbaskani",
  ])("siyasi figür/kurum taklidini reddeder: %s", (u) => {
    expect(validateUsername(u)).toEqual({ ok: false, error: "reserved" });
  });

  it.each([
    "allah",
    "peygamber",
    "rasulullah",
    "kuran",
    "muhammedsav",
    "hzmuhammed",
    "hz-ali",
    "hazreti-omer",
    "hazretiosman",
  ])("dinî kutsal ad/saygı biçimini reddeder: %s", (u) => {
    expect(validateUsername(u)).toEqual({ ok: false, error: "reserved" });
  });

  it.each([
    "orospucocugu",
    "hassiktir",
    "yarak",
    "kahpe",
  ])("argoyu reddeder: %s", (u) => {
    expect(validateUsername(u)).toEqual({ ok: false, error: "reserved" });
  });

  it.each([
    // düz kişi adları serbest (dinî figür adları dahil — yaygın Türk isimleri)
    "muhammed",
    "ali",
    "omer",
    "ayse",
    "ebubekir",
    "hasan",
    "huseyin",
    "fatima",
    // yaygın soyadı/kelimeler tek başına serbest
    "ozel",
    "gul",
    "yildirim",
    "yavas",
    "demirtas",
    // rezerve kökün türevleri (exact-match felsefesi)
    "administrator99",
    "supportteam",
    "editcim",
    "apici",
  ])("meşru adlara izin verir: %s", (u) => {
    expect(validateUsername(u).ok).toBe(true);
  });
});

/* ------------------------------------------------------------------ *
 * Route tablosu ↔ rezerve liste senkronu (KTD9)
 * ------------------------------------------------------------------ */

// `packages/shared` `apps/web/app/routes.ts`'i **import** edemez (React Router
// bağımlılığı buraya girmemeli), ama Vitest Node'da koşar: dosyayı metin olarak
// okuyup route adlarını çıkarmak mümkün. Böylece `:username` catch-all'undan
// önce eklenen bir route rezerve listeye girmeyi unutulduğunda test kırılır —
// aksi hâlde route, o adı almış profili yönlendirmesiz karartır (Değişmez #1).
const ROUTES_PATH = fileURLToPath(
  new URL("../../../apps/web/app/routes.ts", import.meta.url),
);

/** `route("onboarding/tamamla", …)` → `onboarding`. Parametrik segment atlanır. */
function topLevelRouteSlugs(source: string): string[] {
  const slugs = new Set<string>();
  for (const match of source.matchAll(/\broute\(\s*["']([^"']+)["']/g)) {
    const first = match[1]?.split("/")[0];
    if (!first || first.startsWith(":")) continue;
    slugs.add(first);
  }
  return [...slugs];
}

describe("route tablosu ↔ rezerve liste", () => {
  it("route tablosu beklenen yerde durur", () => {
    // Dosya taşınırsa test sessizce boş geçmesin, gürültüyle kırılsın.
    expect(
      existsSync(ROUTES_PATH),
      `route tablosu bulunamadı: ${ROUTES_PATH} — dosya taşındıysa bu testteki yolu güncelle`,
    ).toBe(true);
  });

  it("route tablosundan slug çıkarılabiliyor", () => {
    const slugs = topLevelRouteSlugs(readFileSync(ROUTES_PATH, "utf8"));
    // Ayrıştırma bozulursa (route tanımı biçimi değişirse) boş küme dönüp test
    // yanlışlıkla yeşile düşerdi; alt sınır bunu engeller.
    expect(slugs.length, "route tablosundan hiç slug çıkmadı").toBeGreaterThan(5);
    expect(slugs, "hukuki sayfalar route tablosunda").toContain("gizlilik");
  });

  it("her top-level route slug'ı rezerve listede", () => {
    for (const slug of topLevelRouteSlugs(readFileSync(ROUTES_PATH, "utf8"))) {
      expect(
        RESERVED_USERNAMES.has(slug),
        `"/${slug}" route'u var ama RESERVED_USERNAMES'te yok (packages/shared/src/username.ts)`,
      ).toBe(true);
    }
  });
});

describe("usernameRedirectExpiresAt", () => {
  it("değişiklik anına 30 gün ekler (Değişmez #10)", () => {
    const changedAt = new Date("2026-08-17T10:00:00.000Z");
    expect(usernameRedirectExpiresAt(changedAt).toISOString()).toBe(
      "2026-09-16T10:00:00.000Z",
    );
    expect(USERNAME_REDIRECT_DAYS).toBe(30);
  });
});

describe("usernameWindowDayKey", () => {
  it("günü Türkiye saatine göre keser (UTC'de bir gün geri kaymaz)", () => {
    // 17 Ağustos 01:30 (TR) = 16 Ağustos 22:30 UTC. Düz toISOString "16"
    // gösterirdi; kullanıcıya söylenen tarih bir gün erken olurdu.
    expect(usernameWindowDayKey(new Date("2026-08-16T22:30:00.000Z"))).toBe("2026-08-17");
  });

  it("TR gün sınırının hemen öncesinde önceki günde kalır", () => {
    // 16 Ağustos 23:59 (TR) = 16 Ağustos 20:59 UTC.
    expect(usernameWindowDayKey(new Date("2026-08-16T20:59:00.000Z"))).toBe("2026-08-16");
    // 17 Ağustos 00:00 (TR) = 16 Ağustos 21:00 UTC.
    expect(usernameWindowDayKey(new Date("2026-08-16T21:00:00.000Z"))).toBe("2026-08-17");
  });

  it("gece yapılan değişikliğin 30 günlük bitişi doğru günü gösterir", () => {
    // Değişiklik 17 Ağustos 01:00 TR → kilit 16 Eylül 01:00 TR'de düşer.
    const changedAt = new Date("2026-08-16T22:00:00.000Z");
    expect(usernameWindowDayKey(usernameRedirectExpiresAt(changedAt))).toBe("2026-09-16");
  });
});

describe("usernameChangeWindow", () => {
  const now = new Date("2026-08-17T10:00:00.000Z");

  it("hiç değiştirmemiş kullanıcıya izin verir", () => {
    expect(usernameChangeWindow(null, now)).toEqual({
      allowed: true,
      availableAt: null,
      remainingDays: 0,
    });
  });

  it("bekleme süresi dolmuşsa izin verir", () => {
    const last = new Date(now.getTime() - USERNAME_CHANGE_COOLDOWN_DAYS * DAY_MS);
    expect(usernameChangeWindow(last, now).allowed).toBe(true);
  });

  it("bekleme süresi içindeyse kalan günü yukarı yuvarlar", () => {
    const last = new Date(now.getTime() - 28.5 * DAY_MS);
    const window = usernameChangeWindow(last, now);
    expect(window.allowed).toBe(false);
    expect(window.remainingDays).toBe(2);
    expect(window.availableAt?.toISOString()).toBe("2026-08-18T22:00:00.000Z");
  });

  it("saat kayması yüzünden gelecekte kalan kaydı kısıtlayıcı sayar", () => {
    const last = new Date(now.getTime() + DAY_MS);
    expect(usernameChangeWindow(last, now).allowed).toBe(false);
  });

  it("kilit penceresiyle bekleme penceresi aynı uzunlukta", () => {
    expect(USERNAME_CHANGE_COOLDOWN_DAYS).toBe(USERNAME_REDIRECT_DAYS);
  });
});

describe("checkUsernameChange", () => {
  const now = new Date("2026-08-17T10:00:00.000Z");

  it("geçerli adayı kanonik haliyle döner", () => {
    expect(checkUsernameChange(" Deniz-42 ", "ali", null, now)).toEqual({
      ok: true,
      username: "deniz-42",
    });
  });

  it("rezerve adı reddeder (validateUsername zayıflatılmadı)", () => {
    expect(checkUsernameChange("ayarlar", "ali", null, now)).toEqual({
      ok: false,
      error: "reserved",
    });
    expect(checkUsernameChange("cakahq", "ali", null, now)).toEqual({
      ok: false,
      error: "reserved",
    });
  });

  it.each(["al", "a".repeat(31), "ali_veli"])("biçim hatasını geçirmez: %s", (u) => {
    expect(checkUsernameChange(u, "ali", null, now).ok).toBe(false);
  });

  it("mevcut adresin normalize eşitini 'same' sayar", () => {
    expect(checkUsernameChange(" ALI ", "ali", null, now)).toEqual({
      ok: false,
      error: "same",
    });
  });

  it("bekleme süresi içinde reddeder", () => {
    const last = new Date(now.getTime() - DAY_MS);
    expect(checkUsernameChange("veli", "ali", last, now)).toEqual({
      ok: false,
      error: "cooldown",
    });
  });

  it("bekleme süresi içinde bile 'same' daha açıklayıcı hatadır", () => {
    const last = new Date(now.getTime() - DAY_MS);
    expect(checkUsernameChange("ali", "ali", last, now)).toEqual({
      ok: false,
      error: "same",
    });
  });

  it("süre dolduğunda değişikliğe izin verir", () => {
    const last = new Date(now.getTime() - (USERNAME_CHANGE_COOLDOWN_DAYS + 1) * DAY_MS);
    expect(checkUsernameChange("veli", "ali", last, now)).toEqual({
      ok: true,
      username: "veli",
    });
  });
});
