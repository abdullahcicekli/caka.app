/**
 * Tıklama ölçüm ucu (R48). `/api/olcum` altına mount edilir.
 *
 * Sözleşme: istemci `navigator.sendBeacon` ile küçük bir JSON gönderir, uç
 * **her koşulda gövdesiz `204`** döner. Yanıtta ne çerez, ne gövde, ne de
 * istemcinin saklayabileceği bir kimlik vardır; ziyaretçinin cihazında hiçbir
 * iz bırakılmaz. Hata durumları da 204 döner: ölçüm ziyaretçinin sorunu
 * değildir ve geçersiz blok id'si bilgi sızdıran bir yanıt üretmemelidir.
 */
import { Hono } from "hono";
import { z } from "zod";

import {
  isTrackableBlockId,
  normalizeUsername,
  parseProfileLayout,
  validateUsername,
} from "@caka/shared";
import { recordLinkClick } from "./analytics";
import { getSession } from "./auth";
import { resolveUsername } from "./profile";
import { hasSameOrigin, readLimitedJson } from "./request";

const clickSchema = z.object({
  /** Profil adresi */
  u: z.string().max(64),
  /** Düzendeki blok id'si */
  b: z.string().max(64),
});

export const analyticsApi = new Hono<{ Bindings: Env }>();

/** Gövdesiz 204 — tek çıkış biçimi. */
const noContent = new Response(null, { status: 204 });

analyticsApi.post("/tiklama", async (c) => {
  // Origin başlığı varsa kendi kaynağımız olmalı; yabancı sayfalardan
  // gönderilen istekler sayaca dokunamaz.
  const origin = c.req.header("Origin");
  if (origin && !hasSameOrigin(c.req.raw)) return noContent.clone();

  try {
    const parsed = clickSchema.safeParse(await readLimitedJson(c.req.raw, 1024));
    if (!parsed.success) return noContent.clone();

    const username = normalizeUsername(parsed.data.u);
    if (!validateUsername(username).ok) return noContent.clone();

    const resolved = await resolveUsername(c.env, username);
    if (resolved.kind !== "profile") return noContent.clone();

    // Blok id'si YAYINDAKİ düzende gerçekten tıklanabilir bir blok olmalı.
    // Uydurma id'lerle tablo şişirilemez, silinmiş bloklar diriltilemez.
    const layout = parseProfileLayout(resolved.profile.layout);
    if (!layout || !isTrackableBlockId(layout, parsed.data.b)) {
      return noContent.clone();
    }

    // Sahip kendi bağlantısına tıkladığında sayaç şişmesin (görüntülenmeyle
    // aynı kural). Oturum okuması yalnızca bu ayrım için yapılır.
    const session = await getSession(c.env, c.req.raw);
    if (session?.user.id === resolved.profile.userId) return noContent.clone();

    recordLinkClick(c.env, c.req.raw, {
      profileId: resolved.profile.id,
      blockId: parsed.data.b,
    });
  } catch {
    // Gövde çok büyük / bozuk JSON / D1 hatası — hepsi sessizce yutulur.
  }

  return noContent.clone();
});
