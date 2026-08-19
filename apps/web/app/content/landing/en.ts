import { landingAssets } from "./shared";
import type { LandingContent } from "./index";

export const en = {
  seo: {
    title: "Caka — a personal page that's yours",
    description:
      "Bring what you make, your links and your projects together on one personal page.",
    imageAlt: "Build your personal page with Caka",
  },
  nav: {
    login: { label: "Log in", href: "/login" },
    cta: { label: "Start free", href: "/onboarding" },
    menu: {
      label: "Site menu",
      open: "Menu",
      close: "Close menu",
      links: [
        { label: "How it works", href: "/#urun" },
        { label: "Showcase", href: "/#karakterler" },
        { label: "Questions", href: "/#sss" },
        { label: "Log in", href: "/login" },
      ],
      card: {
        title: "A page built from blocks",
        body: "Links, photos, music, maps — all on one grid.",
      },
      meta: ["A personal page that's yours", "No advertising or analytics cookies"],
    },
  },
  hero: {
    kicker: "One address for your personal page\nFree, live in minutes",
    title: "A bio link\nthat's yours.",
    media: {
      alt: "A strip of cards flowing from four Caka pages",
      pause: "Pause the strip",
      play: "Play the strip",
    },
    tower: {
      elif: { youtube: "Behind episode 40" },
      sena: { bio: "Physiotherapy · Ankara" },
      selin: { link: "New collection: Toprak" },
      ozan: { link: "Tour dates" },
      onur: { location: "Bodrum, Muğla", country: "Türkiye" },
      yusuf: { document: "This week's menu" },
      serkan: { status: "New season sign-ups are open" },
      rabia: { text: "Message me for illustration work." },
      can: { status: "Saturday night set" },
      furkan: { link: "New story: Uzun Yol" },
      kaan: { bio: "Video · Istanbul" },
      deniz: { bio: "Teacher · Eskişehir" },
      tolga: { status: "New prints on the way" },
      volkan: { status: "Sunday run at 7am" },
      ahmet: { bio: "Bicycles · İzmir" },
      esra: { link: "Order form" },
    },
    // Medyanın altına binen hap. Bir bio-link ürününde o hapın en
    // değerli hâli, adın orada talep edilmesidir.
    claim: {
      domain: "caka.app/",
      placeholder: "yourname",
      cta: "Start free",
      action: "/onboarding",
    },
  },
  editorial: {
    body: "One link for your Instagram, TikTok, YouTube and every other profile — bringing together everything you share, make and sell.",
  },
  minutes: {
    title: "Build your Caka page in minutes",
    body: "Gather your social accounts, sites, projects and shop into one link. Tune every detail yourself, or start from a ready-made theme.",
    cta: { label: "Start free", href: "/onboarding" },
  },
  share: {
    title: "Share your Caka\nwherever you want",
    body: "Put your address on your profiles, your videos and your business card. You pick the card people see when your link is shared, too.",
    cta: { label: "Start free", href: "/onboarding" },
    badges: ["One address", "Share image"],
    pill: "Sharing",
    image: landingAssets.shareImage,
  },
  audience: {
    title: "Know your audience,\nkeep their attention",
    body: "See which link gets clicked, which country your visitors come from and what actually works. Update your page accordingly.",
    cta: { label: "Start free", href: "/onboarding" },
    badges: ["Clicks", "Countries"],
    pill: "Analytics",
  },
  karakterler: {
    title: "Every page looks like the person behind it",
    body: "One product, six professions. The screens inside those phones are real Caka pages, not screenshots.",
    trackLabel: "Character cards",
    jobs: {
      yazilimci: "Software engineer",
      youtuber: "YouTuber",
      sporHocasi: "Personal trainer",
      muzisyen: "Musician",
      gazeteci: "Journalist",
      diyetisyen: "Dietitian",
    },
  },
  faq: {
    title: "Questions? Answered",
    label: "Frequently asked",
    items: [
      {
        question: "What is Caka?",
        answer:
          "Caka is a link-in-bio page that gathers all your profiles, projects and shop at a single address. Instead of a plain list of links, you build your own layout.",
      },
      {
        question: "What's included in the free plan?",
        answer:
          "Signing up with Google, your own address, block-based grid editing, an analytics summary and image uploads are all part of the free plan.",
      },
      {
        question: "Can I connect my own domain?",
        answer:
          "Right now you're live at your address under caka.app. Connecting your own domain is on the way, together with a paid plan.",
      },
      {
        question: "Can I change my address later?",
        answer:
          "Yes. You can change it under Settings → Address; your old address redirects to the new one for 30 days and stays locked for that period. After a change you need to wait 30 days before changing it again.",
      },
      {
        question: "Can I delete my account?",
        answer:
          "Yes, you can do it yourself: go to Settings → Account, type your address and confirm. Deletion happens immediately and cannot be undone.",
      },
      {
        question: "What happens when I delete my account?",
        answer:
          "Your page goes offline immediately; your layout, the images and documents you uploaded, your page statistics and your sessions are deleted. Your address stays locked for 30 days — nobody can take it during that time, so the QR codes you printed don't land on a stranger's page. After that the name is free again.",
      },
      {
        question: "Can I export my content?",
        answer:
          "Export isn't available from the dashboard yet. To request a copy of your data, write to hello@caka.app — this is your right under article 11 of the Turkish data protection law (KVKK).",
        link: {
          label: "Privacy Policy",
          href: "/gizlilik",
          legalDocument: "gizlilik" as const,
        },
      },
    ],
  },
  closingCta: {
    title: "Open your own corner\nof the internet today",
    accent: "Free. Ad-free. Yours.",
    claim: {
      domain: "caka.app/",
      placeholder: "yourname",
      cta: "Start free",
      action: "/onboarding",
    },
  },
  outro: {
    line: "The page you open today still belongs to you tomorrow.",
    pills: ["Open source", "In five languages", "caka.app"],
  },
  footer: {
    tagline: "Caka — a personal page that's yours",
    columns: [
      {
        title: "Product",
        links: [
          { label: "How it works", href: "/#urun" },
          { label: "Showcase", href: "/#karakterler" },
          { label: "Questions", href: "/#sss" },
        ],
      },
      {
        title: "Caka",
        links: [
          { label: "Start free", href: "/onboarding" },
          { label: "Log in", href: "/login" },
          { label: "Contact", href: "mailto:hello@caka.app" },
        ],
      },
      {
        title: "Legal",
        links: [
          { label: "Privacy", href: "/gizlilik", legalDocument: "gizlilik" as const },
          {
            label: "Terms of Use",
            href: "/kullanim-kosullari",
            legalDocument: "kullanim-kosullari" as const,
          },
          {
            label: "Cookie Policy",
            href: "/cerez-politikasi",
            legalDocument: "cerez-politikasi" as const,
          },
        ],
      },
    ],
    social: landingAssets.social,
    trust: [
      {
        label: "No advertising or analytics cookies",
        href: "/cerez-politikasi",
        legalDocument: "cerez-politikasi" as const,
      },
      {
        label: "Open source",
        href: "https://github.com/abdullahcicekli/caka.app",
      },
    ],
    copyright: landingAssets.copyright,
  },
  farewell: {
    title: "Your account is deleted",
    body: "Your page is offline and your data is gone. You can start again whenever you want.",
  },
} satisfies LandingContent;
