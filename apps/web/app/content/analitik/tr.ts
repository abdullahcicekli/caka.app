import {
  formatDayKey,
  OLCUM_BILINMEYEN_ULKE,
  OLCUM_DIGER_ULKE,
  OLCUM_PENCERE_GUN,
  OLCUM_ULKE_ESIGI,
} from "@caka/shared";

/**
 * Ülke adları elle yazılır, `Intl.DisplayNames` ile üretilmez: ICU verisi
 * Worker ile tarayıcı arasında farklı olabilir ve aynı satır sunucuda başka,
 * istemcide başka basılırsa hidrasyon uyuşmazlığı çıkar. Liste ölçümde
 * gerçekten görülen ülkelerdir; tanınmayan kod olduğu gibi gösterilir.
 */
const COUNTRIES: Record<string, string> = {
  TR: "Türkiye",
  DE: "Almanya",
  US: "ABD",
  GB: "Birleşik Krallık",
  NL: "Hollanda",
  FR: "Fransa",
  AZ: "Azerbaycan",
  AT: "Avusturya",
  BE: "Belçika",
  CH: "İsviçre",
  SE: "İsveç",
  IT: "İtalya",
  ES: "İspanya",
  CA: "Kanada",
  AU: "Avustralya",
  RU: "Rusya",
  UA: "Ukrayna",
  IN: "Hindistan",
  JP: "Japonya",
  BR: "Brezilya",
};

const BLOCK_LABELS: Record<string, string> = {
  social: "Sosyal medya",
  link: "Bağlantı",
  image: "Görsel",
  status: "Durum",
};

export const tr = {
  title: "Sayfa istatistikleri",
  windowLabel: "Son 30 gün",

  viewsTitle: "Görüntülenme",
  clicksTitle: "Etkileşim",
  todayTitle: "Bugün",

  chartTitle: "Günlük görüntülenme",
  /** Grafik ekran okuyucuya tek etiketle okunur. */
  chartAria: (total: string) => `Son 30 günün günlük görüntülenme grafiği, toplam ${total}`,
  dayLabel: (day: string, count: string) => `${formatDayKey(day)}: ${count} görüntülenme`,

  linksTitle: "Tıklama ve oynatmalar",
  linksEmpty:
    "Sayfanda ölçülebilir bir bağlantı ya da medya kartı yok. Bağlantı, YouTube veya Spotify ekleyince buradan takip edersin.",

  countriesTitle: "Ülkeler",

  /**
   * Eşik altı satırların toplandığı kovanın neden orada durduğu. Sayı
   * gizlenmiyor, yalnızca ülke adı gizleniyor; not bunu açıkça söyler.
   */
  countryThresholdNote:
    `${OLCUM_ULKE_ESIGI} ziyaretten az alan ülkeler tek tek gösterilmez; ` +
    "tek bir ziyaretçinin nereden geldiği bu tablodan okunamasın diye " +
    "“Az sayıda” satırında toplanır. Ziyaretler toplamdan düşmez.",

  /**
   * Ölçümün ne zaman başladığı. Pencereyle çelişmemesi kritik: kayıt
   * pencereden eskiyse yukarıdaki sayılar o tarihe kadar geriye GİTMEZ.
   */
  startNote: (day: string) =>
    `Ölçüm ${formatDayKey(day)} tarihinde başladı. Yukarıdaki sayılar ise ` +
    `yalnızca son ${OLCUM_PENCERE_GUN} günü kapsar; daha eski kayıtlar ` +
    "saklanır ama bu tablolara girmez.",

  emptyTitle: "Henüz ölçüm verisi yok",
  emptyBody:
    "Sayfan ziyaret edildikçe görüntülenme ve bağlantı tıklamaları burada birikir. " +
    "Yeni bir sayfada bu tabloların boş olması normaldir.",

  /** Panelde duran ve yayındaki hukuki metinlerle bire bir tutarlı olan söz. */
  privacyNote:
    "Ölçüm birinci taraftır ve çerezsizdir: ziyaretçinin cihazına hiçbir şey yazılmaz, " +
    "ham IP adresi saklanmaz, veri üçüncü tarafla paylaşılmaz. Ziyaretçiler tekilleştirilmez — " +
    "sayılar toplam görüntülenmedir, tekil kişi sayısı değildir.",

  /**
   * Sayılan/sayılmayan trafiğin dürüst özeti. Bot ayıklaması yalnızca
   * User Agent'a bakar, sahibi ayıklaması ise açık bir oturum ister — ikisi
   * de kesin değil ve metin bunu kesinmiş gibi anlatmaz.
   */
  scopeNote:
    "Tanıyabildiğimiz bot trafiğini ayıklarız; ayıklama tarayıcının kendini " +
    "tanıttığı ada bakar, dolayısıyla kendini gizleyen bir bot yine sayılabilir. " +
    "Giriş yapmış hâldeyken kendi sayfana bakman sayılmaz; aynı sayfayı çıkış " +
    "yapmış bir tarayıcıda veya gizli sekmede açarsan seni tanıyamayız ve o " +
    "ziyaret sayılır. Tıklamalar tarayıcıda JavaScript kapalıyken sayılamaz — " +
    "bağlantılar yine çalışır, yalnızca sayaca yazılmaz.",

  timezoneNote: "Günler Türkiye saatine göre kesilir.",

  /** Adı boş kalmış bloklar için tip etiketine düşülür. */
  linkName: (label: string, type: string) => label.trim() || BLOCK_LABELS[type] || "Bağlantı",

  /** Bilinen ülke adı; yoksa ISO kodu olduğu gibi gösterilir. */
  countryName: (code: string): string => {
    if (code === OLCUM_BILINMEYEN_ULKE) return "Bilinmiyor";
    // Ülkesi çözülemeyen ziyaret ("Bilinmiyor") ile eşik altında kaldığı için
    // gizlenen ziyaret aynı satırda görünmemeli: biri bilgi eksikliği,
    // diğeri bilinçli bir gizleme.
    if (code === OLCUM_DIGER_ULKE) return "Az sayıda";
    return COUNTRIES[code] ?? code;
  },
};
