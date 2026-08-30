// Public yazı sayfasının arayüz metinleri (Değişmez #5, R15). Yazının
// gövdesi sahibin yazdığı dildedir ve çevrilmez; burada yalnız sayfanın
// çerçevesi yaşar: tarih, profile dönüş, taslak notu ve yalın 404 (R20).
//
// Tarih elle biçimlenir, `Intl.DateTimeFormat` KULLANILMAZ: ICU verisi
// Worker ile tarayıcı arasında farklı olabilir ve aynı tarih sunucuda başka,
// istemcide başka basılırsa hidrasyon uyuşmazlığı çıkar (analitik
// kataloğundaki ülke adlarıyla aynı gerekçe).

const AYLAR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

/** "YYYY-MM-DD" gün anahtarını ayrıştırır; bozuksa null. */
export function parseDayKey(day: string): { y: string; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return null;
  return { y: match[1], m: Number(match[2]), d: Number(match[3]) };
}

export const tr = {
  /** Yayın tarihi etiketi; gün anahtarı UTC'den türetilir (loader'da). */
  date: (day: string): string => {
    const parsed = parseDayKey(day);
    const name = parsed ? AYLAR[parsed.m - 1] : undefined;
    if (!parsed || !name) return day;
    return `${parsed.d} ${name} ${parsed.y}`;
  },
  backToProfile: (username: string) => `@${username} profiline dön`,
  /** AE2: sahip taslağını görür; ziyaretçiye bu sayfa hiç inmez (404). */
  draftNotice: "Taslak — bu yazıyı şu an yalnız sen görebiliyorsun.",
  shareImageAlt: (title: string) => `${title} — Caka'da bir yazı`,
  // R20: YALIN 404 — profile dönüş var, "bu adres boşta, kap!" çağrısı YOK.
  notFound: {
    title: "Yazı bulunamadı",
    body: "Bu adreste yayında bir yazı yok; kaldırılmış ya da adresi değişmiş olabilir.",
  },
};
