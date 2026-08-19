import {
  USERNAME_CHANGE_COOLDOWN_DAYS,
  USERNAME_MAX,
  USERNAME_MIN,
  USERNAME_REDIRECT_DAYS,
  formatDate,
} from "@caka/shared";

import type { AyarlarContent } from "./index";

export const en = {
  title: "Settings",
  sectionNavLabel: "Settings sections",
  sectionLabels: {
    adres: "Address",
    dil: "Language",
    "paylasim-gorseli": "Share image",
    hesap: "Account",
  },

  address: {
    title: "Address",
    hint: "The address your page is live at. If you change it, your old address keeps working for a while, then stops.",
    currentLabel: "Your current address",
    fieldLabel: "New address",
    domain: "caka.app/",
    placeholder: "yournewname",
    hintFormat: `${USERNAME_MIN}–${USERNAME_MAX} characters; lowercase letters, numbers and hyphens.`,
    consequencesTitle: "Know this before you change it",
    consequences: [
      `Your old address redirects temporarily to the new one for ${USERNAME_REDIRECT_DAYS} days. When that ends, the redirect stops and the old address no longer works.`,
      `For those same ${USERNAME_REDIRECT_DAYS} days your old address stays locked; nobody else can take it in that time.`,
      "QR codes you've printed, your business cards and old links you've put elsewhere will break once the period ends — you'll need to update them.",
      `After a change you can't change your address again for ${USERNAME_CHANGE_COOLDOWN_DAYS} days.`,
    ],
    confirmLabel: "I've read the above and I want to change my address.",
    submit: "Change address",
    submitting: "Changing…",
    checking: "checking…",
    available: "this address is free",
    unavailable: "This address is taken",
    activeRedirectsTitle: "Your old addresses still redirecting",
  },

  language: {
    title: "Language",
    hint: "The language you see Caka in. Your choice is remembered in this browser.",
    fieldLabel: "Interface language",
    note: "Your own page content isn't translated; only Caka's interface changes.",
  },

  share: {
    title: "Share image",
    hint: "This image shows up when your page link is shared on WhatsApp, X, LinkedIn and elsewhere.",
    templateTitle: "Template",
    templateGroupLabel: "Template selection",
    previewAlt: (label: string) => `Preview of the selected share image — ${label}`,
    photoTitle: "Photo source",
    photoGroupLabel: "Photo source selection",
    photoHint: "The photo used in the Portrait and Full-bleed templates.",
    photoEmptyHint:
      "The Portrait and Full-bleed templates use your profile photo. Add an image block to your page and publish it, and you'll be able to pick that here too.",
    photoDefaultLabel: "My profile photo",
    photoFallbackLabel: (index: number) => `Image ${index + 1}`,
  },

  account: {
    title: "Account",
    hint: "This information comes from the account you signed in with; it can't be changed here.",
    providerLabel: "Sign-in method",
    providerUnknown: "Unknown",
    emailLabel: "Email",
    emailVerified: "verified",
    dataTitle: "Your data",
    dataBody:
      "Requesting a copy of your data can't be done from the dashboard on your own yet. Write to hello@caka.app and your request under article 11 of the Turkish data protection law (KVKK) will be processed.",
    dataMailLabel: "hello@caka.app",
    dataMailHref: "mailto:hello@caka.app",
    privacyLinkLabel: "Privacy Policy",
    privacyLinkHref: "/gizlilik",
    privacyLinkPrefix: "Details:",

    deleteTitle: "Delete your account",
    deleteBody:
      "You can delete your account yourself, right here. Deletion happens immediately, cannot be undone, and support cannot bring it back.",
    deleteConsequencesTitle: "Know this before you delete",
    deleteConsequences: [
      "Your page goes offline immediately; your layout, your blocks and everything you wrote are deleted.",
      "Every image and document you uploaded is permanently deleted.",
      "Your page's view and click counters, your sessions and your sign-in link are deleted.",
      `Your address stays locked for ${USERNAME_REDIRECT_DAYS} days: during that time nobody — you included — can take it, and the address returns 404. That way the QR codes you printed don't land on a stranger's page.`,
      "You can sign up again with the same email, but your old page will not come back and you'll need to pick a new address.",
    ],
    deleteFieldLabel: "Type your address to confirm",
    deleteFieldHint: (username: string) => `Type ${username} in the box.`,
    deleteConfirmLabel:
      "I understand that my account and all my content will be permanently deleted and that this cannot be undone.",
    deleteSubmit: "Permanently delete my account",
    deleteSubmitting: "Deleting…",
    deleteErrors: {
      mismatch: "What you typed doesn't match your address",
      no_profile: "Your profile could not be found",
      origin: "Invalid request origin",
      unknown: "Deletion could not be completed, please try again",
    },
  },

  addressErrors: {
    same: "That's already your address",
    cooldown: `You changed your address within the last ${USERNAME_CHANGE_COOLDOWN_DAYS} days; you can't change it again yet`,
    taken: "This address is taken, try another one",
    locked: "This address is another user's old address and is currently locked",
    no_profile: "Your profile couldn't be found",
    conflict: "Your address was changed somewhere else; refresh the page",
    origin: "Invalid request origin",
    unknown: "Something went wrong, please try again",
  },

  notices: {
    cooldown: (availableOn: string, remainingDays: number) =>
      `You changed your address recently. You can change it again after ${formatDate(availableOn, "en")} (about ${remainingDays} days).`,
    redirect: (oldUsername: string, expiresOn: string) =>
      `caka.app/${oldUsername} — redirecting here and locked until ${formatDate(expiresOn, "en")}.`,
    success: (previousUsername: string, username: string, expiresOn: string) =>
      `Your address is now caka.app/${username}. caka.app/${previousUsername} will redirect here until ${formatDate(expiresOn, "en")}.`,
  },
} satisfies AyarlarContent;
