import { describe, expect, it } from "vitest";

import {
  COOKIE_INVENTORY,
  COOKIE_STORAGE_KINDS,
  COOKIE_STORAGE_LABELS,
  cookieTableRows,
  type CookieEntry,
} from "./cookies";

const entries: readonly CookieEntry[] = COOKIE_INVENTORY;

describe("çerez envanteri", () => {
  it("her girdinin amacı doludur", () => {
    for (const entry of COOKIE_INVENTORY) {
      expect(entry.purpose.trim(), entry.name).not.toBe("");
    }
  });

  it("aynı ad iki kez geçmez", () => {
    const names = COOKIE_INVENTORY.map((entry) => entry.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("envanterde rıza gerektiren girdi yoktur", () => {
    // Tripwire: `zorunlu` dışı bir kategori eklendiği anda kırılır. O girdi
    // rıza akışı ister (KTD21, AGENTS.md) — bugün ürün böyle bir akış taşımıyor,
    // kategoriyi sessizce genişletmek politikayı yanlışlar.
    expect(entries.filter((entry) => entry.category !== "zorunlu")).toEqual([]);
  });

  it("envanterde üçüncü taraf girdi yoktur", () => {
    // Aynı gerekçe: bugün cihaza yazan tek taraf Caka. Üçüncü taraf bir girdi
    // eklendiğinde bu test kırılır ve sağlayıcı adı ile rıza kararı zorunlu olur.
    expect(entries.filter((entry) => entry.party === "üçüncü")).toEqual([]);
    for (const entry of entries) {
      expect(entry.provider, entry.name).toBe("Caka");
    }
  });

  it("her girdinin ömrü doludur", () => {
    for (const entry of COOKIE_INVENTORY) {
      expect(entry.lifetime.trim(), entry.name).not.toBe("");
    }
  });

  it("envanter AGENTS.md'nin saydığı her depolama türünü ifade edebilir", () => {
    // Katkıcı `localStorage` veya IndexedDB girdisi eklerken tip hatasına
    // çarpmamalı; aksi hâlde ucuz çıkış yolu girdiyi yanlış türle etiketlemek olur.
    expect([...COOKIE_STORAGE_KINDS]).toEqual([
      "cookie",
      "localStorage",
      "sessionStorage",
      "indexedDB",
    ]);
  });

  it("her depolama türünün Türkçe/teknik etiketi doludur ve tekildir", () => {
    const labels = COOKIE_STORAGE_KINDS.map((kind) => {
      const label = COOKIE_STORAGE_LABELS[kind];
      expect(label?.trim(), kind).not.toBe("");
      return label;
    });
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("kaydırma konumu girdisi sessionStorage olarak işaretlidir", () => {
    // AE9 / KTD31: `<ScrollRestoration />` cihaza yazan tek çerez dışı
    // girdidir; envanterden düşerse politika tablosu da sessizce yanlışlanır.
    const scroll = entries.find(
      (entry) => entry.name === "react-router-scroll-positions",
    );
    expect(scroll).toBeDefined();
    expect(scroll?.storage).toBe("sessionStorage");
    expect(scroll?.party).toBe("birinci");
  });

  it("sürüm uyuşmazlığı girdisi sessionStorage olarak işaretlidir", () => {
    // KTD21: derlenmiş istemci paketinde `sessionStorage.setItem` ile yazılan
    // ikinci anahtar. Envanterden düşerse `/cerez-politikasi` tablosu yayında
    // eksik kalır — sayfa bugün gerçekten yayında olduğu için sessiz kayma
    // değil, doğrudan yanlış beyan olurdu.
    const manifest = entries.find(
      (entry) => entry.name === "react-router-manifest-version",
    );
    expect(manifest).toBeDefined();
    expect(manifest?.storage).toBe("sessionStorage");
    expect(manifest?.party).toBe("birinci");
  });

  it("çerez dışı girdilerin tamamı sessionStorage'dır ve sayısı bilinir", () => {
    // Sayı, `/cerez-politikasi` ve `/gizlilik` metinlerindeki "iki
    // sessionStorage girdisi" ifadesine bağlı. Girdi eklenir de metin
    // güncellenmezse burada kırılsın.
    const dosSurumleri = entries.filter(
      (entry) => (entry.storage ?? "cookie") !== "cookie",
    );
    expect(dosSurumleri).toHaveLength(2);
    for (const entry of dosSurumleri) {
      expect(entry.storage, entry.name).toBe("sessionStorage");
    }
  });

  it("çerez dışı girdiler dışında her şey çerezdir", () => {
    const cookies = entries.filter(
      (entry) => (entry.storage ?? "cookie") === "cookie",
    );
    // session_token, state, caka_claim, caka_dil. Sayı bilinçli sabittir:
    // envantere sessizce çerez eklenmesin.
    expect(cookies).toHaveLength(4);
  });
});

describe("cookieTableRows", () => {
  it("satırlar envanterin adlarını ve sırasını korur", () => {
    expect(cookieTableRows().map((row) => row.name)).toEqual(
      COOKIE_INVENTORY.map((entry) => entry.name),
    );
  });

  it("hiçbir tablo hücresi boş kalmaz", () => {
    // Politika tablosunda boş hücre, okuyucuya "bilgi yok" der. Envantere
    // eksik alanla girdi eklendiğinde burada kırılır.
    for (const row of cookieTableRows()) {
      for (const [field, value] of Object.entries(row)) {
        expect(value.trim(), `${row.name}.${field}`).not.toBe("");
      }
    }
  });

  it("her depolama türü tabloda kendi etiketiyle görünür", () => {
    const rows = cookieTableRows(
      COOKIE_STORAGE_KINDS.map((kind) => ({
        name: `test_${kind}`,
        storage: kind,
        category: "zorunlu",
        purpose: "Test amaçlı",
        lifetime: "1 gün",
        party: "birinci",
        provider: "Caka",
      })),
    );
    expect(rows.map((row) => row.storage)).toEqual([
      "Çerez",
      "localStorage",
      "sessionStorage",
      "IndexedDB",
    ]);
  });

  it("kategori ve tarafı Türkçe etikete çevirir", () => {
    const rows = cookieTableRows([
      {
        name: "test_cookie",
        category: "zorunlu",
        purpose: "Test amaçlı",
        lifetime: "1 gün",
        party: "birinci",
        provider: "Caka",
      },
    ]);
    expect(rows).toEqual([
      {
        name: "test_cookie",
        storage: "Çerez",
        category: "Zorunlu",
        purpose: "Test amaçlı",
        lifetime: "1 gün",
        party: "Birinci taraf",
        provider: "Caka",
      },
    ]);
  });

  it("depolama türü yazılmayan girdiyi çerez sayar", () => {
    const [row] = cookieTableRows([
      {
        name: "test_cookie",
        category: "zorunlu",
        purpose: "Test amaçlı",
        lifetime: "1 gün",
        party: "birinci",
        provider: "Caka",
      },
    ]);
    expect(row?.storage).toBe("Çerez");
  });

  it("sessionStorage girdisini kendi etiketiyle gösterir", () => {
    const [row] = cookieTableRows([
      {
        name: "test_scroll",
        storage: "sessionStorage",
        category: "zorunlu",
        purpose: "Test amaçlı",
        lifetime: "Sekmeyi kapatınca silinir",
        party: "birinci",
        provider: "Caka",
      },
    ]);
    expect(row?.storage).toBe("sessionStorage");
    expect(row?.lifetime).toBe("Sekmeyi kapatınca silinir");
  });

  it("boş envanterde boş dizi döner", () => {
    expect(cookieTableRows([])).toEqual([]);
  });
});
