import type { LandingContent } from "~/content/landing";

/**
 * Kanıt bölümü: zemin renk bloğu, ortalanmış başlık + yaratıcı görselleri
 * dizisi. Referans sırası: 4 görsel (full/2xl/lg radius) ardından kireç
 * adres kartı ve son görsel.
 */
export function ProofSection({ proof }: { proof: LandingContent["proof"] }) {
  const radii = [
    "rounded-full",
    "rounded-2xl",
    "rounded-lg",
    "rounded-2xl",
    "rounded-full",
  ];

  return (
    <section className="bg-zemin">
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-8 lg:py-28">
        <h2 className="text-4xl leading-[1.05] font-bold tracking-tight text-murekkep sm:text-5xl">
          {proof.title} <span className="text-mavi">{proof.accent}</span> tercihi
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-4">
          {radii.map((radius, i) => {
            if (i === 3) {
              return (
                <div
                  key={i}
                  className={`flex h-[210px] items-center justify-center bg-kirec ${radius}`}
                >
                  <span className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-murekkep">
                    {proof.address}
                  </span>
                </div>
              );
            }
            const image = proof.images[i > 3 ? i - 1 : i];
            return (
              <div key={i} className={`h-[210px] overflow-hidden ${radius}`}>
                <img
                  src={image}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}