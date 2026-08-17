import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  RESERVED_USERNAMES,
  normalizeUsername,
  validateUsername,
} from "./username";

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
