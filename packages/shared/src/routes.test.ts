import { describe, expect, it } from "vitest";

import { SUPPORTED_LOCALES, prefixForLocale } from "./locale";
import { ROUTE_KEYS, ROUTE_SLUGS, localizePath, parseLocalizedPath, pathFor } from "./routes";
import { RESERVED_USERNAMES } from "./username";

describe("slug tablosu", () => {
  it("Türkçe sütunu bugün yayında olan adresleri birebir korur", () => {
    // L5: bu satırlardan biri değişirse yayındaki bir adres kırılır.
    expect(ROUTE_SLUGS.gizlilik.tr).toBe("gizlilik");
    expect(ROUTE_SLUGS["kullanim-kosullari"].tr).toBe("kullanim-kosullari");
    expect(ROUTE_SLUGS["cerez-politikasi"].tr).toBe("cerez-politikasi");
    expect(ROUTE_SLUGS.ayarlar.tr).toBe("ayarlar");
    expect(ROUTE_SLUGS.login.tr).toBe("login");
    expect(ROUTE_SLUGS.edit.tr).toBe("edit");
    expect(ROUTE_SLUGS.dashboard.tr).toBe("dashboard");
    expect(ROUTE_SLUGS["onboarding.kurulum"].tr).toBe("onboarding/kurulum/:step");
  });

  it("her route her dilde boş olmayan bir slug taşır", () => {
    for (const key of ROUTE_KEYS) {
      for (const locale of SUPPORTED_LOCALES) {
        if (key === "home") continue; // kök: slug'ı yoktur
        expect(ROUTE_SLUGS[key][locale], `${key}/${locale}`).toBeTruthy();
      }
    }
  });

  it("bir dil içinde iki route aynı slug'ı almaz", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const slugs = ROUTE_KEYS.filter((key) => key !== "home").map(
        (key) => ROUTE_SLUGS[key][locale],
      );
      expect(new Set(slugs).size, `${locale} içinde çakışan slug var`).toBe(slugs.length);
    }
  });

  it("slug'lar ASCII ve küçük harftir", () => {
    // Aksan ve umlaut URL'de yüzdeleme kaçışına yol açar.
    for (const key of ROUTE_KEYS) {
      for (const locale of SUPPORTED_LOCALES) {
        const slug = ROUTE_SLUGS[key][locale];
        expect(slug, `${key}/${locale}`).toMatch(/^[a-z0-9\-/:]*$/);
      }
    }
  });

  it("dil önekleri hiçbir Türkçe route'un ilk segmentiyle çakışmaz", () => {
    // Çakışsaydı /de gibi bir adres hem dil kökü hem Türkçe sayfa olurdu.
    const trFirstSegments = new Set(
      ROUTE_KEYS.map((key) => ROUTE_SLUGS[key].tr.split("/")[0]).filter(Boolean),
    );
    for (const locale of SUPPORTED_LOCALES) {
      const prefix = prefixForLocale(locale);
      if (!prefix) continue;
      expect(trFirstSegments.has(prefix), `${prefix} çakışıyor`).toBe(false);
    }
  });
});

describe("rezerve isimler", () => {
  it("pt-br kullanıcı adı olarak alınamaz", () => {
    // Değişmez #1 / L20: beş karakterli geçerli bir desen, çakışabilir.
    expect(RESERVED_USERNAMES.has("pt-br")).toBe(true);
  });

  it("diğer dil önekleri de listede durur", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const prefix = prefixForLocale(locale);
      if (!prefix) continue;
      expect(RESERVED_USERNAMES.has(prefix), prefix).toBe(true);
    }
  });
});

describe("pathFor", () => {
  it("Türkçeyi öneksiz üretir", () => {
    expect(pathFor("gizlilik", "tr")).toBe("/gizlilik");
    expect(pathFor("home", "tr")).toBe("/");
  });

  it("diğer dilleri önekle ve çevrilmiş slug'la üretir", () => {
    expect(pathFor("gizlilik", "en")).toBe("/en/privacy");
    expect(pathFor("gizlilik", "de")).toBe("/de/datenschutz");
    expect(pathFor("ayarlar", "es")).toBe("/es/ajustes");
    expect(pathFor("home", "pt-BR")).toBe("/pt-br");
  });

  it("parametreyi yerine koyar", () => {
    expect(pathFor("onboarding.kurulum", "de", { step: "2" })).toBe(
      "/de/willkommen/einrichtung/2",
    );
    expect(pathFor("onboarding.kurulum", "tr", { step: "1" })).toBe("/onboarding/kurulum/1");
  });
});

describe("parseLocalizedPath", () => {
  it("öneksiz Türkçe yolu çözer", () => {
    expect(parseLocalizedPath("/gizlilik")).toEqual({
      locale: "tr",
      key: "gizlilik",
      params: {},
    });
  });

  it("kökü home olarak çözer", () => {
    expect(parseLocalizedPath("/")).toEqual({ locale: "tr", key: "home", params: {} });
    expect(parseLocalizedPath("/de")).toEqual({ locale: "de", key: "home", params: {} });
  });

  it("önekli yolu dili ve route'uyla çözer", () => {
    expect(parseLocalizedPath("/en/privacy")).toEqual({
      locale: "en",
      key: "gizlilik",
      params: {},
    });
  });

  it("parametreyi yakalar", () => {
    expect(parseLocalizedPath("/pt-br/bem-vindo/configuracao/3")).toEqual({
      locale: "pt-BR",
      key: "onboarding.kurulum",
      params: { step: "3" },
    });
  });

  it("sondaki eğik çizgiyi yok sayar", () => {
    expect(parseLocalizedPath("/en/privacy/")?.key).toBe("gizlilik");
  });

  it("bir dilin slug'ını başka dilin önekiyle kabul etmez", () => {
    // /de/privacy Almanca sayfanın adresi değil; 404 olmalı.
    expect(parseLocalizedPath("/de/privacy")).toBeNull();
  });

  it("route olmayan yolu çözemez", () => {
    expect(parseLocalizedPath("/ahmet")).toBeNull();
    expect(parseLocalizedPath("/en/ahmet")).toBeNull();
  });
});

describe("localizePath", () => {
  it("aynı sayfanın hedef dildeki adresini verir", () => {
    expect(localizePath("/ayarlar", "es")).toBe("/es/ajustes");
    expect(localizePath("/en/privacy", "de")).toBe("/de/datenschutz");
    expect(localizePath("/de/datenschutz", "tr")).toBe("/gizlilik");
  });

  it("parametreyi taşır", () => {
    expect(localizePath("/onboarding/kurulum/2", "en")).toBe("/en/onboarding/setup/2");
  });

  it("dilden bağımsız yolu olduğu gibi bırakır", () => {
    // Profil sayfası öneksizdir (L9); dil değiştirmek kullanıcıyı sayfadan atmaz.
    expect(localizePath("/ahmet", "de")).toBe("/ahmet");
    expect(localizePath("/ahmet", "tr")).toBe("/ahmet");
  });

  it("kökü hedef dilin köküne çevirir", () => {
    expect(localizePath("/", "de")).toBe("/de");
    expect(localizePath("/de", "tr")).toBe("/");
  });

  it("her dil çifti arasında gidiş-dönüş tutarlıdır", () => {
    for (const key of ROUTE_KEYS) {
      for (const from of SUPPORTED_LOCALES) {
        for (const to of SUPPORTED_LOCALES) {
          const source = pathFor(key, from, { step: "1" });
          expect(localizePath(source, to), `${key}: ${from}→${to}`).toBe(
            pathFor(key, to, { step: "1" }),
          );
        }
      }
    }
  });
});
