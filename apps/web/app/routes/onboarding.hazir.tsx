import { env } from "cloudflare:workers";
import { Link, redirect } from "react-router";

import { ProfileAvatar } from "~/components/profile-avatar";
import { SignOutLink } from "~/components/sign-out-link";
import { parseSeedProfile } from "~/lib/profile-view";
import { getSession } from "../../server/auth";
import { getProfileByUserId } from "../../server/profile";
import type { Route } from "./+types/onboarding.hazir";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Sayfan hazır — Caka" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(env, request);
  if (!session) throw redirect("/onboarding");
  const profile = await getProfileByUserId(env, session.user.id);
  if (!profile) throw redirect("/onboarding");
  const seed = parseSeedProfile(profile.layout);
  return {
    username: profile.username,
    name: seed.name ?? session.user.name,
    avatarUrl: seed.avatarUrl,
  };
}

export default function OnboardingHazir({ loaderData }: Route.ComponentProps) {
  const { username, name, avatarUrl } = loaderData;
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-white px-6 text-center">
      <h1 className="text-4xl font-bold">Güzel görünüyor</h1>
      <p className="mt-3 max-w-sm text-murekkep/60">
        Sayfan iyi bir başlangıç yaptı. Düzenlemeye devam ederek daha da
        iyileştirebilirsin.
      </p>

      <div className="mt-10 w-64 rounded-[2rem] bg-zemin p-6 shadow-sm">
        <ProfileAvatar
          name={name}
          avatarUrl={avatarUrl}
          className="mx-auto size-16 text-xl"
        />
        <p className="mt-4 font-bold">{name}</p>
        <p className="mt-1 truncate text-sm text-murekkep/50">caka.app/{username}</p>
        <div className="mt-5 space-y-2">
          <div className="h-9 rounded-full bg-white" />
          <div className="h-9 rounded-full bg-white" />
        </div>
      </div>

      <Link
        to={`/${username}`}
        className="mt-10 w-full max-w-sm rounded-full bg-murekkep py-3.5 font-medium text-white hover:bg-murekkep/85"
      >
        Sayfana git
      </Link>
      <p className="mt-4 text-sm text-murekkep/50">
        Grid editörü çok yakında — sayfan şimdiden yayında.
      </p>
      <SignOutLink className="mt-8" />
    </main>
  );
}
