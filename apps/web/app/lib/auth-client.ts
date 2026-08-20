import { createAuthClient } from "better-auth/react";

/** Tarayıcı tarafı auth istemcisi; baseURL mevcut origin'dir. */
export const authClient = createAuthClient();

export type SocialProvider = "google" | "apple";

/**
 * Sağlayıcı ekranında bir şey ters giderse (kullanıcı "İptal" dedi, izin
 * reddedildi, sağlayıcı hata döndürdü) better-auth ziyaretçiyi buraya
 * getirir. `errorCallbackURL` verilmediğinde varsayılan davranış sessiz bir
 * dönüştü: kullanıcı giriş sayfasına düşüyor ve hiçbir şey olmamış gibi aynı
 * ekranı görüyordu — bir daha denemesi mi gerektiğini, yoksa girişin başarısız
 * mı olduğunu anlamıyordu.
 *
 * Dönüş adresi HER ZAMAN /login: iptal onboarding'den başlamış olsa bile
 * kullanıcı orada bir adres yazmıştı ve o adres artık URL'de yok; giriş
 * sayfası ona doğru başlangıcı verir.
 */
export const AUTH_ERROR_PARAM = "hata";

export function signInWithSocial(
  provider: SocialProvider,
  callbackURL = "/onboarding/tamamla",
) {
  return authClient.signIn.social({
    provider,
    callbackURL,
    errorCallbackURL: `/login?${AUTH_ERROR_PARAM}=1`,
  });
}
