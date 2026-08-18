# Tedarikçi kaydı

Caka'nın kişisel veriye dokunan tüm üçüncü tarafları. `/gizlilik` §6 tablosu bu
kayıttan türetildi.

**Tarih:** 2026-08-17 · **Kaynaklar:** `apps/web/wrangler.jsonc`,
`apps/web/app/root.tsx`, `apps/web/server/auth.ts`, `server/github.ts`,
`server/og.ts`, `server/avatar.ts`, Cloudflare paneli (binding ve ayar teyidi).

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
> kapalı olması) `placeholders.md`'dedir. **Bugün mevcut bir açıktır** — hukuki
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
| **Profil sahibinin seçtiği uzak görsel host'ları** ⚠️ | `/:username` sayfalarındaki sosyal blok önizleme görselleri | IP adresi ve User Agent o siteye ulaşır **ve o site tarayıcıya kendi çerezini yazabilir** | Bizim tedarikçimiz değil; her biri kendi veri sorumlusu | Belirsiz — host'u profil sahibi seçer | **Evet, ama önceden bilinemez** | ⬚ *(uygulanamaz — sözleşme tarafı yok)* |

### ⚠️ Uzak `ogImage` — bu kaydın en zayıf noktası

`apps/web/app/components/profile-block.tsx:101`'deki `<img src={ogImage}>`
etiketinin host'unu **profil sahibi** belirler. Sonuç:

- İstek bizim sunucumuzdan geçmez; ziyaretçinin tarayıcısı doğrudan o siteye
  gider.
- O site yanıtta `Set-Cookie` gönderip **üçüncü taraf çerezi** yazabilir ve aynı
  çerezle ziyaretçiyi **farklı Caka profilleri arasında** eşleyebilir.
- `referrerPolicy="no-referrer"` yalnızca `Referer` başlığını keser; çerezi de
  IP/UA sızıntısını da engellemez.
- Bu çerezler bize ait olmadığı için `cookie-inventory.md` tablosunda **yer
  almazlar** — envanter yalnız kendi yazdıklarımızı kapsar. `/gizlilik` §6 bu
  ayrımı açıkça anlatıyor.

Gerçek çözüm Worker proxy'sidir ve bu planın kapsamı dışına alınmıştır
(`docs/backlog.md`). **Bu maddeyi kapatana kadar "üçüncü taraf çerezi yok"
şeklinde bir iddia kullanılamaz** — footer'daki ifade bilerek "reklam ve
analitik çerezi kullanmıyoruz" (yani *biz* yazmıyoruz) biçiminde dar
tutulmuştur; bkz. `trust-claims.md`.

---

## B. Yalnızca **sunucudan** çağrılan tedarikçiler

Bu grupta ziyaretçinin tarayıcısı tedarikçiye hiç istek atmaz; çağrıyı Worker
yapar, dolayısıyla ziyaretçinin IP adresi tedarikçiye ulaşmaz.

| Tedarikçi | Hizmet | Ulaşan veri | Rol | Bölge | Yurt dışı aktarım | Mekanizma |
|---|---|---|---|---|---|---|
| **Cloudflare, Inc.** — D1 (`caka-db`) | Veritabanı | `data-map.md`'deki tüm tablolar | Veri işleyen | **Doğrulanmadı** (`wrangler.jsonc`'de konum ipucu yok) | **Evet** | ⬚ *(boş — OQ2a)* |
| **Cloudflare, Inc.** — R2 (`caka-assets`) | Dosya deposu | Yüklenen görseller, avatar kopyaları | Veri işleyen | **Doğrulanmadı** | **Evet** | ⬚ *(boş — OQ2a)* |
| **Cloudflare, Inc.** — Workers Logs | Çalışma kayıtları (`observability.enabled: true`) | İstek adresi, yanıt kodu, süre, hata izleri; istek meta verisi | Veri işleyen | **Doğrulanmadı** | **Evet** | ⬚ *(boş — OQ2a)* |
| **GitHub, Inc.** | Katkı grafiği verisinin alınması (GraphQL API, `server/github.ts`) | Yalnızca gösterilecek **GitHub kullanıcı adı**. Ziyaretçinin IP'si GitHub'a ulaşmaz | Veri kaynağı / ayrı veri sorumlusu | ABD | **Evet** (giden handle bakımından) | ⬚ *(boş — OQ2a)* |
| **og:image kazıması** — hedef siteler (`server/og.ts`) | Sosyal blok bağlantısının önizleme görselinin bulunması | Profil sahibinin girdiği **URL**; isteği Worker atar, sayfanın ilk 128 KB'ı okunur, içerik proxy'lenmez | Bizim tedarikçimiz değil | Belirsiz — URL'i profil sahibi girer | Duruma göre | ⬚ *(uygulanamaz)* |
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
