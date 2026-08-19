/**
 * Kur'an ayeti bloğunun SAF katmanı: sure dizini, referans ayrıştırma,
 * doğrulama ve metin kısaltma. Ağ yok, DOM yok, dil yok.
 *
 * NEDEN SURE ADLARI BURADA (Değişmez #5 ile çelişmez): bunlar arayüz metni
 * değil, ayrıştırmanın GİRDİSİ olan veridir. "bakara 255" yazan kullanıcının
 * girdisini sayıya çevirebilmek için dizinin kodda olması gerekiyor; kartta
 * görünen sure adı da kaydın kendisinden (`block.data.surahName`) geliyor,
 * katalogdan değil. Arayüz etiketleri ("Sure", "Ayet", hata cümleleri) yine
 * `content/app` ve `content/widget` kataloglarında ve beş dilde.
 *
 * NEDEN TAM METİN BURADA DEĞİL: 6236 ayetin Arapçası + meali ~2,7 MB. Worker
 * paketine girseydi Cloudflare'in yükleme sınırına dayanırdı. Metin yalnız
 * EDİTÖRDE, oturumlu kullanıcı için çözülür (`apps/web/server/quran.ts`) ve
 * seçilen ayet bloğun verisine yazılır; render hiçbir dış istek atmaz (R58).
 */

export type SurahEntry = {
  /** 1-114 */
  readonly no: number;
  /** Türkçe okunuşu (Diyanet yazımı) — kayda da bu ad yazılır. */
  readonly name: string;
  /** Arapça adı (harekeli). Editördeki sure listesinde gösterilir. */
  readonly nameAr: string;
  /** Surenin ayet sayısı; referans doğrulamasının üst sınırı. */
  readonly verses: number;
  /** Yaygın ikinci adı — YALNIZ aramada kullanılır (Gâfir/Mü'min gibi). */
  readonly alt?: string;
};

/** Kur'an'daki toplam ayet sayısı; `SURAHS` toplamıyla test edilir. */
export const QURAN_VERSE_COUNT = 6236;

/**
 * En uzun ayetin (Bakara 282) ölçülen uzunlukları: Arapça 1224, Türkçe meal
 * 1333 karakter (2026-08-19, `ara-quranuthmanihaf` / `tur-elmalilihamdiya`).
 * Şema sınırları ileride başka bir meal eklenebilsin diye üstüne pay bırakır.
 */
export const AYET_ARABIC_MAX = 1400;
export const AYET_MEAL_MAX = 1600;

/**
 * 114 sure: numara, Türkçe ad, Arapça ad, ayet sayısı. Ayet sayılarının
 * toplamı 6236'dır ve testte `QURAN_VERSE_COUNT` ile karşılaştırılır — elle
 * düzenlenip bir sayı bozulursa test kırılır.
 */
export const SURAHS: readonly SurahEntry[] = [
  { no: 1, name: "Fâtiha", nameAr: "الْفَاتِحَةِ", verses: 7 },
  { no: 2, name: "Bakara", nameAr: "البَقَرَةِ", verses: 286 },
  { no: 3, name: "Âl-i İmrân", nameAr: "اٰلِ عِمْرٰنَ", verses: 200 },
  { no: 4, name: "Nisâ", nameAr: "النِّسَآءِ", verses: 176 },
  { no: 5, name: "Mâide", nameAr: "المَآئِدَةِ", verses: 120 },
  { no: 6, name: "En'âm", nameAr: "الْاَنْعَامِ", verses: 165 },
  { no: 7, name: "A'râf", nameAr: "الْاَعْرَافِ", verses: 206 },
  { no: 8, name: "Enfâl", nameAr: "الْاَنْفَالِ", verses: 75 },
  { no: 9, name: "Tevbe", nameAr: "التَّوْبَةِ", verses: 129 },
  { no: 10, name: "Yûnus", nameAr: "يُوْنُسَ", verses: 109 },
  { no: 11, name: "Hûd", nameAr: "هُوْدٍ", verses: 123 },
  { no: 12, name: "Yûsuf", nameAr: "يُوسُفَ", verses: 111 },
  { no: 13, name: "Ra'd", nameAr: "الرَّعْدِ", verses: 43 },
  { no: 14, name: "İbrâhim", nameAr: "اِبْرَاهِيْمَ", verses: 52 },
  { no: 15, name: "Hicr", nameAr: "الْحِجْرِ", verses: 99 },
  { no: 16, name: "Nahl", nameAr: "النَّحْلِ", verses: 128 },
  { no: 17, name: "İsrâ", nameAr: "الإِسۡرَاءِ", verses: 111, alt: "Benî İsrâil" },
  { no: 18, name: "Kehf", nameAr: "الْكَهْفِ", verses: 110 },
  { no: 19, name: "Meryem", nameAr: "مَرْيَمَ", verses: 98 },
  { no: 20, name: "Tâhâ", nameAr: "طٰهٰ", verses: 135 },
  { no: 21, name: "Enbiyâ", nameAr: "الْاَنْۣبِيَآءِ", verses: 112 },
  { no: 22, name: "Hac", nameAr: "الْحَجِّ", verses: 78 },
  { no: 23, name: "Mü'minûn", nameAr: "الْمُؤْمِنُوْنَ", verses: 118 },
  { no: 24, name: "Nûr", nameAr: "النُّوْرِ", verses: 64 },
  { no: 25, name: "Furkân", nameAr: "الْفُرْقَانِ", verses: 77 },
  { no: 26, name: "Şuarâ", nameAr: "الشُّعَرَآءِ", verses: 227 },
  { no: 27, name: "Neml", nameAr: "النَّمْلِ", verses: 93 },
  { no: 28, name: "Kasas", nameAr: "الْقَصَصِ", verses: 88 },
  { no: 29, name: "Ankebût", nameAr: "الْعَنْكَبُوْتِ", verses: 69 },
  { no: 30, name: "Rûm", nameAr: "الرُّوْمِ", verses: 60 },
  { no: 31, name: "Lokmân", nameAr: "لُقْمَانَ", verses: 34 },
  { no: 32, name: "Secde", nameAr: "السَّجْدَةِ", verses: 30 },
  { no: 33, name: "Ahzâb", nameAr: "الْاَحْزَابِ", verses: 73 },
  { no: 34, name: "Sebe'", nameAr: "سَبَاٍ", verses: 54 },
  { no: 35, name: "Fâtır", nameAr: "فَاطِرٍ", verses: 45 },
  { no: 36, name: "Yâsîn", nameAr: "يٰسٓ", verses: 83 },
  { no: 37, name: "Sâffât", nameAr: "الصَّافَّاتِ", verses: 182 },
  { no: 38, name: "Sâd", nameAr: "صٓ", verses: 88 },
  { no: 39, name: "Zümer", nameAr: "الزُّمَرِ", verses: 75 },
  { no: 40, name: "Gâfir", nameAr: "الْمُؤْمِنِ", verses: 85, alt: "Mü'min" },
  { no: 41, name: "Fussilet", nameAr: "فُصِّلَتۡ", verses: 54 },
  { no: 42, name: "Şûrâ", nameAr: "الشُّوْرٰي", verses: 53 },
  { no: 43, name: "Zuhruf", nameAr: "الزُّخْرُفِ", verses: 89 },
  { no: 44, name: "Duhân", nameAr: "الدُّخَانِ", verses: 59 },
  { no: 45, name: "Câsiye", nameAr: "الْجَاثِيَةِ", verses: 37 },
  { no: 46, name: "Ahkâf", nameAr: "الْاَحْقَافِ", verses: 35 },
  { no: 47, name: "Muhammed", nameAr: "مُحَمَّدٍ", verses: 38 },
  { no: 48, name: "Fetih", nameAr: "الْفَتْحِ", verses: 29 },
  { no: 49, name: "Hucurât", nameAr: "الْحُجُراتِ", verses: 18 },
  { no: 50, name: "Kâf", nameAr: "قٓ", verses: 45 },
  { no: 51, name: "Zâriyât", nameAr: "الذَّارِياتِ", verses: 60 },
  { no: 52, name: "Tûr", nameAr: "الطُّوْرِ", verses: 49 },
  { no: 53, name: "Necm", nameAr: "النَّجْمِ", verses: 62 },
  { no: 54, name: "Kamer", nameAr: "الْقَمَرِ", verses: 55 },
  { no: 55, name: "Rahmân", nameAr: "الرَّحْمٰنِ", verses: 78 },
  { no: 56, name: "Vâkıa", nameAr: "الْوَاقِعَةِ", verses: 96 },
  { no: 57, name: "Hadîd", nameAr: "الْحَدِيْدِ", verses: 29 },
  { no: 58, name: "Mücâdele", nameAr: "الْمُجَادَلَةِ", verses: 22 },
  { no: 59, name: "Haşr", nameAr: "الْحَشْرِ", verses: 24 },
  { no: 60, name: "Mümtehine", nameAr: "الْمُمْتَحِنَةِ", verses: 13 },
  { no: 61, name: "Saff", nameAr: "الصَّفِّ", verses: 14 },
  { no: 62, name: "Cum'a", nameAr: "الْجُمُعَةِ", verses: 11 },
  { no: 63, name: "Münâfikûn", nameAr: "الْمُنَافِقُوْنَ", verses: 11 },
  { no: 64, name: "Teğâbün", nameAr: "التَّغَابُنِ", verses: 18 },
  { no: 65, name: "Talâk", nameAr: "الطَّلَاقِ", verses: 12 },
  { no: 66, name: "Tahrîm", nameAr: "التَّحْرِيْمِ", verses: 12 },
  { no: 67, name: "Mülk", nameAr: "الْمُلْكِ", verses: 30 },
  { no: 68, name: "Kalem", nameAr: "الْقَلَمِ", verses: 52 },
  { no: 69, name: "Hâkka", nameAr: "الْحَآقَّةِ", verses: 52 },
  { no: 70, name: "Meâric", nameAr: "الْمَعَارِجِ", verses: 44 },
  { no: 71, name: "Nûh", nameAr: "نُوْحٍ", verses: 28 },
  { no: 72, name: "Cin", nameAr: "الْجِنِّ", verses: 28 },
  { no: 73, name: "Müzzemmil", nameAr: "الْمُزَّمِّلِ", verses: 20 },
  { no: 74, name: "Müddessir", nameAr: "الْمُدَّثِّرِ", verses: 56 },
  { no: 75, name: "Kıyâme", nameAr: "الْقِيَامَةِ", verses: 40 },
  { no: 76, name: "İnsan", nameAr: "الدَّهْرِ", verses: 31, alt: "Dehr" },
  { no: 77, name: "Mürselât", nameAr: "الْمُرْسَلَاتِ", verses: 50 },
  { no: 78, name: "Nebe'", nameAr: "النَّبَاِ", verses: 40 },
  { no: 79, name: "Nâziât", nameAr: "النَّازِعَاتِ", verses: 46 },
  { no: 80, name: "Abese", nameAr: "عَبَسَ", verses: 42 },
  { no: 81, name: "Tekvîr", nameAr: "التَّكْوِيْرِ", verses: 29 },
  { no: 82, name: "İnfitâr", nameAr: "الْاِنْفِطَارِ", verses: 19 },
  { no: 83, name: "Mutaffifîn", nameAr: "المُطَفِّفِيْنَ", verses: 36 },
  { no: 84, name: "İnşikâk", nameAr: "الاِنْشِقَاقِ", verses: 25 },
  { no: 85, name: "Bürûc", nameAr: "الْبُرُوْجِ", verses: 22 },
  { no: 86, name: "Târık", nameAr: "الطَّارِقِ", verses: 17 },
  { no: 87, name: "A'lâ", nameAr: "الْاَعْلٰي", verses: 19 },
  { no: 88, name: "Gâşiye", nameAr: "الْغَاشِيَةِ", verses: 26 },
  { no: 89, name: "Fecr", nameAr: "الْفَجْرِ", verses: 30 },
  { no: 90, name: "Beled", nameAr: "الْبَلَدِ", verses: 20 },
  { no: 91, name: "Şems", nameAr: "الشَّمْسِ", verses: 15 },
  { no: 92, name: "Leyl", nameAr: "الَّيْلِ", verses: 21 },
  { no: 93, name: "Duhâ", nameAr: "الضُّحٰي", verses: 11 },
  { no: 94, name: "İnşirâh", nameAr: "الشَّرْحِ", verses: 8, alt: "Şerh" },
  { no: 95, name: "Tîn", nameAr: "التِّيْنِ", verses: 8 },
  { no: 96, name: "Alak", nameAr: "الْعَلَقِ", verses: 19 },
  { no: 97, name: "Kadir", nameAr: "الْقَدْرِ", verses: 5 },
  { no: 98, name: "Beyyine", nameAr: "الْبَيِّنَةِ", verses: 8 },
  { no: 99, name: "Zilzâl", nameAr: "الزِّلْزَالِ", verses: 8 },
  { no: 100, name: "Âdiyât", nameAr: "العٰدِيٰتِ", verses: 11 },
  { no: 101, name: "Kâria", nameAr: "الْقَارِعَةِ", verses: 11 },
  { no: 102, name: "Tekâsür", nameAr: "التَّكَاثُرِ", verses: 8 },
  { no: 103, name: "Asr", nameAr: "الْعَصْرِ", verses: 3 },
  { no: 104, name: "Hümeze", nameAr: "الْهُمَزَةِ", verses: 9 },
  { no: 105, name: "Fîl", nameAr: "الْفِيْلِ", verses: 5 },
  { no: 106, name: "Kureyş", nameAr: "قُرَيْشٍ", verses: 4 },
  { no: 107, name: "Mâûn", nameAr: "الْمَاعُوْنِ", verses: 7 },
  { no: 108, name: "Kevser", nameAr: "الْكَوْثَرِ", verses: 3 },
  { no: 109, name: "Kâfirûn", nameAr: "الْكَافِرُوْنَ", verses: 6 },
  { no: 110, name: "Nasr", nameAr: "النَّصْرِ", verses: 3 },
  { no: 111, name: "Tebbet", nameAr: "المَسَدِ", verses: 5, alt: "Mesed" },
  { no: 112, name: "İhlâs", nameAr: "الْاِخْلَاصِ", verses: 4 },
  { no: 113, name: "Felak", nameAr: "الْفَلَقِ", verses: 5 },
  { no: 114, name: "Nâs", nameAr: "النَّاسِ", verses: 6 },
] as const;

const SURAH_BY_NO = new Map(SURAHS.map((surah) => [surah.no, surah]));

export function surahByNo(no: number): SurahEntry | null {
  return SURAH_BY_NO.get(no) ?? null;
}

/**
 * Türkçe arama katlaması. `Intl`/`localeCompare` KULLANILMAZ: çıktı hem
 * Worker'da hem tarayıcıda birebir aynı olmalı (aynı gerekçe
 * `content/widget/shared.ts`'te). Şapkalı ünlüler, i/ı ayrımı ve kesme
 * işareti eritilir; böylece "muminun", "Mü'minûn" ve "MÜMİNUN" aynı anahtara
 * düşer.
 */
const FOLD_MAP: Readonly<Record<string, string>> = {
  â: "a", Â: "a", ä: "a", à: "a", á: "a",
  ê: "e", Ê: "e", é: "e", è: "e",
  î: "i", Î: "i", ı: "i", İ: "i", ï: "i", í: "i",
  ô: "o", Ô: "o", ö: "o", Ö: "o", ó: "o",
  û: "u", Û: "u", ü: "u", Ü: "u", ú: "u",
  ç: "c", Ç: "c",
  ğ: "g", Ğ: "g",
  ş: "s", Ş: "s",
};

// Kesme işareti SİLİNİR, boşluğa çevrilmez: "Mü'min" ile "mümin" aynı sözcük
// ve kullanıcı kesmeyi yazmıyor. Tire ise boşluğa iner — "Âl-i İmrân" iki
// sözcüktür ve "al i imran" olarak yazılabilir.
const APOSTROPHES = "'’ʼ´`";

export function foldTurkish(value: string): string {
  let out = "";
  for (const char of value) {
    if (APOSTROPHES.includes(char)) continue;
    const mapped = FOLD_MAP[char];
    if (mapped !== undefined) {
      out += mapped;
      continue;
    }
    const lower = char.toLowerCase();
    // Harf ve rakam dışındaki her şey (tire, noktalama) tek boşluğa iner.
    out += /[a-z0-9]/.test(lower) ? lower : " ";
  }
  return out.trim().replace(/\s+/g, " ");
}

/** Kullanıcının yazdığı referans; ayet numarası verilmemiş olabilir. */
export type SurahQuery = { surah: number; verse: number | null };

/** Tam bir ayet adresi. */
export type VerseRef = { surah: number; verse: number };

// "2:255", "2/255", "2.255", "2-255", "2 255" ve yalnız "2".
const NUMERIC_REF = /^(\d{1,3})(?:\s*[:/.\-\s]\s*(\d{1,3}))?$/;

/**
 * Kullanıcının yazdığını sure/ayet adresine çevirir; çeviremezse `null`
 * (o zaman girdi metin araması sayılır).
 *
 * Kabul edilen biçimler: `2:255`, `2/255`, `2 255`, `bakara`, `bakara 255`,
 * `Âl-i İmrân 190`, `ihlas 1`. Sure adı katlanmış hâliyle eşleşir, yani
 * şapka/kesme/büyük-küçük harf farkı önemsizdir.
 *
 * AYET NUMARASI BURADA SINIRLANMAZ: "Bakara 300" ayrıştırılır ama geçersizdir.
 * Ayrım bilinçli — kullanıcıya "böyle bir şey anlamadım" değil, "Bakara
 * suresinde 300. ayet yok" demek gerekiyor (bkz. `verseRefIssue`).
 */
export function parseSurahQuery(input: string): SurahQuery | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const numeric = NUMERIC_REF.exec(trimmed);
  if (numeric) {
    const surah = Number(numeric[1]);
    if (surah < 1 || surah > SURAHS.length) return null;
    return { surah, verse: numeric[2] ? Number(numeric[2]) : null };
  }

  // Sondaki sayı ayet numarası sayılır; kalan kısım sure adıdır.
  const tail = /^(.*?)[\s:/.\-]+(\d{1,3})$/.exec(trimmed);
  const namePart = tail ? tail[1] : trimmed;
  const verse = tail ? Number(tail[2]) : null;
  const folded = foldTurkish(namePart);
  if (!folded) return null;

  const exact = SURAHS.find(
    (surah) => foldTurkish(surah.name) === folded || (surah.alt && foldTurkish(surah.alt) === folded),
  );
  if (exact) return { surah: exact.no, verse };

  // Tek bir sureye daralıyorsa ön ek eşleşmesi de kabul: "bakar" → Bakara.
  const prefixed = SURAHS.filter(
    (surah) =>
      foldTurkish(surah.name).startsWith(folded) ||
      (surah.alt !== undefined && foldTurkish(surah.alt).startsWith(folded)),
  );
  return prefixed.length === 1 ? { surah: prefixed[0].no, verse } : null;
}

/** Tam adres ayrıştırır: ayet numarası yoksa ya da sınır dışıysa `null`. */
export function parseVerseRef(input: string): VerseRef | null {
  const query = parseSurahQuery(input);
  if (!query || query.verse === null) return null;
  const ref = { surah: query.surah, verse: query.verse };
  return verseRefIssue(ref) ? null : ref;
}

/** Adres geçerli mi? Değilse hangi parçasının bozuk olduğu. */
export function verseRefIssue(ref: VerseRef): "surah" | "verse" | null {
  const surah = surahByNo(ref.surah);
  if (!surah) return "surah";
  if (!Number.isInteger(ref.verse) || ref.verse < 1 || ref.verse > surah.verses) return "verse";
  return null;
}

/** Sure adına göre arama (editördeki liste). Numara yazıldıysa o sure önce. */
export function searchSurahs(query: string, limit = 8): SurahEntry[] {
  const folded = foldTurkish(query);
  if (!folded) return SURAHS.slice(0, limit);
  const byNumber = /^\d{1,3}$/.test(folded) ? surahByNo(Number(folded)) : null;
  const scored = SURAHS.flatMap((surah) => {
    if (byNumber && surah.no === byNumber.no) return [{ surah, score: 0 }];
    const name = foldTurkish(surah.name);
    const alt = surah.alt ? foldTurkish(surah.alt) : "";
    if (name.startsWith(folded) || (alt && alt.startsWith(folded))) return [{ surah, score: 1 }];
    if (name.includes(folded) || (alt && alt.includes(folded))) return [{ surah, score: 2 }];
    return [];
  });
  return scored
    .sort((a, b) => a.score - b.score || a.surah.no - b.surah.no)
    .slice(0, limit)
    .map((entry) => entry.surah);
}

/**
 * Uzun metni kelime sınırında keser ve sonuna üç nokta koyar. Editördeki
 * arama sonucu satırlarında ve ekran okuyucu etiketlerinde kullanılır.
 *
 * KARTTA KULLANILMAZ: ayet metni kartta kısaltılmaz, kaydırılır. Kutsal
 * metnin ortasından "…" ile kesmek bir tasarım tercihi değil, anlamı
 * değiştiren bir müdahale olurdu (bkz. `.ayet-body`, app.css).
 */
export function truncateVerse(text: string, max: number): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (max <= 0) return "";
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  // Boşluksuz uzun bir dize (ör. tek kelimelik Arapça parça) kelime sınırına
  // düşemez; o hâlde ham kesim kullanılır, yoksa metin bütünüyle kaybolurdu.
  const body = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${body.trimEnd()}…`;
}
