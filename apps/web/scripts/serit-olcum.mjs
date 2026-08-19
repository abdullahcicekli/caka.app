// Hero şeridinin görsel çözünürlük denetimi.
//
// Kullanım (apps/web içinden, `pnpm dev` AÇIKKEN):
//   node scripts/serit-olcum.mjs [port]
//
// Ne ölçer: landing'deki her `<img>` için `naturalWidth/Height` ile GERÇEK
// render kutusunu karşılaştırır ve `object-fit`e göre kaynağın kutuya
// oturmak için uygulanan ölçeğini hesaplar.
//
//   cover   → ölçek = max(kutuW/kaynakW, kutuH/kaynakH)
//   contain → ölçek = min(...)
//   fill    → eksenler ayrı ayrı
//
// KAPI: ölçek ≤ 0,5 olmalı. Yani kaynak, kutunun **iki katı** aygıt pikselini
// karşılamalı — DPR 2 ekranda (her modern telefon ve Retina masaüstü)
// büyütmeden basılabilsin. Ölçek 0,5'i aşan her görsel İHLALDİR ve betik 1
// ile çıkar.
//
// Neden gözle değil ölçerek: şerit kartları konteyner sorgusuyla bant
// değiştiriyor, aynı görsel iki farklı kutuda iki farklı ölçekte basılıyor.
// "Bulanık duruyor" bakışı hangi kutunun suçlu olduğunu söylemiyor.

import { chromium } from "playwright";

const port = process.argv[2] ?? "5173";
const HEDEF_DPR = 2;

const tarayici = await chromium.launch();
// 1440 genişlik: üçüncü satır (`.lp-tower-row[data-row="2"]`) yalnız 1280'den
// itibaren basılıyor; dar ekranda ölçülmeyen kartlar kalırdı.
const baglam = await tarayici.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
});
const sayfa = await baglam.newPage();
await sayfa.goto(`http://localhost:${port}/`, { waitUntil: "networkidle" });
await sayfa.evaluate(() => document.fonts.ready);
// Yerel görsellerin inmesini bekle. `every(complete)` KULLANILMAZ: şeritte
// hiç yüklenmeyecek uzak adresler de var (kartların kayıtlı `ogImage`'ları
// yer tutucudur, render `signedImages`ten okur) ve betik onları beklerken
// dolardı. Ölçüm zaten `naturalWidth === 0` olanı atlıyor.
await sayfa.waitForFunction(
  () => [...document.images].filter((g) => g.naturalWidth > 0).length > 0,
  null,
  { timeout: 30_000 },
);
await sayfa.waitForTimeout(2500);

const olcumler = await sayfa.evaluate(() => {
  const kaynakAdi = (url) => url.split("/").pop()?.split("?")[0] ?? url;
  return [...document.images].map((g) => {
    const kutu = g.getBoundingClientRect();
    const stil = getComputedStyle(g);
    const serit = Boolean(g.closest(".lp-hero-media"));
    return {
      dosya: kaynakAdi(g.currentSrc || g.src),
      serit,
      alan: serit ? "şerit" : "sayfa",
      blok: g.closest("[data-block-id]")?.getAttribute("data-block-id") ?? "",
      kutuW: Math.round(kutu.width * 100) / 100,
      kutuH: Math.round(kutu.height * 100) / 100,
      dogalW: g.naturalWidth,
      dogalH: g.naturalHeight,
      fit: stil.objectFit,
    };
  });
});

function olcek(o) {
  if (!o.dogalW || !o.dogalH || !o.kutuW || !o.kutuH) return null;
  const x = o.kutuW / o.dogalW;
  const y = o.kutuH / o.dogalH;
  if (o.fit === "contain" || o.fit === "scale-down") return Math.min(x, y);
  if (o.fit === "fill" || o.fit === "none") return Math.max(x, y);
  return Math.max(x, y); // cover (varsayılan `.social-og img` davranışı)
}

// Aynı dosya birden çok kutuda geçebilir; EN BÜYÜK ölçek belirleyicidir.
const enKotu = new Map();
for (const o of olcumler) {
  const s = olcek(o);
  if (s === null) continue;
  const onceki = enKotu.get(o.dosya);
  if (!onceki || s > onceki.olcek) enKotu.set(o.dosya, { ...o, olcek: s });
}

const siralı = [...enKotu.values()].sort((a, b) => b.olcek - a.olcek);
const kapi = 1 / HEDEF_DPR;
let ihlal = 0;

console.log(
  `${"dosya".padEnd(26)} ${"alan".padEnd(6)} ${"kutu".padEnd(12)} ${"kaynak".padEnd(11)} ${"fit".padEnd(8)} ölçek  gereken`,
);
for (const o of siralı) {
  const bozuk = o.olcek > kapi + 1e-6;
  if (bozuk && o.serit) ihlal += 1;
  const gerekenW = Math.ceil(o.kutuW * HEDEF_DPR);
  const gerekenH = Math.ceil(o.kutuH * HEDEF_DPR);
  console.log(
    `${(bozuk ? "✗ " : "✓ ") + o.dosya.padEnd(24)} ` +
      `${o.alan.padEnd(6)} ` +
      `${`${Math.round(o.kutuW)}×${Math.round(o.kutuH)}`.padEnd(12)} ` +
      `${`${o.dogalW}×${o.dogalH}`.padEnd(11)} ` +
      `${o.fit.padEnd(8)} ` +
      `${o.olcek.toFixed(3)}  ${gerekenW}×${gerekenH}`,
  );
}

await baglam.close();
await tarayici.close();

console.log(
  ihlal === 0
    ? `\nŞeritte ihlal yok (${siralı.filter((o) => o.serit).length} görsel, kapı: ölçek ≤ ${kapi}).`
    : `\nŞeritte ${ihlal} ihlal.`,
);
process.exit(ihlal === 0 ? 0 : 1);
