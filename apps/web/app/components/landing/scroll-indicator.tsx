import { useEffect, useState } from "react";

/**
 * Sağ kenardaki dikey hap: hangi bölümdeyiz, noktalarla.
 *
 * TAMAMEN DEKORATİF. `aria-hidden` ve `pointer-events: none` — tıklanmaz,
 * ekran okuyucuya okunmaz ve TEK gezinme yolu değildir: aynı bölümlere menü
 * katmanından ve footer'dan gerçek bağlantı var. Dar ekranda ve dokunmatikte
 * hiç render edilmez (CSS).
 *
 * Hesap `IntersectionObserver` ile: kare başına scroll dinlemek yerine tarayıcı
 * hangi bölümün görünür olduğunu kendi söyler.
 */
export function ScrollIndicator({ ids }: { ids: readonly string[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = sections.indexOf(entry.target as HTMLElement);
          if (index >= 0) setActive(index);
        }
      },
      // Viewport'un orta şeridi: bölüm ekranın ortasına geldiğinde aktif olur.
      { rootMargin: "-45% 0px -45% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [ids]);

  return (
    <div className="lp-progress" aria-hidden>
      {ids.map((id, index) => (
        <span
          key={id}
          className={`lp-progress-dot${index === active ? " is-active" : ""}`}
        />
      ))}
    </div>
  );
}
