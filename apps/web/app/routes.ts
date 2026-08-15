import { type RouteConfig, index, route } from "@react-router/dev/routes";

// Uygulama route'ları her zaman `:username` catch-all'undan ÖNCE gelir;
// rezerve isim listesi (@caka/shared) bu route adlarını içerir (KTD9).
export default [
  index("routes/home.tsx"),
  route("onboarding", "routes/onboarding.tsx"),
  route("onboarding/tamamla", "routes/onboarding.tamamla.tsx"),
  route("onboarding/hazir", "routes/onboarding.hazir.tsx"),
  route("login", "routes/login.tsx"),
  route(":username", "routes/username.tsx"),
] satisfies RouteConfig;
