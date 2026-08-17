import type { CSSProperties } from "react";

import type { MarqueeItem } from "~/content/landing";

interface HeroMarqueeProps {
  items: readonly MarqueeItem[];
  durationSeconds: number;
}

/**
 * Hero'nun sağında dikey akan vitrin şeridi. Kart listesi kesintisiz döngü
 * için iki kez render edilir; animasyon -%50 translateY ile başa sarar.
 * Dekoratiftir: ekran okuyucuya kapalı, tıklama almaz, lg altında gizli.
 */
export function HeroMarquee({ items, durationSeconds }: HeroMarqueeProps) {
  const loop = [...items, ...items];
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-4 z-0 hidden w-[420px] overflow-hidden [mask-image:linear-gradient(to_bottom,black_82%,transparent)] sm:right-8 lg:block xl:w-[470px]"
    >
      <div
        className="flex flex-col gap-[18px] motion-safe:animate-marquee"
        style={{ animationDuration: `${durationSeconds}s` } as CSSProperties}
      >
        {loop.map((item, i) => (
          <MarqueeCard key={`${item.image}-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}

function MarqueeCard({ item }: { item: MarqueeItem }) {
  return (
    <div className="relative h-[430px] flex-none overflow-hidden rounded-[22px]">
      <img
        src={item.image}
        alt=""
        loading="lazy"
        className="size-full object-cover"
      />
    </div>
  );
}
