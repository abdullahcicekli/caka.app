# Landing görselleri

Bu klasördeki her görselin nereden geldiği burada yazılıdır: biri yenilenmek
istendiğinde aynı estetik yeniden üretilebilsin diye.

## 1. Dört persona portresi (kaynak)

`creator-kerem.webp` · `creator-selin.webp` · `creator-elif.webp` ·
`creator-naz.webp` — 940×1224, yapay üretim, daha önce eklendi.

Hero şeridindeki dört persona bu dört fotoğrafa bağlıdır:

| Persona | Kullanıcı adı | Meslek | Kaynak |
|---|---|---|---|
| Kerem Aydın | `keremaydin` | müzisyen | `creator-kerem.webp` |
| Selin Demir | `selindemir` | seramik atölyesi | `creator-selin.webp` |
| Elif Kaya | `elifkaya` | podcast sunucusu | `creator-elif.webp` |
| Naz Erdem | `nazerdem` | seslendirme sanatçısı | `creator-naz.webp` |

## 2. Türetilen kırpmalar (üretim YOK, ImageMagick)

**Neden üretmedik:** aynı personadan ikinci bir "fotoğraf" üretmek BAŞKA bir
yüz getirir. Şeritte düzeltilen kusur tam olarak buydu (kadın fotoğrafı
taşıyan kart "Kerem Aydın" diye etiketliydi). Kırpma, kimliğin bozulmayacağı
tek yol; üstelik bedava ve daha hafif.

Avatarlar (256×256, yuvarlak maskeyle gösterilir):

```sh
magick creator-kerem.webp -crop 320x320+78+126  +repage -resize 256x256 -quality 80 avatar-kerem.webp
magick creator-selin.webp -crop 380x380+215+118 +repage -resize 256x256 -quality 80 avatar-selin.webp
magick creator-elif.webp  -crop 340x340+180+240 +repage -resize 256x256 -quality 80 avatar-elif.webp
magick creator-naz.webp   -crop 340x340+150+215 +repage -resize 256x256 -quality 80 avatar-naz.webp
```

Kart görselleri (736×385 ≈ 1,91:1 — `.link-og`, `.social-og` ve YouTube
kapağının oranı):

```sh
magick creator-kerem.webp -crop 900x471+0+200  +repage -resize 736x385 -quality 76 card-kerem.webp
magick creator-selin.webp -crop 900x471+0+250  +repage -resize 736x385 -quality 76 card-selin.webp
magick creator-elif.webp  -crop 900x471+20+300 +repage -resize 736x385 -quality 76 card-elif.webp
magick creator-naz.webp   -crop 900x471+0+250  +repage -resize 736x385 -quality 76 card-naz.webp
```

## 3. Üretilen görseller (fal.ai, `fal-ai/flux-pro/v1.1-ultra`)

Yalnız **kişi taşımayan** görseller üretildi: kimlik iddiası olmayan bir
albüm/podcast kapağı ya da bir masa üstü, hangi yüzün çıktığından bağımsız
doğrudur.

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

### `menu-desk.webp` — menü katmanındaki görsel (760×594)

Menü kartının cümlesini ("Bağlantı, fotoğraf, müzik, harita — hepsi tek
ızgarada") birebir gösterir: kare bloklardan bir ızgara, yanında plak,
kulaklık ve harita.

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
