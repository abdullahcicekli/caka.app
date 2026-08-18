import { describe, expect, it } from "vitest";

import {
  checkProxyImageUrl,
  isBlockedProxyHostname,
  normalizeImageContentType,
  remoteImageProxyPath,
} from "./remote-image";

describe("checkProxyImageUrl — kabul edilen adresler", () => {
  it("public http(s) adreslerine izin verir", () => {
    expect(checkProxyImageUrl("https://cdn.example.com/a.png").ok).toBe(true);
    expect(checkProxyImageUrl("http://example.com/a.jpg").ok).toBe(true);
    expect(checkProxyImageUrl("https://example.com:443/a.jpg").ok).toBe(true);
    expect(checkProxyImageUrl("http://example.com:80/a.jpg").ok).toBe(true);
    // Public IP literali engellenmez.
    expect(checkProxyImageUrl("https://8.8.8.8/a.png").ok).toBe(true);
    expect(checkProxyImageUrl("https://[2606:4700::1111]/a.png").ok).toBe(true);
  });

  it("adresi kanonik hâliyle döner", () => {
    const result = checkProxyImageUrl("  https://Example.com/a.png?x=1  ");
    expect(result).toEqual({ ok: true, url: "https://example.com/a.png?x=1" });
  });
});

describe("checkProxyImageUrl — SSRF savunması", () => {
  const blocked: [string, string][] = [
    ["boş", ""],
    ["şema", "ftp://example.com/a.png"],
    ["şema", "file:///etc/passwd"],
    ["şema", "data:image/png;base64,AAAA"],
    ["şema", "gopher://example.com/"],
    ["geçersiz", "not a url"],
    ["kimlik bilgisi", "https://user:pass@example.com/a.png"],
    ["oda dışı port", "http://example.com:8080/a.png"],
    ["oda dışı port", "http://example.com:6379/a.png"],
    ["loopback adı", "http://localhost/a.png"],
    ["loopback adı", "http://sub.localhost/a.png"],
    ["loopback IPv4", "http://127.0.0.1/a.png"],
    ["loopback IPv4 alt aralık", "http://127.99.12.3/a.png"],
    ["IPv4 ondalık gösterim", "http://2130706433/a.png"],
    ["IPv4 onaltılık gösterim", "http://0x7f000001/a.png"],
    ["IPv4 sekizlik gösterim", "http://0177.0.0.1/a.png"],
    ["0.0.0.0", "http://0.0.0.0/a.png"],
    ["RFC1918 10/8", "http://10.0.0.5/a.png"],
    ["RFC1918 172.16/12", "http://172.20.1.1/a.png"],
    ["RFC1918 192.168/16", "http://192.168.1.1/a.png"],
    ["CGNAT 100.64/10", "http://100.100.0.1/a.png"],
    ["bağlantı-yerel", "http://169.254.1.1/a.png"],
    ["bulut metadata IP", "http://169.254.169.254/latest/meta-data/"],
    ["GCP metadata adı", "http://metadata.google.internal/computeMetadata/v1/"],
    ["metadata kısa ad", "http://metadata/"],
    ["EC2 instance-data", "http://instance-data/latest/"],
    ["multicast", "http://224.0.0.1/a.png"],
    ["ayrılmış 240/4", "http://250.1.2.3/a.png"],
    ["broadcast", "http://255.255.255.255/a.png"],
    ["belgeleme aralığı", "http://192.0.2.10/a.png"],
    ["IPv6 loopback", "http://[::1]/a.png"],
    ["IPv6 belirsiz", "http://[::]/a.png"],
    ["IPv6 ULA fc00::/7", "http://[fd00::1]/a.png"],
    ["IPv6 bağlantı-yerel", "http://[fe80::1]/a.png"],
    ["IPv6 multicast", "http://[ff02::1]/a.png"],
    ["IPv4 eşlemeli IPv6", "http://[::ffff:127.0.0.1]/a.png"],
    // ::/96 "IPv4-uyumlu" biçim (RFC 4291 m.2.5.5.1'de terk edilmiş):
    // ::ffff: öneki olmadığı için eşlemeli dalına düşmez, ayrıca kapatıldı.
    ["IPv4-uyumlu IPv6 loopback", "http://[::127.0.0.1]/a.png"],
    ["IPv4-uyumlu IPv6 metadata", "http://[::169.254.169.254]/a.png"],
    ["IPv4-uyumlu IPv6 public görünümlü", "http://[::8.8.8.8]/a.png"],
    ["IPv4 eşlemeli IPv6 (RFC1918)", "http://[::ffff:10.0.0.1]/a.png"],
    ["6to4 gömülü özel IPv4", "http://[2002:a00:1::1]/a.png"],
    ["NAT64", "http://[64:ff9b::808:808]/a.png"],
    ["tek etiketli intranet adı", "http://wiki/a.png"],
    [".internal soneki", "http://db.internal/a.png"],
    [".local soneki", "http://printer.local/a.png"],
    [".home.arpa soneki", "http://router.home.arpa/a.png"],
    [".onion soneki", "http://abc.onion/a.png"],
    ["sondaki noktalı loopback", "http://localhost./a.png"],
  ];

  for (const [label, url] of blocked) {
    it(`reddeder: ${label} — ${url}`, () => {
      expect(checkProxyImageUrl(url).ok).toBe(false);
    });
  }

  it("çok uzun adresi reddeder", () => {
    expect(checkProxyImageUrl(`https://example.com/${"a".repeat(2100)}`).ok).toBe(false);
  });

  it("yönlendirme hedefi de aynı kuraldan geçer", () => {
    // Proxy her hop'ta bu fonksiyonu yeniden çağırır; temiz bir ilk adresten
    // metadata uç noktasına sapma böyle kesilir.
    expect(checkProxyImageUrl("https://cdn.example.com/a.png").ok).toBe(true);
    expect(checkProxyImageUrl("http://169.254.169.254/latest/").ok).toBe(false);
  });
});

describe("isBlockedProxyHostname", () => {
  it("public host'ları geçirir", () => {
    expect(isBlockedProxyHostname("cdn.example.com")).toBe(false);
    expect(isBlockedProxyHostname("1.1.1.1")).toBe(false);
  });

  it("büyük harf ve köşeli parantezleri normalize eder", () => {
    expect(isBlockedProxyHostname("LOCALHOST")).toBe(true);
    expect(isBlockedProxyHostname("[::1]")).toBe(true);
  });
});

describe("normalizeImageContentType", () => {
  it("allowlist'teki tipleri parametrelerinden ayırarak kabul eder", () => {
    expect(normalizeImageContentType("image/png")).toBe("image/png");
    expect(normalizeImageContentType("IMAGE/JPEG; charset=binary")).toBe("image/jpeg");
    expect(normalizeImageContentType("image/webp")).toBe("image/webp");
  });

  it("SVG'yi ve görsel olmayan tipleri reddeder", () => {
    // SVG script/dış kaynak taşıyabilir; proxy'den asla geçmez.
    expect(normalizeImageContentType("image/svg+xml")).toBeNull();
    expect(normalizeImageContentType("text/html")).toBeNull();
    expect(normalizeImageContentType(null)).toBeNull();
  });
});

describe("remoteImageProxyPath", () => {
  it("birinci taraf adres üretir ve URL'yi kodlar", () => {
    expect(remoteImageProxyPath("https://example.com/a.png?x=1&y=2")).toBe(
      "/api/gorsel?u=https%3A%2F%2Fexample.com%2Fa.png%3Fx%3D1%26y%3D2",
    );
  });
});
