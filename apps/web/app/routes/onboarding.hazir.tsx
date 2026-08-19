import { env } from "cloudflare:workers";
import { Link, redirect } from "react-router";

import { ProfileAvatar } from "~/components/profile-avatar";
import { SignOutLink } from "~/components/sign-out-link";
import { parseSeedProfile } from "~/lib/profile-view";
import { noIndexMeta } from "~/lib/seo";
import { getSession } from "../../server/auth";
import { getProfileByUserId } from "../../server/profile";
import type { Route } from "./+types/onboarding.hazir";
import { localizedRedirect } from "../../server/locale";
import { DEFAULT_LOCALE } from "@caka/shared";
import { appCatalog } from "~/content/app";
import { useCatalog } from "~/lib/locale";

export function meta({}: Route.MetaArgs) {
  return noIndexMeta(appCatalog[DEFAULT_LOCALE].titles.onboardingReady);
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(env, request);
  if (!session) throw localizedRedirect(request, "/onboarding");
  const profile = await getProfileByUserId(env, session.user.id);
  if (!profile) throw localizedRedirect(request, "/onboarding");
  const seed = parseSeedProfile(profile.layout);
  return {
    username: profile.username,
    name: seed.name ?? session.user.name,
    avatarUrl: seed.avatarUrl,
  };
}

export default function OnboardingHazir({ loaderData }: Route.ComponentProps) {
  const app = useCatalog(appCatalog);
  const { username, name, avatarUrl } = loaderData;
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-white px-6 text-center">
      <h1 className="text-4xl font-bold">{app.setup.readyKicker}</h1>
      <p className="mt-3 max-w-sm text-murekkep/60">
        {app.setup.readyBody}
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
        {app.setup.goToPage}
      </Link>
      <p className="mt-4 text-sm text-murekkep/50">
        {app.setup.gridSoon}
      </p>
      <SignOutLink className="mt-8" />
    </main>
  );
}
