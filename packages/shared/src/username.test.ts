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

  it.each(["edit", "ONBOARDING", "Api", "caka", "admin"])(
    "rezerve adresi reddeder: %s",
    (u) => {
      expect(validateUsername(u)).toEqual({ ok: false, error: "reserved" });
    },
  );
});
