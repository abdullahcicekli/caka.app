# Tedarikçi kaydı

Caka'nın kişisel veriye dokunan tüm üçüncü tarafları. `/gizlilik` §6 tablosu bu
kayıttan türetildi.

**Tarih:** 2026-08-19 · **Kaynaklar:** `apps/web/wrangler.jsonc`,
`apps/web/app/root.tsx`, `apps/web/server/auth.ts`, `server/github.ts`,
`server/og.ts`, `server/avatar.ts`, `server/map-frame.ts`, `server/location.ts`,
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

### 🗺️ Konum kartı — harita ziyaretçiye birinci taraftan gelir

Konum bloğu, bu kaydın en dikkat isteyen yeni yüzeyi: bir harita kartı normalde
ziyaretçinin tarayıcısını doğrudan bir kutucuk sunucusuna bağlar. Burada
bağlamıyor.

- **Ziyaretçi hiçbir harita sunucusuna istek atmaz.** Kart iki `<img>`'den
  ibaret ve ikisi de `/api/harita` yolundan geliyor; kareyi Worker çekiyor,
  Cache API'de 30 gün tutuyor ve yanıtı **sıfırdan** kuruyor (sağlayıcının
  `Set-Cookie` dâhil hiçbir başlığı geçmiyor). Etkileşimli harita (MapLibre +
  kutucuk sunucusu) bilinçli olarak SEÇİLMEDİ: her ziyaretçiyi üçüncü tarafa
  tanıtır ve ~200 KB JS ekler.
- **API anahtarı ziyaretçiye ulaşmaz.** Sağlayıcı adresini yalnız Worker
  kuruyor; ziyaretçinin gördüğü adres yalnız koordinat + kademe + HMAC imzası
  taşıyor. (Bu yüzden `/api/gorsel` yeniden kullanılmadı: o uç hedef adresi
  sorgu dizesinde gösterir.)
- **Uç imzalı.** İmzasız bırakılsaydı herkesin kullanabileceği bedava bir
  harita CDN'i olurdu. Anahtar ya da imza sırrı tanımsızsa uç **tamamen
  kapalıdır** ve kart haritasız tasarımına düşer (fail-closed).
- **Koordinat yuvarlanmış.** Kayda iki ondalık (≈1,1 km) giriyor ve uç, gelen
  koordinatı yeniden yuvarlıyor — elle yazılmış tam çözünürlüklü bir istek
  bile sokak düzeyinde harita çekemez.
- **Konum arama ziyaretçinin eylemi değil.** `/api/konum` oturum ister; profil
  sayfası açıldığında hiç çağrılmaz.
- **Saat dilimi hiçbir tedarikçiye sorulmaz:** koordinattan çevrimdışı
  hesaplanıyor (`@photostructure/tz-lookup`, CC0).

#### Sağlayıcı seçimi neden Stadia Maps — ve neden ücretli

Mimarinin şartı şuydu: kareyi **sunucuda önbelleğe alıp kendi alan adımızdan
servis edebilmek**. Karşılaştırılan sağlayıcılarda durum:

| Sağlayıcı | Sunucuda önbellekleyip yeniden sunmak |
|---|---|
| **Stadia Maps** (`static_cacheable`) | ✅ Şartlarda **açıkça** izinli — "images may be saved, cached, modified, embedded… and redistributed by your… systems or your… infrastructure", **ücretli abonelik sürdüğü sürece** |
| MapTiler | ❌ Açıkça yasak ("prohibited to store, save, and/or redistribute any map content from a server-side cache") |
| Thunderforest | ❌ Açıkça yasak ("caching proxies… are not permitted") |
| CARTO basemaps | ❌ Ücretsiz genel kullanıma kapalı (yalnız kurumsal müşteriler) |
| `tile.openstreetmap.org` | ❌ Toplu indirme/proxy yasak; ayrıca koyu stili yok |
| Mapbox / Geoapify | ⚠️ Şartlar **sessiz** — sessizlik izin değildir |
| OpenFreeMap / Protomaps | — Yalnız vektör; Worker içinde raster üretecek bir yol yok (Canvas/WebGL yok) |

Yani ücretsiz seçeneklerin hiçbiri bu mimariye sözleşmeyle izin vermiyor.
Ücretsiz kalmanın tek yolu **etkileşimli haritaya geçip ziyaretçiyi kutucuk
sunucusuna bağlamaktı** — bu kaydın A bölümüne yeni bir satır, her profil
görüntülemesinde bir üçüncü taraf ve ~200 KB JS demek. Bedel karşılaştırması
bu yüzden "para mı, gizlilik mi" oldu ve para seçildi: **Stadia Maps Starter,
20 USD/ay.**

Anahtar (`STADIA_API_KEY`) tanımlanana kadar özellik kapalı; kart haritasız
hâliyle çalışır. Yani bu satır, anahtar tanımlandığı gün canlıya girer.

#### Atıf yükümlülüğü — kartta görünür

Kare `manual_attribution=true` ile filigransız isteniyor; yükümlülük bize
geçiyor ve kart sağ alt köşesinde **`© Stadia Maps © OpenMapTiles ©
OpenStreetMap`** yazıyor (`components/location-card.tsx`). Arama sonuçlarının
atfı (`© OpenStreetMap contributors — Photon (Komoot)`) editör panelinde
görünür. Harita verisi ODbL, stil ve kutucuklar sağlayıcının.

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
| **Stadia Maps** (Fiveonefour Labs / Stadia Maps, ABD) — statik harita karesi (`server/map-frame.ts`) | Konum kartının koyu harita görüntüsü. Kareyi **Worker** çeker, Cache API'de tutar ve `caka.app`'ten servis eder; ziyaretçinin tarayıcısı Stadia'ya **hiç bağlanmaz** | Profil sahibinin seçtiği yerin **yuvarlanmış** koordinatı (≈1,1 km) ve yakınlaşma kademesi. Ziyaretçinin IP'si ve User Agent'ı Stadia'ya ulaşmaz | Bizim tedarikçimiz (harita verisi sağlayıcısı) | ABD merkezli; sunum ağı küresel | **Evet** (giden koordinat bakımından) | ⬚ *(boş — OQ2a)* |
| **Photon (Komoot GmbH, Almanya)** — yer arama (`server/location.ts`) | Editörde yazdıkça yer arama; anahtarsız açık uç. **Yalnız oturumlu kullanıcı** tetikler, ziyaretçi asla | Düzenleyenin yazdığı **arama metni** ("kadıköy") ve arayüz dili. İsteği Worker atar; kullanıcının IP'si Komoot'a ulaşmaz | Veri kaynağı / ayrı veri sorumlusu | Almanya / AB | **Hayır** (AB içi; yine de yurt dışı) | ⬚ *(uygulanamaz — sözleşme tarafı yok)* |
| **YouTube (Google LLC)** — oEmbed, kanal sayfası, RSS akışı (`server/youtube.ts`) | Video/kanal bilgisinin ve en son videonun alınması | Profil sahibinin girdiği **video/kanal adresi**; istek Worker'dan gider, ziyaretçinin IP'si YouTube'a ulaşmaz | Ayrı veri sorumlusu | ABD | **Evet** (giden adres bakımından) | ⬚ *(boş — OQ2a)* |
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

- **Etkileşimli harita / kutucuk sunucusu yok.** Konum kartı statik kare
  kullanıyor; ziyaretçi hiçbir harita sunucusuna bağlanmıyor (bkz. §A üstündeki
  konum notu).

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
