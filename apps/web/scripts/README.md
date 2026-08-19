# `apps/web/scripts/` — landing vitrini laboratuvarı

Bu klasördeki beş betik yalnız **landing görsellerini üretmek ve denetlemek**
için var. Uygulama çalışma zamanının hiçbiri bunlara bakmaz; Worker paketine
girmezler.

| Betik | Ne yapar |
| --- | --- |
| `lab-tohum.mjs` | Persona düzenlerinin galeri/avatar/belge varlıklarını **yerel** R2'ye yazar (`wrangler r2 object put --local`). Uzak kovaya dokunmaz. |
| `lab-denetim.mjs` | `/__lab/karakterler` DOM'unu tarar; kartlarda **yer tutucu** (baş harf çipi, boş avatar) kalmışsa listeler ve 1 ile çıkar. Çekimden önce sıfır bulgu vermeli. |
| `lab-cek.mjs` | Altı kartı 2x DPR ile çeker, `app/assets/landing/vitrin/<id>.webp` üretir. |
| `lab-telefon.mjs` | Kişisiz, **saydam zeminli** tek telefon (`?tel=1` modu). Giriş ve kayıt sayfaları bunu kullanır: `telefon-<id>.webp`. |
| `serit-olcum.mjs` | Landing'deki her `<img>` için `naturalWidth`i gerçek render kutusuyla karşılaştırır; DPR 2 kapısını (ölçek ≤ 0,5) geçmeyen görsel varsa 1 ile çıkar. Kapının gerekçesi `app/assets/landing/README.md` başında. |
| `serit-denetim.mjs` | Hero şeridini **beş dilde** tarar: baş harf çipi, avatarsız/adsız/mesleksiz profil kartı, kutusundan taşan metin ve aynı kimliğin iki kez geçmesi. Bulgu varsa listeler ve 1 ile çıkar. `lab-denetim.mjs`in landing karşılığı. |

Sıra: `lab-tohum.mjs` → `pnpm dev` → `lab-denetim.mjs` → `lab-cek.mjs`
(+ gerekiyorsa `lab-telefon.mjs`). Landing görseli veya şerit kadrosu
değişince `serit-olcum.mjs` ve `serit-denetim.mjs` ayrıca çalıştırılır —
laboratuvar hattına bağlı değillerdir, `pnpm dev` yeter.
Ayrıntı ve gerekçeler `app/routes/lab.karakterler.tsx` başlığında.

Çıktıların nereye gittiği:

| Varlık | Kullanan |
| --- | --- |
| `vitrin/<id>.webp` (6) | Landing karakter şeridi (`components/landing/karakterler-section.tsx`) |
| `../assets/landing/scene-kaan.webp`, `scene-ozan.webp` | Hero şeridi; **`lab/kisi-kaan.webp`/`kisi-ozan.webp`** karelerinden elle kırpma (`assets/landing/README.md` §4). Render'dan (`vitrin/*.webp`) kırpma yapılmaz: orada ekipman ~540px tutuyor ve büyütme gerekiyordu |
| `vitrin/telefon-busra.webp` | `routes/login.tsx` sağ panel + `routes/onboarding.tsx` |

## Neden `playwright` bir devDependency

`playwright` **sadece** bu çekim/denetim betikleri tarafından import edilir
(`lab-cek.mjs`, `lab-telefon.mjs`, `lab-denetim.mjs`, `serit-olcum.mjs`); `app/` veya `server/`
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
