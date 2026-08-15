import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { importPKCS8, SignJWT } from "jose";

import { createDb, schema } from "@caka/db";

/** Apple, shared secret yerine ES256 JWT ister; azami ömür 6 ay. */
async function generateAppleClientSecret(
  clientId: string,
  teamId: string,
  keyId: string,
  privateKeyPem: string,
) {
  const pem = privateKeyPem.replaceAll("\\n", "\n").replaceAll("\r\n", "\n").trim();
  const key = await importPKCS8(pem, "ES256");
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setSubject(clientId)
    .setAudience("https://appleid.apple.com")
    .setIssuedAt(now)
    .setExpirationTime(now + 180 * 24 * 60 * 60)
    .sign(key);
}

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
      // Apple callback'i form_post ile appleid.apple.com'dan gelir.
      "https://appleid.apple.com",
    ],
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "sqlite", schema }),
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
      apple: async () => ({
        clientId: env.APPLE_CLIENT_ID,
        clientSecret: await generateAppleClientSecret(
          env.APPLE_CLIENT_ID,
          env.APPLE_TEAM_ID,
          env.APPLE_KEY_ID,
          env.APPLE_PRIVATE_KEY,
        ),
        mapProfileToUser(profile) {
          const name = (profile.name ?? "").trim();
          return {
            name: name || profile.email?.split("@")[0] || "Caka",
          };
        },
      }),
    },
    // KTD4: kimlik provider `sub`'a bağlıdır; e-posta üzerinden otomatik hesap
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
