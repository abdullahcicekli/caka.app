# Bilinen uyum açıkları

Hukuki metinlerde **doldurulmayı bekleyen boş alan kalmadı** — üç belge de
yayınlanabilir durumda. Bu dosya artık bir yapılacaklar listesi değil, bilinçli
olarak kabul edilmiş eksiklerin kaydı: her biri metinde açıkça yazılı, hiçbiri
gizlenmiş değil.

Bir madde kapandığında buradan **silinir** (`AGENTS.md`: durum git'ten okunur).

---

## 1. Veri sorumlusunun kimliği — m.10 tam karşılanmıyor

**Durum:** kabul edildi, metinde açıkça yazılı (`gizlilik.ts` §1).

KVKK m.10 ve Aydınlatma Tebliği m.5 veri sorumlusunun **kimliğini** ister.
Kurum'un Aydınlatma Rehberi (No: 60, Mart 2025) §3.1.1 bunu gerçek kişiler için
**ad ve soyad** olarak tarif ediyor. Yayınlanan metin yalnızca `caka.app`
diyor, çünkü işletmeci adını yayınlamamayı tercih etti.

İletişim tarafında eksik **yok**: aynı düzenlemeler iletişim bilgisini
*"telefon, e-posta, internet adresi **veya** posta adresi gibi"* diye seçenekli
sayıyor, yani `hello@caka.app` tek başına yeterli. Adres ve telefon
yayınlamamak hukuken sorun değil — eksik olan yalnızca ad soyad.

**Bilinen emsal yok.** Bu kusur için verilmiş bir Kurul kararı bulunamadı
(2019/206, 2022/1358 ve 2023/1041 başka defektlerden). Teorik yaptırım
m.18/1-(a). Risk gerçek ama ölçülemiyor.

**Ne zaman kapanmalı:** ürün ticarileştiğinde zaten mecburi hâle geliyor —
e-ticaret mevzuatı tacir olmayanlar için *merkez adresini* de ana sayfada
istiyor. Ayrıca BTK yer sağlayıcı sicili herkese açık aranabilir olduğundan,
bildirim yapıldığı anda ad zaten kamuya çıkıyor; o noktadan sonra metinde
gizli tutmanın koruma değeri kalmıyor.

## 2. Yurt dışına aktarım — m.9 güvencesi yok

**Durum:** kabul edildi, metinde gerekçesiyle yazılı (`gizlilik.ts` §6).

Uygulama, veritabanı, dosya deposu ve loglar Cloudflare'de olduğu için her
istekte yurt dışına aktarım oluyor ve bu aktarım m.9'un aradığı güvencelerden
birine bağlanamıyor:

- **Yeterlilik kararı:** Kurul bugüne kadar hiçbir ülke için yayımlamadı.
- **Standart sözleşme:** Türkçe metnin iki tarafça imzalanması gerekiyor.
  Cloudflare'in DPA'sı (v6.4, 3 Nisan 2026) Türkiye'ye, Türkçe bir metne veya
  KVKK'ya tek atıf içermiyor — sunulanlar AB SCC, BK/İsviçre ekleri, Data
  Privacy Framework ve Global CBPR ile sınırlı. Karşı taraf imzalamıyor.
- **Taahhütname:** Kurul iznine bağlı, tek taraflı tamamlanamıyor.
- **BCR:** şirketler topluluğu gerektiriyor; topluluk yok.
- **Açık rıza da çözmüyor:** m.9/6 istisnaları yalnızca *arızi* aktarımlar
  için. Yönetmelik m.16/1 arızîliği *"düzenli olmayan, süreklilik arz etmeyen
  ve olağan faaliyet akışı içinde bulunmayan"* diye tanımlıyor; barındırma
  bunun tam tersi. Onay kutusu boşluğu kapatmaz, kapatılmış gibi gösterir.

Küçük ölçekten doğan muafiyet de yok.

**Kapatan tek gerçek hamle** barındırmayı Türkiye'de yerleşik altyapıya
taşımak. Ara adım: standart sözleşmeyi Cloudflare'den yazılı olarak talep edip
reddi/sessizliği iyi niyet kanıtı olarak saklamak, ve yurt dışına çıkan veriyi
asgaride tutmak.

## 3. 5651 — yer sağlayıcı yükümlülükleri

**Durum:** metinde anlatıldı (`kullanim-kosullari.ts`), ama iki eylem açık.

Kullanıcı sayfaları barındırıldığı için 5651 m.2/1-(m) kapsamında yer
sağlayıcıyız; ölçek veya ticarilik eşiği yok.

- **BTK bildirimi yapılmadı.** Zorunlu, ücretsiz, gerçek kişi olarak
  yapılabiliyor (imzalı dilekçe + adli sicil belgesi). Bildirmemenin cezası
  100.000–1.000.000 TL. Sicil herkese açık aranabilir.
- **Trafik bilgisi saklanmıyor.** m.5/3 saklama istiyor; yönetmelik altı ay
  diyor ama kanunun tabanı bir yıl, o yüzden bir yıl doğrusu. Alanlar belli
  (kaynak/hedef IP, tarih-saat, URL, sonuç) ve hash + nitelikli zaman damgası
  gerekiyor — sonuncusu ücretli bir TSP hesabı demek. Bu, ürünün mevcut "ham
  IP saklamıyoruz" duruşuyla çelişiyor; KVKK tarafında sorun yok, m.5/2-(a)
  kanunda öngörülen saklamayı hukuka uygun kılıyor.

Metne bilerek trafik logu paragrafı yazılmadı: tutulmayan bir logu beyan etmek
bu belgelerin var olma sebebine aykırı olurdu. Log tutulmaya başlandığında
`gizlilik.ts` §3 ve §7 birlikte güncellenmeli.

## 4. 6502'nin bugün uygulanıp uygulanmadığı tartışmalı

**Durum:** metin muhafazakâr okumaya göre yazıldı.

İki bağımsız araştırma aynı maddeleri okuyup zıt sonuca vardı. Biri m.3/1-(ı)
*"ticari veya mesleki **amaçlarla**"* ve m.3/1-(d) *"ücret **veya menfaat**"*
ifadelerinden 6502'nin uygulandığını çıkardı; diğeri ücret ve ticari amaç
olmadığı için uygulanmadığını. İkisi de ücretli plana geçildiği gün kapının
kapandığında hemfikir.

Maddeler 6502 uygulanıyormuş gibi yazıldı — daha muhafazakâr olan bu.
**Bu yüzden §11 ve §14'ü "nasılsa tüketici hukuku geçerli değil" diyerek
sadeleştirme.** Parasal tavan yok (EK-1(1)(a) maddi zararı da kapsayacak
şekilde sınırlamayı geçersiz kılıyor) ve yetkili mahkeme seçilmiyor
(HMK m.17 + EK-1(1)(n)).

---

## 5. Ayet bloğunun meali — sadeleştirmenin telif durumu belirsiz

**Durum:** kabul edildi, kaynak ve gerekçe `vendor-register.md` §F'de yazılı.

Ayet bloğu Türkçe meali `tur-elmalilihamdiya` edisyonundan alıyor. **Elmalılı
Hamdi Yazır 27 Mayıs 1942'de öldü**, yani özgün meal FSEK m.27'ye göre
31.12.2012'den beri kamu malı — bu taraf kesin.

Belirsiz olan: elimizdeki edisyonun dili özgün 1935-1939 metninin değil, bir
**sadeleştirmenin** dili gibi okunuyor. Sadeleştirme FSEK m.6 anlamında işleme
eser sayılırsa sadeleştirenin kendi telifi sürüyor olabilir; ancak edisyonu
dağıtan hiçbir kaynak sadeleştireni adlandırmıyor, dolayısıyla hak sahibi de
tespit edilemiyor.

**Neden yine de yayınlandı:** özgün eser kamu malı, çevirmen adı her kartta
atıf olarak basılıyor, metin değiştirilmeden aktarılıyor ve bir hak sahibi
ortaya çıkarsa değişiklik tek bir sabitte (`MEAL_EDITION`, `server/quran.ts`).
Şema da ikinci bir meali taşıyacak biçimde kuruldu: her blok hangi mealle
yazıldığını kendi verisinde saklıyor (`mealEdition`, `mealTranslator`), yani
kaynak değişse bile eski bloklar yanlış çevirmene atfedilmez.

**Nasıl kapanır:** doğrudan Elmalılı'nın özgün metnine dayanan, sadeleştirme
içermeyen bir edisyona geçmek; ya da bugünkü edisyonun sadeleştireninden izin
almak.

**Kapsam dışı:** Diyanet İşleri meali. Güncel eser, telifi Diyanet'te ve
Tanzil kopyası "yalnız ticari olmayan kullanım" kaydıyla dağıtılıyor — bilerek
alınmadı.

---

## Doğrulanamayanlar — rakamla yayınlanmamalı

- 2026 tüketici hakem heyeti parasal sınırı: bir kaynak 186.000 TL ve RG
  23.12.2025/33116 verdi, diğeri doğrulayamadı. Metinde yıl belirtilerek ve
  her aralık güncellendiği notuyla yazıldı.
- 6502 m.68 ve m.73'ün birebir metni.
- 5651 m.5/6 cezasının 2026 güncel tutarı (kanuni taban yazıldı).
- 509 Sıra No.lu VUK Genel Tebliği'nin lansmanda e-Arşiv zorunluluğu getirip
  getirmediği — SMMM'ye sorulmalı.

## Takvim

**7578 sayılı Kanun, 5651 Ek m.4'ü değiştiriyor ve Ek m.5 ekliyor; yürürlük
1 Kasım 2026.** Kasımdan önce yeniden okunmalı.

Ücretli plana geçiş üç şeyi aynı anda tetikliyor: 6502 tartışmasız uygulanır,
e-ticaret mevzuatı merkez adresini ana sayfada ister (tacir değilse **yerleşim
yeri**), 5651'in "ticari amaçlı" kapısı açılır ve vergi mükellefiyeti başlar.
Ev adresi yayınlamak istemiyorsan sanal ofis veya şahıs işletmesi adresini
**lansmandan önce** ayarla.
