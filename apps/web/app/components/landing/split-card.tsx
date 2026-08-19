import type { ReactNode } from "react";

import { PillLink } from "./pill-button";
import type { Cta } from "~/content/landing";
import { useHref } from "~/lib/locale";

interface SplitCardProps {
  title: string;
  body: string;
  cta: Cta;
  /** Medya kartının üzerindeki rozetler. Sayı iddiası taşımaz (R25). */
  badges: readonly string[];
  /** Medya kartının altındaki başlık pili. */
  pill: string;
  media: ReactNode;
  /**
   * Medya kartı GENİŞ EKRANDA solda dursun mu? Bölümler arasında ritim
   * değişsin diye. Yalnız görsel sıra değişir: DOM her zaman metin → medya,
   * yani dar ekranda ve ekran okuyucuda okuma sırası bozulmaz.
   */
  mediaFirst?: boolean;
}

/**
 * Bölünmüş kart: bir yanda metin kartı, öbür yanda medya kartı.
 *
 * Referanstaki "duraklat" düğmesi BİLİNÇLİ OLARAK YOK: buradaki medya duran
 * bir illüstrasyon, duraklatacak bir hareket yok. Var olmayan bir denetimi
 * taklit etmek yerine düğme hiç konmadı (hareketli olan tek yüzey hero
 * şeridi ve orada gerçek bir durdurma düğmesi var).
 */
export function SplitCard({
  title,
  body,
  cta,
  badges,
  pill,
  media,
  mediaFirst = false,
}: SplitCardProps) {
  const localize = useHref();

  const text = (
    <div className="lp-card lp-card-text">
      <h2 className="lp-h3 whitespace-pre-line">{title}</h2>
      <div className="flex flex-col items-start gap-7">
        <p className="lp-body lp-measure">{body}</p>
        <PillLink to={localize(cta.href)} variant="ink">
          {cta.label}
        </PillLink>
      </div>
    </div>
  );

  const mediaCard = (
    <div className="lp-card-media">
      {media}
      <div className="lp-badges">
        {badges.map((badge) => (
          <span key={badge} className="lp-badge">
            {badge}
          </span>
        ))}
      </div>
      <span className="lp-title-pill">{pill}</span>
    </div>
  );

  return (
    <div className={`lp-split${mediaFirst ? " lp-split-reverse" : ""}`}>
      {text}
      {mediaCard}
    </div>
  );
}
