// Hero şeridi denetimi: YER TUTUCU ve TAŞMA arar — gözle değil, ölçerek.
//
// `lab-denetim.mjs` laboratuvar route'unu tarar; bu betik landing'in kendi
// şeridini (`.lp-tower`) tarar ve BEŞ DİLİ tek koşuda gezer. Baş harf çipi
// ("K", "O") kartın içinde küçük durur ve ekran görüntüsünde gözden kaçar;
// taşan bir durum metni de öyle.
//
// Kullanım (apps/web içinden, `pnpm dev` AÇIKKEN):
//   node scripts/serit-denetim.mjs [port]
//
// Çıkış kodu 0 → temiz. 1 → en az bir bulgu (listeler).
//
// Aradıkları:
//   • bağlantı kartı  → `.link-mark` içindeki alan adı baş harfi
//                       (favicon yüklendiyse harfin üstünü kapatır)
//   • sosyal kart     → `.platform-mark` marka ikonu da favicon'u da yoksa
//   • youtube kanalı  → `.yt-avatar-empty` baş harf çipi
//   • profil kartı    → avatar görseli yoksa `initials()` dairesi;
//                       ayrıca ad veya meslek satırı BOŞSA
//   • genel süpürge   → yukarıdakilere girmeyen, 1-2 harflik çip görünümlü
//                       yaprak düğümler
//   • taşma           → kartın metni kutusundan taşıyorsa (scrollWidth /
//                       scrollHeight kendi clientWidth/Height'ini aşıyorsa)
//   • tekrar          → aynı ad, kullanıcı adı veya alan adı şeritte iki kez
//
// Görünmeyen düğüm bulgu SAYILMAZ: `.link-mark` kapaklı kartta CSS ile
// gizlenmiş olabilir; ölçüt DOM'da olması değil, EKRANDA olması.

import { chromium } from "playwright";

const port = process.argv[2] ?? "5201";
const diller = ["/", "/en", "/es", "/pt-br", "/de"];

const tarayici = await chromium.launch();
const baglam = await tarayici.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
  // Dil kapısı `isbot`e bakıyor; çıplak fetch/curl bot sayılır (AGENTS.md).
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
});
const sayfa = await baglam.newPage();

const hepsi = [];
for (const yol of diller) {
  await sayfa.goto(`http://localhost:${port}${yol}`, { waitUntil: "networkidle" });
  await sayfa.locator(".lp-tower .profile-block").first().waitFor({ state: "visible" });
  await sayfa.evaluate(() => document.fonts.ready);
  await sayfa.waitForFunction(
    () => [...document.querySelectorAll(".lp-tower img")].every((g) => g.complete),
    null,
    { timeout: 20_000 },
  );

  const bulgular = await sayfa.evaluate(() => {
    const cikti = [];
    const gorulen = new Set();
    // Şerit listeyi üç kez basıyor (kesintisiz döngü); yalnız İLK kopyayı
    // denetle, yoksa her bulgu üç kez raporlanır.
    const kok = document.querySelector(".lp-tower");
    const ilkKopya = new Set();
    for (const satir of kok?.querySelectorAll(".lp-tower-run") ?? []) {
      const sutunlar = [...satir.children];
      for (const s of sutunlar.slice(0, sutunlar.length / 3)) ilkKopya.add(s);
    }
    const icerde = (el) => [...ilkKopya].some((s) => s.contains(el));
    const gorunur = (el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return false;
      const st = getComputedStyle(el);
      return st.visibility !== "hidden" && st.display !== "none" && Number(st.opacity) > 0.01;
    };
    const kayit = (tip, el, not = "") => {
      gorulen.add(el);
      cikti.push({
        tip,
        blok: el.closest("[data-block-id]")?.dataset.blockId ?? bloktan(el),
        metin: not || (el.textContent ?? "").trim().slice(0, 40),
      });
    };
    // Şeritte `data-block-id` yok; kartın kendi sınıfı kimliği kabaca verir.
    function bloktan(el) {
      const kart = el.closest(".profile-block");
      return kart ? [...kart.classList].find((c) => c.startsWith("profile-block-")) ?? "?" : "?";
    }
    const yuklendi = (img) => !!img && img.complete && img.naturalWidth > 0;

    for (const el of kok?.querySelectorAll(".profile-block-link .link-mark") ?? []) {
      if (!icerde(el) || !gorunur(el)) continue;
      if (!yuklendi(el.querySelector("img.mark-favicon"))) kayit("baglanti-harfi", el);
    }
    for (const el of kok?.querySelectorAll(".profile-block-social .platform-mark") ?? []) {
      if (!icerde(el) || !gorunur(el)) continue;
      if (el.querySelector("svg")) continue;
      if (!yuklendi(el.querySelector("img.mark-favicon"))) kayit("sosyal-isaretsiz", el);
    }
    for (const el of kok?.querySelectorAll(".yt-avatar-empty") ?? []) {
      if (icerde(el) && gorunur(el)) kayit("youtube-harfi", el);
    }
    // Profil kartı: avatar görseli yok (baş harf dairesi) ya da satırları boş.
    for (const kart of kok?.querySelectorAll(".profile-block-profile") ?? []) {
      if (!icerde(kart)) continue;
      const avatar = kart.querySelector("img");
      if (!yuklendi(avatar)) kayit("avatar-harfi", kart, "avatar yok");
      const ad = kart.querySelector("strong")?.textContent?.trim() ?? "";
      const meslek = kart.querySelector("p")?.textContent?.trim() ?? "";
      if (!ad) kayit("profil-adsiz", kart, "ad boş");
      if (!meslek) kayit("profil-mesleksiz", kart, `"${ad}" mesleksiz`);
    }

    // Genel süpürge: bilinen dalların dışında kalan kısa harf çipleri.
    const kisa = /^[\p{Lu}\p{N}]{1,2}$/u;
    for (const el of kok?.querySelectorAll(".profile-block *") ?? []) {
      if (!icerde(el) || el.children.length > 0 || gorulen.has(el)) continue;
      if ([...gorulen].some((g) => g.contains(el))) continue;
      if (!gorunur(el)) continue;
      const metin = (el.textContent ?? "").trim();
      if (metin && kisa.test(metin)) kayit("supurge", el);
    }

    // Taşma: metin düğümü kendi kutusundan taşıyor mu? 1px tolerans, alt
    // piksel yuvarlamaları bulgu üretmesin.
    for (const el of kok?.querySelectorAll(".profile-block strong, .profile-block small, .profile-block p, .profile-block span") ?? []) {
      if (!icerde(el) || !gorunur(el) || el.children.length > 0) continue;
      if (!(el.textContent ?? "").trim()) continue;
      // Dekoratif gliflerin (bağlantı oku "↗") satır kutusu yazı tipinin
      // kendi yüksekliğinden 1-2px taşıyor; bunlar metin değil, süs.
      if (el.hasAttribute("aria-hidden")) continue;
      const st = getComputedStyle(el);
      // `text-overflow: ellipsis` bilinçli kırpma; taşma sayılmaz.
      if (st.textOverflow === "ellipsis" || st.overflow === "hidden") continue;
      const tasmaX = el.scrollWidth - el.clientWidth;
      const tasmaY = el.scrollHeight - el.clientHeight;
      if (tasmaX > 1 || tasmaY > 1) {
        kayit("tasma", el, `${(el.textContent ?? "").trim().slice(0, 30)} (+${tasmaX}x${tasmaY})`);
      }
    }

    // Tekrar: aynı kimlik iki kez. Adlar, handle'lar ve alan adları.
    const kimlikler = [];
    for (const el of kok?.querySelectorAll(".profile-block-profile strong") ?? []) {
      if (icerde(el)) kimlikler.push((el.textContent ?? "").trim());
    }
    for (const el of kok?.querySelectorAll(".profile-block small") ?? []) {
      if (icerde(el)) kimlikler.push((el.textContent ?? "").trim());
    }
    const sayac = new Map();
    for (const k of kimlikler) if (k) sayac.set(k, (sayac.get(k) ?? 0) + 1);
    for (const [k, n] of sayac) {
      if (n > 1) cikti.push({ tip: "tekrar", blok: "-", metin: `"${k}" × ${n}` });
    }
    return cikti;
  });

  for (const b of bulgular) hepsi.push({ dil: yol, ...b });
}

await baglam.close();
await tarayici.close();

if (hepsi.length === 0) {
  console.log(`temiz: ${diller.length} dilde yer tutucu, taşma ve tekrar yok`);
  process.exit(0);
}
console.log(`${hepsi.length} bulgu:`);
for (const b of hepsi) {
  console.log(`  ${b.dil.padEnd(7)} ${String(b.blok).padEnd(24)} ${b.tip.padEnd(18)} "${b.metin}"`);
}
process.exit(1);
