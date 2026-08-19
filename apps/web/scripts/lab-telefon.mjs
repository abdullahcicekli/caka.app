// "Yalnız telefon" varlığı: kişi ve stüdyo olmadan, SAYDAM zeminde duran bir
// telefon. Giriş ve kayıt sayfaları bunu kullanıyor — oralarda arkadaki zemin
// sayfanın kendi rengi (giriş panelinde kireç, kayıtta beyaz), o yüzden alfa
// şart ve tek varlık iki sayfaya yetiyor.
//
// Kullanım (apps/web içinden, `pnpm dev` AÇIKKEN):
//   node scripts/lab-telefon.mjs [port] [persona]
//
// Çıktı: app/assets/landing/vitrin/telefon-<id>.webp
//
// NEDEN MOCKUP, NEDEN CANLI RENDER DEĞİL: `ProfileCanvas`'ı giriş sayfasına
// koymak tüm blok bileşenlerini ve laboratuvar görsellerini dönüşüm yolunun
// üstündeki bir sayfanın paketine sokardı. Mockup tek bir görsel isteği; üstelik
// `lazy` yükleniyor. Kart tasarımı değişince bu betik yeniden çalıştırılır.

import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const kok = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cikti = join(kok, "app/assets/landing/vitrin");
const gecici = join(kok, ".lab-telefon");

const port = process.argv[2] ?? "5173";
const id = process.argv[3] ?? "busra";

// Sahne 480×882 CSS; 2x DPR ile 960×1764 çekilip 640 genişliğe indiriliyor.
// Görsel hiçbir yerde 320 CSS pikselden geniş gösterilmiyor, 2x için 640 yeter.
const GENISLIK = 640;

mkdirSync(cikti, { recursive: true });
mkdirSync(gecici, { recursive: true });

const tarayici = await chromium.launch();
const baglam = await tarayici.newContext({
  viewport: { width: 640, height: 1000 },
  deviceScaleFactor: 2,
  reducedMotion: "reduce",
});
const sayfa = await baglam.newPage();

await sayfa.goto(`http://localhost:${port}/__lab/karakterler?p=${id}&tel=1`, {
  waitUntil: "networkidle",
});
const sahne = sayfa.locator(".lab-sahne");
await sahne.waitFor({ state: "visible" });
await sayfa.evaluate(() => document.fonts.ready);
await sayfa.waitForFunction(() =>
  [...document.images].every((g) => g.complete && g.naturalWidth > 0),
);

const ham = join(gecici, `${id}.png`);
// `omitBackground`: sayfa zemini saydam kalsın ki telefonun yuvarlak
// köşelerinden ve gölgesinden arkadaki sayfa rengi görünsün.
await sahne.screenshot({ path: ham, omitBackground: true });

const hedef = join(cikti, `telefon-${id}.webp`);
execFileSync("magick", [
  ham,
  "-resize", `${GENISLIK}x`,
  "-quality", "74",
  "-define", "webp:method=6",
  // Alfa kanalı korunmalı; kayıplı webp bunu destekliyor.
  "-define", "webp:alpha-quality=90",
  hedef,
]);

await baglam.close();
await tarayici.close();
rmSync(gecici, { recursive: true, force: true });
console.log(`${hedef}  ${(statSync(hedef).size / 1024).toFixed(0)} KB`);
