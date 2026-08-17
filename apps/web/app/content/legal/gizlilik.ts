// U17 — Aydınlatma ve Gizlilik Metni (KVKK m.10 + Aydınlatma Tebliği m.5).
//
// Metin repodaki gerçek veri akışından yazıldı: şema `packages/db/src/schema.ts`
// ve `auth-schema.ts`, çerezler `packages/shared/src/cookies.ts`, font isteği
// `app/root.tsx`, katkı grafiği önbelleği `server/github.ts`, log ayarı
// `wrangler.jsonc` (`observability.enabled: true`).
//
// Köşeli parantezli her alan doğrulanmamış olgudur ve R33 kapısını tetikler:
// doldurulmadan belge prod'da 404 döner. Köşeli parantez metinde başka hiçbir
// amaçla kullanılmaz — parantez gerektiğinde normal parantez yazılır.
import type { LegalSection } from "@caka/shared";

export const gizlilikSections: LegalSection[] = [
  /* ---------------------------------------------------------------- *
   * 1. Veri sorumlusu
   * ---------------------------------------------------------------- */
  {
    id: "veri-sorumlusu",
    heading: "1. Veri sorumlusu ve iletişim",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Bu metin, Caka'yı (caka.app) kullanırken kişisel verilerinin nasıl " +
            "işlendiğini anlatır. Caka bir şirket değil, ",
          { kind: "strong", text: "açık kaynaklı kişisel bir projedir" },
          ". Siteyi caka.app olarak işletiyoruz; verinin hangi amaçla ve nasıl " +
            "işleneceğine karar veren de biziz. 6698 sayılı Kişisel Verilerin " +
            "Korunması Kanunu (KVKK) anlamında veri sorumlusu sıfatı buradan " +
            "doğar ve bu metindeki taahhütlerin muhatabı biziz.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Eksik olanı da olduğu gibi yazalım. " },
          "KVKK m.10, veri sorumlusunun ",
          { kind: "strong", text: "kimliğinin" },
          " bildirilmesini ister; bir alan adı ise ne gerçek ne de tüzel " +
            "kişidir. Caka'nın arkasında bugün kurulmuş bir tüzel kişilik yok, " +
            "ticari bir faaliyet ve buna bağlı bir sicil kaydı da yok. Bu " +
            "yüzden aşağıda bir unvan, vergi veya MERSİS numarası " +
            "göremezsin: olmayan bir şirketin bilgisini uydurmaktansa eksiği " +
            "söylemeyi seçtik. Yani bu bölüm, m.10'daki kimlik bilgisini " +
            "bugün karşılamıyor; ürün ticarileştiğinde ve bir tüzel kişilik " +
            "kurulduğunda burası o bilgiyle güncellenecektir. Bu arada " +
            "başvurularının düşeceği kutu gerçek ve okunuyor.",
        ],
      },
      {
        kind: "table",
        columns: ["Bilgi", "Değer"],
        rows: [
          [["Siteyi işleten"], ["caka.app — açık kaynaklı kişisel proje"]],
          [["İletişim ve KVKK başvuru adresi"], ["hello@caka.app"]],
          [["Web sitesi"], ["caka.app"]],
        ],
        caption:
          "Caka'ya ulaşmanın tek yolu bu e-posta adresidir; ilgili kişi " +
          "başvuruları da aynı kutuya düşer. Posta adresi yayınlamıyoruz, " +
          "çünkü ortada bir işyeri değil kişisel bir ev adresi olurdu.",
      },
      {
        kind: "paragraph",
        text: [
          "Bu metnin hangi sürümü okuduğunu sayfanın başındaki sürüm ve son " +
            "güncelleme tarihinden görebilirsin. Değişiklik yaptığımızda ne " +
            "olduğunu ",
          { kind: "link", text: "Değişiklikler", href: "#degisiklikler" },
          " bölümünde anlatıyoruz.",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 2. Kapsam
   * ---------------------------------------------------------------- */
  {
    id: "kapsam",
    heading: "2. Kapsam",
    blocks: [
      { kind: "paragraph", text: ["Bu metin şu yüzeyleri kapsar:"] },
      {
        kind: "list",
        style: "bullet",
        items: [
          [
            { kind: "strong", text: "caka.app tanıtım sitesi" },
            " — ana sayfa ve bu hukuki sayfalar dâhil, giriş yapmadan " +
              "gezilebilen tüm sayfalar.",
          ],
          [
            { kind: "strong", text: "Hesap ve panel" },
            " — giriş, profil editörü, ayarlar ve dosya yükleme.",
          ],
          [
            { kind: "strong", text: "Public Caka profilleri" },
            " — caka.app/kullaniciadi adresinde herkese açık yayınlanan " +
              "profil sayfaları; bu sayfaları ziyaret eden, hesabı olmayan " +
              "kişiler de kapsam içindedir.",
          ],
          [
            { kind: "strong", text: "Destek yazışmaları" },
            " — bize e-posta ile ilettiğin talepler.",
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Bir profildeki bağlantıya tıklayıp başka bir siteye gittiğinde " +
            "artık o sitenin kendi gizlilik politikası geçerlidir; Caka'nın " +
            "bu metni orada geçerli değildir.",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 3. İşlenen veriler
   * ---------------------------------------------------------------- */
  {
    id: "islenen-veriler",
    heading: "3. İşlenen kişisel veri kategorileri",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Aşağıdaki tablo, Caka'nın gerçekten tuttuğu verileri gösterir. " +
            "Parantez içindeki adlar veritabanındaki tabloların adlarıdır; " +
            "bunları, sonradan eklenen bir alanın sessizce listeden düşmemesi " +
            "için yazıyoruz.",
        ],
      },
      {
        kind: "table",
        columns: ["Kategori", "İçerdiği veriler", "Kaynağı"],
        rows: [
          [
            ["Hesap verisi (user)"],
            [
              "Ad, e-posta adresi, e-posta doğrulama durumu, profil görseli " +
                "adresi, hesabın oluşturulma ve güncellenme zamanı.",
            ],
            ["Google veya Apple hesabından dönen bilgi."],
          ],
          [
            ["Kimlik sağlayıcı verisi (account)"],
            [
              "Sağlayıcı adı (Google veya Apple), o sağlayıcıdaki hesap " +
                "kimliğin, erişim ve yenileme token'ları, kimlik token'ı, " +
                "token geçerlilik süreleri ve verilen izin kapsamı.",
            ],
            ["Girişte kimlik sağlayıcısı."],
          ],
          [
            ["Oturum verisi (session)"],
            [
              "Oturum kimliği ve oturum token'ı, ",
              { kind: "strong", text: "IP adresi" },
              " ve ",
              { kind: "strong", text: "User Agent" },
              " (tarayıcı ve işletim sistemi bilgisi), oturumun " +
                "oluşturulma ve sona erme zamanı.",
            ],
            ["Giriş yaptığında otomatik olarak."],
          ],
          [
            ["Profil içeriği (profile)"],
            [
              "Kullanıcı adın, tema tercihin, paylaşım görseli tercihlerin ve " +
                "profil düzeninin tamamı: profil kartındaki ad ile kısa " +
                "tanıtım yazısı, bağlantı blokları (başlık ve adres), sosyal " +
                "hesap blokları (platform, kullanıcı adı, adres ve o " +
                "bağlantının önizleme görselinin adresi), metin ve durum " +
                "bloklarındaki zengin metin, görsel blokları. Ayrıca " +
                "yayınlamadığın taslak düzenin ve ilk kurulumda verdiğin " +
                "yanıtlar.",
            ],
            ["Doğrudan senin girdin."],
          ],
          [
            ["Yüklenen dosyalar (asset ve R2 deposu)"],
            [
              "Yüklediğin görseller ile bu dosyaların türü, boyutu ve " +
                "yüklenme zamanı.",
            ],
            [
              "Doğrudan senin yüklemen. Ayrıca Google ile ilk kez giriş " +
                "yaptığında, Google'daki profil fotoğrafın bir kez bizim " +
                "dosya depomuza kopyalanır; böylece sayfan her açıldığında " +
                "tarayıcın Google'a istek atmak zorunda kalmaz.",
            ],
          ],
          [
            ["Adres değişikliği kaydı (username_redirect)"],
            [
              "Kullanıcı adını değiştirdiğinde eski adın, hangi profile ait " +
                "olduğu ve kaydın sona erme zamanı.",
            ],
            ["Adres değiştirdiğinde otomatik olarak."],
          ],
          [
            ["GitHub katkı grafiği önbelleği (github_calendar)"],
            [
              "Bir profilde gösterilmek üzere eklenen GitHub kullanıcı adı ve " +
                "o hesabın herkese açık katkı takvimi verisi.",
            ],
            ["GitHub'ın public arayüzünden, sunucumuz tarafından."],
          ],
          [
            ["Operasyon kayıtları (Cloudflare Workers Logs)"],
            [
              "Sunucu tarafı çalışma kayıtları: istenen adres, yanıt kodu, " +
                "süre ve hata ayrıntıları. Bu kayıtların içeriğini tümüyle " +
                "biz belirlemiyoruz; isteğe ilişkin teknik veriler de " +
                "içerebilirler.",
            ],
            ["Otomatik olarak, her istekte."],
          ],
          [
            ["Destek yazışmaları"],
            [
              "Bize yazdığın e-postanın içeriği, e-posta adresin ve varsa " +
                "eklerin.",
            ],
            ["Doğrudan senin gönderin."],
          ],
          [
            ["Çerezsiz ziyaret istatistikleri"],
            [
              "Sayfa görüntülenme sayısı, yönlendiren adres, ülke, tarayıcı " +
                "ve cihaz türü gibi toplu veriler. Bu ölçüm için cihazına " +
                "hiçbir şey yazılmaz ve cihazından hiçbir şey okunmaz.",
            ],
            ["Otomatik olarak, sayfa görüntülendiğinde."],
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "GitHub katkı grafiği hakkında bir uyarı: " },
          "Bu önbelleğin anahtarı, profilde gösterilmek üzere eklenen GitHub " +
            "kullanıcı adıdır ve ",
          {
            kind: "strong",
            text: "bu hesap profil sahibine ait olmayabilir",
          },
          ". Yani Caka, hiç Caka hesabı olmayan bir kişinin herkese açık " +
            "katkı verisini işliyor olabilir. Bu kişiler de silme talep " +
            "edebilir; nasıl yapılacağı ",
          {
            kind: "link",
            text: "İlgili kişi hakların",
            href: "#ilgili-kisi-haklari",
          },
          " bölümünde yazıyor.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Profil içeriğini sen yazıyorsun ve yayınladığında herkese açık " +
            "oluyor. Oraya yazdığın her şey — bir telefon numarası, bir " +
            "adres, sağlık veya inanç bilgisi — internetteki herkes " +
            "tarafından görülebilir. Caka senden özel nitelikli kişisel veri " +
            "(KVKK m.6) istemez ve toplamaz; böyle bir bilgiyi profiline " +
            "kendin yazarsan onu kendi isteğinle alenileştirmiş olursun.",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 4. Amaçlar ve hukuki sebepler
   * ---------------------------------------------------------------- */
  {
    id: "amaclar-ve-hukuki-sebepler",
    heading: "4. İşleme amaçları ve hukuki sebepler",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Her işleme amacının KVKK m.5'teki bir hukuki sebebe dayanması " +
            "gerekir. Aşağıda her amaç için dayandığımız bendi tek tek " +
            "yazdık.",
        ],
      },
      {
        kind: "table",
        columns: ["Amaç", "Hukuki sebep (KVKK m.5)"],
        rows: [
          [
            [
              "Hesabının açılması, Google veya Apple ile kimlik doğrulaması ve " +
                "oturumunun sürdürülmesi.",
            ],
            [
              "m.5/2-c — sözleşmenin kurulması veya ifasıyla doğrudan doğruya " +
                "ilgili olması.",
            ],
          ],
          [
            [
              "Public profilinin yayınlanması: profil düzeninin, " +
                "bağlantıların, metinlerin ve görsellerin ziyaretçilere " +
                "gösterilmesi.",
            ],
            ["m.5/2-c — sözleşmenin ifası."],
          ],
          [
            [
              "Yüklediğin dosyaların saklanması ve profil sayfasında " +
                "sunulması.",
            ],
            ["m.5/2-c — sözleşmenin ifası."],
          ],
          [
            [
              "Kullanıcı adını değiştirdiğinde eski adresin bir süre " +
                "yönlendirilmesi, böylece paylaştığın bağlantıların kırılmaması.",
            ],
            [
              "m.5/2-f — meşru menfaat: hem senin hem ziyaretçinin kırık " +
                "bağlantıyla karşılaşmaması.",
            ],
          ],
          [
            [
              "Güvenlik, kötüye kullanımın ve dolandırıcılığın önlenmesi, hata " +
                "ayıklama ve hizmetin ayakta tutulması.",
            ],
            [
              "m.5/2-f — meşru menfaat: hizmetin ve kullanıcıların " +
                "güvenliğinin korunması.",
            ],
          ],
          [
            ["Destek taleplerinin yanıtlanması."],
            [
              "Talep hesabınla ilgiliyse m.5/2-c (sözleşmenin ifası); değilse " +
                "m.5/2-f (meşru menfaat: soruların yanıtlanması).",
            ],
          ],
          [
            [
              "Yasal yükümlülüklerin yerine getirilmesi ve yetkili kurum " +
                "taleplerinin karşılanması.",
            ],
            [
              "m.5/2-ç — veri sorumlusunun hukuki yükümlülüğünü yerine " +
                "getirebilmesi; hakkın tesisi, kullanılması veya korunması " +
                "gereken hâllerde m.5/2-e.",
            ],
          ],
          [
            [
              "Profilde gösterilecek GitHub hesabının katkı grafiğinin " +
                "önbelleklenmesi. Önbellek 6 saat taze sayılır ve sonra " +
                "yeniden çekilir; GitHub'da böyle bir kullanıcı bulunamazsa " +
                "olumsuz sonuç 24 saat saklanır.",
            ],
            [
              "m.5/2-f — meşru menfaat: aynı veriyi her ziyarette yeniden " +
                "istemek hem GitHub'a hem sayfanın hızına gereksiz yük olur.",
            ],
          ],
          [
            [
              "Çerezsiz ziyaret istatistikleriyle hangi sayfaların " +
                "kullanıldığının ölçülmesi.",
            ],
            [
              "m.5/2-f — meşru menfaat: ürünün geliştirilmesi. Ölçüm cihazına " +
                "hiçbir şey yazmadığı için rıza gerekmez; ancak rıza " +
                "gerekmemesi işlemeyi hukuki sebepten muaf tutmaz, sebep " +
                "budur.",
            ],
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Senden toplu ve genel bir ",
          {
            kind: "strong",
            text: "“kişisel verilerimin işlenmesini kabul ediyorum”",
          },
          " onayı istemiyoruz. Böyle bir onay geçerli bir rıza sayılmaz; " +
            "yukarıdaki işlemelerin hepsi sayılan hukuki sebeplere dayanır.",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 5. Toplama yöntemi
   * ---------------------------------------------------------------- */
  {
    id: "toplama-yontemi",
    heading: "5. Verilerin toplanma yöntemi",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Verilerin tamamı elektronik ortamda, kısmen otomatik yollarla " +
            "toplanır. Kâğıt üzerinde veri toplamıyoruz. Toplama kanalları:",
        ],
      },
      {
        kind: "list",
        style: "bullet",
        items: [
          [
            { kind: "strong", text: "Senin doğrudan girdin" },
            " — profil editörü, ayarlar, dosya yükleme ve destek e-postası.",
          ],
          [
            { kind: "strong", text: "Kimlik sağlayıcısından dönen veri" },
            " — Google veya Apple ile giriş yaptığında bize dönen ad, e-posta " +
              "ve hesap kimliği bilgisi.",
          ],
          [
            { kind: "strong", text: "Otomatik sunucu kayıtları" },
            " — isteklerin işlenmesi sırasında oluşan oturum ve çalışma " +
              "kayıtları.",
          ],
          [
            { kind: "strong", text: "Zorunlu çerezler" },
            " — oturumun taşınması ve giriş akışının güvenliği için " +
              "tarayıcına yazılan az sayıda çerez.",
          ],
          [
            { kind: "strong", text: "Sunucu tarafı dış çağrılar" },
            " — profilde gösterilecek GitHub katkı grafiğinin GitHub'ın " +
              "herkese açık arayüzünden alınması.",
          ],
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 6. Aktarım ve tedarikçiler
   * ---------------------------------------------------------------- */
  {
    id: "aktarim-ve-tedarikciler",
    heading: "6. Aktarım ve tedarikçiler",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Verilerini satmıyoruz ve reklam amacıyla kimseyle paylaşmıyoruz. " +
            "Hizmeti çalıştırmak için kullandığımız tedarikçiler ve bu " +
            "tedarikçilere ulaşan veriler şunlardır:",
        ],
      },
      {
        kind: "table",
        columns: ["Alıcı", "Hizmet", "Ulaşan veri", "Yurt dışı aktarım"],
        rows: [
          [
            ["Cloudflare, Inc."],
            [
              "Uygulamanın çalıştığı sunucular (Workers), veritabanı (D1), " +
                "dosya deposu (R2), içerik dağıtım ağı, çalışma kayıtları " +
                "(Workers Logs) ve çerezsiz ziyaret ölçümü (Web Analytics).",
            ],
            [
              "Caka'da işlenen tüm veriler ile siteye gelen isteklerin teknik " +
                "bilgileri. Ziyaret ölçümü ",
              {
                kind: "strong",
                text: "herkese açık profil sayfaları dâhil tüm sayfalarda",
              },
              " çalışır: her sayfa görüntülemesinde tarayıcın Cloudflare'in " +
                "ölçüm script'ini indirir ve bu istekte IP adresin ile User " +
                "Agent'ın Cloudflare'e ulaşır. Cihazına hiçbir şey yazılmaz.",
            ],
            ["Evet — [AKTARIM MEKANİZMASI]"],
          ],
          [
            ["Google LLC"],
            ["Google ile giriş (kimlik doğrulama)."],
            [
              "Girişi başlattığında Google'a yönlendirilirsin; Google bu " +
                "isteği ve dönüşte bize ilettiği hesap bilgisini kendi " +
                "politikası uyarınca işler.",
            ],
            ["Evet — [AKTARIM MEKANİZMASI]"],
          ],
          [
            ["Apple Inc."],
            ["Apple ile giriş (kimlik doğrulama)."],
            [
              "Girişi başlattığında Apple'a yönlendirilirsin; Apple bu isteği " +
                "ve dönüşte bize ilettiği hesap bilgisini kendi politikası " +
                "uyarınca işler.",
            ],
            ["Evet — [AKTARIM MEKANİZMASI]"],
          ],
          [
            ["Indian Type Foundry (Fontshare)"],
            ["Sitede kullanılan yazı tiplerinin sunulması."],
            [
              "Her sayfa yüklemesinde tarayıcın bu servisten font dosyası " +
                "çeker; bu istekte ",
              { kind: "strong", text: "IP adresin ve User Agent'ın" },
              " servise ulaşır. Cihazına hiçbir şey yazılmaz.",
            ],
            ["Evet — [AKTARIM MEKANİZMASI]"],
          ],
          [
            ["GitHub, Inc."],
            ["Profilde gösterilen katkı grafiği verisinin alınması."],
            [
              "Yalnızca gösterilecek GitHub kullanıcı adı. İstek " +
                "sunucumuzdan gider; ziyaretçinin tarayıcısı GitHub'a istek " +
                "atmaz, dolayısıyla ziyaretçinin IP adresi GitHub'a ulaşmaz.",
            ],
            ["Evet — [AKTARIM MEKANİZMASI]"],
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Yurt dışına aktarım. " },
          "Yukarıdaki alıcıların sunucuları Türkiye dışında da bulunur. KVKK " +
            "m.9 uyarınca yurt dışına aktarım ancak Kanun'un saydığı " +
            "mekanizmalardan birine dayanılarak yapılabilir. Caka'nın bu " +
            "aktarımlarda dayandığı mekanizma ",
          { kind: "strong", text: "[AKTARIM MEKANİZMASI]" },
          " olarak belirlenecektir; bu alan doldurulmadan metin yayına " +
            "alınmaz.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Profillerdeki önizleme görselleri. " },
          "Bir profilde, profil sahibinin eklediği bağlantıların önizleme " +
            "görselleri bizim sunucumuzdan geçmez: tarayıcın o görseli ",
          {
            kind: "strong",
            text: "doğrudan profil sahibinin seçtiği sitenin sunucusundan",
          },
          " çeker. Bu istekte IP adresin ve User Agent'ın o siteye ulaşır ve " +
            "o site tarayıcına kendi çerezini yazabilir. Aynı çerez farklı " +
            "Caka profillerinde de okunabileceği için o site ziyaretlerini " +
            "birbirine bağlayabilir. Bu istekler bizim denetimimizde değildir " +
            "ve şu anda engellenmiş de değildir; görselleri kendi sunucumuz " +
            "üzerinden geçirerek bu sızıntıyı kapatmak iş listemizde duruyor. " +
            "Bu çerezler bize ait olmadığı için ",
          {
            kind: "link",
            text: "Çerez Politikası",
            href: "/cerez-politikasi",
          },
          " tablosunda da yer almazlar.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Bunların dışında, yalnızca yasal bir zorunluluk doğduğunda yetkili " +
            "kamu kurum ve kuruluşlarına aktarım yapılır (KVKK m.8/2-a).",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 7. Saklama süreleri
   * ---------------------------------------------------------------- */
  {
    id: "saklama-sureleri",
    heading: "7. Saklama süreleri",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Verileri, işleme amacı ortadan kalktıktan sonra ilgili mevzuatın " +
            "izin verdiği süre içinde sileriz. Bugün teknik olarak kesin " +
            "bildiğimiz süreler şunlardır:",
        ],
      },
      {
        kind: "list",
        style: "bullet",
        items: [
          [
            { kind: "strong", text: "Eski kullanıcı adı: 30 gün. " },
            "Adresini değiştirdiğinde eski adres 30 gün boyunca yeni adrese " +
              "yönlendirilir ve bu süre boyunca başkasına verilmez; süre " +
              "dolduğunda kayıt geçersiz olur ve ad serbest kalır.",
          ],
          [
            { kind: "strong", text: "GitHub katkı grafiği önbelleği: " },
            "başarılı bir kayıt 6 saat taze sayılır, sonra yeniden çekilir. " +
              "GitHub'da kullanıcı bulunamazsa bu olumsuz sonuç 24 saat " +
              "saklanır. Grafik profilden kaldırıldığında veri yeniden " +
              "çekilmez.",
          ],
          [
            { kind: "strong", text: "Oturum: 7 gün. " },
            "Oturum çerezinin ve oturum kaydının ömrü 7 gündür; çıkış " +
              "yaptığında daha erken sona erer. Giriş akışındaki güvenlik " +
              "çerezleri 5 ve 15 dakika yaşar. Ayrıntı için ",
            {
              kind: "link",
              text: "Çerez Politikası",
              href: "/cerez-politikasi",
            },
            ".",
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Hesap verisi, profil içeriği, yüklenen dosyalar, operasyon " +
            "kayıtları ve destek yazışmaları için uygulanacak saklama " +
            "süreleri ",
          { kind: "strong", text: "[SAKLAMA SÜRELERİ]" },
          " olarak belirlenecektir. Uydurma bir süre yazmaktansa alanı boş " +
            "bıraktık; bu alan doldurulmadan metin yayına alınmaz.",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 8. İlgili kişi hakları
   * ---------------------------------------------------------------- */
  {
    id: "ilgili-kisi-haklari",
    heading: "8. İlgili kişi hakların ve başvuru yolu",
    blocks: [
      {
        kind: "paragraph",
        text: ["KVKK m.11 uyarınca veri sorumlusuna başvurarak şunları isteyebilirsin:"],
      },
      {
        kind: "list",
        style: "bullet",
        items: [
          ["Kişisel verinin işlenip işlenmediğini öğrenme."],
          ["İşlenmişse buna ilişkin bilgi talep etme."],
          [
            "İşlenme amacını ve verilerin amacına uygun kullanılıp " +
              "kullanılmadığını öğrenme.",
          ],
          [
            "Yurt içinde veya yurt dışında verilerin aktarıldığı üçüncü " +
              "kişileri bilme.",
          ],
          [
            "Eksik veya yanlış işlenmiş olması hâlinde verilerin " +
              "düzeltilmesini isteme.",
          ],
          [
            "KVKK m.7'deki şartlar çerçevesinde verilerin silinmesini veya " +
              "yok edilmesini isteme.",
          ],
          [
            "Düzeltme, silme ve yok etme işlemlerinin, verilerin aktarıldığı " +
              "üçüncü kişilere bildirilmesini isteme.",
          ],
          [
            "Verilerin münhasıran otomatik sistemlerle analiz edilmesi " +
              "suretiyle aleyhine bir sonuç ortaya çıkmasına itiraz etme.",
          ],
          [
            "Kanuna aykırı işleme sebebiyle zarara uğraman hâlinde zararın " +
              "giderilmesini talep etme.",
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Başvuru. " },
          "Taleplerini ",
          { kind: "strong", text: "hello@caka.app" },
          " adresine yazarak iletebilirsin. Başvurunu en geç 30 gün içinde " +
            "sonuçlandırırız. Başkasının verisine erişimi önlemek için " +
            "kimliğini doğrulamamız gerekebilir; bunun için hesabına kayıtlı " +
            "e-posta adresinden yazman genellikle yeterlidir. Talebini Veri " +
            "Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ'de sayılan " +
            "diğer yollarla da iletebilirsin.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Dışa aktarma ve hesap silme bugün self-servis değil. " },
          "Panelde verilerini indirebileceğin veya hesabını tek tıkla " +
            "silebileceğin bir düğme henüz yok. Bunu açıkça yazıyoruz, çünkü " +
            "olmayan bir özelliği varmış gibi anlatmak istemiyoruz. Her iki " +
            "talebi de yukarıdaki adrese yazarak kullanabilirsin; hesabını " +
            "sildiğimizde profilin, yüklediğin dosyalar ve oturum kayıtların " +
            "da silinir.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Caka hesabı olmayanlar da başvurabilir. " },
          "Örneğin katkı grafiği önbelleğinde kullanıcı adı geçen bir GitHub " +
            "hesabının sahibiysen ve bu verinin silinmesini istiyorsan, Caka " +
            "hesabın olmasa da aynı adrese yazabilirsin.",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 9. Çerezler
   * ---------------------------------------------------------------- */
  {
    id: "cerezler",
    heading: "9. Çerezler",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Caka yalnızca ",
          { kind: "strong", text: "zorunlu çerezleri" },
          " kullanır: oturumunu taşıyan çerez ve giriş akışını güvenli " +
            "tutan kısa ömürlü çerezler. Reklam çerezi, analitik çerezi ve " +
            "çapraz site takibi yoktur; ziyaret istatistikleri, herkese açık " +
            "profil sayfaları dâhil tüm sayfalarda, cihazına hiçbir şey " +
            "yazmadan çerezsiz biçimde ölçülür. Bu yüzden onay istemek " +
            "zorunda kalmıyoruz.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Çerezlerin yanı sıra, gezinirken kaydırma konumunu hatırlamak için " +
            "sekmeye özel tek bir sessionStorage girdisi oluşur; sekmeyi " +
            "kapattığında silinir ve kişisel veri taşımaz. Cihazına yazılan " +
            "her girdinin adını, amacını, ömrünü ve kime ait olduğunu ",
          {
            kind: "link",
            text: "Çerez Politikası",
            href: "/cerez-politikasi",
          },
          " sayfasında tablo hâlinde bulabilirsin.",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 10. Değişiklikler
   * ---------------------------------------------------------------- */
  {
    id: "degisiklikler",
    heading: "10. Bu metindeki değişiklikler",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Ürün değiştikçe bu metin de değişir: yeni bir tedarikçi eklendiğinde, " +
            "yeni bir veri kategorisi işlemeye başladığımızda veya bir amacın " +
            "hukuki sebebi değiştiğinde metni güncelleriz.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Her güncellemede sayfanın başındaki sürüm numarası artar ve son " +
            "güncelleme tarihi yenilenir. Bu üç hukuki belgenin sürümleri " +
            "birbirinden bağımsızdır: yalnızca değişen belgenin tarihi " +
            "oynar, diğerlerininki olduğu gibi kalır. Esaslı bir değişiklik " +
            "olduğunda hesabı olan kullanıcıları ayrıca bilgilendiririz.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Bu metinle birlikte ",
          {
            kind: "link",
            text: "Kullanım Koşulları",
            href: "/kullanim-kosullari",
          },
          " ve ",
          {
            kind: "link",
            text: "Çerez Politikası",
            href: "/cerez-politikasi",
          },
          " sayfalarını da okumanı öneririz.",
        ],
      },
    ],
  },
];
