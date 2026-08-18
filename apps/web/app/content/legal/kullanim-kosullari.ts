// U18 — Kullanım Koşulları (R30).
//
// Metin repodaki gerçek davranıştan yazıldı: kullanıcı adı kuralları ve rezerve
// listesi `packages/shared/src/username.ts`, adres değişikliği semantiği
// `packages/db/src/schema.ts` (`username_redirect`) ve AGENTS.md Değişmez #10,
// blok türleri profil şeması, dosya yükleme R2 (`asset`).
//
// Ürünün bugün yapmadığı hiçbir şey için koşul yazılmadı: ücretli plan, ödeme,
// pazar yeri, self-servis hesap silme, dışa aktarma ve gömülü oynatıcı yok.
//
// Bu belgede doldurulmamış alan (`[...]`) kalmadı; R33 kapısı yalnız
// İşletmecinin kimliği `gizlilik.ts` §1 üzerinden işler; orada ad soyad
// yayınlanmıyor ve bunun m.10'u tam karşılamadığı açıkça yazılı.
//
// §11 (sorumluluk) ve §14 (uyuşmazlık) bilinçli olarak sınırlama değil kapsam
// üzerine kuruldu: haksız şart yasağı ve HMK m.17 karşısında geçersiz olacak
// bir kaydı yazmak, hiç yazmamaktan kötüdür. Gerekçeler
// `docs/legal/bilinen-aciklar.md`'de.
import type { LegalSection } from "@caka/shared";

export const kullanimKosullariSections: LegalSection[] = [
  /* ---------------------------------------------------------------- *
   * 1. Taraflar ve hizmetin tanımı
   * ---------------------------------------------------------------- */
  {
    id: "taraflar-ve-hizmet",
    heading: "1. Taraflar ve hizmetin tanımı",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Bu koşullar, Caka'yı (caka.app) işleten bizimle Caka'yı kullanan " +
            "sen arasındaki sözleşmedir. Caka bir şirket değil, açık " +
            "kaynaklı kişisel bir projedir; arkasında bugün kurulmuş bir " +
            "tüzel kişilik yoktur ve bu yüzden burada bir ticari unvan " +
            "yazmıyoruz. Bize ",
          { kind: "strong", text: "hello@caka.app" },
          " adresinden ulaşırsın. Metinde ",
          { kind: "strong", text: "“biz”" },
          " Caka'yı işleteni, ",
          { kind: "strong", text: "“sen”" },
          " ise hesap açan veya siteyi ziyaret eden kişiyi anlatır.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Caka bir ",
          { kind: "strong", text: "link-in-bio barındırma hizmetidir" },
          ": caka.app/kullaniciadi adresinde herkese açık tek sayfalık bir " +
            "profil kurarsın ve bu sayfada kendi bağlantılarını, sosyal " +
            "hesaplarını, kısa metinlerini ve görsellerini yayınlarsın. " +
            "Caka sayfayı barındırır ve ziyaretçilere sunar; sayfada ne " +
            "yazdığına ve nereye bağlantı verdiğine sen karar verirsin.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Hesap açarak veya siteyi kullanarak bu koşulları kabul etmiş " +
            "olursun. Kabul etmiyorsan hizmeti kullanmamalısın.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Bu metinle birlikte ",
          { kind: "link", text: "Gizlilik ve Aydınlatma Metni", href: "/gizlilik" },
          " ve ",
          { kind: "link", text: "Çerez Politikası", href: "/cerez-politikasi" },
          " de geçerlidir. Kişisel verilerinin nasıl işlendiğini oradan " +
            "okuyabilirsin; bu koşullar veri işleme konusunda ayrı bir taahhüt " +
            "vermez.",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 2. Hesap açma ve hesap güvenliği
   * ---------------------------------------------------------------- */
  {
    id: "hesap-ve-guvenlik",
    heading: "2. Hesap açma ve hesap güvenliği",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Caka'da hesap açmanın tek yolu ",
          { kind: "strong", text: "Google veya Apple hesabınla giriş yapmaktır" },
          ". Caka'da ayrı bir parola oluşturmazsın ve biz parola saklamayız. " +
            "Bunun pratik sonucu şudur: Caka hesabının güvenliği, giriş için " +
            "kullandığın Google veya Apple hesabının güvenliğine bağlıdır. O " +
            "hesabı iki adımlı doğrulamayla korumak senin sorumluluğundadır.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Giriş yaptığın sağlayıcı hesabına erişimini kaybedersen Caka " +
            "hesabına da erişemezsin. Böyle bir durumda bize yazabilirsin, " +
            "ancak kimliğini doğrulayamadığımız hiçbir hesabı kimseye " +
            "açmayız — bu, hesabını başkasının ele geçirmesini engelleyen " +
            "kuralın kendisidir.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Hesabın altında yapılan her işlemden — cihazını veya sağlayıcı " +
            "hesabını başkasına açık bırakman dâhil — sen sorumlusun. " +
            "Hesabının izinsiz kullanıldığını fark edersen önce sağlayıcı " +
            "hesabının oturumlarını kapat, sonra bize haber ver.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Hesabını başkasına devredemez, satamaz veya kiralayamazsın. " +
            "Bir ekip ya da kurum adına profil açıyorsan, o kurumu temsil " +
            "etme yetkisine sahip olduğunu kabul etmiş sayılırsın.",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 3. Kullanıcı adı politikası
   * ---------------------------------------------------------------- */
  {
    id: "kullanici-adi",
    heading: "3. Kullanıcı adı ve adres politikası",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Profilinin adresi seçtiğin kullanıcı adından oluşur: " +
            "caka.app/kullaniciadi. Kullanıcı adı 3 ile 30 karakter arasında " +
            "olur; yalnızca küçük harf, rakam ve tire içerebilir, başta veya " +
            "sonda tire olamaz.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Rezerve adlar. " },
          "Bazı adlar kimseye verilmez. Bunlar uygulamanın kendi sayfa " +
            "adresleri (örneğin giris, ayarlar, api), yetki ve altyapı rolü " +
            "taklidi yapan adlar (admin, destek, guvenlik), dinî değerleri " +
            "taklit eden adlar ve marka koruması gereği ",
          { kind: "strong", text: "caka" },
          " ile başlayan her addır. Rezerve bir ad seçmeye çalışırsan " +
            "editör seni uyarır.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Adresini değiştirdiğinde ne olur. " },
          "Kullanıcı adını değiştirebilirsin. Değiştirdiğinde eski adres ",
          { kind: "strong", text: "30 gün boyunca" },
          " yeni adresine yönlendirilir ve bu süre boyunca kilitli kalır — " +
            "yani başkası o adı alamaz. Yönlendirme geçici (302) olarak " +
            "yapılır; kalıcı yönlendirme kullanmıyoruz, çünkü tarayıcılar " +
            "kalıcı yönlendirmeyi süresiz önbelleğe alır ve ad serbest " +
            "kaldıktan sonra bile ziyaretçiyi yanlış yere göndermeye devam " +
            "ederdi. 30 gün dolduğunda kayıt geçersiz olur, eski adres " +
            "çalışmayı bırakır ve ad yeniden herkese açılır.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Bunun anlamı, paylaştığın eski bağlantıların bir ay içinde " +
            "güncellenmesi gerektiğidir. Süre dolduktan sonra aynı adı " +
            "başkası alabilir ve o eski bağlantı artık senin profiline " +
            "gitmez.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Ne sıklıkla değiştirebilirsin. " },
          "Bir adres değişikliğinden sonra ",
          { kind: "strong", text: "30 gün" },
          " boyunca adresini yeniden değiştiremezsin. Bu bekleme, " +
            "yönlendirme ve kilit süresiyle aynı uzunluktadır: her " +
            "değişiklik arkasında 30 gün kilitli bir ad bıraktığı için, " +
            "arka arkaya yapılan değişiklikler hem birden çok adı " +
            "dolaşımdan çıkarır hem de paylaştığın bağlantıların hepsini " +
            "kırar. Süre dolduğunda dilersen eski adresini geri alabilirsin.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Kötüye kullanım hâlinde geri alma. " },
          "Bir kullanıcı adını, başkasının adını, markasını veya kurumunu " +
            "taklit etmek, satmak ya da yalnızca stoklamak için alırsan o adı " +
            "geri alabilir ve profilini başka bir adrese taşıyabiliriz. Marka " +
            "hakkı sahibinin belgeli talebi de bu kapsamdadır. Mümkün olduğu " +
            "her durumda önce sana yazarız.",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 4. Kullanıcı içeriği ve sorumluluk
   * ---------------------------------------------------------------- */
  {
    id: "kullanici-icerigi",
    heading: "4. Profilindeki içerik ve sorumluluğun",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Profilindeki her şeyi sen koyarsın: profil kartındaki ad ve kısa " +
            "tanıtım yazısı, bağlantı blokları, sosyal hesap blokları, metin " +
            "ve durum bloklarındaki yazılar, yüklediğin görseller ve " +
            "gösterdiğin GitHub katkı grafiği. Caka bu içeriği ne yazar ne " +
            "de seçer; barındırır ve yayınlar.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Bu yüzden içeriğin hukuka uygunluğundan ",
          { kind: "strong", text: "sen sorumlusun" },
          ". Somut olarak, profiline eklediğin her öge için şunları beyan " +
            "etmiş olursun:",
        ],
      },
      {
        kind: "list",
        style: "bullet",
        items: [
          [
            { kind: "strong", text: "Yayınlama hakkın var. " },
            "Yüklediğin görselin, kullandığın metnin, logonun ve müziğin " +
              "telif hakkı ya sende ya da yayınlamak için gerekli izni " +
              "almışsın. İnternette bulduğun bir görseli yüklemek, onu " +
              "kullanma hakkı vermez.",
          ],
          [
            { kind: "strong", text: "Marka ve isim hakkına saygılısın. " },
            "Sahibi olmadığın bir markayı, kurumu veya kişiyi kendi adınmış " +
              "gibi göstermezsin. Bir markanın resmî hesabıymış izlenimi " +
              "veren profiller, o marka seninse sorun değildir; değilse " +
              "taklittir.",
          ],
          [
            { kind: "strong", text: "Bağlantı verdiğin yerlerden sorumlusun. " },
            "Profiline koyduğun her adres senin seçimindir. Bağlantının " +
              "gittiği sayfanın içeriği hukuka aykırıysa ya da ziyaretçiyi " +
              "zarara uğratıyorsa, bunun sorumluluğu bağlantıyı koyan " +
              "kişidedir.",
          ],
          [
            { kind: "strong", text: "Başkasının kişisel verisini izinsiz yayınlamazsın. " },
            "Bir başkasının fotoğrafını, telefonunu, adresini veya " +
              "yazışmasını profiline koymak, o kişinin rızası olmadan " +
              "hukuka aykırıdır. Profilinde gösterdiğin GitHub hesabı sana " +
              "ait değilse, o hesabın herkese açık katkı verisini yayınlıyor " +
              "olursun — bunu bilerek yap.",
          ],
          [
            { kind: "strong", text: "Kendi iletişim bilgilerini bilerek paylaşırsın. " },
            "Profiline yazdığın e-posta, telefon veya adres bilgisi " +
              "internetteki herkese açıktır ve otomatik araçlarla " +
              "toplanabilir. Bunu bizden gizli bir alan sanma; herkese açık " +
              "bir sayfaya yazmış olursun.",
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Yayınlanmamış taslakların. " },
          "Profil editöründe yaptığın ve henüz yayınlamadığın değişiklikler " +
            "public sayfanda görünmez. Yayınla dediğin an, o düzen herkese " +
            "açık hâle gelir ve arama motorları tarafından dizine alınabilir. " +
            "Bir içeriği kaldırsan bile, o sırada sayfanı görmüş kişilerin " +
            "veya üçüncü taraf arşivlerin elindeki kopyaları geri " +
            "getiremeyiz.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Bir içeriğin bize bildirilmesi hâlinde ne yaptığımız ",
          { kind: "link", text: "Bildirim ve kaldırma", href: "#bildirim-ve-kaldirma" },
          " bölümünde yazıyor. İçeriğini önceden denetlemediğimizi de " +
            "burada açıkça söyleyelim: her profili yayından önce okuyan bir " +
            "moderasyon süreci yok.",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 5. Yasak içerikler
   * ---------------------------------------------------------------- */
  {
    id: "yasak-icerikler",
    heading: "5. Yasak içerik ve davranışlar",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Aşağıdakiler Caka'da yasaktır. Liste hem profiline yazdığın " +
            "içeriği hem de bağlantı verdiğin sayfaları kapsar — yasak bir " +
            "sayfaya bağlantı vermek, o içeriği Caka'ya koymakla aynı " +
            "sayılır.",
        ],
      },
      {
        kind: "list",
        style: "bullet",
        items: [
          [
            { kind: "strong", text: "Kimlik avı ve dolandırıcılık. " },
            "Başka bir servisin giriş ekranını taklit eden sayfalar, sahte " +
              "ödeme veya bağış toplama, sahte çekiliş ve “önce sen gönder” " +
              "düzenleri.",
          ],
          [
            { kind: "strong", text: "Zararlı yönlendirme. " },
            "Zararlı yazılım dağıtan, kullanıcıyı kandırarak indirme " +
              "yaptıran veya ziyaretçiyi haberi olmadan başka bir yere atan " +
              "bağlantılar.",
          ],
          [
            { kind: "strong", text: "Taklit. " },
            "Başka bir kişiyi, markayı, kurumu veya kamu otoritesini " +
              "onlarmış gibi temsil etmek.",
          ],
          [
            { kind: "strong", text: "Telif ve marka ihlali. " },
            "Hakkına sahip olmadığın eserleri yayınlamak veya bu eserlerin " +
              "izinsiz kopyalarına bağlantı vermek.",
          ],
          [
            { kind: "strong", text: "Nefret söylemi, şiddet ve taciz. " },
            "Irk, etnik köken, din, cinsiyet, cinsel yönelim, engellilik ve " +
              "benzeri özellikler üzerinden nefreti körükleyen içerik; " +
              "şiddete çağrı, tehdit, hedef gösterme ve kişiye yönelik " +
              "sistematik taciz.",
          ],
          [
            { kind: "strong", text: "Çocukların istismarı. " },
            "Çocukların cinsel istismarına ilişkin her tür içerik ve buna " +
              "giden her bağlantı. Bu maddede uyarı, askıya alma veya " +
              "kademeli süreç yoktur: erişim doğrudan kapatılır ve gereken " +
              "bildirimler yapılır.",
          ],
          [
            { kind: "strong", text: "Hukuka aykırı ürün ve hizmetler. " },
            "Uyuşturucu, silah, sahte belge, çalıntı hesap ve verinin " +
              "satışı; mevzuatın izin vermediği kumar ve bahis " +
              "yönlendirmeleri.",
          ],
          [
            { kind: "strong", text: "Yetişkin içeriği. " },
            "Pornografik içerik ve bu içeriğe yönlendiren bağlantılar. " +
              "Caka'da bunları yaş kapısı arkasına alacak bir düzenek yok; " +
              "bu yüzden istisnasız yasaktır.",
          ],
          [
            { kind: "strong", text: "Başkasının kişisel verisinin izinsiz yayını. " },
            "Bir kişinin iletişim bilgisini, adresini, belgesini veya " +
              "görüntüsünü rızası olmadan yayınlamak.",
          ],
          [
            { kind: "strong", text: "Spam ve otomatik kötüye kullanım. " },
            "Toplu sahte hesap açmak, adres stoklamak, servisi otomatik " +
              "araçlarla yük altına sokmak, güvenlik önlemlerini aşmaya " +
              "çalışmak veya sistemdeki bir açığı kötüye kullanmak.",
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Bir güvenlik açığı bulursan kötüye kullanmak yerine ",
          { kind: "strong", text: "hello@caka.app" },
          " adresine yaz. İyi niyetle bildirilen açıklar için sana karşı " +
            "işlem başlatmayız.",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 6. İçerik lisansı
   * ---------------------------------------------------------------- */
  {
    id: "icerik-lisansi",
    heading: "6. İçeriğin üzerindeki haklar",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Profiline koyduğun içerik ",
          { kind: "strong", text: "senindir ve senin kalır" },
          ". Caka, içeriğin üzerinde mülkiyet iddia etmez.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Ancak bir sayfayı barındırıp yayınlayabilmek teknik olarak " +
            "kopyalama, saklama ve iletme demektir. Bu yüzden içeriğini " +
            "Caka'ya eklediğinde bize, ",
          {
            kind: "strong",
            text:
              "yalnızca hizmeti işletmek için gerekli olan, münhasır " +
              "olmayan, bedelsiz ve devredilebilir olmayan sınırlı bir " +
              "kullanım hakkı",
          },
          " vermiş olursun. Bu hak şunları kapsar:",
        ],
      },
      {
        kind: "list",
        style: "bullet",
        items: [
          [
            "İçeriği sunucularımızda saklamak ve yedeklemek.",
          ],
          [
            "Profilini isteyen ziyaretçilere göstermek ve içerik dağıtım ağı " +
              "üzerinden iletmek.",
          ],
          [
            "Görsellerini sayfada düzgün görünmeleri için yeniden " +
              "boyutlandırmak ve biçim dönüştürmek.",
          ],
          [
            "Profilin bir mesajlaşma uygulamasında veya sosyal ağda " +
              "paylaşıldığında görünen önizleme görselini ve başlığını " +
              "üretmek.",
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Bu hak ",
          { kind: "strong", text: "bunlarla sınırlıdır" },
          ". İçeriğini reklamda kullanmayız, üçüncü kişilere satmayız, " +
            "lisanslamayız ve başka bir ürüne dâhil etmeyiz. Bir içeriği " +
            "profilinden kaldırdığında ya da hesabını kapattığında bu hak da " +
            "sona erer; teknik yedeklerdeki kopyalar olağan yedek döngüsü " +
            "içinde tasfiye olur.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Caka'nın kendi adı, logosu, arayüzü, tema tasarımları ve kaynak " +
            "kodu ise bize aittir; bu koşullar sana bunlar üzerinde bir hak " +
            "vermez.",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 7. Caka'nın yetkileri
   * ---------------------------------------------------------------- */
  {
    id: "yetkilerimiz",
    heading: "7. Kaldırma, askıya alma ve sonlandırma",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Bu koşullara ya da hukuka aykırı bir durumda şu adımlardan " +
            "birini atabiliriz:",
        ],
      },
      {
        kind: "list",
        style: "bullet",
        items: [
          [
            { kind: "strong", text: "Tek bir içeriği veya bağlantıyı kaldırmak. " },
            "Sorun profilin tamamında değilse en dar müdahale budur.",
          ],
          [
            { kind: "strong", text: "Profili yayından kaldırmak. " },
            "Public sayfa erişime kapatılır; hesabın ve içeriğin durur.",
          ],
          [
            { kind: "strong", text: "Hesabı askıya almak. " },
            "Giriş yapabilir ama yayınlayamazsın.",
          ],
          [
            { kind: "strong", text: "Kullanıcı adını geri almak. " },
            "Ad kötüye kullanılıyorsa veya haklı bir marka talebi varsa.",
          ],
          [
            { kind: "strong", text: "Erişimi tümüyle sonlandırmak. " },
            "Ağır ya da tekrarlanan ihlallerde.",
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Ölçülülük gözetiriz: önce en dar önlemi alırız ve ",
          { kind: "strong", text: "mümkün olan her durumda seni önceden bilgilendiririz" },
          ". Bildirimi ancak gecikmenin ziyaretçilere zarar vereceği " +
            "hâllerde — kimlik avı, zararlı yazılım, çocuk istismarı " +
            "içeriği veya yetkili bir kurumun talebi gibi — işlemden sonraya " +
            "bırakırız.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Bir kararın yanlış olduğunu düşünüyorsan ",
          { kind: "strong", text: "hello@caka.app" },
          " adresine itiraz edebilirsin. İtirazını inceler ve yanıtlarız; " +
            "haksız bulduğumuz bir kaldırmayı geri alırız.",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 8. Bildirim ve kaldırma
   * ---------------------------------------------------------------- */
  {
    id: "bildirim-ve-kaldirma",
    heading: "8. İhlal bildirimi ve kaldırma süreci",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Bir Caka profilinde hukuka aykırı içerik, taklit, telif ihlali " +
            "veya kimlik avı gördüysen ",
          { kind: "strong", text: "hello@caka.app" },
          " adresine yaz. Bildirimini hızlı değerlendirebilmemiz için şunları " +
            "yazmanı rica ederiz:",
        ],
      },
      {
        kind: "list",
        style: "numbered",
        items: [
          ["Şikâyet ettiğin sayfanın tam adresi (caka.app/kullaniciadi)."],
          [
            "Sayfadaki hangi ögenin sorunlu olduğu — hangi bağlantı, hangi " +
              "görsel, hangi metin.",
          ],
          [
            "Sorunun ne olduğu ve hangi hukuki dayanakla aykırı olduğunu " +
              "düşündüğün.",
          ],
          [
            "Telif veya marka ihlali bildiriyorsan hak sahibi olduğunu ya da " +
              "hak sahibi adına hareket ettiğini gösteren bilgi.",
          ],
          [
            "Sana dönebileceğimiz bir iletişim adresi.",
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Sonrasında ne olur. " },
          "Bildirimi ",
          { kind: "strong", text: "gecikmeksizin" },
          " inceleriz. Açıkça hukuka aykırı ve gecikmeye tahammülü olmayan " +
            "durumlarda içeriği hemen erişime kapatırız; diğer hâllerde önce " +
            "profil sahibine yazar ve yanıt için makul bir süre veririz. " +
            "Kararımızı hem sana hem profil sahibine bildiririz. Profil " +
            "sahibi karara itiraz edebilir. Belirli bir yanıt süresi " +
            "taahhüt etmiyoruz; nedenini ",
          {
            kind: "link",
            text: "9. bölümde",
            href: "#yer-saglayici",
          },
          " yazdık.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Bildirim yolunu kötüye kullanma. Rakibinin profilini kapatmak " +
            "için asılsız ihlal bildirimi göndermek de bu koşulların " +
            "ihlalidir.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Bir profilde ",
          { kind: "strong", text: "kendi kişisel verinin" },
          " izinsiz yayınlandığını düşünüyorsan bunu bir ihlal bildirimi " +
            "olarak yukarıdaki adrese iletebilirsin; KVKK kapsamındaki " +
            "haklarını ise ",
          {
            kind: "link",
            text: "İlgili kişi hakların",
            href: "/gizlilik#ilgili-kisi-haklari",
          },
          " bölümündeki başvuru yoluyla kullanırsın.",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 9. Yer sağlayıcılık — 5651
   * ---------------------------------------------------------------- */
  {
    id: "yer-saglayici",
    heading: "9. Yer sağlayıcı sıfatımız ve 5651 sayılı Kanun",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Caka, kullanıcıların hazırladığı sayfaları barındırıp yayınladığı " +
            "için 5651 sayılı Kanun m.2/1-(m) anlamında bir ",
          { kind: "strong", text: "yer sağlayıcıdır" },
          ". Bu sıfat bir ölçek ya da ticarilik eşiğine bağlı değildir: " +
            "hizmet ücretsiz olsa ve arkasında bir şirket bulunmasa da yer " +
            "sağlayıcıyız. Sitenin kendi sayfaları — ana sayfa ve bu hukuki " +
            "metinler — bakımından ise aynı anda içerik sağlayıcıyız; orada " +
            "yazanı biz yazıyoruz ve ondan biz sorumluyuz.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "İçeriği önceden denetlemiyoruz. " },
          "Kanun m.5/1, yer sağlayıcıya barındırdığı içeriği kontrol etme ve " +
            "hukuka aykırı bir durum olup olmadığını araştırma yükümlülüğü " +
            "getirmez. Caka'da da her profili yayından önce okuyan bir " +
            "moderasyon süreci yoktur; yayınla dediğin an içerik doğrudan " +
            "canlıya çıkar. Bir sayfayı barındırmak, orada yazanı onaylamak " +
            "anlamına gelmez.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Bize bildirilen içerik. " },
          "Barındırdığımız bir içeriğin hukuka aykırı olduğu bildirildiğinde, " +
            "teknik olarak mümkün olduğu ölçüde ve ",
          { kind: "strong", text: "gecikmeksizin" },
          " kaldırırız. Burada bir yanıt süresi taahhüt etmiyoruz; sebebini " +
            "de yazalım. Kaldırma için 24 saatlik süre öngören 5651 m.9, " +
            "Anayasa Mahkemesi'nin 11/10/2023 tarihli, E.2020/76 K.2023/172 " +
            "sayılı kararıyla ",
          { kind: "strong", text: "tümüyle iptal edildi" },
          " (Resmî Gazete 10.01.2024, sayı 32425; iptal 10.10.2024'te " +
            "yürürlüğe girdi) ve yerine bir süre konmadı. Yürürlükte olmayan " +
            "bir süreyi metne yazmak, tutamayacağımız bir borcu kendi " +
            "elimizle yaratmak olurdu; tek kişilik bir projede bu, kimseye " +
            "fayda sağlamayan bir vaat olur.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Resmî talepler: dört saat. " },
          "Buna karşılık kanunun bize yüklediği somut bir süre vardır. " +
            "m.8/5 ve m.8/A/1 uyarınca bir ",
          { kind: "strong", text: "hâkim, savcı veya Siber Güvenlik Başkanlığı" },
          " tarafından verilen erişim engelleme ya da içerik kaldırma " +
            "kararını ",
          { kind: "strong", text: "derhâl ve en geç dört saat içinde" },
          " yerine getiririz. Bu, bizim verdiğimiz bir taahhüt değil, " +
            "kanunun koyduğu süredir.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Bildirimini nereye gönderirsin. " },
          "Bildirimlerini ",
          { kind: "strong", text: "hello@caka.app" },
          " adresine yaz. Bir bildirimin işleme alınabilmesi için şikâyet " +
            "edilen sayfanın tam adresini, sayfadaki hangi ögenin sorunlu " +
            "olduğunu, hangi hukuki dayanakla aykırı olduğunu düşündüğünü ve " +
            "kim olduğunu içermesi gerekir. Bu dördünü ve bildirimin " +
            "ardından işleyen süreci ",
          {
            kind: "link",
            text: "8. bölümde",
            href: "#bildirim-ve-kaldirma",
          },
          " ayrıntılı yazdık. Eksik bir bildirim üzerine hareket " +
            "edemeyebiliriz.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "5651'e bağlı Yönetmelik'in ana sayfada ad, adres, telefon ve " +
            "vergi/TC kimlik numarası gösterilmesini isteyen tanıtıcı bilgi " +
            "yükümlülüğü, ",
          { kind: "strong", text: "ticari veya ekonomik amaçlı" },
          " yer sağlayıcılar içindir. Caka bugün ücretsiz olduğu ve bir gelir " +
            "elde etmediği için bu yükümlülük doğmuyor; hizmet ticarileşirse " +
            "devreye girer ve bu bölüm o zaman güncellenir.",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 10. Üçüncü taraf servisleri ve dış bağlantılar
   * ---------------------------------------------------------------- */
  {
    id: "dis-baglantilar",
    heading: "10. Dış bağlantılar ve üçüncü taraf servisleri",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Caka'nın işi, senin seçtiğin bağlantıları tek bir sayfada " +
            "toplamak ve o sayfayı yayınlamaktır. Bir ziyaretçi profilindeki " +
            "bağlantıya tıkladığında Caka'dan ayrılır ve başka bir şirketin " +
            "sitesine gider. O andan itibaren orada olan biten — sayfanın " +
            "içeriği, satılan ürün, alınan ödeme, istenen bilgi — o sitenin " +
            "ve seni oraya yönlendiren profil sahibinin işidir. ",
          { kind: "strong", text: "Caka o ilişkinin tarafı değildir" },
          ": ne satıcıdır, ne aracıdır, ne de ödeme kuruluşu.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Bunu bir sorumluluk reddi olarak değil, hizmetin ne olduğunun " +
            "tarifi olarak yazıyoruz. Bağlantıların hedefini biz seçmiyoruz " +
            "ve o siteleri sürekli denetleyecek bir düzeneğimiz yok; bu " +
            "yüzden bir dış sitenin içeriğini onaylamış ya da güvenilir " +
            "bulmuş sayılmayız. Buna karşılık bir bağlantının zararlı " +
            "olduğu bize bildirilirse ",
          {
            kind: "link",
            text: "kaldırma yetkimizi",
            href: "#yetkilerimiz",
          },
          " kullanırız — sorumsuz olduğumuzu değil, elimizde bu aracın " +
            "olduğunu söylüyoruz.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Bir dış siteye gitmeden önce. " },
          "Adres çubuğundaki alan adına bak, ödeme yapıyorsan sitenin " +
            "kimliğini doğrula ve giriş bilgilerini yalnızca gerçekten o " +
            "servise ait olduğundan emin olduğun sayfaya yaz. Profil " +
            "sahiplerinden de bağlantılarını güncel tutmalarını bekliyoruz: " +
            "süresi dolmuş bir alan adı başkasının eline geçebilir.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Sayfanın kendiliğinden konuştuğu servisler. " },
          "Caka'yı çalıştırmak için kullandığımız üçüncü taraf servisleri de " +
            "vardır: girişte Google ve Apple, yazı tipleri için bir font " +
            "servisi, katkı grafiği için GitHub ve barındırma için " +
            "Cloudflare. Profillerdeki bağlantı önizleme görselleri ise " +
            "uzak siteden bizim sunucumuz tarafından çekilir; tarayıcın o " +
            "siteye istek atmaz. Bunların dışında bir de yalnızca senin " +
            "başlattığın bağlantılar var: bir YouTube ya da Spotify kartında " +
            "oynat düğmesine basarsan oynatıcı o anda yüklenir ve tarayıcın " +
            "doğrudan o platforma bağlanır. Bu isteklerde hangi verinin " +
            "kime ulaştığını ",
          {
            kind: "link",
            text: "Aktarım ve tedarikçiler",
            href: "/gizlilik#aktarim-ve-tedarikciler",
          },
          " bölümünde tek tek yazdık.",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 11. Hizmet sürekliliği ve sorumluluk
   * ---------------------------------------------------------------- */
  {
    id: "hizmet-surekliligi",
    heading: "11. Hizmetin sürekliliği ve sorumluluk",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Caka'yı kesintisiz çalıştırmaya çalışırız, ama kesintisizlik " +
            "taahhüt etmiyoruz. Bakım, altyapı sağlayıcısındaki arıza, " +
            "saldırı veya bizim yaptığımız bir hata yüzünden hizmet geçici " +
            "olarak erişilemez olabilir. Planlı bakımları mümkün olduğunca " +
            "önceden duyururuz.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Ürünü geliştirdikçe özellikler değişir: yeni blok türleri " +
            "eklenebilir, mevcut bir özellik değişebilir veya kaldırılabilir. " +
            "Yayınladığın içeriği doğrudan etkileyen bir kaldırma yaparsak " +
            "bunu önceden duyurur ve makul bir geçiş süresi tanırız.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Yedek almak senin de işine gelir. " },
          "Bugün panelde içeriğini tek tıkla dışa aktaracak bir düğme yok. " +
            "Uzun emek verdiğin bir metni yalnızca Caka'da tutmamanı, kendi " +
            "kopyanı da saklamanı öneririz.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Sorumluluk: burada bir tavan yok. " },
          "Bu bölümde sorumluluğumuzu bir para sınırına bağlamıyoruz ve " +
            "“dolaylı zararlardan sorumlu değiliz” gibi bir cümle " +
            "yazmıyoruz. Sebebi basit: tüketici sözleşmelerinde böyle " +
            "kayıtlar geçersizdir. Tüketici Sözleşmelerindeki Haksız Şartlar " +
            "Hakkında Yönetmelik EK-1 (1)(a), sözleşmeyi düzenleyenin kendi " +
            "eylem veya ihmaliyle yol açtığı ölüm, yaralanma ve maddi zarar " +
            "bakımından sorumluluğunu kaldıran ya da ",
          { kind: "strong", text: "sınırlayan" },
          " şartları haksız sayar — parayla ifade edilmiş bir üst sınır da " +
            "bu kapsamdadır. EK-1 (1)(b) tüketicinin başvurabileceği hukuki " +
            "yolları kaldıran veya ölçüsüzce kısıtlayan şartları, TBK m.115/1 " +
            "ise kasıt ve ağır ihmal için baştan konulan sorumsuzluk kaydını " +
            "geçersiz kılar. Geçersiz bir şart yazıp sana geçerliymiş gibi " +
            "göstermektense, gerçekten geçerli olanı yazmayı seçtik.",
        ],
      },
      {
        kind: "paragraph",
        text: ["Geçerli olan çerçeve şudur:"],
      },
      {
        kind: "list",
        style: "bullet",
        items: [
          [
            { kind: "strong", text: "Hizmetin kapsamı. " },
            "Caka, senin yazdığın içeriği barındıran ve yayınlayan bir sayfa " +
              "hizmetidir. Kesintisiz erişilebilirlik, belirli bir hız, " +
              "arama motorlarında görünürlük veya belirli bir ziyaretçi " +
              "sayısı taahhüt etmiyoruz. Profiline eklediğin bağlantıların " +
              "gittiği siteleri de biz seçmiyor ve denetlemiyoruz; oradaki " +
              "içerikten ve orada olan bitenden sorumlu değiliz.",
          ],
          [
            { kind: "strong", text: "Hizmet ücretsizdir ve bu hukuken önemlidir. " },
            "Caka'dan hiçbir ücret almıyoruz ve bu kullanımdan bir gelir " +
              "elde etmiyoruz. TBK m.114/1'in son cümlesi şöyle der: “İş " +
              "özellikle borçlu için bir yarar sağlamıyorsa, sorumluluk daha " +
              "hafif olarak değerlendirilir.” Yani ücretsizlik, bizim " +
              "koyduğumuz bir sınır değil, kanunun kendisinin öngördüğü bir " +
              "ölçüdür ve özen borcumuzun değerlendirilmesinde dikkate " +
              "alınır. Ücretli bir plan sunduğumuz gün bu ölçü de ortadan " +
              "kalkar.",
          ],
          [
            { kind: "strong", text: "Yardımcı kişilerin fiilleri. " },
            "TBK m.116/2, yardımcı kişilerin fiillerinden doğan sorumluluğun " +
              "önceden kaldırılmasına izin verir. Hizmeti çalıştırmak için " +
              "kullandığımız üçüncü tarafların — barındırma sağlayıcısı, " +
              "kimlik sağlayıcıları, içerik dağıtım ağı — kendi fiillerinden " +
              "doğan sorumluluğu bu hükme dayanarak ",
            { kind: "strong", text: "önceden kaldırıyoruz" },
            ". Bir altyapı sağlayıcısındaki kesinti, arıza veya veri kaybı " +
              "için bize karşı talepte bulunulamaz. Bu tarafları seçerken " +
              "veya gözetirken kendi kusurumuz bunun dışındadır.",
          ],
          [
            { kind: "strong", text: "Senin yükümlülüklerin. " },
            "Profilindeki içeriğin hukuka uygunluğu sana aittir; ayrıntısı " +
              "4. bölümdedir. Üçüncü bir kişi profilindeki bir içerik " +
              "nedeniyle bize talep yöneltirse, o talebin sorumluluğu " +
              "içeriği koyan kişidedir.",
          ],
          [
            { kind: "strong", text: "Üçüncü kişilerin fiilleri ve mücbir sebep. " },
            "Saldırı, kötüye kullanım, yetkili bir merciin erişim engeli, " +
              "elektrik ve iletişim altyapısındaki arıza gibi denetimimiz " +
              "dışındaki olaylardan doğan kesintilerden sorumlu " +
              "tutulamayız.",
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Hiçbir hâlde sınırlanmayanlar. " },
          "Yukarıdakilerin hiçbiri şunlara dokunmaz: kastımızdan veya ağır " +
            "ihmalimizden doğan sorumluluk, ölüm ve bedensel zarardan doğan " +
            "sorumluluk ve tüketici mevzuatının emredici hükümlerinin sana " +
            "tanıdığı haklar. 6502 sayılı Kanun m.5/2 uyarınca bu " +
            "koşullardaki bir şart haksız sayılırsa yalnızca o şart " +
            "hükümsüz olur, sözleşmenin geri kalanı geçerliliğini korur. " +
            "m.5/3 uyarınca bu koşulların tek taraflı hazırlandığı ve " +
            "seninle ayrıca müzakere edilmediği kabul edilir; aksini ileri " +
            "sürmek isteyen taraf bunu ispatla yükümlüdür ve o taraf biziz.",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 12. Ücretlendirme
   * ---------------------------------------------------------------- */
  {
    id: "ucretlendirme",
    heading: "12. Ücretlendirme",
    blocks: [
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Caka'da bugün ücretli bir plan yoktur. " },
          "Ücret alınmıyor, ödeme bilgisi istenmiyor ve üründe bir ödeme " +
            "akışı bulunmuyor. Bu yüzden bu bölümde abonelik, fatura, iade " +
            "veya cayma koşulu yazmıyoruz: olmayan bir hizmetin koşullarını " +
            "yazmak metni gerçeğe aykırı hâle getirirdi.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Hizmet tamamen ücretsizdir; platform üzerinden mal veya hizmet " +
            "satışı, sözleşme kurulması ya da sipariş verilmesi mümkün " +
            "değildir.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "İleride ücretli bir plan sunarsak fiyatı, kapsamı, ödeme ve iade " +
            "koşulları ayrı bir metinde yazılır ve yürürlüğe girmeden önce " +
            "sana bildirilir. Ücretli bir plana geçmek her zaman senin ayrı " +
            "ve açık tercihinle olur; bugün kullandığın hesap kendiliğinden " +
            "ücretli hâle gelmez.",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 13. Hesap kapatma ve veri silme
   * ---------------------------------------------------------------- */
  {
    id: "hesap-kapatma",
    heading: "13. Hesabını kapatmak",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Hesabını istediğin zaman kapatabilirsin. ",
          { kind: "strong", text: "Bugün bunu panelden tek tıkla yapamıyorsun" },
          " — hesap silme düğmesi henüz yok. Bunu olduğu gibi yazıyoruz, " +
            "çünkü olmayan bir özelliği varmış gibi anlatmak istemiyoruz.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Kapatma talebini, hesabına kayıtlı e-posta adresinden yazarak " +
            "iletirsin. Nereye yazacağın ve başvurunun nasıl işlediği ",
          {
            kind: "link",
            text: "İlgili kişi hakların ve başvuru yolu",
            href: "/gizlilik#ilgili-kisi-haklari",
          },
          " bölümünde anlatılıyor. Talebi başkası adına yapılmış bir " +
            "kapatmaya karşı korumak için kimliğini doğrulamamız gerekebilir.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Kapatınca ne olur. " },
          "Public profilin yayından kalkar ve caka.app/kullaniciadi adresi " +
            "çalışmaz. Hesap verin, profil içeriğin, yüklediğin dosyalar ve " +
            "oturum kayıtların silinir. Silme işlemi geri alınamaz; aynı " +
            "kullanıcı adını sonradan yeniden alabileceğinin garantisi yoktur.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Bir hukuki yükümlülük nedeniyle saklanması gereken kayıtlar, " +
            "hesabın kapatılmasından sonra da mevzuatın öngördüğü süre " +
            "boyunca saklanabilir. Hangi verinin ne kadar tutulduğunu ",
          {
            kind: "link",
            text: "Saklama süreleri",
            href: "/gizlilik#saklama-sureleri",
          },
          " bölümünde bulabilirsin.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Biz de bu koşulların ağır ihlali hâlinde hesabını " +
            "sonlandırabiliriz; bunun nasıl işlediği ",
          { kind: "link", text: "7. bölümde", href: "#yetkilerimiz" },
          " yazıyor.",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 14. Uygulanacak hukuk ve uyuşmazlık
   * ---------------------------------------------------------------- */
  {
    id: "uygulanacak-hukuk",
    heading: "14. Uygulanacak hukuk ve uyuşmazlık çözümü",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Bu koşullara ve Caka'nın kullanımına ",
          { kind: "strong", text: "Türk hukuku" },
          " uygulanır.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Yetkili mahkemeyi burada seçmiyoruz. " },
          "Bu bir eksiklik değil, bilinçli bir tercih. HMK m.17'ye göre " +
            "yetki sözleşmesi yalnızca tacirler veya kamu tüzel kişileri " +
            "arasında yapılabilir; bir tüketiciye karşı sözleşmeye konulan " +
            "“şu ilin mahkemeleri yetkilidir” kaydı geçersizdir. Haksız " +
            "Şartlar Yönetmeliği EK-1 (1)(n) aynı kaydı ikinci kez sakatlar: " +
            "tüketicinin mahkemeye başvurma hakkını kısıtlayan, onu kanunda " +
            "öngörülmeyen bir tahkime zorlayan veya ispat yükünü ters " +
            "çeviren şartlar haksız şart sayılır. Böyle bir kayıt yazsaydık " +
            "Ticaret Bakanlığı, Yönetmelik m.8 uyarınca 30 gün içinde " +
            "kaldırılmasını isteyebilir; kaldırılmazsa 6502 m.77 uyarınca " +
            "sözleşme başına idari para cezası uygulanabilirdi.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Nereye başvurursun. " },
          "Tüketici uyuşmazlıklarında görevli merciler kanunla belirlenmiştir " +
            "ve bu görev kesindir (6502 m.73/1). Tüketici hakem " +
            "heyetlerinin parasal sınırı ",
          { kind: "strong", text: "2026 yılı için 186.000 TL'dir" },
          " (23.12.2025 tarihli ve 33116 sayılı Resmî Gazete; 1 Ocak 2026'da " +
            "yürürlüğe girdi). Bu tutar her yıl aralık ayında Ticaret " +
            "Bakanlığı tebliğiyle yeniden belirlenir, yani ",
          {
            kind: "strong",
            text: "yukarıdaki rakam 2026'ya aittir ve her ocakta değişir",
          },
          "; güncel tutarı Bakanlığın son tebliğinden doğrulayabilirsin. " +
            "Sınırın altındaki uyuşmazlıklarda tüketici hakem heyetine " +
            "başvurmak zorunludur (m.68/1); üstündeki uyuşmazlıklarda ise " +
            "hakem heyetine başvurulamaz, doğrudan tüketici mahkemesine " +
            "gidilir. Tüketici mahkemesinde görülecek uyuşmazlıklarda dava " +
            "açmadan önce arabulucuya başvurmak dava şartıdır (m.73/A); " +
            "hakem heyetinin görev alanındaki uyuşmazlıklar bunun " +
            "dışındadır.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Kendi yerleşim yerinde de başvurabilirsin. " },
          "6502 m.73/5, tüketicinin davasını kendi yerleşim yerindeki " +
            "mahkemede ",
          { kind: "strong", text: "de" },
          " açabileceğini söyler. Buradaki “de” önemli: bu, genel yetkili " +
            "mahkemelere eklenen bir seçenektir, onların yerine geçen bir " +
            "zorunluluk değil. Seçim senin.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Kişisel verilere ilişkin şikâyetlerini Kişisel Verileri Koruma " +
            "Kurumu'na iletme hakkın bu metinden etkilenmez.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Bu koşulların bir hükmü geçersiz sayılırsa diğer hükümler " +
            "yürürlükte kalır.",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 15. Değişiklikler ve iletişim
   * ---------------------------------------------------------------- */
  {
    id: "degisiklikler-ve-iletisim",
    heading: "15. Değişiklikler ve iletişim",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Ürün değiştikçe bu koşullar da değişir: yeni bir özellik " +
            "eklendiğinde, bir kural netleştiğinde veya mevzuat " +
            "değiştiğinde metni güncelleriz.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Her güncellemede sayfanın başındaki sürüm numarası artar ve son " +
            "güncelleme tarihi yenilenir. Üç hukuki belgenin sürümleri " +
            "birbirinden bağımsızdır: yalnızca değişen belgenin tarihi oynar. " +
            "Haklarını veya yükümlülüklerini esaslı biçimde etkileyen bir " +
            "değişiklik olursa hesabı olan kullanıcıları ayrıca " +
            "bilgilendiririz. Değişiklikten sonra hizmeti kullanmaya devam " +
            "edersen yeni sürümü kabul etmiş olursun; kabul etmiyorsan " +
            "hesabını kapatabilirsin.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Bize nasıl ulaşırsın. " },
          "İçerik ihlali bildirimleri, kaldırma itirazları ve bu koşullara " +
            "ilişkin sorular için ",
          { kind: "strong", text: "hello@caka.app" },
          " adresine yazabilirsin. Kişisel verilerinle ilgili başvurular " +
            "için ",
          {
            kind: "link",
            text: "Gizlilik ve Aydınlatma Metni'ndeki başvuru yolu",
            href: "/gizlilik#ilgili-kisi-haklari",
          },
          " geçerlidir.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Bu metinle birlikte ",
          { kind: "link", text: "Gizlilik ve Aydınlatma Metni", href: "/gizlilik" },
          " ve ",
          { kind: "link", text: "Çerez Politikası", href: "/cerez-politikasi" },
          " sayfalarını da okumanı öneririz.",
        ],
      },
    ],
  },
];
