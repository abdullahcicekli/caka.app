// Laboratuvar denetimi: vitrin kartlarında YER TUTUCU kalıp kalmadığını
// ÖLÇER. Gözle aramak yerine DOM'a soruyoruz — "K", "KA" gibi baş harf
// çipleri kartın içinde küçük durur ve gözden kaçar.
//
// Kullanım (apps/web içinden, `pnpm dev` AÇIKKEN):
//   node scripts/lab-denetim.mjs [port]
//
// Çıkış kodu 0 → temiz. 1 → en az bir yer tutucu var (listeler).
//
// Aradıkları (hepsi ürünün kendi "görsel yoksa" dalları):
//   • bağlantı kartı  → `.link-mark` içindeki alan adı baş harfi
//                       (favicon yüklendiyse harfin üstünü kapatır)
//   • sosyal kart     → `.platform-mark` marka ikonu da favicon'u da yoksa
//   • youtube kanalı  → `.yt-avatar-empty` baş harf çipi
//   • profil kartı    → avatar görseli yoksa `initials()` dairesi
//   • genel süpürge   → yukarıdakilere girmeyen, 1-2 harflik çip görünümlü
//                       yaprak düğümler (yeni bir yer tutucu dalı eklenirse
//                       burada görünür)

import { chromium } from "playwright";

const port = process.argv[2] ?? "5190";

const tarayici = await chromium.launch();
const baglam = await tarayici.newContext({
  viewport: { width: 1200, height: 900 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
});
const sayfa = await baglam.newPage();
await sayfa.goto(`http://localhost:${port}/__lab/karakterler`, { waitUntil: "networkidle" });
await sayfa.locator(".lab-kart").first().waitFor({ state: "visible" });
await sayfa.evaluate(() => document.fonts.ready);
// Favicon'lar `loading="lazy"`: alttaki kartlar görüş alanına girmeden
// indirilmez ve denetim "yüklenmedi" derdi. Sayfayı sonuna kadar kaydır.
await sayfa.evaluate(async () => {
  for (const g of document.images) g.loading = "eager";
  window.scrollTo(0, document.body.scrollHeight);
  window.scrollTo(0, 0);
});
await sayfa.waitForFunction(() => [...document.images].every((g) => g.complete), null, {
  timeout: 20_000,
});

const bulgular = await sayfa.evaluate(() => {
  const cikti = [];
  const gorulen = new Set();
  const kayit = (tip, el) => {
    gorulen.add(el);
    cikti.push({
      tip,
      persona: el.closest(".lab-kart")?.dataset.persona ?? "?",
      blok: el.closest("[data-block-id]")?.dataset.blockId ?? "?",
      metin: (el.textContent ?? "").trim().slice(0, 12),
    });
  };
  const yuklendi = (img) => !!img && img.complete && img.naturalWidth > 0;

  for (const el of document.querySelectorAll(".profile-block-link .link-mark")) {
    if (!yuklendi(el.querySelector("img.mark-favicon"))) kayit("baglanti-harfi", el);
  }
  for (const el of document.querySelectorAll(".profile-block-social .platform-mark")) {
    if (el.querySelector("svg")) continue;
    if (!yuklendi(el.querySelector("img.mark-favicon"))) kayit("sosyal-isaretsiz", el);
  }
  for (const el of document.querySelectorAll(".yt-avatar-empty")) kayit("youtube-harfi", el);
  for (const el of document.querySelectorAll(".profile-block-profile > div[aria-hidden]")) {
    kayit("avatar-harfi", el);
  }

  // Genel süpürge: bilinen dalların dışında kalan kısa harf çipleri.
  const kisa = /^[\p{Lu}\p{N}]{1,2}$/u;
  for (const el of document.querySelectorAll(".profile-canvas *")) {
    if (el.children.length > 0) continue;
    if (gorulen.has(el)) continue;
    if ([...gorulen].some((g) => g.contains(el))) continue;
    const metin = (el.textContent ?? "").trim();
    if (metin && kisa.test(metin)) kayit("supurge", el);
  }
  return cikti;
});

await baglam.close();
await tarayici.close();

if (bulgular.length === 0) {
  console.log("temiz: yer tutucu yok");
  process.exit(0);
}
console.log(`${bulgular.length} yer tutucu:`);
for (const b of bulgular) console.log(`  ${b.persona.padEnd(7)} ${b.blok.padEnd(18)} ${b.tip.padEnd(18)} "${b.metin}"`);
process.exit(1);
