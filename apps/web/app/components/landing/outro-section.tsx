import { logoBlack } from "~/assets/brand";
import type { LandingContent } from "~/content/landing";

/**
 * Sayfanın en altındaki kireç alan: kısa bir cümle, üç hap bilgi, ortada
 * logo işareti.
 *
 * Referansta bu haplarda tarih, konum ve hava durumu var. Burada YOK ve
 * bilinçli: o değerler istemcide hesaplanır, sunucu çıktısıyla ilk render
 * ayrışır ve hidrasyon kırılırdı. Yerlerine sabit, doğrulanabilir üç ifade
 * kondu (katalogda `outro.pills`).
 */
export function OutroSection({ outro }: { outro: LandingContent["outro"] }) {
  return (
    <section className="lp-outro">
      <p className="lp-outro-line">{outro.line}</p>
      <ul className="lp-outro-pills">
        {outro.pills.map((pill) => (
          <li key={pill} className="lp-outro-pill">
            {pill}
          </li>
        ))}
      </ul>
      <div className="lp-outro-mark">
        <img src={logoBlack} alt="Caka" width={34} height={34} />
      </div>
    </section>
  );
}
