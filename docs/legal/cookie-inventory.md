# Çerez ve cihaz depolaması envanteri

`packages/shared/src/cookies.ts`'in insan okunur karşılığı.

> **Tek kaynak koddur (KTD21).** `/cerez-politikasi` tablosu `COOKIE_INVENTORY`
> dizisinden render edilir. Bu dosya o dizinin **kopyası değil, gerekçesidir**:
> adların nereden doğrulandığını, neyin bilerek dışarıda bırakıldığını ve
> hangi bayrağın neden eksik olduğunu anlatır. Yeni bir çerez veya cihaz
> depolama girdisi eklendiğinde **önce `cookies.ts` güncellenir** — yoksa
> yayındaki politika sessizce yanlışa düşer.

**Tarih:** 2026-08-17 · **Doğrulama tabanı:** kurulu `better-auth@1.6.28`
(Değişmez #2 ile pinli), `apps/web/app/routes/onboarding.tsx`,
`apps/web/app/root.tsx`.

---

## 1. Kategori: tek değer, `zorunlu`

Üründe rıza gerektiren hiçbir girdi yok. Analitik ve pazarlama kategorileri
**bilinçli olarak tanımlanmadı** — GA4 alınmadı (KD4), ziyaret ölçümü çerezsiz
Cloudflare Web Analytics ile yapılıyor ve cihaza hiçbir şey yazmıyor
(`trust-claims.md`). Rıza gerektiren bir araç eklenirse `COOKIE_CATEGORIES`
birliğine yeni değer eklenir ve rıza akışı **o zaman** kurulur; bugün var
olmayan bir rıza altyapısı taklit edilmiyor.

## 2. Envanter

| Ad | Tür | Kategori | Ömür | Taraf | Ne işe yarıyor |
|---|---|---|---|---|---|
| `__Secure-better-auth.session_token` | Çerez | Zorunlu | 7 gün | Birinci (Caka) | Giriş yapan kullanıcının oturumu. HttpOnly, Secure, SameSite=Lax, imzalı |
| `__Secure-better-auth.state` | Çerez | Zorunlu | 5 dakika | Birinci (Caka) | Google/Apple girişinde CSRF koruması (OAuth `state`). HttpOnly, Secure, SameSite=Lax; giriş bitince silinir |
| `caka_claim` | Çerez | Zorunlu | 15 dakika | Birinci (Caka) | Kayıtta seçilen adresi sağlayıcıya gidip dönene kadar taşır; dönüşte silinir. İçinde yalnız seçilen kullanıcı adı var |
| `react-router-scroll-positions` | `sessionStorage` | Zorunlu | Sekme kapanınca | Birinci (Caka) | Geri tuşunda sayfanın kaldığı yere dönmesi; yalnız piksel değerleri |

Üçüncü taraf çerez **yok**. Envanterdeki dört girdinin dördü de birinci taraf.

## 3. Adlar nasıl doğrulandı

Varsayılmadı — **kurulu paketin kaynağı okunarak** teyit edildi
(`node_modules/better-auth`, sürüm 1.6.28). `advanced.cookies` bu kurulumda
yapılandırılmadı, yani adlar kütüphane varsayılanlarından geliyor:

- Ad kalıbı `${cookiePrefix}.${cookieName}`, önek varsayılanı `better-auth`
  (`dist/cookies/index.mjs`, `createCookieGetter`).
- `session_token` ömrü `session.expiresIn || 7 gün` (aynı dosya).
- State stratejisi: veritabanı adapter'ı bulunduğu için `database` — çerez adı
  `state`, `maxAge` 300 saniye, imzalı (`dist/state.mjs`).

### `__Secure-` öneki yalnızca HTTPS'te görünür

Better Auth öneki `baseURL` HTTPS olduğunda ekler. Prod'da (`https://caka.app`)
adlar yukarıdaki gibidir; **lokal geliştirmede (`http://localhost:5173`) önek
düşer** ve DevTools'ta `better-auth.session_token` / `better-auth.state`
görünür. Envanterdeki `purpose` metinleri bu farkı okuyucuya da söylüyor —
lokalde politikayla eşleşmeyen bir ad görüp "politika yanlış" sonucuna
varılmasın diye.

### Bulunmayan çerezler ve neden bulunmadıkları

Bunlar "unuttuk" değil, "bu yapılandırmada yazılmıyor" satırlarıdır:

- **PKCE / nonce çerezi yok.** `code_verifier` çerezde değil, D1'deki
  `verification` tablosunda tutuluyor (bkz. `data-map.md` §1).
- **`session_data` / `account_data` yok.** Yalnızca `cookieCache` veya
  `storeAccountCookie` açıkken yazılır; ikisi de kapalı.
- **`dont_remember` yok.** Yalnız `rememberMe=false` akışlarında yazılır;
  üründe yalnız sosyal giriş var.
- **Ölçüm çerezi yok.** Cloudflare Web Analytics beacon'ı cihaza yazmıyor;
  gerçek tarayıcıda doğrulandı (`trust-claims.md`).

## 4. `caka_claim` — eksik `Secure` bayrağı

Bu çerez, diğer ikisinden farklı olarak **tarayıcıda JavaScript ile** yazılıyor
(`document.cookie`, `app/routes/onboarding.tsx`). Sonuçları:

- `HttpOnly` **olamaz** — yazan taraf JavaScript'in kendisi.
- `Secure` bayrağı **taşımıyor**. Bu bir eksiktir, bilinçli bir tasarım değil;
  `docs/backlog.md`'ye kaydedildi.
- Hafifletici: `SameSite=Lax`, `Path=/`, ömür 15 dakika, ve içeriği sır değil —
  yalnızca kullanıcının kendi seçtiği (ve birazdan herkese açık olacak)
  kullanıcı adı. Yani bayrağın eksikliği bir oturum kaçırma riski yaratmıyor;
  yine de prod tamamen HTTPS olduğu için eklenmemesi için bir sebep de yok.

## 5. Çerez olmayan ama envanterde duran girdi

`react-router-scroll-positions`, React Router'ın `<ScrollRestoration />`
bileşeni tarafından yazılıyor (`apps/web/app/root.tsx:77`). Çerez değil, ama
KVKK Çerez Rehberi cihaza erişimi **teknolojiden bağımsız** değerlendiriyor:
`sessionStorage`'a yazılan bir girdiyi tablonun dışında bırakmak, DevTools'u
açan okuyucuya karşı sessiz bir kayma olurdu. Bu yüzden `cookies.ts` yalnız
çerezleri değil, `storage` alanıyla birlikte **cihazda yer tutan her girdiyi**
kapsıyor.

## 6. Envanteri neyin geçersiz kılacağı

Aşağıdakilerden biri olursa bu dosya ve `cookies.ts` **aynı commit'te**
güncellenir:

1. Better Auth sürümü değişir (Değişmez #2 pinini kaldıran bir yükseltme) —
   çerez adları ve ömürleri yeniden doğrulanır.
2. `advanced.cookies`, `cookieCache`, `storeAccountCookie` veya `rememberMe`
   yapılandırılır.
3. Yeni bir üçüncü taraf script eklenir (ölçüm, chat, reklam) — cihaza yazıp
   yazmadığı **iddia edilmez, tarayıcıda doğrulanır** (KTD31).
4. Bir bileşen `localStorage`/`sessionStorage`/`IndexedDB` kullanmaya başlar.
5. Uzak `ogImage` için Worker proxy'si eklenir — o zaman profil sayfalarındaki
   üçüncü taraf çerez yüzeyi kapanır ve `/gizlilik` §6'daki uyarı güncellenir.

### Manuel doğrulama yordamı

Lokalde Google ve Apple ile giriş yapıldıktan sonra DevTools → Application →
Cookies ve Storage açılır; görülen **tüm** adların bu envanterin alt kümesi
olduğu kontrol edilir (prod'da `__Secure-` önekli, lokalde öneksiz). Envanterde
olmayan bir ad görülürse politika yayınlanmadan önce envanter güncellenir.
