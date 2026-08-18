# Veri haritası

Caka'nın gerçekten tuttuğu her veri kaleminin iç kaydı. `/gizlilik` §3, §4 ve
§7 bu tablodan yazıldı; ikisi çelişirse **kod ve bu dosya kazanır**, hukuki
metin düzeltilir.

**Kaynaklar (uydurulmadı, okundu):** `packages/db/src/schema.ts`,
`packages/db/src/auth-schema.ts`, `apps/web/wrangler.jsonc`,
`apps/web/server/github.ts`, `apps/web/server/og.ts`,
`apps/web/server/avatar.ts`, `packages/shared/src/cookies.ts`.
Bilinen uyum açıkları: `docs/legal/bilinen-aciklar.md`.

**Tarih:** 2026-08-17 · **Kapsam:** prod Worker `caka` (`caka.app`), D1 `caka-db`,
R2 `caka-assets`.

**Saklama süreleri hakkında genel not.** Aşağıda "Süre" sütununda yalnızca
koddan okunabilen teknik süreler yazılıdır. Kod dışındaki süreler artık
`/gizlilik` §7'deki tabloda yazılıdır ve orası tek gerçek kaynaktır: hesap
verisi, profil içeriği ve dosyalar kullanıcı silene kadar, silme talebinden
sonra **en geç 3 ay**; oturum kayıtları oturum bittikten sonra **en çok 90
gün**; destek yazışmaları kapanıştan sonra **en geç 3 ay**; Workers Logs
**en çok 30 gün** (süreyi Cloudflare belirler). Üç aylık süre Silme
Yönetmeliği **m.11/3**'ten gelir: VERBİS'ten muaf olduğumuz için yazılı imha
politikası ödevi doğmuyor, bu da altı aylık periyodik döngü yerine daha sıkı
olan üç aylık kuralı devreye sokuyor. Gerekçenin tamamı
`bilinen-aciklar.md`'dedir.

---

## 1. D1 tabloları

### `user` — hesap verisi (Better Auth)

| Kolon | Kişisel veri | Not |
|---|---|---|
| `id` | Dolaylı kimlik | Diğer tüm tabloların bağlandığı anahtar |
| `name` | Ad | Sağlayıcıdan gelir |
| `email` | E-posta adresi | `unique`; hesabın tekilliği buradan |
| `email_verified` | — | Boolean |
| `image` | Profil görseli adresi | Sağlayıcının URL'i (Google avatarı ayrıca R2'ye kopyalanır — `server/avatar.ts`) |
| `created_at` / `updated_at` | Zaman damgası | |

- **Amaç:** hesabın açılması ve sürdürülmesi.
- **Hukuki sebep:** KVKK m.5/2-c — sözleşmenin kurulması/ifası.
- **Nerede:** D1 `caka-db` (Cloudflare).
- **Süre:** hesap yaşadığı sürece. Hesap silmede `user` silinir; FK'ler
  `onDelete: cascade` olduğu için `profile`, `session`, `account`, `asset`
  satırları da düşer. Silme sonrası yedek saklama süresi **bilinmiyor**.

### `session` — oturum verisi ⚠️ işaretli

| Kolon | Kişisel veri |
|---|---|
| `id`, `token` | Oturum tanıtıcıları (`token` çerezle eşleşir) |
| `expires_at`, `created_at`, `updated_at` | Zaman damgaları |
| **`ip_address`** | **Ziyaretçinin IP adresi** |
| **`user_agent`** | **Tarayıcı ve işletim sistemi bilgisi** |
| `user_id` | Hesap bağı |

- **⚠️ Neden işaretli:** `ip_address` ve `user_agent` bu ürünün tuttuğu en
  kimliklendirici teknik verilerdir ve **Caka'nın kendi ürün ihtiyacından
  değil, Better Auth şemasının varsayılanından** gelir. Bugün hiçbir ürün
  özelliği bu iki kolonu okumuyor — "bu oturum nereden açıldı" gibi bir ekran
  yok. Yani veri minimizasyonu açısından açık bir karar noktasıdır: ya bir
  güvenlik amacına bağlanıp o amaçla kullanılır, ya da yazılmaması
  değerlendirilir.
- **Amaç:** oturumun sürdürülmesi; IP/UA bakımından güvenlik ve kötüye
  kullanımın tespiti.
- **Hukuki sebep:** oturum m.5/2-c; IP ve UA m.5/2-f (meşru menfaat —
  güvenlik). `/gizlilik` §4 bu ayrımı aynı biçimde yazıyor.
- **Süre:** 7 gün (`expires_at`; Better Auth `session.expiresIn` varsayılanı).
  Çıkışta daha erken silinir. **Süresi geçmiş satırların temizliği doğrulanmadı**
  — Better Auth'un kendi temizliğine bırakılmış durumda; bir cron/budama işi
  yazılmadı.

### `account` — kimlik sağlayıcı verisi ⚠️ karar noktası

| Kolon | Kişisel veri |
|---|---|
| `provider_id`, `account_id` | Sağlayıcı adı (google/apple) ve o sağlayıcıdaki `sub` |
| **`access_token`**, **`refresh_token`**, **`id_token`** | **Sağlayıcı token'ları — düz metin** |
| `access_token_expires_at`, `refresh_token_expires_at`, `scope` | Token meta verisi |
| `password` | Kullanılmıyor (şifre akışı yok — Değişmez #7) |

- **⚠️ Karar noktası — token'lar D1'de şifrelenmemiş duruyor.** Better Auth
  1.6.28 varsayılan davranışıdır ve bu kurulumda değiştirilmedi. Sonucu açık:
  D1 veritabanına okuma erişimi olan biri (yanlış yapılandırılmış bir binding,
  sızan bir API token'ı, ileride eklenecek bir admin sorgusu) kullanıcıların
  Google/Apple token'larını düz metin okuyabilir. Bunu bir bulgu olarak
  gizlemek yerine karar olarak kaydediyoruz:
  - **Bugünkü hafifletici:** verilen kapsam dar (yalnızca oturum açma; ek API
    izni istenmiyor), `id_token` kısa ömürlü, D1'e erişim tek Worker binding'i
    üzerinden.
  - **Karar bekliyor:** uygulama katmanında şifreleme (`BETTER_AUTH_SECRET`
    türevli bir anahtarla) ya da token'ları hiç saklamama. Ticarileşmeden veya
    ek OAuth kapsamı istenmeden önce yeniden değerlendirilmeli.
- **Amaç:** kimlik doğrulama; **Hukuki sebep:** m.5/2-c.
- **Süre:** hesap yaşadığı sürece (cascade ile silinir).

### `verification` — OAuth akış durumu

| Kolon | İçerik |
|---|---|
| `identifier`, `value` | OAuth `state` ve PKCE `code_verifier` verisi |
| `expires_at` | Kısa ömür |

- Çerez envanterinde **PKCE/nonce çerezi görünmemesinin sebebi budur**:
  `code_verifier` çerezde değil, bu tabloda tutulur (bkz. `cookie-inventory.md`).
- **Amaç:** giriş akışının güvenliği (CSRF/PKCE). **Sebep:** m.5/2-c.
- **Süre:** akış süresi kadar; süresi geçen kayıtların budanması **doğrulanmadı**.

### `profile` — profil içeriği

`username`, `theme`, `og_template`, `og_photo_asset_id`, `layout` (tam JSON),
`draft_layout`, `draft_theme`, `version`, `onboarding_data`,
`onboarding_completed_at`, `username_changed_at`, zaman damgaları.

- `layout` içindeki her şey kullanıcının kendi girdiğidir: ad, tanıtım yazısı,
  bağlantılar, sosyal hesap kullanıcı adları, zengin metin, görsel referansları
  ve **blokların `ogImage` / YouTube küçük görsel alanı** (uzak host adresi —
  `server/og.ts` adresi sunucu tarafında bulur; görselin kendisi de
  `server/image-proxy.ts` üzerinden birinci taraftan servis edilir, yani
  ziyaretçinin tarayıcısı uzak host'a hiç istek atmaz). YouTube/Spotify
  bloklarında saklanan kimlik ve başlık da aynı şekilde kayıt anında
  çözülür; gömülü oynatıcı ise **yalnız ziyaretçi oynata bastığında**
  yüklenir ve o noktada aktarım doğrudan o platformlara olur
  (`vendor-register.md` §A).
- `onboarding_data` ilk kurulumda verilen yanıtları tutar.
- **Amaç:** public profilin yayınlanması. **Sebep:** m.5/2-c.
- **Süre:** hesap yaşadığı sürece. `draft_layout` yayınlanana kadar; ayrı bir
  ömrü yok.
- **Not:** yayınlanan `layout` herkese açıktır. Kullanıcı oraya özel nitelikli
  veri (m.6) yazarsa alenileştirmiş olur; `/gizlilik` §3 bunu söylüyor. Caka
  m.6 kapsamında veri **istemez**.

### `username_redirect` — adres değişikliği kaydı

`old_username` (PK), `profile_id`, `expires_at`, `created_at`.

- **Amaç:** eski adresin kırılmaması. **Sebep:** m.5/2-f (meşru menfaat).
- **Süre:** **30 gün** (Değişmez #10; `expires_at`). Süre dolunca kayıt lookup'ta
  yok sayılır ve ad serbest kalır. Satırın fiziksel silinmesi ayrı bir iş
  değildir — **ölü satır tabloda kalabilir**.

### `github_calendar` — üçüncü kişi verisi ⚠️ işaretli

`login` (PK — GitHub kullanıcı adı), `payload` (normalize katkı takvimi JSON'u
veya `null` = negatif önbellek), `fetched_at`.

- **⚠️ Neden işaretli — bu tablonun ilgili kişisi Caka kullanıcısı olmayabilir.**
  Birincil anahtar bir GitHub handle'ıdır ve o handle'ı profiline ekleyen kişi
  ile handle'ın sahibi **aynı kişi olmak zorunda değildir**. Yani Caka, hiç
  Caka hesabı olmayan bir gerçek kişinin herkese açık katkı verisini işliyor
  olabilir. Bu kişi:
  - kendi verisi üzerinde m.11 haklarına sahiptir,
  - ama **hesabı olmadığı için ürün içinden hiçbir hakkını kullanamaz** —
    tek yol `hello@caka.app`'e e-posta.
  `/gizlilik` §3 bu uyarıyı açıkça veriyor ve §8'e bağlıyor. İlgili kişi
  başvuru yordamının kendisi henüz yazılmadı (`docs/backlog.md`).
- **Veri:** yalnızca GitHub'ın herkese açık arayüzünden gelen katkı sayıları ve
  günlük dağılım; e-posta, ad veya özel repo bilgisi çekilmez.
- **Toplama:** yalnızca sunucudan (`server/github.ts`). Ziyaretçinin tarayıcısı
  GitHub'a istek atmaz.
- **Amaç:** aynı veriyi her ziyarette yeniden istememek. **Sebep:** m.5/2-f.
- **Süre:** başarılı kayıt **6 saat** taze (`FRESH_TTL_MS`), olumsuz sonuç
  **24 saat** (`NEGATIVE_TTL_MS`). Bunlar tazelik eşikleridir, **silme süresi
  değildir**: satır tabloda kalır. Handle profilden çıkarıldığında satır
  temizlenmez; hesap silmede de temizlenmez (`docs/backlog.md` §3).
  **Bu, veri haritasındaki en somut saklama boşluğudur.**

### `asset` — yüklenen dosya envanteri

`id` (PK, aynı zamanda düz R2 anahtarı — KTD10 / Değişmez #9), `user_id`,
`content_type`, `size`, `created_at`.

- **Amaç:** yüklenen görsellerin saklanması ve sunulması. **Sebep:** m.5/2-c.
- **Süre:** hesap yaşadığı sürece. Silme yalnızca hesap silmede; blok
  kaldırıldığında diff/silme yapılmaz (bilinçli — Değişmez #9).

---

## 2. R2 — `caka-assets`

| Ne | Detay |
|---|---|
| İçerik | Kullanıcının yüklediği görseller + Google avatarının kopyası (`server/avatar.ts`) |
| Anahtar | Düz UUID = `asset.id`; path segmenti yok |
| Kişisel veri | Görselin kendisi (yüz fotoğrafı olabilir) + görselin türü/boyutu |
| Amaç | Profil içeriğinin sunulması. **Sebep:** m.5/2-c |
| Nerede | Cloudflare R2, binding `BUCKET` (`wrangler.jsonc`) |
| Bölge | **Doğrulanmadı** — `wrangler.jsonc`'de konum ipucu yok; kova konumu panelden teyit edilmedi |
| Süre | Hesap silmede `asset` satırlarındaki anahtarlarla temizlenir. Yetim nesne (DB satırı olmayan R2 nesnesi) için budama işi yok |

---

## 3. Cloudflare Workers Logs

`apps/web/wrangler.jsonc`:

```jsonc
"observability": { "enabled": true }
```

- **Ne tutuyor:** sunucu tarafı çalışma kayıtları — istenen adres, yanıt kodu,
  süre, `console` çıktısı, hata ve stack izi. İstek meta verisi (IP dâhil) bu
  kayıtlara girebilir.
- **⚠️ Alan kümesi ve saklama süresi bizim değil, Cloudflare'in.** `wrangler.jsonc`
  yalnızca `enabled: true` diyor; örnekleme oranı, alan seçimi veya saklama
  süresi **yapılandırılmadı**. Yani hangi alanların tutulduğunu ve ne kadar
  tutulduğunu ürün tarafı belirlemiyor; bu, Cloudflare'in plan bazlı
  varsayılanlarıdır ve **panelden doğrulanmadı — bilinmiyor olarak kayıtlıdır**.
  `/gizlilik` §3 aynı çekinceyi "bu kayıtların içeriğini tümüyle biz
  belirlemiyoruz" cümlesiyle veriyor.
- **Amaç:** hata ayıklama, güvenlik, hizmetin ayakta tutulması. **Sebep:** m.5/2-f.
- **Kod tarafı disiplin:** loglara token/PII yazılmaz (AGENTS.md Değişmez #6).
- **Workers Traces:** panelde **kapalı**. `workers.dev` alt alanı **kapalı**;
  tek özel alan adı `caka.app`.

---

## 4. Cloudflare Web Analytics — çerezsiz ziyaret ölçümü

| Alan | Değer |
|---|---|
| Kurulum | Otomatik (Automatic setup), **zone geneli** — beacon `root.tsx`'e elle eklenmedi |
| Kapsam | **Tüm sayfalar, herkese açık profil sayfaları dâhil** |
| Beacon | `static.cloudflareinsights.com` |
| Cihaza yazma | **Yok** — 0 çerez, 0 `localStorage`, 0 cihaz tanıtıcısı (prod'da gerçek tarayıcıda doğrulandı; `trust-claims.md`) |
| Cloudflare'e ulaşan | Sayfa adresi, yönlendiren, ülke, tarayıcı/cihaz sınıfı + beacon isteğinin kendisiyle **IP ve User Agent** |
| Amaç | Hangi sayfaların kullanıldığının ölçülmesi. **Sebep:** m.5/2-f |
| Saklama | **Bilinmiyor** — Cloudflare tarafında; doğrulanmadı |

**Not:** rıza gerekmemesi (KD1 üç koşul testi) işlemeyi hukuki sebepten muaf
tutmaz; sebep m.5/2-f'tir ve `/gizlilik` §4 bunu böyle yazıyor.

---

## 5. D1 dışındaki kişisel veri kaynakları

| Kaynak | Veri | Amaç / sebep | Süre |
|---|---|---|---|
| Destek yazışmaları (`hello@caka.app`) | E-posta içeriği, gönderen adresi, ekler | Talebin yanıtlanması — m.5/2-c veya m.5/2-f | Talep kapandıktan sonra en geç **3 ay** (Silme Yönetmeliği m.11/3) |
| Çerezler ve cihaz depolaması | `cookie-inventory.md` | Oturum ve giriş güvenliği — m.5/2-c | Envanterdeki ömürler |

---

## 6. Bu haritanın bilinen boşlukları

Hepsi bilerek burada duruyor; hiçbiri "sonra bakarız" diye kapatılmadı.

1. **Hesap sonrası saklama ve yedek süreleri belirlenmedi** — `bilinen-aciklar.md` §1.
2. **`github_calendar` satırları hiç silinmiyor** — hesap silmede de temizlenmiyor
   (`docs/backlog.md`).
3. **`session.ip_address` / `session.user_agent` yazılıyor ama hiçbir yerde
   okunmuyor** — minimizasyon kararı bekliyor.
4. **`account` token'ları şifrelenmemiş** — yukarıdaki karar noktası.
5. **Cloudflare tarafındaki saklama süreleri (Logs, Web Analytics) ve R2/D1
   bölgeleri doğrulanmadı.**
6. **Yurt dışına aktarım mekanizması yok** — OQ2a; `bilinen-aciklar.md` §2. Bu,
   hukuki sayfalar yayınlanmasa bile bugün mevcut olan bir açıktır: uygulama,
   veritabanı, dosya deposu ve loglar zaten Cloudflare'de.
7. **Süresi geçmiş `session` ve `verification` satırlarının budandığı
   doğrulanmadı.**
