import { useEffect, useRef, useState } from "react";
import { env } from "cloudflare:workers";
import { Form, Link, data, redirect, useSearchParams } from "react-router";

import { logoBlackText } from "~/assets/brand";
import { GoogleIcon } from "~/components/icons/google";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { authClient } from "~/lib/auth-client";
import { USERNAME_ERROR_MESSAGES, validateUsername } from "@caka/shared";
import { getSession } from "../../server/auth";
import { claimUsername, getProfileByUserId } from "../../server/profile";
import type { Route } from "./+types/onboarding";

export const CLAIM_COOKIE = "caka_claim";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Adresini al — Caka" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(env, request);
  if (!session) return { authed: false };
  const existing = await getProfileByUserId(env, session.user.id);
  if (existing) throw redirect(`/${existing.username}`);
  return { authed: true };
}

/** Oturumlu kullanıcı için doğrudan claim (Google adımı atlanır). */
export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(env, request);
  if (!session) throw redirect("/onboarding");
  const form = await request.formData();
  const result = await claimUsername(env, session.user, String(form.get("u") ?? ""));
  if (!result.ok) return data({ error: result.error }, { status: 409 });
  throw redirect("/onboarding/hazir");
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
  const [params] = useSearchParams();
  const [value, setValue] = useState(params.get("u") ?? "");
  const [confirming, setConfirming] = useState(false);
  const availability = useAvailability(value);

  const takenError =
    params.get("error") === "taken" || actionData?.error === "taken"
      ? "Bu adres az önce alındı, başka bir tane dene"
      : null;

  const ready = availability.state === "available";
  const username = ready ? availability.username : null;

  function startGoogleSignup() {
    if (!username) return;
    // Adres, OAuth gidiş-dönüşü boyunca kısa ömürlü çerezde taşınır;
    // claim /onboarding/tamamla loader'ında yapılır.
    document.cookie = `${CLAIM_COOKIE}=${encodeURIComponent(username)}; Path=/; Max-Age=900; SameSite=Lax`;
    void authClient.signIn.social({
      provider: "google",
      callbackURL: "/onboarding/tamamla",
    });
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-white px-6">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <img src={logoBlackText} alt="Caka" className="h-9 w-auto" />
        <h1 className="mt-8 text-2xl font-bold">Hoş geldin</h1>
        <p className="mt-2 text-murekkep/60">Sayfan hangi adreste yayınlansın?</p>

        <form
          className="mt-8 w-full"
          onSubmit={(e) => {
            e.preventDefault();
            if (ready) setConfirming(true);
          }}
        >
          <div
            className={`flex items-center rounded-full border bg-zemin py-3 pr-2 pl-6 transition-colors ${
              ready ? "border-murekkep bg-white" : "border-transparent"
            }`}
          >
            <span className="text-murekkep/50">caka.app&thinsp;/&thinsp;</span>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="sen"
              autoFocus
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent font-medium outline-none placeholder:text-murekkep/35"
            />
            <button
              type="submit"
              aria-label="Devam et"
              disabled={!ready}
              className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-opacity ${
                ready ? "bg-murekkep text-white" : "opacity-0"
              }`}
            >
              →
            </button>
          </div>
        </form>

        <p className="mt-3 h-5 text-sm" aria-live="polite">
          {takenError ? (
            <span className="text-red-600">{takenError}</span>
          ) : availability.state === "available" ? (
            <span className="text-cam">✓ bu adres boşta</span>
          ) : availability.state === "unavailable" ? (
            <span className="text-murekkep/60">{availability.message}</span>
          ) : availability.state === "checking" ? (
            <span className="text-murekkep/40">kontrol ediliyor…</span>
          ) : null}
        </p>

        <Link to="/login" className="mt-10 text-sm text-murekkep/60 hover:text-murekkep">
          Hesabın varsa giriş yap
        </Link>
      </div>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="max-w-sm rounded-2xl text-center">
          <DialogHeader className="items-center">
            <DialogTitle className="text-xl font-bold">Neredeyse tamam</DialogTitle>
            <DialogDescription>
              caka.app/{username} adresini alıyorsun.
            </DialogDescription>
          </DialogHeader>
          {loaderData.authed ? (
            <Form method="post">
              <input type="hidden" name="u" value={username ?? ""} />
              <button
                type="submit"
                className="w-full rounded-full bg-murekkep py-3 font-medium text-white hover:bg-murekkep/85"
              >
                Adresi al
              </button>
            </Form>
          ) : (
            <button
              type="button"
              onClick={startGoogleSignup}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-sinir bg-white py-3 font-medium hover:bg-zemin"
            >
              <GoogleIcon />
              Google ile kaydol
            </button>
          )}
          <p className="text-xs text-murekkep/50">
            Kaydolarak kullanım şartlarını ve gizlilik politikasını kabul edersin.
          </p>
        </DialogContent>
      </Dialog>
    </main>
  );
}
