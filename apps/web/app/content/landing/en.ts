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
  },
  hero: {
    title: "A bio link\nthat's yours.",
    body: "One link for your Instagram, TikTok, YouTube and every other profile — bringing together everything you share, make and sell.",
    claim: {
      domain: "caka.app/",
      placeholder: "yourname",
      cta: "Start free",
      action: "/onboarding",
    },
    marquee: landingAssets.marquee,
  },
  minutes: {
    title: "Build your Caka page\nin minutes",
    body: "Gather your social accounts, sites, projects and shop into one link. Tune every detail yourself, or start from a ready-made theme.",
    cta: { label: "Start free", href: "/onboarding" },
  },
  share: {
    title: "Share your Caka\nwherever you want",
    body: "Put your address on your profiles, your videos and your business card. Bring offline traffic to your page with your QR code.",
    cta: { label: "Start free", href: "/onboarding" },
    image: landingAssets.shareImage,
  },
  audience: {
    title: "Know your audience,\nkeep their attention",
    body: "See which link gets clicked, where your visitors come from and what actually works. Update your page accordingly.",
    cta: { label: "Start free", href: "/onboarding" },
  },
  faq: {
    title: "Questions? Answered",
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
        question: "Can I export my content or delete my account?",
        answer:
          "Neither can be done from the dashboard on your own yet. To request a copy of your data or the deletion of your account, write to hello@caka.app — this is your right under article 11 of the Turkish data protection law (KVKK).",
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
    claim: {
      domain: "caka.app/",
      placeholder: "yourname",
      cta: "Start free",
      action: "/onboarding",
    },
  },
  footer: {
    columns: [
      {
        title: "Caka",
        links: [
          { label: "How it works", href: "/#urun" },
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
} satisfies LandingContent;
