// Hata ve 404 yüzeylerinin ortak kabuğu.
//
// Üç yerden kullanılır: kök hata sınırı (`root.tsx`), profil 404'ü ve "bu adres
// boşta" sayfası (`routes/username.tsx`). Üçü de aynı iskeleti paylaşır —
// başlık, açıklama, bir birincil bir ikincil eylem, altta tam genişlik
// illüstrasyon.
//
// İLLÜSTRASYON DEKORATİFTİR ama `alt` metni yine de katalogdadır: ekran
// okuyucu kullanan biri sayfanın boş olmadığını bilmeli. `aria-hidden`
// kullanılmadı çünkü görsel sayfanın karakterini taşıyor.
//
// Hareket CSS'tedir ve `alternate` yönlüdür: döngü noktası olmadığı için
// dikiş/kesilme oluşmaz. `prefers-reduced-motion` açıkken tamamen durur
// (bkz. app.css "error-art").

import type { ReactNode } from "react";
import { Link } from "react-router";

import notFoundArt from "~/assets/error/not-found.webp";
import notFoundArtSmall from "~/assets/error/not-found-sm.webp";
import { appCatalog } from "~/content/app";
import { useCatalog, useHref } from "~/lib/locale";

export interface ErrorAction {
  label: string;
  /** Türkçe hâliyle yazılır; render'da ziyaretçinin diline çevrilir. */
  href: string;
}

export function ErrorPage({
  kicker,
  title,
  body,
  primary,
  secondary,
  children,
}: {
  kicker?: string;
  title: string;
  body: string;
  primary: ErrorAction;
  secondary?: ErrorAction;
  /** Dev'de yığın izi gibi ek içerik. */
  children?: ReactNode;
}) {
  const app = useCatalog(appCatalog);
  const localize = useHref();

  return (
    <main className="error-page">
      <div className="error-copy">
        {kicker ? <p className="error-kicker">{kicker}</p> : null}
        <h1>{title}</h1>
        <p className="error-body">{body}</p>

        <div className="error-actions">
          <Link to={localize(primary.href)} className="error-action is-primary">
            {primary.label}
          </Link>
          {secondary ? (
            <Link to={localize(secondary.href)} className="error-action">
              {secondary.label}
            </Link>
          ) : null}
        </div>

        {children}
      </div>

      <div className="error-art">
        <img
          src={notFoundArt}
          srcSet={`${notFoundArtSmall} 960w, ${notFoundArt} 1920w`}
          sizes="100vw"
          alt={app.errors.illustrationAlt}
          width={1920}
          height={1047}
          // Hata sayfası ilk boyanan şeydir; görselin geç gelmesi yerine
          // metinle birlikte gelmesi isteniyor.
          fetchPriority="high"
          decoding="async"
        />
      </div>
    </main>
  );
}
