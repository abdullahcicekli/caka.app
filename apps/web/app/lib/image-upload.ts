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
/** JPEG kalitesi. 0,85: 0,82 ile arasındaki 60 KB, gözle görülür bant
 *  farkına değmiyor; 0,90 ise %24 daha ağır ve fark yok. */
export const UPLOAD_JPEG_QUALITY = 0.85;

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

/**
 * Dosyayı yüklemeye hazırlar. Küçültemediği ya da küçültmenin kazandırmadığı
 * her durumda GİRDİYİ AYNEN döner — çağıran taraf sonucu koşulsuz kullanır.
 */
export async function prepareImageForUpload(file: File): Promise<File> {
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
    const scale = Math.min(1, UPLOAD_MAX_EDGE / longest);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);

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
    if (blob.size >= file.size) return file;
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
