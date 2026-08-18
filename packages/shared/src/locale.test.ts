import { describe, expect, it } from "vitest";

import {
  DEFAULT_LOCALE,
  OG_LOCALES,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  localeFromPrefix,
  parseAcceptLanguage,
  prefixForLocale,
  resolveLocale,
} from "./locale";

describe("dil listesi", () => {
  it("beş dili kullanıcının verdiği öncelik sırasında taşır", () => {
    expect(SUPPORTED_LOCALES).toEqual(["en", "tr", "es", "pt-BR", "de"]);
  });

  it("varsayılan dili Türkçedir", () => {
    expect(DEFAULT_LOCALE).toBe("tr");
  });

  it("her dilin kendi dilinde yazılmış bir adı vardır", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(LOCALE_LABELS[locale]).toBeTruthy();
    }
    // Seçici, kullanıcının okuyabildiği dilde görünmeli: Almanca bilen biri
    // listede "Almanca" değil "Deutsch" arar.
    expect(LOCALE_LABELS.de).toBe("Deutsch");
    expect(LOCALE_LABELS["pt-BR"]).toBe("Português (Brasil)");
  });

  it("her dilin og:locale karşılığı bölge etiketi taşır", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(OG_LOCALES[locale], locale).toMatch(/^[a-z]{2}_[A-Z]{2}$/);
    }
    expect(OG_LOCALES["pt-BR"]).toBe("pt_BR");
  });

  it("desteklenen dili tanır, tanımadığını reddeder", () => {
    expect(isSupportedLocale("pt-BR")).toBe(true);
    expect(isSupportedLocale("pt")).toBe(false);
    expect(isSupportedLocale("")).toBe(false);
  });
});

describe("prefixForLocale", () => {
  it("Türkçeyi öneksiz bırakır", () => {
    expect(prefixForLocale("tr")).toBe("");
  });

  it("diğer dillere küçük harf önek verir", () => {
    expect(prefixForLocale("en")).toBe("en");
    expect(prefixForLocale("de")).toBe("de");
    expect(prefixForLocale("pt-BR")).toBe("pt-br");
  });
});

describe("localeFromPrefix", () => {
  it("küçük harf öneki dile çevirir", () => {
    expect(localeFromPrefix("en")).toBe("en");
    expect(localeFromPrefix("pt-br")).toBe("pt-BR");
  });

  it("Türkçe için önek yoktur — 'tr' bir yol öneki olarak tanınmaz", () => {
    // Aksi hâlde /tr/gizlilik ikinci bir kanonik adres olurdu (L5).
    expect(localeFromPrefix("tr")).toBeNull();
  });

  it("tanımadığı segmenti reddeder", () => {
    expect(localeFromPrefix("ahmet")).toBeNull();
    expect(localeFromPrefix("PT-BR")).toBeNull();
    expect(localeFromPrefix("")).toBeNull();
  });
});

describe("parseAcceptLanguage", () => {
  it("en yüksek q değerli desteklenen dili seçer", () => {
    expect(parseAcceptLanguage("de-DE,de;q=0.9,en;q=0.8")).toBe("de");
  });

  it("sırayı değil q değerini dinler", () => {
    expect(parseAcceptLanguage("en;q=0.5,de;q=0.9")).toBe("de");
  });

  it("q verilmeyen girdiyi 1.0 sayar", () => {
    expect(parseAcceptLanguage("es,de;q=0.9")).toBe("es");
  });

  it("bölge etiketini düşürerek eşler", () => {
    expect(parseAcceptLanguage("en-US")).toBe("en");
    expect(parseAcceptLanguage("de-AT,de-CH;q=0.9")).toBe("de");
  });

  it("Portekizcenin her varyantını pt-BR'ye eşler", () => {
    expect(parseAcceptLanguage("pt-BR")).toBe("pt-BR");
    expect(parseAcceptLanguage("pt-PT")).toBe("pt-BR");
    expect(parseAcceptLanguage("pt")).toBe("pt-BR");
  });

  it("desteklenmeyen dili atlayıp sıradakine bakar", () => {
    expect(parseAcceptLanguage("fr;q=0.9,tr;q=0.5")).toBe("tr");
  });

  it("hiçbir desteklenen dil yoksa null döner", () => {
    expect(parseAcceptLanguage("zh-CN,ja;q=0.9")).toBeNull();
  });

  it("joker karakteri dil saymaz", () => {
    expect(parseAcceptLanguage("*")).toBeNull();
  });

  it("boş ve tanımsız başlıkta null döner", () => {
    expect(parseAcceptLanguage("")).toBeNull();
    expect(parseAcceptLanguage(null)).toBeNull();
    expect(parseAcceptLanguage(undefined)).toBeNull();
  });

  it("bozuk q değerli girdiyi en sona atar ama atmaz", () => {
    expect(parseAcceptLanguage("en;q=abc,de")).toBe("de");
    expect(parseAcceptLanguage("en;q=abc")).toBe("en");
  });

  it("q=0 ile açıkça reddedilen dili seçmez", () => {
    expect(parseAcceptLanguage("de;q=0,en;q=0.1")).toBe("en");
  });
});

describe("resolveLocale", () => {
  it("yol öneki varsa diğer her şeyi ezer", () => {
    expect(
      resolveLocale({
        pathLocale: "es",
        cookie: "de",
        acceptLanguage: "en-US",
      }),
    ).toBe("es");
  });

  it("yol öneki yoksa çerezi dinler", () => {
    expect(resolveLocale({ cookie: "de", acceptLanguage: "en-US" })).toBe("de");
  });

  it("çerez Türkçe diyorsa tarayıcı başlığını ezer", () => {
    // Türkçeyi seçmiş bir kullanıcı Almanca tarayıcıda da Türkçe görmeli.
    expect(resolveLocale({ cookie: "tr", acceptLanguage: "de-DE" })).toBe("tr");
  });

  it("tanımadığı çerez değerini yok sayar", () => {
    expect(resolveLocale({ cookie: "klingon", acceptLanguage: "de-DE" })).toBe("de");
  });

  it("çerez yoksa tarayıcı başlığını dinler", () => {
    expect(resolveLocale({ acceptLanguage: "pt-PT,pt;q=0.9" })).toBe("pt-BR");
  });

  it("hiçbir sinyal yoksa Türkçeye düşer", () => {
    expect(resolveLocale({})).toBe("tr");
    expect(resolveLocale({ acceptLanguage: "zh-CN" })).toBe("tr");
  });
});
