import { defineConfig } from "vitest/config";

/**
 * Ayrı bir Vitest yapılandırması var, çünkü `vite.config.ts` Cloudflare
 * eklentisini yüklüyor: Vitest onu okusaydı her test çalıştırmasında bir
 * workerd örneği ayağa kalkardı. Buradaki testler saf Node testleridir
 * (bugün: `tests/quran-font.test.ts` — depodaki hat dosyasını okur).
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
