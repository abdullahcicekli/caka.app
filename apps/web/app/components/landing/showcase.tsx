import { cn } from "~/lib/utils";
import type { ShowcaseItem } from "~/content/landing";

const toneClasses: Record<ShowcaseItem["tone"], string> = {
  cam: "bg-cam",
  erik: "bg-erik",
  kum: "bg-kum",
  mor: "bg-mor",
};

/**
 * Hero'nun sağındaki vitrin kartları. Gerçek fotoğraf `item.image` ile
 * bağlanır; yoksa palet tonunda dekoratif bir mini profil sahnesi çizilir.
 */
export function Showcase({ items }: { items: readonly ShowcaseItem[] }) {
  return (
    <div className="flex h-full flex-col gap-4">
      {items.map((item, i) => (
        <ShowcaseCard key={item.caption ?? i} item={item} tall={i === 0} />
      ))}
    </div>
  );
}

function ShowcaseCard({ item, tall }: { item: ShowcaseItem; tall: boolean }) {
  return (
    <figure
      className={cn(
        "relative min-h-56 flex-1 overflow-hidden rounded-2xl",
        tall && "flex-[1.6]",
        !item.image && toneClasses[item.tone],
      )}
    >
      {item.image ? (
        <img
          src={item.image}
          alt={item.alt ?? item.caption ?? ""}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <DecorativeScene />
      )}
      {item.caption ? (
        <figcaption className="absolute bottom-4 left-5 text-sm font-medium text-white/90">
          {item.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

/** Fotoğraf gelene kadar kartı dolduran mini bento sahnesi. */
function DecorativeScene() {
  return (
    <div aria-hidden className="absolute inset-0">
      <div className="absolute top-6 right-6 flex w-28 flex-col gap-2 rounded-xl bg-white/15 p-2 backdrop-blur-sm">
        <div className="h-14 rounded-lg bg-white/25" />
        <div className="h-2 w-3/4 rounded-full bg-white/40" />
        <div className="h-2 w-1/2 rounded-full bg-white/25" />
      </div>
      <div className="absolute bottom-14 left-6 size-16 rounded-full bg-white/20" />
      <div className="absolute right-10 bottom-8 h-2 w-24 rounded-full bg-white/25" />
    </div>
  );
}
