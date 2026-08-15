// wrangler secret ile tanımlanan değerler `wrangler types` çıktısına girmez;
// Env arayüzü burada bildirimsel birleştirmeyle genişletilir.
interface Env {
  BETTER_AUTH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  APPLE_PRIVATE_KEY: string;
}
