// Bağlantı tıklaması ölçümü (R48) — yalnızca `/:username` public sayfasında
// render edilir, panel önizlemesinde DEĞİL.
//
// Tasarım kararı: bağlantının `href`'i gerçek hedeftir, yönlendirme ucuna
// çevrilmez. Böylece JavaScript kapalı ziyaretçide bağlantı birebir çalışır
// (tıklama sayılmaz, bağlantı çalışır), hedef adres imleç üstünde görünür,
// yaratıcının dış bağlantı değeri bir ara sıçramaya kurban gitmez ve hedef
// hiçbir üçüncü tarafa uğramaz.
//
// CİHAZA HİÇBİR ŞEY YAZILMAZ: burada `document.cookie`, `localStorage`,
// `sessionStorage` veya IndexedDB'ye tek bir erişim yoktur. `sendBeacon`
// gidiş yönlü, yanıtsız bir POST'tur; sunucu gövdesiz 204 döner.
import { useEffect } from "react";

const BEACON_URL = "/api/olcum/tiklama";

function sendClick(username: string, blockId: string) {
  const payload = JSON.stringify({ u: username, b: blockId });
  try {
    // text/plain: basit istek olarak gider, ön-uçuş (preflight) doğmaz.
    const blob = new Blob([payload], { type: "text/plain;charset=UTF-8" });
    if (navigator.sendBeacon?.(BEACON_URL, blob)) return;
  } catch {
    // sendBeacon yoksa/başarısızsa keepalive fetch'e düşülür.
  }
  try {
    void fetch(BEACON_URL, {
      method: "POST",
      body: payload,
      keepalive: true,
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
    }).catch(() => {});
  } catch {
    // Ölçüm best-effort; gezinme her hâlükârda devam eder.
  }
}

export function LinkClickBeacon({ username }: { username: string }) {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      // Sağ tık menüsünden açmalar sayılmaz; sol tık ve orta tık sayılır.
      if (event.button !== 0 && event.button !== 1) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      // Bağlantılar ve YERİNDE OYNATILAN medya kartları. İkincisi bir <a>
      // değil (gömme modunda kart bir düğme), o yüzden ayrıca işaretli:
      // aksi hâlde YouTube/Spotify blokları panelde hep sıfır görünürdü.
      const trigger = target.closest('a[href], [data-measure="play"]');
      if (!trigger) return;
      // Aynı blokta İKİNCİL bir bağlantı olabilir ve onu saymak sayacı
      // yalancı yapar: belge kartında "Önizle" de bir <a>'dır, sayılsaydı
      // paneldeki "Belge" satırı indirme değil "indirme + önizleme" olurdu
      // ama indirme diye okunurdu. Blok başına TEK bir birincil eylem
      // sayılır; ikincil olan kendini işaretler.
      if (trigger.getAttribute("data-measure") === "skip") return;
      const holder = trigger.closest("[data-block-id]");
      const blockId = holder?.getAttribute("data-block-id");
      if (!blockId) return;
      sendClick(username, blockId);
    }

    // Yakalama fazı: bir bileşen tıklamayı durdursa bile ölçüm kaçmaz.
    document.addEventListener("click", onClick, true);
    document.addEventListener("auxclick", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("auxclick", onClick, true);
    };
  }, [username]);

  return null;
}
