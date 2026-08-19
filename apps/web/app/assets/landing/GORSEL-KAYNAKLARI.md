# Landing vitrini — görsel kaynakları ve lisansları

Vitrin kartlarındaki görseller iki kaynaktan gelir. Ayrım bilinçli: **yüzler
üretilir, nesneler ve mekânlar çekilmiş fotoğraftır.**

## 1. Kişiler ve avatarlar — fal.ai ile üretildi

`lab/kisi-*.webp` ve `lab/avatar-*.jpg` dosyaları yapay zekâ ile üretildi;
gerçek bir kişiyi temsil etmezler ve model izni gerektirmezler.

| Aşama | Model | Not |
| --- | --- | --- |
| Stüdyo karesi | `fal-ai/flux-pro/v1.1-ultra` | 3:4, 1792×2368; tek renk cyclorama, mesleğe ait nesneler |
| Yana genişletme | `fal-ai/bria/expand` | 3200×2368; kişi bir yana alınır, karşı yan telefona kalır |
| Avatar | — | Aynı karedeki yüzden ImageMagick ile kırpıldı (kişi = avatar) |

Üretim betiği ve istemler: repo dışında tutuldu; istemlerin özeti
`routes/lab.karakterler.tsx` başlığındaki not ve bu tablo. `FAL_KEY` bir
sırdır ve depoya girmez (Değişmez #6).

## 2. Kart içerikleri — Unsplash (ücretsiz lisans)

Galeri fotoğrafları, bağlantı önizlemeleri ve kapaklar. Hepsi
`images.unsplash.com/photo-...` uçlarından indirildi; **Unsplash+ (premium)
içerik kullanılmadı** — premium içerik `plus.unsplash.com/premium_photo-...`
üzerinden sunulur ve listede tek bir örneği yoktur.

Unsplash License: ticari kullanım dahil ücretsiz, atıf zorunlu değil ama
teşvik edilir; görselleri rakip bir stok fotoğraf servisi olarak yeniden
dağıtmak yasak — burada kart içeriği olarak kullanılıyorlar, dağıtılmıyorlar.

| Dosya (`lab/kart/`) | Unsplash foto sayfası | Fotoğrafçı | Foto kimliği | Lisans |
| --- | --- | --- | --- | --- |
| `kaan-galeri-1.jpg` | https://unsplash.com/photos/film-crew-on-soundstage-workspace-br2HgQuvq6I | Brands&People | `photo-1612544409025-e1f6a56c1152` | Unsplash License (ücretsiz) |
| `kaan-galeri-2.jpg` | https://unsplash.com/photos/red-tram-on-the-street-during-daytime-a9bLObiMPJ4 | Ibrahim Uzun | `photo-1629649456013-88519a031d64` | Unsplash License (ücretsiz) |
| `kaan-galeri-3.jpg` | https://unsplash.com/photos/video-editing-timeline-on-dark-screen-yk9VXp4W5-Q | Matthew Kwong | `photo-1574717024653-61fd2cf4d44d` | Unsplash License (ücretsiz) |
| `serkan-galeri-1.jpg` | https://unsplash.com/photos/a-gym-filled-with-lots-of-machines-and-weights-1RNQ11ZODJM | Ambitious Studio&#124; Rick Barrett | `photo-1689877020200-403d8542d95d` | Unsplash License (ücretsiz) |
| `serkan-galeri-2.jpg` | https://unsplash.com/photos/black-kettle-bell-be-6rpnQ30k | Content Pixie | `photo-1566568531155-07244e00963d` | Unsplash License (ücretsiz) |
| `serkan-galeri-3.jpg` | https://unsplash.com/photos/red-running-track-lane-markings-LKaN_tqplEw | Braden Collum | `photo-1549896869-ca27eeffe4fb` | Unsplash License (ücretsiz) |
| `ozan-galeri-1.jpg` | https://unsplash.com/photos/silhouette-of-people-watching-concert-jz_CtXafltc | Dorel Gnatiuc | `photo-1610901056511-31de499995f0` | Unsplash License (ücretsiz) |
| `ozan-galeri-2.jpg` | https://unsplash.com/photos/close-up-photo-of-audio-mixer-sdtnZ4LgbWk | Adi Goldstein | `photo-1535406208535-1429839cfd13` | Unsplash License (ücretsiz) |
| `busra-galeri-1.jpg` | https://unsplash.com/photos/a-pile-of-different-types-of-vegetables-on-a-white-surface-5aJVJvJ9rG8 | Marisol Benitez | `photo-1597362925123-77861d3fbac7` | Unsplash License (ücretsiz) |
| `busra-galeri-2.jpg` | https://unsplash.com/photos/modern-office-space-with-plants-and-desk-_XbcXekBecY | FlippingBook | `photo-1774853107769-c80031c15220` | Unsplash License (ücretsiz) |
| `busra-galeri-3.jpg` | https://unsplash.com/photos/breakfast-bowl-with-fruit-and-coffee-nTZOILVZuOg | Brooke Lark | `photo-1494390248081-4e521a5940db` | Unsplash License (ücretsiz) |
| `emre-og-1.jpg` | https://unsplash.com/photos/a-computer-screen-with-a-bunch-of-code-on-it-ieic5Tq8YMk | Chris Ried | `photo-1515879218367-8466d910aaa4` | Unsplash License (ücretsiz) |
| `emre-og-2.jpg` | https://unsplash.com/photos/cable-network-M5tzZtFCOfs | Taylor Vick | `photo-1558494949-ef010cbdcc31` | Unsplash License (ücretsiz) |
| `zeynep-og-1.jpg` | https://unsplash.com/photos/pile-of-newspapers-HeNrEdA4Zp4 | Utsav Srestha | `photo-1573812195421-50a396d17893` | Unsplash License (ücretsiz) |
| `zeynep-og-2.jpg` | https://unsplash.com/photos/black-and-gray-microphones-close-up-photography-Qizcmx0djrw | Jon Tyson | `photo-1563726351554-179049599895` | Unsplash License (ücretsiz) |
| `zeynep-og-3.jpg` | https://unsplash.com/photos/a-long-row-of-bookshelves-filled-with-lots-of-books-GxCLXVWAJMY | Jayanth Muppaneni | `photo-1709924168698-620ea32c3488` | Unsplash License (ücretsiz) |
| `busra-og-1.jpg` | https://unsplash.com/photos/grey-and-black-pen-on-calendar-book-ebvCsRypmxM | Renáta-Adrienn | `photo-1529651737248-dad5e287768e` | Unsplash License (ücretsiz) |
| `ozan-kapak.jpg` | https://unsplash.com/photos/a-close-up-of-purple-smoke-on-a-black-background--X_TzWEZK3c | engin akyurt | `photo-1634976269795-afdad51715c8` | Unsplash License (ücretsiz) |
| `kaan-video.jpg` | https://unsplash.com/photos/camera-on-tripod-with-zoom-lens-IcwAKUhNGXs | Sirisvisual | `photo-1612548403247-aa2873e9422d` | Unsplash License (ücretsiz) |
| `kaan-son-video.jpg` | https://unsplash.com/photos/view-of-istanbul-skyline-with-mosques-and-bosphorus-strait-UM_YUJUGK6g | Spenser Sembrat | `photo-1763965367191-6455ef032c79` | Unsplash License (ücretsiz) |
| `ozan-galeri-3.jpg` | https://unsplash.com/photos/amber-vinyl-record-on-turntable-KA1WM_yQGF8 | Jakob Rosen | `photo-1616714109948-c74fe5029a4d` | Unsplash License (ücretsiz) |

## 3. Favicon'lar — `lab/favicon/`

Bağlantı kartlarında favicon yoksa ürün marka renkli bir kareye alan adının
**baş harfini** basar. Gerçek bir sayfada iyi bir yedek; vitrinde "görsel
yüklenmemiş" gibi okunur. Bu yüzden her bağlantı bloğuna favicon verildi
(denetim: `scripts/lab-denetim.mjs`).

Kaynak seçimi ürünün gerçekte ne bulacağını taklit eder:

| Dosya / kaynak | Kullanan kart | Nereden | Lisans / dayanak |
| --- | --- | --- | --- |
| `favicon/github.svg` | `emre-proje` (github.com) | GitHub'ın kendi ilan ettiği favicon (`github.githubassets.com/favicons/favicon.svg`) | Marka işaretinin **nominatif** kullanımı: kart o servise giden bir bağlantıyı işaretliyor. Aynı glif ürünün `icons/social.tsx` setinde de var. |
| `favicon/whatsapp.svg` | `serkan-wa` (wa.me) | wa.me sayfasının `<link rel="icon">` ilanı (`static.whatsapp.net/rsrc.php/y1/r/FJbTMJqMap7.svg`) | Aynı gerekçe. Ürün de canlıda tam bu adresi bulur (`server/og.ts`). |
| `favicon/ornekgazete.svg` | `zeynep-haber-1`, `zeynep-haber-2` | **Bu depoda çizildi** — katlanmış gazete gliff'i, tek renk zemin | Kendi varlığımız. Gazete FOTOĞRAFI kullanılmadı: bu fotoğraflar neredeyse her zaman gerçek bir yayının başlığını ve o günün manşetini taşıyor, kurgusal bir gazetenin amblemi olarak kullanmak hem başkasının markasını hem alakasız bir manşeti pazarlama varlığımıza gömerdi. 26 pikselde fotoğraf gri bir lekeye düşerken çizilmiş amblem okunur kalıyor. |
| `avatar-emre.jpg` | `emre-blog` (emrekilic.dev) | Bölüm 1'deki portre | Kişisel sitelerin site ikonu çoğu kez sahibinin fotoğrafıdır; yeni varlık indirilmedi. |
| `avatar-ozan.jpg` | `ozan-takvim` (ozansahin.com) | Bölüm 1'deki portre | Aynı gerekçe. |
| `avatar-zeynep.jpg` | `zeynep-arsiv` (zeynepaydin.com) | Bölüm 1'deki portre | Aynı gerekçe. |
| `avatar-busra.jpg` | `busra-randevu` (dytbusrakaya.com) | Bölüm 1'deki portre | Aynı gerekçe. |

Bu varlıkların hiçbiri üretim paketine girmez: yalnız laboratuvar route'undan
(`routes/lab.karakterler.tsx`, `import.meta.env.DEV` kapılı) okunuyorlar ve
üretime giden şey `vitrin/` altındaki webp'lerdir.

## 4. `vitrin/` — üretime giden çıktılar

Hepsi laboratuvardan üretildi; elle çizilmiş varlık yok. Yeniden üretmek için
`scripts/README.md`.

| Dosya | Nerede görünür |
| --- | --- |
| `emre / kaan / serkan / ozan / zeynep / busra.webp` | Landing karakter şeridi |
| `emre-dongu.webp` | Aynı şerit; hareket tercihi açıksa |
| `telefon-busra.webp` | `/login` sağ paneli ve `/onboarding` |

`telefon-busra.webp` SAYDAM (alfa) ve kişisizdir: arkasındaki zemin sayfanın
kendi rengidir (girişte kireç, kayıtta beyaz), o yüzden tek varlık iki sayfaya
yetiyor. Giriş sayfasında eskiden elle yazılmış sahte bir profil kartı ve
`creator-selin.webp` (123 KB) duruyordu; yerine geçen bu mockup 34 KB ve
telefonun içi ürünün kendi `ProfileCanvas`'ı.
