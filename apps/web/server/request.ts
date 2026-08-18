const textDecoder = new TextDecoder();

export function hasSameOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}

/**
 * İstek BAŞKA bir kökenden mi geliyor? `hasSameOrigin`'in GET karşılığı.
 *
 * Neden ayrı: tarayıcılar aynı köken GET isteklerinde `Origin` başlığı
 * GÖNDERMEZ (yalnız çapraz kökenli isteklerde ve GET/HEAD dışı metotlarda).
 * `hasSameOrigin`'i bir GET ucuna koymak editörün kendi çağrılarını
 * kırardı. Bu yüzden kural tersine çevrildi: başlık YOKSA geç, VARSA ve
 * tutmuyorsa reddet. Başka bir sitenin sayfasından yapılan `fetch` böylece
 * elenir; sunucudan atılan başlıksız istek elenmez — onun için oturum
 * kontrolü ve (henüz yok) hız sınırı var.
 */
export function isCrossOriginRequest(request: Request): boolean {
  const origin = request.headers.get("Origin");
  return Boolean(origin && origin !== new URL(request.url).origin);
}

export async function readLimitedBody(
  request: Request,
  limit: number,
): Promise<Uint8Array | null> {
  const declared = Number(request.headers.get("Content-Length") ?? 0);
  if (declared > limit) return null;
  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

export async function readLimitedJson(request: Request, limit: number): Promise<unknown> {
  const bytes = await readLimitedBody(request, limit);
  if (!bytes) throw new Error("body_too_large");
  return JSON.parse(textDecoder.decode(bytes));
}
