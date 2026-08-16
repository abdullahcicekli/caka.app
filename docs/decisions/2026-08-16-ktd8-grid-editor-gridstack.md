# KTD8 kararı: Grid editör kütüphanesi — gridstack.js

**Tarih:** 2026-08-16 · **Durum:** Karara bağlandı · **Bağlam:** Plan U6, KTD8

## Karar

Grid editör **gridstack.js v13** ile uygulanır. react-grid-layout spike'ı
yapılmadı: kullanıcı doğrudan Plan B'ye (gridstack) geçilmesine karar verdi.

## Gerekçe

- gridstack v13.0.2 aktif bakımlı (son yayın Temmuz 2026), sıfır çalışma
  zamanı bağımlılığı var ve React'e peer dependency bildirmiyor — KTD8'in
  react-grid-layout için işaret ettiği "React 19 uyumu belirsiz" riski
  gridstack'te yapısal olarak yok (DOM tabanlı, framework-bağımsız).
- v13 CSS'i tamamen CSS custom property tabanlı (`--gs-column-width` vb.);
  4/2 kolon düzenleri ek CSS dosyası (eski `gridstack-extra.css`) gerektirmiyor.
- Resmî React entegrasyon deseni (container `GridStack.init` + item'lar için
  `makeWidget`/`removeAll(false)`) `apps/web/app/components/editor/grid.tsx`
  içinde uygulandı; React item listesini ve kart içeriğini, gridstack ise
  konumlandırmayı yönetir.

## Sonuçlar

- Editör client bundle'ına ~24 KB (gzip) gridstack chunk'ı eklendi; dinamik
  import sayesinde yalnızca `/edit` yüklüyor. Public SSR sayfaları statik CSS
  grid ile render etmeye devam eder (R13).
- `react-grid-layout` bağımlılıklara hiç eklenmedi (plan doğrulama maddesi:
  kullanılmayan kütüphane bağımlılıklarda değil).
- R7 mobil türetme kuralı gridstack'ten bağımsız, `@caka/shared` içindeki
  `withDerivedSmPositions` saf fonksiyonuyla uygulanır; gridstack'in kendi
  responsive kolon modu bilinçli olarak kullanılmaz (`column(n, "none")`).
