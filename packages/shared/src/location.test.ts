import { describe, expect, it } from "vitest";

import {
  LOCATION_FRAME,
  LOCATION_ZOOM,
  MAPBOX_MAP_STYLE,
  MAP_ATTRIBUTION_LINKS,
  buildLocationLabel,
  clockFromParts,
  formatUtcOffset,
  isNightHour,
  isValidLatitude,
  isValidLongitude,
  isValidTimeZone,
  mapFrameImageKey,
  mapboxStaticMapUrl,
  parseGeocodeResponse,
  readLocalClock,
  roundCoordinate,
  timeZoneOffsetMinutes,
} from "./location";
import { profileBlockSchema } from "./layout";

describe("roundCoordinate", () => {
  it("iki ondalığa yuvarlar (gizlilik kararı: ~1,1 km)", () => {
    expect(roundCoordinate(41.008238)).toBe(41.01);
    expect(roundCoordinate(28.978359)).toBe(28.98);
    expect(roundCoordinate(-23.5505199)).toBe(-23.55);
  });

  it("eksi sıfırı sıfıra çeker (JSON gidiş-dönüşü değer değiştirmesin)", () => {
    expect(Object.is(roundCoordinate(-0.001), 0)).toBe(true);
  });

  it("sayı olmayan girdide sıfır döner", () => {
    expect(roundCoordinate(Number.NaN)).toBe(0);
    expect(roundCoordinate(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("idempotenttir: yuvarlanmışı tekrar yuvarlamak değiştirmez", () => {
    const once = roundCoordinate(41.008238);
    expect(roundCoordinate(once)).toBe(once);
  });
});

describe("koordinat doğrulama", () => {
  it("sınırları kabul eder, dışını reddeder", () => {
    expect(isValidLatitude(90)).toBe(true);
    expect(isValidLatitude(-90)).toBe(true);
    expect(isValidLatitude(90.01)).toBe(false);
    expect(isValidLongitude(180)).toBe(true);
    expect(isValidLongitude(-180.5)).toBe(false);
    expect(isValidLatitude(Number.NaN)).toBe(false);
  });
});

describe("isValidTimeZone", () => {
  it("IANA biçimini kabul eder", () => {
    expect(isValidTimeZone("Europe/Istanbul")).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
    expect(isValidTimeZone("America/Argentina/Buenos_Aires")).toBe(true);
    expect(isValidTimeZone("Etc/GMT+3")).toBe(true);
  });

  it("adres kurmayı bozabilecek girdiyi reddeder", () => {
    expect(isValidTimeZone("")).toBe(false);
    expect(isValidTimeZone("../../etc/passwd")).toBe(false);
    expect(isValidTimeZone("Europe/Istanbul?x=1")).toBe(false);
    expect(isValidTimeZone("a".repeat(65))).toBe(false);
  });
});

describe("clockFromParts", () => {
  const parts = (hour: string, minute: string) => [
    { type: "hour", value: hour },
    { type: "literal", value: ":" },
    { type: "minute", value: minute },
  ];

  it("saat ve dakikayı sayıya çevirir", () => {
    expect(clockFromParts(parts("02", "31"))).toEqual({ hour: 2, minute: 31 });
  });

  it('gece yarısını "24" veren ortamları 0\'a normalize eder', () => {
    expect(clockFromParts(parts("24", "05"))).toEqual({ hour: 0, minute: 5 });
  });

  it("eksik ya da sayı olmayan parçada null döner", () => {
    expect(clockFromParts([{ type: "hour", value: "02" }])).toBeNull();
    expect(clockFromParts(parts("--", "31"))).toBeNull();
    expect(clockFromParts(parts("02", "99"))).toBeNull();
  });
});

describe("formatUtcOffset", () => {
  it("tam saatlik farkı dakikasız yazar", () => {
    expect(formatUtcOffset(180)).toBe("+3");
    expect(formatUtcOffset(0)).toBe("+0");
    expect(formatUtcOffset(-300)).toBe("-5");
  });

  it("yarım ve çeyrek saatlik dilimleri dakikayla yazar", () => {
    expect(formatUtcOffset(330)).toBe("+5:30");
    expect(formatUtcOffset(345)).toBe("+5:45");
    expect(formatUtcOffset(-270)).toBe("-4:30");
  });
});

describe("isNightHour", () => {
  it("06:00 öncesi ve 20:00 sonrası gecedir", () => {
    expect(isNightHour(2)).toBe(true);
    expect(isNightHour(5)).toBe(true);
    expect(isNightHour(6)).toBe(false);
    expect(isNightHour(19)).toBe(false);
    expect(isNightHour(20)).toBe(true);
    expect(isNightHour(23)).toBe(true);
  });
});

describe("timeZoneOffsetMinutes", () => {
  // 15 Ocak: kuzey yarımkürede kış saati, güneyde yaz saati.
  const winter = new Date("2026-01-15T12:00:00Z");
  const summer = new Date("2026-07-15T12:00:00Z");

  it("sabit farklı dilimi okur", () => {
    expect(timeZoneOffsetMinutes("Europe/Istanbul", winter)).toBe(180);
    expect(timeZoneOffsetMinutes("Europe/Istanbul", summer)).toBe(180);
  });

  it("yaz saatini takip eder — bu yüzden fark kayıtta SAKLANMAZ", () => {
    expect(timeZoneOffsetMinutes("America/New_York", winter)).toBe(-300);
    expect(timeZoneOffsetMinutes("America/New_York", summer)).toBe(-240);
  });

  it("yarım saatlik dilimi de doğru verir", () => {
    expect(timeZoneOffsetMinutes("Asia/Kolkata", winter)).toBe(330);
  });

  it("tanınmayan dilimde null döner (kart saat pilini basmaz)", () => {
    expect(timeZoneOffsetMinutes("Mars/Olympus", winter)).toBeNull();
  });
});

describe("readLocalClock", () => {
  it("konumun dilimindeki saati verir — ziyaretçininkini değil", () => {
    // 2026-01-15 09:07 UTC → Istanbul 12:07 (+3)
    const clock = readLocalClock("Europe/Istanbul", new Date("2026-01-15T09:07:00Z"));
    expect(clock).toEqual({ hour: 12, minute: 7, offsetMinutes: 180 });
  });

  it("gün sınırını aşan dilimde de doğru", () => {
    // 2026-01-15 23:30 UTC → Tokyo ertesi gün 08:30 (+9)
    const clock = readLocalClock("Asia/Tokyo", new Date("2026-01-15T23:30:00Z"));
    expect(clock).toEqual({ hour: 8, minute: 30, offsetMinutes: 540 });
  });

  it("geçersiz dilimde null döner", () => {
    expect(readLocalClock("", new Date())).toBeNull();
    expect(readLocalClock("Not/AZone", new Date())).toBeNull();
  });
});

describe("buildLocationLabel", () => {
  it("eşleşen yerin ADINI öne alır, üst kademeyi arkasına koyar", () => {
    expect(
      buildLocationLabel({ name: "Kadıköy", state: "İstanbul", country: "Türkiye" }),
    ).toBe("Kadıköy, İstanbul");
  });

  // Canlı Photon yanıtıyla bulunan kusur: `city` öne alındığında "kadikoy"
  // araması "İzmit, Kocaeli" diye görünüyordu — aranan ad listede yoktu.
  it("`name` varken `city`yi ÖNE ALMAZ", () => {
    expect(
      buildLocationLabel({
        name: "Kadıköy",
        city: "İzmit",
        state: "Kocaeli",
        country: "Türkiye",
      }),
    ).toBe("Kadıköy, İzmit");
  });

  it("şehir tek başınaysa ülkeyle eşler", () => {
    expect(buildLocationLabel({ city: "Lizbon", country: "Portekiz" })).toBe(
      "Lizbon, Portekiz",
    );
  });

  it("aynı adı iki kez yazmaz", () => {
    expect(buildLocationLabel({ city: "Singapur", country: "Singapur" })).toBe("Singapur");
  });

  it("adı yoksa idari kademeye düşer", () => {
    expect(buildLocationLabel({ district: "Beyoğlu", city: "İstanbul" })).toBe(
      "Beyoğlu, İstanbul",
    );
  });

  it("yalnız ad varsa ülkeyle eşler", () => {
    expect(buildLocationLabel({ name: "Gökçeada", country: "Türkiye" })).toBe(
      "Gökçeada, Türkiye",
    );
  });

  it("VİRGÜLLÜ `formatted` kullanılmaz — tam adres olabilir", () => {
    expect(
      buildLocationLabel({ formatted: "Moda Cd. 12, 34710 Kadıköy/İstanbul, Türkiye" }),
    ).toBe("");
  });

  it("hiçbir şey yoksa boş döner", () => {
    expect(buildLocationLabel({})).toBe("");
  });
});

describe("parseGeocodeResponse (Photon)", () => {
  const feature = (props: Record<string, unknown>, coords: unknown = [28.9784, 41.0082]) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: coords },
    properties: props,
  });

  it("koordinatı [lon, lat] sırasıyla okur ve yuvarlar", () => {
    const results = parseGeocodeResponse({
      features: [feature({ name: "İstanbul", country: "Türkiye", countrycode: "tr" })],
    });
    expect(results).toEqual([
      {
        label: "İstanbul, Türkiye",
        country: "Türkiye",
        countryCode: "TR",
        lat: 41.01,
        lon: 28.98,
        timeZone: "",
      },
    ]);
  });

  it("koordinatı geçersiz olan sonucu düşürür", () => {
    const results = parseGeocodeResponse({
      features: [
        feature({ name: "Bozuk", country: "X" }, [999, 999]),
        feature({ name: "İzmir", country: "Türkiye" }, [27.14, 38.42]),
      ],
    });
    expect(results.map((r) => r.label)).toEqual(["İzmir, Türkiye"]);
  });

  it("adı kurulamayan sonucu düşürür", () => {
    expect(parseGeocodeResponse({ features: [feature({})] })).toEqual([]);
  });

  it("yuvarlamadan sonra aynı yere düşen tekrarları eler", () => {
    const results = parseGeocodeResponse({
      features: [
        feature({ name: "Ankara", country: "Türkiye" }, [32.8541, 39.9208]),
        feature({ name: "Ankara", country: "Türkiye" }, [32.8543, 39.9207]),
      ],
    });
    expect(results).toHaveLength(1);
  });

  it("limiti aşmaz", () => {
    const features = Array.from({ length: 10 }, (_, index) =>
      feature({ name: `Şehir${index}`, country: "Türkiye" }, [index, index]),
    );
    expect(parseGeocodeResponse({ features }, 3)).toHaveLength(3);
  });

  it("geçersiz ülke kodunu boşa çevirir", () => {
    const [result] = parseGeocodeResponse({
      features: [feature({ name: "Berlin", country: "Almanya", countrycode: "deu" })],
    });
    expect(result?.countryCode).toBe("");
  });

  it("gövde beklenen şekilde değilse boş liste", () => {
    expect(parseGeocodeResponse(null)).toEqual([]);
    expect(parseGeocodeResponse({ features: "nope" })).toEqual([]);
    expect(parseGeocodeResponse({})).toEqual([]);
  });
});

describe("harita karesi adresleri", () => {
  // Anahtar BLOK KİMLİĞİ DEĞİL koordinat taşır: blok kimliğine bağlansaydı,
  // mevcut bir bloğun yeri değiştirildiğinde editör eski şehrin haritasını
  // göstermeye devam ederdi.
  it("eşleme anahtarı koordinatla kademeyi ayırır", () => {
    expect(mapFrameImageKey("far", 41.01, 28.98)).toBe("map-far@41.01,28.98");
    expect(mapFrameImageKey("near", 41.01, 28.98)).toBe("map-near@41.01,28.98");
  });

  it("koordinat değişince anahtar da değişir (bayat kare eşleşmez)", () => {
    expect(mapFrameImageKey("near", 41.01, 28.98)).not.toBe(
      mapFrameImageKey("near", 40.77, 29.95),
    );
  });

  it("sağlayıcı adresi jetonu ve filigran kapatmayı taşır", () => {
    const url = mapboxStaticMapUrl({
      lat: 41.01,
      lon: 28.98,
      zoom: LOCATION_ZOOM.near,
      width: 512,
      height: 384,
      token: "pk.test",
    });
    expect(url.startsWith(`https://api.mapbox.com/styles/v1/mapbox/${MAPBOX_MAP_STYLE}/static/`)).toBe(
      true,
    );
    expect(url).toContain("attribution=false");
    expect(url).toContain("logo=false");
    expect(url).toContain("access_token=pk.test");
  });

  // Mapbox merkezi BOYLAMLA başlatır; ters yazılsaydı adres yine geçerli
  // olurdu ve kart sessizce başka bir yerin haritasını çizerdi.
  it("merkez boylam,enlem sırasında ve yön/eğim sıfırlanmış", () => {
    const url = mapboxStaticMapUrl({
      lat: 41.01,
      lon: 28.98,
      zoom: LOCATION_ZOOM.far,
      width: LOCATION_FRAME.width,
      height: LOCATION_FRAME.height,
      token: "pk.test",
    });
    expect(url).toContain("/static/28.98,41.01,4,0,0/512x384@2x?");
  });

  // Şartlar atıf metinlerini BİREBİR yazıyor; çevrilirse yükümlülük
  // karşılanmaz. Bağlantı hedefleri de sağlayıcının verdiği adresler.
  it("atıf üç bağlantıyı ve şartlardaki metinleri taşır", () => {
    expect(MAP_ATTRIBUTION_LINKS.map((link) => link.label)).toEqual([
      "© Mapbox",
      "© OpenStreetMap",
      "Improve this map",
    ]);
    for (const link of MAP_ATTRIBUTION_LINKS) {
      expect(link.href.startsWith("https://")).toBe(true);
    }
  });
});

describe("konum bloğu şeması", () => {
  const base = { id: "blk_konum", type: "location" as const };

  it("boş blok geçerlidir (kullanıcı henüz aramadı)", () => {
    const parsed = profileBlockSchema.parse({ ...base, data: {} });
    expect(parsed.type === "location" && parsed.data.lat).toBeNull();
  });

  it("koordinatı ŞEMA SEVİYESİNDE yuvarlar — ev adresi çözünürlüğü kaydedilemez", () => {
    const parsed = profileBlockSchema.parse({
      ...base,
      data: { label: "Kadıköy", lat: 40.9876543, lon: 29.0234567, timeZone: "Europe/Istanbul" },
    });
    expect(parsed.type === "location" && parsed.data.lat).toBe(40.99);
    expect(parsed.type === "location" && parsed.data.lon).toBe(29.02);
  });

  it("aralık dışı koordinatı reddeder", () => {
    expect(
      profileBlockSchema.safeParse({ ...base, data: { lat: 120, lon: 0 } }).success,
    ).toBe(false);
  });

  it("bozuk saat dilimini reddeder ama boşu kabul eder", () => {
    expect(
      profileBlockSchema.safeParse({ ...base, data: { timeZone: "../etc" } }).success,
    ).toBe(false);
    expect(profileBlockSchema.safeParse({ ...base, data: { timeZone: "" } }).success).toBe(
      true,
    );
  });

  it("ülke kodunu iki büyük harfle sınırlar", () => {
    expect(
      profileBlockSchema.safeParse({ ...base, data: { countryCode: "tr" } }).success,
    ).toBe(false);
    expect(
      profileBlockSchema.safeParse({ ...base, data: { countryCode: "TR" } }).success,
    ).toBe(true);
  });
});
