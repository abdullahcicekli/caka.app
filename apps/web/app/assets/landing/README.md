# Landing görselleri

Bu klasördeki her görselin nereden geldiği burada yazılıdır: biri yenilenmek
istendiğinde aynı estetik yeniden üretilebilsin diye.

## Kural: yüz avatarda, kart görselinde sahne

Hero şeridinde **her görsel yalnız bir kez** geçer. Dört portreyle on beş yeri
doldurmak (avatar + kart kapağı + önizleme aynı fotoğraftan) gözle hemen
yakalanıyordu. İş bölümü:

- **Yüz yalnız avatarda.** Avatarlar dört kaynak portrenin kırpmasıdır. Aynı
  personadan ikinci bir portre ÜRETMEK başka bir yüz getirir ve şeritte
  düzeltilen kimlik kusurunu (kadın fotoğrafı taşıyan kartın "Kerem Aydın"
  diye etiketlenmesi) geri koyardı.
- **Kart görselleri kişi taşımaz:** personanın dünyasından bir sahne ya da
  nesne. Kimlik iddiası taşımadıkları için hangi yüzün çıktığı sorun değil,
  dolayısıyla her personaya kendi görsel seti düşebiliyor.
- Unsplash **kullanılmadı**: gerçek bir kişinin portresini sahte bir persona
  olarak kullanmak model izni ister ve o kişinin ürünü onayladığı izlenimini
  verir. Nesne görselleri için lisans engeli yoktu ama tek bir üretim hattı
  (fal) şeridin ışık ve renk dilini bir arada tutuyor.

## 1. Kaynak portreler

`creator-kerem.webp` · `creator-selin.webp` · `creator-elif.webp` ·
`creator-naz.webp` — 940×1224, yapay üretim. Bugün iki yerde kullanılıyorlar:
vitrin karuseli (tam boy) ve şeridin avatarları (kırpma).

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

Portrelerin ortamından iki **yüzsüz** detay (1,91:1 — `.social-og` oranı):

```sh
magick creator-elif.webp -crop 470x246+0+60  +repage -resize 560x -quality 78 detail-elif.webp   # duvar rafı, cam vazo
```

`detail-naz.webp` kırpma DEĞİL, üretim (560×293) — Naz'ın yeni karesinde
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

### `scene-kerem.webp` — Kerem'in bağlantı kartı ("Konser takvimi")

> Warm dimly lit home music studio at night: an acoustic guitar resting on a
> wooden chair in the foreground, a vintage tube amplifier beside it, a floor
> lamp casting amber light, a patterned Anatolian rug on the floor, a drum kit
> softly blurred in the background, deep brown and ochre palette,
> photorealistic 35mm film photograph, shallow depth of field, cozy, no
> people, no hands, no text, no lettering, no writing

### `scene-selin.webp` — Selin'in bağlantı kartı ("Yeni koleksiyon: Toprak")

> Bright airy ceramics workshop in soft daylight: a long wooden shelf lined
> with handmade terracotta bowls, cups and jugs of different sizes, a folded
> linen cloth, dried grasses in a stoneware vase, gentle window shadows on a
> pale plaster wall, warm sand and clay palette, photorealistic editorial
> photograph, 50mm, no people, no hands, no text, no lettering, no writing

### `scene-selin-tools.webp` — Selin'in sosyal kartı (560×293)

> Close up of a potter's worktable in warm daylight: wooden ribs, a wire clay
> cutter, a small sponge and a metal loop tool laid out on a clay dusted
> wooden surface, a shallow bowl of murky water beside them, dried clay
> flakes, warm sand and grey palette, photorealistic macro editorial
> photograph, 50mm, no people, no hands, no text, no lettering, no writing

### `scene-elif.webp` — Elif'in YouTube kapağı

> Calm still life in a Mediterranean room: morning light falling through an
> arched window onto a linen curtain, a small olive tree in a terracotta pot,
> a deep teal painted wall, an ochre ceramic bowl on a low wooden stool, soft
> shadows, muted teal and mustard palette, photorealistic editorial
> photograph, 35mm, no people, no hands, no text, no lettering, no writing

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

### `map-town.webp` — konum kartının harita karesi (760×570)

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
magick map-raw.jpg -crop 1400x1050+700+390 +repage -resize 760x -quality 82 map-town.webp
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

## 4. Diğerleri

`phone-3d.webp`, `share-cards.webp` — vitrin ve paylaşım bölümünün görselleri,
daha önce eklendi.
