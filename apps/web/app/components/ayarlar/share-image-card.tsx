// Ayarlar → Paylaşım görseli: og:image şablonu + fotoğraf kaynağı.
// routes/ayarlar.tsx'ten çıkarıldı; davranış birebir korunur (aynı PUT
// /api/profile/og akışı, aynı iptal/geri-sarma mantığı).
import { useEffect, useRef, useState } from "react";
import { useRevalidator } from "react-router";

import { ayarlarContent } from "~/content/ayarlar";
import { OG_TEMPLATE_OPTIONS, type OgTemplate } from "@caka/shared";

const copy = ayarlarContent.share;

export type SaveState = "idle" | "saving" | "saved" | "error";

export interface ShareImageCardProps {
  ogTemplate: OgTemplate;
  ogPhotoAssetId: string | null;
  imageBlocks: { assetId: string; title: string }[];
  previews: Record<OgTemplate, string>;
  account: { name: string; avatarUrl: string | null };
  onSaveStateChange: (state: SaveState) => void;
}

export function ShareImageCard({
  ogTemplate,
  ogPhotoAssetId,
  imageBlocks,
  previews,
  account,
  onSaveStateChange,
}: ShareImageCardProps) {
  const [template, setTemplate] = useState<OgTemplate>(ogTemplate);
  const [photoAssetId, setPhotoAssetId] = useState<string | null>(ogPhotoAssetId);
  const revalidator = useRevalidator();
  // Hızlı tıklamada iki PUT uçuşa çıkıp ağ sırayı ters çevirebilir; o zaman
  // DB'de eski, ekranda yeni seçim kalırdı. Önceki isteği iptal et ve yalnız
  // son isteğin sonucunu uygula.
  const saveRef = useRef<AbortController | null>(null);

  // Kaydetme başarısızsa (ör. seçilen görsel başka sekmede silinmişse) seçim
  // uygulanmış görünmesin: sunucudaki gerçek değere geri dön.
  useEffect(() => {
    setTemplate(ogTemplate);
    setPhotoAssetId(ogPhotoAssetId);
  }, [ogTemplate, ogPhotoAssetId]);

  async function save(next: { template: OgTemplate; photoAssetId: string | null }) {
    saveRef.current?.abort();
    const controller = new AbortController();
    saveRef.current = controller;
    onSaveStateChange("saving");
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
        onSaveStateChange("error");
        // Sunucu reddetti: ekrandaki seçimi gerçek değere geri sar.
        revalidator.revalidate();
        return;
      }
      onSaveStateChange("saved");
      // Şablon/fotoğraf değişimi hash'leri değiştirir; taze önizleme URL'leri çek.
      revalidator.revalidate();
    } catch (error) {
      // Yeni bir seçim bu isteği iptal ettiyse hata gösterme.
      if (error instanceof DOMException && error.name === "AbortError") return;
      onSaveStateChange("error");
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
    <section id="paylasim-gorseli" className="ayarlar-card">
      <h2>{copy.title}</h2>
      <p className="ayarlar-hint">{copy.hint}</p>

      <figure className="ayarlar-hero">
        {/* key: revalidate sonrası URL değişince görsel tazelensin */}
        <img
          key={previews[template]}
          src={previews[template]}
          alt={copy.previewAlt(
            OG_TEMPLATE_OPTIONS.find((option) => option.id === template)?.label ?? "",
          )}
          width={1200}
          height={630}
        />
      </figure>

      <h3>{copy.templateTitle}</h3>
      <div className="ayarlar-template-grid" role="radiogroup" aria-label={copy.templateGroupLabel}>
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

      <h3>{copy.photoTitle}</h3>
      {imageBlocks.length === 0 ? (
        <p className="ayarlar-hint">{copy.photoEmptyHint}</p>
      ) : (
        <>
          <p className="ayarlar-hint">{copy.photoHint}</p>
          <div className="ayarlar-photo-grid" role="radiogroup" aria-label={copy.photoGroupLabel}>
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
              <span>{copy.photoDefaultLabel}</span>
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
                <span>{block.title || copy.photoFallbackLabel(index)}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
