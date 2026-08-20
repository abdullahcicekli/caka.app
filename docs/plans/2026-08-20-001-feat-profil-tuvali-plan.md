---
title: Profil Tuvali — Özelleştirme, Bölümler ve Izgara Birimi - Plan
type: feat
date: 2026-08-20
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
execution: code
---

# Profil Tuvali — Özelleştirme, Bölümler ve Izgara Birimi

## Goal Capsule

- **Amaç:** Profil tuvalini (editör + public) kullanıcının gerçekten
  şekillendirebildiği bir yüzeye çevirmek. Üç ana eksen: profil
  özelleştirmesi, sayfayı bölümlere ayırma, ve ızgara biriminin
  inceltilmesi.
- **Yetki sırası:** `AGENTS.md` değişmezleri > bu plan > `ARCHITECTURE.md`
  (bayat — U45 onu düzeltiyor).
- **Öncelik kararı (kullanıcı, 2026-08-20):** en önemli iki iş **profil
  özelleştirmesi** ve **section yapısı**. Bu plan onları göçten önce
  sıralar; gerekçe aşağıda.
- **Durma koşulları:** Vendor API anahtarı alma. Ziyaretçinin cihazına yazma
  veya üçüncü tarafa doğrudan istek ekleme (R48). Olmayan bir özelliği
  arayüzde iddia etme.
- **Kuyruk sahipliği:** Commit'leri ana oturum atar. Deploy yalnızca
  `pnpm --filter @caka/web run deploy` (Değişmez #11).

---

## Neden bu sıra

**Fiziksel ölçü göçten etkilenmiyor.** 8→16 kolon geçişi ×2 çarpanla
yapılıyor ve boşluk 12px sabit kaldığı için `2 × 35,5 + 12 = 83` — bugünkü
her basamak birebir korunuyor. Bugün 2×2 tasarlanan bir kart yarın 4×4 olur
ve piksel piksel aynı görünür. Göçün kazandırdığı tek şey **yeni ara
basamaklar**: genişlik 225,5 / 320,5 / 415,5 / 510,5 / 605,5 / 700,5px,
yükseklik 198 / 282 / 366 / 450px.

> Daha önce bu listeye 130,5px ve 114px de yazmıştım — **oluşamazlar.**
> `BLOCK_GRID_LIMITS` minimumları da ×2 olduğu için her tipin tabanı 4 birim
> (178×156) kalıyor. Dolayısıyla `@container (max-height: 119px)`
> (`app.css:1114`) ve `(max-height: 99px)` (`:1120`) bantlarına yeni bir
> ölçü **düşmüyor**; o iki eşik için endişe karşılıksız.

Sonuç: görsel özellikleri göçten önce yapmak işi ikiye katlamıyor. Göç
sonrası yalnızca "bu kart yeni ara basamakta daha mı iyi duruyor" diye bir
ince ayar turu gerekiyor.

**Bölümlerin `y` değeri ızgara biriminde.** Section göçten önce gelirse göç
`sections[].y` değerlerini de ölçeklemek zorunda — üç satırlık ek iş, kabul
edilebilir.

**Faz 0 pazarlık edilemez.** Oturum düşünce düzenlemenin kaybolması ve profil
fotoğrafının hiç değiştirilememesi, hiçbir yeni özelliğin arkasında
bekleyemez.

---

## Faz 0 — Kayıpları durdur

### U38. Oturum düşünce düzenleme kaybolmasın (R9)

**Sorun.** `apps/web/app/routes/edit.tsx:2197` autosave'in 401 yanıtını genel
`"error"` durumuna eşliyor. Kullanıcı çalışmaya devam ediyor, kaydedilmediğini
geç fark ediyor. Re-auth yolu, bekleyen kaydı tekrar deneme ve aynı-kullanıcı
kontrolü hiç yok. Planlarda numaralı olarak duran tek "veri kaybı" maddesi.

**Yapılacak.**
- Autosave 401'i ayrı bir durum olarak ayır (`"unauthenticated"`).
- Editörde kalıcı bir uyarı şeridi: "Oturumun düştü — değişikliklerin
  kaydedilmiyor." + "Yeniden giriş yap" eylemi.
- Yeniden giriş yeni sekmede açılır; dönüşte editör oturumu yeniden
  doğrular ve **bekleyen layout'u tekrar gönderir**.
- Aynı-kullanıcı kontrolü: dönen oturum farklı bir kullanıcıysa kaydetme,
  "başka bir hesapla giriş yapıldı" de ve yeniden yüklemeye yönlendir.
  Sessizce başkasının profiline yazmak kabul edilemez.

**Dosyalar.** `routes/edit.tsx` (autosave etkisi ~2180-2210), `lib/auth-client.ts`,
`server/layout-api.ts` (401 gövdesinde `userId` dönmeli mi — karar ver).

**Kabul.** Oturum çerezi silinip düzenleme yapıldığında uyarı çıkıyor;
yeniden giriş sonrası bekleyen değişiklik kayıpsız kaydediliyor; farklı
hesapla dönüldüğünde yazma yapılmıyor.

**Maliyet.** Orta. **Bağımlılık.** Yok. **Risk.** Tekrar gönderme yolu 409
sürüm çakışmasıyla kesişiyor (`edit.tsx:2196`) — ikisi birlikte test edilmeli.

---

### U39. Profil fotoğrafı editörden değiştirilebilsin

**Sorun (doğrulandı).** `avatarAssetId` yalnız onboarding'de bir kez
yazılıyor (`routes/onboarding.kurulum.tsx`). Profil bloğunun Inspector'ı
(`routes/edit.tsx:1243-1249`) yalnız `name` ve `title` gösteriyor. Ayarlar
(`ayarlar.tsx:124`), panel (`dashboard.tsx:99`) ve paylaşım kartı
(`share-image-card.tsx:148`) avatarı yalnız **okuyor**. Onboarding'i geçen
kullanıcı profil fotoğrafını bir daha değiştiremiyor.

**Yapılacak.**
- Profil bloğu Inspector'ına avatar alanı: mevcut fotoğrafın önizlemesi,
  "Değiştir" ve "Kaldır".
- Yükleme yolu hazır: `uploadPhotoFile` + `uploadAsset` (`edit.tsx:332,577`)
  ve `app/lib/image-upload.ts` (1600px tavan, EXIF temizliği).
- **YALNIZ EDİTÖRDE, Ayarlar'da değil.** Avatar bir DB kolonu değil, profil
  bloğunun `data.avatarAssetId`'si (`layout.ts:201`) — değiştirmek `layout`
  **ve** `draftLayout` yazmak demek (`server/profile.ts:296-343`
  `ensureProfileAvatar` bu çift yazma desenini + `version + 1` hazır
  gösteriyor). Ayarlar'da "yayınla" kavramı yok; oradan değiştirilirse
  yayındaki sayfa anında değişir ama editördeki taslak değişmez → **iki
  gerçek**. Ayarlar'daki avatar salt-okunur kalır, yanına "Editörde değiştir"
  bağlantısı konur.
- **Tavan 1600 değil, 512px.** Gerçek kullanım ölçüleri: kart 64px
  (`profile-block.tsx:227`), `.profile-identity` 112px (`app.css:920`),
  onboarding 112px, og şablonları 92/132/**140**px (`og-templates.ts:654`),
  paylaşım kartı 96px. En büyüğü 140px; 2× DPR ile 280px. `UPLOAD_MAX_EDGE =
  1600` (`lib/image-upload.ts:39`) avatar için ~5,7 kat fazla ve doğrudan
  kotayı yiyor. `prepareImageForUpload` ikinci bir `maxEdge` parametresi
  alır; avatar 512 geçer (1600px JPEG ≈ 400 KB → 512px ≈ 60 KB).
- **Kare kırpma yüklemede.** `ProfileAvatar` (`components/profile-avatar.tsx:11`)
  `rounded-full object-cover`; og tarafı da `objectFit: cover`. Dikdörtgen
  fotoğraf merkezinden kırpılıyor, portrede baş kesiliyor — gerçek kusur.
  Çözüm kırpma **arayüzü değil**: `prepareImageForUpload` avatar modunda
  kareyi kendisi alsın ve 512×512 göndersin. Kare **merkezden değil üst
  üçte birden** alınır — portrede yüzü kurtarma olasılığı belirgin biçimde
  yüksek (yüz algılama olmadan en iyi yaklaşım). Kazanç: her tüketici (og
  dahil) aynı kareyi görür.
- **Biçim kısıtı korunuyor, ama kırılgan.** og üreticisi yalnız png/jpeg
  çözüyor (`server/og-render.ts:46`); `assetToImage` başka tipte `null` döner
  ve şablon sessizce monograma düşer. Zincir bugün güvenli (`image-upload.ts:45`
  `DECODABLE` = jpeg/png, uç `ACCEPTED_TYPES` ile kapalı). **Tuzak:** `/i/:id`
  WebP servis ediyor (`server/index.ts:77`); ileride WebP kabul edilirse
  ayarlar önizlemesi avatarı gösterir ama og PNG'sinde avatar OLMAZ. Bu
  uyarı `og-render.ts:64`'e yorum olarak yazılır.
- **Öksüz asset — SİLME EKLEME.** `AGENTS.md` Değişmez #9: *"Asset silme
  yalnızca hesap silmede yapılır."* Bu iş içinde eski avatarı silmek
  değişmez ihlalidir. Yapılacak tek şey: 512px tavanıyla büyümeyi sınırla
  (~7 kat yavaşlatır) ve `docs/backlog.md` #6'ya "avatar değiştirme yeni bir
  öksüz kaynağı" satırını ekle. Doğru çözüm referans sayımlı toplu temizlik —
  ayrı iş.

**Kabul.** Editörden fotoğraf değiştirilebiliyor; değişiklik profil kartına,
panele, ayarlara ve og:image'e yansıyor; yüklenen dosya 512×512 kare ve
biçimi jpeg/png; `layout` ve `draftLayout` birlikte yazılıyor.

**Maliyet.** Küçük-orta. **Bağımlılık.** Yok. **Risk.** Düşük.

---

### U40. OAuth iptalinde sessiz dönüş (R5)

**Sorun.** `routes/login.tsx` hiç hata durumu render etmiyor;
`lib/auth-client.ts:11`'de `errorCallbackURL` yok. Google/Apple ekranında
"İptal" diyen kullanıcı hiçbir şey olmamış gibi giriş sayfasına dönüyor.

**Yapılacak.** `errorCallbackURL` tanımla; `/login?hata=...` parametresini
okuyup satır içi mesaj bas. Metinler beş dilde katalogda (`content/app/*`,
`auth` bölümü).

**Kabul.** İptal edilen girişten sonra giriş sayfasında ne olduğunu anlatan
bir satır görünüyor.

**Maliyet.** Küçük. **Bağımlılık.** Yok. **Risk.** Yok.

---

## Faz 1 — Profil özelleştirmesi *(kullanıcı önceliği)*

### U41. Kutusuz ("chromeless") blok

**İstek.** Kart yüzeyi olmadan, sayfa zemininin üstünde duran çıplak ikon —
iOS ana ekranı gibi. Gerekçeler: uygulama ikonları koyabilmek; GitHub katkı
grafiği boşken kartın yerine yalnız simgeyi göstermek.

**Bugünkü durum.** `linkVariantSchema = ["card","image","favicon"]`
(`layout.ts:226`). "favicon" sürümü kartı tek simgeye indiriyor **ama kart
yüzeyi duruyor**: `.profile-block` (`app.css:893`) `background:
var(--profile-card)`, `border`, `border-radius: var(--radius-2xl)`.

**Mimari kararı (verilmeli).** İki seçenek:

- **(a) Yeni bir `link` sürümü** — dar, mevcut desene uyar, ama GitHub
  bloğuna uygulanamaz (o `link` değil).
- **(b) Tüm bloklara uygulanan bayrak** — `chrome: "card" | "none"`,
  `blockBase`'e isteğe bağlı alan. `default("card")` ile eski kayıtlar
  aynen çalışır, eski deploy bilmediği alanı yok sayar.

**Karar: (b)** — `chrome: z.enum(["card","none"]).default("card")`,
`blockBase` içine (`layout.ts:70-85`, `size`/`pos`/`smManual`'ın yanına).
Gerekçe: `linkVariantSchema` (`:226`) link'e özel ve zaten üç değerli;
sosyal blok için ayrı bir enum açmak deseni ikiye böler. Yüzey kaldırma
tipten bağımsız bir **sunum** kararı — `blockBase` tam olarak bunun yeri.

**Eski deploy'u kırmaz ama VERİ KAYBETTİRİR.** Zod varsayılanı `strip`; eski
bir deploy `chrome` alanını sessizce atar. Kullanıcı bayat bir sekmeden
kaydederse bayrak kaybolur ve kart yüzeyi geri gelir. `smManual` ile aynı
risk sınıfı — kabul edilebilir, ama `profileLayoutWriteSchema` yorumunda
anılmalı.

**Hangi tiplerde anlamlı.** `social` (asıl istek), `link` (`favicon`
sürümüyle), fotoğraf (tek fotoğraflı, kanamalı). **Anlamsız:** `ayet`,
`location`, `document`, `status`, `text` — bunlar kart yüzeyine muhtaç,
metin/görüntü sınırı yüzeyden geliyor. Bayrak şemada **genel** olsun,
editörde tek bir `blockSupportsChromeless(block)` fonksiyonu neyi
göstereceğine karar versin — `blockGridLimits` (`:1077`) ile aynı desen.

**İKİYE BÖLÜNÜYOR.**
- **U41a (şimdi):** bayrak + yüzey kaldırma + kontrast kuralı (U42) +
  `has-gh` bastırma (U43). Bugünkü ızgarada 2×2 tabanla (178×156) çalışır.
- **U41b (göçten sonra):** `blockGridLimits`'e `chrome === "none"` dalı,
  taban 2 birim → **83×72px ikon karesi**.

**Neden bölünüyor.** 2×2 hücrede (178×156) `46cqmin = 71,8px` ikonun
çevresinde ~53px yatay / ~42px dikey ölü alan doğuyor; ikonlar arası görsel
boşluk 12px yerine ~118px oluyor. **iOS rafı gibi değil, seyrek görünüyor.**
Hizalama bozulmuyor (kutu hâlâ orada) ama desen amacına ulaşmıyor.
`layout.ts:56-63` yorumu bunu zaten öngörmüş: *"Gerçekten küçük bir kart —
83px'lik ikon karesi — ayrı bir kart tasarımı ister, ızgara meselesi
değil."* Yani **"uygulama rafı" görüntüsü ancak U41b'de gerçekleşiyor.**

**İkon ölçüsü, etiket, dokunma hedefi.** Bugünkü `min(96px, 46cqmin)`
(`app.css:2240`) kutusuzda da doğru taban. WCAG 2.5.8 (24×24) fazlasıyla
geçiyor — gerçek tıklama hedefi `<a>`'nın tamamı (178×156). Etiket iOS'ta
var ama burada **varsayılan kapalı**: kullanıcının gerekçesi "sadece GitHub
ikonu". İleride açılırsa `--profile-muted` saydam olduğu için kontrastı
ayrıca ölçülmeli.

**Kabul.** Bir sosyal blok kutusuz moda alındığında zemin, kenarlık ve gölge
kayboluyor; ikon çipi kalıyor; blok hâlâ tıklanabilir ve erişilebilir adı
korunuyor.

**Maliyet.** Orta. **Bağımlılık.** U42 ile birlikte tasarlanmalı; U41b ← U54.
**Risk.** Kontrast çözülmeden çıkmamalı.

---

### U42. Kutusuz ikonun kontrastı — ölçüldü

**Doğru tasarım iki katman değil, bir katman kaldırmak.** `is-favicon`
bugün kart yüzeyi (`app.css:893`) + ikon çipi (`:2216-2245`,
`border-radius: 24%`) olarak **iki katman** taşıyor. iOS ana ekranında
ikonun kendi opak squircle'ı **vardır** (radius ≈ %22,5 — bugünkü `24%`
neredeyse birebir); olmayan tek şey altındaki ikinci kutu. Yani yapılacak:
`.profile-block`'un `background` + `border` + `border-radius`'unu kaldır,
**çipi olduğu gibi bırak.** Bu, kontrast sorununun büyük kısmını
kendiliğinden çözüyor — çip opak.

**Ölçüm (WCAG 1.4.11, eşik 3:1).** Altı tema zemini: light `#f7f6f2`,
lavanta `#f4f2fb`, ufuk `#eae7e0`, dark `#14141a`, neon `#171123`,
zümrüt `#0d1615`. **17 çip tonundan 8'i** en az bir temada eşiği geçemiyor:

| çip | light | lavanta | ufuk | dark | neon | zümrüt |
|---|---|---|---|---|---|---|
| `#111116` X/GitHub/TikTok/Threads (`:517`) | 17,41 | 16,98 | 15,24 | **1,03** | **1,02** | **1,02** |
| `#ffffff` `.platform-link` (`:522`) | **1,08** | **1,11** | **1,23** | 18,35 | 18,41 | 18,38 |
| `#ffe800` sahibinden (`:535`) | **1,16** | **1,13** | **1,01** | 14,67 | 14,72 | 14,70 |
| `#25d366` whatsapp (`:543`) | **1,83** | **1,79** | **1,61** | 9,25 | 9,28 | 9,27 |
| `#1db954` spotify (`:532`) | **2,39** | **2,33** | **2,09** | 7,09 | 7,12 | 7,11 |
| `#f27a1a` trendyol (`:533`) | **2,56** | **2,50** | **2,25** | 6,62 | 6,64 | 6,63 |
| `#2ea043` `--color-gh` (`:71`) | 3,12 | 3,04 | **2,73** | 5,44 | 5,46 | 5,45 |
| `#ea4c89` dribbble (`:520`) | 3,30 | 3,21 | **2,89** | 5,15 | 5,17 | 5,16 |

Geri kalan (youtube, linkedin, facebook, twitch, website, email, figma,
discord, mavi) altı temada da ≥3.

**"İnce halka" çözümü ölçüldü ve ÇALIŞMIYOR.** Halka hem zeminle hem çiple
3:1 tutmalı. Temanın en kötü çipini kurtaran karışım, o temadaki *diğer*
çiplerin çoğuna karşı düşüyor — light'ta `%60` halka (`#7a7a7b`) zemine 4,69
ama linkedin çipine **1,12**. Tek bir sabit halka kuralı yok.

**İşleyen çözüm — iki parçalı:**
1. **Akromatik grubu tema yönüne çevir.** `#111116` koyu temada
   `--profile-text` olur (dark 18,35 · neon 16,53 · zümrüt 16,51); `#ffffff`
   açık temada `--profile-text` olur (light 16,96 · lavanta 16,13 · ufuk
   10,37). Marka kılavuzlarına da uygun — X ve GitHub'ın kendi koyu-mod
   işaretleri beyazdır.
2. **Açık temada düşen doygun tonları koyulaştır:**
   `color-mix(in srgb, <ton> 62%, black)` → spotify 5,50 · whatsapp 4,46 ·
   trendyol 5,82 · gh 6,77 · dribbble 7,08 · sahibinden 3,01 (sınırda, `%70`
   karışım güvenli).

**Reddedilen dördüncü seçenek.** Marka rengini tümden bırakıp çipi kaldırmak
ve glifi `currentColor` yapmak (Linktree/Beacons deseni). Ölçüm gerekmez,
maliyet en küçük, risk sıfır — ama kullanıcının *"tıpkı Apple gibi"* (renkli
uygulama ikonları) isteğine uymaz. Ürün kararı olarak masada kalsın.

**Kabul.** Altı temanın hepsinde her platform ikonu ≥3:1; ölçüm tablosu koda
yorum olarak yazılır (bu depoda desen bu).

**Maliyet.** Orta. **Bağımlılık.** U41. **Risk.** Orta — asıl risk 17 ton ×
6 temanın tek tek doğrulanması.

---

### U43. GitHub kartının boş katkı hâli

**Önemli düzeltme.** `github_calendar` diye bir **blok tipi yok** (doğrulandı:
`layout.ts`'te sıfır eşleşme). GitHub, `social` bloğunun bir platformu
(`layout.ts:96`); takvim `server/github.ts` tarafından çekilip
`githubCalendars` sözlüğüyle geliyor (`profile-block.tsx:272`) ve kart
`has-gh` sınıfını alıyor (`:342`).

**İki ayrı durum, karıştırılmamalı.**
- **Grafik çekilemezse** (`github.ts:81` 404 → `not_found`; `:85/:90/:95/:103`
  → `error`) sözlükte kayıt olmaz → `has-gh` düşer → kart **normal sosyal
  karta** döner. Yani "boş kutu" hâli zaten yok.
- **Katkı sıfırsa** (`total: 0`) grafik **çizilir** ve 52×7 boş kare görünür
  (`app.css:1017`). Kullanıcının şikâyeti tam olarak bu.

**Çözüm.** Kutusuz sürümde `has-gh` verilmesin — `chrome === "none"` olan
sosyal kart daima simge modunda çizilir. Kararı kullanıcı verir, veri
kaybolmaz.

**Reddedilen alternatif.** `github.ts:198`'de `total === 0` ise `null` dönmek
tek satır, ama "0 katkı" bilgisini herkesten alır ve grafiği bilerek isteyen
kullanıcıyı da vurur.

**Kabul.** GitHub sosyal kartı kutusuz simge moduna alınabiliyor; o modda
takvim çizilmiyor.

**Maliyet.** Küçük. **Bağımlılık.** U41.

---

### U44. Köşe ve form çeşitliliği

**Gerekçe.** Kullanıcının L şekli isteği teknik olarak kapalı (CSS Grid
alanı dikdörtgen olmak zorunda; `GridStackWidget` yalnız `{x,y,w,h}`;
`shape-inside` hiçbir tarayıcıda yok). Ama isteğin altındaki ihtiyaç —
**form çeşitliliği** — köşe yarıçapıyla karşılanabilir.

**Yapılacak.** Blok başına köşe seçeneği (keskin / normal / çok yuvarlak /
daire). `--radius-*` token'larıyla uyumlu (Değişmez #4). Daire seçeneği
yalnız kare bloklarda açık.

**Kabul.** Köşe seçimi kartın yerleşimini değiştirmiyor, yalnız görünümünü.

**Maliyet.** Küçük. **Bağımlılık.** Yok.

---

## Faz 2 — Section (bölüm) yapısı *(kullanıcı önceliği)*

> **Kayda geçen çekince.** Ölçüm: `content/landing/personas.ts`'teki altı
> gerçek persona sayfasında en dolu sayfa **7 blok**. Bölüm başlığı bir
> ızgara satırı yiyor ve 7 blokta ziyaretçi zaten tüm sayfayı tek bakışta
> görüyor. Değeri 15+ blokta ortaya çıkıyor. Kullanıcı bilerek öne aldı;
> plan bunu uyguluyor ve ölçümü buraya not ediyor ki sonradan
> değerlendirilebilsin.

### U45. Bölüm şeması

**Karar.** Belgeye isteğe bağlı `sections: [{ id, title, y }]` eklenir.
`pos.y` **sayfa geneli kalır**; bölüm "şu y'den itibaren başlık" demektir.

**Neden bu, alternatifleri değil.**
- *Ayraç blok* (yeni bir `section` blok tipi): en ucuz ama kapsayıcı değil —
  ayracı taşımak altındakileri taşımaz ve mobil türetme (`firstFit`)
  blokları ayracın karşı tarafına geçirip gruplamayı bozar.
- *Bölüm başına ayrı ızgara*: `pos` bölüme göreli olur. Eski deploy göreli
  `y`yi mutlak sanıp **blokları üst üste bindirir** — gerçek migration
  gerektiren tek seçenek. Ayrıca public sayfa gridstack kullanmıyor
  (`app.css:855` saf CSS Grid), iç içe ızgara orada ayrıca yazılır.

`version: z.literal(1)` (`layout.ts:658`) dondurulmuş; `grid` alanı
(`layout.ts:686`) sürüm yükseltmeden alan eklemenin kabul edilmiş yolunu
gösteriyor. Eski deploy `sections`ı yok sayar ve aynı sayfayı başlıksız
render eder — **sessiz bozulma yok.**

**Sınırlar.** En fazla 8 bölüm; başlık 40 karakter. Sunucuda da uygulanır
(R56 deseni, `layout.ts:1221`).

**Kabul.** `sections` taşıyan bir belge yazılıp okunuyor; alan yokken
davranış bugünküyle birebir aynı; sunucu sınırları tutuyor.

**Maliyet.** Küçük. **Bağımlılık.** Yok.

---

### U46. Bölümün editördeki davranışı

**Yapılacak.**
- Araç çubuğundan "Bölüm ekle": tuvalin sonuna başlıklı bir ayırıcı koyar.
- Ayırıcı sürüklenebilir; taşındığında **altındaki blokların `y` değerini
  toplu kaydırır** (bölüm bir kapsayıcı değil ama öyle davranmalı).
- Başlık tuval içinde düzenlenir (mevcut `contenteditable` deseni,
  `rich-text-editor.tsx` değil — düz metin yeter).
- Bölüm silinince blokları silinmez, yalnız başlık kalkar.

**Gridstack ile ilişki.** Ayırıcı bir gridstack node'u **değil**; tuvalin
üstüne çizilen bir katman. Node yapılırsa çarpışma motoru onu blok sanar ve
yerçekimi altındakileri ayracın üstüne çeker.

**Kabul.** Bölüm eklenip taşınabiliyor; taşıma altındaki blokları birlikte
götürüyor; bölüm silinince blok kaybolmuyor.

**Maliyet.** Orta-büyük. **Bağımlılık.** U45. **Risk.** Yerçekimi
(`grid.tsx:96` `float:false`) bölüm sınırlarını yok sayıyor — U48 ile
birlikte çözülmeli, yoksa ayraç eklenince bloklar yukarı kayar.

---

### U47. Bölümün public sayfada render'ı ve mobil

**Yapılacak.**
- Public sayfada bölüm başlığı `.profile-grid`'in içinde tam genişlik bir
  satır olarak çizilir (`grid-column: 1 / -1`).
- **Mobil türetme kritik.** `withDerivedSmPositions` (`layout.ts:1310`)
  blokları `(y,x)` sırasına dizip `firstFit` ile yeniden paketliyor. Bölüm
  sınırları bu paketlemede **engel** olmalı: bir bölümün bloğu başka bir
  bölümün alanına taşamaz.
- Erişilebilirlik: başlıklar gerçek `<h2>` olmalı; bölümler `<section
  aria-labelledby>` ile sarılmalı. Bugün profil sayfasında başlık
  hiyerarşisi ne, önce ölç.

**Kabul.** Bölümlü bir sayfa masaüstünde ve mobilde doğru gruplanıyor;
ekran okuyucuda bölümler gezilebiliyor.

**Maliyet.** Orta. **Bağımlılık.** U45, U46.

---

## Faz 3 — Tuvalin hissi

### U48. Yerçekimini kapat + "yukarı sıkıştır"

**Sorun.** `grid.tsx:96` `float: false` — kullanıcı bilerek boşluk
bırakamıyor. Public sayfa boşluğu **zaten render edebiliyor** (`has-pos`
mutlak satıra oturuyor, `app.css:891`); engel tamamen editörde.

**Yapılacak.** `float: true` + araç çubuğunda "Yukarı sıkıştır" komutu.
Yeni blok yerleştirme (`placeNewBlock` → `firstFit`, `layout.ts:1278`) yine
sıkıştırır — istenen davranış bu.

**Yan etki.** Blok silinince altındakiler yukarı gelmez, delik kalır.
"Yukarı sıkıştır" bunun kullanıcı tarafından tetiklenen çözümü.

**Maliyet.** Küçük. **Bağımlılık.** Yok (ama U46 buna yaslanıyor).

---

### U49. Geri al / yinele

**Sorun.** Editörde hiç yok (`edit.tsx`'te `undo`/`redo` sıfır eşleşme).
Yanlış taşınan blok geri alınamıyor.

**Yapılacak.** `layout` state'i için sınırlı bir geçmiş yığını (ör. 50 adım).
Autosave ile ilişki: geri alma yeni bir kayıt tetikler, geçmişe yazmaz.
Klavye: `Cmd/Ctrl+Z`, `Shift+Cmd/Ctrl+Z`.

**Maliyet.** Orta. **Bağımlılık.** Yok. **Not.** Göç (U52) sırasında
sigorta işlevi görüyor; ondan önce yapılmalı.

---

### U50. Klavyeyle 1 birim oynatma

**Sorun.** Tuval **tamamen klavye erişilemez** — `grid.tsx` yalnız sürükleme
dinliyor. Hem hizalama hem erişilebilirlik borcu.

**Yapılacak.** Seçili blokta ok tuşları `grid.update(el, {x,y})` ile 1 birim
oynatır; `Shift+ok` boyutlandırır. Odak halkası ve `aria` durumu.

**Maliyet.** Küçük-orta. **Bağımlılık.** Yok.

---

### U51. `smManual` göstergesi ve geri dönüş

**Sorun.** Mobilde bir bloğa dokunmak onu `smManual` yapıyor
(`grid.tsx:120-123`, `layout.ts:84`) ve blok kalıcı olarak elle yönetime
geçiyor. Göstergesi yok, geri alması yok. Kullanıcı masaüstünde düzeni
değiştirince o blok neden takip etmiyor anlamıyor.

**Yapılacak.** Mobil önizlemede elle konumlandırılmış bloklara rozet +
"Otomatiğe döndür" eylemi (blok başına ve toplu).

**Maliyet.** Küçük. **Bağımlılık.** Yok. **Etki.** Yüksek — hizalama
işinin en kafa karıştırıcı yeri burası.

---

## Faz 4 — Harita ve göç

### U52. `ARCHITECTURE.md` yenilemesi

**Sorun.** Dosya bugün olmayan bir `paper` temasından (satır 51, 126),
"4 kolon / 2 kolon"dan (73-74, 119), "beş blok tipi"nden (122) ve
"draft/publish ileride"den (163) söz ediyor; lokalizasyondan hiç söz
etmiyor. Dört planın "yetki sırası" satırı bu dosyaya atıf yapıyor.

**Yapılacak.** Göçten **önce** yenile — göçün doğru haritaya ihtiyacı var ve
göçten sonra yazılırsa yine bayat kalır. 11 blok tipi, 6 tema, 8/4 kolon,
taslak/yayın, lokalizasyon, edge cache, Apple OAuth.

**Maliyet.** Küçük-orta. **Bağımlılık.** Yok.

---

### U53. Izgara birimi 16/8 — migration

**En riskli tek iş. Kendi commit'inde, kendi doğrulamasıyla.**

**Hedef.** 16 kolon lg / 8 sm, satır içeriği 30px, boşluk 12px sabit.
`2 × 35,5 + 12 = 83` — mevcut her basamak birebir korunur.

**⚠ ASIL RİSK ×4 DEĞİL — BOŞ SAYFA.** Şema `grid`i literal olarak
bağlıyor: `layout.ts:657` `z.literal(GRID_UNIT).default(GRID_UNIT)` ve
`:686` `z.literal(GRID_UNIT).optional()`. `GRID_UNIT` 2→4 olursa bugün
yazılmış `{"grid":2,…}` belgeleri `layoutEnvelopeSchema.safeParse`
**başarısız** olur → `parseProfileLayoutDetailed` `null` döner (`:726`) →
**yayındaki her profil sayfası içeriksiz kalır.** Ölçek hatası değil, toplu
veri kaybı görüntüsü. `GRID_UNIT`'i literal olarak kullanma: envelope alanı
`z.union([z.literal(2), z.literal(4)]).optional()` olmalı. `:657` çevrimden
SONRA görüldüğü için literal kalabilir.

**Izgara zaten bir kez bölündü.** Bugünkü `GRID_UNIT = 2` "eski hücrenin
yarısı" demek (`layout.ts:48-68`) — yani bu ikinci değil **üçüncü** nesil.
Bugünkü kontrol ikili (`legacyUnits = value.grid !== GRID_UNIT`, `:1210`) ve
üç durumu ayıramaz. Doğrusu:

| kayıttaki `grid` | çarpan |
|---|---|
| yok | ×4 |
| `2` | ×2 |
| `4` | ×1 |

Çarpanı tek bir saf fonksiyon versin — `legacyScale(marker: 2 | 4 |
undefined): 1 | 2 | 4` — ve üç yer onu paylaşsın:
- `toHalfUnits` (`:691`) parametreli `scalePos(pos, factor)` olur;
  `parseProfileLayoutDetailed:746` boolean yerine çarpan geçirir
- `scaleRawBlockUnits` (`:1178`) çarpan alır; `:1187` `* GRID_UNIT` → `* factor`
- `legacyUnits` (`:1210`) boolean'dan çarpana döner

`sizeToDims` (`:1253`) ve `sizeFromDims` (`:1269`) `GRID_UNIT` ile yazıldığı
için **kendiliğinden doğru kalır — dokunma.**

`sections[].y` de ölçeklenmeli (U45 bu fazdan önce geldiyse).

**Test yükümlülüğü.** Bugün yalnız iki durum test ediliyor:
`layout-parse.test.ts:41` (işaretsiz) ve `:47` (`grid: 2`). Üçüncü durum
(`grid: 4`) ve "işaretsiz → ×4" için ayrı test **şart**; yoksa regresyon
sessiz geçer. **Testi önce yaz.**

**Kabul.** Üç kayıt biçimi (işaretsiz, `grid:2`, `grid:4`) doğru
ölçekleniyor; `grid: 2` belgesi parse edilebiliyor (boş sayfa yok);
idempotent (`ensureLayoutPositions(fixed) === fixed`).

**Maliyet.** Orta. **Bağımlılık.** U52. **Risk.** Yüksek — planın tek
"yanlış yaparsan yayını bozarsın" maddesi.

---

### U54. Izgara birimi 16/8 — sayısal envanter

**Yapılacak.** Değişmesi gereken her literal:
- `packages/shared/src/layout.ts` — `GRID_COLUMNS`, `GRID_UNIT`, tüm
  `*_GRID_LIMITS`, `*_DIMS`, boyut sözlüğü (`sizeToDims`/`sizeFromDims`)
- `apps/web/app/app.css` — span sınıfları (884-889), `grid-auto-rows`
  (867, 3924), `grid-template-columns` (865, 3924), `dashboard-preview`
  (3528-3537)
- `apps/web/app/components/editor/grid.tsx:93` — `cellHeight`
- Testlerdeki sabit beklentiler (`layout-parse.test.ts`, `photo.test.ts`,
  `layout.test.ts`)

**Dokunmatik telafisi.** Sürükleme adımı mobilde bugün yatay 88,5px /
dikey 75px; ince ızgarada **44,25 / 37,5px**. 37,5px tipik parmak temas
alanının (≈45px) altında — kullanıcı bir basamak hedeflerken iki basamak
gidebilir. Tutamaçlar (`app.css:3667-3682`) n/s 34×11, e/w 11×34; WCAG 2.5.8
kısa kenarda **bugün de** karşılanmıyor (kurtaran şey "spacing" istisnası).
Telafi: n/s → 40×16, e/w → 16×40. Kart içeriğini 5px daha örter, maliyeti
küçük. Kabul edilen duruş: masaüstünde tam kazanç, mobilde tutamaç
büyütmesiyle telafi (mobilde çoğu kart zaten tam genişlik).

**Kabul.** `pnpm test` ve `pnpm typecheck` temiz; göç öncesi/sonrası aynı
sayfa piksel piksel aynı render oluyor (ekran görüntüsü karşılaştırması).

**Maliyet.** Orta. **Bağımlılık.** U53.

---

### U55. `photo.ts` bantlarının yeniden türetilmesi *(göçün gizli iş kalemi)*

**Bu, göçün en büyük gizli işi ve U54 ile AYNI PR'da olmalı.**

`packages/shared/src/photo.ts:48` `PHOTO_SHAPES` bantları ve `:73`
`PHOTO_GRID_CELLS` hücre ölçüleri **bugünkü basamak listesinden türetilmiş**;
dosyanın kendi yorumu bunu açıkça yazıyor (*"Eşikler ızgarada GERÇEKTEN
oluşabilen ölçülerden türedi… genişlik 178/273/368/463/558/653/748, yükseklik
156/240/324/408/492"*). Yeni oranlar bantları kaydırıyor: `225,5×156 = 1,45`
→ **square**, oysa bugün en yakını `273×156 = 1,75` → **wide**. Yani kullanıcı
kartı bir basamak oynattığında dizilim square↔wide arası atlar.

**Yapılacak.** `PHOTO_SHAPES` eşiklerini ve `PHOTO_GRID_CELLS` hücre
ölçülerini yeni basamak listesinden yeniden türet; `photoRecommendedSize`
(`photo.ts:158`) çıktısını doğrula.

**Container eşiklerinden tek şüpheli.** `g = 510,5` bugünkü `min-width: 500`
kurallarına (`app.css:2044, 2060, 2137`) giriyor ama `min-width: 520`
(`:2700`) kuralına **girmiyor** — bugün 558px her ikisini de tetikliyordu.
Tarayıcıda doğrulanmalı. Geri kalan yeni ölçüler bugünküyle aynı bantlara
düşüyor.

**R64 (fotoğraf oranı) ÖN KOŞUL DEĞİL.** Fotoğraf kartı fotoğrafın oranını
**zaten hiç kullanmıyor**: dizilim KARTIN oranından konteyner sorgusuyla
türetiliyor (`app.css:1516-1539`, `photo-block.tsx:43`) ve her fotoğraf
`object-fit: cover` ile kırpılıyor. Kırpma sürprizi bugün de var; ince ızgara
onun *miktarını* değiştirir, *doğasını* değil. Oran saklamak bağımsız bir
değer üretir (`<img width height>` ile CLS/LCP, `photoRecommendedSize` için
gerçek girdi) ama **ayrı iş** olarak planlanır ve bu göçü bloklamaz.

**Maliyet.** Orta-büyük. **Bağımlılık.** U54.

---

## Faz 5 — Göç sonrası

### U41b. Kutusuz ikonun gerçek taban ölçüsü

`blockGridLimits`'e (`layout.ts:1077`) `chrome === "none"` dalı; taban 2
birim → **83×72px ikon karesi**. Sınır zaten bloktan okunduğu için editör,
yazma şeması ve `ensureLayoutPositions` üçü birden takip eder. Kullanıcının
"uygulama rafı" görüntüsü burada gerçekleşiyor (gerekçe U41'de).

**Maliyet.** Küçük. **Bağımlılık.** U54.

---

### U56. Sürükleme sırasında hizalama kılavuzu

**Neden şimdi.** Bugün gereksiz — ızgara zaten yapışkan ve 8 kolonda "aynı
hizada mı" gözle anlaşılıyor. 16 kolonda anlaşılmıyor.

**Yapılacak.** `dragstart`/`drag` olaylarında komşu blokların kenarlarıyla
hizalanma çizgileri (gridstack'te yok, elle çizilecek).

**Maliyet.** Orta. **Bağımlılık.** U54.

---

## Paralel şerit — sıraya bağlı değil

### U57. Güvenlik başlıkları (R21 / backlog #10)

`workers/app.ts:40` SSR yanıtını dokunmadan döndürüyor. CSP, HSTS, XFO,
Referrer-Policy, Permissions-Policy yalnız `/i/`, `/b/`, `/api/gorsel`
uçlarında. Bekleyen tek gerçek güvenlik borcu. **Maliyet.** Orta.

### U58. `/api/username-check` sınırı (R22)

`server/index.ts:172` — oturum da istemiyor, throttle da yok. Repoda hiçbir
yerde rate limiting yok. **Maliyet.** Küçük (+ panel işi, backlog #1).

### U59. Sosyal `url` sunucuda kurulsun (R11)

`layout.ts:235` — `url` istemciden geliyor, şablondan yeniden kurulmuyor;
yalnız http(s) doğrulaması var. **Maliyet.** Küçük.

### U60. Belge borcu

Planlarda hiç geçmeyenler: dört blok tipi (`ayet`, `location`, `document`,
fotoğraf+galeri birleşmesi), taslak/yayın ayrımı, Apple OAuth, `/i/:id` edge
önbelleği, yükleme öncesi küçültme, bağlantı kartı sürümleri. Ayrıca widget
planının "apps/web'de test altyapısı yok / 253 test" cümleleri yanlış (714
test var). **Maliyet.** Küçük.

---

## Bilerek yapılmayanlar

| ne | neden |
|---|---|
| L / T / artı şekilli bloklar | CSS Grid alanı dikdörtgen olmak zorunda; `clip-path` kesilen köşeyi grid alanı bırakıyor; `GridStackWidget` yalnız `{x,y,w,h}`; `container-type: size` L'nin sınırlayıcı dikdörtgenini verir; `shape-inside` hiçbir tarayıcıda yok → L'ye metin konamaz |
| 12 kolon | 1,5 çarpanı canlı tek sayılı ölçüleri (`LINK_IMAGE_DIMS 5×3`, `AYET_GRID_DEFAULTS.meal 4×3`) bozar |
| 32 kolon | mobilde basamak 18,75px — dokunmatikte kullanılamaz |
| Çoklu seçim + toplu hizalama | pahalı; U50 + U56 aynı sorunu çözüyor |
| Bölüm başına ayrı ızgara | eski deploy göreli `y`yi mutlak sanıp blokları üst üste bindirir |
| Widget kapak görseli (R70) | kapsam dışı, ayrı iş |
| Kutusuz ikonda "ince halka" kontrast çözümü | ölçüldü: temanın en kötü çipini kurtaran halka, aynı temadaki diğer çiplere karşı düşüyor (light `%60` halka linkedin çipine 1,12) |
| Avatar değişince eski asset'i silmek | `AGENTS.md` Değişmez #9 ihlali; çözüm referans sayımlı toplu temizlik (backlog #6) |
| Avatar için kırpma arayüzü | yüklemede kare kırpma yeterli; sürükle/yakınlaştır ayrı ve büyük iş, talep gelmeden yapma |
| Mobilde ızgarayı ayrı bölmek (`sm` 4'te kalsın) | `pos.sm.h` iki cihazda aynı birim olmak zorunda; `withDerivedSmPositions` (`layout.ts:1323`) ve şema tek birim varsayıyor |

---

## Verification Contract

| Kapı | Komut |
|---|---|
| Tip kontrolü | `pnpm typecheck` |
| Testler | `pnpm test` (714 → artacak) |
| Build | `pnpm --filter @caka/web build` |
| Deploy | `pnpm --filter @caka/web run deploy` |

Her birim sonrası **tarayıcıda doğrulama zorunlu**, mobil ve masaüstü, üç
yüzeyde: public `/:username`, editör, panel önizlemesi.

## Definition of Done

- Üç kapı temiz, test sayısı arttı.
- Faz 0: oturum düştüğünde emek kaybolmuyor; profil fotoğrafı
  değiştirilebiliyor; OAuth iptali sessiz değil.
- Faz 1: kutusuz blok altı temada ölçülmüş kontrastla çalışıyor.
- Faz 2: bölümler masaüstü ve mobilde doğru gruplanıyor, erişilebilir.
- Faz 4: göç öncesi/sonrası aynı sayfa piksel piksel aynı.
- Her fazda canlı doğrulama yapıldı ve raporlandı.
