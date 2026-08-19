# Güven ifadeleri ve dayanakları

Footer'daki her güven ifadesinin dayanağı, dayanağın nasıl doğrulandığı ve
**ifadeyi neyin geçersiz kılacağı**. Bu dosyanın asıl işi son maddedir: bir
iddia genellikle yanlış yazıldığı için değil, **doğru yazılıp sonra sessizce
bayatladığı için** güvenilmez hâle gelir.

**İfadelerin tanımlandığı yer:** `apps/web/app/content/landing.ts` → `trust`
(Değişmez #5: metin bileşene gömülmez). **Tarih:** 2026-08-19.

> **2026-08-19 kontrolü — footer'da "sıfır üçüncü taraf isteği" vaadi YOK.**
> Konum kartı Mapbox'a doğrudan bağlanmaya başlayınca footer metni yeniden
> okundu (`content/landing/tr.ts` → `trust`): yalnız iki ifade var — "Reklam ve
> analitik çerezi kullanmıyoruz" ve "Kaynak kodu açık". İkisi de üçüncü taraf
> **isteği** hakkında bir söz vermiyor, dolayısıyla değişiklik footer'ı
> yanlışa düşürmedi. Bu dosyanın kendisi ise "hiç istek atmıyor" cümlesini
> taşıyordu ve **düzeltildi** (İfade 1 → sınırlar).

---

## İlke: KD3 — kanıtlanamayan rozet kullanılmaz

Tedarikçinin sertifikası şirketin sertifikası değildir. Footer'da yalnızca
**doğrulanabilir ve ayırt edici** ifade bulunur.

**Bilerek kullanılmayanlar:** ISO 27001, GDPR Compliant, KVKK uyumlu,
"%100 Türkiye'de barındırılıyor", "cookie-free analytics" rozeti,
"Güvenli bağlantı". Sonuncusu doğrudur ama her sitede vardır: ayırt edici
olmayan bir olguyu güven sinyali diye sunmak, KD3'ün reddettiği içi boş rozet
mantığının "doğrulanabilir" kılığına girmiş hâlidir.

---

## İfade 1 — "Reklam ve analitik çerezi kullanmıyoruz"

**Bağlantı:** `/cerez-politikasi`

### Dayanak

1. **Envanter.** `packages/shared/src/cookies.ts`'te tanımlı tek kategori
   `zorunlu`. Dört girdinin dördü de birinci taraf ve işlevsel: iki Better Auth
   çerezi, `caka_claim`, bir `sessionStorage` kaydırma girdisi. Reklam veya
   analitik amaçlı tek bir girdi yok. Ayrıntı: `cookie-inventory.md`.
2. **Ölçüm aracı cihaza dokunmuyor.** Ziyaret ölçümü Cloudflare Web Analytics
   ile yapılıyor; yapı gereği çerezsiz.
3. **Reklam/analitik tedarikçisi yok.** GA4 alınmadı (KD4); reklam ağı,
   remarketing pikseli veya üçüncü taraf ölçüm SaaS'ı yok
   (`vendor-register.md` §D).

### Nasıl doğrulandı

**İddia edilmedi, tarayıcıda görüldü (KTD31).** Cloudflare Web Analytics
`caka.app` zone'unda Automatic setup ile açıldı (~2026-08-15) ve beacon
`static.cloudflareinsights.com`'dan servis ediliyor — `root.tsx`'e elle bir
script eklenmedi. Kurulum **zone geneli** çalışır, yani herkese açık profil
sayfalarında da aktiftir.

Prod'da gerçek bir tarayıcıda, hem `/` hem de bir profil sayfası için DevTools
ile kontrol edildi:

| Kontrol | Sonuç |
|---|---|
| Ölçüm aracına ait çerez | **0** |
| `localStorage` girdisi | **0** |
| Cihaz tanıtıcısı (herhangi bir kalıcı kimlik) | **0** |
| Rıza banner'ı | Gösterilmiyor (gerekmiyor) |

Bu sonuç KD1'in üç koşulunu karşılar (çapraz site takibi yok, veri üçüncü
tarafın kendi amaçları için kullanılmıyor, çıktı toplu istatistik), dolayısıyla
rıza yükümlülüğü doğmaz. **Rıza gerekmemesi aydınlatma yükümlülüğünü
kaldırmaz** (KD2): işleme m.5/2-f meşru menfaate dayanır ve `/gizlilik` §4'te
bu sebeple yazılıdır.

### İfadenin sınırları — bilerek dar yazıldı

İfade "çerez kullanmıyoruz" demiyor; **"reklam ve analitik çerezi"** diyor.
Fark önemli, çünkü:

- Zorunlu çerezler **var** (oturum, CSRF, adres taşıma). Tablo bunları
  listeliyor.
- Profil sayfalarındaki uzak önizleme görselleri **artık üçüncü taraf çerezi
  yazamaz**: görseller birinci taraf proxy'sinden servis ediliyor ve yanıt
  bizde sıfırdan kuruluyor, uzak sitenin `Set-Cookie`'si ziyaretçiye hiç
  geçmiyor (`vendor-register.md` §B). Bu, ifadenin genişletilebileceği
  anlamına **gelmez**: ölçüm beacon'ı hâlâ cihaza yazmıyor ama Fontshare
  yazı tipleri her sayfa yüklemesinde uzak host'tan çekiliyor. "Hiçbir
  üçüncü taraf isteği yok" demek bu yüzden hâlâ yanlış olurdu.
- **Gömülü oynatıcılar ifadeyi bozmuyor ama sınırını keskinleştiriyor.**
  Ziyaretçi bir YouTube/Spotify kartında oynata basarsa o siteler çerez
  yazabilir. İfade "*biz* reklam ve analitik çerezi kullanmıyoruz" demeye
  devam ediyor ve bu doğru: o çerezleri biz yazmıyoruz, okuyamıyoruz,
  silemiyoruz. İfadeyi "bu sitede reklam çerezi yoktur" gibi bir biçime
  **çevirmek yanlış olur** — oynatıcı yüklendikten sonra sayfada üçüncü
  taraf çerezi bulunabilir. Kapıyı ayakta tutan şey, bunun ancak
  ziyaretçinin bilinçli tıklamasıyla ve önceden söylenerek olması.
- **Konum kartı ifadeyi bozmuyor ama eski gerekçesi ÇÜRÜDÜ** (yazılış
  2026-08-19, aynı gün düzeltildi). Bu madde önce şunu diyordu: *"Harita
  görüntüsü birinci taraf `/api/harita` yolundan geliyor; ziyaretçinin
  tarayıcısı harita sağlayıcısına hiç istek atmıyor."* **Bu cümle artık
  yanlıştır.** Mapbox Product Terms §2.8.1 ve §1.9 kareyi sunucuda önbelleğe
  alıp proxy'lemeyi yasakladığı için o uç kaldırıldı; kart bugün iki `<img>`
  ile doğrudan `api.mapbox.com`'dan yükleniyor ve konum kartı taşıyan bir
  profil açıldığında ziyaretçinin **IP'si ve User Agent'ı Mapbox'a ulaşıyor**.
  İfade yine de ayakta, çünkü ifade **çerez** hakkındadır ve harita çerez
  yazmıyor: `api.mapbox.com` statik görsel yanıtında `Set-Cookie`
  **gözlenmedi** (curl ile başlık kontrolü) ve bir `<img>` isteği zaten kimlik
  bilgisi taşımadığı için bizim taşıyabileceğimiz bir çerez de doğmaz.
  `cookies.ts` envanterine yeni girdi eklenmedi. **Ama bu, "hiçbir üçüncü
  taraf isteği yok" demeyi bir kat daha yanlış kılar** — Fontshare'e artık
  Mapbox da eklendi. Yer arama hâlâ yalnız editörde, oturumlu kullanıcı için
  çalışıyor. Ayrıntı ve gerekçe: `vendor-register.md` §A'daki konum notu.
- Ölçüm beacon'ı cihaza yazmasa da isteğin kendisinde IP ve User Agent
  Cloudflare'e ulaşır. "Hiçbir veri toplamıyoruz" demek de bu yüzden yanlış
  olurdu ve denmedi.

### Ölçüm aracının kabul edilmiş sınırları

KD4'ün bedelinin parçası; ürün içinde "tam ölçüm" iddiasına dönüşmemeli:

- Reklam engelleyiciler beacon'ı engeller — sayımlar eksik olur.
- Query string tutulmadığı için **UTM kampanya atıfı yok**.
- **Google Ads bağlantısı kurulamaz.**

### Bu ifadeyi ne geçersiz kılar

Aşağıdakilerden **biri** olursa footer ifadesi ve `/cerez-politikasi`
güncellenene kadar yanlıştır:

1. `cookies.ts`'e `zorunlu` dışında bir kategoride girdi eklenmesi.
2. GA4, Plausible, Matomo, Hotjar veya benzeri bir aracın eklenmesi — cihaza
   yazıp yazmadığına bakılmaksızın önce doğrulanır.
3. Cloudflare'in Web Analytics davranışını değiştirip cihaza yazmaya başlaması.
   **Tetikleyici:** yükseltme veya "Manual setup"a geçiş sonrası aynı DevTools
   kontrolü tekrarlanır.
4. Reklam veya remarketing pikseli eklenmesi.
5. Ertelenmiş panel analitiği hattının (R48) cihaza yazacak biçimde kurulması —
   tasarım gereği yazmayacak, ama kurulduğunda bu dosya yeniden doğrulanır.
6. ~~Konum kartının **etkileşimli haritaya** çevrilmesi (MapLibre + kutucuk
   sunucusu). O gün ziyaretçi doğrudan bir harita sunucusuna bağlanır~~ —
   **kısmen gerçekleşti (2026-08-19).** Kart etkileşimli olmadı (hâlâ JS yok,
   kutucuk sunucusu yok, iki statik `<img>`), ama riskin asıl kısmı —
   **ziyaretçinin doğrudan bir harita sunucusuna bağlanması** — gerçekleşti:
   Mapbox proxy'lemeyi ve sunucu önbelleğini sözleşmeyle yasakladığı için
   kareler `api.mapbox.com`'dan doğrudan yükleniyor. `vendor-register.md` §A'ya
   satır girdi ve bu dosya yeniden doğrulandı: çerez yazılmıyor, ifade ayakta.
   **Kalan tetikleyici:** kartın gerçekten etkileşimli haritaya çevrilmesi
   (JS + kutucuk akışı), ya da Mapbox'ın statik görsel yanıtına `Set-Cookie`
   eklemesi — ikincisi için kontrol yeniden yapılır.

---

## İfade 2 — "Kaynak kodu açık"

**Bağlantı:** `https://github.com/abdullahcicekli/caka.app`

### Dayanak

Depo **public** ve **MIT** lisanslı. İfadenin ayırt ediciliği, birinci iddiayı
denetlenebilir kılmasından gelir: "reklam ve analitik çerezi kullanmıyoruz"
sözüne inanmak zorunda değilsin — `packages/shared/src/cookies.ts`'i,
`app/root.tsx`'i ve `wrangler.jsonc`'yi açıp kendin okuyabilirsin. İkinci ifade
birincinin kanıt yoludur; bu yüzden ikisi yan yana duruyor.

### Nasıl doğrulandı

Depo adresi footer'da tıklanabilir ve public erişime açık; lisans dosyası
depoda MIT. İfade bir sertifika veya denetim iddiası değil, doğrulanabilir bir
olgu bildirimi.

### İfadenin sınırları

- "Açık kaynak" **"her şey depoda"** demek değildir: sırlar `.dev.vars` ve
  `wrangler secret`'ta durur (Değişmez #6), prod verisi ve Cloudflare
  yapılandırması depoda yoktur.
- "Açık kaynak" bir güvenlik veya uyum iddiası da değildir. Böyle sunulmuyor.

### Bu ifadeyi ne geçersiz kılar

1. Deponun private'a alınması veya arşivlenmesi.
2. Lisansın MIT dışına çıkması (özellikle kaynak-görünür ama açık olmayan bir
   lisansa geçiş).
3. Deponun taşınması veya yeniden adlandırılması — footer'daki adres ölü linke
   döner (R23).
4. Yayındaki davranışı belirleyen kodun bir kısmının depo dışına çıkarılması —
   o noktada ifade teknik olarak doğru kalır ama denetlenebilirlik iddiası
   içi boşalır ve yeniden yazılması gerekir.

---

## Footer'da bulunmayan ama tartışılmış ifade

**"Türkiye'de geliştirildi"** — plan bunu koşullu olarak öneriyordu
(*teyit edilirse*). Bugün footer'da **yok**. Eklenecekse önce burada bir
dayanak satırı açılmalı; ayrıca barındırmanın Türkiye'de olduğu gibi bir
çağrışım yaratmamalı — barındırma Cloudflare'de ve yurt dışına aktarım var
(`vendor-register.md`).

---

## Bakım kuralı

Bu dosya, footer metni değiştiğinde **aynı commit'te** güncellenir. Dayanağı
burada yazılı olmayan bir ifade footer'a girmez; tersi de geçerlidir —
footer'dan kalkan bir ifadenin bölümü buradan silinir (durum git'ten okunur).
