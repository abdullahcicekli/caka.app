/**
 * Karakter şeridinin ÜRETİME giden kısmı: altı mockup görseli + çevrilmeyen
 * kimlik bilgisi (isim, meslek kimliği, zemin rengi).
 *
 * `personas.ts`'ten AYRI bir dosya olmasının tek nedeni paket ağırlığı:
 * `personas.ts` düzenleri, avatarları, kart fotoğraflarını ve stüdyo
 * karelerini import eder (yirmi küsur dosya, ~2 MB) ve yalnız laboratuvar
 * route'unda kullanılır. Landing o modüle dokunsaydı hepsi üretim paketine
 * girerdi. Burada yalnız çekilmiş webp'ler var.
 *
 * `job` bir KİMLİKTİR, metin değil: meslek adı beş dil kataloğunda yaşar
 * (`karakterler.jobs`, Değişmez #5).
 */

import type { PersonaJob } from "./personas";

import busra from "~/assets/landing/vitrin/busra.webp";
import emre from "~/assets/landing/vitrin/emre.webp";
import kaan from "~/assets/landing/vitrin/kaan.webp";
import emreDongu from "~/assets/landing/vitrin/emre-dongu.webp";
import ozan from "~/assets/landing/vitrin/ozan.webp";
import serkan from "~/assets/landing/vitrin/serkan.webp";
import zeynep from "~/assets/landing/vitrin/zeynep.webp";

export interface KarakterKarti {
  id: string;
  name: string;
  job: PersonaJob;
  /** Kartın kendi rengi; şerit kaydırılırken zemin buna göre değişir. */
  backdrop: string;
  image: string;
  /**
   * Kısa döngü (animasyonlu webp): telefondaki sayfa kayar, kişi ve stüdyo
   * sabit kalır. YALNIZ BİR KARTTA var ve bilinçli: altı kart birden
   * kıpırdasaydı şerit bir reklam panosuna dönerdi; bir tanesi hareket
   * edince göz oraya gidiyor ve "içindeki gerçek bir sayfa" fikri
   * kendiliğinden anlaşılıyor.
   *
   * GIF DENENDİ, ELENDİ: aynı sekiz kare GIF olarak 456 KB (128 renk,
   * gradyan zeminde gözle görülür bantlanma), animasyonlu webp olarak
   * 66 KB ve kayıpsız görünüm. Ölçüldü, bkz. `scripts/lab-gif.mjs`.
   */
  loop?: string;
}

/**
 * Sıra bilinçli: renkler ardışık kartlarda çarpışmasın (mavi → turuncu →
 * yeşil → mor → kum → turkuaz) ve meslekler dönüşümlü olsun.
 */
export const KARAKTER_KARTLARI: KarakterKarti[] = [
  { id: "emre", name: "Emre Kılıç", job: "yazilimci", backdrop: "#14356f", image: emre, loop: emreDongu },
  { id: "kaan", name: "Kaan Demirtaş", job: "youtuber", backdrop: "#e2542a", image: kaan },
  { id: "serkan", name: "Serkan Yıldız", job: "sporHocasi", backdrop: "#4cb63a", image: serkan },
  { id: "ozan", name: "Ozan Şahin", job: "muzisyen", backdrop: "#6a2ba0", image: ozan },
  { id: "zeynep", name: "Zeynep Aydın", job: "gazeteci", backdrop: "#c98a3a", image: zeynep },
  { id: "busra", name: "Büşra Kaya", job: "diyetisyen", backdrop: "#69bab4", image: busra },
];
