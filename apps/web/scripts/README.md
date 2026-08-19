# `apps/web/scripts/` — landing vitrini laboratuvarı

Bu klasördeki dört betik yalnız **landing vitrininin mockup'larını üretmek**
için var. Uygulama çalışma zamanının hiçbiri bunlara bakmaz; Worker paketine
girmezler.

| Betik | Ne yapar |
| --- | --- |
| `lab-tohum.mjs` | Persona düzenlerinin galeri/avatar/belge varlıklarını **yerel** R2'ye yazar (`wrangler r2 object put --local`). Uzak kovaya dokunmaz. |
| `lab-denetim.mjs` | `/__lab/karakterler` DOM'unu tarar; kartlarda **yer tutucu** (baş harf çipi, boş avatar) kalmışsa listeler ve 1 ile çıkar. Çekimden önce sıfır bulgu vermeli. |
| `lab-cek.mjs` | Altı kartı 2x DPR ile çeker, `app/assets/landing/vitrin/<id>.webp` üretir. |
| `lab-telefon.mjs` | Kişisiz, **saydam zeminli** tek telefon (`?tel=1` modu). Giriş ve kayıt sayfaları bunu kullanır: `telefon-<id>.webp`. |

Sıra: `lab-tohum.mjs` → `pnpm dev` → `lab-denetim.mjs` → `lab-cek.mjs`
(+ gerekiyorsa `lab-telefon.mjs`).
Ayrıntı ve gerekçeler `app/routes/lab.karakterler.tsx` başlığında.

Çıktıların nereye gittiği:

| Varlık | Kullanan |
| --- | --- |
| `vitrin/<id>.webp` (6) | Landing karakter şeridi (`components/landing/karakterler-section.tsx`) |
| `../assets/landing/scene-kaan.webp`, `scene-ozan.webp` | Hero şeridi; `kaan.webp`/`ozan.webp` karelerinden elle kırpma (`assets/landing/README.md` §4) |
| `vitrin/telefon-busra.webp` | `routes/login.tsx` sağ panel + `routes/onboarding.tsx` |

## Neden `playwright` bir devDependency

`playwright` **sadece** bu üç çekim/denetim betiği tarafından import edilir
(`lab-cek.mjs`, `lab-telefon.mjs`, `lab-denetim.mjs`); `app/` veya `server/`
altındaki hiçbir modül ona dokunmaz.

- Bu yüzden `devDependencies`'te durur ve **üretim kurulumunu şişirmez**:
  Worker paketi Vite'ın import grafiğinden doğar, oraya girmeyen bir paket
  `wrangler deploy` çıktısında da yoktur (`pnpm --filter @caka/web run deploy`
  → `build → migrations → deploy`).
- Tarayıcı ikilisi ayrı bir adımdır ve **kurulumla gelmez**: gerekirse elle
  `pnpm exec playwright install chromium` çalıştırılır. Kurulum/derleme
  hattında bu komut yoktur, yani CI de yüzlerce megabaytlık Chromium indirmez.
- Ekran görüntüsü almayacaksanız `playwright`'a hiç ihtiyacınız yok; bu
  klasörün dışında hiçbir şey çalışmaz hâle gelmez.

Alternatif — betikleri ayrı bir pakete taşımak — bilinçli olarak yapılmadı:
betikler `app/assets/landing/` ve `app/content/landing/` ile aynı depoda ve
aynı sürümde durmalı, yoksa kart tasarımı değişince mockup üreteci sessizce
eskir.
