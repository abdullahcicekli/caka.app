import { describe, expect, it } from "vitest";

import { localeRedirect } from "../server/locale";

/**
 * Dil kapısı (L7) ile React Router'ın tek-getirme (single fetch) hattının
 * kesiştiği yer. Kapı bir `<yol>.data` isteğini 302'lerse istemci içi gezinme
 * hataya düşer ve kullanıcı "Bir şeyler ters gitti" ekranını görür — canlıda
 * onboarding'in her adımında yaşandı. O yüzden davranış sınanır.
 */
const CHROME_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

function get(path: string, acceptLanguage = "en-US,en;q=0.9") {
  return new Request(`https://caka.app${path}`, {
    headers: { "accept-language": acceptLanguage, "user-agent": CHROME_UA },
  });
}

describe("localeRedirect", () => {
  it("öneksiz bir belge isteğini ziyaretçinin diline yollar", () => {
    const response = localeRedirect(get("/onboarding/kurulum/amac"));
    expect(response?.status).toBe(302);
    expect(response?.headers.get("location")).toBe("/en/onboarding/setup/amac");
  });

  it("tek-getirme veri isteğine DOKUNMAZ", () => {
    expect(localeRedirect(get("/onboarding/kurulum/amac.data"))).toBeNull();
    expect(localeRedirect(get("/gizlilik.data"))).toBeNull();
  });

  it("Türkçe ziyaretçiyi yerinde bırakır", () => {
    expect(localeRedirect(get("/onboarding/kurulum/amac", "tr-TR,tr;q=0.9"))).toBeNull();
  });

  it("POST'u yönlendirmez", () => {
    const request = new Request("https://caka.app/onboarding/kurulum/amac", {
      method: "POST",
      headers: { "accept-language": "en-US,en;q=0.9", "user-agent": CHROME_UA },
    });
    expect(localeRedirect(request)).toBeNull();
  });
});
