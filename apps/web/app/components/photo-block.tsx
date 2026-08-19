import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { NavArrowLeft, NavArrowRight, Xmark } from "iconoir-react";

import {
  PHOTO_SHAPES,
  PHOTO_SLIDER_INTERVAL_MS,
  photoAreaName,
  photoGridAreas,
  photoGridPlan,
  type GalleryPhoto,
  type PhotoLayout,
} from "@caka/shared";

import { Dialog, DialogClose, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { widgetCatalog } from "~/content/widget";
import { useCatalog } from "~/lib/locale";

/**
 * FOTOĞRAF BLOĞU (eski `image` + `gallery`).
 *
 * Kart üç şeyi birden yapıyor ve üçü de durum tutuyor (slider'ın sırası, ışık
 * kutusunun açık fotoğrafı, hareket tercihi); bu yüzden ayrı bir bileşen:
 * `ProfileBlockCard` bir `switch` ve hook'lar bir dalın içinde yaşayamaz.
 *
 * Düzeni İKİ girdi belirler: fotoğraf sayısı (burada bilinir) ve kartın
 * gerçek ORANI (yalnız CSS bilir). Bileşen dört bandın planını da CSS
 * değişkeni olarak basar, `@container` sorgusu bandına uyanı seçer — JS
 * ölçümü, ResizeObserver ve hidrasyon kayması yok.
 */

/** `prefers-reduced-motion: reduce` — değişimi de dinler (sistem ayarı canlı). */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** Dört bandın ızgara planı, CSS değişkeni olarak. */
function gridPlanStyle(count: number): CSSProperties {
  const style: Record<string, string> = {};
  for (const shape of PHOTO_SHAPES) {
    const plan = photoGridPlan(count, shape);
    if (!plan) continue;
    style[`--photo-cols-${shape}`] = String(plan.columns);
    style[`--photo-areas-${shape}`] = photoGridAreas(plan);
  }
  return style as CSSProperties;
}

function PhotoImage({ photo, eager = false }: { photo: GalleryPhoto; eager?: boolean }) {
  // Yerel görseller R2'den gelir (Değişmez #9); imzalı proxy gerekmez.
  return (
    <img
      src={`/i/${photo.assetId}`}
      alt={photo.alt}
      loading={eager ? undefined : "lazy"}
      draggable={false}
    />
  );
}

/**
 * Işık kutusu. Radix Dialog: odak tuzağı, `aria-modal`, Escape ve dışarı
 * tıklama onun işi; ok tuşları ve kaydırma burada.
 */
function PhotoLightbox({
  photos,
  index,
  onIndex,
  onClose,
  title,
}: {
  photos: readonly GalleryPhoto[];
  index: number;
  onIndex: (next: number) => void;
  onClose: () => void;
  title: string;
}) {
  const w = useCatalog(widgetCatalog);
  const total = photos.length;
  const photo = photos[index];
  // Kaydırma: tek bir pointer'ın yatay yolu. 40px eşiği, dikey kaydırmayı
  // yanlışlıkla fotoğraf geçişi saymayacak kadar büyük.
  const swipeRef = useRef<{ x: number; y: number } | null>(null);
  const step = (delta: number) => onIndex((index + delta + total) % total);

  if (!photo) return null;
  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent
        className="photo-lightbox"
        overlayClassName="photo-lightbox-overlay"
        // Radix arka planı `aria-hidden` ile kapatıyor ama `aria-modal`
        // yazmıyor; ikisi birlikte her yardımcı teknolojide aynı sonucu verir.
        aria-modal
        // Kapatma düğmesi kendi etiketini taşısın: `dialog.tsx`in yerleşik
        // düğmesi İngilizce "Close" yazıyor, bu kart ise beş dilde.
        showCloseButton={false}
        onKeyDown={(event) => {
          if (total < 2) return;
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            step(-1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            step(1);
          }
        }}
      >
        {/* Radix başlık ister (aria-labelledby); görsel olarak gizli. */}
        <DialogTitle className="sr-only">{w.photo.lightboxTitle(title)}</DialogTitle>
        <DialogClose className="photo-lightbox-close" aria-label={w.photo.close}>
          <Xmark width={20} height={20} />
        </DialogClose>
        <div
          className="photo-lightbox-stage"
          onPointerDown={(event) => {
            swipeRef.current = { x: event.clientX, y: event.clientY };
          }}
          onPointerUp={(event) => {
            const start = swipeRef.current;
            swipeRef.current = null;
            if (!start || total < 2) return;
            const dx = event.clientX - start.x;
            if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(event.clientY - start.y)) return;
            step(dx < 0 ? 1 : -1);
          }}
        >
          <img src={`/i/${photo.assetId}`} alt={photo.alt} draggable={false} />
        </div>
        {total > 1 ? (
          <>
            <button
              type="button"
              className="photo-lightbox-nav is-prev"
              aria-label={w.photo.previous}
              onClick={() => step(-1)}
            >
              <NavArrowLeft width={26} height={26} />
            </button>
            <button
              type="button"
              className="photo-lightbox-nav is-next"
              aria-label={w.photo.next}
              onClick={() => step(1)}
            >
              <NavArrowRight width={26} height={26} />
            </button>
            <p className="photo-lightbox-foot">
              <span>{w.photo.counter(index + 1, total)}</span>
              {photo.alt ? <span className="photo-lightbox-alt">{photo.alt}</span> : null}
            </p>
          </>
        ) : photo.alt ? (
          <p className="photo-lightbox-foot">
            <span className="photo-lightbox-alt">{photo.alt}</span>
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** Kendiliğinden geçen şerit. Nokta göstergeleri hem durumu gösterir hem seçer. */
function PhotoSlider({
  photos,
  index,
  onIndex,
  renderCell,
}: {
  photos: readonly GalleryPhoto[];
  index: number;
  onIndex: (next: number) => void;
  renderCell: (photo: GalleryPhoto, position: number) => ReactNode;
}) {
  const w = useCatalog(widgetCatalog);
  return (
    <div className="photo-slider">
      <div className="photo-slides">
        {photos.map((photo, position) => (
          <div
            key={`${photo.assetId}-${position}`}
            className={`photo-slide${position === index ? " is-active" : ""}`}
            // Görünmeyen slaytlar ekran okuyucuya da kapalı; odak sırasına da
            // girmezler (içlerindeki düğme `inert` yerine aria + tabIndex ile
            // kapatılıyor, `inert` desteği hâlâ eşit değil).
            aria-hidden={position === index ? undefined : true}
          >
            {renderCell(photo, position)}
          </div>
        ))}
      </div>
      <div className="photo-dots" role="group" aria-label={w.photo.dotsLabel}>
        {photos.map((photo, position) => (
          <button
            key={`${photo.assetId}-${position}`}
            type="button"
            className={position === index ? "is-active" : ""}
            aria-label={w.photo.goTo(position + 1, photos.length)}
            aria-current={position === index ? "true" : undefined}
            onClick={() => onIndex(position)}
          />
        ))}
      </div>
    </div>
  );
}

export function PhotoBlockCard({
  title,
  photos,
  layout,
  url,
  interactive,
}: {
  title: string;
  photos: readonly GalleryPhoto[];
  layout: PhotoLayout;
  /** Tek fotoğraflı blokta kartın gittiği adres (eski `image` davranışı). */
  url: string;
  /**
   * Kart yerinde ETKİLEŞİMLİ mi? Yalnız public profil true geçer — editör
   * tuvalinde ışık kutusu ve nokta düğmeleri sürükleme/seçmeyle çakışır,
   * panel önizlemesinde de gereksiz (medya kartlarındaki `allowEmbeds` ile
   * aynı gerekçe ve aynı kaynak).
   */
  interactive: boolean;
}) {
  const w = useCatalog(widgetCatalog);
  const count = photos.length;
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  /**
   * Kullanıcı bir noktaya bastıysa otomatik geçiş DURUR ve bir daha
   * başlamaz. WCAG 2.2.2: beş saniyeden uzun süren, kendiliğinden değişen
   * içeriğin durdurulabilir olması gerekiyor; nokta göstergesi hem seçici
   * hem durdurma düğmesi olarak çalışıyor. (`prefers-reduced-motion` zaten
   * geçişi hiç başlatmıyor.)
   */
  const [taken, setTaken] = useState(false);
  // Tek fotoğrafta düzen seçimi anlamsız: ikisi de kartın tamamını kaplar.
  const sliding = layout === "slider" && count > 1;
  // Bağlantı YALNIZ tek fotoğraflı blokta kartın tamamını sarar; çok
  // fotoğraflı blokta tıklama ışık kutusunu açar (iç içe bağlantı/düğme de
  // geçersiz HTML olurdu).
  const asLink = Boolean(url) && count <= 1;
  const canZoom = interactive && !asLink && count > 0;

  // Slaytı sıfırla: fotoğraf silinince sıra dizinin dışında kalabiliyor.
  useEffect(() => {
    setIndex((current) => (current < count ? current : 0));
  }, [count]);

  // Otomatik geçiş. `prefers-reduced-motion: reduce` altında HİÇ kurulmaz:
  // CSS'teki genel koruma yalnız geçiş animasyonunu kısar, zamanlayıcıyı
  // durduramaz ve kart yine kendi kendine değişirdi.
  useEffect(() => {
    if (!sliding || reduced || taken) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, PHOTO_SLIDER_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [sliding, reduced, taken, count]);

  const cell = (photo: GalleryPhoto, position: number) => {
    const image = <PhotoImage photo={photo} eager={sliding && position === 0} />;
    // Anahtar sıra da taşır: aynı fotoğraf iki kez eklenebiliyor (şema
    // tekrarı yasaklamıyor) ve tek başına assetId çakışırdı.
    const key = `${photo.assetId}-${position}`;
    if (!canZoom) {
      return (
        <span key={key} className="photo-cell" style={{ gridArea: photoAreaName(position) }}>
          {image}
        </span>
      );
    }
    return (
      <button
        key={key}
        type="button"
        className="photo-cell"
        style={{ gridArea: photoAreaName(position) }}
        aria-label={w.photo.openLabel(position + 1, count)}
        // Slider'da görünmeyen slaytlar odak sırasına girmemeli.
        tabIndex={sliding && position !== index ? -1 : undefined}
        onClick={() => setLightbox(position)}
      >
        {image}
      </button>
    );
  };

  const body =
    count === 0 ? (
      <span className="profile-image-placeholder">{w.photo.empty}</span>
    ) : sliding ? (
      <PhotoSlider
        photos={photos}
        index={index}
        onIndex={(next) => {
          setTaken(true);
          setIndex(next);
        }}
        renderCell={cell}
      />
    ) : (
      <div className="photo-grid" style={gridPlanStyle(count)}>
        {photos.map((photo, position) => cell(photo, position))}
      </div>
    );

  const content = (
    <>
      {body}
      {/* Başlık her zaman basılır, GÖRÜNÜRLÜĞÜNE CSS karar verir: kısa
          kartlarda (156px) hücrelerin üstüne binmeden sığmıyor ve oradaki
          görevini `aria-label` üstleniyor. */}
      {title ? <span className="photo-title">{title}</span> : null}
    </>
  );

  const className = "profile-block profile-block-photo";
  return (
    <>
      {asLink ? (
        <a className={className} href={url} target="_blank" rel="noreferrer" aria-label={w.photo.label(title)}>
          {content}
        </a>
      ) : (
        <article className={className} aria-label={w.photo.label(title)}>
          {content}
        </article>
      )}
      {lightbox !== null ? (
        <PhotoLightbox
          photos={photos}
          index={Math.min(lightbox, count - 1)}
          onIndex={setLightbox}
          onClose={() => setLightbox(null)}
          title={title}
        />
      ) : null}
    </>
  );
}
