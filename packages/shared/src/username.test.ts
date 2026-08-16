import { describe, expect, it } from "vitest";

import { normalizeUsername, validateUsername } from "./username";

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
