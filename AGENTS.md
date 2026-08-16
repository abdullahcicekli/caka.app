# AGENTS.md — Caka için ajan rehberi

Bu repo tek Cloudflare Worker'da çalışan bir link-in-bio uygulamasıdır
(Hono API + React Router v8 SSR, D1 + Drizzle, R2, Better Auth). Ürün dili
**Türkçe**dir: kullanıcıya görünen her metin Türkçe yazılır.

## Komutlar

| Komut | Not |
|---|---|
| `pnpm dev` | Vite + Miniflare (lokal D1/R2); port 5173 doluysa 5174'e kayar |
| `pnpm typecheck` | Her değişiklikten sonra çalıştır; temiz olmalı |
| `pnpm test` | Vitest (`packages/shared`) |
| `pnpm deploy` | Build + `wrangler deploy` → caka.app. `pnpm --filter @caka/web run deploy` ile aynı; **`run` sözcüğü şart** (pnpm'in rezerve `deploy` komutu script'i gölgeler) |
| `pnpm exec wrangler d1 migrations apply caka-db --local` | `apps/web` içinden; şema değişince |
| `pnpm exec wrangler types` | `wrangler.jsonc` değişince Env tiplerini yeniden üret |

## Karar kaynakları

- Yol haritası ve gerekçeler: `docs/plans/2026-08-15-001-feat-caka-mvp-plan.md`
  (R/KTD/U kimlikleri oradan gelir). Plan gövdesine ilerleme/durum YAZMA;
  ilerleme git'ten türetilir.
- Mimari özet: `ARCHITECTURE.md`. Çelişki görürsen plan kazanır.

## Değişmezler (bozma)

1. **Rezerve isimler ↔ route'lar senkron:** Yeni bir top-level route eklediğinde
   `packages/shared/src/username.ts` içindeki `RESERVED_USERNAMES`'e ekle.
   `app/routes.ts`'te uygulama route'ları her zaman `:username` catch-all'undan
   önce durur.
2. **Sürüm pinleri:** `drizzle-orm@0.45.2` / `drizzle-kit@0.31.5` /
   `better-auth@1.6.28` bilinçli pinlidir. Drizzle v1 RC'ye GEÇME — klasörlü
   migration çıktısı `wrangler d1 migrations apply` ile uyumsuz. Better Auth
   yükseltmesi yapılırsa Google girişi elle smoke-test edilmeli.
3. **Migration'lar** yalnızca `drizzle-kit generate` ile üretilir
   (`packages/db/migrations/`, düz `.sql`); elle SQL dosyası ekleme.
4. **Tasarım token'ları** `apps/web/app/app.css` `@theme` bloğundadır
   (`zemin, murekkep, kirec, mavi, cam, kum, erik, mor, sinir` + türetilmiş
   `kirec-koyu`, `mor-acik`). Bileşenlere ham hex yazma; yeni renk gerekiyorsa
   önce token ekle. Radius: kılavuz 8/12/16 → `rounded-lg/xl/2xl`.
5. **İçerik/görünüm ayrımı:** Landing metin ve linkleri
   `apps/web/app/content/landing.ts`'te; bileşenlere metin gömme.
6. **Sır disiplini:** Gerçek anahtarlar yalnızca `apps/web/.dev.vars`
   (gitignore'da) ve `wrangler secret`'ta. `.dev.vars.example`'a asla gerçek
   değer yazma. Secrets: `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID/SECRET`,
   `APPLE_PRIVATE_KEY`. Kod içinde loglara token/PII yazma.
7. **Auth kimliği** provider `sub`'ına bağlıdır; e-posta tabanlı account
   linking kapalıdır (`server/auth.ts`) — açma.
8. **Kullanıcı URL'leri** yalnız `http(s)` şemasıyla; kullanıcı metni meta'ya
   React Router meta API'si dışında bir yolla (string `<head>`,
   `dangerouslySetInnerHTML`) basılmaz.
9. **R2 anahtarları** düz UUID'dir (`asset.id` = R2 key); path segmentli anahtar
   üretme. Asset silme yalnızca hesap silmede yapılır.
10. **Adres değişikliği semantiği:** eski adres 30 gün 302 yönlendirir ve
    kilitlidir (`username_redirect`). 301 KULLANMA (tarayıcı süresiz cache'ler).

## Sık yapılan işler

- **Yeni sayfa/route:** `app/routes.ts`'e `:username`'den önce ekle + rezerve
  listeye ekle + gerekiyorsa footer/nav linkini `content/landing.ts`'te güncelle.
  Public pazarlama sayfalarına `SiteFooter` eklenir; `/:username` sayfalarına eklenmez.
- **DB değişikliği:** `packages/db/src/schema.ts` → `apps/web` içinde
  `pnpm exec drizzle-kit generate --name <ad>` → `--local` ve `--remote` apply.
- **Loader'da env:** `import { env } from "cloudflare:workers"`; sunucu yardımcıları
  `apps/web/server/`'da yaşar (route dosyasına iş mantığı yazma).
- **Oturum okuma:** `getSession(env, request)` (`server/auth.ts`);
  profil işlemleri `server/profile.ts`.

## Doğrulama beklentisi

Değişiklik sonrası asgari: `pnpm typecheck` + `pnpm test` yeşil; davranış
değiştiyse ilgili akış lokalde (`pnpm dev`) veya deploy sonrası curl/smoke ile
doğrulanır. Deploy `main`'den yapılır; commit mesajları Conventional Commits.
