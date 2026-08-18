// L2: Bir isteğin hangi dille karşılanacağının sunucu tarafı okuması.
//
// Zincirin kendisi `@caka/shared/locale`'da saf duruyor; burada yalnız istekten
// sinyal toplanır. Route dosyalarına iş mantığı yazılmaz (AGENTS.md).

import { isbot } from "isbot";
import { redirect } from "react-router";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  type Locale,
  isSupportedLocale,
  localeCookieString,
  localizeHref,
  parseLocalizedPath,
  pathFor,
  resolveLocale,
} from "@caka/shared";

/**
 * Çerez başlığından dil değerini okur.
 *
 * `Cookie` başlığı elle ayrıştırılır: Worker'da hazır bir ayrıştırıcı yok ve
 * tek bir anahtar için kütüphane getirmek gereksiz.
 */
export function readLocaleCookie(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;

  for (const part of header.split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === LOCALE_COOKIE_NAME) return decodeURIComponent(value.join("="));
  }
  return null;
}

/** Dil seçimini kalıcılaştıran `Set-Cookie` değeri. */
export function localeCookieHeader(locale: Locale): string {
  return localeCookieString(locale);
}

/**
 * İsteğin dili: URL öneki → çerez → `Accept-Language` → Türkçe.
 *
 * Öneksiz bir uygulama route'u (`/gizlilik`) Türkçe sayfanın kendisidir, bu
 * yüzden yol çözülebiliyorsa çerez ve başlık okunmaz — Türkçe adresteyken
 * Almanca metin görmek tutarsız olurdu. Yol bir uygulama route'u değilse
 * (profil sayfaları — L9) zincir çereze ve başlığa iner.
 */
export function localeFromRequest(request: Request): Locale {
  const { pathname } = new URL(request.url);
  const parsed = parseLocalizedPath(pathname);

  return resolveLocale({
    pathLocale: parsed?.locale ?? null,
    cookie: readLocaleCookie(request),
    acceptLanguage: request.headers.get("accept-language"),
  });
}

/**
 * L7/L8 — öneksiz bir uygulama adresine gelen ziyaretçiyi kendi diline
 * yollayan kapı. Yönlendirilmeyecekse `null` döner.
 *
 * Dört koşulun hepsi tutmalı:
 *
 *  1. **GET/HEAD.** Bir POST'u 302'lemek gövdeyi düşürür; form action'ları
 *     kendi adresine gönderiyor.
 *  2. **Öneksiz bir uygulama route'u.** Profil sayfaları (`/:username`)
 *     dilden bağımsızdır (L9) ve zaten önekli adresler doğru dildedir.
 *  3. **İstemci bot değil.** Google siteyi ABD'den `en-US` ile tarar; bot
 *     yönlendirilirse kanonik Türkçe sayfalar indeksten düşer (LKD3). Bu
 *     koşul kaldırılırsa SEO sessizce çöker.
 *  4. **Çözülen dil Türkçe değil.** Türkçe zaten bu adresin dili.
 *
 * 301 KULLANILMAZ: tarayıcı süresiz cache'ler ve kullanıcı bir daha Türkçe
 * adrese dönemez (Değişmez #10'un gerekçesi). Yanıt `no-store` taşır ki
 * yönlendirme kararı ziyaretçinin sinyalleri değişince yeniden verilebilsin.
 */
export function localeRedirect(request: Request): Response | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;

  const url = new URL(request.url);
  const parsed = parseLocalizedPath(url.pathname);
  if (!parsed || parsed.locale !== DEFAULT_LOCALE) return null;

  if (isbot(request.headers.get("user-agent") ?? "")) return null;

  const cookie = readLocaleCookie(request);
  const target = resolveLocale({
    cookie,
    acceptLanguage: request.headers.get("accept-language"),
  });
  if (target === DEFAULT_LOCALE) return null;

  const location = pathFor(parsed.key, target, parsed.params) + url.search;
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      // Yanıt hem başlığa hem çereze göre değişiyor; ara katmanlar tek bir
      // sürümü herkese servis etmemeli.
      Vary: "Accept-Language, Cookie",
      "Cache-Control": "no-store",
    },
  });
}

/** Çerez değeri desteklenen bir dilse onu döner. */
export function localeFromCookieValue(value: string | null): Locale | null {
  return value && isSupportedLocale(value) ? value : null;
}

/**
 * İsteğin diline göre yönlendirir.
 *
 * Loader'lardaki `redirect("/login")` çağrılarının yerini alır: Almanca
 * gezinen bir kullanıcı oturumu düşünce Türkçe `/login`e atılmamalı. Yol
 * Türkçe hâliyle yazılır, çeviri burada yapılır (`localizeHref`).
 */
export function localizedRedirect(
  request: Request,
  path: string,
  init?: number | ResponseInit,
): Response {
  return redirect(localizeHref(path, localeFromRequest(request)), init);
}
