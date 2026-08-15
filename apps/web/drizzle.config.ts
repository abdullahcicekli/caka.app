import { defineConfig } from "drizzle-kit";

// Migration'lar wrangler'ın D1 akışıyla uygulanır (KTD3):
//   pnpm --filter @caka/web exec drizzle-kit generate
//   pnpm --filter @caka/web exec wrangler d1 migrations apply caka-db --local | --remote
export default defineConfig({
  dialect: "sqlite",
  schema: "../../packages/db/src/schema.ts",
  out: "../../packages/db/migrations",
});
