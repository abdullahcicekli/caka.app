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
        { label: "Schaufenster", href: "/#karakterler" },
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
      elif: { youtube: "Hinter Folge 40" },
      sena: { bio: "Physiotherapie · Ankara" },
      selin: { link: "Neue Kollektion: Toprak" },
      ozan: { link: "Tourdaten" },
      onur: { location: "Bodrum, Muğla", country: "Türkei" },
      yusuf: { document: "Menü der Woche" },
      serkan: { status: "Anmeldung ist offen" },
      rabia: { text: "Schreib mir für Illustrationen." },
      can: { status: "Set am Samstagabend" },
      furkan: { link: "Neue Geschichte: Uzun Yol" },
      kaan: { bio: "Video · Istanbul" },
      deniz: { bio: "Lehrer · Eskişehir" },
      tolga: { status: "Neue Drucke bald da" },
      volkan: { status: "Sonntagslauf um 7 Uhr" },
      ahmet: { bio: "Fahrräder · Izmir" },
      esra: { link: "Bestellformular" },
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
  karakterler: {
    title: "Jede Seite sieht aus wie ihr Mensch",
    body: "Ein Produkt, sechs Berufe. Die Bildschirme in diesen Telefonen sind echte Caka-Seiten, keine Screenshots.",
    trackLabel: "Charakterkarten",
    jobs: {
      yazilimci: "Softwareentwickler",
      youtuber: "YouTuber",
      sporHocasi: "Personal Trainer",
      muzisyen: "Musiker",
      gazeteci: "Journalistin",
      diyetisyen: "Ernährungsberaterin",
    },
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
        question: "Kann ich mein Konto löschen?",
        answer:
          "Ja, du kannst es selbst tun: unter Einstellungen → Konto deine Adresse eintippen und bestätigen. Die Löschung passiert sofort und lässt sich nicht rückgängig machen.",
      },
      {
        question: "Was passiert, wenn ich mein Konto lösche?",
        answer:
          "Deine Seite geht sofort offline; dein Layout, die hochgeladenen Bilder und Dokumente, die Statistik deiner Seite und deine Sitzungen werden gelöscht. Deine Adresse bleibt 30 Tage gesperrt — in dieser Zeit kann sie niemand nehmen, damit deine gedruckten QR-Codes nicht auf der Seite einer fremden Person landen. Danach ist der Name wieder frei.",
      },
      {
        question: "Kann ich meine Inhalte exportieren?",
        answer:
          "Ein Export ist im Dashboard noch nicht möglich. Für eine Kopie deiner Daten schreib an hello@caka.app — das ist dein Recht nach Artikel 11 des türkischen Datenschutzgesetzes (KVKK).",
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
  footer: {
    tagline: "Caka — eine persönliche Seite, die zu dir passt",
    columns: [
      {
        title: "Produkt",
        links: [
          { label: "So funktioniert's", href: "/#urun" },
          { label: "Schaufenster", href: "/#karakterler" },
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
  farewell: {
    title: "Dein Konto ist gelöscht",
    body: "Deine Seite ist offline und deine Daten sind weg. Du kannst jederzeit neu anfangen.",
  },
} satisfies LandingContent;
