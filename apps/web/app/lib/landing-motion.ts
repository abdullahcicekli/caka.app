// Landing'in kaydırmaya bağlı hareketinin ince JS katmanı.
//
// NEDEN JS: koreografinin CSS karşılığı `animation-timeline: view()` olurdu
// ama Firefox'ta hâlâ bayrak arkasında; bir bölüm bütün tarayıcılarda ya
// çalışmalı ya hiç çalışmamalı. GSAP/Framer/Lenis gibi bir kütüphane EKLENMEDİ
// (bundle bedeli bu iş için hiçbir şey kazandırmıyor): burada tek bir
// `scroll` dinleyicisi, tek bir `requestAnimationFrame` ve kare başına tek bir
// stil yazımı var.
//
// HAREKET KAPISI: `prefers-reduced-motion: reduce` altında dinleyici HİÇ
// KURULMAZ; ilerleme değişkeni CSS'teki varsayılanında (1 = koreografi
// tamamlanmış) kalır, yani bölüm statik ve okunur görünür.
//
// SSR: `window` yalnız efektin içinde okunur; sunucu çıktısı ile ilk istemci
// render'ı birebir aynıdır.

import { useEffect, useState, type RefObject } from "react";

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Ziyaretçi hareketi azaltmayı istiyor mu?
 *
 * İlk değer HER ZAMAN `false` döner (sunucuda `matchMedia` yok) ve gerçek
 * değer efektte okunur. Bu yüzden bu hook'un çıktısı render'ın *yapısını*
 * değiştirmemeli — yalnız hareketi açıp kapamalı.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(REDUCE_QUERY);
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/**
 * `element` viewport'tan geçerken 0→1 giden ilerlemeyi `--lp-p` özel
 * değişkenine yazar. Değeri React state'ine ALMAZ: her karede yeniden render
 * etmek yerine tek bir stil yazımı yapar.
 *
 * İlerleme, kabın üstü viewport'un üstüne geldiğinde 0; kap kaydırma boyunun
 * sonuna geldiğinde 1'dir (`sticky` çocuk tam o aralık boyunca sabit durur).
 */
export function useScrollProgress(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
): void {
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    let frame = 0;
    const write = () => {
      frame = 0;
      const rect = element.getBoundingClientRect();
      // Kaydırılabilir mesafe: kabın boyu eksi sabit duran çocuğun boyu
      // (≈ viewport). Sıfıra bölme koruması: kısa kapta ilerleme 1 kalır.
      const travel = rect.height - window.innerHeight;
      const progress = travel <= 0 ? 1 : clamp01(-rect.top / travel);
      element.style.setProperty("--lp-p", progress.toFixed(4));
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(write);
    };

    write();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      element.style.removeProperty("--lp-p");
    };
  }, [ref, enabled]);
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/**
 * Sabitlenen ifade bolumunde kelimelerin baslangic dagilimi.
 *
 * SABIT, rastgelelik YOK: `Math.random()` sunucu ve istemcide farkli deger
 * uretir ve hidrasyonu kirardi.
 *
 * Yatay kayma kelimenin satirdaki YERINDEN turer — merkeze gore disari acilir.
 * Sabit bir tablo kullanilsaydi komsu kelimeler birbirine dogru kayip ust uste
 * biner, dagilim "dagitilmis" degil "cakismis" gorunurdu. Dikey kayma ve donme
 * ise tablodan gelir: ritim tekdüze olmasin.
 */
const WORD_DRIFT = [
  { dy: "-1.45em", rot: "-9deg" },
  { dy: "1.2em", rot: "7deg" },
  { dy: "-0.75em", rot: "5deg" },
  { dy: "1.6em", rot: "-6deg" },
  { dy: "-1.15em", rot: "10deg" },
  { dy: "0.85em", rot: "-4deg" },
  { dy: "-1.6em", rot: "6deg" },
] as const;

/** Kelimeler merkezden disari bu adimla acilir. */
// 0,45em: daha genisi uzun cumlelerde kenar kelimeyi kaptan tasiriyor
// (`overflow-x: clip` onu keserdi).
const WORD_SPREAD_EM = 0.45;

export function wordOffset(index: number, total: number) {
  const fromCenter = index - (total - 1) / 2;
  const drift = WORD_DRIFT[index % WORD_DRIFT.length];
  return {
    dx: `${(fromCenter * WORD_SPREAD_EM).toFixed(3)}em`,
    dy: drift.dy,
    rot: drift.rot,
  };
}
