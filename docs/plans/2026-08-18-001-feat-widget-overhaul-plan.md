---
title: Widget Overhaul - Galeri, YouTube, Onizleme ve Canlilik - Plan
type: feat
date: 2026-08-18
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-plan-bootstrap
execution: code
---

# Widget Overhaul - Galeri, YouTube, Onizleme ve Canlilik - Plan

## Goal Capsule

- **Amaç:** Profil sayfasındaki widget'ları elden geçirmek: galeri widget'ı eklemek, YouTube'u kanal ve video olarak ayırmak, link kartlarına önizleme görseli getirmek ve sayfayı statik bir kutu listesi olmaktan çıkarmak.
- **Yetki sırası:** `AGENTS.md` değişmezleri > bu plan > `ARCHITECTURE.md` (bayat, bkz. Riskler).
- **Yürütme profili:** Temel sertleştirme (Aşama A) her şeyin önkoşulu. Sonrasında widget'lar bağımsız akışlar.
- **Durma koşulları:** Vendor API anahtarı gerektiren hiçbir çözüm alma — ürün bu deseni bilinçli izliyor (`GITHUB_TOKEN` yeni kaldırıldı). Ziyaretçinin cihazına yazma veya üçüncü tarafa doğrudan istek ekleme (R48 ve yayınlanmış çerez politikası). Olmayan bir özelliği metinde veya arayüzde iddia etme.
- **Kuyruk sahipliği:** Commit'leri ana oturum atar. Deploy yalnızca `pnpm --filter @caka/web run deploy`.

---

## Product Contract

### Summary

Galeri widget'ı (galeri başına en fazla 5 fotoğraf, hesap başına en fazla 2 galeri), kanal ve videoyu ayıran YouTube widget'ları, link kartlarında önizleme görseli, ve tüm yüzeyde CSS ile sağlanan hafif canlılık. Izgara değişmiyor; boyut sözlüğü genişliyor.

### Problem Frame

Profil sayfası bugün statik bir kutu listesi gibi duruyor. `app.css`'teki her geçiş editörde veya onboarding'de; **public profilde sıfır hareket var.**

Widget tarafında üç somut eksik ölçüldü. **Link bloklarında önizleme görseli hiç yok** — kullanıcının "sitelerde og:image gösterilsin" isteği yeni bir özellik değil, hiç yapılmamış bir şey. **`og.ts` HTML okumasını 128 KB'da kesiyor**, oysa YouTube'un `og:image`'ı 744.917'inci baytta; yani her YouTube bloğu sessizce önizlemesiz kalıyor. Ve tipik 16 link hedefinin yalnızca 7'si og:image veriyor — kaçıranlar Instagram, TikTok, Spotify, Trendyol. **Fallback istisna değil, çoğunluk yolu**, ama bugün fallback tasarlanmamış.

YouTube'da kanal ile video hiçbir yerde ayrılmıyor; `youtube.com/watch?v=…` handle olarak `"watch"` üretiyor.

Izgara sorgulandı ve sonuç rahatlatıcı: **bento.me 13 Şubat 2026'da kapandı** (Linktree satın aldı) ve arşivden çıkarılan CSS'i 4 masaüstü / 2 mobil sütun gösteriyor — Caka'nınkiyle birebir aynı. Izgara doğru; eksik olan boyut sözlüğü ve widget'ların o ızgarayı nasıl doldurduğu.

### Requirements

**Temel dayanıklılık**

- R54. Tanınmayan bir blok tipi tüm layout'u düşürmez; bilinmeyen blok atlanır, sayfanın kalanı render olur. Yapısal olarak bozuk doküman hâlâ kapalı fail eder.
- R55. Yeni bir blok tipi eklendiğinde eksik kalan render/varsayılan dalları **derleme hatası** verir, çalışma anında sessizce düşmez.
- R56. `BLOCK_GRID_LIMITS` ve metin uzunluk limitleri sunucuda da uygulanır (MVP planı R6'nın gereği; bugün yalnızca istemcide).
- R57. Kullanıcı başına asset kotası uygulanır (MVP planı R16: en fazla 50 asset, 100 MB) ve değiştirilen görsel R2'de öksüz kalmaz.

**Görsel ve önizleme hattı**

- R58. Uzak önizleme görselleri Worker üzerinden proxy'lenir; ziyaretçinin tarayıcısı profil sahibinin seçtiği hosta doğrudan istek atmaz. SSRF savunmaları uygulanır.
- R59. `og.ts`'in okuma tavanı, meta etiketleri sayfanın ilerisinde olan hedefleri kaçırmayacak biçimde düzeltilir.
- R60. Link blokları önizleme görseli taşır.
- R61. Önizleme görseli **bulunamadığında** gösterilecek kart, bulunduğunda gösterilecek kart kadar özenle tasarlanır; çoğunluk yolu budur.

**Galeri**

- R62. Galeri widget'ı en fazla **5 fotoğraf** taşır; bir hesapta en fazla **2 galeri** olabilir. İkisi de hem editörde hem sunucuda uygulanır.
- R63. Galeri her tile boyutunda fotoğraf sayısına göre uygun düzeni seçer; 1×1'de yatay şerit render edilmez.
- R64. Fotoğraflar kırpılır, letterbox yapılmaz; her fotoğrafın en-boy oranı yüklemede saklanır ve SSR yer ayırır (CLS yok).

**YouTube**

- R65. YouTube bağlantısı kaydedilirken URL şeklinden **video** veya **kanal** olarak çözülür ve çözüm blokta saklanır; render yeniden ayrıştırma yapmaz.
- R66. Video widget'ı başlık ve kanal adını oEmbed'den alır, küçük görseli video kimliğinden kendisi kurar. `hqdefault` kullanılmaz.
- R67. Kanal widget'ı en son videoyu RSS akışından gösterir; anahtar veya kota gerektirmez.
- R68. Hiçbir YouTube yolu vendor API anahtarı gerektirmez.

**Canlılık ve özelleştirme**

- R69. Public profil giriş animasyonu ve hover tepkisi taşır; tamamı CSS, hidrasyon riski yok, `prefers-reduced-motion` saygı görür.
- R70. Kullanıcı widget başına kapak görseli yükleyebilir ve başlığı geçersiz kılabilir.

### Key Decisions

- **KD5. Vendor API anahtarı alınmaz.** YouTube dahil her veri yolu anahtarsız çözülür. Ürün bu deseni izliyor ve `GITHUB_TOKEN` yeni kaldırıldı; yeni bir anahtar bağımlılığı o kazanımı geri verir. *Governs R66, R67, R68.*
- **KD6. Izgara değişmiyor, boyut sözlüğü genişliyor.** bento.me'nin arşivden çıkarılan CSS'i 4/2 sütun gösteriyor — Caka'yla aynı. Yeniden tasarım gerekmiyor. *Governs R63.*
- **KD7. Fallback önce tasarlanır.** Ölçüm: 16 tipik hedefin 9'unda og:image yok. Önizlemesiz kart istisna değil, varsayılan. *Governs R61.*

### Acceptance Examples

- AE10. **Bilinmeyen blok sayfayı düşürmez.** *Covers R54.* Layout'a tanınmayan tipte bir blok girdiğinde public sayfa 200 döner, o blok görünmez, diğer bloklar render olur.
- AE11. **Galeri sınırları sunucuda tutar.** *Covers R62.* 6 fotoğraflı bir galeri veya 3. bir galeri bloğu içeren layout kaydı sunucuda reddedilir.
- AE12. **Kanal widget'ı kendini yeniler.** *Covers R67.* Kanal yeni video yayınladığında, önbellek süresi dolduktan sonra widget yeni videoyu gösterir; kayıt sırasında yapılan çözümleme tekrarlanmaz.
- AE13. **Önizlemesiz link çirkin durmaz.** *Covers R61.* og:image bulunamayan bir link kartı, bulunanla aynı ızgara ritmini koruyan tasarlanmış bir fallback gösterir.

### Scope Boundaries

#### Deferred to Follow-Up Work

- Lightbox. İstemci JS, odak tuzağı, `Escape` ve kaydırma kilidi demek; bu yığında gerçek hidrasyon yüzeyi. `+N` pili yerine ayrı bir SSR sayfasına bağlanır (daha paylaşılabilir).
- YouTube video süresi ve abone sayısı. Süre 1,3 MB'lık bir kazıma, abone sayısı yerelleştirilmiş bir dize — ikisi de düşük değer.
- Editör/public satır yüksekliği uyumsuzluğu (backlog #14). Her blok tipini etkiliyor, ayrı iş.
- WebP dönüşümü ve sunucu tarafı yeniden boyutlandırma (MVP planında da ertelenmiş).

#### Kapsam dışı

- Vendor API anahtarı gerektiren hiçbir entegrasyon.
- Izgara sisteminin yeniden tasarımı.

### Sources

- `scratchpad/widget-map.md` — 921 satır, mevcut sistemin haritası
- `scratchpad/bento-research.md` — ~11.400 kelime, ölçümlü dış araştırma
- `docs/plans/2026-08-15-001-feat-caka-mvp-plan.md` — R6, R16, KTD5, KTD12; "gelişmiş widget'lar" ertelenmiş madde
- `docs/decisions/2026-08-16-ktd8-grid-editor-gridstack.md`

---

## Planning Contract

### Key Technical Decisions

- KTD32. **Bilinmeyen blok atlanır, ama kaydetmede korunur.** Düşürmek, kullanıcının bir sonraki kaydında veri kaybı demek. Parse bilinmeyen bloğu render dışı bırakır; kaydetme yolu onu olduğu gibi geçirir. Bu, yeni blok tipini tek yönlü kapı olmaktan çıkarır. *Governs R54.*
- KTD33. **`sizeFromDims` kayıplı ve boyut sözlüğü eksik.** `sizeFromDims(1,2)` → `"1x1"` döndürüyor; bento yerleşimlerinin en çok yaslandığı dikey tile etiketini kaybediyor. Ayrıca eski akış sınıfları 4 sütunlu ızgarayla çelişiyor: `pos`'suz bir `"1x1"` 2 track kaplıyor, `pos`'lu olan 1. Sözlük `1x2`, `4x1`, `4x2` ile genişletilir ve çelişki giderilir.
- KTD34. **YouTube kayıt anında çözülür, render'da değil.** URL şekli video/kanal ayrımını verir; sonuç blokta saklanır. Video oEmbed ile bir kez zenginleşir; kanal `UC…` kimliğine bir kez çözülür ve sonrasında yalnız 26 KB'lık RSS okunur.
- KTD35. **Video küçük görseli `mqdefault`.** oEmbed'in verdiği `hqdefault` 4:3 ve siyah bantlı. `mqdefault` (320×180) hem her zaman var hem gerçek 16:9. `maxresdefault` yalnız kayıt anında 200 doğrulanırsa kullanılır — eski videolarda ve tüm Shorts'ta 404 yerine 1097 baytlık gri görsel dönüyor.
- KTD36. **Kanal widget'ı ürünün en ucuz canlılığı.** RSS en son videoyu, görüntülenmesini ve Short olup olmadığını veriyor; widget kendini yeniliyor. Statik logo-ve-handle kartından dramatik biçimde daha canlı ve maliyeti 26 KB.
- KTD37. **Galeri görünür fotoğraf sayısı formülle belirlenir:** `clamp(floor(iç_genişlik / 100), 1, 5)`. Bu tek kural her tile boyutunda iyi cevabı üretiyor ve mobilde ayrı tabloya gerek bırakmıyor. Kalanlar `+N` pili arkasında.
- KTD38. **1×1'de yatay şerit asla render edilmez.** 3'lü yatay dizilim orada 52×140 (en-boy 0,37) — bir kıymık. 4 fotoğrafta 2×2 mozaik kullanılır; hücre en-boyu 1,18 ile tile'ın kendi oranıyla aynı.
- KTD39. **Varsayılan galeri boyutu 4×1.** Beş fotoğraf orada 145,6×140 hücrelere düşüyor — neredeyse kare, bu ızgarada elde edilebilecek en iyi galeri konfigürasyonu.

### High-Level Technical Design

Ölçülmüş ızgara — her şeyin dayanağı:

| Tile | Masaüstü | En-boy | Mobil | En-boy |
|---|---|---|---|---|
| 1×1 | 181×156 | 1,16 | 169×138 | 1,22 |
| 2×1 | 374×156 | 2,40 | 350×138 | 2,54 |
| 2×2 | 374×324 | 1,15 | 350×288 | 1,22 |
| 4×1 | 760×156 | 4,87 | — | — |
| 4×2 | 760×324 | 2,35 | — | — |

Galeri düzenleri (iç ölçü = tile − 16px padding):

- **1×1** — 1-3 foto: tek hero + `+N`; 4-5 foto: 2×2 mozaik (80×68, en-boy 1,18)
- **2×1** — 1: tam; 2: 2'li; 3+: 3'lü + `+N`
- **2×2** — 3: hero-sol + 2 istifli sağ; 4: 2×2 mozaik; **5: 2 üst + 3 alt** (pil gerekmez)
- **4×1** — **5: 5'li, 145,6×140** (en iyi konfigürasyon)
- **4×2** — **5: hero-sol + 2×2 sağ; hero ve dört çeyrek aynı 1,20 en-boyda**

### Sequencing

Aşama A (temel) her şeyin önkoşulu ve hâlihazırda yürüyor. Aşama B ızgara sözlüğünü ve önizleme hattını düzeltir — galeri ve YouTube ikisine de yaslanıyor. Aşama C üç widget'ı paralel kurar. Aşama D canlılık ve özelleştirme. Aşama E test.

---

## Implementation Units

| U | Başlık | Bağımlılık |
|---|---|---|
| U29 | Layout dayanıklılığı, exhaustive switch, sunucu limitleri, asset kotası, og proxy | — |
| U30 | Izgara şema kusurları + boyut sözlüğü (`1x2`, `4x1`, `4x2`) | U29 |
| U31 | Önizleme hattı: okuma tavanı, link bloklarına og:image, tasarlanmış fallback | U29, U30 |
| U32 | Galeri widget'ı | U30, U31 |
| U33 | YouTube video widget'ı | U30, U31 |
| U34 | YouTube kanal widget'ı (RSS) | U33 |
| U35 | Canlılık: giriş animasyonu, hover, `prefers-reduced-motion` | U30 |
| U36 | Widget özelleştirme: kapak görseli, başlık geçersiz kılma | U31 |
| U37 | Test: mobil ve web, üç render yüzeyi | tümü |

Birim gövdeleri Aşama A'nın sonucuna göre yazılır; her biri dağıtılırken bu plandaki ilgili R/KTD kimlikleriyle birlikte verilir.

---

## Verification Contract

| Kapı | Komut |
|---|---|
| Tip kontrolü | `pnpm typecheck` |
| Testler | `pnpm test` (253 → artacak) |
| Build | `pnpm --filter @caka/web build` |
| Deploy | `pnpm --filter @caka/web run deploy` (Değişmez #11) |

**Tarayıcı testi zorunlu, mobil ve masaüstü.** `apps/web`'de test altyapısı yok ve `.dev.vars` mevcut değil, yani doğrulama deploy sonrası canlı sayfada yapılır. Üç yüzey de kontrol edilir: public `/:username`, editör, panel önizlemesi.

## Definition of Done

- Üç kapı da temiz; test sayısı arttı.
- Galeri: 5 foto sınırı ve 2 galeri sınırı sunucuda tutuyor; her tile boyutunda düzen doğru; 1×1'de yatay şerit yok.
- YouTube: kanal ve video ayrı render oluyor; hiçbir yol API anahtarı istemiyor; `hqdefault` hiçbir yerde geçmiyor.
- Link kartlarında önizleme görseli var; önizlemesiz kart tasarlanmış görünüyor.
- Uzak görseller Worker üzerinden geçiyor; ziyaretçi tarayıcısından üçüncü tarafa istek gitmiyor.
- Public profilde hareket var ve `prefers-reduced-motion` saygı görüyor.
- Mobil ve masaüstünde canlı doğrulama yapıldı ve sonucu raporlandı.
- Proxy landing ettiği için güncellenmesi gereken hukuki cümleler düzeltildi.

## Risks & Dependencies

- **Yeni blok tipleri geri alınamaz** — U29 bunu çözmeden hiçbir yeni tip deploy edilmemeli.
- **`ARCHITECTURE.md` bayat** — react-grid-layout, 3 tema, `/api/upload`, `/settings` ve artık olmayan bir `asset.r2_key` kolonundan söz ediyor. Planlama ona dayanmamalı; düzeltilmesi ayrı iş.
- **Kazıma kırılganlığı** — YouTube RSS ve oEmbed resmî ama kanal `UC…` çözümü HTML'den geliyor. Naif ilk-eşleşme grep'i **farklı bir kanalın** kimliğini döndürüyor; `og:url` kullanılmalı.
- **Asset kotası yokken galeri** — 2 galeri × 5 foto = hesap başına 10 tam boy JPEG. Kota U29'da gelmezse depolama açık kalır.
- **Hidrasyon** — canlılık tamamen CSS olmalı; JS ile görsel fade-in bu yığında doğrulanmış biçimde çalışmıyor.
