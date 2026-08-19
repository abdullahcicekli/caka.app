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
    menu: {
      label: "Seitenmenü",
      open: "Menü",
      close: "Menü schließen",
      links: [
        { label: "So funktioniert's", href: "/#urun" },
        { label: "Schaufenster", href: "/#vitrin" },
        { label: "Fragen", href: "/#sss" },
        { label: "Anmelden", href: "/login" },
      ],
      card: {
        title: "Eine Seite aus Blöcken",
        body: "Links, Fotos, Musik, Karten — alles in einem Raster.",
      },
      meta: [
        "Eine persönliche Seite, die zu dir passt",
        "Keine Werbe- oder Analyse-Cookies",
      ],
    },
  },
  hero: {
    kicker: "Eine Adresse für deine persönliche Seite\nKostenlos, in Minuten online",
    title: "Ein Bio-Link,\nder zu dir passt.",
    media: {
      alt: "Ein Streifen mit Karten aus vier Caka-Seiten",
      pause: "Streifen anhalten",
      play: "Streifen abspielen",
    },
    tower: {
      kerem: {
        bio: "Musiker · Istanbul",
        status: "Diese Woche im Studio",
        document: "Pressemappe",
        link: "Tourdaten",
      },
      selin: {
        bio: "Keramikwerkstatt · Bodrum",
        status: "Werkstatt samstags offen",
        link: "Neue Kollektion: Toprak",
        location: "Bodrum, Muğla",
        country: "Türkei",
      },
      elif: {
        bio: "Podcast-Hostin · Ankara",
        status: "Neue Folge am Donnerstag",
        youtube: "Sade Hayat — hinter Folge 7",
      },
      naz: {
        bio: "Sprecherin · Izmir",
        status: "Termine sind frei",
        text: "Schreib mir für Sprecherjobs.",
      },
    },
    // Medyanın altına binen hap. Bir bio-link ürününde o hapın en
    // değerli hâli, adın orada talep edilmesidir.
    claim: {
      domain: "caka.app/",
      placeholder: "deinname",
      cta: "Kostenlos starten",
      action: "/onboarding",
    },
  },
  editorial: {
    body: "Ein Link für Instagram, TikTok, YouTube und alle deine anderen Profile — er bringt zusammen, was du teilst, machst und verkaufst.",
  },
  minutes: {
    title: "Deine Caka-Seite in Minuten aufgebaut",
    body: "Bring deine Social-Accounts, Websites, Projekte und deinen Shop in einem Link zusammen. Stell jedes Detail selbst ein oder starte mit einem fertigen Theme.",
    cta: { label: "Kostenlos starten", href: "/onboarding" },
  },
  share: {
    title: "Teile dein Caka,\nwo immer du willst",
    body: "Setz deine Adresse in deine Profile, deine Videos und auf deine Visitenkarte. Auch die Karte, die beim Teilen deines Links erscheint, wählst du selbst.",
    cta: { label: "Kostenlos starten", href: "/onboarding" },
    badges: ["Eine Adresse", "Teilen-Bild"],
    pill: "Teilen",
    image: landingAssets.shareImage,
  },
  audience: {
    title: "Kenn dein Publikum,\nhalte sein Interesse",
    body: "Sieh, welcher Link geklickt wird, aus welchem Land deine Besucher kommen und was wirklich funktioniert. Und pass deine Seite danach an.",
    cta: { label: "Kostenlos starten", href: "/onboarding" },
    badges: ["Klicks", "Länder"],
    pill: "Analytics",
  },
  showcase: {
    title: "Für den echten Alltag gebaut",
    body: "Drei Schritte: Seite aufbauen, teilen, messen.",
    segments: [
      { id: "kur", label: "Aufbauen" },
      { id: "paylas", label: "Teilen" },
      { id: "olc", label: "Messen" },
    ],
    cards: [
      {
        title: "Blockraster",
        body: "Zieh deine Blöcke, ändere ihre Größe, bau die Seite in deinem eigenen Layout.",
      },
      {
        title: "Fertige Themes",
        body: "Entscheide Farbe und Typografie mit einer Auswahl — und ändere danach, was du willst.",
      },
      {
        title: "Eine Adresse",
        body: "caka.app/deinname — der eine Link für deine Profile, Videos und Visitenkarte.",
      },
      {
        title: "Teilen-Bild",
        body: "Die Karte beim Teilen deines Links wählst du selbst — Vorlage und Foto gehören dir.",
      },
      {
        title: "Klick-Übersicht",
        body: "Sieh, welcher Block Aufmerksamkeit bekommt, und ordne deine Seite danach neu.",
      },
      {
        title: "Länder",
        body: "Sieh, aus welchem Land deine Besucher kommen, und wisse, zu wem du sprichst.",
      },
    ],
    prev: "Vorherige Karte",
    next: "Nächste Karte",
    trackLabel: "Schaufenster-Karten",
  },
  faq: {
    title: "Fragen? Beantwortet",
    label: "Häufige Fragen",
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
    accent: "Kostenlos. Werbefrei. Deins.",
    claim: {
      domain: "caka.app/",
      placeholder: "deinname",
      cta: "Kostenlos starten",
      action: "/onboarding",
    },
  },
  outro: {
    line: "Die Seite, die du heute öffnest, gehört morgen immer noch dir.",
    pills: ["Open Source", "In fünf Sprachen", "caka.app"],
  },
  footer: {
    tagline: "Caka — eine persönliche Seite, die zu dir passt",
    columns: [
      {
        title: "Produkt",
        links: [
          { label: "So funktioniert's", href: "/#urun" },
          { label: "Schaufenster", href: "/#vitrin" },
          { label: "Fragen", href: "/#sss" },
        ],
      },
      {
        title: "Caka",
        links: [
          { label: "Kostenlos starten", href: "/onboarding" },
          { label: "Anmelden", href: "/login" },
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
        label: "Open Source",
        href: "https://github.com/abdullahcicekli/caka.app",
      },
    ],
    copyright: landingAssets.copyright,
  },
} satisfies LandingContent;
