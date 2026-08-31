// Yazı listesi (U7/R1): sahibin tüm yazıları — başlık, durum, tarih — ve yeni
// yazı girişi. 20 sınırında (R8, taslaklar dahil) düğme kapanır ve NEDENİ
// yazar; asıl kapı sunucudadır (post-api POST), burası kullanıcıyı 400'e
// çarpmadan durduran arayüz katmanıdır.
import { env } from "cloudflare:workers";
import { PageEdit, Plus } from "iconoir-react";
import { Link } from "react-router";

import { DEFAULT_LOCALE, MAX_POSTS_PER_PROFILE } from "@caka/shared";
import { PanelShell } from "~/components/panel-shell";
import { yaziCatalog } from "~/content/yazi";
import { yaziEditorCatalog } from "~/content/yazi-editor";
import { useCatalog, useLocalizedPath } from "~/lib/locale";
import { parseSeedProfile } from "~/lib/profile-view";
import { noIndexMeta } from "~/lib/seo";
import { getSession } from "../../server/auth";
import { localeFromRequest, localizedRedirect } from "../../server/locale";
import { getOwnPostOptions } from "../../server/post-list";
import { getProfileByUserId } from "../../server/profile";
import type { Route } from "./+types/edit.yazilar";

export function meta({ loaderData }: Route.MetaArgs) {
  return noIndexMeta(yaziEditorCatalog[loaderData?.locale ?? DEFAULT_LOCALE].list.title);
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(env, request);
  if (!session) throw localizedRedirect(request, "/login");
  const profile = await getProfileByUserId(env, session.user.id);
  if (!profile) throw localizedRedirect(request, "/onboarding");
  if (!profile.onboardingCompletedAt) throw localizedRedirect(request, "/onboarding/kurulum/profil");

  const seed = parseSeedProfile(profile.layout);
  return {
    locale: localeFromRequest(request),
    username: profile.username,
    account: {
      name: seed.name || profile.username,
      username: profile.username,
      avatarUrl: seed.avatarUrl,
    },
    posts: await getOwnPostOptions(env, profile.id),
  };
}

/** ms damgasını `yaziCatalog.date`'in beklediği UTC gün anahtarına çevirir. */
function dayKeyOf(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export default function EditYazilar({ loaderData }: Route.ComponentProps) {
  const { username, account, posts } = loaderData;
  const content = useCatalog(yaziEditorCatalog);
  const yazi = useCatalog(yaziCatalog);
  const path = useLocalizedPath();
  const atLimit = posts.length >= MAX_POSTS_PER_PROFILE;

  return (
    <PanelShell
      icon={PageEdit}
      title={content.list.title}
      description={content.list.intro}
      titleAside={
        atLimit ? (
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-xl bg-murekkep/10 px-4 py-2 text-sm font-semibold text-murekkep/40"
          >
            <Plus width={16} height={16} /> {content.list.newPost}
          </button>
        ) : (
          <Link
            to={path("edit.yazi", { id: "yeni" })}
            className="inline-flex items-center gap-1.5 rounded-xl bg-murekkep px-4 py-2 text-sm font-semibold text-zemin hover:bg-murekkep/85"
          >
            <Plus width={16} height={16} /> {content.list.newPost}
          </Link>
        )
      }
      username={username}
      account={account}
    >
      {/* R8: engel kimlikli ve sebepli — düğme neden kapalı, yazıyor. */}
      {atLimit ? (
        <p className="rounded-xl bg-kum px-4 py-3 text-sm font-medium">
          {content.list.limitReason}
        </p>
      ) : null}

      {posts.length === 0 ? (
        <p className="text-sm text-murekkep/60">{content.list.empty}</p>
      ) : (
        <ul className="divide-y divide-murekkep/10">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                to={path("edit.yazi", { id: post.id })}
                className="flex items-center justify-between gap-4 py-4 hover:opacity-70"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{post.title}</span>
                  <span className="mt-1 block text-xs text-murekkep/50">
                    {yazi.date(
                      dayKeyOf(
                        post.status === "published" && post.publishedAt
                          ? post.publishedAt
                          : post.updatedAt,
                      ),
                    )}
                  </span>
                </span>
                <span
                  className={
                    post.status === "published"
                      ? "shrink-0 rounded-lg bg-kirec px-2.5 py-1 text-xs font-semibold text-murekkep"
                      : "shrink-0 rounded-lg bg-murekkep/10 px-2.5 py-1 text-xs font-semibold text-murekkep/60"
                  }
                >
                  {post.status === "published"
                    ? content.list.statusPublished
                    : content.list.statusDraft}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}
