// Ayarlar: üç bölüm — Adres (kullanıcı adı değişikliği), Paylaşım görseli
// (og:image şablonu + fotoğraf kaynağı) ve Hesap (salt okunur).
//
// Paylaşım görseli önizlemeleri GERÇEK /og/u/... render'larıdır — hash'li
// URL'ler loader'da üretilir; seçim kaydedilince revalidate ile taze hash'ler
// çekilir (eski URL'ler tarayıcıda immutable cache'lendiği için 302'ye
// güvenilmez).
//
// İş mantığı burada değil `server/profile.ts`'te; bu dosya loader/action
// bağlamasından ve bölümlerin dizilişinden sorumludur.
import { useState } from "react";
import { env } from "cloudflare:workers";
import { data, redirect } from "react-router";

import { AccountCard } from "~/components/ayarlar/account-card";
import { AddressCard } from "~/components/ayarlar/address-card";
import { ShareImageCard, type SaveState } from "~/components/ayarlar/share-image-card";
import { DashSidebar } from "~/components/dash-sidebar";
import { ayarlarContent, ayarlarSections, type AddressErrorId } from "~/content/ayarlar";
import { PUBLISHED_LEGAL_DOCUMENT_IDS } from "~/content/legal";
import { noIndexMeta } from "~/lib/seo";
import {
  normalizeOgTemplate,
  OG_TEMPLATE_OPTIONS,
  parseProfileLayout,
  type OgTemplate,
  type ProfileBlock,
} from "@caka/shared";
import { getSession } from "../../server/auth";
import { ogImagePathForTemplate } from "../../server/og-image";
import {
  changeUsername,
  getAccountProviders,
  getProfileByUserId,
  getUsernameChangeState,
} from "../../server/profile";
import { hasSameOrigin } from "../../server/request";
import type { Route } from "./+types/ayarlar";

export function meta({}: Route.MetaArgs) {
  return noIndexMeta("Ayarlar — Caka");
}

/** `Date` → `YYYY-MM-DD`; içerik katmanı Türkçe biçime bunun üzerinden çevirir. */
function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(env, request);
  if (!session) throw redirect("/login");
  const profile = await getProfileByUserId(env, session.user.id);
  if (!profile) throw redirect("/onboarding");
  if (!profile.onboardingCompletedAt) throw redirect("/onboarding/kurulum/profil");
  const layout = parseProfileLayout(profile.layout);
  if (!layout) throw new Response("Sayfa düzeni okunamadı", { status: 500 });

  const card = layout.blocks.find(
    (block): block is Extract<ProfileBlock, { type: "profile" }> => block.type === "profile",
  );
  // Fotoğraf kaynağı adayları: yayınlanmış layout'taki görsel blokları.
  const imageBlocks = layout.blocks.flatMap((block) =>
    block.type === "image" && block.data.assetId
      ? [{ assetId: block.data.assetId, title: block.data.title }]
      : [],
  );
  // Kayıtlı seçim layout'tan silinmişse arayüz varsayılanı (avatar) gösterir —
  // sunucu tarafı da aynı kurala düşer (resolveOgPhotoAssetId).
  const ogPhotoAssetId =
    profile.ogPhotoAssetId &&
    imageBlocks.some((block) => block.assetId === profile.ogPhotoAssetId)
      ? profile.ogPhotoAssetId
      : null;

  // 6 şablonun kararlı önizleme URL'leri (hash'li, gerçek render).
  const [previewEntries, changeState, providers] = await Promise.all([
    Promise.all(
      OG_TEMPLATE_OPTIONS.map(
        async ({ id }) => [id, await ogImagePathForTemplate(profile, id)] as const,
      ),
    ),
    getUsernameChangeState(env, profile),
    getAccountProviders(env, session.user.id),
  ]);
  const previews = Object.fromEntries(previewEntries) as Record<OgTemplate, string>;

  return {
    username: profile.username,
    ogTemplate: normalizeOgTemplate(profile.ogTemplate),
    ogPhotoAssetId,
    imageBlocks,
    previews,
    addressChange: {
      allowed: changeState.window.allowed,
      availableOn: changeState.window.availableAt
        ? isoDate(changeState.window.availableAt)
        : null,
      remainingDays: changeState.window.remainingDays,
      activeRedirects: changeState.activeRedirects.map((item) => ({
        oldUsername: item.oldUsername,
        expiresOn: isoDate(item.expiresAt),
      })),
    },
    accountInfo: {
      providers,
      email: session.user.email,
      emailVerified: Boolean(session.user.emailVerified),
    },
    publishedLegal: PUBLISHED_LEGAL_DOCUMENT_IDS,
    account: {
      name: card?.data.name || profile.username,
      username: profile.username,
      avatarUrl: card?.data.avatarAssetId ? `/i/${card.data.avatarAssetId}` : null,
    },
  };
}

type AddressActionData =
  | { ok: true; previousUsername: string; username: string; expiresOn: string }
  | { ok: false; error: AddressErrorId };

/**
 * Adres değişikliği. Oturum zorunlu ve değişiklik yalnız oturum sahibinin
 * kendi profiline uygulanır (`changeUsername` profili `userId` ile bulur);
 * istek gövdesinde hedef kullanıcı taşınmaz.
 */
export async function action({ request }: Route.ActionArgs) {
  // Hata yanıtları `data(...)` ile döner (throw DEĞİL): fetcher yükü okur,
  // durum kodu da dürüst kalır.
  const fail = (error: AddressErrorId, status: 400 | 403 | 409) =>
    data({ ok: false, error } satisfies AddressActionData, { status });

  if (!hasSameOrigin(request)) return fail("origin", 403);
  const session = await getSession(env, request);
  if (!session) throw redirect("/login");

  const form = await request.formData();
  if (form.get("intent") !== "address") return fail("unknown", 400);

  let result;
  try {
    result = await changeUsername(env, session.user.id, String(form.get("username") ?? ""));
  } catch (error) {
    // Beklenmeyen hata sayfayı 500'e düşürmesin; satır içi Türkçe mesaj göster.
    console.error(
      JSON.stringify({ message: "username change failed", error: String(error) }),
    );
    return fail("unknown", 400);
  }
  if (!result.ok) {
    return fail(result.error, result.error === "conflict" ? 409 : 400);
  }
  return data({
    ok: true,
    previousUsername: result.previousUsername,
    username: result.username,
    expiresOn: isoDate(result.redirectExpiresAt),
  } satisfies AddressActionData);
}

export default function Ayarlar({ loaderData }: Route.ComponentProps) {
  const { username, account, accountInfo, addressChange, imageBlocks, previews } = loaderData;
  const [saveState, setSaveState] = useState<SaveState>("idle");

  return (
    <main className="dash-shell">
      <DashSidebar username={username} account={account} />

      <section className="dash-main ayarlar-main">
        <header className="ayarlar-header">
          <h1>{ayarlarContent.title}</h1>
          <span aria-live="polite" className="ayarlar-save-state" data-state={saveState}>
            {saveState === "saving" && ayarlarContent.saveState.saving}
            {saveState === "saved" && ayarlarContent.saveState.saved}
            {saveState === "error" && ayarlarContent.saveState.error}
          </span>
        </header>

        <nav className="ayarlar-nav" aria-label={ayarlarContent.sectionNavLabel}>
          {ayarlarSections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.label}
            </a>
          ))}
        </nav>

        <AddressCard username={username} change={addressChange} />

        <ShareImageCard
          ogTemplate={loaderData.ogTemplate}
          ogPhotoAssetId={loaderData.ogPhotoAssetId}
          imageBlocks={imageBlocks}
          previews={previews}
          account={account}
          onSaveStateChange={setSaveState}
        />

        <AccountCard
          providers={accountInfo.providers}
          email={accountInfo.email}
          emailVerified={accountInfo.emailVerified}
          publishedLegal={loaderData.publishedLegal}
        />
      </section>
    </main>
  );
}
