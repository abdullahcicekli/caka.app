// wrangler secret ile tanımlanan değerler `wrangler types` çıktısına girmez;
// Env arayüzü burada bildirimsel birleştirmeyle genişletilir. wrangler 4.123
// `cloudflare:workers` env'ini `Cloudflare.Env` olarak tiplediği için hem
// global Env hem de Cloudflare.Env aynı sırlarla genişletilmek zorunda.
interface CakaSecretEnv {
  BETTER_AUTH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  APPLE_PRIVATE_KEY: string;
  /** `/api/gorsel` imzası (HMAC-SHA256). Yoksa proxy tamamen kapalıdır. */
  IMAGE_PROXY_SECRET: string;
  /**
   * Mapbox HERKESE AÇIK jetonu (`pk.*`) — konum kartının statik harita
   * karesi. Sır DEĞİLDİR: adres ziyaretçinin HTML'ine basılır ve tarayıcı
   * kareyi doğrudan api.mapbox.com'dan çeker (proxy'lemek sağlayıcının
   * şartlarınca yasak). Korumasını Mapbox panelindeki URL kısıtlaması
   * sağlar. Yoksa harita kareleri kapalıdır ve kart haritasız tasarımına
   * düşer.
   */
  MAPBOX_PUBLIC_TOKEN: string;
}

interface Env extends CakaSecretEnv {}

declare namespace Cloudflare {
  interface Env extends CakaSecretEnv {}
}
