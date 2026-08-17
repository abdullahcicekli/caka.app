// Panel analitiği yüzeyinin metinleri (Değişmez #5: metin bileşene gömülmez).
// Sayılar hakkında verilen her söz kodda gerçekten karşılığı olan sözdür:
// pencere 30 gündür, başlangıç tarihi kayıtlardan türetilir, tekil ziyaretçi
// iddiası yoktur.
import { formatDayKey, OLCUM_BILINMEYEN_ULKE } from "@caka/shared";

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

  /** Ölçümün ne zaman başladığı — "hep böyleydi" izlenimi verilmez. */
  baslangicNotu: (gun: string) =>
    `Ölçüm ${formatDayKey(gun)} tarihinden bu yana tutuluyor; öncesine ait kayıt yok.`,

  bosBaslik: "Henüz ölçüm verisi yok",
  bosMetin:
    "Sayfan ziyaret edildikçe görüntülenme ve bağlantı tıklamaları burada birikir. " +
    "Yeni bir sayfada bu tabloların boş olması normaldir.",

  /** Panelde duran ve yayındaki hukuki metinlerle bire bir tutarlı olan söz. */
  gizlilikNotu:
    "Ölçüm birinci taraftır ve çerezsizdir: ziyaretçinin cihazına hiçbir şey yazılmaz, " +
    "ham IP adresi saklanmaz, veri üçüncü tarafla paylaşılmaz. Ziyaretçiler tekilleştirilmez — " +
    "sayılar toplam görüntülenmedir, tekil kişi sayısı değildir.",

  /** Sayılan/sayılmayan trafiğin dürüst özeti. */
  kapsamNotu:
    "Bot trafiği ve kendi ziyaretlerin sayılmaz. Tıklamalar tarayıcıda JavaScript " +
    "kapalıyken sayılamaz — bağlantılar yine çalışır, yalnızca sayaca yazılmaz.",

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
  return ULKE_ADLARI[code] ?? code;
}
