// Tek personada kısa döngü denemesi: telefonun içindeki sayfa kayar, sonra
// başa döner. Kişi ve stüdyo sabit — hareket eden tek şey ÜRÜN.
//
// Kullanım (apps/web içinden, `pnpm dev` AÇIKKEN):
//   node scripts/lab-gif.mjs [port] [persona]
//
// Çıktı (ikisi de üretilir ki boyutları karşılaştırılabilsin):
//   app/assets/landing/vitrin/<id>-dongu.gif
//   app/assets/landing/vitrin/<id>-dongu.webp
//
// Kareler gidiş-dönüş (ping-pong): 0 → 240 → 0. Düz bir döngü son kareden
// ilkine zıplardı; gidiş-dönüş dikişsiz kapanır ve kare sayısını iki katına
// çıkarmaz.

import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const kok = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cikti = join(kok, "app/assets/landing/vitrin");
const gecici = join(kok, ".lab-dongu");

const port = process.argv[2] ?? "5173";
const id = process.argv[3] ?? "emre";

// 8 kare: 0, 60, 120, 180, 240, 180, 120, 60 → 240px'lik bir kaydırma.
const KARELER = [0, 60, 120, 180, 240, 180, 120, 60];
// Döngü küçük basılır: şeritteki kart 470px, 2x için 940 yeter — ama
// hareketli biçimlerde her piksel ağırlık demek, 700 seçildi.
const GENISLIK = 700;

mkdirSync(cikti, { recursive: true });
mkdirSync(gecici, { recursive: true });

const tarayici = await chromium.launch();
const baglam = await tarayici.newContext({
  viewport: { width: 1200, height: 900 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
});
const sayfa = await baglam.newPage();

const yollar = [];
for (const [i, kaydir] of KARELER.entries()) {
  await sayfa.goto(`http://localhost:${port}/__lab/karakterler?p=${id}&kaydir=${kaydir}`, {
    waitUntil: "networkidle",
  });
  await sayfa.evaluate(() => document.fonts.ready);
  await sayfa.waitForFunction(() =>
    [...document.images].every((g) => g.complete && g.naturalWidth > 0),
  );
  const yol = join(gecici, `${String(i).padStart(2, "0")}.png`);
  await sayfa.locator(".lab-kart").screenshot({ path: yol });
  yollar.push(yol);
}
await baglam.close();
await tarayici.close();

const gif = join(cikti, `${id}-dongu.gif`);
const webp = join(cikti, `${id}-dongu.webp`);

// GIF: 128 renk + Floyd-Steinberg. `-layers optimize` kareler arası farkı
// alır; burada karenin yalnız telefon kısmı değiştiği için kazanç büyük.
execFileSync("magick", [
  ...yollar,
  "-resize", `${GENISLIK}x`,
  "-colors", "128",
  "-dither", "FloydSteinberg",
  "-delay", "18",
  "-loop", "0",
  "-layers", "optimize",
  gif,
]);

// Animasyonlu WebP: aynı kareler, kayıplı sıkıştırma, renk kaybı yok.
execFileSync("magick", [
  ...yollar,
  "-resize", `${GENISLIK}x`,
  "-delay", "18",
  "-loop", "0",
  "-quality", "62",
  "-define", "webp:lossless=false",
  "-define", "webp:method=6",
  webp,
]);

rmSync(gecici, { recursive: true, force: true });
const kb = (p) => `${(statSync(p).size / 1024).toFixed(0)} KB`;
console.log(`${KARELER.length} kare, ${GENISLIK}px`);
console.log(`gif : ${kb(gif)}  ${gif}`);
console.log(`webp: ${kb(webp)}  ${webp}`);
