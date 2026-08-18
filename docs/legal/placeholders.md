# Yayın öncesi doldurulacak alanlar

Hukuki metinlerde bilerek boş bırakılmış alanların tek listesi.

**Bu liste bir yayın kapısıdır.** `LegalPage`, bölüm bloklarında `[...]` kalıbı
gördüğünde sayfayı prod'da 404'e düşürür (`apps/web/app/components/legal-page.tsx`,
R33 / AE8). Kapıyı gevşetmek yerine alanı doldur.

Doldurduktan sonra bu dosyayı da güncelle — biten satır silinir, "yapıldı"
yazılmaz (`AGENTS.md`, durum git'ten okunur).

---

## Kalan tek alan

| Alan | Nerede | Ne yazılacak |
|---|---|---|
| `[AD SOYAD]` | `gizlilik.ts` §1 — veri sorumlusu tablosunun ilk satırı | İşletmecinin adı ve soyadı. |

**Neden bir alan adı yetmiyor.** KVKK m.10 ve Aydınlatma Tebliği m.5 veri
sorumlusunun *kimliğinin* bildirilmesini arar; Kurum'un Aydınlatma
Yükümlülüğünün Yerine Getirilmesi Rehberi (No: 60, Mart 2025) §3.1.1 bunu
gerçek kişiler için açıkça **adı ve soyadı** olarak tarif eder. "caka.app" ne
gerçek ne tüzel kişidir, dolayısıyla bu bilgiyi karşılamaz.

**Adres ve telefon gerekmiyor.** Aynı düzenlemelerdeki iletişim uzvu seçenekli
yazılmıştır ("telefon, e-posta, internet adresi veya posta adresi *gibi*"), yani
çalışan tek bir kanal yeterlidir. Çalışan tek kutu `hello@caka.app`. Ev adresi
ve telefon **yayınlanmayacak**; bu bilinçli bir karardır, eksik değildir.

**Doldurunca ne olur.** Üç belgede de başka `[...]` kalmadığı için, bu tek alan
dolduğu anda üçü birden yayına açılır (`PUBLISHED_LEGAL_DOCUMENT_IDS` kendini
günceller, kod değişmez).

### Sonraki adım, kapı değil: ürün içi başvuru formu

KVKK başvurusu için e-posta tek başına hukuken yeterli bir kanaldır. Ayrıca bir
ürün içi başvuru formu (`/kvkk-basvuru` gibi) yapmak da meşru ve faydalı bir
kanaldır, ama **bugün böyle bir route yok** ve metinlerde de vaat edilmiyor.
Yazıldığında `gizlilik.ts` §8'e eklenir.

### Ticarileşmede ne değişir

Bir tüzel kişilik (veya şahıs işletmesi) kurulduğunda:

- 6563 m.3 tanıtıcı bilgi yükümlülükleri devreye girer: unvan, MERSİS numarası,
  tebligata elverişli adres ve iletişim bilgileri sitede gösterilir.
- 5651'e bağlı Yönetmelik m.5 *tanıtıcı bilgi* ödevi "ticari veya ekonomik
  amaçlı" yer sağlayıcılar için doğar; bugün ücretsiz olduğu için doğmuyor
  (`kullanim-kosullari.ts` §9 bunu böyle yazıyor).
- `gizlilik.ts` §7'deki "VUK/TTK devreye girmiyor" cümlesi yanlışlanır.
- `kullanim-kosullari.ts` §11'deki TBK m.114/1 ücretsizlik kaldıracı kaybolur.

---

## Doldurulmuş alanların gerekçe kaydı

Aşağıdakiler eskiden birer kapıydı; artık metne yazıldılar. Kayıt burada duruyor
ki sonradan gelen biri "basitleştirmek" isterken hükmü tersine çevirmesin.

### `[AKTARIM MEKANİZMASI]` → dürüst ifşa (gizlilik.ts §6)

Mekanizma **yok** ve metin bunu böyle söylüyor. Kapatılamamasının sebebi:

- Yeterlilik kararı yayımlanmış ülke yok.
- Kurul'un standart sözleşmesi **iki tarafın da Türkçe metni imzalamasını**
  ister. Cloudflare DPA v6.4 (yürürlük 03.04.2026) belgesinde Türkiye, Türkçe
  metin veya KVKK'ya tek bir atıf yok; sunulanlar AB SCC, UK/İsviçre ekleri,
  Data Privacy Framework ve Global CBPR ile sınırlı. Karşı taraf imzalamıyor.
- Taahhütname Kurul iznine bağlı; BCR bir şirketler topluluğu ister.
- **Açık rıza da çare değil.** m.9/6'daki istisnaların tamamı *arızi* aktarımlar
  içindir ve Yurt Dışına Aktarım Yönetmeliği m.16/1 arıziliği tanımlar:
  "Düzenli olmayan, tek veya birkaç sefer gerçekleşen, süreklilik arz etmeyen ve
  olağan faaliyet akışı içinde bulunmayan aktarımlar arızi niteliktedir."
  Barındırma bunun tam tersi. Bir onay kutusu boşluğu kapatmaz, gizler.
- De minimis muafiyet yok.

Google ile giriş, kurumsal bir DPA altında değil tüketici Hizmet Şartları
altında çalışır → Google muhtemelen ayrı bir veri sorumlusu. **Apple'ın hukuki
konumu doğrulanamadı**; metin bu yüzden Apple hakkında bir şey iddia etmiyor.

### `[SAKLAMA SÜRELERİ]` → gerçek tablo (gizlilik.ts §7)

Yük taşıyan rakam **3 ay**. Silme Yönetmeliği m.5/1 yazılı saklama ve imha
politikası ödevini VERBİS kaydına bağlar; Caka VERBİS'ten muaf (Kurul 2025/1572)
→ politika ödevi doğmuyor. Ama bu bir gevşeme değil: politika yazanların altı
aylık periyodik imha döngüsü yerine, yazmayanlar için **m.11/3** yükümlülüğün
doğduğu tarihten itibaren **üç ay** içinde silmeyi emreder — daha sıkı.
Ayrıca m.12/1(a): talep **30 gün** içinde sonuçlandırılır. m.7/3: silme
işleminin kaydı **3 yıl** saklanır.

### `[SORUMLULUK SINIRI]` → sınır değil kapsam (kullanim-kosullari.ts §11)

**Yazılmayanlar — yazılırsa geçersizdir:**

- Parasal tavan ("azami sorumluluğumuz X TL") ve "dolaylı zararlardan sorumlu
  değiliz" → Haksız Şartlar Yönetmeliği EK-1 (1)(a) sorumluluğu kaldıran *veya
  **sınırlayan*** şartları haksız sayar; maddi zararı da kapsar.
- Tüketicinin hukuki yollarını kaldıran/ölçüsüzce kısıtlayan şartlar → EK-1 (1)(b).
- Kasıt/ağır ihmal için sorumsuzluk → TBK m.115/1, kesin hükümsüz.
- Yönetmelik m.5/4: EK listesi **sınırlayıcı değil, örnek niteliğinde**.
  Listeden kaçınmak tek başına güvenlik değildir — bu yüzden hüküm sınırlamaya
  değil kapsama dayandırıldı.

**Yazılanlar — dayanakları:**

- Hizmetin kapsamı ve neyin taahhüt edilmediği (kesintisizlik, dış siteler).
- **TBK m.114/1 son cümle** — "İş özellikle borçlu için bir yarar sağlamıyorsa,
  sorumluluk daha hafif olarak değerlendirilir." Ücretsizlik kanunun kendi
  ölçüsüdür; en güçlü kaldıraç budur ve ücretli plan gelince kaybolur.
- **TBK m.116/2** — yardımcı kişinin fiilinden sorumluluk önceden kaldırılabilir.
  Elde bulunan tek sağlam kanuni istisna budur.
- Kullanıcının yükümlülükleri, üçüncü kişi ve mücbir sebep.
- Açık istisnalar: kasıt/ağır ihmal, ölüm ve bedensel zarar, tüketici
  mevzuatının emredici hükümleri.
- 6502 m.5/2 (haksız şart düşer, sözleşme yaşar) ve m.5/3 (standart şart
  müzakere edilmemiş sayılır, ispat yükü düzenleyendedir) metne yazıldı.

### `[UYGULANACAK HUKUK VE YETKİLİ MAHKEME]` → Türk hukuku, mahkeme seçilmedi (§14)

**Hiçbir zaman "İstanbul mahkemeleri yetkilidir" yazma.** HMK m.17 yetki
sözleşmesini yalnız tacirler/kamu tüzel kişileri arasında kabul eder; EK-1 (1)(n)
aynı kaydı ikinci kez sakatlar. Yaptırım da somut: Yönetmelik m.8 → Bakanlık
30 günlük kaldırma emri; uyulmazsa 6502 m.77 → sözleşme başına idari para cezası.

Metne yazılanlar: Türk hukuku; 6502 m.73/1 görev kesin; **m.68/1** sınırın
altında THH başvurusu zorunlu, üstünde THH'ye başvurulamaz; **m.73/A**
arabuluculuk dava şartı (THH kapsamı hariç); **m.73/5** tüketici kendi yerleşim
yerinde **de** dava açabilir (ek seçenek, münhasır değil).

> ⚠️ **Bayatlama riski.** THH parasal sınırı (2026: **186.000 TL**, RG
> 23.12.2025/33116, yürürlük 01.01.2026) her aralık Ticaret Bakanlığı tebliğiyle
> yeniden belirlenir. Metin rakamı **açıkça 2026'ya bağlayarak** ve yıllık
> güncellendiğini söyleyerek yazıyor. Her ocak ayında bu satırı kontrol et;
> yıl etiketini asla düşürme.
>
> 7392 m.13 il/ilçe iki kademeli ayrımı kaldırdı — sınır **tek bir rakamdır**.

### 5651 yer sağlayıcılık (kullanim-kosullari.ts §9, yeni)

- m.2/1-(m): işletmeci **yer sağlayıcıdır**; ölçek veya ticarilik eşiği yok.
  Kendi sayfaları bakımından aynı anda içerik sağlayıcı.
- **m.5/1: izleme yükümlülüğü yok.** Metin bunu söylüyor.
- **5651 m.9 tümüyle iptal edildi** (AYM 11/10/2023, E.2020/76 K.2023/172, RG
  10.01.2024/32425, yürürlük 10.10.2024). **"24 saat" kuralı artık yok.**
  Yerine geçen bir süre de yok → özel bildirimler için **hiçbir yanıt süresi
  taahhüt edilmeyecek**; sadece *"gecikmeksizin"*. Bir süre yazmak, olmayan bir
  yükümlülüğü ihlal edilebilir bir borca çevirir.
- Bağlayan süre: **m.8/5 ve m.8/A/1** — hâkim, savcı veya **Siber Güvenlik
  Başkanlığı** kararına *"derhâl ve en geç dört saat içinde"* uyulur.
  (7590 sayılı Kanun, RG 24/7/2026, "Kurum/BTK" ifadelerini Başkanlık ile
  değiştirdi. BTK yer sağlayıcı listelerini yayımlamayı sürdürüyor, ama emri
  veren merci artık Başkanlıktır.)
- **Trafik kaydı paragrafı yazılmadı.** m.5/3'teki saklama ödevi gerçek, ama
  bugün böyle bir loglama yok ve kurulup kurulmayacağına karar verilmedi.
  Tutmadığımız kaydı anlatmak, bu metinlerin önlemek için yazıldığı hatanın ta
  kendisi olurdu. Karar işletmecide.
- İhbar adresi `hello@caka.app`. **`ihbar@` diye bir kutu yok** — uydurma.

---

## Çözülmemiş tartışma: 6502 bugün uygulanır mı?

**Metin "uygulanır" varsayımıyla yazıldı.** Karakterizasyon tartışmalıdır;
kimse "zaten tüketici hukuku uygulanmıyor" diyerek §11 ve §14'ü
sadeleştirmesin.

- **Uygulanır diyen okuma:** m.3/1-(ı) "sağlayıcı" tanımı *"ticari veya mesleki
  **amaçlarla**"* der ve gerçek kişileri açıkça kapsar, sicil kaydı aramaz;
  m.3/1-(d) "Hizmet" *"bir ücret veya **menfaat** karşılığında"* der ve
  *menfaat* geniştir. Sıfır fiyat argümanı zayıftır.
- **Uygulanmaz diyen okuma:** bugün ne ticari amaç ne ücret/menfaat var; ama bu
  bir kalkan değil, bir sayaçtır — ücretli plan geldiği gün iki kapı da kapanır.
- **Neden yine de yazıldı:** 6502 m.5/2 haksız şartı sözleşmeden ayırır
  ("haksız şartlar kesin olarak hükümsüzdür. Sözleşmenin haksız şartlar
  dışındaki hükümleri geçerliliğini korur."). Yani düşen bir hükmün maliyeti
  yok; susmanın maliyeti ise hukuken talep edilebilecek bir korumadan
  vazgeçmektir. Yazmak daha iyi karardır.

---

## Doldurduktan sonra

1. `gizlilik.ts` §1'deki `[AD SOYAD]` yerine gerçek ad soyadı yaz.
2. `pnpm typecheck` ve `pnpm test` çalıştır.
3. Lokalde (`pnpm dev`) üç sayfayı aç: dev uyarı kutusu kaybolmuş olmalı.
4. `docs/legal/` altındaki tedarikçi kaydını ve veri haritasını da güncelle.
5. Belge sürümlerini (`packages/shared/src/legal.ts`, `LEGAL_DOCUMENTS`)
   yayın tarihine göre artır.
