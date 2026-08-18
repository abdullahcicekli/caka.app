// Gridstack v13 tabanlı editör grid'i (KTD8 Plan B). Gridstack DOM'u kendisi
// konumlandırır; React yalnızca item listesini ve içeriği render eder.
// Sözleşme: item sarmalayıcısının className'i sabit kalır (gridstack'in
// eklediği sınıflar React diff'inde silinmesin), seçim stili içteki
// content div'ine uygulanır. Gridstack yalnızca client'ta dinamik import
// edilir — SSR bundle'ına girmez.
import { useEffect, useRef, type ReactNode } from "react";
import { Trash, WarningTriangle } from "iconoir-react";
import type { GridItemHTMLElement, GridStack } from "gridstack";

import {
  BLOCK_GRID_LIMITS,
  GRID_COLUMNS,
  type ProfileBlock,
} from "@caka/shared";
import { ProfileBlockCard } from "~/components/profile-block";

import "gridstack/dist/gridstack.min.css";
import { appCatalog } from "~/content/app";
import { useCatalog } from "~/lib/locale";

export type EditorDevice = "desktop" | "mobile";

export type GridUpdate = { id: string; x: number; y: number; w: number; h: number };

export function EditorGrid({
  blocks,
  device,
  selectedId,
  editingId = null,
  onSelect,
  onChange,
  onManual,
  onRemove,
  renderBlock,
  issueOf,
}: {
  blocks: ProfileBlock[];
  device: EditorDevice;
  selectedId: string | null;
  /** Tuval içinde düzenlenen blok: sürükleme kapatılır, taşma serbest kalır. */
  editingId?: string | null;
  onSelect: (id: string) => void;
  onChange: (updates: GridUpdate[], device: EditorDevice) => void;
  onManual: (id: string) => void;
  onRemove: (id: string) => void;
  renderBlock?: (block: ProfileBlock) => ReactNode;
  /** Bloğun yayına engel eksiği; varsa "Aksiyon gerekli" rozeti gösterilir. */
  issueOf?: (block: ProfileBlock) => string | null;
}) {
  const app = useCatalog(appCatalog);
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<GridStack | null>(null);
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const onChangeRef = useRef(onChange);
  const onManualRef = useRef(onManual);
  const deviceRef = useRef(device);
  const editingRef = useRef(editingId);
  // Effect senkronu (removeAll + column + makeWidget) sırasında gridstack'in
  // ürettiği change event'leri kullanıcı hareketi değildir; state'e yazılmaz.
  const syncingRef = useRef(false);
  onChangeRef.current = onChange;
  onManualRef.current = onManual;
  deviceRef.current = device;
  editingRef.current = editingId;

  const posKey = device === "mobile" ? "sm" : "lg";
  // Yapısal imza: id listesi veya konumlar değişince gridstack ile senkron ol.
  const syncKey = blocks
    .map((block) => {
      const pos = block.pos?.[posKey];
      return pos ? `${block.id}:${pos.x},${pos.y},${pos.w},${pos.h}` : block.id;
    })
    .join("|");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { GridStack } = await import("gridstack");
      if (cancelled || !containerRef.current) return;
      if (!gridRef.current) {
        const grid = GridStack.init(
          {
            column: GRID_COLUMNS.lg,
            // Yarım satır: içerik 72px + 2×6 margin. Eski 168 (=156+12)
            // basamağı 2 birim olarak aynı yerde duruyor (bkz. GRID_ROW_UNIT).
            cellHeight: 84,
            margin: 6,
            animate: true,
            float: false,
            resizable: { handles: "n,e,s,w" },
            // Tutamaç görünürlüğü CSS'te yönetilir (hover/seçim animasyonu);
            // gridstack'in display:none tabanlı autohide'ı animasyonu keser.
            alwaysShowResizeHandle: true,
          },
          containerRef.current,
        );
        if (!grid) return;
        gridRef.current = grid;
        grid.on("change", (_event, nodes) => {
          if (syncingRef.current) return;
          const updates = nodes
            .filter((node) => node.id)
            .map((node) => ({
              id: String(node.id),
              x: node.x ?? 0,
              y: node.y ?? 0,
              w: node.w ?? 1,
              h: node.h ?? 1,
            }));
          if (updates.length) onChangeRef.current(updates, deviceRef.current);
        });
        // R7: mobil görünümde elle taşınan/boyutlanan blok smManual olur.
        const markManual = (_event: Event, el: GridItemHTMLElement) => {
          const id = el.gridstackNode?.id;
          if (deviceRef.current === "mobile" && id) onManualRef.current(String(id));
        };
        grid.on("dragstop", markManual);
        grid.on("resizestop", markManual);
      }
      const grid = gridRef.current;
      if (!grid) return;
      const columns = device === "mobile" ? GRID_COLUMNS.sm : GRID_COLUMNS.lg;
      syncingRef.current = true;
      grid.batchUpdate();
      // React'in render ettiği item'ları gs-* attribute'larından yeniden kur
      // (gridstack'in resmi React entegrasyon deseni). Kolon değişimi motor
      // BOŞALDIKTAN sonra yapılır: column() kolon sayısı değişirken eski
      // düzeni cache'leyip node'ları oynatıyor, bu da cihaz geçişinde diğer
      // breakpoint'in pozisyonlarını ezen hayalet change'ler üretiyordu.
      grid.removeAll(false);
      if (grid.getColumn() !== columns) grid.column(columns, "none");
      for (const block of blocks) {
        const el = itemRefs.current.get(block.id);
        if (!el || block.type === "profile") continue;
        grid.makeWidget(el);
        grid.update(el, BLOCK_GRID_LIMITS[block.type]);
        // makeWidget sürüklemeyi sıfırlar; düzenlenen blok kilitli kalmalı.
        grid.movable(el, block.id !== editingRef.current);
      }
      // Commit change event'leri senkron tetikler; bayrak commit'ten sonra iner.
      grid.batchUpdate(false);
      syncingRef.current = false;
    })();
    return () => {
      cancelled = true;
    };
  }, [syncKey, device]);

  // Tuval içi düzenleme: contenteditable ile sürükleme çakışmasın diye
  // düzenlenen blokta gridstack taşıması kapatılır.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    for (const [id, el] of itemRefs.current) {
      if ((el as GridItemHTMLElement).gridstackNode) grid.movable(el, id !== editingId);
    }
  }, [editingId]);

  // Dokunmatikte basılı tut → sürükle. Gridstack, touchstart'ı anında sentetik
  // mousedown'a çevirip preventDefault ile sayfa kaydırmayı öldürür (dd-touch.js);
  // parmakla scroll denemesi 3px sonra sürüklemeye dönüşür. Çözüm: touchstart'ı
  // capture fazında gridstack'in item dinleyicisine ULAŞMADAN durdur. 350ms
  // basılı tutulursa aynı event nesnesi yeniden dispatch edilir (spec gereği
  // isTrusted=false olur; guard'ımız onu geçirir) ve gridstack sürüklemeyi kendi
  // normal akışıyla devralır. Süre dolmadan ~10px'ten çok hareket = scroll
  // niyeti: hiçbir şey iletilmez, sayfa doğal kayar. Fare (mousedown) bu yoldan
  // hiç geçmez — masaüstü davranışı değişmez. Bu yaklaşım movable durumuna da
  // dokunmadığı için senkron efektinin movable sıfırlamasından etkilenmez.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const HOLD_MS = 350;
    const TOLERANCE_PX = 10;
    let holdTimer: number | null = null;
    let pendingEvent: TouchEvent | null = null;
    let startX = 0;
    let startY = 0;
    let armedContent: HTMLElement | null = null;

    // Gridstack'in dokunuş/fare kilitleri modül-global statik alanlardır ve
    // yarım kalan bir etkileşimden (ör. OS gesture'ı iptal etti) bayat true
    // kalabilir. Bayat `DDTouch.touchHandled`, boyutlandırma tutamacının
    // touchstart'ını SESSİZCE yutar (dd-touch.js: `if (touchHandled) return`)
    // — tutamaçlar görünür ama resize hiç başlamaz. Her yeni dokunuşta sıfırla.
    // `DDManager` gridstack barrel'ından re-export edilir (dist/gridstack.js:
    // `export * from './dd-manager'`), o yüzden ana giriş noktasından alınır —
    // tekil örnek garanti. `DDTouch` barrel'da yok; derin import şart. Derin yol
    // güvenli: gridstack package.json'unda `exports` alanı olmadığı için
    // `gridstack/dist/dd-touch`, gridstack'in kendi relative importuyla aynı
    // dosyaya çözülür (üretim bundle'ında tek paylaşılan chunk olduğu doğrulandı).
    let locks: { touch?: { touchHandled?: boolean }; manager?: { mouseHandled?: boolean } } = {};
    void Promise.all([import("gridstack/dist/dd-touch"), import("gridstack")]).then(
      ([touch, gridstack]) => {
        locks = { touch: touch.DDTouch, manager: gridstack.DDManager };
      },
    );
    const clearStaleLocks = () => {
      if (locks.touch) locks.touch.touchHandled = false;
      if (locks.manager) delete locks.manager.mouseHandled;
    };

    const cancelHold = () => {
      if (holdTimer !== null) {
        window.clearTimeout(holdTimer);
        holdTimer = null;
      }
      pendingEvent = null;
    };
    const disarm = () => {
      armedContent?.classList.remove("is-drag-armed");
      armedContent = null;
    };

    const onTouchStart = (event: TouchEvent) => {
      // Bizim yeniden yayınladığımız sentetik event — gridstack'e geçsin.
      if (!event.isTrusted) return;
      cancelHold();
      disarm();
      // Çok parmak (pinch/zoom): kilitlere dokunma ve kolu KURMA — yoksa
      // kullanıcı yakınlaştırırken bekleyen touchstart dispatch edilip blok
      // sürüklenmeye başlar. Kol iptali yukarıda zaten yapıldı.
      if (event.touches.length > 1) return;
      const target = event.target instanceof Element ? event.target : null;
      const item = target?.closest<HTMLElement>(".grid-stack-item") ?? null;
      if (!item || !container.contains(item)) return;
      // Yeni ve tek parmaklı bir dokunuş: bu noktada süren bir sürükleme/resize
      // yok, bayat kilitler temizlenebilir.
      clearStaleLocks();
      // Boyutlandırma tutamaçları küçük ve bilinçli hedefler; beklemeden
      // çalışsın — event'i olduğu gibi gridstack'e bırak.
      if (target?.closest(".ui-resizable-handle")) return;
      // Tuval içi metin düzenlenen blok zaten kilitli; dokunuşlar caret içindir.
      // gs-id attribute'u kullanılır: senkron efektinin removeAll penceresinde
      // gridstackNode geçici olarak yok olabilir.
      if (editingRef.current && item.getAttribute("gs-id") === editingRef.current) return;
      // Kontrol öğeleri (sil rozeti, form alanları): gridstack'in _mouseDown'ı
      // bunlarda touchmove/touchend KAYDETMEDEN erken çıkar, ama dd-touch
      // `DDTouch.touchHandled = true` bırakır — bir daha hiçbir blok
      // sürüklenemez. Event'i gridstack'e hiç ulaştırma ve kolu da kurma.
      if (target?.closest('button,input,textarea,select,option,[contenteditable="true"]')) {
        event.stopPropagation();
        return;
      }
      event.stopPropagation(); // gridstack touchstart'ı görmesin → scroll serbest
      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      pendingEvent = event;
      holdTimer = window.setTimeout(() => {
        holdTimer = null;
        const held = pendingEvent;
        pendingEvent = null;
        if (!held || !item.isConnected) return;
        armedContent = item.querySelector<HTMLElement>(":scope > .editor-block");
        armedContent?.classList.add("is-drag-armed");
        navigator.vibrate?.(10);
        // Aynı nesneyi yeniden dispatch et: gridstack'in kendi touchstart
        // dinleyicisi devralır (mousedown simülasyonu + touchmove/touchend).
        held.target?.dispatchEvent(held);
      }, HOLD_MS);
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!pendingEvent) return;
      const touch = event.touches[0];
      if (!touch) return;
      if (
        Math.abs(touch.clientX - startX) > TOLERANCE_PX ||
        Math.abs(touch.clientY - startY) > TOLERANCE_PX
      ) {
        cancelHold(); // scroll niyeti — sürükleme hiç başlamasın
      }
    };

    const onTouchEnd = () => {
      cancelHold();
      disarm();
    };

    // OS gesture'ı (bildirim paneli, arama çubuğu…) dokunuşu iptal ederse
    // gridstack sürüklemeyi hiç bitirmez: blok position:fixed asılı kalır ve
    // dahili kilitler açılmaz. Kol kurulduysa elle bir bitiş sinyali yolla.
    const onTouchCancel = (event: TouchEvent) => {
      const armed = armedContent;
      cancelHold();
      disarm();
      if (!armed) return;
      const touch = event.changedTouches[0];
      document.dispatchEvent(
        new MouseEvent("mouseup", {
          bubbles: true,
          clientX: touch?.clientX ?? startX,
          clientY: touch?.clientY ?? startY,
        }),
      );
    };

    const options = { capture: true, passive: true } as const;
    container.addEventListener("touchstart", onTouchStart, options);
    container.addEventListener("touchmove", onTouchMove, options);
    container.addEventListener("touchend", onTouchEnd, options);
    container.addEventListener("touchcancel", onTouchCancel, options);
    return () => {
      cancelHold();
      disarm();
      container.removeEventListener("touchstart", onTouchStart, options);
      container.removeEventListener("touchmove", onTouchMove, options);
      container.removeEventListener("touchend", onTouchEnd, options);
      container.removeEventListener("touchcancel", onTouchCancel, options);
    };
  }, []);

  useEffect(
    () => () => {
      gridRef.current?.destroy(false);
      gridRef.current = null;
    },
    [],
  );

  return (
    <div ref={containerRef} className="grid-stack editor-grid-stack">
      {blocks.map((block) => {
        const pos = block.pos?.[posKey];
        const issue = issueOf?.(block) ?? null;
        return (
          <div
            key={block.id}
            className="grid-stack-item"
            gs-id={block.id}
            gs-x={pos?.x}
            gs-y={pos?.y}
            gs-w={pos?.w}
            gs-h={pos?.h}
            ref={(el) => {
              if (el) itemRefs.current.set(block.id, el);
              else itemRefs.current.delete(block.id);
            }}
          >
            <div
              className={`grid-stack-item-content editor-block ${selectedId === block.id ? "is-selected" : ""} ${editingId === block.id ? "is-editing" : ""} ${issue ? "is-incomplete" : ""}`}
              onClick={() => onSelect(block.id)}
            >
              {renderBlock ? renderBlock(block) : <ProfileBlockCard block={block} />}
              {issue && editingId !== block.id ? (
                <span className="block-issue-badge">
                  <WarningTriangle width={12} height={12} aria-hidden /> {issue}
                </span>
              ) : null}
              {selectedId === block.id && editingId !== block.id ? (
                <span className="selected-label">{block.type}</span>
              ) : null}
              {selectedId === block.id ? (
                <button
                  type="button"
                  className="block-delete-badge"
                  aria-label={app.editor.deleteBlock}
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemove(block.id);
                  }}
                >
                  <Trash width={14} height={14} />
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
