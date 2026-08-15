import { env } from "cloudflare:workers";
import { Link, data, redirect } from "react-router";

import { initials, parseSeedName } from "~/lib/profile-view";
import { normalizeUsername } from "@caka/shared";
import { resolveUsername } from "../../server/profile";
import type { Route } from "./+types/username";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: "Caka" }];
  return [
    { title: `${loaderData.name} — @${loaderData.username} | Caka` },
    {
      name: "description",
      content: `${loaderData.name} — caka.app/${loaderData.username}`,
    },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const username = normalizeUsername(params.username ?? "");
  const resolved = await resolveUsername(env, username);

  if (resolved.kind === "redirect") {
    // R18: 302 + kısa cache (301 tarayıcıda süresiz cache'lenir)
    throw redirect(`/${resolved.to}`, {
      status: 302,
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  }
  if (resolved.kind === "not_found") {
    throw data({ username }, { status: 404 });
  }

  // Normalize edilmemiş URL'i kanonik hale yönlendir (/John -> /john)
  const rawParam = params.username ?? "";
  if (rawParam !== username) throw redirect(`/${username}`, { status: 302 });

  const p = resolved.profile;
  return {
    username: p.username,
    name: parseSeedName(p.layout) ?? p.username,
    theme: p.theme,
  };
}

export default function PublicProfile({ loaderData }: Route.ComponentProps) {
  const { name, username } = loaderData;
  return (
    <main className="flex min-h-svh flex-col items-center bg-zemin px-6 pt-20 pb-10">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="flex size-24 items-center justify-center rounded-full bg-kirec text-3xl font-bold text-kirec-koyu">
          {initials(name)}
        </div>
        <h1 className="mt-5 text-2xl font-bold">{name}</h1>
        <p className="mt-1 text-murekkep/50">@{username}</p>
      </div>
      <footer className="mt-auto pt-16">
        <Link
          to="/"
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-murekkep/70 shadow-sm hover:text-murekkep"
        >
          ⌘ Caka ile yapıldı
        </Link>
      </footer>
    </main>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const username =
    error && typeof error === "object" && "data" in error
      ? ((error.data as { username?: string })?.username ?? "")
      : "";
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-zemin px-6 text-center">
      <h1 className="text-3xl font-bold">Bu adres boşta</h1>
      <p className="mt-3 text-murekkep/60">
        caka.app/{username || "…"} henüz kimsenin değil.
      </p>
      <Link
        to={`/onboarding${username ? `?u=${encodeURIComponent(username)}` : ""}`}
        className="mt-8 rounded-full bg-murekkep px-8 py-3.5 font-medium text-white hover:bg-murekkep/85"
      >
        Bu adresi kap
      </Link>
    </main>
  );
}
