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
// KTD31 — U28 tamamlandı: ziyaret ölçümü Cloudflare Web Analytics ile kurulu
// ve çerezsizliği iddia edilmiyor, doğrulandı. Temiz bir tarayıcı profilinde
// prod'da ana sayfa ve bir profil sayfası açıldı; DevTools'ta beacon'a ait
// hiçbir çerez, `localStorage` veya `sessionStorage` girdisi görülmedi.
// Doğrulamanın yan bulgusu: `<ScrollRestoration />` (`app/root.tsx`) sekmeye
// özel `react-router-scroll-positions` girdisini `sessionStorage`'a yazıyor.
// Bu girdi ölçüme ait değil ama cihazda duruyor; 1. bölümde adıyla anlatılır
// ve envantere alındı. Beacon otomatik enjeksiyonla geldiği için profil
// sayfaları dâhil tüm yüzeylerde çalışır — bölge geneli bir ayar, rota
// bazında kapatılamaz.
//
// Sonraki tarama (derlenmiş istemci paketi, `build/client/assets`) ikinci bir
// `sessionStorage` anahtarı buldu: React Router'ın rota keşfi, yeni sürüm
// yayınlandığında `react-router-manifest-version` yazıyor. 1. bölüme eklendi,
// envantere alındı; tablodaki satır sayısını anlatan cümleler (1., 3. ve 4.
// bölüm) buna göre "üç çerez + iki sessionStorage girdisi" diyor.
//
// R48 birinci taraf ölçümü de 2. bölümde anlatılıyor: public profillerde
// görüntülenme ve tıklama sayaçları kendi D1'imizde artıyor. Sayım sunucu
// tarafında olduğu ve cihaza hiçbir şey yazılmadığı için envantere girecek
// bir kalem doğurmuyor — ama "ziyaretleri nasıl sayıyoruz" sorusunun yanıtı
// artık yalnız Cloudflare Web Analytics değil, bu yüzden bölüm genişletildi.
//
// Köşeli parantezli her alan doğrulanmamış olgudur ve R33 kapısını tetikler:
// doldurulmadan belge prod'da 404 döner. Köşeli parantez metinde başka hiçbir
// amaçla kullanılmaz.
import { cookieTableRows } from "@caka/shared";
import type { LegalRow, LegalSection } from "@caka/shared";

/** Envanter satırları → tablo hücreleri. Sütun sırası aşağıdaki `columns` ile aynı. */
const cookieRows: LegalRow[] = cookieTableRows().map((row) => [
  [row.name],
  [row.storage],
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
          "Caka çerezleri yalnızca giriş ile kayıt akışını çalıştırmak için " +
            "kullanır. Tarayıcının sunduğu diğer depolama yollarından ",
          { kind: "strong", text: "localStorage" },
          " Caka'nın hiçbir yerinde kullanılmaz: uygulamanın kaynağında bu " +
            "API'ye yapılmış tek bir çağrı yoktur ve tarayıcında Caka adına " +
            "hiçbir kalıcı depolama girdisi oluşmaz.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "sessionStorage'da iki girdi oluşabilir. " },
          "Birincisini sayfalar arasında gezindiğinde tarayıcın yazar: ",
          { kind: "strong", text: "react-router-scroll-positions" },
          ". Bunu sitenin gezinme altyapısı (React Router) koyar ve tek işi " +
            "vardır: hangi sayfada ne kadar aşağı kaydırdığını hatırlamak, " +
            "böylece geri tuşuna bastığında sayfa başa atlamaz, kaldığın yere " +
            "döner. İçinde yalnız piksel değerleri bulunur.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "İkincisi ",
          { kind: "strong", text: "react-router-manifest-version" },
          " ve yalnızca ",
          {
            kind: "strong",
            text: "sitenin yeni bir sürümünü yayınladığımız anda sekmen açıksa",
          },
          " oluşur. Eski sürümde takılı kalmaman için sayfa bir kez " +
            "yenilenir; bu girdi de hangi sürüm için yenilendiğini tutar ki " +
            "yenileme döngüye girmesin. İçinde bir sürüm etiketinden başka " +
            "bir şey yoktur ve yenileme başarılı olur olmaz silinir. Çoğu " +
            "ziyarette hiç oluşmaz — ama oluşabildiği için burada yazıyoruz.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "İkisi de ",
          { kind: "strong", text: "birinci taraftır" },
          " — yalnızca caka.app okur, sunucuya gönderilmez — kimlik veya " +
            "başka bir kişisel veri taşımaz ve ",
          { kind: "strong", text: "sekmeyi kapattığında kendiliğinden silinir" },
          ". DevTools'u açıp bakarsan onları görürsün; bu yüzden burada da " +
            "yazıyoruz ve ",
          { kind: "link", text: "4. bölümdeki tabloda", href: "#cerez-tablosu" },
          " diğer girdilerle birlikte listeliyoruz.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Sadece geziniyorsan cihazına çerez yazılmaz. " },
          "Ana sayfayı veya bir Caka profilini açtığında Caka sana çerez " +
            "yazmaz. Çerezler ancak giriş yapmaya başladığında ya da kayıt " +
            "sırasında bir adres seçtiğinde oluşur. Cihazına dokunan her " +
            "girdinin — üç çerez ve yukarıdaki iki sessionStorage girdisi — " +
            "tamamını ",
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
          { kind: "strong", text: "Peki ziyaretleri nasıl sayıyoruz? " },
          "Ziyaret ölçümü için ",
          { kind: "strong", text: "Cloudflare Web Analytics" },
          " kullanıyoruz. Bu araç çerezsiz çalışır: ziyaretçinin cihazına " +
            "hiçbir şey yazmaz, cihazından hiçbir şey okumaz ve sana bir " +
            "kimlik atamaz. Bunu iddia olarak bırakmadık, ",
          { kind: "strong", text: "açıp baktık" },
          ": temiz bir tarayıcı profiliyle ana sayfa ve bir profil sayfası " +
            "açıldı, tarayıcının geliştirici araçlarında ölçüme ait hiçbir " +
            "çerez, hiçbir localStorage girdisi ve hiçbir cihaz kimliği " +
            "oluşmadığı görüldü. Sayfa yüklenirken tarayıcın yalnızca ölçüm " +
            "script'ini indirir; bu isteği ",
          {
            kind: "link",
            text: "6. bölümde",
            href: "#cihaza-yazmayan-istekler",
          },
          " ayrıca yazıyoruz. Bu araç yarın cihaza bir şey yazmaya başlarsa " +
            "envantere girer, tablo ile bu bölüm birlikte değişir ve rıza " +
            "duruşu yeniden değerlendirilir.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          {
            kind: "strong",
            text: "Bir de kendi sayacımız var — o da çerezsiz. ",
          },
          "Herkese açık bir Caka profilini açtığında, o sayfanın sahibi " +
            "kendi panelinde sayfasının kaç kez görüntülendiğini ve hangi " +
            "bağlantısına kaç kez tıklandığını görebilsin diye bir sayacı " +
            "biz kendi veritabanımızda artırıyoruz. Bu sayım tamamen " +
            "sunucu tarafında olur: ",
          {
            kind: "strong",
            text: "cihazına hiçbir şey yazılmaz, cihazından hiçbir şey okunmaz",
          },
          " ve sana bir kimlik atanmaz — bu yüzden 4. bölümdeki tabloda bir " +
            "satırı yoktur. Bağlantı tıklamaları tarayıcındaki küçük bir " +
            "JavaScript parçasıyla bildirilir, ama o da yalnızca hangi " +
            "bloğa tıklandığını gönderir ve karşılığında hiçbir şey almaz. " +
            "Ne saklandığı ve sahibinin tam olarak neyi görebildiği ",
          {
            kind: "link",
            text: "Gizlilik ve Aydınlatma Metni'nde",
            href: "/gizlilik#islenen-veriler",
          },
          " yazıyor.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Bunun bedeli de var. " },
          "Çerezsiz ve hafif bir ölçüm seçtiğimiz için sayılarımız eksiktir: " +
            "reklam engelleyiciler ölçüm script'ini engeller, dolayısıyla " +
            "ziyaretlerin bir kısmı hiç sayılmaz; adresin sonundaki kampanya " +
            "parametreleri (utm_ ile başlayanlar) kaydedilmediği için hangi " +
            "kampanyanın kaç ziyaret getirdiğini de göremeyiz. Bunu bilerek " +
            "kabul ettik; ölçümümüzün eksiksiz olduğunu hiçbir yerde " +
            "söylemiyoruz.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Kısacası: ",
          {
            kind: "strong",
            text:
              "Caka'da analitik çerezi, reklam veya pazarlama çerezi, reklam " +
              "ve sosyal medya pixel'i ve parmak izi tekniği yoktur; " +
              "kullandığımız çerezlerin tamamı zorunlu kategorisindedir.",
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
            "seçtiğin adres, sağlayıcıdan dönüşte sana bağlanamaz. " +
            "Tablodaki iki sessionStorage girdisi de aynı kritere girer: " +
            "biri kaydırma konumunu tutarak senin istediğin gezinme " +
            "davranışını sağlar, diğeri sayfanın eski bir sürümde takılı " +
            "kalmasını önler. Hiçbiri kişisel veri taşımaz ve hiçbiri senin " +
            "talep etmediğin bir amaca hizmet etmez, bu yüzden açık rıza " +
            "aranmaz.",
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
    heading: "4. Cihazına yazdıklarımızın tamamı",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Aşağıdaki tablo Caka'nın cihazına yazdığı her şeyi gösterir: üç " +
            "çerez ve iki sessionStorage girdisi. Beşi de birinci taraftır: " +
            "caka.app tarafından yazılır, yalnızca caka.app tarafından " +
            "okunur ve kimseyle paylaşılmaz. Hepsi her ziyarette oluşmaz — " +
            "her satırın ne zaman yazıldığını “Amaç” sütunu anlatıyor.",
        ],
      },
      {
        kind: "table",
        columns: [
          "Ad",
          "Tür",
          "Kategori",
          "Amaç",
          "Süre",
          "Taraf",
          "Sağlayıcı",
        ],
        rows: cookieRows,
        caption:
          "Tablo, uygulamanın kodundaki envanterden üretilir. Yeni bir çerez " +
          "veya depolama girdisi eklendiğinde önce envanter güncellenir ve " +
          "bu tablo kendiliğinden değişir; böylece politika ile gerçek " +
          "arasında sessiz bir fark oluşmaz.",
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
              text: "Ziyaret ölçümü (Cloudflare Web Analytics). ",
            },
            "Her sayfa yüklemesinde tarayıcın ",
            { kind: "strong", text: "static.cloudflareinsights.com" },
            " adresinden küçük bir ölçüm script'i indirir ve görüntülenen " +
              "sayfayı bildirir. Bu istekte IP adresin ve User Agent'ın " +
              "Cloudflare'e ulaşır; ",
            {
              kind: "strong",
              text: "cihazına hiçbir şey yazılmaz ve cihazından hiçbir şey okunmaz",
            },
            " — bu yüzden 4. bölümdeki tabloda yer almaz. Script otomatik " +
              "olarak alan adının tamamına eklenir; ana sayfada da, herkese " +
              "açık profil sayfalarında da çalışır ve sayfa bazında " +
              "kapatılamaz. Reklam engelleyici kullanıyorsan bu istek " +
              "büyük ihtimalle hiç yapılmaz.",
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
          { kind: "strong", text: "hello@caka.app" },
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
