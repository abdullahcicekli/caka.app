/**
 * og:image saf yardımcıları — bayt parser'ları ve içerik hash'i.
 *
 * Bu modül uygulama bağımlılığı taşımaz (Worker binding'i, Vite importu yok);
 * `apps/web/server/og-image.ts` üretimde kullanır, testler burada koşar.
 * Neden shared: `immutable` cache + yanlış hash kalıcı hasar demek — bu
 * fonksiyonların vitest kapsamında olması gerekiyor (vitest yalnız burada).
 */
import type { OgTemplate } from "./og-template";

export interface ImageSize {
  width: number;
  height: number;
}

/**
 * Kaynak görsel piksel tavanı (~40 MP). Satori/resvg kaynak görseli RGBA'ya
 * açar: 40 MP ≈ 160 MB — Worker isolate'inin taşıyabileceği üst sınır.
 * Üstü, yakalanamayan OOM ile isolate'i öldürür; asla raster'a verilmemeli.
 */
export const OG_IMAGE_MAX_SOURCE_PIXELS = 40_000_000;

/**
 * Boyutu başlıktan OKUNAMAYAN görseller için temkinli bayt tavanı: parser'ın
 * çözemediği dosyada piksel sayısını bilemeyiz; 1 MiB üstünü kullanma.
 */
export const OG_IMAGE_MAX_UNPARSED_BYTES = 1024 * 1024;

/**
 * Kaynak görsel raster'a verilebilir mi? Boyut biliniyorsa piksel tavanına,
 * bilinmiyorsa bayt tavanına bakar. `false` → görseli kullanma (şablon
 * görselsiz dalına düşer), isteği reddetme.
 */
export function isOgSourceImageSafe(size: ImageSize | null, byteLength: number): boolean {
  if (size) return size.width * size.height <= OG_IMAGE_MAX_SOURCE_PIXELS;
  return byteLength <= OG_IMAGE_MAX_UNPARSED_BYTES;
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/**
 * PNG başlığından boyut. İmza + ilk chunk'ın IHDR olduğu doğrulanır;
 * genişlik/yükseklik IHDR verisinde BE32'dir (offset 16/20).
 */
export function pngSize(bytes: Uint8Array): ImageSize | null {
  if (bytes.length < 24) return null;
  for (let i = 0; i < PNG_SIGNATURE.length; i++) {
    if (bytes[i] !== PNG_SIGNATURE[i]) return null;
  }
  // Chunk tipi (offset 12-15) "IHDR" olmalı.
  if (
    bytes[12] !== 0x49 || // I
    bytes[13] !== 0x48 || // H
    bytes[14] !== 0x44 || // D
    bytes[15] !== 0x52 // R
  ) {
    return null;
  }
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = dv.getUint32(16);
  const height = dv.getUint32(20);
  if (width === 0 || height === 0) return null;
  return { width, height };
}

/**
 * JPEG boyutu: segmentler taranıp ilk SOFn başlığından okunur.
 * 0xFF dolgu baytları (marker öncesi padding) ve 0xFF00 stuffing'i atlanır.
 */
export function jpegSize(bytes: Uint8Array): ImageSize | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2; // 0xFFD8 (SOI) sonrası
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1] ?? 0;
    if (marker === 0xff) {
      // Dolgu baytı: bir sonraki 0xFF gerçek marker başlangıcı olabilir.
      offset += 1;
      continue;
    }
    if (marker === 0x00) {
      // Entropi verisinde 0xFF00 stuffing — marker değil.
      offset += 2;
      continue;
    }
    // Uzunluk alanı olmayan bağımsız marker'lar: TEM (0x01), RSTn/SOI/EOI (0xD0–0xD9).
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      offset += 2;
      continue;
    }
    const length = dv.getUint16(offset + 2);
    if (length < 2) return null; // bozuk segment; sonsuz döngüye girme
    const isSof =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      const height = dv.getUint16(offset + 5);
      const width = dv.getUint16(offset + 7);
      if (width === 0 || height === 0) return null;
      return { height, width };
    }
    offset += 2 + length;
  }
  return null;
}

/** Hash'e ve şablona girecek profil içeriği. */
export interface OgProfileData {
  template: OgTemplate;
  name: string;
  title: string;
  username: string;
  /** p1/p4 fotoğrafı: ilk görsel bloğu, yoksa avatar (yüksek çözünürlük tercihi). */
  photoAssetId: string | null;
  avatarAssetId: string | null;
  linkTitles: string[];
}

/**
 * İçerik özeti: 8 bayt (16 hex) SHA-256 öneki. Girdi JSON dizisi olarak
 * normalize edilir (alan sırası sabit) — aynı içerik her zaman aynı hash.
 */
export async function computeOgHash(data: OgProfileData): Promise<string> {
  const payload = JSON.stringify([
    data.template,
    data.name,
    data.title,
    data.username,
    data.photoAssetId,
    data.avatarAssetId,
    data.linkTitles,
  ]);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(payload),
  );
  return [...new Uint8Array(digest).slice(0, 8)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function ogImagePath(username: string, hash: string): string {
  return `/og/u/${username}/${hash}.png`;
}
