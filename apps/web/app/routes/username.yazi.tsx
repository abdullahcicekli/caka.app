// Public yazı sayfası (U5): `caka.app/<kullanici>/<slug>` — R2.
//
// Loader karar zinciri (plandaki akış şeması):
//   kullanıcı adı normalize/doğrula → profil çözümü (redirect slug'ı taşır,
//   R5) → slug kanonikleştirme (R19) → yazı sorgusu → taslak+ziyaretçi veya
//   yok → YALIN 404 (R20; başlık yanıta hiç girmez, AE1) → taslak+sahip
//   render (AE2) → yayında render + recordProfileView (R21).
//
// Sayfa JS'siz statik render'dır (R12): gövde sunucuda `RichTextView
// variant="post"` ile basılır, istemcide ek veri çekilmez.
import { env } from "cloudflare:workers";
import { and, eq } from "drizzle-orm";
import { Link, data, redirect } from "react-router";
import { NavArrowLeft } from "iconoir-react";

import { createDb, post } from "@caka/db";
import {
  DEFAULT_LOCALE,
  normalizeUsername,
  validatePostSlug,
  validateUsername,
  type Locale,
} from "@caka/shared";
import { ErrorPage } from "~/components/error-page";
import { RichTextView } from "~/components/rich-text";
import { appCatalog } from "~/content/app";
import { yaziCatalog } from "~/content/yazi";
import { useCatalog } from "~/lib/locale";
import { parseSeedProfile } from "~/lib/profile-view";
import { absoluteSiteUrl, buildSeoMeta, noIndexMeta } from "~/lib/seo";
import { recordProfileView } from "../../server/analytics";
import { getSession } from "../../server/auth";
import { ogImagePathForPost } from "../../server/og-image";
import { resolveUsername } from "../../server/profile";
import type { Route } from "./+types/username.yazi";

/** Kök route'un loader verisinden dili okur (meta içinde hook kullanılamaz). */
function metaLocale(matches: Route.MetaArgs["matches"]): Locale {
  const root = matches.find((match) => match?.id === "root");
  const rootData = root?.loaderData as { locale?: Locale } | undefined;
  return rootData?.locale ?? DEFAULT_LOCALE;
}

/**
 * Gövdeden düz metin özeti (meta description). Tiptap JSON'ındaki text
 * düğümleri sırayla toplanır; ilk ~160 karakter yeter — SEO snippet ölçüsü.
 */
function docExcerpt(doc: unknown, max = 160): string {
  const parts: string[] = [];
  const walk = (node: unknown): void => {
    if (parts.join(" ").length > max) return;
    if (!node || typeof node !== "object") return;
    const record = node as { text?: unknown; content?: unknown };
    if (typeof record.text === "string") parts.push(record.text);
    if (Array.isArray(record.content)) for (const child of record.content) walk(child);
  };
  walk(doc);
  const text = parts.join(" ").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/**
 * 404 türleri: `no_page` profil hiç yok/biçimsiz (username.tsx'in düz 404'üyle
 * aynı ton); `post_not_found` profil VAR ama bu adreste yayında yazı yok —
 * R20'nin YALIN 404'ü: profile dönüş bağlantısı taşır, "bu adres boşta, kap!"
 * çağrısı bu sayfada ASLA görünmez (yeni içerik türü, `unclaimed` yok).
 */
type PostNotFoundKind = "no_page" | "post_not_found";

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const locale = metaLocale(matches);
  if (!loaderData) return noIndexMeta(appCatalog[locale].titles.notFound);

  const title = `${loaderData.title} — @${loaderData.username} | Caka`;
  // Taslak yalnız sahibine iner (AE2); arama motoruna hiçbir sinyal verilmez.
  if (!loaderData.published) return noIndexMeta(title);

  const path = `/${loaderData.username}/${loaderData.slug}`;
  const canonical = absoluteSiteUrl(path);
  const authorUrl = absoluteSiteUrl(`/${loaderData.username}`);
  const descriptors = buildSeoMeta({
    title,
    description: loaderData.description,
    path,
    image: loaderData.ogImage ?? undefined,
    imageAlt: yaziCatalog[locale].shareImageAlt(loaderData.title),
    schema: {
      "@context": "https://schema.org",
      "@type": "Article",
      "@id": `${canonical}#article`,
      headline: loaderData.title,
      url: canonical,
      mainEntityOfPage: canonical,
      ...(loaderData.publishedAt ? { datePublished: loaderData.publishedAt } : {}),
      dateModified: loaderData.updatedAt,
      ...(loaderData.ogImage ? { image: loaderData.ogImage } : {}),
      author: {
        "@type": "Person",
        name: loaderData.authorName,
        url: authorUrl,
      },
      isPartOf: { "@id": `${authorUrl}#profile-page` },
    },
  }).map((descriptor) =>
    // `buildSeoMeta` og:type olarak yalnız website/profile bilir; `lib/seo`
    // bu birimin dosya kapsamı dışında olduğundan union orada genişletilmedi,
    // article değeri burada tek noktadan değiştirilir (R14).
    "property" in descriptor && descriptor.property === "og:type"
      ? { property: "og:type", content: "article" }
      : descriptor,
  );
  if (loaderData.publishedAt) {
    descriptors.push({
      property: "article:published_time",
      content: loaderData.publishedAt,
    });
  }
  descriptors.push(
    { property: "article:modified_time", content: loaderData.updatedAt },
    { property: "article:author", content: authorUrl },
  );
  return descriptors;
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const rawUsername = params.username ?? "";
  const rawSlug = params.slug ?? "";
  const username = normalizeUsername(rawUsername);

  // 1) Biçimsiz/rezerve kullanıcı adı adres değildir → düz 404.
  if (!validateUsername(username).ok) {
    throw data(
      { kind: "no_page" satisfies PostNotFoundKind, username },
      { status: 404 },
    );
  }

  // 2) Profil çözümü. Devir kaydında slug HEDEFE TAŞINIR (R5/AE5): 302 +
  // kısa cache — 301 ASLA (Değişmez #10, tarayıcı süresiz cache'ler).
  // `encodeURIComponent` savunma derinliğidir: `to` DB'den, `rawSlug` URL'den
  // gelir ve alfabe dışı ham parametre hedefe olduğu gibi geçmemelidir.
  const resolved = await resolveUsername(env, username);
  if (resolved.kind === "redirect") {
    throw redirect(
      `/${encodeURIComponent(resolved.to)}/${encodeURIComponent(rawSlug)}`,
      { status: 302, headers: { "Cache-Control": "public, max-age=3600" } },
    );
  }
  if (resolved.kind === "not_found") {
    throw data(
      { kind: "no_page" satisfies PostNotFoundKind, username },
      { status: 404 },
    );
  }
  const p = resolved.profile;

  // 3) Slug kanonikleştirme (R19/AE8). Biçimsiz/rezerve slug hiçbir yazıya
  // ait olamaz → yalın 404. Kanonik olmayan biçim (büyük harf, ı) kanonik
  // adrese 302 gider; kullanıcı adının normalize dalı da AYNI yönlendirmede
  // toplanır ki `/Yusuf/Ilk-Yazim` tek sıçrayışta kanonik adrese insin.
  const slugResult = validatePostSlug(rawSlug);
  if (!slugResult.ok) {
    throw data(
      { kind: "post_not_found" satisfies PostNotFoundKind, username: p.username },
      { status: 404 },
    );
  }
  const slug = slugResult.slug;
  if (rawUsername !== username || rawSlug !== slug) {
    throw redirect(`/${username}/${encodeURIComponent(slug)}`, { status: 302 });
  }

  // 4) Yazı sorgusu. Tek satırlık okuma olduğu için doğrudan burada yapılır;
  // yazı iş mantığının evi `server/post-api.ts`'tir.
  const session = await getSession(env, request);
  const isOwner = session?.user.id === p.userId;
  const row = await createDb(env.DB).query.post.findFirst({
    where: and(eq(post.profileId, p.id), eq(post.slug, slug)),
  });

  // R4/AE1: taslak, ziyaretçi için YOK ile birebir aynıdır — durum 404 ve
  // fırlatılan veride başlıktan tek karakter bile yer almaz.
  if (!row || (row.status !== "published" && !isOwner)) {
    throw data(
      { kind: "post_not_found" satisfies PostNotFoundKind, username: p.username },
      { status: 404 },
    );
  }

  const published = row.status === "published";
  // R21: yayında yazı görüntülenmesi profil sayacına akar — aynı sahip/bot
  // ayıklama kurallarıyla (recordProfileView içinde). `await` YOK: yazma
  // `waitUntil` içinde yanıtın dışında koşar. Taslak görüntülemede ÇAĞRILMAZ.
  if (published) {
    recordProfileView(env, request, { profileId: p.id, isOwner });
  }

  let doc: unknown = null;
  try {
    doc = JSON.parse(row.body);
  } catch {
    // Bozuk gövde sayfayı düşürmez; başlık ve çerçeve yine render edilir.
  }

  const seed = parseSeedProfile(p.layout);
  return {
    username: p.username,
    slug,
    title: row.title,
    doc,
    published,
    isOwner,
    authorName: seed.name ?? p.username,
    description: docExcerpt(doc) || `${row.title} — @${p.username}`,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    // Tarih etiketi UTC gün anahtarından üretilir (katalog `date`); sunucu ve
    // istemci aynı dizgeyi basar, hidrasyon oynamaz.
    publishedDay: row.publishedAt ? row.publishedAt.toISOString().slice(0, 10) : null,
    updatedAt: row.updatedAt.toISOString(),
    // Paylaşım görseli yalnız yayında üretilir (KTD6): taslak URL'i bile
    // sızdırmaz — og ucu da zaten published dışını fallback'e düşürür.
    ogImage: published
      ? absoluteSiteUrl(await ogImagePathForPost(p.username, row))
      : null,
  };
}

export default function PublicPost({ loaderData }: Route.ComponentProps) {
  const yazi = useCatalog(yaziCatalog);
  const { username, title, doc, published, publishedDay } = loaderData;
  return (
    <main className="min-h-svh bg-zemin text-murekkep">
      <article className="mx-auto w-full max-w-2xl px-5 py-12 sm:py-16">
        <p className="mb-8">
          <Link
            to={`/${username}`}
            className="post-back-link"
          >
            <NavArrowLeft width={18} height={18} aria-hidden />
            {yazi.backToProfile(username)}
          </Link>
        </p>
        {published ? null : (
          <p className="mb-6 rounded-xl bg-kum px-4 py-3 text-sm font-medium">
            {yazi.draftNotice}
          </p>
        )}
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
        {publishedDay ? (
          <p className="mt-3 text-sm text-murekkep/60">
            <time dateTime={publishedDay}>{yazi.date(publishedDay)}</time>
          </p>
        ) : null}
        {/* Gövde stilleri: `.rich-text` app.css'te paragraf/liste/alıntıyı
            zaten kapsıyor; yazıya özel düğümler (h2/h3, pre, img) burada
            sarmalayıcının soyundan-seçici sınıflarıyla giydirilir — app.css
            bu birimin dosya kapsamı dışında. */}
        <div
          className="mt-8 text-[17px] leading-relaxed [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-murekkep [&_pre]:px-4 [&_pre]:py-3 [&_pre]:text-sm [&_pre]:text-zemin [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-xl"
        >
          <RichTextView doc={doc} variant="post" />
        </div>
      </article>
    </main>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const app = useCatalog(appCatalog);
  const yazi = useCatalog(yaziCatalog);
  const info =
    error && typeof error === "object" && "data" in error
      ? (error.data as { kind?: string; username?: string })
      : {};

  // R20: profil var ama yazı yok — YALIN 404. Birincil eylem profile dönüş;
  // "bu adres boşta, kap!" çağrısı burada asla görünmez.
  if (info.kind === "post_not_found" && info.username) {
    return (
      <ErrorPage
        kicker="404"
        title={yazi.notFound.title}
        body={yazi.notFound.body}
        primary={{
          label: yazi.backToProfile(info.username),
          href: `/${info.username}`,
        }}
        secondary={{ label: app.errors.backHome, href: "/" }}
      />
    );
  }

  // Profil hiç yok / biçimsiz yol: username.tsx'in düz 404'üyle aynı ton.
  return (
    <ErrorPage
      kicker="404"
      title={app.errors.notFoundTitle}
      body={app.errors.notFoundBody}
      primary={{ label: app.errors.backHome, href: "/" }}
      secondary={{ label: app.errors.createPage, href: "/onboarding" }}
    />
  );
}
