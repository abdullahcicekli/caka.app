# Backlog — açık işler

Bitmemiş ama bilinçli olarak ertelenmiş işler. Yol haritası ve gerekçeler
`docs/plans/`'te; burası yalnızca "sonra yapılacak" listesi. Bir madde
tamamlandığında **sil** (durum git'ten okunur, buraya "yapıldı" yazma).

---

## 1. `/og/u/*` için rate limit — **kod değil, panel işi**

`GET /og/u/:username/<hash>.png` kimlik doğrulaması olmayan public bir uç ve
istek başına satori + resvg ile ~40 ms CPU harcayabiliyor.

Kod tarafındaki korumalar hazır:
- Cache anahtarı kanonik (query string ve harf farkı atılır) → `?a=1&a=2…` ile
  önbelleği atlayıp her istekte yeniden üretim tetiklenemiyor.
- Kaynak görselde ~40 MP tavanı → dev JPEG ile isolate OOM'a düşürülemiyor.
- Hash tutmayan istek üretim yapmadan 302 dönüyor.

Kalan: Cloudflare panelinden **zone seviyesinde** bir rate limit kuralı
(`/og/u/*` yoluna, IP başına makul bir eşik). Terraform/wrangler ile değil,
dashboard → Security → WAF → Rate limiting rules.

**Eşiği seçerken:** `/ayarlar` sayfası tek açılışta 6 önizleme isteği atıyor
(her şablon için bir tane). Eşik bunu meşru trafik saymalı, yoksa kullanıcı
kendi ayar sayfasında rate limit yer.

## 2. `/ayarlar` önizlemeleri tam boy PNG çekiyor

Şablon ızgarasındaki 6 önizleme ~110 px kutuda gösteriliyor ama 1200×630
üretiliyor. Soğuk önbellekte sayfa açılışı 6 tam render demek (her biri
satori + resvg). Bir kez üretildikten sonra `immutable` cache'e düşüyor, o
yüzden acil değil.

Yapılacak (istenirse): ızgara önizlemelerini IntersectionObserver ile gerçekten
ertele ya da küçük boyutlu bir önizleme varyantı üret (URL desenine boyut
segmenti eklemek gerekir; cache girdisi ikiye çıkar).

## 3. `github_calendar` satır temizliği

Kullanıcı GitHub handle'ını değiştirdikçe eski login satırı tabloda kalıyor;
hesap silmede de temizlenmiyor (Değişmez #9'daki asset temizlik disiplininin
karşılığı yok). Bugün zararsız: layout'ta o login kalmayınca satır hiç
sorgulanmıyor, en fazla ölü satır olarak duruyor.

Yapılacak: hesap silme akışına temizlik ekle; istenirse uzun süre
sorgulanmamış satırlar için budama.

## 4. Mobil çentik payı (`viewport-fit=cover`)

`app.css`'te `env(safe-area-inset-*)` kullanan kurallar var ama viewport
meta'sında `viewport-fit=cover` olmadığı için bu değerler iOS'ta **daima 0**
dönüyor — yani çentik payı fiilen uygulanmıyor. Taban değerler tek başına
doğru olacak şekilde ayarlandı, bu yüzden görünür bir bozukluk yok.

Yapılacak (istenirse): `viewport-fit=cover` ekle — ama o zaman landing, panel
ve editör dâhil **tüm sayfalarda** safe-area payı gözden geçirilmeli, aksi
hâlde içerik çentiğin altına girer.

## 5. GitHub katkı kartındaki metinler İngilizce

`app/content/github.ts`: `428 contributions in the last year`,
`12 contributions on Aug 16, 2026` vb. AGENTS.md "kullanıcıya görünen her
metin Türkçe" diyor; bu, GitHub'ın kendi biçimini birebir izlemek için
**bilinçli** bir istisna ve modül başında yorumla işaretli. `aria-label`'lar
Türkçe.

Karar bekliyor: Türkçeleştirilecekse tek dosyada tek değişiklik.

## 6. Uzak `ogImage` için Worker proxy'si — **bu listenin en değerlisi**

`profile-block.tsx:101`'deki `<img src={ogImage}>` etiketinin host'unu profil
sahibi seçiyor: ziyaretçinin tarayıcısı o siteye doğrudan gidiyor, IP'si ve
User Agent'ı oraya ulaşıyor ve o site yanıtta `Set-Cookie` göndererek
tarayıcıya **üçüncü taraf çerezi** yazabiliyor — aynı çerezle ziyaretçiyi
farklı Caka profilleri arasında eşleyebilir. `referrerPolicy="no-referrer"`
yalnızca `Referer`'ı kesiyor. Ertelenme sebebi kapsam: proxy demek yeni bir
Hono route'u, boyut/tip/timeout sınırları, cache stratejisi ve SSRF koruması
demek — hukuki yüzey planına sığmıyordu. Bugünkü durum gizlenmiyor:
`/gizlilik` §6 sızıntıyı olduğu gibi anlatıyor ve `docs/legal/vendor-register.md`
kaydediyor. **Kapatılana kadar footer'daki çerez ifadesi "hiç üçüncü taraf
çerezi yok" biçimine genişletilemez** (`docs/legal/trust-claims.md`).

## 7. Fontshare self-host

`app/root.tsx` fontları `api.fontshare.com` ve `cdn.fontshare.com`'dan çekiyor;
yani **her sayfa yüklemesinde** ziyaretçinin IP adresi ve User Agent'ı Indian
Type Foundry'ye ulaşıyor ve bu, yurt dışına aktarım kaydında ayrı bir satır
açıyor. Font dosyalarını depoya alıp kendi alanımızdan servis etmek bu satırı
tamamen siler ve bir tedarikçi bağımlılığını da kaldırır. Ertelendi çünkü
lisans koşullarının okunması, `woff2` alt kümelerinin üretilmesi ve
`@font-face` + preload zincirinin elle kurulması gerekiyor; ölçülebilir bir
kullanıcı sorunu da yok. Yapıldığında `docs/legal/vendor-register.md` §A'dan
Fontshare satırı ve `/gizlilik` §6'daki karşılığı kalkar.

## 8. Birinci taraf panel analitiği (R48)

Yaratıcının kendi sayfasının kaç kez görüntülendiğini ve hangi bağlantısına
tıklandığını göreceği ölçüm hattı. Cloudflare Web Analytics bunu veremiyor:
zone genelinde toplam sayıyor, profil başına kırılım ve tıklama olayı yok.
Ertelendi çünkü bu ayrı bir ürün özelliği — depolama (Analytics Engine ya da
D1), toplama uç noktası ve panelde bir ekran gerektiriyor. Tasarım kısıtı
şimdiden sabit: **ziyaretçi cihazına yazma veya cihazdan okuma yok**, ham IP
saklanmaz, üçüncü tarafa aktarım yok, çapraz site takibi yok — böylece çerez
rejimi hiç tetiklenmez. Rıza gerekmemesi işlemeyi hukuki sebepten muaf tutmaz;
sebep m.5/2-f'tir ve aydınlatma metnine öyle yazılır. Cihaza yazan bir tasarıma
kayarsa rıza sistemi gerekir; tasarımı planın Appendix'inde hazır duruyor.
Ayrıca "tekil ziyaretçi" metriği cihaza yazmadan üretilemiyor — metrikten
vazgeçmek ya da günlük dönen tuzlu IP+UA hash'i kullanmak arasındaki karar bu
işe devredildi.

## 9. Self-servis silme ve dışa aktarma

Bugün hesap silme akışı var ama **veri dışa aktarma yok** ve KVKK m.11
haklarının hiçbiri ürün içinden kullanılamıyor; hepsi e-postayla ve elle
karşılanıyor. Ertelendi çünkü doğru yapılması JSON dışa aktarma formatı, R2
nesnelerinin paketlenmesi ve silme sonrası yedek politikası kararı istiyor —
sonuncusu zaten `docs/legal/placeholders.md` §1'deki `[SAKLAMA SÜRELERİ]`
alanına bağlı. Kullanıcı sayısı düşükken elle karşılamak makul; ölçek
büyüdüğünde bu bir yük olur.

## 10. İlgili kişi başvuru yordamı

`/gizlilik` §8 başvuru yolunu tarif ediyor (`hello@caka.app`, 30 gün) ama
**yordamın kendisi yazılmadı**: başvuru nasıl kaydedilecek, kimlik nasıl
doğrulanacak, süre nasıl takip edilecek, yanıt nasıl arşivlenecek. Özellikle
gereken bir durum var: `github_calendar` tablosunun ilgili kişisi **hiç Caka
hesabı olmayan** bir GitHub kullanıcısı olabilir — yani hesabıyla kimlik
doğrulayamayacak bir başvuru sahibi (`docs/legal/data-map.md`). Ertelendi çünkü
kod değil süreç işi; ilk gerçek başvuru gelmeden önce yazılmalı.

## 11. R21 — güvenlik başlıkları ve CSP

Tüm SSR ve API yanıtlarına middleware'den uygulanacak başlıklar hâlâ yok: CSP
(`default-src`, sayfanın gerçek JS ayak izine göre en dar `script-src`,
`object-src 'none'`, `base-uri 'self'`, `form-action 'self'`,
`frame-ancestors 'none'`), `X-Frame-Options: DENY`, HSTS,
`X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`.
Ertelendi çünkü CSP'yi doğru yazmak için üçüncü taraf yüzeylerinin sabitlenmesi
gerekiyordu — ölçüm beacon'ı (`static.cloudflareinsights.com`), Fontshare
(`api`/`cdn.fontshare.com`) ve profil sayfalarındaki **host'u önceden
bilinemeyen** uzak görseller. Sonuncusu tek başına `img-src`'yi geniş bırakmayı
zorunlu kılıyor; §6'daki proxy işi bittiğinde CSP de gerçekten dar yazılabilir.
Bu ikisi sırayla yapılmalı.

## 12. `caka_claim` çerezinde `Secure` bayrağı yok

`app/routes/onboarding.tsx` bu çerezi tarayıcıda `document.cookie` ile yazıyor;
bu yüzden `HttpOnly` olamıyor (kaçınılmaz) ama `Secure` bayrağı da
taşımıyor (kaçınılmaz değil, sadece eklenmemiş). Prod tamamen HTTPS olduğu ve
çerez yalnızca kullanıcının birazdan herkese açık olacak kullanıcı adını 15
dakika taşıdığı için bugün somut bir risk yok — bu yüzden ertelendi.
`SameSite=Lax` ve `Path=/` zaten var. Yapılacak: yazma noktasına `Secure`
eklemek (lokal `http` geliştirmede çerezin düşeceğine dikkat) ve
`packages/shared/src/cookies.ts`'teki açıklama metnini güncellemek.
