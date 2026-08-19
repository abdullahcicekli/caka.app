// Vitrin mockup'larının çekimi: laboratuvar route'unu 2x DPR ile açar, her
// personanın kartını tam sınırından kırpar ve webp'e çevirir.
//
// Kullanım (apps/web içinden, `pnpm dev` AÇIKKEN):
//   node scripts/lab-cek.mjs [port] [persona...]
//
// Örnek:  node scripts/lab-cek.mjs 5173          → altısı da
//         node scripts/lab-cek.mjs 5173 emre     → yalnız biri
//
// Çıktı: app/assets/landing/vitrin/<id>.webp (1400×1050)
//
// Playwright zaten devDependency; ImageMagick (`magick`) sistemden gelir.
// Görsel işleme kütüphanesi eklenmedi — çekim zaten tarayıcıda yapılıyor,
// tek gereken kırpma/çevirme.

import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const kok = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cikti = join(kok, "app/assets/landing/vitrin");
const gecici = join(kok, ".lab-cekim");

const port = process.argv[2] ?? "5173";
const secilenler = process.argv.slice(3);
const HEPSI = ["emre", "kaan", "serkan", "ozan", "zeynep", "busra"];
const liste = secilenler.length ? secilenler : HEPSI;

// Kart 1200×900 CSS; 2x DPR ile 2400×1800 çekilir, teslim 1400×1050.
const KART = { w: 1200, h: 900 };
const TESLIM = "1400x1050";

mkdirSync(cikti, { recursive: true });
mkdirSync(gecici, { recursive: true });

const tarayici = await chromium.launch();
const baglam = await tarayici.newContext({
  viewport: { width: KART.w, height: KART.h },
  deviceScaleFactor: 2,
  // Hareket azaltma: kartların giriş animasyonu (app.css `@media
  // (prefers-reduced-motion: no-preference)`) çekim anında yarım kalabilir.
  reducedMotion: "reduce",
});
const sayfa = await baglam.newPage();

for (const id of liste) {
  await sayfa.goto(`http://localhost:${port}/__lab/karakterler?p=${id}`, {
    waitUntil: "networkidle",
  });
  const kart = sayfa.locator(".lab-kart");
  await kart.waitFor({ state: "visible" });
  // Yazı tipleri ve görseller: ikisi de yerinde olmadan çekmek kaymış bir
  // altyazı ya da boş bir kart üretir.
  await sayfa.evaluate(() => document.fonts.ready);
  await sayfa.waitForFunction(() =>
    [...document.images].every((g) => g.complete && g.naturalWidth > 0),
  );
  const ham = join(gecici, `${id}.png`);
  await kart.screenshot({ path: ham });
  const hedef = join(cikti, `${id}.webp`);
  execFileSync("magick", [ham, "-resize", TESLIM, "-quality", "76", "-define", "webp:method=6", hedef]);
  console.log(`${id} → ${hedef}`);
}

await baglam.close();
await tarayici.close();
rmSync(gecici, { recursive: true, force: true });
console.log(`${liste.length} kart çekildi.`);
