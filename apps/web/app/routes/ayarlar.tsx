// Ayarlar: panel iskeletinde (PanelShell) alt alta ayrık bölüm kartları —
// Adres (kullanıcı adı değişikliği), Dil, Paylaşım görseli (og:image şablonu
// + fotoğraf kaynağı) ve Hesap (salt okunur bilgi + en altta "tehlikeli
// bölge" olarak hesap silme; görsel ayrıklık `ayarlar-card-tehlike`
// token'ından gelir).
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
import { Settings } from "iconoir-react";
import { data } from "react-router";

import { AccountCard } from "~/components/ayarlar/account-card";
import { AddressCard } from "~/components/ayarlar/address-card";
import { ShareImageCard, type SaveState } from "~/components/ayarlar/share-image-card";
import { PanelShell } from "~/components/panel-shell";
import {
  ayarlarCatalog,
  type AddressErrorId,
  type DeleteErrorId,
} from "~/content/ayarlar";
import { LanguageCard } from "~/components/ayarlar/language-card";
import { commonCatalog } from "~/content/common";
import { useCatalog } from "~/lib/locale";
import { publishedLegalDocumentIds } from "~/content/legal";
import { noIndexMeta } from "~/lib/seo";
import { DEFAULT_LOCALE,
  layoutPhotoAssets,
  normalizeOgTemplate,
  OG_TEMPLATE_OPTIONS,
  parseProfileLayout,
  usernameWindowDayKey,
  type OgTemplate,
  type ProfileBlock,
} from "@caka/shared";
import { checkDeleteAccount, deleteAccount } from "../../server/account";
import { getSession, signOutSetCookies } from "../../server/auth";
import { ogImagePathForTemplate } from "../../server/og-image";
import {
  changeUsername,
  getAccountProviders,
  getProfileByUserId,
  getUsernameChangeState,
} from "../../server/profile";
import { hasSameOrigin } from "../../server/request";
import type { Route } from "./+types/ayarlar";
import { localeFromRequest, localizedRedirect } from "../../server/locale";
import { appCatalog } from "~/content/app";

export function meta({ loaderData }: Route.MetaArgs) {
  return noIndexMeta(appCatalog[loaderData?.locale ?? DEFAULT_LOCALE].titles.settings);
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(env, request);
  if (!session) throw localizedRedirect(request, "/login");
  const profile = await getProfileByUserId(env, session.user.id);
  if (!profile) throw localizedRedirect(request, "/onboarding");
  if (!profile.onboardingCompletedAt) throw localizedRedirect(request, "/onboarding/kurulum/profil");
  const layout = parseProfileLayout(profile.layout);
  if (!layout) throw new Response(appCatalog[localeFromRequest(request)].editor.layoutUnreadable, { status: 500 });

  const card = layout.blocks.find(
    (block): block is Extract<ProfileBlock, { type: "profile" }> => block.type === "profile",
  );
  // Fotoğraf kaynağı adayları: yayınlanmış layout'taki fotoğraf blokları.
  // `image` ve `gallery` birleştiği için aday listesi artık galerideki
  // fotoğrafları da içeriyor — eskiden yalnız tek görselli bloklar görünüyor,
  // galerisine beş fotoğraf koyan kullanıcı hiçbirini seçemiyordu.
  const imageBlocks = layoutPhotoAssets(layout);
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
    // Sekme başlığı `meta`da katalogdan okunuyor; `meta` hook kullanamaz.
    locale: localeFromRequest(request),
    username: profile.username,
    ogTemplate: normalizeOgTemplate(profile.ogTemplate),
    ogPhotoAssetId,
    imageBlocks,
    previews,
    addressChange: {
      allowed: changeState.window.allowed,
      availableOn: changeState.window.availableAt
        ? usernameWindowDayKey(changeState.window.availableAt)
        : null,
      remainingDays: changeState.window.remainingDays,
      activeRedirects: changeState.activeRedirects.map((item) => ({
        oldUsername: item.oldUsername,
        expiresOn: usernameWindowDayKey(item.expiresAt),
      })),
    },
    accountInfo: {
      providers,
      email: session.user.email,
      emailVerified: Boolean(session.user.emailVerified),
    },
    publishedLegal: publishedLegalDocumentIds(localeFromRequest(request)),
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
 * Hesap silme yalnızca BAŞARISIZLIKTA gövde döndürür; başarı hâli bir
 * yönlendirmedir (oturum artık yok, sayfada kalınacak bir yer de yok).
 */
type DeleteActionData = { ok: false; error: DeleteErrorId };

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
  if (!session) throw localizedRedirect(request, "/login");

  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "hesap-sil") {
    return deleteAccountAction(request, session.user.id, String(form.get("confirm") ?? ""));
  }

  if (intent !== "address") return fail("unknown", 400);

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
    expiresOn: usernameWindowDayKey(result.redirectExpiresAt),
  } satisfies AddressActionData);
}

/**
 * Hesap silme. Sıra bilinçlidir:
 *
 *  1. **Onay kontrolü** — kullanıcı kendi adresini birebir yazmadıysa hiçbir şey
 *     olmaz ve oturum el değmemiş kalır (yazım hatası kimseyi çıkışa atmaz).
 *  2. **Çıkış** — oturum kaydı ve çerez, silme başlamadan geçersiz kılınır.
 *  3. **Silme** — D1 + R2. Burada patlarsa kullanıcı yalnızca çıkmış olur,
 *     hesabı durur; tekrar girip yeniden deneyebilir (güvenli tarafa düşer).
 */
async function deleteAccountAction(request: Request, userId: string, confirmation: string) {
  const checked = await checkDeleteAccount(env, userId, confirmation);
  if (!checked.ok) {
    return data({ ok: false, error: checked.error } satisfies DeleteActionData, { status: 400 });
  }

  const setCookies = await signOutSetCookies(env, request);

  let result;
  try {
    result = await deleteAccount(env, userId, confirmation);
  } catch (error) {
    console.error(JSON.stringify({ message: "account delete failed", error: String(error) }));
    return data({ ok: false, error: "unknown" } satisfies DeleteActionData, { status: 500 });
  }
  if (!result.ok) {
    return data({ ok: false, error: result.error } satisfies DeleteActionData, { status: 400 });
  }

  const headers = new Headers();
  for (const cookie of setCookies) headers.append("set-cookie", cookie);
  // `?veda`: ana sayfa silmenin gerçekten olduğunu söyleyen bir şerit gösterir.
  // Onsuz kullanıcı hiçbir açıklama olmadan pazarlama sayfasına düşerdi.
  throw localizedRedirect(request, "/?veda=1", { headers });
}

export default function Ayarlar({ loaderData }: Route.ComponentProps) {
  const { username, account, accountInfo, addressChange, imageBlocks, previews } = loaderData;
  const content = useCatalog(ayarlarCatalog);
  const app = useCatalog(appCatalog);
  const common = useCatalog(commonCatalog);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  // Bölümler sekme değil, alt alta ayrık kartlar: hepsi tek bakışta görünür.
  // Hesap silme kartı en sondadır (AccountCard'ın içinde, tehlike tonuyla).
  return (
    <PanelShell
      icon={Settings}
      title={content.title}
      description={app.panel.settingsDescription}
      titleAside={
        <span aria-live="polite" className="ayarlar-save-state" data-state={saveState}>
          {saveState === "saving" && common.saveState.saving}
          {saveState === "saved" && common.saveState.saved}
          {saveState === "error" && common.saveState.error}
        </span>
      }
      username={username}
      account={account}
    >
      <AddressCard username={username} change={addressChange} />

      <LanguageCard />

      <ShareImageCard
        ogTemplate={loaderData.ogTemplate}
        ogPhotoAssetId={loaderData.ogPhotoAssetId}
        imageBlocks={imageBlocks}
        previews={previews}
        account={account}
        onSaveStateChange={setSaveState}
      />

      <AccountCard
        username={username}
        providers={accountInfo.providers}
        email={accountInfo.email}
        emailVerified={accountInfo.emailVerified}
        publishedLegal={loaderData.publishedLegal}
      />
    </PanelShell>
  );
}
