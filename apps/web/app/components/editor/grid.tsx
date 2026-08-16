// Gridstack v13 tabanlı editör grid'i (KTD8 Plan B). Gridstack DOM'u kendisi
// konumlandırır; React yalnızca item listesini ve içeriği render eder.
// Sözleşme: item sarmalayıcısının className'i sabit kalır (gridstack'in
// eklediği sınıflar React diff'inde silinmesin), seçim stili içteki
// content div'ine uygulanır. Gridstack yalnızca client'ta dinamik import
// edilir — SSR bundle'ına girmez.
import { useEffect, useRef, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import type { GridItemHTMLElement, GridStack } from "gridstack";

import {
  BLOCK_GRID_LIMITS,
  GRID_COLUMNS,
  type ProfileBlock,
} from "@caka/shared";
import { ProfileBlockCard } from "~/components/profile-block";

import "gridstack/dist/gridstack.min.css";

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
}) {
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
            cellHeight: 168,
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
              className={`grid-stack-item-content editor-block ${selectedId === block.id ? "is-selected" : ""} ${editingId === block.id ? "is-editing" : ""}`}
              onClick={() => onSelect(block.id)}
            >
              {renderBlock ? renderBlock(block) : <ProfileBlockCard block={block} />}
              {selectedId === block.id && editingId !== block.id ? (
                <span className="selected-label">{block.type}</span>
              ) : null}
              {selectedId === block.id ? (
                <button
                  type="button"
                  className="block-delete-badge"
                  aria-label="Bloğu sil"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemove(block.id);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
