import { env } from "cloudflare:workers";
import { Link, redirect } from "react-router";

import { logoBlackText } from "~/assets/brand";
import telefonMockup from "~/assets/landing/vitrin/telefon-busra.webp";
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

      {/* Sağ panel: kireç zemin üzerinde GERÇEK bir Caka sayfası.
          Burada eskiden elle yazılmış sahte bir kart duruyordu (avatar +
          üç uydurma bağlantı satırı). Ürünü yanlış tanıtıyordu ve kart
          tasarımı her değiştiğinde sessizce bayatlıyordu. Yerine
          laboratuvardan çekilmiş mockup kondu: telefonun içi
          `ProfileCanvas`'ın kendisi (bkz. `scripts/lab-telefon.mjs`).

          MOCKUP, CANLI RENDER DEĞİL: `ProfileCanvas`'ı buraya koymak tüm
          blok bileşenlerini ve laboratuvar görsellerini dönüşüm yolunun
          üstündeki bir sayfanın paketine sokardı. Görsel saydam (alfa) —
          arkasındaki kireç panelin rengi telefonun köşelerinden geçiyor.

          `lazy`: panel yalnız lg'de görünür ve LCP değil; giriş
          düğmelerinin önüne geçmemeli. */}
      <aside className="relative hidden items-center justify-center overflow-hidden bg-kirec lg:flex">
        <img
          src={telefonMockup}
          alt={app.auth.demoAlt}
          width={640}
          height={1176}
          loading="lazy"
          decoding="async"
          className="h-[88%] w-auto max-w-[70%] object-contain"
        />
      </aside>
    </main>
  );
}