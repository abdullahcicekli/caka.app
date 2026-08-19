// Laboratuvar tohumlaması: vitrin personalarının galeri fotoğraflarını,
// avatarlarını ve belgelerini YEREL R2'ye yazar.
//
// NEDEN GEREKLİ: galeri, avatar ve belge kartları asset kimliğine bakar ve
// görseli ürünün kendi yollarından okur (`/i/<uuid>`, `/b/<uuid>` —
// Değişmez #9). Laboratuvarda bu yolları taklit etmek yerine gerçek kovaya
// yazıyoruz; böylece telefonun içi ürünün ta kendisi kalıyor.
//
// Kullanım (apps/web içinden, `pnpm dev` kapalıyken de olur):
//   node scripts/lab-tohum.mjs
//
// Yalnız YEREL kovaya yazar (`--local`). Uzak kovaya asla dokunmaz.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const kok = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const varlikDizini = join(kok, "app/assets/landing/lab");
const kartDizini = join(varlikDizini, "kart");
const KOVA = "caka-assets";

// Düzenlerdeki kimliklerin tek kaynağı `personas.ts`; burada TypeScript
// okuyamadığımız için aynı tablo elle tutulur. İkisi ayrışırsa kart boş
// kalır (kırık görsel değil) — o yüzden liste kısa ve bir arada duruyor.
const AVATARLAR = [
  ["a0000000-0000-4000-8000-000000000001", "avatar-emre.jpg"],
  ["a0000000-0000-4000-8000-000000000002", "avatar-kaan.jpg"],
  ["a0000000-0000-4000-8000-000000000003", "avatar-serkan.jpg"],
  ["a0000000-0000-4000-8000-000000000004", "avatar-ozan.jpg"],
  ["a0000000-0000-4000-8000-000000000005", "avatar-zeynep.jpg"],
  ["a0000000-0000-4000-8000-000000000006", "avatar-busra.jpg"],
];

const foto = (n) => `9a110000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const FOTOGRAFLAR = [
  [foto(11), "kaan-galeri-1.jpg"],
  [foto(12), "kaan-galeri-2.jpg"],
  [foto(13), "kaan-galeri-3.jpg"],
  [foto(21), "serkan-galeri-1.jpg"],
  [foto(22), "serkan-galeri-2.jpg"],
  [foto(23), "serkan-galeri-3.jpg"],
  [foto(31), "ozan-galeri-1.jpg"],
  [foto(32), "ozan-galeri-2.jpg"],
  [foto(33), "ozan-galeri-3.jpg"],
  [foto(41), "busra-galeri-1.jpg"],
  [foto(42), "busra-galeri-2.jpg"],
  [foto(43), "busra-galeri-3.jpg"],
];

const belge = (n) => `d0c00000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const BELGELER = [
  [belge(1), "belge.pdf"],
  [belge(2), "belge.pdf"],
];

/** Belge kartı yalnız ad/boyut/tarih basar; içerik dolgu bir PDF olabilir. */
function belgeUret(yol) {
  if (existsSync(yol)) return;
  const govde =
    "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
    "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
    "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj\n" +
    "trailer<</Root 1 0 R>>\n%%EOF\n";
  mkdirSync(dirname(yol), { recursive: true });
  writeFileSync(yol, govde, "latin1");
}

function yaz(id, dosya, tur, dizin) {
  const yol = join(dizin, dosya);
  if (!existsSync(yol)) {
    console.warn(`atlandı (dosya yok): ${dosya}`);
    return false;
  }
  execFileSync(
    "pnpm",
    ["exec", "wrangler", "r2", "object", "put", `${KOVA}/${id}`, "--file", yol, "--local", "--content-type", tur],
    { cwd: kok, stdio: ["ignore", "ignore", "inherit"] },
  );
  return true;
}

belgeUret(join(kartDizini, "belge.pdf"));

let sayi = 0;
for (const [id, dosya] of AVATARLAR) sayi += yaz(id, dosya, "image/jpeg", varlikDizini) ? 1 : 0;
for (const [id, dosya] of FOTOGRAFLAR) sayi += yaz(id, dosya, "image/jpeg", kartDizini) ? 1 : 0;
for (const [id, dosya] of BELGELER) sayi += yaz(id, dosya, "application/pdf", kartDizini) ? 1 : 0;

console.log(`yerel R2'ye ${sayi} nesne yazıldı (kova: ${KOVA})`);
