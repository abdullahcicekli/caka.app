import { asset, createDb } from "@caka/db";

/**
 * Google profil fotoğrafını R2'ye kopyalar ve asset kaydı açar (R3/U5).
 * Güvenlik sınırları: yalnızca Google görsel host'ları, boyut tavanı,
 * magic-byte doğrulaması (R16 ile aynı sınıf). Hata durumunda null döner —
 * claim akışını asla durdurmaz; kart baş harflerle kalır.
 */

const ALLOWED_AVATAR_HOSTS = /(^|\.)googleusercontent\.com$/;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 5000;

function sniffImageType(bytes: Uint8Array): string | null {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if (
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  )
    return "image/png";
  if (
    bytes.length > 12 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  )
    return "image/webp";
  return null;
}

export async function copyGoogleAvatar(
  env: Env,
  userId: string,
  imageUrl: string,
): Promise<string | null> {
  try {
    const url = new URL(imageUrl);
    if (url.protocol !== "https:" || !ALLOWED_AVATAR_HOSTS.test(url.hostname)) {
      return null;
    }
    // Google varsayılanı küçük (s96) döner; daha yüksek çözünürlük iste.
    const upscaled = imageUrl.replace(/=s\d+(-c)?$/, "=s400-c");

    const res = await fetch(upscaled, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;

    const declared = Number(res.headers.get("Content-Length") ?? 0);
    if (declared > MAX_AVATAR_BYTES) return null;
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_AVATAR_BYTES) return null;

    const contentType = sniffImageType(new Uint8Array(buffer));
    if (!contentType) return null;

    const id = crypto.randomUUID();
    await env.BUCKET.put(id, buffer, { httpMetadata: { contentType } });
    await createDb(env.DB).insert(asset).values({
      id,
      userId,
      contentType,
      size: buffer.byteLength,
    });
    return id;
  } catch {
    return null;
  }
}
