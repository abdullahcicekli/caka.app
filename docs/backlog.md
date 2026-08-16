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

## 2. Ayarlar sayfası + og:image şablon seçimi (Faz 2)

`profile.ogTemplate` kolonu ve `ogTemplateSchema` (p1–p6) hazır, 6 şablon
üretiliyor; ama seçim arayüzü yok — şu an herkes varsayılan `p1` (Portre)
alıyor.

Yapılacak: `/ayarlar` route'u (`ayarlar` ve `settings` zaten
`RESERVED_USERNAMES`'te) + paneldeki "Ayarlar — Yakında" maddesini gerçek
linke çevir + 6 şablonu küçük önizlemeyle seçtir. Önizleme için gerçek
`/og/u/...` URL'i kullanılabilir.

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
