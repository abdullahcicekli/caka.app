import { landingAssets } from "./shared";
import type { LandingContent } from "./index";

export const de = {
  seo: {
    title: "Caka — eine persönliche Seite, die zu dir passt",
    description:
      "Bring zusammen, was du machst, deine Links und deine Projekte — auf einer persönlichen Seite.",
    imageAlt: "Erstelle deine persönliche Seite mit Caka",
  },
  nav: {
    login: { label: "Anmelden", href: "/login" },
    cta: { label: "Kostenlos starten", href: "/onboarding" },
  },
  hero: {
    title: "Ein Bio-Link,\nder zu dir passt.",
    body: "Ein Link für Instagram, TikTok, YouTube und alle deine anderen Profile — er bringt zusammen, was du teilst, machst und verkaufst.",
    claim: {
      domain: "caka.app/",
      placeholder: "deinname",
      cta: "Kostenlos starten",
      action: "/onboarding",
    },
    marquee: landingAssets.marquee,
  },
  minutes: {
    title: "Deine Caka-Seite\nin Minuten aufgebaut",
    body: "Bring deine Social-Accounts, Websites, Projekte und deinen Shop in einem Link zusammen. Stell jedes Detail selbst ein oder starte mit einem fertigen Theme.",
    cta: { label: "Kostenlos starten", href: "/onboarding" },
  },
  share: {
    title: "Teile dein Caka,\nwo immer du willst",
    body: "Setz deine Adresse in deine Profile, deine Videos und auf deine Visitenkarte. Mit deinem QR-Code holst du auch Offline-Besucher auf deine Seite.",
    cta: { label: "Kostenlos starten", href: "/onboarding" },
    image: landingAssets.shareImage,
  },
  audience: {
    title: "Kenn dein Publikum,\nhalte sein Interesse",
    body: "Sieh, welcher Link geklickt wird, woher deine Besucher kommen und was wirklich funktioniert. Und pass deine Seite danach an.",
    cta: { label: "Kostenlos starten", href: "/onboarding" },
  },
  faq: {
    title: "Fragen? Beantwortet",
    items: [
      {
        question: "Was ist Caka?",
        answer:
          "Caka ist eine Link-in-Bio-Seite, die all deine Profile, Projekte und deinen Shop unter einer Adresse zusammenbringt. Statt einer schlichten Linkliste baust du dein eigenes Layout.",
      },
      {
        question: "Was ist im kostenlosen Plan enthalten?",
        answer:
          "Anmeldung mit Google, deine eigene Adresse, das Bearbeiten im Blockraster, die Analytics-Übersicht und das Hochladen von Bildern gehören zum kostenlosen Plan.",
      },
      {
        question: "Kann ich meine eigene Domain verbinden?",
        answer:
          "Im Moment bist du unter deiner Adresse bei caka.app online. Die eigene Domain kommt zusammen mit dem kostenpflichtigen Plan.",
      },
      {
        question: "Kann ich meine Adresse später ändern?",
        answer:
          "Ja. Unter Einstellungen → Adresse. Deine alte Adresse leitet 30 Tage lang auf die neue weiter und bleibt in dieser Zeit gesperrt. Nach einer Änderung musst du 30 Tage warten, bevor du sie erneut änderst.",
      },
      {
        question: "Kann ich meine Inhalte exportieren oder mein Konto löschen?",
        answer:
          "Beides geht im Dashboard noch nicht selbstständig. Für eine Kopie deiner Daten oder die Löschung deines Kontos schreib an hello@caka.app — das ist dein Recht nach Artikel 11 des türkischen Datenschutzgesetzes (KVKK).",
        link: {
          label: "Datenschutzerklärung",
          href: "/gizlilik",
          legalDocument: "gizlilik" as const,
        },
      },
    ],
  },
  closingCta: {
    title: "Öffne heute deine\neigene Ecke im Netz",
    claim: {
      domain: "caka.app/",
      placeholder: "deinname",
      cta: "Kostenlos starten",
      action: "/onboarding",
    },
  },
  footer: {
    columns: [
      {
        title: "Caka",
        links: [
          { label: "So funktioniert's", href: "/#urun" },
          { label: "Kontakt", href: "mailto:hello@caka.app" },
        ],
      },
      {
        title: "Rechtliches",
        links: [
          { label: "Datenschutz", href: "/gizlilik", legalDocument: "gizlilik" as const },
          {
            label: "Nutzungsbedingungen",
            href: "/kullanim-kosullari",
            legalDocument: "kullanim-kosullari" as const,
          },
          {
            label: "Cookie-Richtlinie",
            href: "/cerez-politikasi",
            legalDocument: "cerez-politikasi" as const,
          },
        ],
      },
    ],
    social: landingAssets.social,
    trust: [
      {
        label: "Keine Werbe- oder Analyse-Cookies",
        href: "/cerez-politikasi",
        legalDocument: "cerez-politikasi" as const,
      },
      {
        label: "Quelloffen",
        href: "https://github.com/abdullahcicekli/caka.app",
      },
    ],
    copyright: landingAssets.copyright,
  },
} satisfies LandingContent;
