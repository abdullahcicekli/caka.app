<p align="center">
  <img src="apps/web/app/assets/brand/logo-black-text.png" alt="Caka" width="160" />
</p>

<p align="center">
  <b>Sana göre bir bio linki.</b><br />
  Instagram, TikTok, YouTube ve diğer profillerindeki tek link; paylaştığın,
  ürettiğin ve sattığın her şeyi bir araya getirsin.
</p>

<p align="center">
  <a href="https://caka.app">caka.app</a> ·
  <a href="#kurulum">Kurulum</a> ·
  <a href="#katkıda-bulunma">Katkı</a> ·
  <a href="AGENTS.md">Agent rehberi</a>
</p>

---

## Caka nedir?

Caka, `caka.app/kullaniciadi` adresinde yayınlanan, bento-grid tarzı sürükle-bırak
bloklarla düzenlenen bir **link-in-bio** sayfası kurar. Klasik alt alta link
listesi değil; projelerini, sosyal hesaplarını ve iletişim bilgilerini tek
ekranda toplayan gerçek bir "sayfa". Google ile tek tıkla kayıt, kod yazmadan
dakikalar içinde yayında. Açık kaynaklıdır ve tamamen Cloudflare üzerinde çalışır.

### MVP kapsamı

- ✅ Adres-önce onboarding: adresini seç → Google/Apple ile kaydol → sayfan yayında
- ✅ Google + Apple girişi (Better Auth), oturum ve hesap yönetimi
- ✅ Public profil sayfası (SSR), adres değişikliğinde 30 gün yönlendirme
- ✅ Marka tasarım sistemi (Satoshi, token'laşmış palet, shadcn/ui)
- 🚧 Grid editör (blok ekleme/sürükleme/boyutlandırma) — geliştiriliyor
- 🚧 Görsel yükleme blokları, üç tema (`light`/`dark`/`paper`), dinamik og:image
- Yol haritasının tamamı: [`docs/plans/`](docs/plans/)

## Teknoloji

| Katman | Seçim |
|---|---|
| Çalışma ortamı | Cloudflare Workers (tek Worker) |
| Backend router | [Hono](https://hono.dev) — `/api/*`, `/i/*`, og:image |
| SSR / UI | React Router v8 (framework mode) + React 19 |
| Veritabanı | Cloudflare D1 + Drizzle ORM |
| Depolama | Cloudflare R2 (görseller/avatarlar) |
| Kimlik | Better Auth (Google + Apple, şifresiz) |
| Stil | Tailwind CSS v4 + shadcn/ui, Satoshi (Fontshare) |
| Monorepo | pnpm workspaces |

Mimari kararların gerekçeleri için [`ARCHITECTURE.md`](ARCHITECTURE.md) ve
[`docs/plans/2026-08-15-001-feat-caka-mvp-plan.md`](docs/plans/2026-08-15-001-feat-caka-mvp-plan.md).

## Proje yapısı

```
caka.app/
├─ apps/web/              # Tek Worker: Hono API + React Router SSR
│  ├─ app/                # Route'lar, bileşenler, içerik config'i, tasarım token'ları
│  │  ├─ components/      #   landing/, ui/ (shadcn), ikonlar
│  │  ├─ content/         #   landing.ts — tüm pazarlama metinleri tek yerde
│  │  └─ routes/          #   /, /onboarding, /login, /:username ...
│  ├─ server/             # Hono app, auth, profil/claim, avatar, R2 servis
│  ├─ workers/app.ts      # Worker girişi: Hono ↔ React Router dispatch
│  └─ wrangler.jsonc      # D1/R2 binding'leri, custom domain
├─ packages/
│  ├─ shared/             # Saf kurallar: username doğrulama, rezerve liste (+testler)
│  ├─ ui/                 # Paylaşılan blok bileşenleri & tema token'ları (büyüyor)
│  └─ db/                 # Drizzle şeması + migrations/
└─ docs/plans/            # Uygulama planı (tek kaynak yol haritası)
```

## Kurulum

### Gereksinimler

- **Node.js ≥ 22.22** ve **pnpm ≥ 10** (`corepack enable` yeterli)
- Ücretsiz bir [Cloudflare hesabı](https://dash.cloudflare.com/sign-up) (yalnızca deploy için)

### Adımlar

```bash
git clone https://github.com/<repo>/caka.app.git
cd caka.app
pnpm install

# Ortam değişkenleri
cp apps/web/.dev.vars.example apps/web/.dev.vars
# Google ile girişi denemek istiyorsan kendi OAuth client bilgini yaz;
# UI geliştirmesi için placeholder değerlerle de çalışır.

# Lokal D1 veritabanını kur (Miniflare, gerçek hesaba dokunmaz)
cd apps/web
pnpm exec wrangler d1 migrations apply caka-db --local
cd ../..

pnpm dev   # http://localhost:5173
```

> Google girişini lokalde test etmek için bir [OAuth client](https://console.cloud.google.com/apis/credentials)
> oluşturup redirect URI olarak `http://localhost:5173/api/auth/callback/google`
> ekleyin. Apple girişi localhost kabul etmediği için yalnızca canlıda çalışır.

### Komutlar

| Komut | Ne yapar |
|---|---|
| `pnpm dev` | Dev sunucusu (Vite + Miniflare: lokal D1/R2) |
| `pnpm typecheck` | Tüm workspace'te tip kontrolü |
| `pnpm test` | Vitest (şimdilik `packages/shared`) |
| `pnpm build` | Üretim build'i |
| `pnpm deploy` | Build + `wrangler deploy` (kendi Cloudflare hesabın) |

### Kendi Cloudflare hesabına deploy

```bash
cd apps/web
pnpm exec wrangler login
pnpm exec wrangler d1 create caka-db          # çıkan database_id'yi wrangler.jsonc'ye yaz
pnpm exec wrangler r2 bucket create caka-assets
pnpm exec wrangler d1 migrations apply caka-db --remote
pnpm exec wrangler secret put BETTER_AUTH_SECRET   # örn: openssl rand -base64 32
pnpm exec wrangler secret put GOOGLE_CLIENT_ID
pnpm exec wrangler secret put GOOGLE_CLIENT_SECRET
cd ../.. && pnpm deploy
```

`wrangler.jsonc`'deki `routes` (custom domain) ve `vars` bölümünü kendi
domainine/değerlerine göre güncelle. Apple girişi opsiyoneldir; kullanmayacaksan
`server/auth.ts`'ten apple provider'ını kaldırman yeterli.

## Katkıda bulunma

Katkılar memnuniyetle! Küçük düzeltmeler için doğrudan PR açabilirsin; büyük bir
değişiklikse önce bir issue açıp konuşalım.

1. Repo'yu fork'la, bir dal aç: `git checkout -b feat/ozellik-adi`
2. Değişikliğini yap; **`pnpm typecheck` ve `pnpm test` yeşil olmalı**
3. [Conventional Commits](https://www.conventionalcommits.org/tr/) kullan:
   `feat(scope): ...`, `fix(scope): ...`
4. PR aç ve ne değiştirdiğini kısaca anlat (ekran görüntüsü UI işlerinde çok işe yarar)

Bilinmesi gereken proje kuralları:

- **Yeni top-level route eklersen** `packages/shared/src/username.ts`'teki
  rezerve isim listesine de ekle — yoksa bir kullanıcı o adresi alıp route'u gölgeler.
- **Pazarlama metinleri** `apps/web/app/content/landing.ts`'te yaşar; bileşenlere
  metin gömme.
- **Renk/radius token'ları** `apps/web/app/app.css` içindeki `@theme` bloğunda —
  ham hex değerini bileşene yazma, token kullan (`bg-kirec`, `text-murekkep`…).
- **Migration'lar** `drizzle-kit generate` ile üretilir, elle SQL yazılmaz;
  `drizzle-orm`/`drizzle-kit` sürümleri bilinçli pinlidir, yükseltme PR'ı ayrı açılmalı.
- **Sır commit'leme:** gerçek anahtarlar yalnızca `apps/web/.dev.vars`
  (gitignore'da) ve `wrangler secret`'ta durur. `.dev.vars.example` yalnızca
  placeholder taşır.

AI ajanıyla (Claude, Codex, Cursor…) çalışıyorsan [`AGENTS.md`](AGENTS.md)
dosyası ajanın bilmesi gereken her şeyi içerir.

## Lisans

[MIT](LICENSE)
