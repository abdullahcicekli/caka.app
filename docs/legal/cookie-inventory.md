# Çerez ve cihaz depolaması envanteri

`packages/shared/src/cookies.ts`'in insan okunur karşılığı.

> **Tek kaynak koddur (KTD21).** `/cerez-politikasi` tablosu `COOKIE_INVENTORY`
> dizisinden render edilir. Bu dosya o dizinin **kopyası değil, gerekçesidir**:
> adların nereden doğrulandığını, neyin bilerek dışarıda bırakıldığını ve
> hangi bayrağın neden eksik olduğunu anlatır. Yeni bir çerez veya cihaz
> depolama girdisi eklendiğinde **önce `cookies.ts` güncellenir** — yoksa
> yayındaki politika sessizce yanlışa düşer.

**Tarih:** 2026-08-19 · **Doğrulama tabanı:** kurulu `better-auth@1.6.28`
(Değişmez #2 ile pinli), `apps/web/app/routes/onboarding.tsx`,
`apps/web/app/root.tsx` ve **derlenmiş istemci paketi**
(`apps/web/build/client/assets`, bkz. §5).

---

## 1. Kategori: tek değer, `zorunlu`

Üründe rıza gerektiren hiçbir girdi yok. Analitik ve pazarlama kategorileri
**bilinçli olarak tanımlanmadı** — GA4 alınmadı (KD4). Ziyaret ölçümünün iki
ayağı da cihaza hiçbir şey yazmıyor: zone genelindeki çerezsiz Cloudflare Web
Analytics (`trust-claims.md`) ve panel için tutulan birinci taraf sayaçlar
(R48, `profile_view_daily` / `link_click_daily`). İkincisi tamamen sunucu
tarafında sayar; tıklama bildirimi `navigator.sendBeacon` ile gider ve
karşılığında gövdesiz `204` döner — ne çerez, ne gövde, ne saklanabilir bir
kimlik. Rıza gerektiren bir araç eklenirse `COOKIE_CATEGORIES` birliğine yeni
değer eklenir ve rıza akışı **o zaman** kurulur; bugün var olmayan bir rıza
altyapısı taklit edilmiyor.

## 2. Envanter

| Ad | Tür | Kategori | Ömür | Taraf | Ne işe yarıyor |
|---|---|---|---|---|---|
| `__Secure-better-auth.session_token` | Çerez | Zorunlu | 7 gün | Birinci (Caka) | Giriş yapan kullanıcının oturumu. HttpOnly, Secure, SameSite=Lax, imzalı |
| `__Secure-better-auth.state` | Çerez | Zorunlu | 5 dakika | Birinci (Caka) | Google/Apple girişinde CSRF koruması (OAuth `state`). HttpOnly, Secure, SameSite=Lax; giriş bitince silinir |
| `caka_claim` | Çerez | Zorunlu | 15 dakika | Birinci (Caka) | Kayıtta seçilen adresi sağlayıcıya gidip dönene kadar taşır; dönüşte silinir. İçinde yalnız seçilen kullanıcı adı var |
| `caka_dil` | Çerez | Zorunlu | 1 yıl | Birinci (Caka) | Seçilen arayüz dilini hatırlar; içinde yalnız dil kodu var (`en`, `tr`, `es`, `pt-BR`, `de`). Tarayıcıdan yazıldığı için HttpOnly değil; Secure, SameSite=Lax, Path=/ |
| `react-router-scroll-positions` | `sessionStorage` | Zorunlu | Sekme kapanınca | Birinci (Caka) | Geri tuşunda sayfanın kaldığı yere dönmesi; yalnız piksel değerleri |
| `react-router-manifest-version` | `sessionStorage` | Zorunlu | Yenileme bitince, en geç sekme kapanınca | Birinci (Caka) | Yeni sürüm yayınlandığında açık sekmenin bir kez yenilenmesi; yenilemenin döngüye girmemesi için sürüm etiketi tutar |

Üçüncü taraf çerez **yok**. Envanterdeki altı girdinin altısı da birinci taraf.

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
- **Harita çerezi yok — ama harita artık üçüncü taraf isteği doğuruyor.**
  2026-08-19'dan beri konum kartının iki karesi doğrudan `api.mapbox.com`'dan
  yükleniyor (eski birinci taraf `/api/harita` proxy'si Mapbox Product Terms
  §2.8.1 ve §1.9 sunucu önbelleğini ve proxy'lemeyi yasakladığı için
  kaldırıldı). Envantere satır **girmedi**, çünkü: statik görsel yanıtında
  `Set-Cookie` **gözlenmedi** (curl ile başlık kontrolü — dönen başlıklar
  `content-type`, `server: awselb/2.0`, CloudFront `x-cache`/`via`/`x-amz-cf-*`,
  `alt-svc`, `date`) ve bir `<img>` isteği kimlik bilgisi taşımadığı için bizim
  taşıyabileceğimiz bir çerez zaten doğmaz. İddia bundan fazlası değildir.
  Cihaza yazma olmasa da ziyaretçinin **IP'si ve User Agent'ı Mapbox'a
  ulaşıyor**; bu envanterin değil, `vendor-register.md` §A'nın konusudur.

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

## 5. Çerez olmayan ama envanterde duran girdiler

İkisi de React Router'dan geliyor ve ikisi de çerez değil. KVKK Çerez Rehberi
cihaza erişimi **teknolojiden bağımsız** değerlendiriyor: `sessionStorage`'a
yazılan bir girdiyi tablonun dışında bırakmak, DevTools'u açan okuyucuya karşı
sessiz bir kayma olurdu. Bu yüzden `cookies.ts` yalnız çerezleri değil,
`storage` alanıyla birlikte **cihazda yer tutan her girdiyi** kapsıyor.

- `react-router-scroll-positions` — `<ScrollRestoration />` bileşeni yazıyor
  (`apps/web/app/root.tsx`). Her gezinmede oluşur.
- `react-router-manifest-version` — rota keşfi (lazy route discovery) yazıyor.
  Yalnızca **yayın anında açık olan** bir sekmede oluşur: sürüm uyuşmazlığı
  görülünce sayfa bir kez yenilenir ve yenilemenin döngüye girmemesi için
  sürüm etiketi buraya yazılır; yenileme başarılıysa hemen silinir. Nadir bir
  girdi, ama oluşabildiği için envanterde.

### Adlar nasıl bulundu (varsayılmadı)

`pnpm --filter @caka/web build` çalıştırıldı ve derlenmiş istemci paketi
tarandı:

```
grep -rno "sessionStorage[^;]\{0,120\}" apps/web/build/client/assets/
```

Çıktıdaki `sessionStorage.setItem(...)` çağrılarının minify edilmiş değişken
adları paketin içinden çözüldü. Bugünkü paketin yazabildiği anahtarlar:

| Anahtar | Durum |
|---|---|
| `react-router-scroll-positions` | Envanterde |
| `react-router-manifest-version` | Envanterde |
| `remix-router-transitions` | **Envanterde değil** — yalnız `viewTransition` seçeneği kullanıldığında yazılıyor; `apps/web/app` içinde bu seçeneğe yapılmış tek bir çağrı yok (`grep -rn "viewTransition" apps/web/app` boş döner). Kullanılmaya başlanırsa envantere girer. |

### Açık uç: `better-auth.message` (`localStorage`)

Aynı taramada `apps/web/build/client/assets/auth-client-*.js` içinde
`localStorage.setItem(this.name, …)` görüldü; `this.name` varsayılanı
`better-auth.message`. Better Auth bunu sekmeler arası oturum senkronizasyonu
için (BroadcastChannel yerine) kullanıyor ve yalnız oturum atomu
başlatıldığında (`isInitialized`) bir oturum olayı yayınlandığında yazıyor.
Üründe `useSession` kullanılmıyor, yalnız `signIn.social` ve `signOut`
çağrılıyor — yani bu yolun gerçekten tetiklenip tetiklenmediği **kodu okuyarak
kesinleştirilemedi**. Envantere eklenmedi çünkü envantere iddiayla değil
doğrulamayla girilir (KTD31). Yapılacak: gerçek tarayıcıda giriş ve çıkış
akışları koşturulup DevTools → Application → Local Storage bakılacak; girdi
oluşuyorsa `cookies.ts`'e eklenecek ve `/cerez-politikasi` §1'deki
"`localStorage` Caka'nın hiçbir yerinde kullanılmaz" cümlesi düzeltilecek.
`docs/backlog.md` §13'e kaydedildi.

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
5. ~~Uzak `ogImage` için Worker proxy'si eklenir~~ — **yapıldı (2026-08-18)**.
   Profil sayfalarındaki üçüncü taraf çerez yüzeyi kapandı; `/gizlilik` §6
   ve `vendor-register.md` aynı commit'te güncellendi. Bundan sonraki tetik:
   proxy'nin kapsamı dışında kalan yeni bir uzak görsel yüzeyi eklenirse.
6. Gömülü bir oynatıcı (YouTube, Spotify) **tıklama kapısı olmadan**, yani
   sayfa açılışında yüklenmeye başlarsa. Bugün ikisi de yalnız ziyaretçi
   oynat düğmesine bastığında yükleniyor; bu kapı kalkarsa yazdıkları
   çerezler artık "ziyaretçinin kendi eylemi" sayılamaz ve rıza sorusu
   baştan sorulmalıdır.

### Manuel doğrulama yordamı

Lokalde Google ve Apple ile giriş yapıldıktan sonra DevTools → Application →
Cookies ve Storage açılır; görülen **tüm** adların bu envanterin alt kümesi
olduğu kontrol edilir (prod'da `__Secure-` önekli, lokalde öneksiz). Envanterde
olmayan bir ad görülürse politika yayınlanmadan önce envanter güncellenir.
