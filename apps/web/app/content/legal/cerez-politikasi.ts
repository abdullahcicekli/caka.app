// U19 — Çerez Politikası (R31, R32).
//
// Metin repodaki gerçek davranıştan yazıldı: çerez envanteri
// `packages/shared/src/cookies.ts`, çerez yazan tek istemci kodu
// `app/routes/onboarding.tsx` (`caka_claim`), oturum ve state çerezleri Better
// Auth, font isteği `app/root.tsx`, uzak önizleme görseli
// `app/components/profile/profile-block.tsx`.
//
// KTD21: 4. bölümdeki tablo elle yazılmaz; `COOKIE_INVENTORY`'den
// `cookieTableRows()` ile üretilir. Yeni bir çerez eklenirse önce envanter
// güncellenir, tablo kendiliğinden değişir — politika ile gerçek arasında
// sessiz kayma oluşmaz.
//
// KTD31 — U28 için not: bu belge bugün var olanı anlatır. Üründe çalışan bir
// ölçüm aracı yok, dolayısıyla metin hiçbir ölçüm aracının çerezsizliğini
// iddia etmiyor. Ölçüm devreye alınıp cihaza hiçbir şey yazmadığı DevTools'ta
// doğrulandığında GENİŞLETİLECEK BÖLÜM: `kullanmadiklarimiz` (2. bölüm) —
// oradaki "Analitik veya ölçüm çerezi" maddesinin ardına doğrulanmış cümle
// eklenir. İkinci dokunuş `cihaza-yazmayan-istekler` (6. bölüm) listesine
// ölçüm beacon'ının satırıdır. Diğer bölümler değişmeden kalır.
//
// Köşeli parantezli her alan doğrulanmamış olgudur ve R33 kapısını tetikler:
// doldurulmadan belge prod'da 404 döner. Köşeli parantez metinde başka hiçbir
// amaçla kullanılmaz.
import { cookieTableRows } from "@caka/shared";
import type { LegalRow, LegalSection } from "@caka/shared";

/** Envanter satırları → tablo hücreleri. Sütun sırası aşağıdaki `columns` ile aynı. */
const cookieRows: LegalRow[] = cookieTableRows().map((row) => [
  [row.name],
  [row.category],
  [row.purpose],
  [row.lifetime],
  [row.party],
  [row.provider],
]);

export const cerezPolitikasiSections: LegalSection[] = [
  /* ---------------------------------------------------------------- *
   * 1. Çerez nedir, Caka nelerini kullanır
   * ---------------------------------------------------------------- */
  {
    id: "cerez-nedir",
    heading: "1. Çerez nedir ve Caka hangilerini kullanır",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Çerez, bir siteyi ziyaret ettiğinde tarayıcının cihazına yazdığı " +
            "küçük bir metin dosyasıdır. Sonraki isteklerde aynı siteye geri " +
            "gönderilir; site böylece seni bir önceki istekten hatırlar. " +
            "Çerezler 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) " +
            "kapsamındadır, bu yüzden bu sayfa var.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Caka bu teknolojilerden yalnızca ",
          { kind: "strong", text: "çerezleri" },
          " kullanır ve onları da yalnızca giriş ile kayıt akışını " +
            "çalıştırmak için. Tarayıcının sunduğu diğer depolama yolları — ",
          { kind: "strong", text: "localStorage" },
          " ve ",
          { kind: "strong", text: "sessionStorage" },
          " — Caka'nın hiçbir yerinde kullanılmaz. Bu, kodda tek tek " +
            "doğrulanabilir bir iddia: uygulamanın kaynağında bu iki API'ye " +
            "yapılmış tek bir çağrı yoktur.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Sadece geziniyorsan cihazına hiçbir şey yazılmaz. " },
          "Ana sayfayı veya bir Caka profilini açtığında Caka sana çerez " +
            "yazmaz. Çerezler ancak giriş yapmaya başladığında ya da kayıt " +
            "sırasında bir adres seçtiğinde oluşur. Hangileri olduğunu ",
          { kind: "link", text: "4. bölümdeki tabloda", href: "#cerez-tablosu" },
          " görebilirsin.",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 2. Kullanmadıklarımız  — U28 bu bölümü genişletir (bkz. dosya başı notu)
   * ---------------------------------------------------------------- */
  {
    id: "kullanmadiklarimiz",
    heading: "2. Kullanmadığımız çerezler",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Çoğu sitede bu bölüm uzun olur. Caka'da kısa, çünkü listeyi " +
            "kullandıklarımız değil kullanmadıklarımız uzatıyor:",
        ],
      },
      {
        kind: "list",
        style: "bullet",
        items: [
          [
            { kind: "strong", text: "Analitik veya ölçüm çerezi yok. " },
            "Kaç kişinin hangi sayfayı gezdiğini saymak için cihazına çerez " +
              "yazmıyoruz.",
          ],
          [
            { kind: "strong", text: "Reklam, pazarlama ve yeniden hedefleme çerezi yok. " },
            "Caka'da reklam gösterilmiyor ve seni başka sitelerde takip " +
              "edecek hiçbir etiket yerleştirilmiyor.",
          ],
          [
            { kind: "strong", text: "Üçüncü taraf pixel'i yok. " },
            "Sayfalarımızda reklam ağlarının veya sosyal medya platformlarının " +
              "ölçüm pixel'leri, gömülü takip script'leri bulunmaz.",
          ],
          [
            { kind: "strong", text: "Parmak izi çıkarma yok. " },
            "Çerez yerine cihazının özelliklerini birleştirerek seni tanımaya " +
              "çalışan bir yöntem de kullanmıyoruz.",
          ],
          [
            { kind: "strong", text: "Çapraz site takibi yok. " },
            "Caka'nın yazdığı çerezler yalnızca caka.app içinde okunur; " +
              "başka sitelerdeki gezinmeni göremeyiz.",
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Kısacası: ",
          {
            kind: "strong",
            text:
              "Caka'da analitik çerezi, reklam veya pazarlama çerezi, üçüncü " +
              "taraf pixel'i ve parmak izi tekniği yoktur; kullandığımız " +
              "çerezlerin tamamı zorunlu kategorisindedir.",
          },
          " Bu boş bir taahhüt değil, envanterin bugünkü hâli: kodda " +
            "tanımlanmış tek çerez kategorisi ",
          { kind: "strong", text: "zorunlu" },
          ". Analitik ve pazarlama kategorileri bilinçli olarak hiç " +
            "tanımlanmadı; böyle bir araç eklenirse önce envantere girer, ",
          { kind: "link", text: "tablo", href: "#cerez-tablosu" },
          " ile bu bölüm birlikte güncellenir ve rıza duruşu yeniden " +
            "değerlendirilir.",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 3. Neden rıza banner'ı yok
   * ---------------------------------------------------------------- */
  {
    id: "neden-banner-yok",
    heading: "3. Neden çerez banner'ı göstermiyoruz",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Caka'ya girdiğinde karşına bir çerez onayı kutusu çıkmaz. Bunun " +
            "sebebi konuyu önemsememiz değil; ",
          {
            kind: "strong",
            text: "rıza gerektiren hiçbir şey yapmıyor olmamızdır",
          },
          ".",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Kişisel Verileri Koruma Kurumu'nun Temmuz 2025 tarihli Çerez " +
            "Uygulamaları Hakkında Rehberi (Yayın No: 69) açık rıza aranmayan " +
            "iki hâl sayar:",
        ],
      },
      {
        kind: "list",
        style: "bullet",
        items: [
          [
            { kind: "strong", text: "Kriter A — " },
            "çerezin tek amacı iletişimin sağlanması ise.",
          ],
          [
            { kind: "strong", text: "Kriter B — " },
            "çerez, kullanıcının açıkça talep ettiği hizmetin sunulabilmesi " +
              "için kesinlikle gerekli ise.",
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Tablodaki üç çerez de Kriter B'ye girer: ikisi olmadan giriş " +
            "yapamazsın — biri oturumunu taşır, diğeri giriş gidiş-dönüşünü " +
            "sahteciliğe karşı korur. Üçüncüsü olmadan kayıt sırasında " +
            "seçtiğin adres, sağlayıcıdan dönüşte sana bağlanamaz. Hiçbiri " +
            "senin talep etmediğin bir amaca hizmet etmez, bu yüzden açık " +
            "rıza aranmaz.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Rıza koşulludur, aydınlatma koşulsuz. " },
          "Rıza gerekmemesi, sana hiçbir şey anlatmama hakkı vermez: hangi " +
            "hukuki sebebe dayanılırsa dayanılsın aydınlatma yapılması " +
            "gerekir — Aydınlatma Yükümlülüğünün Yerine Getirilmesinde " +
            "Uyulacak Usul ve Esaslar Hakkında Tebliğ m.5 bunu arar. ",
          {
            kind: "strong",
            text: "Bu sayfa tam olarak o yükümlülüğü karşılamak için var",
          },
          ": senden onay istemez, ne yaptığımızı yazar. Kişisel verilerinin " +
            "işlenmesine ilişkin aydınlatmanın tamamı için ",
          {
            kind: "link",
            text: "Gizlilik ve Aydınlatma Metni",
            href: "/gizlilik",
          },
          " sayfasına bak.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Aynı sebeple bir çerez tercih merkezi de yok. Yönetilecek isteğe " +
            "bağlı bir çerez olmadığı için böyle bir sayfa açıp kapatacak " +
            "hiçbir şey bulamazdı; var gibi göstermek yanıltıcı olurdu. " +
            "Zorunlu çerezleri yine de tarayıcından engelleyebilirsin — ",
          {
            kind: "link",
            text: "5. bölüm",
            href: "#tercihleri-yonetme",
          },
          " bunun sonucunu anlatıyor.",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 4. Çerez tablosu — KTD21: satırlar `COOKIE_INVENTORY`'den gelir
   * ---------------------------------------------------------------- */
  {
    id: "cerez-tablosu",
    heading: "4. Kullandığımız çerezler",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Aşağıdaki tablo Caka'nın yazdığı çerezlerin tamamıdır. Üçü de " +
            "birinci taraf çerezidir: caka.app tarafından yazılır, yalnızca " +
            "caka.app tarafından okunur ve kimseyle paylaşılmaz.",
        ],
      },
      {
        kind: "table",
        columns: ["Çerez adı", "Kategori", "Amaç", "Süre", "Taraf", "Sağlayıcı"],
        rows: cookieRows,
        caption:
          "Tablo, uygulamanın kodundaki çerez envanterinden üretilir. Yeni " +
          "bir çerez eklendiğinde önce envanter güncellenir ve bu tablo " +
          "kendiliğinden değişir; böylece politika ile gerçek arasında " +
          "sessiz bir fark oluşmaz.",
      },
      {
        kind: "paragraph",
        text: [
          "Adların başındaki ",
          { kind: "strong", text: "__Secure-" },
          " öneki tarayıcının bir güvenlik işaretidir: o çerezin yalnızca " +
            "HTTPS bağlantısı üzerinden gönderileceği anlamına gelir. Oturum " +
            "ve giriş güvenliği çerezleri ayrıca ",
          { kind: "strong", text: "HttpOnly" },
          " işaretlidir — sayfadaki JavaScript bunları okuyamaz.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Bu çerezlerin ömrü, ilgili verinin saklanma süresiyle aynıdır; " +
            "saklama sürelerinin tamamı için ",
          {
            kind: "link",
            text: "Gizlilik ve Aydınlatma Metni'ndeki saklama süreleri",
            href: "/gizlilik#saklama-sureleri",
          },
          " bölümüne bakabilirsin. Çerezlerin toplama yöntemi içindeki yeri " +
            "ise ",
          {
            kind: "link",
            text: "verilerin toplanma yöntemi",
            href: "/gizlilik#toplama-yontemi",
          },
          " bölümünde anlatılıyor.",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 5. Tercihleri yönetme
   * ---------------------------------------------------------------- */
  {
    id: "tercihleri-yonetme",
    heading: "5. Çerezleri nasıl yönetirsin",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Onaylanacak isteğe bağlı bir çerez olmadığı için Caka'da " +
            "kapatabileceğin bir ayar sunmuyoruz. Çerez denetimi tamamen " +
            "tarayıcındadır: her tarayıcının ayarlarında çerezleri site " +
            "bazında engelleyebileceğin, mevcut çerezleri silebileceğin ve " +
            "kapanışta otomatik temizlenmelerini isteyebileceğin bir bölüm " +
            "bulunur. Bu ayarlar genellikle “Gizlilik ve güvenlik” başlığı " +
            "altındadır.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Ama sonucunu bilerek yap. " },
          "Tablodaki çerezler zorunlu; caka.app için çerezleri engellersen " +
            "veya silersen ",
          {
            kind: "strong",
            text: "giriş yapamaz ve kayıt akışını tamamlayamazsın",
          },
          ". Giriş denemesi ya sahtecilik koruması nedeniyle reddedilir ya da " +
            "seni tekrar giriş ekranına düşürür; kayıt sırasında seçtiğin " +
            "adres de sana bağlanamaz. Halihazırda açık olan bir oturumun " +
            "çerezini silmek çıkış yapmakla aynı sonucu verir.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Giriş yapmadan bir Caka profilini gezmek için çerezlere ihtiyacın " +
            "yoktur: çerezleri tümüyle kapatsan da public profiller " +
            "görüntülenmeye devam eder.",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 6. Çerez olmayan üçüncü taraf istekleri  — U28 buraya beacon satırı ekler
   * ---------------------------------------------------------------- */
  {
    id: "cihaza-yazmayan-istekler",
    heading: "6. Cihazına çerez yazmayan üçüncü taraf istekleri",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Bir sayfayı açtığında tarayıcın yalnızca bizim sunucumuza değil, " +
            "birkaç dış adrese de istek atar. Bunlar çerez değildir ama " +
            "görünmez de değildir: her istekte ",
          { kind: "strong", text: "IP adresin ve User Agent bilgin" },
          " karşı tarafa ulaşır. Bu yüzden burada da yazıyoruz.",
        ],
      },
      {
        kind: "list",
        style: "bullet",
        items: [
          [
            { kind: "strong", text: "Yazı tipleri (Fontshare). " },
            "Sitedeki yazı tipleri her sayfa yüklemesinde Fontshare " +
              "servisinden çekilir. Bu istekte IP adresin ve User Agent'ın " +
              "servise ulaşır; cihazına hiçbir şey yazılmaz ve cihazından " +
              "hiçbir şey okunmaz. Yazı tiplerini kendi sunucumuza taşıyıp bu " +
              "isteği tamamen kaldırmak iş listemizde duruyor.",
          ],
          [
            {
              kind: "strong",
              text: "Profillerdeki bağlantı önizleme görselleri. ",
            },
            "Bir Caka profilinde, profil sahibinin eklediği bağlantıların " +
              "önizleme görselleri bizim sunucumuzdan geçmez: tarayıcın o " +
              "görseli ",
            {
              kind: "strong",
              text: "doğrudan profil sahibinin seçtiği sitenin sunucusundan",
            },
            " çeker. Bu istekte IP adresin ve User Agent'ın o siteye ulaşır " +
              "ve ",
            {
              kind: "strong",
              text: "o site tarayıcına kendi çerezini yazabilir",
            },
            ". Aynı çerez farklı Caka profillerinde de okunabileceği için o " +
              "site ziyaretlerini birbirine bağlayabilir. Bu istekler bizim " +
              "denetimimizde değildir, şu anda engellenmiş de değildir; " +
              "görselleri kendi sunucumuz üzerinden geçirerek bu sızıntıyı " +
              "kapatmak iş listemizde duruyor.",
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Önizleme görselini veren sitenin yazdığı çerez ",
          { kind: "strong", text: "bize ait değildir" },
          ": onu biz yazmayız, okuyamayız ve silemeyiz — bu yüzden ",
          { kind: "link", text: "4. bölümdeki tabloda", href: "#cerez-tablosu" },
          " yer almaz. O çerez için o sitenin kendi politikası geçerlidir. " +
            "Hangi tedarikçiye hangi verinin ulaştığının tam listesi ",
          {
            kind: "link",
            text: "Gizlilik ve Aydınlatma Metni'ndeki aktarım ve tedarikçiler",
            href: "/gizlilik#aktarim-ve-tedarikciler",
          },
          " bölümündedir.",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 7. Değişiklikler ve iletişim
   * ---------------------------------------------------------------- */
  {
    id: "degisiklikler",
    heading: "7. Bu politikadaki değişiklikler ve iletişim",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Ürün değiştikçe bu politika da değişir: yeni bir çerez " +
            "eklendiğinde, bir çerezin amacı veya ömrü değiştiğinde ya da " +
            "cihazına dokunan yeni bir araç devreye girdiğinde metni " +
            "güncelleriz. Böyle bir araç eklenirse yalnızca tabloyu " +
            "büyütmekle kalmaz, rıza gerekip gerekmediğini de yeniden " +
            "değerlendiririz.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Her güncellemede sayfanın başındaki sürüm numarası artar ve son " +
            "güncelleme tarihi yenilenir. Üç hukuki belgenin sürümleri " +
            "birbirinden bağımsızdır: yalnızca değişen belgenin tarihi oynar, " +
            "diğerlerininki olduğu gibi kalır.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Sorular ve başvurular. " },
          "Çerezler hakkındaki sorularını ve kişisel verilerine ilişkin " +
            "taleplerini ",
          { kind: "strong", text: "[KVKK BAŞVURU E-POSTASI]" },
          " adresine yazabilirsin. Başvurunun nasıl işlediği ve KVKK m.11 " +
            "kapsamındaki hakların ",
          {
            kind: "link",
            text: "Gizlilik ve Aydınlatma Metni'ndeki ilgili kişi hakları",
            href: "/gizlilik#ilgili-kisi-haklari",
          },
          " bölümünde yazıyor.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Bu metinle birlikte ",
          {
            kind: "link",
            text: "Gizlilik ve Aydınlatma Metni",
            href: "/gizlilik",
          },
          " ve ",
          {
            kind: "link",
            text: "Kullanım Koşulları",
            href: "/kullanim-kosullari",
          },
          " sayfalarını da okumanı öneririz.",
        ],
      },
    ],
  },
];
