// wrangler secret ile tanımlanan değerler `wrangler types` çıktısına girmez;
// Env arayüzü burada bildirimsel birleştirmeyle genişletilir. wrangler 4.123
// `cloudflare:workers` env'ini `Cloudflare.Env` olarak tiplediği için hem
// global Env hem de Cloudflare.Env aynı sırlarla genişletilmek zorunda.
interface CakaSecretEnv {
  BETTER_AUTH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  APPLE_PRIVATE_KEY: string;
}

interface Env extends CakaSecretEnv {}

declare namespace Cloudflare {
  interface Env extends CakaSecretEnv {}
}
