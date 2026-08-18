import { env } from "cloudflare:workers";
import { Link, redirect } from "react-router";

import { logoBlackText } from "~/assets/brand";
import creatorSelin from "~/assets/landing/creator-selin.webp";
import { AppleIcon } from "~/components/icons/apple";
import { GoogleIcon } from "~/components/icons/google";
import { signInWithSocial } from "~/lib/auth-client";
import { noIndexMeta } from "~/lib/seo";
import { getSession } from "../../server/auth";
import { getProfileByUserId } from "../../server/profile";
import type { Route } from "./+types/login";
import { DEFAULT_LOCALE } from "@caka/shared";
import { appCatalog } from "~/content/app";
import { useCatalog } from "~/lib/locale";

export function meta({}: Route.MetaArgs) {
  return noIndexMeta(appCatalog[DEFAULT_LOCALE].titles.login);
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(env, request);
  if (!session) return null;
  const profile = await getProfileByUserId(env, session.user.id);
  // Oturum var ama profil yoksa yönlendirme yapma: /onboarding'den gelen
  // app.auth.loginCta tıklaması sessiz bir döngüye girmesin, kullanıcı isterse
  // farklı hesapla giriş yapabilsin.
  if (!profile) return null;
  throw redirect(
    profile.onboardingCompletedAt ? "/edit" : "/onboarding/kurulum/profil",
  );
}

export default function Login() {
  const app = useCatalog(appCatalog);
  return (
    <main className="grid min-h-svh bg-white lg:grid-cols-2">
      <div className="relative flex flex-col px-6 py-6 sm:px-10">
        <Link to="/" aria-label={app.auth.homeAria}>
          <img src={logoBlackText} alt="Caka" className="h-7 w-auto" />
        </Link>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center text-center">
          <h1 className="text-3xl font-bold">{app.auth.loginTitle}</h1>
          <p className="mt-2 text-murekkep/60">{app.auth.loginBody}</p>

          <button
            type="button"
            onClick={() => void signInWithSocial("google")}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-full border border-sinir bg-white py-3 font-medium hover:bg-zemin"
          >
            <GoogleIcon />
            {app.auth.signInGoogle}
          </button>
          <button
            type="button"
            onClick={() => void signInWithSocial("apple")}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-murekkep py-3 font-medium text-white hover:bg-murekkep/85"
          >
            <AppleIcon />
            {app.auth.signInApple}
          </button>

          <p className="mt-8 text-sm text-murekkep/60">
            {app.auth.noAccount}{" "}
            <Link to="/onboarding" className="font-medium text-murekkep hover:underline">
              {app.auth.claimAddress}
            </Link>
          </p>
        </div>
      </div>

      {/* Sağ panel: lime zemin üzerinde örnek profil kartı (tasarım 05) */}
      <aside className="relative hidden items-center justify-center overflow-hidden bg-kirec lg:flex">
        <div className="w-72 rounded-[2rem] bg-zemin p-5 shadow-xl">
          <img
            src={creatorSelin}
            alt=""
            className="mx-auto size-20 rounded-full object-cover object-top"
          />
          <p className="mt-4 text-center font-bold">Selin Aydemir</p>
          <p className="mt-0.5 text-center text-sm text-murekkep/50">
            {app.auth.demoRole}
          </p>
          <div className="mx-auto mt-3 w-fit rounded-full bg-murekkep px-3 py-1 text-xs font-medium text-white">
            caka.app/selin
          </div>
          <div className="mt-5 space-y-2">
            <div className="rounded-xl bg-murekkep px-4 py-3 text-sm font-medium text-white">
              {app.auth.demoLinkCalendar}
            </div>
            <div className="rounded-xl bg-white px-4 py-3 text-sm font-medium">
              Instagram
            </div>
            <div className="rounded-xl bg-white px-4 py-3 text-sm font-medium">
              {app.auth.demoLinkContact}
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}