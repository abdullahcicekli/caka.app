// Hukuki belgelerin dile bağlı künyesi (L11).
//
// Sürüm ve tarih dile bağlı DEĞİLDİR: aynı belge iki dilde yayımlanıyor, iki
// ayrı belge değil. Sürüm `@caka/shared`'daki `LEGAL_DOCUMENTS`'ta durur ve
// belge değiştiğinde her iki dil birden değişir.

import type { LegalDocumentId, Locale } from "@caka/shared";

export interface LegalTitles {
  title: string;
  navLabel: string;
}

/**
 * Belge başlıkları. Hukuki metinler yalnız Türkçe ve İngilizce yazıldığı için
 * `es`/`pt-BR`/`de` İngilizce künyeyi kullanır (LKD6).
 */
const TITLES: Record<"tr" | "en", Record<LegalDocumentId, LegalTitles>> = {
  tr: {
    gizlilik: {
      title: "Gizlilik ve Aydınlatma Metni",
      navLabel: "Gizlilik ve Aydınlatma",
    },
    "kullanim-kosullari": {
      title: "Kullanım Koşulları",
      navLabel: "Kullanım Koşulları",
    },
    "cerez-politikasi": {
      title: "Çerez Politikası",
      navLabel: "Çerez Politikası",
    },
  },
  en: {
    gizlilik: {
      title: "Privacy Policy",
      navLabel: "Privacy",
    },
    "kullanim-kosullari": {
      title: "Terms of Use",
      navLabel: "Terms of Use",
    },
    "cerez-politikasi": {
      title: "Cookie Policy",
      navLabel: "Cookie Policy",
    },
  },
};

/** Belgenin hangi dilde YAZILDIĞI. Türkçe dışındaki her şey İngilizceye düşer. */
export function legalTextLocale(locale: Locale): "tr" | "en" {
  return locale === "tr" ? "tr" : "en";
}

export function legalTitles(locale: Locale, id: LegalDocumentId): LegalTitles {
  return TITLES[legalTextLocale(locale)][id];
}

/**
 * Bağlayıcılık şeridi (L11). Türkçe belgede yoktur — o zaten bağlayıcı olan
 * metnin kendisi. Diğer dillerde okuyucuya hangi metnin geçerli olduğunu
 * söyler; İngilizce sürüm bir kolaylıktır, hukuki dayanak değildir.
 */
const BINDING_NOTICE: Record<Locale, string | null> = {
  tr: null,
  en: "This English version is provided for convenience. The binding version of this document is the Turkish one.",
  es: "Esta versión en inglés se ofrece para tu comodidad. La versión vinculante de este documento es la turca.",
  "pt-BR":
    "Esta versão em inglês é oferecida por conveniência. A versão vinculante deste documento é a turca.",
  de: "Diese englische Fassung dient nur der Orientierung. Verbindlich ist die türkische Fassung dieses Dokuments.",
};

export function legalBindingNotice(locale: Locale): string | null {
  return BINDING_NOTICE[locale];
}

/** Belgenin bağlantı verdiği Türkçe sürümün etiketi (şeritteki bağlantı). */
const TURKISH_VERSION_LABEL: Record<Locale, string> = {
  tr: "Türkçe sürüm",
  en: "Turkish version",
  es: "Versión en turco",
  "pt-BR": "Versão em turco",
  de: "Türkische Fassung",
};

export function legalTurkishVersionLabel(locale: Locale): string {
  return TURKISH_VERSION_LABEL[locale];
}

/** Arama sonucunda görünen açıklama. Türkçe dışındaki diller İngilizceyi alır. */
const DESCRIPTIONS: Record<"tr" | "en", Record<LegalDocumentId, string>> = {
  tr: {
    gizlilik:
      "Caka'da kişisel verilerinin nasıl işlendiğini, hangi amaçlarla toplandığını ve haklarını açıklayan aydınlatma ve gizlilik metni.",
    "kullanim-kosullari":
      "Caka'yı kullanırken geçerli olan kurallar: hesabın, içeriğin, sorumluluklar ve hizmetin sınırları.",
    "cerez-politikasi":
      "Caka'nın cihazına yazdığı çerezler ve depolama girdileri, ne işe yaradıkları ve nasıl yönetebileceğin.",
  },
  en: {
    gizlilik:
      "How your personal data is processed on Caka, what it is collected for and what rights you have.",
    "kullanim-kosullari":
      "The rules that apply when you use Caka: your account, your content, responsibilities and the limits of the service.",
    "cerez-politikasi":
      "The cookies and storage entries Caka writes to your device, what they do and how you can manage them.",
  },
};

export function legalDescription(locale: Locale, id: LegalDocumentId): string {
  return DESCRIPTIONS[legalTextLocale(locale)][id];
}
