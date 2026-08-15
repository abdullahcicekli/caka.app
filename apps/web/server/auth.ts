import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { createDb, schema } from "@caka/db";

function buildAuth(env: Env) {
  const db = createDb(env.DB);
  return betterAuth({
    // Prod'da kanonik domain (caka.app); lokalde boş bırakılır ve origin
    // istekten türetilir (5173/5174 — ikisi de Google'da kayıtlı).
    baseURL: env.BETTER_AUTH_URL || undefined,
    trustedOrigins: [
      "https://caka.app",
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "sqlite", schema }),
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    // KTD4: kimlik Google `sub`'a bağlıdır; e-posta üzerinden otomatik hesap
    // birleştirme kapalıdır (e-posta geri dönüşümüyle hesap devri sınıfı).
    account: { accountLinking: { enabled: false } },
    advanced: {
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
    },
  });
}

export type Auth = ReturnType<typeof buildAuth>;

// Aynı izolatta istek başına yeniden kurulumdan kaçınmak için memoize edilir.
let cached: { env: Env; auth: Auth } | undefined;

export function getAuth(env: Env): Auth {
  if (cached?.env !== env) cached = { env, auth: buildAuth(env) };
  return cached.auth;
}

/** RR loader'ları ve Hono route'ları için oturum okuma yardımcısı. */
export async function getSession(env: Env, request: Request) {
  return getAuth(env).api.getSession({ headers: request.headers });
}
