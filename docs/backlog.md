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

**`/api/gorsel` için (b) yapıldı, (a) duruyor.** Uzak görsel proxy'si
(`server/image-proxy.ts`) oturumsuz; SSRF kuralları özel/dahili hedefleri
kapatıyor ama **public** bir hedefe istek üretmeyi tek başına engellemiyordu.

**(b) HMAC imzası — yapıldı (2026-08-18).** Adres artık `IMAGE_PROXY_SECRET`
ile imzalanıyor ve uçta sabit-zamanlı doğrulanıyor; yalnızca *bizim*
ürettiğimiz adresler proxy'lenebiliyor. Sır tanımsızsa uç tamamen kapalı
(fail-closed). İmza loader'da üretilip blok kimliğine anahtarlı ayrı bir
eşlemeyle taşınıyor (`server/layout-images.ts`) — bloğun `ogImage` alanına
yazılmıyor, çünkü editör aynı nesneyi kaydediyor ve kaynak adres kaybolurdu.
Bu, keyfi hedefe istek üretme yüzeyini kapatıyor.

**(a) zone seviyesinde rate limit — duruyor.** İmza, oturum açmış bir
kullanıcının kendi profiline çok sayıda uzak görsel koyup trafiği
büyütmesini engellemiyor; bir de imzalı bir adres bir kez üretildiğinde
tekrar tekrar çağrılabilir. Bugünkü sınırlayıcılar: 2 MB gövde tavanı, 5 s
zaman aşımı, en fazla 3 yönlendirme (her hop yeniden doğrulanır), `image/*`
allowlist'i (SVG hariç), kendi origin'ine proxy yasağı, 24 s önbellek ve
başarısızlıklarda 5 dk negatif önbellek.

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

## 6. Yerini kaybeden R2 nesneleri (orphan asset)

Bir görsel bloğundaki görsel değiştirildiğinde yalnızca `assetId` üzerine
yazılır; eski `asset` satırı ve R2 nesnesi yerinde kalır. Aynısı yükleyip
sayfaya hiç eklenmeyen görseller için de geçerli.

Bugün kanama sınırlı: R16 kotası (50 asset / 100 MB, `server/onboarding-api.ts`)
artık **uygulanıyor**, yani sızıntı sınırsız değil — ama kullanıcının kotasını
yiyor ve kotayı doldurduğunda kullanıcının yer açmak için bir yolu yok.

Silme bilinçli olarak yapılmadı çünkü **Değişmez #9** asset silmeyi yalnızca
hesap silmeye bırakıyor ve tek bir `assetId` şu dört yerden herhangi birinde
hâlâ referanslı olabilir:

1. `profile.layout` içindeki görsel blokları,
2. `profile.draft_layout` içindeki görsel blokları (yayınlanmamış taslak),
3. `profile.og_photo_asset_id` (paylaşım görseli seçimi),
4. profil kartının `avatarAssetId`'si.

Yani güvenli silme bir referans sayımı ister; "değiştirilen görseli hemen sil"
kısayolu taslak/yayın ayrımı yüzünden yayındaki sayfayı kırabilir.

Ayrıca kota kontrolü oku-sonra-yaz (`server/onboarding-api.ts`): D1'de işlem
yok, yani eşzamanlı yüklemelerde sınır **eşzamanlılık × 5 MB** kadar aşılabilir.
Sınırlı ve kendini toparlayan bir sapma. `server/avatar.ts:copyGoogleAvatar`
ise kotayı hiç kontrol etmiyor — bugün zararsız, çünkü yalnızca hesap
açılışında bir kez, kullanıcının ilk asset'i olarak çalışıyor.

Yapılacak (sırayla): (a) bu dört kaynağı tarayan bir referans kümesi
fonksiyonu — saf ve test edilebilir olması için `packages/shared`'da,
(b) hesap silme akışına (backlog #8) bağlı toplu temizlik, (c) istenirse
kullanıcının kendi görsellerini görüp silebildiği bir medya listesi
(`ayarlar/share-image-card.tsx` bunun yarısı). Değişmez #9 (c) ile birlikte
güncellenmeli.

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

Deseni artık depoda duruyor: Kur'an hattı (Amiri Quran) bu yolla kendi
sunucumuzdan servis ediliyor — `apps/web/app/fonts/`, `app.css`'teki
`@font-face`, `docs/legal/vendor-register.md` §F. Oradaki ölçüm bir uyarı da
taşıyor: **unicode subset'i şekillendirmeyi sessizce bozabiliyor**, o yüzden
subset alınacaksa öncesi/sonrası HarfBuzz'la karşılaştırılmalı.

## 8. Self-servis silme ve dışa aktarma

Bugün ne self-servis hesap silme ne de **veri dışa aktarma** var; KVKK m.11
haklarının hiçbiri ürün içinden kullanılamıyor; hepsi e-postayla ve elle
karşılanıyor. Ertelendi çünkü doğru yapılması JSON dışa aktarma formatı, R2
nesnelerinin paketlenmesi ve silme sonrası yedek politikası kararı istiyor —
sonuncusu artık `/gizlilik` §7'de yazılı (silme talebinden sonra en geç 3 ay,
Silme Yönetmeliği m.11/3) — yani hedef süre belli, uygulaması yok. Kullanıcı sayısı düşükken elle karşılamak makul; ölçek
büyüdüğünde bu bir yük olur.

## 9. İlgili kişi başvuru yordamı

`/gizlilik` §8 başvuru yolunu tarif ediyor (`hello@caka.app`, 30 gün) ama
**yordamın kendisi yazılmadı**: başvuru nasıl kaydedilecek, kimlik nasıl
doğrulanacak, süre nasıl takip edilecek, yanıt nasıl arşivlenecek. Özellikle
gereken bir durum var: `github_calendar` tablosunun ilgili kişisi **hiç Caka
hesabı olmayan** bir GitHub kullanıcısı olabilir — yani hesabıyla kimlik
doğrulayamayacak bir başvuru sahibi (`docs/legal/data-map.md`). Ertelendi çünkü
kod değil süreç işi; ilk gerçek başvuru gelmeden önce yazılmalı.

## 10. R21 — güvenlik başlıkları ve CSP

Tüm SSR ve API yanıtlarına middleware'den uygulanacak başlıklar hâlâ yok: CSP
(`default-src`, sayfanın gerçek JS ayak izine göre en dar `script-src`,
`object-src 'none'`, `base-uri 'self'`, `form-action 'self'`,
`frame-ancestors 'none'`), `X-Frame-Options: DENY`, HSTS,
`X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`.
Ertelendi çünkü CSP'yi doğru yazmak için üçüncü taraf yüzeylerinin sabitlenmesi
gerekiyordu — ölçüm beacon'ı (`static.cloudflareinsights.com`), Fontshare
(`api`/`cdn.fontshare.com`). Profil sayfalarındaki **host'u önceden
bilinemeyen** uzak görseller artık engel değil: önizleme görselleri
`/api/gorsel` proxy'sinden birinci taraf olarak servis ediliyor, yani
`img-src` bu iş yapıldığında `'self'` + ölçüm kaynağı kadar dar yazılabilir.
Kalan tek genişletici Fontshare (#7).

## 11. `caka_claim` çerezinde `Secure` bayrağı yok

`app/routes/onboarding.tsx` bu çerezi tarayıcıda `document.cookie` ile yazıyor;
bu yüzden `HttpOnly` olamıyor (kaçınılmaz) ama `Secure` bayrağı da
taşımıyor (kaçınılmaz değil, sadece eklenmemiş). Prod tamamen HTTPS olduğu ve
çerez yalnızca kullanıcının birazdan herkese açık olacak kullanıcı adını 15
dakika taşıdığı için bugün somut bir risk yok — bu yüzden ertelendi.
`SameSite=Lax` ve `Path=/` zaten var. Yapılacak: yazma noktasına `Secure`
eklemek (lokal `http` geliştirmede çerezin düşeceğine dikkat) ve
`packages/shared/src/cookies.ts`'teki açıklama metnini güncellemek.

## 12. `useSession` kullanılırsa `localStorage` iddiası sessizce yanlışa döner

Çözüldü ama kırılgan kaldı. `better-auth.message` string'i derlenmiş istemci
paketinde (`auth-client-*.js`) var ve istemcideki **tek** `localStorage.setItem`
çağrısı bu. Yazan yol `broadcastSessionUpdate` → `getGlobalBroadcastChannel().post()`
ve bu yalnız `createSessionRefreshManager` içinde yaşıyor. O manager'ı
`createAuthClient` kurmuyor — `useSession` kuruyor. Üründe `useSession`
çağrılmadığı için **bugün yazılmıyor**; `/cerez-politikasi` §1'in "`localStorage`
Caka'nın hiçbir yerinde kullanılmaz" cümlesi doğru.

Kırılganlık şu: biri `authClient.useSession()` kullanmaya başladığı gün yazma
başlar ve yayındaki cümle sessizce yanlışa döner. Bunu yakalayan hiçbir şey yok.

Yapılacak: derlenmiş istemci paketindeki `localStorage.setItem` / `sessionStorage.setItem`
anahtarlarını bilinen envanterle karşılaştıran bir tripwire. Envanter büyüyünce
kıran test zaten var (`cookies.test.ts`), tersi yok — kodda yeni depolama açıp
envanteri unutmak bugün sessiz geçiyor.

## 13. Ölçüm sayaçlarının budanması (R48)

`profile_view_daily` ve `link_click_daily` satırları **süresiz** duruyor.
Panel yalnız son 30 günü gösteriyor (`OLCUM_PENCERE_GUN`) ama bu bir
görüntüleme filtresi; daha eski satırlar tabloda kalıyor. Bugün ne bir cron
tetikleyicisi var ne de satırları silen bir yol: `ON DELETE cascade` şemada
tanımlı, fakat profil silme bugün elle (e-postayla) yapıldığı için pratikte
neredeyse hiç işlemiyor.

Zararı bugün sınırlı: satırlar kişiyi değil günü, ülke kodunu ve blok
kimliğini taşıyan sayaçlar — olay kaydı değil, tek bir ziyaret geri
kurulamıyor. Yine de "gösterilmeyen veri silinmiş veri değildir" ve saklama
süresi yazılmamış bir tablo KVKK m.7 / m.4-2-d karşısında savunmasız kalır.

Yapılacak: `wrangler.jsonc`'a bir cron tetikleyicisi ve pencerenin makul bir
katından (örneğin 400 gün) eski satırları silen bir `scheduled` handler.
Kararlaştırılması gereken: budama süresi (yıllık karşılaştırma isteniyorsa
pencereden uzun olmalı) ve budamadan önce aylık bir özet tutulup
tutulmayacağı. Yapıldığında `/gizlilik` §7'deki "bugün silinmiyor" maddesi
gerçek süreyle değiştirilir — **o madde bu iş bitene kadar kalmalı**, çünkü
bugünkü durumu dürüstçe anlatan tek yer orası.

## 14. Editör ile public sayfanın satır yüksekliği mobilde tutmuyor

Editör ızgarası (`app/components/editor/grid.tsx`) gridstack'e sabit
`cellHeight: 168, margin: 6` veriyor → tek satırlık blok her ekran boyutunda
156px. Public sayfa ise `app.css`'te masaüstünde `grid-auto-rows: 156px`,
`@media (max-width: 640px)` içinde **138px** kullanıyor. Yani mobilde
kullanıcının editörde gördüğü kart, yayında satır başına 18px daha kısa —
WYSIWYG değil ve bu **her blok tipini** ilgilendiriyor (metin kırpılması,
og görselinin payı, GitHub grafiğinin sığması).

GitHub kartında bu fark ayrı bir boy bandıyla kapatıldı (mobilde daha küçük
kare), ama kök neden duruyor.

Yapılacak (istenirse): ya gridstack `cellHeight`'i duyarlı yap (dar ekranda
138), ya da public `grid-auto-rows`'u 156'ya çıkar. İkincisi **yayındaki her
mobil profilin görünümünü değiştirir**, o yüzden kendi başına bir iş olarak
planlanmalı; ölçüm/regresyon yüzeyi geniş.

## 15. İkincil metin kontrastı iki temada AA eşiğinin altında

Ölçüm (2026-08-18, canlı sayfa, alfa kompozisyonu dâhil hesaplanmış WCAG
oranları). Kart içindeki ikincil metin (`--profile-muted` / `--profile-card-muted`
— link kartındaki hedef adres, sosyal karttaki handle, YouTube kartındaki
kanal adı):

| Tema | İkincil metin | Başlık |
|---|---|---|
| light | **4,19** | 18,35 |
| dark | 6,00 | 14,89 |
| lavanta | **3,98** | 17,89 |
| ufuk | 5,32 | 11,16 |
| neon | 5,87 | 15,00 |
| zumrut | 5,85 | 14,87 |

Metin 12-13px olduğu için AA eşiği **4,5**. `light` ve `lavanta` altında
kalıyor; diğer dördü geçiyor. Başlıklar her temada rahat geçiyor.

Bu **yeni widget'lara özgü değil**: token ürün genelinde kullanılıyor, kusur
widget yenilemesinden önce de vardı. Düzeltmek (`--profile-muted` opaklığını
%56'dan ~%68'e çekmek) **yayındaki her profilin görünümünü** değiştirir, o
yüzden kendi başına bir iş olarak planlanmalı — tercihen altı temanın
tamamı yeniden gözden geçirilerek.

## 16. Yüklenemeyen galeri fotoğrafı kırık ikon gösteriyor

`/i/<assetId>` bir sebeple 404 dönerse (R2 geçici hatası) galeri hücresi
tarayıcının kırık-görsel ikonunu ve `alt` metnini gösteriyor. Bento
ızgarasında bu, sayfanın en görünür kartını bozuk gösterebiliyor
(2026-08-18'de lokal test verisiyle gözlendi).

Üretimde beklenmiyor: varlıklar yalnız hesap silinirken siliniyor
(Değişmez #9) ve fotoğraf düzene ancak başarılı yüklemeden sonra ekleniyor.
Yine de ucuz bir sağlamlaştırma var: `onError` ile başarısız görseli gizleyip
mevcut `.profile-image-placeholder` desenine düşürmek.


## 17. Belge kartının kapağı PDF'in ilk sayfası değil

Belge (CV) bloğunun kapağı **tipografik bir sayfa** — kıvrık köşe, satır
izleri, "PDF" damgası. Gerçek ilk sayfanın küçük görseli bilinçli olarak
yapılmadı, çünkü Worker'da PDF raster'layacak bir motor yok:

- Depodaki tek raster katmanı `server/og-render.ts` ve o `@cf-wasm/og`,
  yani satori + resvg — **SVG** çizer, PDF ayrıştırmaz.
- PDF için PDFium/pdf.js sınıfı bir WASM motoru gerekir. Bu, `og-render`
  chunk'ı zaten ~1 MB'ken bundle'a birkaç MB daha ekler ve yükleme isteğinin
  CPU bütçesini (yükleme yolu bugün yalnız bayt kopyalıyor) rasterleştirmeye
  açar.

Yapılacaksa doğru yeri **yükleme anı**: kapak bir kez üretilip R2'ye ayrı bir
asset olarak yazılmalı (`asset` satırıyla, R16 kotasına dahil), render hiçbir
şey hesaplamamalı — YouTube küçük görselindeki desenin aynısı. Bir sonraki
adım motoru ölçmek: bundle boyutu, tipik bir CV'nin ilk sayfası için CPU
süresi, ve şifreli/bozuk PDF'te davranış.

Ara adım olarak sayfa sayısı da düşünülebilir ama **ucuz değil**: nesne
akışıyla sıkıştırılmış PDF'lerde `/Type /Page` saymak yanlış sonuç verir,
doğrusu için xref çözmek gerekir.
