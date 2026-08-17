# Yayın öncesi doldurulacak alanlar

Hukuki metinlerde bilerek boş bırakılmış alanların tek listesi. Hiçbiri
uydurulmadı; doğrulanmamış şirket bilgisi, tedarikçi mekanizması veya saklama
süresi yazmak, metni ilk okunduğunda yanlışa düşürür.

**Bu liste bir yayın kapısıdır.** `LegalPage`, bölüm bloklarında `[...]` kalıbı
gördüğünde sayfayı prod'da 404'e düşürür (`apps/web/app/components/legal-page.tsx`,
R33 / AE8). Yani aşağıdaki alanlar dolmadan üç hukuki sayfa canlıda açılmaz.
Kapıyı gevşetmek yerine alanları doldur: kapının bütün amacı yarım metnin
ziyaretçiye görünmesini engellemek.

Doldurduktan sonra bu dosyayı da güncelle — biten satır silinir, "yapıldı"
yazılmaz (`AGENTS.md`, durum git'ten okunur).

---

## 1. Hukuki inceleme gerektirenler — avukat (OQ3)

Bunları kendimiz yazmadık. Sorumluluk sınırı ve yetki kaydı kullanıcıyı
doğrudan bağlayan maddeler; taslak üretip "avukat sonra bakar" demek, yanlış
maddenin yayına çıkma riskini taşır.

| Alan | Nerede | Not |
|---|---|---|
| `[SORUMLULUK SINIRI — AVUKAT İNCELEMESİ]` | `kullanim-kosullari.ts` §10 | Tüketici mevzuatının emredici hükümleri saklı; metin bunu zaten söylüyor. |
| `[UYGULANACAK HUKUK VE YETKİLİ MAHKEME — AVUKAT İNCELEMESİ]` | `kullanim-kosullari.ts` §13 | Tüketici hakem heyeti ve tüketici mahkemesi yolları saklı tutuldu. |
| `[SAKLAMA SÜRELERİ]` | `gizlilik.ts` §7 | Repodan bilinen teknik süreler (30 günlük adres yönlendirmesi, 7 günlük oturum, 6/24 saatlik GitHub önbelleği) zaten yazılı. Eksik olan: hesap kapandıktan sonra veri ve yedeklerin ne kadar tutulacağı, fatura/kayıt yükümlülükleri. |

### Açık uyum boşluğu: veri sorumlusunun kimliği

Bu bir köşeli parantez alanı değil — yayın kapısını tetiklemez — ama avukatın
bilmesi gereken bilinçli bir eksiktir.

KVKK m.10 ve Aydınlatma Tebliği m.5, veri sorumlusunun **kimliğinin**
bildirilmesini arar. Yayındaki metin veri sorumlusu olarak yalnızca
**caka.app**'i gösteriyor; oysa bir alan adı ne gerçek ne tüzel kişidir.
Sebebi şu: Caka'nın arkasında bugün kurulmuş bir tüzel kişilik, ticari faaliyet
veya sicil kaydı yok, sahibi de kişisel adını ve ev adresini yayınlamamayı
tercih etti. Uydurma bir unvan yazmak yerine `gizlilik.ts` §1 bu eksiği açıkça
kabul ediyor ve iletişimi tek çalışan kutuya (`hello@caka.app`) bağlıyor.

**Ne zaman çözülmeli:** ticarileşmeden önce ya da en geç onunla birlikte. O
noktada bir tüzel kişilik (veya şahıs işletmesi) kurulacak ve 6563 sayılı
Kanun'un m.3 tanıtıcı bilgi yükümlülükleri de devreye girecek: unvan, MERSİS
numarası, tebligata elverişli adres ve iletişim bilgilerinin sitede
gösterilmesi. Aynı bilgiler `gizlilik.ts` §1 tablosuna ve
`kullanim-kosullari.ts` §1'e girer.

## 2. Yurt dışına aktarım — sözleşme süreci (OQ2a)

| Alan | Nerede | Not |
|---|---|---|
| `[AKTARIM MEKANİZMASI]` | `gizlilik.ts` §6 — tedarikçi tablosunda 5 satır + gövde paragrafı | **Tek başına bir yayın kapısı.** |

Bu, diğerlerinden farklı ve en uzun sürecek olan. 7499 sayılı değişiklik
sonrası (01.06.2024) açık rıza artık yalnızca arızi hâllerden biri; Cloudflare
gibi bir tedarikçiye yapılan **rutin ve sistematik** aktarım buna dayanamaz.
KVKK m.9'un kademeli rejiminde bugün kullanılabilir yollar: Kurul onaylı
standart sözleşme (imzadan itibaren beş iş günü içinde Kurum'a bildirim),
taahhütname + Kurul izni, veya bağlayıcı şirket kuralları. Yeterlilik kararı
yayımlanmış bir ülke yok.

Bu, GA4'ten bağımsız ve **bugün canlıda mevcut** bir durum: uygulama,
veritabanı, dosya deposu ve loglar zaten Cloudflare'de. Yani hukuki sayfalar
yayına alınmasa bile çözülmesi gereken bir konu.

---

## Doldurduktan sonra

1. Üç içerik modülünde ilgili işaretleri gerçek değerlerle değiştir.
2. `pnpm typecheck` ve `pnpm test` çalıştır.
3. Lokalde (`pnpm dev`) üç sayfayı aç: dev uyarı kutusu kaybolmuş olmalı.
4. `docs/legal/` altındaki tedarikçi kaydını ve veri haritasını da aynı
   bilgilerle güncelle.
5. Avukat incelemesi tamamlanmadan yayına alma.
