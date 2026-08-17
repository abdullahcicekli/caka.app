// Panel analitiği yüzeyinin metinleri (Değişmez #5: metin bileşene gömülmez).
// Sayılar hakkında verilen her söz kodda gerçekten karşılığı olan sözdür:
// pencere 30 gündür, başlangıç tarihi kayıtlardan türetilir, tekil ziyaretçi
// iddiası yoktur.
import {
  formatDayKey,
  OLCUM_BILINMEYEN_ULKE,
  OLCUM_DIGER_ULKE,
  OLCUM_PENCERE_GUN,
  OLCUM_ULKE_ESIGI,
} from "@caka/shared";

export const analitik = {
  baslik: "Sayfa istatistikleri",
  pencereEtiketi: "Son 30 gün",

  gorunumBaslik: "Görüntülenme",
  tiklamaBaslik: "Tıklama",
  bugunBaslik: "Bugün",

  grafikBaslik: "Günlük görüntülenme",
  /** Grafik ekran okuyucuya tek etiketle okunur. */
  grafikAria: (toplam: string) => `Son 30 günün günlük görüntülenme grafiği, toplam ${toplam}`,
  gunEtiketi: (gun: string, sayi: string) => `${formatDayKey(gun)}: ${sayi} görüntülenme`,

  baglantiBaslik: "Bağlantı tıklamaları",
  baglantiBos: "Sayfanda tıklanabilir bir bağlantı yok. Bağlantı ekleyince tıklamaları burada görürsün.",

  ulkeBaslik: "Ülkeler",

  /**
   * Eşik altı satırların toplandığı kovanın neden orada durduğu. Sayı
   * gizlenmiyor, yalnızca ülke adı gizleniyor; not bunu açıkça söyler.
   */
  ulkeEsikNotu:
    `${OLCUM_ULKE_ESIGI} ziyaretten az alan ülkeler tek tek gösterilmez; ` +
    "tek bir ziyaretçinin nereden geldiği bu tablodan okunamasın diye " +
    "“Az sayıda” satırında toplanır. Ziyaretler toplamdan düşmez.",

  /**
   * Ölçümün ne zaman başladığı. Pencereyle çelişmemesi kritik: kayıt penceden
   * eskiyse yukarıdaki sayılar o tarihe kadar geriye GİTMEZ, yalnızca son 30
   * günü kapsar. İki satır birbirini yalanlamasın diye ikisi tek cümlede.
   */
  baslangicNotu: (gun: string) =>
    `Ölçüm ${formatDayKey(gun)} tarihinde başladı. Yukarıdaki sayılar ise ` +
    `yalnızca son ${OLCUM_PENCERE_GUN} günü kapsar; daha eski kayıtlar ` +
    "saklanır ama bu tablolara girmez.",

  bosBaslik: "Henüz ölçüm verisi yok",
  bosMetin:
    "Sayfan ziyaret edildikçe görüntülenme ve bağlantı tıklamaları burada birikir. " +
    "Yeni bir sayfada bu tabloların boş olması normaldir.",

  /** Panelde duran ve yayındaki hukuki metinlerle bire bir tutarlı olan söz. */
  gizlilikNotu:
    "Ölçüm birinci taraftır ve çerezsizdir: ziyaretçinin cihazına hiçbir şey yazılmaz, " +
    "ham IP adresi saklanmaz, veri üçüncü tarafla paylaşılmaz. Ziyaretçiler tekilleştirilmez — " +
    "sayılar toplam görüntülenmedir, tekil kişi sayısı değildir.",

  /**
   * Sayılan/sayılmayan trafiğin dürüst özeti. Bot ayıklaması yalnızca
   * User Agent'a bakar (`server/analytics.ts`), sahibi ayıklaması ise açık bir
   * oturum ister — ikisi de kesin değil ve metin bunu kesinmiş gibi anlatmaz.
   */
  kapsamNotu:
    "Tanıyabildiğimiz bot trafiğini ayıklarız; ayıklama tarayıcının kendini " +
    "tanıttığı ada bakar, dolayısıyla kendini gizleyen bir bot yine sayılabilir. " +
    "Giriş yapmış hâldeyken kendi sayfana bakman sayılmaz; aynı sayfayı çıkış " +
    "yapmış bir tarayıcıda veya gizli sekmede açarsan seni tanıyamayız ve o " +
    "ziyaret sayılır. Tıklamalar tarayıcıda JavaScript kapalıyken sayılamaz — " +
    "bağlantılar yine çalışır, yalnızca sayaca yazılmaz.",

  tarayiciSaati: "Günler Türkiye saatine göre kesilir.",
} as const;

const BLOK_ETIKETLERI: Record<string, string> = {
  social: "Sosyal medya",
  link: "Bağlantı",
  image: "Görsel",
  status: "Durum",
};

/** Adı boş kalmış bloklar için tip etiketine düşülür. */
export function baglantiAdi(label: string, type: string): string {
  return label.trim() || BLOK_ETIKETLERI[type] || "Bağlantı";
}

/** Adresin panelde gösterilen kısa hâli. */
export function kisaAdres(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

const ULKE_ADLARI: Record<string, string> = {
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

/** Bilinen ülke adı; yoksa ISO kodu olduğu gibi gösterilir. */
export function ulkeAdi(code: string): string {
  if (code === OLCUM_BILINMEYEN_ULKE) return "Bilinmiyor";
  // Ülkesi çözülemeyen ziyaret ("Bilinmiyor") ile eşik altında kaldığı için
  // gizlenen ziyaret aynı satırda görünmemeli: biri bilgi eksikliği, diğeri
  // bilinçli bir gizleme.
  if (code === OLCUM_DIGER_ULKE) return "Az sayıda";
  return ULKE_ADLARI[code] ?? code;
}
