import { Hono } from "hono";

import { asset, createDb } from "@caka/db";
import {
  DOCUMENT_CONTENT_TYPE,
  DOCUMENT_FALLBACK_FILE_NAME,
  DOCUMENT_MAX_BYTES,
  assetQuotaIssue,
  isPdfBytes,
  sanitizeDocumentFileName,
} from "@caka/shared";
import { readAssetUsage } from "./assets";
import { getSession } from "./auth";
import { hasSameOrigin, readLimitedBody } from "./request";
import { appCatalog } from "../app/content/app";
import { localeFromRequest } from "./locale";

/**
 * Belge yükleme ucu — POST /api/belge (R16 kotası altında, avatar ucuyla aynı
 * disiplin). Gövde ham dosyadır; dosya adı `X-Caka-File-Name` başlığında
 * yüzde-kodlu gelir.
 *
 * NEDEN multipart değil: `formData()` gövdenin tamamını belleğe alır ve
 * `readLimitedBody`'nin AKIŞ SIRASINDA kesen tavanını devre dışı bırakırdı —
 * `Content-Length` yalan söyleyebilir, akış tavanı söyleyemez. Aynı gerekçe
 * avatar ucunda da var; iki uç aynı deseni izliyor.
 */
export const documentApi = new Hono<{ Bindings: Env }>();

/** Başlıktaki yüzde-kodlu adı çözer; bozuk kodlamada ham değere düşer. */
function decodeFileNameHeader(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

documentApi.post("/", async (c) => {
  const app = appCatalog[localeFromRequest(c.req.raw)].api;
  if (!hasSameOrigin(c.req.raw)) {
    return c.json({ error: app.origin }, 403);
  }
  const session = await getSession(c.env, c.req.raw);
  if (!session) return c.json({ error: "Oturum gerekli" }, 401);

  // İSTEMCİNİN SÖYLEDİĞİ TÜR TEK BAŞINA YETMEZ; burada yalnızca ucuz bir ön
  // eleme. Asıl karar aşağıdaki sihirli bayt kontrolünde (`isPdfBytes`).
  const declaredType = (c.req.header("Content-Type") ?? "").split(";")[0]?.trim() ?? "";
  if (declaredType !== DOCUMENT_CONTENT_TYPE) {
    return c.json({ error: app.documentOnlyPdf }, 400);
  }

  const bytes = await readLimitedBody(c.req.raw, DOCUMENT_MAX_BYTES);
  if (!bytes) return c.json({ error: app.documentTooLarge }, 413);
  if (!isPdfBytes(bytes)) return c.json({ error: app.documentTypeUnverified }, 400);

  const fileName =
    sanitizeDocumentFileName(decodeFileNameHeader(c.req.header("X-Caka-File-Name") ?? "")) ||
    DOCUMENT_FALLBACK_FILE_NAME;

  // R16 kotası R2'ye yazmadan ÖNCE (reddedilen yükleme nesne bırakmasın;
  // silme Değişmez #9 gereği yalnız hesap silmede yapılıyor).
  const quota = assetQuotaIssue(
    await readAssetUsage(c.env, session.user.id),
    bytes.byteLength,
  );
  if (quota) return c.json({ error: app.quota[quota] }, 403);

  const id = crypto.randomUUID();
  // Anahtar düz UUID (Değişmez #9); dosya adı NESNE METADATA'SINDA durur.
  // İndirmenin `Content-Disposition` adı buradan okunur — düzenden değil:
  // düzeni istemci yazıyor, indirme başlığı ise sunucunun bildiği addır.
  await c.env.BUCKET.put(id, bytes, {
    httpMetadata: { contentType: DOCUMENT_CONTENT_TYPE },
    customMetadata: { fileName },
  });
  const uploadedAt = Date.now();
  try {
    await createDb(c.env.DB).insert(asset).values({
      id,
      userId: session.user.id,
      contentType: DOCUMENT_CONTENT_TYPE,
      size: bytes.byteLength,
    });
  } catch (error) {
    await c.env.BUCKET.delete(id);
    console.error(
      JSON.stringify({ message: "document insert failed", error: String(error) }),
    );
    return c.json({ error: app.documentSaveFailed }, 500);
  }
  return c.json({ id, fileName, bytes: bytes.byteLength, uploadedAt, url: `/b/${id}` });
});
