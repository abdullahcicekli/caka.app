// Widget metinlerinin dilden bağımsız yardımcıları.
//
// Sayı ve tarih biçimleyicileri `Intl` KULLANMAZ: çıktı hem Worker'da hem
// tarayıcıda birebir aynı olmalı (SSR + hidrasyon) ve ICU verisi ortama göre
// değişebiliyor. Bu yüzden her dil kendi kısaltmalarını ve ondalık ayırıcısını
// veri olarak verir, biçimleme burada tek yerde yapılır.

export interface NumberFormat {
  /** Ondalık ayırıcı: Türkçe/Almanca/İspanyolca/Portekizce virgül, İngilizce nokta. */
  decimal: string;
  /** Bin, milyon ve milyar kısaltmaları — sayıdan sonra boşlukla basılır. */
  thousand: string;
  million: string;
  billion: string;
}

function decimalOne(value: number, separator: string): string {
  const rounded = Math.round(value * 10) / 10;
  if (rounded >= 10) return String(Math.round(rounded));
  return String(rounded).replace(".", separator);
}

/** "842" / "1,2 B" / "3,4 Mn" / "1,1 Mr" (Türkçe örnekleri). */
export function shortNumber(count: number, format: NumberFormat): string {
  if (count < 1_000) return String(count);
  if (count < 1_000_000) return `${decimalOne(count / 1_000, format.decimal)} ${format.thousand}`;
  if (count < 1_000_000_000) {
    return `${decimalOne(count / 1_000_000, format.decimal)} ${format.million}`;
  }
  return `${decimalOne(count / 1_000_000_000, format.decimal)} ${format.billion}`;
}

export interface RelativeTimeLabels {
  today: string;
  yesterday: string;
  days: (n: number) => string;
  weeks: (n: number) => string;
  months: (n: number) => string;
  years: (n: number) => string;
}

/**
 * "bugün" / "dün" / "3 gün önce" / "2 hafta önce" / "5 ay önce" / "1 yıl önce".
 * `now` dışarıdan verilir ki fonksiyon saf kalsın ve test edilebilsin.
 */
export function relativeTime(isoDate: string, now: number, labels: RelativeTimeLabels): string {
  const published = Date.parse(isoDate);
  if (!Number.isFinite(published)) return "";
  const days = Math.floor((now - published) / 86_400_000);
  if (days < 0) return "";
  if (days === 0) return labels.today;
  if (days === 1) return labels.yesterday;
  if (days < 7) return labels.days(days);
  if (days < 30) return labels.weeks(Math.floor(days / 7));
  if (days < 365) return labels.months(Math.floor(days / 30));
  return labels.years(Math.floor(days / 365));
}

/**
 * "02:31" — 24 saatlik gösterim (tr, de, es, pt-BR).
 *
 * `Intl` KULLANILMIYOR: dosyanın başındaki gerekçenin aynısı. Saat pili yalnız
 * istemcide basıldığı için teknik olarak mümkün olurdu, ama o zaman aynı sayfa
 * iki tarayıcıda iki farklı ayırıcıyla (dar boşluk, farklı iki nokta)
 * görünebilirdi. Biçim burada, dilin kendi kataloğunda sabit.
 */
export function clock24(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** "2:31 AM" — 12 saatlik gösterim (en). Öğlen 12 PM, gece yarısı 12 AM. */
export function clock12(hour: number, minute: number, am: string, pm: string): string {
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}:${String(minute).padStart(2, "0")} ${hour < 12 ? am : pm}`;
}
