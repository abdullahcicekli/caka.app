// Landing içeriğinin çevrilmeyen kısmı: görseller, süreler ve doğrulanmış
// hesap adresleri. Beş dil dosyası bunları buradan alır — aynı görselin beş
// kez import edilmesi ve zamanla ayrışması engellensin.

import creatorElif from "~/assets/landing/creator-elif.webp";
import creatorKerem from "~/assets/landing/creator-kerem.webp";
import creatorNaz from "~/assets/landing/creator-naz.webp";
import creatorSelin from "~/assets/landing/creator-selin.webp";
import shareCards from "~/assets/landing/share-cards.webp";

/**
 * Hero'daki akan vitrin kartı. Tamamen dekoratiftir; gerçek bir kullanıcıyı
 * temsil etmediği için görselin üzerinde isim/unvan yazısı taşımaz.
 */
export interface MarqueeItem {
  image: string;
}

export interface SocialLink {
  platform: "github";
  href: string;
  label: string;
}

export const CAKA_REPO_URL = "https://github.com/abdullahcicekli/caka.app";

export const landingAssets = {
  marquee: {
    durationSeconds: 30,
    items: [
      { image: creatorKerem },
      { image: creatorSelin },
      { image: creatorElif },
      { image: creatorNaz },
    ] satisfies MarqueeItem[],
  },
  shareImage: shareCards,
  // Yalnızca Caka'ya ait, var olduğu doğrulanmış hesaplar. `github.com/caka-app`
  // ve `x.com/cakaapp` 404 dönüyordu; `instagram.com/caka.app` ise Caka'ya ait
  // değil, o yüzden kaldırıldı. Bu liste `home.tsx`'teki Organization şemasının
  // `sameAs` alanını da besler — sahip olmadığımız hesabı kendimize mal etmeyiz.
  social: [
    {
      platform: "github",
      href: CAKA_REPO_URL,
      label: "GitHub",
    },
  ] satisfies SocialLink[],
  copyright: `© ${new Date().getFullYear()}`,
};
