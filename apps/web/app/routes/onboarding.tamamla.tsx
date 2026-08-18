import { env } from "cloudflare:workers";
import { redirect } from "react-router";

import { noIndexMeta } from "~/lib/seo";
import { getSession } from "../../server/auth";
import {
  claimUsername,
  ensureProfileAvatar,
  getProfileByUserId,
} from "../../server/profile";
import type { Route } from "./+types/onboarding.tamamla";
import { localizedRedirect } from "../../server/locale";
import { DEFAULT_LOCALE } from "@caka/shared";
import { appCatalog } from "~/content/app";
import { useCatalog } from "~/lib/locale";

const CLAIM_COOKIE = "caka_claim";
const CLEAR_CLAIM_COOKIE = `${CLAIM_COOKIE}=; Path=/; Max-Age=0`;

export function meta({}: Route.MetaArgs) {
  return noIndexMeta(appCatalog[DEFAULT_LOCALE].titles.onboardingFinish);
}

function readClaimCookie(request: Request): string | null {
  const header = request.headers.get("Cookie") ?? "";
  const match = header.match(new RegExp(`(?:^|;\\s*)${CLAIM_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * OAuth dönüşü: çerezdeki adresi claim eder (R2/R3). Görünür bir ekranı yok;
 * her koşulda uygun sayfaya yönlendirir.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(env, request);
  if (!session) throw localizedRedirect(request, "/onboarding");

  const existing = await getProfileByUserId(env, session.user.id);
  if (existing) {
    // Girişten dönen mevcut kullanıcı — avatarsız kalmışsa onar, sayfasına git.
    await ensureProfileAvatar(env, session.user, existing);
    throw redirect(existing.onboardingCompletedAt ? "/edit" : "/onboarding/kurulum/profil", {
      headers: { "Set-Cookie": CLEAR_CLAIM_COOKIE },
    });
  }

  const desired = readClaimCookie(request);
  if (!desired) throw localizedRedirect(request, "/onboarding");

  let result;
  try {
    result = await claimUsername(env, session.user, desired);
  } catch (err) {
    // Beklenmeyen hata (ör. DB): çerezi temizleyip Türkçe mesajla geri dön;
    // aksi halde her yenilemede aynı 500 tekrar eder. PII loglanmaz.
    console.error("claim failed:", err instanceof Error ? err.message : err);
    throw redirect(`/onboarding?error=hata&u=${encodeURIComponent(desired)}`, {
      headers: { "Set-Cookie": CLEAR_CLAIM_COOKIE },
    });
  }
  if (!result.ok) {
    throw redirect(`/onboarding?error=taken&u=${encodeURIComponent(desired)}`, {
      headers: { "Set-Cookie": CLEAR_CLAIM_COOKIE },
    });
  }
  throw localizedRedirect(request, "/onboarding/kurulum/profil", {
    headers: { "Set-Cookie": CLEAR_CLAIM_COOKIE },
  });
}
