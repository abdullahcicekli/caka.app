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
