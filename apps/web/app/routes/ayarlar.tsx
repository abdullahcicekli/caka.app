// Ayarlar: paylaşım görseli (og:image) şablonu ve fotoğraf kaynağı seçimi.
// Önizlemeler GERÇEK /og/u/... render'larıdır — hash'li URL'ler loader'da
// üretilir; seçim kaydedilince revalidate ile taze hash'ler çekilir (eski
// URL'ler tarayıcıda immutable cache'lendiği için 302'ye güvenilmez).
import { useEffect, useRef, useState } from "react";
import { env } from "cloudflare:workers";
import { redirect, useRevalidator } from "react-router";

import { DashSidebar } from "~/components/dash-sidebar";
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
import { getProfileByUserId } from "../../server/profile";
import type { Route } from "./+types/ayarlar";

export function meta({}: Route.MetaArgs) {
  return noIndexMeta("Ayarlar — Caka");
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
  const previews = Object.fromEntries(
    await Promise.all(
      OG_TEMPLATE_OPTIONS.map(
        async ({ id }) => [id, await ogImagePathForTemplate(profile, id)] as const,
      ),
    ),
  ) as Record<OgTemplate, string>;

  return {
    username: profile.username,
    ogTemplate: normalizeOgTemplate(profile.ogTemplate),
    ogPhotoAssetId,
    imageBlocks,
    previews,
    account: {
      name: card?.data.name || profile.username,
      username: profile.username,
      avatarUrl: card?.data.avatarAssetId ? `/i/${card.data.avatarAssetId}` : null,
    },
  };
}

type SaveState = "idle" | "saving" | "saved" | "error";

export default function Ayarlar({ loaderData }: Route.ComponentProps) {
  const { username, account, imageBlocks, previews } = loaderData;
  const [template, setTemplate] = useState<OgTemplate>(loaderData.ogTemplate);
  const [photoAssetId, setPhotoAssetId] = useState<string | null>(loaderData.ogPhotoAssetId);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const revalidator = useRevalidator();
  // Hızlı tıklamada iki PUT uçuşa çıkıp ağ sırayı ters çevirebilir; o zaman
  // DB'de eski, ekranda yeni seçim kalırdı. Önceki isteği iptal et ve yalnız
  // son isteğin sonucunu uygula.
  const saveRef = useRef<AbortController | null>(null);

  // Kaydetme başarısızsa (ör. seçilen görsel başka sekmede silinmişse) seçim
  // uygulanmış görünmesin: sunucudaki gerçek değere geri dön.
  useEffect(() => {
    setTemplate(loaderData.ogTemplate);
    setPhotoAssetId(loaderData.ogPhotoAssetId);
  }, [loaderData.ogTemplate, loaderData.ogPhotoAssetId]);

  async function save(next: { template: OgTemplate; photoAssetId: string | null }) {
    saveRef.current?.abort();
    const controller = new AbortController();
    saveRef.current = controller;
    setSaveState("saving");
    try {
      const response = await fetch("/api/profile/og", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ogTemplate: next.template,
          ogPhotoAssetId: next.photoAssetId,
        }),
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (!response.ok) {
        setSaveState("error");
        // Sunucu reddetti: ekrandaki seçimi gerçek değere geri sar.
        revalidator.revalidate();
        return;
      }
      setSaveState("saved");
      // Şablon/fotoğraf değişimi hash'leri değiştirir; taze önizleme URL'leri çek.
      revalidator.revalidate();
    } catch (error) {
      // Yeni bir seçim bu isteği iptal ettiyse hata gösterme.
      if (error instanceof DOMException && error.name === "AbortError") return;
      setSaveState("error");
      revalidator.revalidate();
    }
  }

  function pickTemplate(next: OgTemplate) {
    if (next === template) return;
    setTemplate(next);
    void save({ template: next, photoAssetId });
  }

  function pickPhoto(next: string | null) {
    if (next === photoAssetId) return;
    setPhotoAssetId(next);
    void save({ template, photoAssetId: next });
  }

  return (
    <main className="dash-shell">
      <DashSidebar username={username} account={account} />

      <section className="dash-main ayarlar-main">
        <header className="ayarlar-header">
          <h1>Ayarlar</h1>
          <span aria-live="polite" className="ayarlar-save-state" data-state={saveState}>
            {saveState === "saving" && "Kaydediliyor…"}
            {saveState === "saved" && "Kaydedildi"}
            {saveState === "error" && "Kaydedilemedi — tekrar dene"}
          </span>
        </header>

        <section className="ayarlar-card">
          <h2>Paylaşım görseli</h2>
          <p className="ayarlar-hint">
            Sayfanın bağlantısı WhatsApp, X ve LinkedIn gibi yerlerde paylaşıldığında
            bu görsel görünür.
          </p>

          <figure className="ayarlar-hero">
            {/* key: revalidate sonrası URL değişince görsel tazelensin */}
            <img
              key={previews[template]}
              src={previews[template]}
              alt={`Seçili paylaşım görseli önizlemesi — ${
                OG_TEMPLATE_OPTIONS.find((option) => option.id === template)?.label
              }`}
              width={1200}
              height={630}
            />
          </figure>

          <h3>Şablon</h3>
          <div className="ayarlar-template-grid" role="radiogroup" aria-label="Şablon seçimi">
            {OG_TEMPLATE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={option.id === template}
                className="ayarlar-template"
                onClick={() => pickTemplate(option.id)}
              >
                <img
                  key={previews[option.id]}
                  src={previews[option.id]}
                  alt=""
                  loading="lazy"
                  width={1200}
                  height={630}
                />
                <span>{option.label}</span>
              </button>
            ))}
          </div>

          {imageBlocks.length === 0 ? (
            <>
              <h3>Fotoğraf kaynağı</h3>
              <p className="ayarlar-hint">
                Portre ve Tam kadraj şablonları profil fotoğrafını kullanıyor. Sayfana bir
                görsel bloğu ekleyip yayınlarsan burada onu da seçebilirsin.
              </p>
            </>
          ) : (
            <>
              <h3>Fotoğraf kaynağı</h3>
              <p className="ayarlar-hint">
                Portre ve Tam kadraj şablonlarında kullanılacak fotoğraf.
              </p>
              <div
                className="ayarlar-photo-grid"
                role="radiogroup"
                aria-label="Fotoğraf kaynağı seçimi"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={photoAssetId === null}
                  className="ayarlar-photo"
                  onClick={() => pickPhoto(null)}
                >
                  {account.avatarUrl ? (
                    <img src={account.avatarUrl} alt="" width={96} height={96} />
                  ) : (
                    <span className="ayarlar-photo-initial" aria-hidden>
                      {(account.name.trim()[0] ?? "C").toLocaleUpperCase("tr")}
                    </span>
                  )}
                  <span>Profil fotoğrafım</span>
                </button>
                {imageBlocks.map((block, index) => (
                  <button
                    key={block.assetId}
                    type="button"
                    role="radio"
                    aria-checked={photoAssetId === block.assetId}
                    className="ayarlar-photo"
                    onClick={() => pickPhoto(block.assetId)}
                  >
                    <img src={`/i/${block.assetId}`} alt="" loading="lazy" width={96} height={96} />
                    <span>{block.title || `Görsel ${index + 1}`}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      </section>
    </main>
  );
}
