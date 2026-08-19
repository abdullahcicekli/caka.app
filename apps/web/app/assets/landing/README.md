# Landing görselleri

Bu klasördeki her görselin nereden geldiği burada yazılıdır: biri yenilenmek
istendiğinde aynı estetik yeniden üretilebilsin diye.

## Çözünürlük kapısı: kutunun İKİ KATI

Şeritteki bir görselin doğal eni/boyu, basıldığı kutunun **iki katından** az
olamaz — DPR 2 ekranda (her modern telefon, her Retina masaüstü) tarayıcı
görseli büyütmek zorunda kalmasın. Kapı ölçülür, göz kararı verilmez:

```sh
pnpm dev            # başka bir kabukta
node scripts/serit-olcum.mjs <port>
```

Betik landing'deki her `<img>` için `naturalWidth/Height` ile gerçek render
kutusunu karşılaştırır, `object-fit`e göre ölçeği hesaplar ve ölçek 0,5'i aşan
her görseli ihlal sayıp 1 ile çıkar. Yeni bir görsel eklerken **önce kutuyu
ölçtür**, sonra kırp.

**BÜYÜTEREK kapıyı geçme.** Bir kırpmayı hedef ene ImageMagick ile şişirmek
`naturalWidth`i büyütür ama detay katmaz; şerit tam bu yüzden bulanıktı
(`scene-kaan`/`scene-ozan` 385×202'lik kadrajlardan 735×385'e çekilmişti,
yani 1,9× büyütme). Kaynak yetmiyorsa kadraj genişletilir ya da görsel
yeniden üretilir.

## Kural: yüz avatarda, kart görselinde sahne

Hero şeridinde **her görsel yalnız bir kez** geçer. Dört portreyle on beş yeri
doldurmak (avatar + kart kapağı + önizleme aynı fotoğraftan) gözle hemen
yakalanıyordu. İş bölümü:

- **Yüz yalnız avatarda.** Şeridin avatarları artık `serit/<slug>.webp` —
  24 kişilik kadronun kendi kareleri (`serit/README.md`). Aynı kişiden ikinci
  bir portre ÜRETMEK başka bir yüz getirir ve şeritte düzeltilen kimlik
  kusurunu (kadın fotoğrafı taşıyan kartın "Kerem Aydın" diye
  etiketlenmesi) geri koyardı.
  Eski `avatar-{kerem,selin,elif,naz}.webp` kırpmaları **silindi**: kadro
  24 kişiye çıkınca aynı dört ad için iki ayrı yüz seti kalıyordu. Kırpma
  komutları aşağıda kayıt olarak duruyor.
- **Kart görselleri kişi taşımaz:** personanın dünyasından bir sahne ya da
  nesne. Kimlik iddiası taşımadıkları için hangi yüzün çıktığı sorun değil,
  dolayısıyla her personaya kendi görsel seti düşebiliyor.
- Unsplash **kullanılmadı**: gerçek bir kişinin portresini sahte bir persona
  olarak kullanmak model izni ister ve o kişinin ürünü onayladığı izlenimini
  verir. Nesne görselleri için lisans engeli yoktu ama tek bir üretim hattı
  (fal) şeridin ışık ve renk dilini bir arada tutuyor.

## 1. Kaynak portreler — ARTIK DEPODA YOK

`creator-kerem.webp` · `creator-selin.webp` · `creator-elif.webp` ·
`creator-naz.webp` — 940×1224, yapay üretim. Tek tüketicileri kaldırılan
"Gerçek kullanım için tasarlandı" karuseliydi; kendileri silindi (~424 KB),
onlardan kırpılmış avatarlar ve detaylar duruyor. Aşağıdaki kırpma komutları
ve prompt'lar kayıt olarak bırakıldı: aynı estetik yeniden istenirse portre
önce prompt'tan üretilir, sonra komut çalıştırılır.

`creator-naz.webp` **yenilendi**: eski karede saçı açık bir kadın vardı,
setin geri kalanı (Selin, Elif) tesettürlüydü. Yarısı örtülü yarısı açık bir
set kimlik dilini bölüyordu; yeni kare de fal ile üretildi ve Naz'ın bütün
görselleri (avatar, masa detayı) ondan türedi.

> Photorealistic portrait photograph of a Turkish woman in her early thirties
> wearing a deep plum coloured hijab and a simple charcoal turtleneck,
> standing in a dark professional voice recording booth, a chrome condenser
> microphone with a round pop filter in front of her, holding a printed script
> in one hand, warm single source lamp light from the side, dark acoustic wood
> panelling behind her, a green glass vase and stacked books blurred in the
> background, deep charcoal plum and gold palette, low key cinematic 35mm film
> photograph, shallow depth of field, modest everyday clothing, calm confident
> expression looking at the camera, natural hands, no text, no lettering, no
> writing

| Persona | Kullanıcı adı | Meslek | Kaynak portre |
|---|---|---|---|
| Kerem Aydın | `keremaydin` | müzisyen | `creator-kerem.webp` |
| Selin Demir | `selindemir` | seramik atölyesi | `creator-selin.webp` |
| Elif Kaya | `elifkaya` | podcast sunucusu | `creator-elif.webp` |
| Naz Erdem | `nazerdem` | seslendirme sanatçısı | `creator-naz.webp` |

## 2. Kırpmalar (ImageMagick, üretim yok)

Avatarlar (256×256, yuvarlak maskeyle gösterilir):

```sh
magick creator-kerem.webp -crop 320x320+78+126  +repage -resize 256x256 -quality 80 avatar-kerem.webp
magick creator-selin.webp -crop 380x380+215+118 +repage -resize 256x256 -quality 80 avatar-selin.webp
magick creator-elif.webp  -crop 340x340+180+240 +repage -resize 256x256 -quality 80 avatar-elif.webp
magick creator-naz.webp   -crop 420x420+390+110 +repage -resize 256x256 -quality 80 avatar-naz.webp
```

Portre ortamından yapılan **kırpmalar KALDIRILDI.** `detail-elif.webp`
(`creator-elif.webp`ten kırpılan duvar rafı + cam vazo) kartın konusunu
anlatmıyordu — kırpma kişiyi dışarıda bırakmak için karenin boş yarısını
alıyordu ve geriye ne olduğu belirsiz bir köşe kalıyordu. Kural: **kart
görseli kişi taşımasın AMA kartın konusunu anlatsın.** Yerine konuya göre
üretilmiş kareler geldi (§3).

`scene-yazi.webp` (eski adı `detail-naz.webp`) kırpma DEĞİL, üretim (760×398; üretim karesi 560×293 idi,
bkz. §3'teki yeniden örnekleme notu) — Naz'ın yeni karesinde
kişisiz bir detay yoktu:

> Close up still life on a dark walnut desk in a dim studio: a closed dark
> green leather notebook with a brass corner, a black fountain pen resting on
> top of it, a deep green ceramic mug of tea beside it, a brass desk lamp
> casting a warm pool of light from the left, a pair of black over ear
> headphones folded at the edge of the frame, dark plum and gold palette,
> moody cinematic photorealistic 35mm photograph, shallow depth of field, no
> paper, no pages, no book cover design, no people, no hands, no text, no
> lettering, no writing, no letters, no numbers

## 3. Üretilen görseller (fal.ai, `fal-ai/flux-pro/v1.1-ultra`)

Hepsi 16:9 üretildi, 1,91:1'e kırpıldı (`-crop 2752x1441+0+48`) ve 736×385
webp'e indirildi; kare kapaklar 400×400.

> **ÜRETİM KARELERİ DEPODA YOK.** Yalnız küçültülmüş webp'ler commit edildi;
> fal çıktıları (ve `map-raw.jpg`, `menu-raw.jpg`) silinmiş durumda. Bu yüzden
> çözünürlük kapısını (yukarı bkz.) kaçıran ÜÇ kare — `scene-naz`,
> `scene-yazi`, `map-town` — yeniden üretilemedi; kapıyı geçmeleri için
> mevcut piksellerden **yeniden örneklendiler** (1,20× / 1,36× / 1,34×,
> Lanczos + hafif `-unsharp`). Yani doğal enleri kapıyı karşılıyor ama gerçek
> detayları hâlâ kaynak dosyanın detayı kadar:
>
> | Dosya | Şimdiki | Gerçek detay | Kutunun 2 katı |
> |---|---|---|---|
> | `scene-naz.webp`  | 880×461  | 735×385 | 850×445 |
> | `scene-yazi.webp` | 760×398  | 560×293 | 732×308 |
> | `map-town.webp`   | 1020×765 | 760×570 | 996×696 |
>
> Üçü de alan derinliği sığ / düz grafik kareler, yani yüksek frekanslı
> detayları zaten az; büyütme gözle `scene-kaan`/`scene-ozan`'daki gibi
> okunmuyor. Yine de **kalıcı çözüm bu üçünü aşağıdaki prompt'lardan yeniden
> üretmek** — o zaman büyütme kaldırılır ve üretim karesi bu kez repoya
> (veya en azından bir yedeğe) alınır.
>
> `-resize`'ı ŞİŞİRME AMACIYLA kullanan tek yer burasıdır; yeni görselde bunu
> tekrarlama.

### `scene-selin.webp` — Selin'in bağlantı kartı ("Yeni koleksiyon: Toprak")

> Bright airy ceramics workshop in soft daylight: a long wooden shelf lined
> with handmade terracotta bowls, cups and jugs of different sizes, a folded
> linen cloth, dried grasses in a stoneware vase, gentle window shadows on a
> pale plaster wall, warm sand and clay palette, photorealistic editorial
> photograph, 50mm, no people, no hands, no text, no lettering, no writing

### `scene-marangoz.webp` — Halil'in (marangoz) Threads kartı (560×293)

Kırpma: `-crop 2752x1440+0+0` (16:9 → 1,91:1, ortadan), `-resize 560x293`,
`-quality 68`. Kutu 235×123, kapı 470×247 — 560×293 kapıyı 1,19× aşıyor.

Eskiden bu kutuda `scene-selin-tools.webp` (çömlekçi tezgâhı) duruyordu; kart
sahibi marangoz olunca konu tutmuyordu, dosya silindi.

> Editorial photograph of a carpenter's workbench in a bright workshop. A hand
> plane resting on a half-finished oak board, a row of sharp bevel-edge
> chisels laid out on the bench, curls of fresh wood shavings scattered across
> the surface, a folding rule and a marking gauge. Warm honey-toned wood, soft
> daylight from a high window, shallow depth of field. No people, no hands, no
> faces, no text, no logos, no watermark.

### `scene-mimar.webp` — Burak'ın (mimar) LinkedIn kartı (560×293)

Aynı kırpma ve ölçü. Eskiden bu kutuda `detail-elif.webp` duruyordu (önce
duvar rafı + cam vazo kırpması, sonra bir ses kurgu masası); ikisi de mimarlık
kartını anlatmıyordu, dosya silindi.

> Editorial photograph of an architect's desk. A white cardboard scale model
> of a small modern building in the foreground, rolled and unrolled technical
> floor plan drawings beside it, a triangular scale ruler, a mechanical pencil
> and a pair of dividers. Cool neutral greys and warm paper tones, soft even
> studio daylight, shallow depth of field. No people, no hands, no faces, no
> readable text, no logos, no watermark.

### `scene-naz.webp` — Naz'ın nsosyal kartı

> A dark voice recording booth lit by one warm lamp: a chrome condenser
> microphone in a shock mount in sharp focus on the left, acoustic wood slat
> panelling behind, a green glass vase and a stack of books blurred in the
> background, deep teal and gold palette, moody cinematic photorealistic 35mm
> photograph, no people, no hands, no text, no lettering, no writing

### `cover-gece-yolu.webp` — Kerem'in albüm kapağı (400×400)

> Square album cover photograph: an empty two lane asphalt road at night
> winding through Anatolian hills, warm amber tail lights fading into low fog,
> deep indigo and charcoal sky, a faint band of stars, moody cinematic 35mm
> film grain, rich warm shadows, photorealistic, no text, no lettering, no
> writing, no people, no cars in focus

### `cover-sade-hayat.webp` — Elif'in podcast kapağı (400×400)

> Square podcast cover photograph: a calm still life on a pale linen cloth,
> one handmade cream ceramic mug, a sprig of dried wheat, a folded wool throw
> and a small stack of books, soft warm morning window light casting gentle
> shadows, muted sage ochre and oat palette, minimal composition with generous
> empty space, photorealistic editorial photography, 50mm, no text, no
> lettering, no writing, no people

### `map-town.webp` — konum kartının harita karesi (1020×765)

**Gerçek coğrafya DEĞİL, bilinçli olarak.** Mapbox Product Terms §2.8.1 harita
içeriğini önbelleğe almayı, proxy'lemeyi ve statik görsel olarak saklayıp
dağıtmayı yasaklıyor; kalan tek yol kareyi doğrudan Mapbox'tan çekmekti, o da
landing'i üçüncü tarafa açardı (sayfanın dibinde "reklam ve analitik çerezi
kullanmıyoruz" yazıyor) ve Statik Görsel API'sinin harcama tavanı yok. Ürünün
**gerçek** konum kartı Mapbox'tan gelmeye devam ediyor; bu yalnız demonun
karesi.

> Top-down flat vector-style dark map graphic of an imaginary coastal town:
> near-black slate background, a network of thin pale grey streets forming
> irregular blocks, a few larger boulevards in slightly brighter grey, muted
> dark teal water inlet along one corner, two small dark green park polygons,
> subtle paper grain. Clean cartographic illustration, minimal, calm, no text,
> no labels, no letters, no numbers, no pins, no icons, no compass, no legend,
> no border

```sh
# Özgün üretim (map-raw.jpg artık depoda yok):
magick map-raw.jpg -crop 1400x1050+700+390 +repage -resize 760x -quality 82 map-town.webp
# Bugünkü dosya, o çıktının yeniden örneklenmişi (çözünürlük kapısı):
magick map-town.webp -resize 1020x765! -unsharp 0x0.7+0.7+0.01 \
  -quality 82 -define webp:method=6 map-town.webp
```

### `menu-desk.webp` — menü katmanındaki görsel (760×594)

Menü kartının cümlesini ("Bağlantı, fotoğraf, müzik, harita — hepsi tek
ızgarada") birebir gösterir.

> Overhead flat lay photograph of a warm oak desk in soft afternoon window
> light. A tidy grid of square blocks is arranged on it like a bento layout:
> printed photographs, plain colour swatch cards, a small potted olive plant,
> over-ear headphones, a vinyl record, a folded paper map, a ceramic mug of
> coffee. Muted terracotta, sage and cream palette, warm Turkish interior
> mood, shallow depth of field, editorial product photography, photorealistic,
> 35mm, no text, no lettering, no writing, no people, no hands

Üretilen kare 2368×1792 idi; sol kenardaki dergi kapağında uydurma harfler
çıktığı için kırpıldı:

```sh
magick menu-raw.jpg -crop 1600x1250+550+300 +repage -resize 760x -quality 80 menu-desk.webp
```

## 4. Stüdyo karelerinden kırpılan iki sahne (üretim yok)

`scene-kerem.webp` ve `scene-elif.webp` yerlerini karakter şeridinin kendi
stüdyo karelerinden alınan **kişisiz** kırpmalara bıraktı. Böylece landing'in
görselleri tek bir çekime dayanıyor ve şerit ile karakter bölümü aynı ışığı
konuşuyor. Kadrajlar kişiyi DIŞARIDA bırakır — kart görseli kimlik iddiası
taşımaz kuralı (yukarı bkz.) korunur.

**Kaynak `vitrin/*.webp` DEĞİL, `lab/kisi-*.webp`.** İlk sürüm kırpmayı
laboratuvarın 1400×1050'lik RENDER'ından alıyordu; oradaki taban ekipmanı
yalnız ~540×285 piksel tutuyor ve 735×385'e şişirilince şerit gözle görülür
bulanıklaşıyordu. Kişi fotoğrafının kendisi 2000×1480; kırpma doğrudan ondan
alınınca aynı kadraj büyütmesiz çıkıyor.

```sh
magick lab/kisi-kaan.webp -crop 970x507+345+957 +repage -resize 960x502! \
  -quality 82 -define webp:method=6 scene-kaan.webp   # set ekipmanı, turuncu zemin
magick lab/kisi-ozan.webp -crop 950x497+400+930 +repage -resize 820x429! \
  -quality 82 -define webp:method=6 scene-ozan.webp   # plak + amfi köşesi, mor zemin
```

Kadrajların sağ kenarı bilerek kişinin ayaklarından ÖNCE biter
(`kisi-kaan`'da x < 1315, `kisi-ozan`'da x < 1350); genişletirken bu sınır
korunmalı.

| Dosya | Kart | Kutu (1440px) | Kaynak |
|---|---|---|---|
| `scene-kaan.webp` | Elif'in YouTube kapağı ("kamera arkası") | 437×246 | 960×502 |
| `scene-ozan.webp` | Kerem'in bağlantı kartı ("Konser takvimi") | 366×154 | 820×429 |

## 5. Diğerleri

`share-cards.webp` — paylaşım bölümünün görseli, daha önce eklendi.
`phone-3d.webp` kaldırılan karuselin tek görseliydi, silindi.
