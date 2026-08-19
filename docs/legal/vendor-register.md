# Tedarikçi kaydı

Caka'nın kişisel veriye dokunan tüm üçüncü tarafları. `/gizlilik` §6 tablosu bu
kayıttan türetildi.

**Tarih:** 2026-08-19 · **Kaynaklar:** `apps/web/wrangler.jsonc`,
`apps/web/app/root.tsx`, `apps/web/server/auth.ts`, `server/github.ts`,
`server/og.ts`, `server/avatar.ts`, `server/map-frame.ts` (artık proxy değil —
yalnız `api.mapbox.com` adresini kurar; `/api/harita` ucu kaldırıldı),
`app/components/location-card.tsx`, `server/location.ts`,
Cloudflare paneli (binding ve ayar teyidi).

> ### Mekanizma sütunu bilerek boş
> "Yurt dışı aktarım mekanizması" sütunundaki her hücre **boştur** ve boş
> olduğu görünür. 7499 sayılı değişiklikten sonra (01.06.2024) açık rıza
> yalnızca arızi hâllerden biridir; Cloudflare gibi bir tedarikçiye yapılan
> **rutin ve sistematik** aktarım buna dayanamaz. KVKK m.9'un kademeli
> rejiminde bugün kullanılabilir yollar: Kurul onaylı standart sözleşme
> (imzadan itibaren beş iş günü içinde Kurum'a bildirim), taahhütname + Kurul
> izni, veya bağlayıcı şirket kuralları. Yeterlilik kararı yayımlanmış ülke
> yok.
>
> Bu boşluk **OQ2a**'dır. Artık bir yayın kapısı değil: `/gizlilik` §6 bunu
> bir placeholder olarak saklamak yerine **açıkça ifşa ediyor** — aktarım
> gerçekleşiyor, hizmetin çalışması için teknik olarak zorunlu, uygun bir
> güvenceye bağlanmış değil ve bağlanması için çalışma sürüyor. Gerekçe zinciri
> (standart sözleşmenin iki taraflı imza şartı, Cloudflare DPA v6.4'te Türkiye
> ve KVKK atfının hiç bulunmaması, arızilik tanımı nedeniyle açık rızanın da
> kapalı olması) `bilinen-aciklar.md`'dedir. **Bugün mevcut bir açıktır** — hukuki
> sayfalar hiç yayınlanmasa bile uygulama, veritabanı, dosya deposu ve loglar
> zaten Cloudflare'de.
>
> Ek not: **açık rıza bu boşluğu kapatmaz.** Yurt Dışına Aktarım Yönetmeliği
> m.16/1 arıziliği "süreklilik arz etmeyen ve olağan faaliyet akışı içinde
> bulunmayan" aktarım olarak tanımlar; arızilik şartı m.9/6'nın **tamamını**,
> açık rıza bendi dâhil, kapsar.

> ### Rol sütunu hakkında dürüstlük notu
> "İşleyen / ayrı veri sorumlusu" ayrımı, imzalanmış bir veri işleme
> sözleşmesi bulunmadığı için **hukuken teyit edilmiş değildir**; aşağıdaki
> nitelemeler işin fiilî akışından çıkarılmıştır. Tedarikçilerin kendi alt
> işleyen listeleri **incelenmedi** — yani "alt işleyen" zinciri bu kayıtta
> eksiktir ve öyle işaretlidir. Sözleşme süreci (OQ2a) yürütülürken bu sütun
> da yeniden yazılacaktır.

---

## A. Ziyaretçinin tarayıcısının **doğrudan** temas ettiği tedarikçiler

Bu grupta ziyaretçinin IP adresi ve User Agent'ı, biz aracı olmadan
tedarikçiye ulaşır. Aydınlatma yükümlülüğü buradan doğar.

| Tedarikçi | Hizmet | Ulaşan veri | Rol | Bölge | Yurt dışı aktarım | Mekanizma |
|---|---|---|---|---|---|---|
| **Cloudflare, Inc.** — CDN / Workers | Sitenin sunulduğu ağ ve çalışma ortamı | Her isteğin tamamı: IP, User Agent, adres, başlıklar, gövde | Veri işleyen | ABD merkezli; anycast küresel ağ. **Kova/veritabanı bölgesi doğrulanmadı** | **Evet** | ⬚ *(boş — OQ2a)* |
| **Cloudflare, Inc.** — Web Analytics beacon | Çerezsiz ziyaret ölçümü; `static.cloudflareinsights.com` | Sayfa adresi, yönlendiren, ülke, tarayıcı/cihaz sınıfı + beacon isteğiyle IP ve User Agent. **Cihaza yazma yok** | Veri işleyen | Aynı | **Evet** | ⬚ *(boş — OQ2a)* |
| **Indian Type Foundry (Fontshare)** | Yazı tipleri; `api.fontshare.com` (CSS) + `cdn.fontshare.com` (font dosyaları) | **Her sayfa yüklemesinde** IP adresi ve User Agent. Cihaza yazma yok | Fiilen ayrı veri sorumlusu (kendi altyapısı, bizim talimatımız yok) | Hindistan merkezli firma; **CDN sunucu konumu doğrulanmadı** | **Evet** | ⬚ *(boş — OQ2a)* |
| **Google LLC** — Sign in with Google | Kimlik doğrulama yönlendirmesi | Kullanıcı girişi **başlattığında** Google'a yönlendirilir; istek ve dönüşte bize iletilen hesap bilgisi Google'ın kendi politikasıyla işlenir | Ayrı veri sorumlusu | ABD | **Evet** | ⬚ *(boş — OQ2a)* |
| **Apple Inc.** — Sign in with Apple | Kimlik doğrulama yönlendirmesi | Aynı akış | Ayrı veri sorumlusu | ABD | **Evet** | ⬚ *(boş — OQ2a)* |
| **Google LLC — YouTube gömülü oynatıcı** ⚠️ *(yalnız tıklamayla)* | Profildeki YouTube kartında videonun yerinde oynatılması; `youtube-nocookie.com/embed` | **Ziyaretçi oynata basarsa**: IP, User Agent, gömme adresi. Oynatma başlayınca **çerez yazabilir** | Ayrı veri sorumlusu | ABD | **Evet** | ⬚ *(uygulanamaz — sözleşme tarafı yok; aktarım ziyaretçinin kendi eylemiyle)* |
| **Spotify AB — gömülü oynatıcı** ⚠️ *(yalnız tıklamayla)* | Profildeki Spotify kartında parçanın yerinde çalınması; `open.spotify.com/embed` | Aynı akış | Ayrı veri sorumlusu | İsveç / AB | **Evet** | ⬚ *(uygulanamaz)* |
| **Mapbox, Inc.** — statik harita karesi (`server/map-frame.ts`) ⚠️ *(2026-08-19'da B'den A'ya taşındı)* | Konum kartının koyu harita görüntüsü. İki `<img>` doğrudan `api.mapbox.com/styles/v1/mapbox/dark-v11/static/…` adresini yükler; araya biz girmiyoruz | Konum kartı taşıyan bir profil açıldığında **2 doğrudan istek**: ziyaretçinin **IP adresi** ve **User Agent**'ı; adres yolundaki **yuvarlanmış** koordinat (≈1,1 km) ve yakınlaşma kademesi; herkese açık `pk.*` jeton; `Referer` — `strict-origin-when-cross-origin` politikası gereği yalnız **origin** (`https://caka.app/`), profil yolu değil. **Cihaza yazma yok** (yanıtta `Set-Cookie` yok, `<img>` isteği kimlik bilgisi taşımaz) | Fiilen ayrı veri sorumlusu (kendi altyapısı, bizim talimatımız yok) | ABD merkezli; sunum ağı küresel (CloudFront) | **Evet** | ⬚ *(boş — OQ2a)* |

### ⚠️ Gömülü oynatıcılar — tıklama kapısının arkasında

YouTube ve Spotify kartları **sayfa açılışında hiçbir şey yüklemez**. Görünen
kapak görseli birinci taraf proxy'sinden gelir; o siteye tek istek bile
gitmez. Oynatıcı yalnız ziyaretçi oynat düğmesine bastığında yüklenir.

Bu, "iki tıklama" desenidir ve bilinçli seçilmiştir:

- Sayfa açılışında gömseydik, profile bakan **herkes** hiçbir şey yapmadan
  YouTube ve Spotify'a tanıtılmış olurdu — üstelik profil sahibinin
  koyduğu bir içerik yüzünden, ziyaretçinin haberi olmadan.
- Tıklama aynı zamanda **bilgilendirilmiş bir eylemdir**: düğmenin
  etiketinde bağlantının kurulacağı yazıyor, `/cerez-politikasi` §6 ve
  `/gizlilik` §6 ayrıntısını veriyor.
- YouTube için `youtube-nocookie.com` kullanılıyor. Bu takibi azaltır ama
  **çerezi tamamen kaldırmaz**: oynatma başladığında çerez yazılır. Metinler
  bunu abartmadan, olduğu gibi söylüyor.

Bu çerezler bize ait olmadığı için `cookie-inventory.md` tablosunda **yer
almazlar** — envanter yalnız kendi yazdıklarımızı kapsar.

---

### ✅ Uzak `ogImage` — kapatıldı (2026-08-18)

Bu bölüm daha önce kaydın en zayıf noktasıydı: önizleme görselinin host'unu
profil sahibi belirliyordu ve ziyaretçinin tarayıcısı o siteye **doğrudan**
gidiyordu. Sonuç, üçüncü taraf çerezi yazılabilmesi ve IP/UA sızıntısıydı.

Artık görseller birinci taraf proxy'sinden (`GET /api/gorsel`) servis ediliyor:

- İsteği Worker atar; ziyaretçinin IP'si ve User Agent'ı uzak siteye **ulaşmaz**.
- Yanıt bizde **sıfırdan kurulur**; uzak sitenin `Set-Cookie` dâhil hiçbir
  başlığı ziyaretçiye geçmez. Üçüncü taraf çerezi yazılamaz.
- `Referer` gönderilmez; uzak site hangi profilden gelindiğini göremez.
- Uç **HMAC ile imzalıdır**: yalnız Caka'nın ürettiği adresler proxy'lenir,
  yani açık bir görsel geçidi değildir. İmza sırrı tanımsızsa uç tamamen
  kapanır (fail-closed) ve önizleme görselleri hiç gösterilmez.

Kalan artık risk, dürüstlük gereği: görsel önbelleğe alınmadığı **ilk**
seferde, isteğin zamanlaması uzak siteye profilin o sıralarda görüntülendiğini
gösterir. Ziyaretçiyi tanımlamaz. `/gizlilik` §6 bunu açıkça yazıyor.

Tedarikçi satırı bu nedenle **A bölümünden B bölümüne taşındı**.

---

### 🗺️ Konum kartı — ziyaretçi **doğrudan** Mapbox'a bağlanır (2026-08-19'da değişti)

Bu bölüm daha önce şunu yazıyordu: *"Ziyaretçi hiçbir harita sunucusuna istek
atmaz."* **Bu artık doğru değil ve iddia burada bırakılmıyor.** Konum kartı
taşıyan bir profil açıldığında ziyaretçinin tarayıcısı `api.mapbox.com`'a
**iki doğrudan istek** atar; IP adresi ve User Agent Mapbox, Inc.'e (ABD)
ulaşır. Tedarikçi satırı bu yüzden **B bölümünden A bölümüne taşındı** —
`ogImage`'ın 2026-08-18'de yaptığının tam tersi yönde.

**Neden değişti — tercih değil, sözleşme.** Eski mimari (Worker kareyi çeker →
Cache API'de tutar → `caka.app`'ten servis eder) Mapbox Product Terms
(21 Temmuz 2026) tarafından **açıkça yasaklanmış** durumda. §2.8.1 "Mapping
APIs":

> "Customer shall not distribute Licensed Map Content, including from a cache,
> by proxying, or by using a screenshot or other static image instead of
> accessing Licensed Map Content directly from the Mapping APIs."

§1.9 "Default Restrictions" (iv)-(v) aynı şeyi olumlu ve olumsuz biçimde
tekrarlar: müşteri içeriğe "only … directly from Mapbox APIs" erişebilir ve
"not export, download, cache or store Licensed Map Content". Mapbox'ın izin
verdiği **tek** önbellek son kullanıcının cihazındadır (en çok 30 gün) ve o
önbelleğin de "directly from the Mapping APIs" doldurulması şarttır — yani
tarayıcının kendi HTTP önbelleği. Bu yüzden `/api/harita` proxy ucu
**silindi**.

**Ziyaretçiden Mapbox'a bugün ne gidiyor:**

- **IP adresi ve User Agent** — iki istekte de. Kaçınılmaz; doğrudan bağlantının
  tanımı bu.
- **Yolun içindeki koordinat** — iki ondalığa **yuvarlanmış** (≈1,1 km) ve
  yakınlaşma kademesi. Şema yuvarlamayı zorunlu tutuyor
  (`packages/shared/src/layout.ts`), yani sokak çözünürlüğünde bir koordinat
  hiç kaydedilmiyor ve dolayısıyla hiç gönderilemiyor.
- **Herkese açık `pk.*` jeton** — aşağıya bakınız; sır değil.
- **`Referer`** — `<img>` üzerinde açıkça `strict-origin-when-cross-origin`
  verildiği için yalnızca **origin**: `https://caka.app/`. Profil yolu
  gitmiyor. Sonuç: Mapbox "birinin Caka'da konum kartı taşıyan *bir* sayfaya
  baktığını" ve **hangi yerin** kartta olduğunu öğrenir; **kimin profili**
  olduğunu öğrenmez.

**Ayakta kalan hafifletmeler:**

- **Çerez yok.** `api.mapbox.com` statik görsel yanıtında `Set-Cookie`
  **gözlenmedi** (curl ile doğrulandı; dönen başlıklar `content-type`,
  `server: awselb/2.0`, CloudFront `x-cache`/`via`/`x-amz-cf-*`, `alt-svc`,
  `date`). Ayrıca `<img>` isteği kimlik bilgisi taşımaz — bir çerez yazılsa
  bile bizim taşıyabileceğimiz bir yol yok. İddia bundan fazlasını söylemiyor.
- **JS yok, kutucuk sunucusu yok, etkileşim yok.** Kart hâlâ iki `<img>`'den
  ibaret; MapLibre + kutucuk sunucusu (~200 KB JS ve ziyaretçi başına onlarca
  istek) bilinçli olarak seçilmedi. Değişen şey isteğin **sayısı ve türü**
  değil, **kime gittiği**.
- **Tembel yükleme.** İki `<img>` de `loading="lazy"`; ekran dışında kalan bir
  kart hiç istek doğurmaz.
- **Jeton yoksa özellik kapalı.** `MAPBOX_PUBLIC_TOKEN` tanımsızsa kareler hiç
  kurulmaz ve kart haritasız gradyan tasarımına düşer (fail-closed).
- **Konum arama ziyaretçinin eylemi değil.** `/api/konum` oturum ister; profil
  sayfası açıldığında hiç çağrılmaz (Photon, aşağıda §B).
- **Saat dilimi hiçbir tedarikçiye sorulmaz:** koordinattan çevrimdışı
  hesaplanıyor (`@photostructure/tz-lookup`, CC0).

#### Jeton (`MAPBOX_PUBLIC_TOKEN`) — sır değil, kısıtlı

`pk.*` jetonu tasarım gereği HTML'e basılır; Değişmez #6 anlamında bir sır
**değildir**. Korumasını Mapbox panelindeki **URL kısıtlaması** sağlar (yalnız
`https://caka.app/*` ve geliştirme için localhost); kısıtlamayı Mapbox
`Referer` başlığına bakarak uygular. Yani referrer politikasının origin
göndermesi aynı zamanda teknik bir zorunluluktur — `no-referrer` verilseydi
jeton kısıtlaması isteği reddederdi.

#### Sağlayıcı seçimi — proxy mimarisine izin verenler para istedi

Soru artık "kim sunucuda önbelleğe izin veriyor" değil; o soruya **ücretsiz**
bir cevap çıkmadı. Karşılaştırma, düzeltmesiyle birlikte:

| Sağlayıcı | Sunucuda önbellekleyip yeniden sunmak |
|---|---|
| **Mapbox** (seçilen) | ❌ **Açıkça yasak.** Bu kayıt önce "⚠️ şartlar sessiz" diyordu; **yanlıştı ve sessizce düzeltilmiyor**: Product Terms §2.8.1 önbellekten dağıtımı, proxy'lemeyi ve "screenshot or other static image" ile ikame etmeyi ad ad yasaklıyor, §1.9(iv)-(v) erişimin "directly from Mapbox APIs" olmasını şart koşuyor |
| Önceki sağlayıcı (bu değişiklikle sökülen) | ✅ Şartlarında **açıkça** izinliydi — ama yalnız **ücretli abonelik sürdüğü sürece** (20 USD/ay); ücretsiz katmanı ayrıca ticari kullanıma kapalıydı. Adı ve şart alıntısı kaydın önceki sürümünde (git geçmişi) durur |
| MapTiler | ❌ Açıkça yasak ("prohibited to store, save, and/or redistribute any map content from a server-side cache") |
| Thunderforest | ❌ Açıkça yasak ("caching proxies… are not permitted") |
| CARTO basemaps | ❌ Ücretsiz genel kullanıma kapalı (yalnız kurumsal müşteriler) |
| `tile.openstreetmap.org` | ❌ Toplu indirme/proxy yasak; ayrıca koyu stili yok |
| Geoapify | ⚠️ Şartlar **sessiz** — sessizlik izin değildir |
| OpenFreeMap / Protomaps | — Yalnız vektör; Worker içinde raster üretecek bir yol yok (Canvas/WebGL yok) |

Yani proxy mimarisine sözleşmeyle izin veren tek yol **aylık ödeme**ydi. Takas
açıktı ve bu kez **para değil, gizlilik bedeli seçildi**: dekoratif bir kart
için aylık 20 USD abonelik alınmadı, karşılığında ziyaretçi üçüncü bir tarafa
tanıtılmış oldu. Bu, kaydın A bölümüne bilerek eklenmiş bir satırdır — bedeli
gizlemek değil, yazmak.

**Ücretsiz katman ve maliyet tavanı yok.** Mapbox statik görselde ayda **50.000
istek** ücretsiz; sonrası 500 bine kadar **1,00 USD/1.000**. Kart görüntülemesi
başına iki istek (uzak kare + yakın kare) düştüğü için 50.000 istek ≈ **ayda
25.000 konum kartı görüntülemesi**; aynı ziyaretçinin 12 saat içindeki tekrar
görüntülemeleri bedava, çünkü Mapbox görseli `max-age=43200` ile veriyor ve
tarayıcı kendi önbelleğinden okuyor.

Dürüstlük notu: **Mapbox harcama tavanı sunmuyor** ("Mapbox does not provide
the ability to cap your monthly billing"). Ücretsiz katman aşıldığında harita
kararmıyor, 429 dönmüyor — **faturalanıyor**. Ödeme yöntemi tanımlı değilse
fatura gecikmiş hâle geliyor ve nihayetinde "the account will be deactivated …
all access tokens and Mapbox services are immediately suspended"; o noktada
kart sessizce haritasız tasarımına düşer. Ayrı bir hız sınırı da var:
**dakikada 1.250 istek** → HTTP 429.

#### Atıf yükümlülüğü — kartta görünür

Kare `attribution=false&logo=false` ile filigransız isteniyor. Bu bir kaçış
değil, zorunluluk: kartın `object-fit: cover` düzeni ve yakınlaşma dönüşümü
gömülü filigranı kırpıp götürüyor. Yükümlülük dolayısıyla bize geçiyor ve
kart **sağ alt köşesinde** şunları basıyor (`components/location-card.tsx`):

- Resmî **Mapbox kelime markası** (Mapbox'ın atıf için `mapbox-gl.css` ile
  dağıttığı SVG),
- **© Mapbox** → `www.mapbox.com/about/maps`,
- **© OpenStreetMap** → `www.openstreetmap.org/copyright`,
- **Improve this map** → `apps.mapbox.com/feedback/`.

Dayanak: Product Terms **§1.4.1** (logo + iki © bağlantısı) ve **§1.4.2**
("Improve this map"), ayrıca Mapbox'ın atıf kılavuzu — statik görsellerde aynı
kümeyi "in a textual description near the image" istiyor. Harita verisi
**ODbL** (OpenStreetMap); stil Mapbox'ın `dark-v11`'i. Arama sonuçlarının atfı
(`© OpenStreetMap contributors — Photon (Komoot)`) editör panelinde görünür.

---

## B. Yalnızca **sunucudan** çağrılan tedarikçiler

Bu grupta ziyaretçinin tarayıcısı tedarikçiye hiç istek atmaz; çağrıyı Worker
yapar, dolayısıyla ziyaretçinin IP adresi tedarikçiye ulaşmaz.

| Tedarikçi | Hizmet | Ulaşan veri | Rol | Bölge | Yurt dışı aktarım | Mekanizma |
|---|---|---|---|---|---|---|
| **Cloudflare, Inc.** — D1 (`caka-db`) | Veritabanı | `data-map.md`'deki tüm tablolar | Veri işleyen | **Doğrulanmadı** (`wrangler.jsonc`'de konum ipucu yok) | **Evet** | ⬚ *(boş — OQ2a)* |
| **Cloudflare, Inc.** — R2 (`caka-assets`) | Dosya deposu | Yüklenen görseller, avatar kopyaları | Veri işleyen | **Doğrulanmadı** | **Evet** | ⬚ *(boş — OQ2a)* |
| **Cloudflare, Inc.** — Workers Logs | Çalışma kayıtları (`observability.enabled: true`) | İstek adresi, yanıt kodu, süre, hata izleri; istek meta verisi | Veri işleyen | **Doğrulanmadı** | **Evet** | ⬚ *(boş — OQ2a)* |
| **GitHub, Inc.** | Katkı grafiği verisinin alınması (public HTML parçası `/users/<login>/contributions`, `server/github.ts`; kimlik doğrulaması yok) | Yalnızca gösterilecek **GitHub kullanıcı adı**. Ziyaretçinin IP'si GitHub'a ulaşmaz | Veri kaynağı / ayrı veri sorumlusu | ABD | **Evet** (giden handle bakımından) | ⬚ *(boş — OQ2a)* |
| **og:image kazıması** — hedef siteler (`server/og.ts`) | Bağlantının önizleme görselinin bulunması | Profil sahibinin girdiği **URL**; isteği Worker atar, gövde akış hâlinde ve en fazla 1 MB okunur | Bizim tedarikçimiz değil | Belirsiz — URL'i profil sahibi girer | Duruma göre | ⬚ *(uygulanamaz)* |
| **Önizleme görseli proxy'si** — hedef host'lar (`server/image-proxy.ts`) | Uzak önizleme görselinin birinci taraftan servis edilmesi | Yalnızca görselin **adresi**; isteği Worker atar, ziyaretçinin IP'si ve User Agent'ı uzak host'a ulaşmaz | Bizim tedarikçimiz değil; host'u profil sahibi seçer | Belirsiz | Duruma göre | ⬚ *(uygulanamaz — sözleşme tarafı yok)* |
| **Photon (Komoot GmbH, Almanya)** — yer arama (`server/location.ts`) | Editörde yazdıkça yer arama; anahtarsız açık uç. **Yalnız oturumlu kullanıcı** tetikler, ziyaretçi asla | Düzenleyenin yazdığı **arama metni** ("kadıköy") ve arayüz dili. İsteği Worker atar; kullanıcının IP'si Komoot'a ulaşmaz | Veri kaynağı / ayrı veri sorumlusu | Almanya / AB | **Hayır** (AB içi; yine de yurt dışı) | ⬚ *(uygulanamaz — sözleşme tarafı yok)* |
| **YouTube (Google LLC)** — oEmbed, kanal sayfası, RSS akışı (`server/youtube.ts`) | Video/kanal bilgisinin ve en son videonun alınması | Profil sahibinin girdiği **video/kanal adresi**; istek Worker'dan gider, ziyaretçinin IP'si YouTube'a ulaşmaz | Ayrı veri sorumlusu | ABD | **Evet** (giden adres bakımından) | ⬚ *(boş — OQ2a)* |
| **jsDelivr (Prospect One)** — Kur'an metni CDN'i (`server/quran.ts`) | Ayet bloğunda gösterilecek Arapça metnin ve Türkçe mealin alınması; `cdn.jsdelivr.net/gh/fawazahmed0/quran-api` statik JSON | Yalnızca istenen **sure/ayet numarası** (arama sorgusu gönderilmez — arama Worker içinde yapılır). İstek **yalnız editörde**, oturumlu kullanıcı için atılır; ziyaretçinin IP'si CDN'e ulaşmaz | Bizim tedarikçimiz değil; açık kaynak dağıtım ağı | Polonya merkezli, anycast küresel ağ | **Evet** (giden ayet numarası bakımından) | ⬚ *(uygulanamaz — sözleşme tarafı yok, kişisel veri gitmiyor)* |
| **Google (googleusercontent.com)** — avatar kopyası (`server/avatar.ts`) | Google profil fotoğrafının R2'ye kopyalanması | Yalnızca görsel URL'i; istek Worker'dan gider | Ayrı veri sorumlusu | ABD | **Evet** | ⬚ *(boş — OQ2a)* |

---

## C. Cloudflare — doğrulanmış yapılandırma

Panelde ve `wrangler.jsonc`'de teyit edilenler:

| Ayar | Durum |
|---|---|
| R2 kovası | `caka-assets` (binding `BUCKET`) |
| D1 veritabanı | `caka-db` (binding `DB`) |
| Workers Logs | **Açık** (`observability.enabled: true`) |
| Workers Traces | **Kapalı** |
| `workers.dev` alt alanı | **Kapalı** |
| Özel alan adı | Tek: `caka.app` |
| Web Analytics | **Açık**, Automatic setup, zone geneli (~2 gün önce açıldı) |

Cloudflare tek tedarikçide **beş ayrı rol** üstleniyor (çalışma ortamı,
veritabanı, dosya deposu, ağ, ölçüm). Bu bir yoğunlaşma riskidir ve OQ2a
sözleşmesi tek bir tedarikçiyle çözüldüğünde tamamı kapsanmalıdır — parça
parça değil.

---

## D. Bu kayıtta kasıtlı olarak **bulunmayanlar**

- **Google Analytics 4 yok** (KD4). Alınmadı; bedeli kabul edildi: UTM kampanya
  atıfı ve Google Ads bağlantısı yok.
- **Reklam ağı, remarketing pikseli, chat widget'ı, hata izleme SaaS'ı,
  e-posta pazarlama aracı yok.**
- **CAPTCHA/bot koruma script'i yok.**
- **Ödeme sağlayıcısı yok** (ticarileşme henüz yok).

- **Etkileşimli harita / kutucuk sunucusu yok.** Konum kartı iki statik
  `<img>` kullanıyor: harita JS'i, kutucuk akışı ve etkileşim yok. **Ama
  ziyaretçi artık `api.mapbox.com`'a doğrudan bağlanıyor** — bu satır "üçüncü
  taraf teması yok" demek DEĞİLDİR; bkz. §A'daki Mapbox satırı ve konum notu.

Bu liste boş kaldığı sürece footer'daki çerez iddiası ayakta kalır. Buraya bir
satır eklendiği gün `cookie-inventory.md` ve `trust-claims.md` de aynı commit'te
gözden geçirilir.

---

## E. Doğrulanmamış olarak kayıtlı olanlar

1. Cloudflare D1 / R2 / Logs / Web Analytics'in **fiziksel bölgesi**.
2. Cloudflare ve Fontshare'in **saklama süreleri**.
3. Tedarikçilerin **alt işleyen listeleri**.
4. Fontshare CDN'inin sunucu konumu.
5. **Hiçbir tedarikçiyle imzalanmış veri işleme veya aktarım sözleşmesi yok**
   (OQ2a). Kayıttaki "rol" nitelemeleri fiilî akıştan çıkarılmıştır.

---

## F. Kur'an metninin kaynağı ve atıf yükümlülüğü

Ayet bloğu (`server/quran.ts`, `packages/shared/src/quran.ts`) telifli metin
taşıyor; kaynak seçimi bu yüzden hukuki bir karardır ve gerekçesi burada durur.

**Denetim tarihi:** 2026-08-19.

### Reddedilen kaynak — `github.com/diyanet-bid/Kuran`

Depo Apache-2.0 lisanslı ama **veri deposu değil**: tek bir ayet içermiyor,
Next.js uygulaması `DIB_KURAN_API_BASE_URL` + `DIB_KURAN_API_TOKEN` ile
korunan kapalı bir Diyanet ucundan okuyor. Apache-2.0 yalnızca uygulama
kodunu kapsıyor; **metnin kendisi için yayımlanmış bir kullanım izni yok** ve
token başvuruya bağlı. Kullanılamadı.

### Kullanılan kaynaklar

| Katman | Edisyon | Sahibi / kaynağı | Durum |
|---|---|---|---|
| Arapça metin | `ara-quranuthmanihaf` (Osmanî hat, Hafs) | Kral Fahd Kur'an Basım Kompleksi (qurancomplex.gov.sa) | Kur'an'ın Arapça metni ~1400 yıllık, telifsiz bir metindir; korunabilir olan yalnız dijital edisyonun kendisidir ve kaynak burada gösterilir |
| Türkçe meal | `tur-elmalilihamdiya` | Elmalılı Hamdi Yazır (ö. **27 Mayıs 1942**) | **Kamu malı.** FSEK m.27 koruma süresi (ölüm + 70 yıl) **31.12.2012**'de doldu |
| Taşıyıcı | `fawazahmed0/quran-api` | Unlicense (kamu malına adama) | Anahtarsız statik JSON; jsDelivr CDN'inden servis edilir |

### Bilinçli olarak KULLANILMAYAN meal

**Diyanet İşleri meali** güncel bir eserdir, telifi Diyanet İşleri
Başkanlığı'ndadır ve Tanzil üzerinden dağıtılan kopyası açıkça *"yalnız ticari
olmayan amaçlarla"* kaydını taşır (tanzil.net/trans, 2026-08-19). Caka ticari
bir üründür; bu meal alınmadı.

Aynı sebeple **Tanzil'in çeviri koleksiyonu** bir bütün olarak kullanılmıyor.
Tanzil'in *Arapça metin* lisansı (CC BY 3.0) ticari kullanıma açıktır; bugün
Arapça metin başka bir edisyondan geldiği için Tanzil atfı gerekmiyor. Arapça
edisyon Tanzil'e çevrilirse, "Tanzil Project" adı ve tanzil.net bağlantısı
**zorunlu** hâle gelir.

### Kalan risk (açık)

`tur-elmalilihamdiya` edisyonunun metni, Elmalılı'nın 1935-1939 tarihli özgün
mealinin **sadeleştirilmiş** bir hâli gibi okunuyor. Sadeleştirme ayrı bir
işleme eser sayılırsa, sadeleştirenin telifi hâlâ sürüyor olabilir ve
sadeleştireni adlandıran bir kayıt bulunamadı. Özgün eserin kamu malı olduğu
kesin, sadeleştirmenin durumu **belirsizdir**. Bu, `bilinen-aciklar.md`'ye
taşınacak bir açıktır; kapatmanın yolu, doğrudan Elmalılı'nın özgün metnine
dayanan bir edisyona geçmek ya da izin almaktır.

### Atıf nasıl karşılanıyor

- **Kartta:** meal gösteren her sürüm çevirmenin adını basar
  (`.ayet-source`, `widget.ayet.mealCredit`). Ad kayıtta saklanır
  (`mealTranslator`), varsayılandan türetilmez — ileride ikinci bir meal
  eklendiğinde eski bloklar yanlış çevirmene atfedilmesin.
- **Kodda:** kaynak, lisans ve gerekçe `apps/web/server/quran.ts` başlığında.
- **Burada:** yukarıdaki tablo.

### Ziyaretçi tarafı

Ayet metni bloğun verisinde saklanır. **Profil sayfası hiçbir dış kaynağa
istek atmaz** (R58): CDN yalnızca editörde, oturumlu kullanıcı için ve
yalnızca sure/ayet numarası göndererek çağrılır. Cihaza yazma yok, bu yüzden
`cookie-inventory.md`'ye girdi eklenmedi.
