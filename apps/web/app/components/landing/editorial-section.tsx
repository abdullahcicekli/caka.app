import type { LandingContent } from "~/content/landing";

/**
 * Medyadan sonra gelen editoryal blok: tek cümle, büyük punto, geniş boşluk.
 * Sayfanın vaadini başlıktan sonra bir kez daha, tam cümle hâlinde söyler.
 */
export function EditorialSection({
  editorial,
}: {
  editorial: LandingContent["editorial"];
}) {
  return (
    <section id="urun" className="lp-section-tight lp-shell lp-anchor">
      <p className="lp-lede max-w-[22ch] sm:max-w-[26ch]">{editorial.body}</p>
    </section>
  );
}
