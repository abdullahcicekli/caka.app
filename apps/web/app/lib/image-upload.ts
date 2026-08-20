/**
 * Yüklemeden ÖNCE tarayıcıda küçültme.
 *
 * NEDEN VAR (ölçüldü, 2026-08-20): telefondan çekilen fotoğraf ham hâliyle
 * R2'ye gidiyor ve profil sayfasında tam çözünürlükte servis ediliyordu.
 * Canlı bir sayfada tek tek 4,2 MB · 4,1 MB · 2,7 MB · 2,2 MB'lık dört
 * fotoğraf vardı — toplam 13,3 MB. Edge önbelleği R2 gecikmesini kesiyor
 * ama baytları kesmiyor; mobil veride açılış yine dakikalara yaklaşıyordu.
 *
 * UZUN KENAR TAVANI 1600px. Kartın çizildiği en geniş kutu masaüstünde 8
 * birim = 748 CSS px; DPR 2'de 1496px eder. Telefonda kart en fazla 350 CSS
 * px, DPR 3'te 1050px. Yani 1600 her cihazda kartın istediğinden geniş, ama
 * ham fotoğrafın (tipik 4032px) dörtte biri — ve kazanç PİKSEL SAYISINDA,
 * yani 6,3 katında.
 *
 * BİÇİM KORUNUR: jpeg → jpeg, png → png. WebP denendi ve BİLEREK SEÇİLMEDİ:
 * og:image üreticisi (satori → resvg) yalnız png ve jpeg çözüyor
 * (`SATORI_IMAGE_TYPES`, server/og-render.ts), yani webp'e geçen bir profil
 * fotoğrafı paylaşım kartından sessizce düşerdi. Ölçüm de webp'i zorunlu
 * kılmadı: 1600×1200'de webp q0,82 = 659 KB, jpeg q0,85 = 633 KB. Asıl
 * kazanç biçimde değil ölçüde.
 *
 * TEK İSTİSNA: saydamlığı OLMAYAN bir png jpeg olarak kodlanır. PNG kayıpsız
 * olduğu için 1600px'lik bir fotoğraf png'de megabaytlarda kalıyor; ekran
 * görüntüsünü png diye kaydeden kullanıcı bunu bilmek zorunda değil.
 * Saydamlığı olan png png kalır — jpeg'e çevirmek saydam alanları siyaha
 * boyardı.
 *
 * GÜVENLİ TARAF: her adım başarısız olabilir (kod çözücü HEIC'i açamaz, eski
 * bir tarayıcı kodlayamaz, kodlanmış hâli orijinalden büyük çıkabilir).
 * Hepsinde ORİJİNAL DOSYA olduğu gibi dönüyor — küçültme bir iyileştirme,
 * bir kapı değil.
 *
 * YAN FAYDA: canvas'tan yeniden kodlanan görsel EXIF taşımaz. Ham fotoğrafın
 * GPS koordinatı ve cihaz modeli artık sayfaya çıkmıyor.
 */

/** Küçültülmüş görselin uzun kenar tavanı. */
export const UPLOAD_MAX_EDGE = 1600;
/**
 * AVATAR tavanı — kart fotoğrafından ayrı, çünkü avatar hiçbir yerde büyük
 * gösterilmiyor. Ölçülen en büyük kullanım og şablonundaki 140px
 * (`server/og-templates.ts`); ötekiler 64px (kart), 96px (paylaşım kartı),
 * 112px (kimlik satırı ve kurulum). 140 × 2 DPR = 280, yani 512 rahat bir
 * tavan. 1600 avatar için ~5,7 kat fazlaydı ve doğrudan asset kotasını
 * (R16: 50 asset / 100 MB) yiyordu.
 */
export const AVATAR_MAX_EDGE = 512;
/** JPEG kalitesi. 0,85: 0,82 ile arasındaki 60 KB, gözle görülür bant
 *  farkına değmiyor; 0,90 ise %24 daha ağır ve fark yok. */
export const UPLOAD_JPEG_QUALITY = 0.85;

/**
 * Kare kırpmada dikey pencerenin nereden alınacağı (0 = tepe, 0,5 = merkez).
 *
 * NEDEN MERKEZ DEĞİL: avatar her yerde `object-fit: cover` ile yuvarlak
 * gösteriliyor (`components/profile-avatar.tsx`, og tarafında da aynı).
 * Portre bir fotoğrafta merkezden kare almak yüzü değil gövdeyi seçiyor —
 * baş kesiliyor. Üçte bir, yüz algılama olmadan yapılabilecek en iyi
 * yaklaşım; garanti değil ama portrede belirgin biçimde daha isabetli.
 */
const SQUARE_CROP_TOP_BIAS = 1 / 3;

/** Küçültme denenecek kaynak türleri; ötekiler dokunulmadan geçer. */
const DECODABLE = new Set(["image/jpeg", "image/png"]);

/** Uzantıyı hedef türe göre düzeltir; adın geri kalanına dokunmaz. */
function renamed(name: string, type: string): string {
  const base = name.replace(/\.[^./\\]*$/, "") || "gorsel";
  return `${base}.${type === "image/png" ? "png" : "jpg"}`;
}

/** Tuvalde saydam piksel var mı? Yalnız png kaynaklarda sorulur. */
function hasAlpha(context: CanvasRenderingContext2D, width: number, height: number): boolean {
  const { data } = context.getImageData(0, 0, width, height);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 255) return true;
  }
  return false;
}

export type PrepareImageOptions = {
  /** Uzun kenar tavanı. Varsayılan `UPLOAD_MAX_EDGE`. */
  maxEdge?: number;
  /**
   * Kaynaktan KARE kırp (avatar). Kırpma penceresi yatayda ortalanır,
   * dikeyde `SQUARE_CROP_TOP_BIAS` kadar yukarı çekilir. Çıktı `maxEdge`
   * kenarlı bir karedir; kaynak ondan küçükse büyütülmez.
   */
  square?: boolean;
};

/**
 * Dosyayı yüklemeye hazırlar. Küçültemediği ya da küçültmenin kazandırmadığı
 * her durumda GİRDİYİ AYNEN döner — çağıran taraf sonucu koşulsuz kullanır.
 *
 * TEK İSTİSNA `square`: orada kırpma işin kendisi, ölçü kazancı değil. Kare
 * çıktı orijinalden büyük çıksa bile kullanılır — yoksa avatar dikdörtgen
 * kalır ve her tüketici (kart, og, paylaşım kartı) onu kendi kırpar, üç
 * yerde üç farklı kadraj doğardı.
 */
export async function prepareImageForUpload(
  file: File,
  options: PrepareImageOptions = {},
): Promise<File> {
  const maxEdge = options.maxEdge ?? UPLOAD_MAX_EDGE;
  const square = options.square ?? false;
  if (!DECODABLE.has(file.type)) return file;
  if (typeof createImageBitmap !== "function") return file;
  let bitmap: ImageBitmap;
  try {
    // `from-image`: EXIF'te "90° döndür" yazan telefon fotoğrafı canvas'a
    // düz çizilirse yan yatardı. Kod çözücü döndürmeyi kendisi uyguluyor.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }
  try {
    const longest = Math.max(bitmap.width, bitmap.height);
    if (longest === 0) return file;

    // Kaynaktan okunacak pencere. Kare modda kısa kenar boyunda bir kare,
    // yoksa görselin tamamı.
    const side = Math.min(bitmap.width, bitmap.height);
    const sourceW = square ? side : bitmap.width;
    const sourceH = square ? side : bitmap.height;
    const sourceX = square ? Math.round((bitmap.width - side) / 2) : 0;
    const sourceY = square ? Math.round((bitmap.height - side) * SQUARE_CROP_TOP_BIAS) : 0;

    const scale = Math.min(1, maxEdge / (square ? side : longest));
    const width = Math.max(1, Math.round(sourceW * scale));
    const height = Math.max(1, Math.round(sourceH * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return file;
    context.drawImage(bitmap, sourceX, sourceY, sourceW, sourceH, 0, 0, width, height);

    // JPEG'de saydamlık zaten yok; sorgu yalnız png için anlamlı.
    const type =
      file.type === "image/png" && hasAlpha(context, width, height)
        ? "image/png"
        : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, type, UPLOAD_JPEG_QUALITY),
    );
    // Kodlayıcı istediğimiz türü veremediyse orijinali gönder: yanlış türü
    // doğru diye göndermek sunucudaki magic-byte kapısında zaten patlardı.
    if (!blob || blob.type !== type) return file;
    // Küçülmediyse dokunma: zaten optimize edilmiş bir görseli yeniden
    // kodlamak bazen büyütüyor ve kalite de bedava kaybedilmiş olurdu.
    // Kare modda bu kural GEÇERSİZ — orada amaç kadraj, bayt değil.
    if (!square && blob.size >= file.size) return file;
    return new File([blob], renamed(file.name, type), {
      type,
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  } finally {
    bitmap.close();
  }
}
