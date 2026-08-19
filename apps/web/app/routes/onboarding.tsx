import { useEffect, useRef, useState } from "react";
import { env } from "cloudflare:workers";
import { Form, Link, data, redirect, useSearchParams } from "react-router";

import { logoBlackText } from "~/assets/brand";
import { AppleIcon } from "~/components/icons/apple";
import { GoogleIcon } from "~/components/icons/google";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { signInWithSocial, type SocialProvider } from "~/lib/auth-client";
import { noIndexMeta } from "~/lib/seo";
import { USERNAME_ERROR_MESSAGES, validateUsername } from "@caka/shared";
import { getSession } from "../../server/auth";
import { claimUsername, getProfileByUserId } from "../../server/profile";
import type { Route } from "./+types/onboarding";
import { localizedRedirect } from "../../server/locale";
import { appCatalog } from "~/content/app";
import { useCatalog } from "~/lib/locale";

export const CLAIM_COOKIE = "caka_claim";

export function meta({}: Route.MetaArgs) {
  return noIndexMeta("Adresini al — Caka");
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(env, request);
  if (!session) return { authed: false };
  const existing = await getProfileByUserId(env, session.user.id);
  if (existing) {
    throw redirect(
      existing.onboardingCompletedAt ? "/edit" : "/onboarding/kurulum/profil",
    );
  }
  return { authed: true };
}

/** Oturumlu kullanıcı için doğrudan claim (Google adımı atlanır). */
export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(env, request);
  if (!session) throw localizedRedirect(request, "/onboarding");
  const form = await request.formData();
  let result;
  try {
    result = await claimUsername(env, session.user, String(form.get("u") ?? ""));
  } catch (err) {
    // Beklenmeyen hata sayfayı 500'e düşürmesin; satır içi Türkçe mesaj göster.
    console.error("claim failed:", err instanceof Error ? err.message : err);
    return data({ error: "hata" as const }, { status: 500 });
  }
  if (!result.ok) return data({ error: result.error }, { status: 409 });
  throw localizedRedirect(request, "/onboarding/kurulum/profil");
}

type Availability =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "available"; username: string }
  | { state: "unavailable"; message: string };

function useAvailability(value: string): Availability {
  const [availability, setAvailability] = useState<Availability>({ state: "idle" });
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    if (!value) {
      setAvailability({ state: "idle" });
      return;
    }
    const local = validateUsername(value);
    if (!local.ok) {
      setAvailability({
        state: "unavailable",
        message: USERNAME_ERROR_MESSAGES[local.error],
      });
      return;
    }
    setAvailability({ state: "checking" });
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/username-check?u=${encodeURIComponent(value)}`);
        const body = (await res.json()) as { available: boolean; username?: string };
        if (requestId.current !== id) return;
        setAvailability(
          body.available
            ? { state: "available", username: body.username ?? local.username }
            : { state: "unavailable", message: "Bu adres dolu" },
        );
      } catch {
        if (requestId.current === id) setAvailability({ state: "idle" });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [value]);

  return availability;
}

export default function Onboarding({ loaderData, actionData }: Route.ComponentProps) {
  const app = useCatalog(appCatalog);
  const [params] = useSearchParams();
  const [value, setValue] = useState(params.get("u") ?? "");
  const [confirming, setConfirming] = useState(false);
  const availability = useAvailability(value);

  const takenError =
    params.get("error") === "taken" || actionData?.error === "taken"
      ? app.setup.claimTaken
      : params.get("error") === "hata" || actionData?.error === "hata"
        ? app.setup.claimUnknownError
        : null;

  const ready = availability.state === "available";
  const hasError = availability.state === "unavailable" || takenError !== null;
  const username = ready ? availability.username : null;

  function startSocialSignup(provider: SocialProvider) {
    if (!username) return;
    // Adres, OAuth gidiş-dönüşü boyunca kısa ömürlü çerezde taşınır;
    // claim /onboarding/tamamla loader'ında yapılır.
    document.cookie = `${CLAIM_COOKIE}=${encodeURIComponent(username)}; Path=/; Max-Age=900; SameSite=Lax`;
    void signInWithSocial(provider);
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-white px-6">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <img src={logoBlackText} alt="Caka" className="h-9 w-auto" />
        <h1 className="mt-8 text-2xl font-bold">{app.setup.claimTitle}</h1>
        <p className="mt-2 text-murekkep/60">{app.setup.claimBody}</p>

        <form
          className="mt-8 w-full"
          onSubmit={(e) => {
            e.preventDefault();
            if (ready) setConfirming(true);
          }}
        >
          <div
            className={`flex items-center rounded-full border bg-zemin py-3 pr-2 pl-6 transition-colors ${
              ready
                ? "border-murekkep bg-white"
                : hasError
                  ? "border-destructive bg-white ring-2 ring-destructive/15"
                  : "border-transparent"
            }`}
          >
            <span className="text-murekkep/50">caka.app&thinsp;/&thinsp;</span>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={app.setup.handlePlaceholder}
              autoFocus
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={hasError || undefined}
              className={`min-w-0 flex-1 bg-transparent font-medium outline-none placeholder:text-murekkep/35 ${
                hasError ? "text-destructive" : ""
              }`}
            />
            <button
              type="submit"
              aria-label={app.setup.continueAria}
              disabled={!ready}
              className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-opacity ${
                ready ? "bg-murekkep text-white" : "opacity-0"
              }`}
            >
              →
            </button>
          </div>
        </form>

        <p className="mt-3 h-5 text-sm font-medium" aria-live="polite">
          {takenError ? (
            <span className="text-destructive">⚠ {takenError}</span>
          ) : availability.state === "available" ? (
            <span className="text-cam">{app.setup.claimAvailable}</span>
          ) : availability.state === "unavailable" ? (
            <span className="text-destructive">⚠ {availability.message}</span>
          ) : availability.state === "checking" ? (
            <span className="font-normal text-murekkep/40">{app.setup.checking}</span>
          ) : null}
        </p>

        <Link to="/login" className="mt-10 text-sm text-murekkep/60 hover:text-murekkep">
          {app.setup.haveAccountSignIn}
        </Link>
      </div>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="max-w-sm rounded-2xl text-center">
          <DialogHeader className="items-center">
            <DialogTitle className="text-xl font-bold">{app.setup.almostDone}</DialogTitle>
            <DialogDescription>
              {app.setup.claimingAddress(username ?? "")}
            </DialogDescription>
          </DialogHeader>
          {loaderData.authed ? (
            <Form method="post">
              <input type="hidden" name="u" value={username ?? ""} />
              <button
                type="submit"
                className="w-full rounded-full bg-murekkep py-3 font-medium text-white hover:bg-murekkep/85"
              >
                {app.setup.claimCta}
              </button>
            </Form>
          ) : (
            <div className="flex w-full flex-col gap-3">
              <button
                type="button"
                onClick={() => startSocialSignup("google")}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-sinir bg-white py-3 font-medium hover:bg-zemin"
              >
                <GoogleIcon />
                {app.setup.signUpGoogle}
              </button>
              <button
                type="button"
                onClick={() => startSocialSignup("apple")}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-murekkep py-3 font-medium text-white hover:bg-murekkep/85"
              >
                <AppleIcon />
                {app.setup.signUpApple}
              </button>
            </div>
          )}
          <p className="text-xs text-murekkep/50">
            {app.setup.termsNotice}
          </p>
        </DialogContent>
      </Dialog>
    </main>
  );
}
