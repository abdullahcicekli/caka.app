# Caka — Mimari (MVP)

> Bento-tarzı grid editörlü link-in-bio: `caka.app/kullaniciadi`
> Kısıtlar: tamamen Cloudflare, pnpm monorepo, Hono backend, SSR (SEO + og:image kritik), shadcn/ui, D1 + R2 + Better Auth.

## 1. Genel yaklaşım

Tek bir Cloudflare Worker, iki işi birden yapar:

- **`/api/*`** → Hono route'ları (auth, profil CRUD, upload, og-image)
- **diğer her şey** → React Router v8 (framework mode) SSR handler'ı

Hono, Worker'ın kök router'ıdır; React Router handler'ı fallback olarak mount edilir.
Tek Worker = tek deploy, aynı D1/R2 binding'leri, cookie/session paylaşımı sorunsuz.

**SSR framework'ü neden React Router v8 (Remix'in devamı)?**
- shadcn/ui gerçek React + Radix ister → hono/jsx tabanlı HonoX elenir.
- React Router'ın Cloudflare Workers desteği birinci sınıf (`@cloudflare/vite-plugin`), Hono ile birlikte kullanımı yerleşik bir pattern; v8 (Haziran 2026) v7'nin düşük riskli devamı, greenfield doğrudan v8'den başlar.
- Loader/action modeli SSR + form akışları için D1'e doğrudan erişir (ekstra fetch katmanı yok).
- Alternatif TanStack Start henüz daha az olgun; ihtiyaç olursa geçiş, route katmanıyla sınırlı kalır.

## 2. Monorepo yapısı

```
caka.app/
├─ apps/
│  └─ web/                  # Tek Worker: Hono + RR7 SSR
│     ├─ app/               # RR7 route'ları (landing, editor, public profil…)
│     ├─ server/            # Hono app: api route'ları, auth mount, og-image
│     ├─ workers/entry.ts   # Worker entry: Hono → RR7 fallback
│     └─ wrangler.jsonc     # D1 + R2 binding'leri
├─ packages/
│  ├─ db/                   # Drizzle şeması + migration'lar (D1/SQLite)
│  ├─ ui/                   # shadcn bileşenleri, tema token'ları, Tailwind preset
│  └─ shared/               # Blok tipleri, Zod şemaları, sabitler (iki taraf da kullanır)
├─ pnpm-workspace.yaml
└─ turbo.json               # (opsiyonel, build orkestrasyonu)
```

Araçlar: **pnpm workspaces, TypeScript strict, Vite, Tailwind v4, Drizzle ORM + drizzle-kit (D1 migration), Zod** (API + blok içerik validasyonu), Vitest.

## 3. Veri modeli (D1 + Drizzle)

Better Auth kendi tablolarını yönetir: `user`, `session`, `account`, `verification`.

```
profile
  id            TEXT PK
  user_id       TEXT UNIQUE FK→user.id   (MVP: kullanıcı başına 1 profil)
  username      TEXT UNIQUE              (lowercase, [a-z0-9-], 3–30; rezerve liste kontrolü)
  theme         TEXT                     ('light' | 'dark' | 'paper')
  layout        TEXT (JSON)              (blok dizisi, aşağıda)
  created_at / updated_at

asset
  id            TEXT PK
  user_id       TEXT FK→user.id
  r2_key        TEXT UNIQUE
  content_type  TEXT
  size          INTEGER
  created_at
```

**Layout JSON** (`packages/shared`'da Zod ile tanımlı, hem editor hem SSR kullanır):

```jsonc
{
  "version": 1,
  "blocks": [
    {
      "id": "blk_x1",
      "type": "profile | link | image | social | status",
      "pos": { "lg": { "x": 0, "y": 0, "w": 2, "h": 2 },   // 4 kolonlu desktop grid
               "sm": { "x": 0, "y": 0, "w": 2, "h": 2 } }, // 2 kolonlu mobil grid
      "data": { /* tipe özel: title, url, platform, assetId, text… */ }
    }
  ]
}
```

Neden normalize `blocks` tablosu değil de JSON kolon: grid editör dokümanı **her zaman bütün olarak** kaydeder (tek `PUT /api/profile/layout`), satır-bazlı senkronizasyon derdi yok. Görsel bloklar R2'ye `assetId` ile referans verir; silme/temizlik `asset` tablosu üzerinden yapılır.

## 4. Auth (Better Auth + Google)

- Better Auth, Drizzle adapter ile D1 üzerinde; Hono'ya `/api/auth/*` olarak mount edilir.
- Tek provider: Google. Şifre akışı yok.
- Session: httpOnly cookie (Better Auth default'u). RR7 loader'ları `auth.api.getSession()` ile korunur.
- **Onboarding:** ilk girişte `profile` kaydı yoksa `/onboarding`'e yönlendir → kullanıcı adres seçer → benzersizlik `username` unique index + rezerve liste (tüm uygulama route'ları: `edit, onboarding, login, settings, api, i, og, assets, www, admin…` + kötüye kullanım terimleri; tek kaynak `packages/shared`) ile garanti edilir.
- Hesap silme: user + profile + session'lar D1'den, asset'ler R2'den (asset tablosundaki key'lerle), public sayfa cache'i purge.

## 5. Route haritası

| Route | Tip | Açıklama |
|---|---|---|
| `/` | SSR | Landing |
| `/login` | SSR | Google ile giriş butonu |
| `/onboarding` | SSR, korumalı | Adres (username) seçimi |
| `/edit` | SSR + client | Grid editör, canlı önizleme |
| `/settings` | SSR, korumalı | Adres değiştirme, hesap silme |
| `/:username` | SSR, public | Yayınlanan profil sayfası |
| `/api/auth/*` | Hono | Better Auth |
| `/api/profile` `/api/profile/layout` | Hono | CRUD (Zod validasyonlu) |
| `/api/upload` | Hono | Görsel yükleme → R2 |
| `/api/username-check` | Hono | Onboarding'de anlık benzersizlik kontrolü |
| `/i/:key` | Hono | R2'den görsel servis (immutable cache) |
| `/:username/og.png` | Hono | Dinamik og:image |

## 6. Public profil: SSR, SEO, og:image

- `/:username` loader'ı D1'den profili çeker, bloklar **statik CSS grid** olarak render edilir — public sayfada grid kütüphanesi/JS yükü yok, sadece içerik. Hızlı LCP, temiz SEO.
- Meta: `title` (isim — unvan), `description`, canonical, `og:title/description/image`, `twitter:card`.
- **og:image:** doğrudan satori + resvg-wasm ile isim + unvan + avatar'dan 1200×630 PNG (`workers-og` bakımsız kaldığı için kullanılmıyor); avatar R2 binding'den okunur, yanıt `max-age=3600` taşır.
- **Cache stratejisi:** MVP'de edge cache katmanı YOK — public sayfa her istekte D1'den okur (300–500 kullanıcıda D1 ücretsiz tier fazlasıyla yeter). Not: Workers Cache API `cache.delete()` yalnızca yerel colo'yu temizlediği için "kaydet = anında yayında" gereksinimiyle zaten uyumsuz; ileride cache gerekirse doğru araç `ctx.cache.purge()` (global purge API'si).
- 404: bilinmeyen username → kayıt CTA'lı sayfa ("bu adres boşta, kap!").

## 7. Grid editör

- **Kütüphane: `react-grid-layout`** — drag + resize + çakışma çözümü hazır; MVP'de custom dnd-kit implementasyonuna girmeye değmez.
- Grid: desktop `lg` = 4 kolon, mobil `sm` = 2 kolon; iki breakpoint'in yerleşimi ayrı saklanır (layout JSON'daki `pos.lg` / `pos.sm`).
- Editör state'i client'ta tutulur; kaydet → `PUT /api/profile/layout` (tam doküman, debounce'lu autosave).
- Canlı önizleme: public sayfayla **aynı blok render bileşenleri** (`packages/ui`) kullanılır — editörde gördüğün, yayınlanan sayfanın birebir aynısı.
- Blok tipleri (MVP): profil kartı, link kartı, görsel kartı, sosyal hesap kartı, durum/duyuru kartı. Her tipin `data` şeması `packages/shared`'da Zod ile tanımlı; yeni blok tipi eklemek = şema + render bileşeni + editör formu.

## 8. Tema

- Üç tema: `light`, `dark`, `paper`. Tamamı CSS custom property token'ları; `<html data-theme="paper">` ile uygulanır.
- shadcn token'ları (`--background`, `--foreground`, `--card`…) üç temaya map edilir → yerleşim sabit kalır, yalnızca renk/tipografi değişir (MVP gereksinimiyle birebir).
- Tema değişimi tek `PATCH` + cache purge.

## 9. Görsel yükleme (R2)

- Client → `POST /api/upload` (auth'lu, max ~5 MB, content-type whitelist) → Worker R2'ye yazar (`assets/{userId}/{ulid}`), `asset` kaydı açar, `/i/:key` URL'i döner.
- Servis: `/i/:key` → R2 get + `Cache-Control: public, max-age=31536000, immutable`.
- Blok/hesap silinince ilgili asset'ler R2'den temizlenir.

## 10. Ortamlar ve deploy

- **Lokal:** `wrangler dev` (Miniflare: lokal D1 + R2), Vite HMR.
- **Secrets:** `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID/SECRET` → `wrangler secret`; binding'ler `wrangler.jsonc`'de (`DB`: D1, `BUCKET`: R2).
- **Deploy:** GitHub Actions → `drizzle-kit` migration'ları D1'e uygula → `wrangler deploy`. Custom domain: `caka.app` Workers route.
- Observability: Workers Logs + `wrangler tail`; MVP için yeterli.

## 11. Ölçüm ve hukuki yüzey

Ziyaret ölçümü **Cloudflare Web Analytics** ile yapılır: zone genelinde otomatik
kurulum, beacon `static.cloudflareinsights.com`'dan gelir (`root.tsx`'e elle
script eklenmez) ve herkese açık profil sayfaları dâhil tüm sayfalarda çalışır.
Yapı gereği çerezsizdir — cihaza hiçbir şey yazmadığı prod'da gerçek tarayıcıda
doğrulandı — bu yüzden **rıza banner'ı yoktur ve gerekmez**; işleme KVKK
m.5/2-f meşru menfaate dayanır ve aydınlatma metninde o sebeple yazılıdır (rıza
gerekmemesi aydınlatma yükümlülüğünü kaldırmaz). Bedeli kabul edilmiştir: UTM
kampanya atıfı ve Google Ads bağlantısı yok. Hukuki taraf üç public route'tur
(`/gizlilik`, `/kullanim-kosullari`, `/cerez-politikasi`); üçü de ortak
`LegalPage` bileşeninden, `apps/web/app/content/legal/` altındaki veri
modüllerinden render edilir, belge başına `version` + `updatedAt` taşır ve
çerez tablosu `packages/shared/src/cookies.ts` envanterinden üretilir. Metinde
doldurulmamış bir köşeli parantez alanı kalırsa **placeholder kapısı sayfayı
prod'da 404'e düşürür**, lokalde uyarıyla render eder — yarım hukuki metin
yayına çıkamaz. Denetim kaydı ve açık alanlar: `docs/legal/`.

## 12. MVP sonrasına bilinçli ertelenenler

Analitik (Workers Analytics Engine hazır bekliyor), draft/publish ayrımı (layout'a `draft_layout` kolonu eklemek yeterli), çoklu sayfa, custom domain bağlama, ödeme. Şema ve cache katmanı bunlara engel çıkarmayacak şekilde kuruldu.
