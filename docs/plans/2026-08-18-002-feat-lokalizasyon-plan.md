---
title: Lokalizasyon - Bes Dil, Dil Onekli URL'ler ve Otomatik Algilama - Plan
type: feat
date: 2026-08-18
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: brainstorming
execution: code
---

# Lokalizasyon - Bes Dil, Dil Onekli URL'ler ve Otomatik Algilama - Plan

## Goal Capsule

- **Amaç:** Caka'yı tek dilli (Türkçe) bir üründen beş dilli bir ürüne çevirmek:
  `en`, `tr`, `es`, `pt-BR`, `de`. Ziyaretçinin dili tarayıcısından algılanır;
  algılanamazsa Türkçe. Diller SEO için URL önekiyle ayrılır, kullanıcı dili
  ayarlardan değiştirebilir.
- **Yetki sırası:** `AGENTS.md` değişmezleri > bu plan > `ARCHITECTURE.md` (bayat).
- **Yürütme profili:** Aşama A (locale çekirdeği) her şeyin önkoşulu. Aşama C
  (içerik katalogları) modül başına bağımsız, paralel yürür. Aşama D (hukuki
  İngilizce) hacmen en ağır ve diğerlerinden bağımsız.
- **Durma koşulları:** Türkçe adreslerden hiçbirini kırma — `/gizlilik`,
  `/ayarlar`, `/login` bugünkü hâliyle kalır. Hukuki İngilizce metinde Türkçe
  kaynaktan sapma. Ziyaretçinin cihazına envantere girmemiş bir şey
  yazma (KTD21).
- **Kuyruk sahipliği:** Commit'leri ana oturum atar. Deploy yalnızca
  `pnpm --filter @caka/web run deploy` (Değişmez #11).

---

## Product Contract

### Summary

Beş dil (`en`, `tr`, `es`, `pt-BR`, `de`), Türkçe kanonik ve öneksiz. Dil sırası
üç aşamada çözülür: URL öneki → `caka_dil` çerezi → `Accept-Language`; hiçbiri
tutmazsa Türkçe. Öneksiz bir adrese gelen ve Türkçe olmayan ziyaretçi 302 ile
kendi diline yönlendirilir; arama motoru botları yönlendirilmez. Arayüz metni
locale başına tipli kataloglara bölünür, eksik çeviri `pnpm typecheck`'i kırar.
Hukuki belgeler Türkçe ve İngilizce yayımlanır; diğer üç dil İngilizceyi görür
ve sayfada bağlayıcı sürümün Türkçe olduğu yazar.

### Problem Frame

Ürün bugün tek dilli. `AGENTS.md` "kullanıcıya görünen her metin Türkçe yazılır"
diyor ve metinlerin çoğu Değişmez #5 sayesinde zaten `app/content/*.ts`
modüllerinde toplu — yani katalog altyapısının yarısı kurulu, ama dil boyutu yok.
İki yapısal engel var:

1. **Metin dağınıklığı kalıntısı.** `routes/edit.tsx` (~56 gömülü metin) ve
   `routes/onboarding.kurulum.tsx` (~14) Değişmez #5'e uymuyor; bu metinler
   çıkarılmadan editör çevrilemez.
2. **`:username` catch-all'u.** Dil önekleri top-level segment olduğu için
   rezerve isim listesiyle çakışma riski taşıyor (Değişmez #1).

Hukuki metinler ayrı bir problem sınıfı: ~13 800 kelimelik üç belge KVKK'ya göre
yazıldı ve `docs/legal/` kayıtlarına dayanıyor. İngilizce sürüm serbest yeniden
yazım değil, bölüm bölüm birebir karşılık olmalı — yoksa iki dil farklı şeyler
vaat eder (bkz. LKD8).

### Requirements

Kimlikler bu plana özeldir (`L` öneki); MVP planındaki `R`/`KTD`/`U` uzayıyla
çakışmaz.

| ID | Gereksinim |
|---|---|
| L1 | Desteklenen diller `en`, `tr`, `es`, `pt-BR`, `de`; varsayılan ve kanonik dil `tr`. |
| L2 | Dil çözümleme sırası: URL öneki → `caka_dil` çerezi → `Accept-Language` → `tr`. İlk tutan kazanır, kalan adımlar atlanır. |
| L3 | `Accept-Language` q-değerlerine göre sıralanarak ayrıştırılır. `pt` ve `pt-PT` → `pt-BR`; `en-US`/`en-GB` vb. → `en`. Bölge etiketi tanınmayan dilde yok sayılır. |
| L4 | Türkçe öneksizdir. Diğer diller `/en`, `/es`, `/pt-br`, `/de` önekiyle sunulur. |
| L5 | Bugün yayında olan Türkçe adreslerin hiçbiri değişmez ve yönlendirilmez. |
| L6 | Route slug'ları dil başına çevrilir (`/en/privacy`, `/de/datenschutz`); slug tablosu tek kaynaktan gelir. |
| L7 | Öneksiz adrese gelen istekte çerez yoksa, istemci bot değilse ve algılanan dil `tr` değilse → **302** eşdeğer adrese, `Vary: Accept-Language` başlığıyla. 301 kullanılmaz (Değişmez #10 gerekçesi). |
| L8 | Bot istekleri (isbot) hiçbir koşulda yönlendirilmez; kanonik Türkçe sayfayı görür. |
| L9 | `/:username` profil sayfaları dil öneki almaz; tek ve kanonik adreste kalır. |
| L10 | Arayüz metni locale başına katalog dosyalarında durur; Türkçe kanonik ve tip kaynağıdır. Eksik veya fazla anahtar `pnpm typecheck`'i kırar. |
| L11 | Hukuki belgeler `tr` ve `en` olarak yayımlanır. `es`/`pt-BR`/`de` istekleri İngilizce belgeyi alır ve sayfada bağlayıcı sürümün Türkçe olduğunu söyleyen bir şerit görünür. |
| L12 | Hukuki yayın kapısı (`isLegalDocumentPublished`) dil başına çalışır: bir dildeki doldurulmamış alan yalnız o dili 404'ler, diğer diller yayında kalır. |
| L13 | Hukuki belge metinleri istemci paketine düşmez; yalnız istenen dilin bölümleri `loaderData` ile taşınır. |
| L14 | Her sayfa beş `hreflang` alternatifi ve `x-default` (→ Türkçe kök) yayar; `canonical` o dilin kendi adresidir. |
| L15 | `<html lang>`, `og:locale`, `og:locale:alternate` ve JSON-LD `inLanguage` aktif dilden türer. |
| L16 | `sitemaps/core.xml` beş dilin URL'lerini `xhtml:link` alternatifleriyle üretir; `robots.txt` `Disallow` satırları dil önekli karşılıklarını kazanır. |
| L17 | Ayarlar sayfasında dil bölümü: beş seçenek, her biri kendi dilinde yazılı. Seçim `caka_dil` çerezini yazar ve aynı sayfanın yeni dildeki adresine gider. |
| L18 | `SiteFooter`'da dil seçici bulunur — oturumsuz ziyaretçinin dili değiştirebileceği tek yer. |
| L19 | `caka_dil` çerezi `packages/shared/src/cookies.ts` envanterine `zorunlu` kategorisinde girer; `/cerez-politikasi` tablosunda ve `docs/legal/cookie-inventory.md`'de görünür. |
| L20 | `pt-br` `RESERVED_USERNAMES`'e eklenir (Değişmez #1). Diğer önekler `USERNAME_MIN`in altında olduğu için erişilemez; yine de listeye girer ve test edilir. |

### Key Decisions

| ID | Karar | Gerekçe |
|---|---|---|
| LKD1 | i18n kütüphanesi kullanılmaz; tipli katalog modülleri kullanılır. | ~1 000 kelimelik arayüzde i18next'in ~40 KB runtime'ı ve düz anahtar sözlüğüne geçiş, tip güvenliğini ve Değişmez #5'in okunabilir içerik nesnelerini kaybettirir. Katalog yaklaşımı eksik çeviriyi derleme zamanında yakalar. |
| LKD2 | Türkçe öneksiz; slug'lar dil başına çevrilir. | Mevcut adresler ve sitemap kırılmaz (L5), her dil kendi anahtar kelimesiyle indekslenir. Bedeli route başına 5 slug'lık tablo. |
| LKD3 | Yönlendirme 302 ve bot'suz. | Google ABD'den `en-US` ile tarar; bot yönlendirilirse Türkçe sayfalar indeksten düşer. 301 tarayıcıda süresiz cache'lenir (Değişmez #10 gerekçesi). |
| LKD4 | Dil tercihi yalnız çerezde; veritabanı sütunu yok. | Migration ve senkronizasyon noktası eklemeden oturumsuz ziyaretçiyi de kapsar. Cihazlar arası taşınma gerekirse sonradan `profile.locale` eklenebilir. |
| LKD5 | Arayüz katalogları beş dille birlikte istemciye iner; hukuki metinler inmez. | Arayüz katalogları küçük (~1 000 kelime × 5 ≈ 12 KB gzip) ve Vite zaten route başına böler; dinamik import şelalesi kurmak bu boyutta karmaşıklığı hak etmiyor. Hukuki belgeler belge başına 30–45 KB olduğu için sunucuda kalır. Bir katalog büyürse hukuki desene (loader üzerinden taşıma) geçirilir. |
| LKD6 | Hukuki metinler TR + EN; diğer diller EN'e düşer. | 3 000 satır × 4 dil hacmen taşınabilir değil ve karşılığı yok. İngilizce ikinci sürüm, bağlayıcılık Türkçede kalır (L11). |
| LKD7 | `/:username` öneksiz. | Kullanıcının içeriği çevrilmediği için dil önekli kopyalar kopya içerik üretir ve SEO kazancı getirmez. |
| LKD8 | Hukuki İngilizce metni proje içinde yazılır; dış hukuki inceleme süreci kurulmaz. | Caka ücretsiz, açık kaynak, tek kişilik bir yan proje. Metinler avukatla üretilmedi; var olma sebepleri profesyonel duruş ve Google/Apple sağlayıcı kaydında istenen bağlantılar. Bu ölçekte avukat incelemesi kurmak gerçekçi değil ve ürünün geri kalanıyla orantısız. Risk, bağlayıcılığın Türkçede kalmasıyla (L11) ve metnin Türkçe kaynağa sadık kalmasıyla sınırlanır. |

### Acceptance Examples

- `Accept-Language: de-DE,de;q=0.9,en;q=0.8` ile `/` istenir → 302 `/de`,
  yanıtta `Vary: Accept-Language`.
- Aynı istek `User-Agent: Googlebot/2.1` ile → 200, Türkçe landing, yönlendirme yok.
- `caka_dil=tr` çerezi ve `Accept-Language: de` ile `/` → 200 Türkçe; çerez
  algılamayı ezer.
- `/en/privacy` → İngilizce gizlilik belgesi, üstünde bağlayıcı sürüm şeridi.
- `/de/datenschutz` → İngilizce belge (L11), `<html lang="de">`, şerit görünür.
- `/gizlilik` → bugünkü Türkçe belge, bugünkü adres, yönlendirme yok.
- Ayarlardan Español seçilir → `caka_dil=es` yazılır, `/ayarlar` → `/es/ajustes`.
- `content/landing/de.ts`'ten bir anahtar silinir → `pnpm typecheck` kırılır.
- `/es/ahmet` → 404; profil yalnız `/ahmet` adresinde (L9).

### Scope Boundaries

**Kapsamda:** landing, hukuki sayfalar, login, onboarding (4 route), dashboard,
ayarlar, editör, hata sınırları, e-posta dışı tüm arayüz metni; SEO meta ve
sitemap; dil değiştirici (ayarlar + footer); çerez envanteri.

**Kapsam dışı:** Kullanıcı içeriğinin çevrilmesi (profil blokları, widget
başlıkları — kullanıcının kendi metni). Para birimi ve fiyatlandırma (ürün
bugün ücretsiz). Sağdan sola yazım. Tarih/sayı biçimlendirmesinin
`Intl` ötesine geçen özelleştirmesi. `profile.locale` veritabanı sütunu (LKD4).
Çeviri yönetim aracı entegrasyonu (Crowdin vb.).

### Sources

- Tasarım kararları bu plandan önceki brainstorming oturumunda kullanıcıyla
  madde madde onaylandı (dil listesi ve öncelik sırası kullanıcının verdiği
  tablodan gelir).
- Mevcut durum okumaları: `app/routes.ts`, `workers/app.ts`, `app/root.tsx`,
  `app/lib/seo.ts`, `server/seo.ts`, `app/content/**`, `packages/shared/src/
  username.ts`, `packages/shared/src/cookies.ts`.

---

## Planning Contract

### Key Technical Decisions

1. **Slug tablosu `packages/shared/src/routes.ts`'te yaşar.** Hem `app/routes.ts`
   üretimi hem worker yönlendirmesi hem SEO alternatifleri hem dil değiştirici
   aynı tablodan okur. İkinci bir kaynak oluşursa diller sessizce ayrışır.
2. **`app/routes.ts` döngüyle üretilir.** 12 uygulama route'u × 5 dil = 60 kayıt;
   her biri aynı route modülünü benzersiz `id` ile kullanır. Elle yazılmaz.
   Uygulama route'ları `:username` catch-all'undan önce durur (Değişmez #1).
3. **Yönlendirme `workers/app.ts`'te, React Router'a devretmeden önce.** Tek
   noktada, bütün öneksiz yollara uniform uygulanır ve RR'a maliyet bindirmez.
   Okuma yardımcıları `server/locale.ts`'te (route dosyasına iş mantığı yazılmaz).
4. **Dil bağlamı kök loader'dan gelir.** `root.tsx` bir loader kazanır, çözülen
   locale'i döner; `useLocale()` hooku bunu okur. Bileşenler kataloğu
   `katalog[locale]` ile seçer — prop drilling yok.
5. **Katalog tip sözleşmesi Türkçe dosyadan türetilir.** `as const` kullanılmaz,
   böylece alanlar `string`e genişler ve `export type XContent = typeof tr`
   diğer dört dosya için `satisfies` sözleşmesi olur.

### High-Level Technical Design

```
packages/shared/src/
  locale.ts      SUPPORTED_LOCALES, DEFAULT_LOCALE, önek eşlemesi,
                 parseAcceptLanguage(), resolveLocale()
  routes.ts      ROUTE_SLUGS tablosu, pathFor(), parseLocalizedPath(),
                 localizePath()
  cookies.ts     + caka_dil girdisi
  username.ts    + "pt-br" rezerve

apps/web/
  workers/app.ts        302 algılama kapısı (isbot + çerez + Accept-Language)
  server/locale.ts      istekten locale okuma, çerez yazma yardımcıları
  app/routes.ts         slug tablosundan üretilen 60 kayıt
  app/root.tsx          loader → locale, <html lang>, LocaleProvider
  app/lib/locale.ts     useLocale(), useCatalog()
  app/lib/seo.ts        buildSeoMeta(locale, routeKey) → hreflang + og:locale
  app/content/
    landing/{index,tr,en,es,pt-BR,de}.ts
    ayarlar/    onboarding/    widget/    github/    analitik/    editor/
    legal/
      {tr,en}/{gizlilik,kullanim-kosullari,cerez-politikasi}.ts
      index.ts   dil başına kapı ve yayın listesi (sunucu-only, bugünkü gibi)
  server/seo.ts         sitemap dil URL'leri + robots dil önekli Disallow
```

Slug tablosu (L6). Türkçe sütunu **bugünkü adreslerin birebir aynısıdır** ve
değiştirilmez (L5); yeni Türkçe slug uydurulmaz.

| route anahtarı | tr | en | es | pt-BR | de |
|---|---|---|---|---|---|
| `home` | *(kök)* | `en` | `es` | `pt-br` | `de` |
| `login` | `login` | `login` | `acceder` | `entrar` | `anmelden` |
| `edit` | `edit` | `edit` | `editar` | `editar` | `bearbeiten` |
| `dashboard` | `dashboard` | `dashboard` | `panel` | `painel` | `uebersicht` |
| `ayarlar` | `ayarlar` | `settings` | `ajustes` | `configuracoes` | `einstellungen` |
| `gizlilik` | `gizlilik` | `privacy` | `privacidad` | `privacidade` | `datenschutz` |
| `kullanim-kosullari` | `kullanim-kosullari` | `terms` | `terminos` | `termos` | `nutzungsbedingungen` |
| `cerez-politikasi` | `cerez-politikasi` | `cookies` | `cookies` | `cookies` | `cookie-richtlinie` |
| `onboarding` | `onboarding` | `onboarding` | `bienvenida` | `bem-vindo` | `willkommen` |
| `onboarding.tamamla` | `onboarding/tamamla` | `onboarding/finish` | `bienvenida/finalizar` | `bem-vindo/concluir` | `willkommen/abschliessen` |
| `onboarding.hazir` | `onboarding/hazir` | `onboarding/ready` | `bienvenida/listo` | `bem-vindo/pronto` | `willkommen/fertig` |
| `onboarding.kurulum` | `onboarding/kurulum/:step` | `onboarding/setup/:step` | `bienvenida/configuracion/:step` | `bem-vindo/configuracao/:step` | `willkommen/einrichtung/:step` |

Slug'lar ASCII'dir (`ss`/`ae` yerine düz karşılık: `abschliessen`,
`uebersicht`) — URL'de aksan ve umlaut yüzdeleme kaçışına yol açar.

Veri akışı: istek → worker locale kapısı (gerekirse 302) → RR route eşleşmesi
(önek route'un kendi locale'ini belirler) → kök loader locale'i context'e koyar →
route loader'ı gerekiyorsa sunucu-only içeriği (hukuki) taşır → bileşenler
`useLocale()` + katalog ile render eder.

### Sequencing

Aşama A (locale çekirdeği) ve B (taşıyıcı katman) sıralı ve her şeyin önkoşulu.
Aşama C'deki katalog birimleri birbirinden bağımsız, paralel yürüyebilir.
Aşama D (hukuki) A ve B dışında hiçbir şeye bağlı değil, en erken başlayabilir ve
en uzun sürer. Aşama E (SEO) B'yi bekler. Aşama F kapanış.

---

## Implementation Units

| U | Başlık | Bağımlılık |
|---|---|---|
| L-U1 | `shared/locale.ts`: dil listesi, `Accept-Language` ayrıştırma, çözümleme zinciri + testler | — |
| L-U2 | `shared/routes.ts`: slug tablosu, `pathFor`/`parseLocalizedPath`/`localizePath` + testler; `pt-br` rezerve | L-U1 |
| L-U3 | `app/routes.ts` üretimi (60 kayıt) + `root.tsx` loader, `<html lang>`, `LocaleProvider`, `useLocale()` | L-U2 |
| L-U4 | `workers/app.ts` 302 kapısı (isbot + çerez + `Vary`), `server/locale.ts` | L-U3 |
| L-U5 | `caka_dil` çerezi: `cookies.ts` envanteri + `docs/legal/cookie-inventory.md` | L-U4 |
| L-U6 | `content/landing/` beş dil | L-U3 |
| L-U7 | `content/ayarlar/` beş dil + ayarlarda Dil bölümü (L17) | L-U3, L-U5 |
| L-U8 | `content/onboarding/`, `content/widget/`, `content/github/` beş dil | L-U3 |
| L-U9 | `content/analitik/` beş dil (ülke ve bağlantı adları dahil) | L-U3 |
| L-U10 | `routes/edit.tsx` + `onboarding.kurulum.tsx` gömülü metinlerin `content/editor/`'a çıkarılması, sonra beş dil | L-U3 |
| L-U11 | Hata metinleri: `root.tsx` ErrorBoundary ve 404 yüzeyleri beş dil | L-U3 |
| L-U12 | `content/legal/` dil bazlı yeniden yapılandırma, dil başına kapı (L12), bağlayıcılık şeridi (L11) | L-U3 |
| L-U13 | Üç hukuki belgenin İngilizce sürümü (~13 800 kelime) | L-U12 |
| L-U14 | `buildSeoMeta` locale farkındalığı: hreflang, `x-default`, `og:locale`, JSON-LD `inLanguage` | L-U3 |
| L-U15 | `server/seo.ts`: sitemap dil URL'leri + `robots.txt` dil önekli `Disallow` | L-U14 |
| L-U16 | `SiteFooter` dil seçici (L18) | L-U7 |
| L-U17 | `AGENTS.md` değişmez güncellemesi ("ürün dili Türkçe" → "TR kanonik, beş dil katalogda") | tümü |
| L-U18 | Test tamamlama + lokal ve canlı doğrulama | tümü |

---

## Verification Contract

| Kapı | Komut |
|---|---|
| Tip kontrolü | `pnpm typecheck` |
| Testler | `pnpm test` |
| Build | `pnpm --filter @caka/web build` |
| Deploy | `pnpm --filter @caka/web run deploy` (Değişmez #11) |

Birim testleri (`packages/shared`): `Accept-Language` q-sıralaması, `pt`/`pt-PT`
→ `pt-BR` eşlemesi, bilinmeyen dil → `tr`, çerez önceliği, slug ileri/geri
çözümü, `localizePath` gidiş-dönüş tutarlılığı, her locale'in her route slug'ını
taşıdığı, bir locale içinde slug çakışması olmadığı, `pt-br`'nin rezerve listede
olduğu.

Eksik çeviri için ayrı test yazılmaz: tip sözleşmesi (LKD1) bunu `pnpm typecheck`
kapısına bağlar.

Duman testleri (lokal ve deploy sonrası): beş dilin kökü, bir hukuki sayfa her
dilde, `Googlebot` User-Agent ile yönlendirme yapılmadığı, `caka_dil` çerezinin
algılamayı ezdiği, `Vary: Accept-Language, Cookie` başlığının varlığı.

**Dil kapısını test ederken gerçek bir tarayıcı User-Agent'ı gönderilmeli.**
`isbot` `curl`, `wget` ve çıplak `fetch` istemcilerini bot sayar; kapı da
bot'ları bilerek yönlendirmez (L8). User-Agent verilmezse test her zaman
"yönlendirme yok" görür ve kırık bir kapı doğru sanılır.

## Definition of Done

- Dört kapı da temiz; test sayısı arttı.
- Beş dilin tamamı her kapsam-içi sayfada tam çeviriyle açılıyor; hiçbir yüzeyde
  karışık dil yok.
- Bugün yayında olan Türkçe adreslerin hiçbiri değişmedi ve yönlendirilmiyor.
- `Googlebot` User-Agent'ıyla yapılan isteklerde yönlendirme yok; kanonik Türkçe
  sayfa dönüyor.
- Her sayfada beş `hreflang` alternatifi + `x-default` var ve hepsi 200 dönüyor.
- Hukuki sayfalar `tr` ve `en` yayında; diğer üç dilde İngilizce belge ve
  bağlayıcılık şeridi görünüyor.
- `caka_dil` çerezi envanterde ve `/cerez-politikasi` tablosunda görünüyor.
- Ayarlarda ve footer'da dil değiştirici çalışıyor; seçim sayfa değişse de kalıcı.
- `AGENTS.md`'nin "ürün dili Türkçedir" ifadesi güncellendi.
- Mobil ve masaüstünde canlı doğrulama yapıldı ve sonucu raporlandı.

## Risks & Dependencies

- **Bot yönlendirmesi SEO'yu kırabilir.** `isbot` kapısı yanlış kurulursa Google
  Türkçe sayfaları `/en`'e yönlendirilmiş görür ve kanonik sürüm indeksten düşer.
  L-U4 deploy edilmeden önce `Googlebot` User-Agent'ıyla curl doğrulaması şart.
- **Hukuki İngilizce, Türkçe kaynaktan sapmamalı.** Tek gerçek risk çeviride
  anlam kayması: Türkçe metin bir şey vaat ederken İngilizce başka bir şey
  vaat ederse bağlayıcılık şeridi (L11) bunu kurtarmaz. Bu yüzden İngilizce
  sürüm serbest yeniden yazım değil, bölüm bölüm birebir karşılık olarak
  yazılır ve `docs/legal/` kayıtlarıyla (data-map, cookie-inventory,
  vendor-register, trust-claims) çelişmediği kontrol edilir.
- **`edit.tsx` 1533 satır.** L-U10 hem en büyük metin çıkarma işi hem de en
  kırılgan dosya; bu birim tek başına ve dikkatli yürütülmeli.
- **60 route kaydı build süresini ve manifest boyutunu artırır.** Ölçülmedi;
  L-U3 sonrası `pnpm --filter @caka/web build` çıktısı kontrol edilmeli.
- **`ARCHITECTURE.md` bayat** — route listesi ve sayfa adları güncel değil;
  planlama ona dayanmamalı. Düzeltilmesi ayrı iş.
- **Katalogların beş dille istemciye inmesi (LKD5) ölçülmedi.** Landing paketinin
  gzip boyutu L-U6 sonrası kontrol edilmeli; beklenenden büyük çıkarsa o katalog
  hukuki desene (loader üzerinden taşıma) geçirilir.
