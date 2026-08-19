// Landing içeriğinin çevrilmeyen kısmı: görseller, süreler ve doğrulanmış
// hesap adresleri. Beş dil dosyası bunları buradan alır — aynı görselin beş
// kez import edilmesi ve zamanla ayrışması engellensin.

import menuDesk from "~/assets/landing/menu-desk.webp";
import shareCards from "~/assets/landing/share-cards.webp";

export interface SocialLink {
  platform: "github";
  href: string;
  label: string;
}

export const CAKA_REPO_URL = "https://github.com/abdullahcicekli/caka.app";

export const landingAssets = {
  shareImage: shareCards,
  // Menü katmanındaki medya kartı. Persona portresi DEĞİL: menü kartının
  // cümlesi ("Bağlantı, fotoğraf, müzik, harita — hepsi tek ızgarada")
  // ürünü anlatıyor, bir kişiyi değil. Görsel de onu gösteriyor: kare
  // bloklardan bir ızgara, yanında plak, kulaklık ve harita. Portre orada
  // dururken menü "bir yaratıcı" vaat ediyor, kart ise düzeni anlatıyordu.
  menuImage: menuDesk,
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
