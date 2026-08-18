import { env } from "cloudflare:workers";
import { LayoutDashboard, Pencil } from "lucide-react";
import { Link, data, redirect } from "react-router";

import { logoBlack } from "~/assets/brand";
import { LinkClickBeacon } from "~/components/link-click-beacon";
import { ProfileCanvas } from "~/components/profile-block";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { parseSeedProfile } from "~/lib/profile-view";
import { absoluteSiteUrl, buildSeoMeta, noIndexMeta } from "~/lib/seo";
import {
  normalizeUsername,
  ensureLayoutPositions,
  normalizeTheme,
  parseProfileLayout,
  validateUsername,
} from "@caka/shared";
import { recordProfileView } from "../../server/analytics";
import { getSession } from "../../server/auth";
import { collectGithubLogins, getGithubCalendars } from "../../server/github";
import { signLayoutImages } from "../../server/layout-images";
import { ogImagePathForProfile } from "../../server/og-image";
import { resolveUsername } from "../../server/profile";
import type { Route } from "./+types/username";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return noIndexMeta("Sayfa bulunamadı — Caka");
  const title = `${loaderData.name} — @${loaderData.username} | Caka`;
  const canonical = absoluteSiteUrl(`/${loaderData.username}`);
  const person: Record<string, unknown> = {
    "@type": "Person",
    "@id": `${canonical}#person`,
    name: loaderData.name,
    alternateName: `@${loaderData.username}`,
    description: loaderData.description,
    url: canonical,
  };
  if (loaderData.avatarUrl) person.image = absoluteSiteUrl(loaderData.avatarUrl);
  if (loaderData.sameAs.length > 0) person.sameAs = loaderData.sameAs;

  return [
    ...buildSeoMeta({
      title,
      description: loaderData.description,
      path: `/${loaderData.username}`,
      image: loaderData.ogImage,
      imageAlt: `${loaderData.name} adlı Caka profilinin paylaşım görseli`,
      type: "profile",
      schema: {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        "@id": `${canonical}#profile-page`,
        url: canonical,
        name: title,
        description: loaderData.description,
        dateCreated: loaderData.createdAt,
        dateModified: loaderData.updatedAt,
        inLanguage: "tr-TR",
        mainEntity: person,
        isPartOf: { "@id": "https://caka.app/#website" },
      },
    }),
    { property: "profile:username", content: loaderData.username },
  ];
}

/** 404 türleri: sistem/rezerve yol ≠ alınabilir boş adres (UX ayrımı). */
type NotFoundKind = "no_page" | "unclaimed" | "broken";

export async function loader({ params, request }: Route.LoaderArgs) {
  const username = normalizeUsername(params.username ?? "");

  // Rezerve veya biçimsiz yollar (edit, settings, admin, "ali veli"…) adres
  // DEĞİLDİR — "bu adres boşta, kap!" göstermek yanlış; düz 404 verilir.
  if (!validateUsername(username).ok) {
    throw data(
      { kind: "no_page" satisfies NotFoundKind, username },
      { status: 404 },
    );
  }

  const resolved = await resolveUsername(env, username);

  if (resolved.kind === "redirect") {
    // R18: 302 + kısa cache (301 tarayıcıda süresiz cache'lenir)
    throw redirect(`/${resolved.to}`, {
      status: 302,
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  }
  if (resolved.kind === "not_found") {
    throw data(
      { kind: "unclaimed" satisfies NotFoundKind, username },
      { status: 404 },
    );
  }

  // Normalize edilmemiş URL'i kanonik hale yönlendir (/John -> /john)
  const rawParam = params.username ?? "";
  if (rawParam !== username) throw redirect(`/${username}`, { status: 302 });

  const p = resolved.profile;
  const seed = parseSeedProfile(p.layout);
  const layout = parseProfileLayout(p.layout);
  if (!layout)
    throw data(
      { kind: "broken" satisfies NotFoundKind, username },
      { status: 404 },
    );
  const session = await getSession(env, request);
  const profileCard = layout.blocks.find((block) => block.type === "profile");
  const name = seed.name ?? p.username;
  const description =
    (profileCard?.type === "profile" ? profileCard.data.title.trim() : "") ||
    `${name} adlı kişinin bağlantıları, projeleri ve ürettikleri.`;
  const isOwner = session?.user.id === p.userId;
  // Görüntülenme ölçümü (R48). `await` YOK: fonksiyon senkron döner, D1
  // yazması `waitUntil` içinde yanıtın dışında koşar. Yazma hatası da orada
  // yutulur — ziyaretçi ne gecikme ne hata görür, sayfa her hâlükârda render
  // edilir. Ziyaretçinin cihazına hiçbir şey yazılmaz; istekten yalnızca
  // `cf.country` okunur, ham IP okunmaz ve saklanmaz.
  recordProfileView(env, request, { profileId: p.id, isOwner });

  const sameAs = [
    ...layout.blocks.flatMap((block) => {
      if (block.type === "social" || block.type === "link") return [block.data.url];
      return [];
    }),
  ].filter((url, index, values) => /^https?:\/\//.test(url) && values.indexOf(url) === index);
  return {
    username: p.username,
    name,
    description,
    avatarUrl: seed.avatarUrl,
    sameAs,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    // Kullanıcıya özel paylaşım görseli; hash içerik değişince değişir
    // (sosyal ağ scraper cache'i kendiliğinden tazelenir).
    ogImage: absoluteSiteUrl(await ogImagePathForProfile(p)),
    theme: normalizeTheme(p.theme),
    layout: ensureLayoutPositions(layout),
    isOwner,
    // GitHub katkı grafikleri: D1 önbelleğinden okunur; token yoksa boş.
    githubCalendars: await getGithubCalendars(env, collectGithubLogins(layout)),
    signedImages: await signLayoutImages(env, layout),
  };
}

export default function PublicProfile({ loaderData }: Route.ComponentProps) {
  const { username, isOwner, layout, theme, githubCalendars, signedImages } = loaderData;
  return (
    <main className="relative min-h-svh">
      <ProfileCanvas
        layout={layout}
        theme={theme}
        githubCalendars={githubCalendars}
        signedImages={signedImages}
      />
      {/* Tıklama ölçümü yalnız ziyaretçide çalışır; sahibin kendi tıklaması
          sayaca girmez. Bağlantıların href'i değişmez — JS kapalıyken
          bağlantılar aynen çalışır, yalnızca sayılmaz. */}
      {isOwner ? null : <LinkClickBeacon username={username} />}
      {/* Marka rozeti sağ üstte: sahip için hızlı menü (Düzenle/Panel),
          ziyaretçi için ana sayfa bağlantısı. Logo beyaz yuvarlak zemin
          üzerinde durur; koyu/açık her temada okunur. */}
      {isOwner ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label="Caka menüsü" className="brand-corner">
              <img src={logoBlack} alt="" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-40">
            <DropdownMenuItem asChild>
              <Link to="/edit">
                <Pencil /> Düzenle
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/dashboard">
                <LayoutDashboard /> Panel
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Link to="/" aria-label="Caka — ana sayfa" className="brand-corner">
          <img src={logoBlack} alt="Caka" />
        </Link>
      )}
    </main>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const info =
    error && typeof error === "object" && "data" in error
      ? (error.data as { kind?: string; username?: string })
      : {};
  const username = info.username ?? "";

  // Yalnızca geçerli ve gerçekten boş adresler "kap!" CTA'sı görür;
  // sistem/rezerve yollar ve bozuk profiller düz hata sayfası alır.
  if (info.kind !== "unclaimed") {
    const broken = info.kind === "broken";
    return (
      <main className="flex min-h-svh flex-col items-center justify-center bg-zemin px-6 text-center">
        <p className="text-sm font-medium tracking-widest text-murekkep/40">404</p>
        <h1 className="mt-2 text-3xl font-bold">
          {broken ? "Bu sayfa görüntülenemiyor" : "Sayfa bulunamadı"}
        </h1>
        <p className="mt-3 max-w-sm text-murekkep/60">
          {broken
            ? "Bir şeyler ters gitti; daha sonra tekrar dene."
            : "Aradığın sayfa yok ya da taşınmış olabilir."}
        </p>
        <Link
          to="/"
          className="mt-8 rounded-full bg-murekkep px-8 py-3.5 font-medium text-white hover:bg-murekkep/85"
        >
          Ana sayfaya dön
        </Link>
      </main>
    );
  }

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
