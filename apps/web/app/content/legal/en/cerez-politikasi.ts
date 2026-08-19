// Cookie Policy — English version of `../tr/cerez-politikasi.ts` (L11/LKD8).
//
// This is a section-by-section rendering of the Turkish text, not a rewrite.
// The Turkish version is the binding one; if the two ever disagree, the
// Turkish text wins and this file is corrected.
//
// KTD21 still applies: the table in section 4 is not written by hand, it is
// produced from `COOKIE_INVENTORY` via `cookieTableRows("en")`. A new cookie
// goes into the inventory first and both language versions change with it.
import { cookieTableRows } from "@caka/shared";
import type { LegalRow, LegalSection } from "@caka/shared";

const cookieRows: LegalRow[] = cookieTableRows("en").map((row) => [
  [row.name],
  [row.storage],
  [row.category],
  [row.purpose],
  [row.lifetime],
  [row.party],
  [row.provider],
]);

export const cerezPolitikasiSectionsEn: LegalSection[] = [
  {
    id: "cerez-nedir",
    heading: "1. What a cookie is and which ones Caka uses",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "A cookie is a small text file your browser writes to your device " +
            "when you visit a site. It is sent back to the same site on later " +
            "requests, so the site can remember you from the previous one. " +
            "Cookies fall under Turkish personal data protection law no. 6698 " +
            "(KVKK), which is why this page exists.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Caka uses cookies only to make sign-in and sign-up work. Of the " +
            "other storage the browser offers, ",
          { kind: "strong", text: "localStorage" },
          " is not used anywhere in Caka: there is not a single call to that " +
            "API in the application's source, and no persistent storage entry " +
            "is created in your browser on Caka's behalf.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Two entries can appear in sessionStorage. " },
          "Your browser writes the first one as you move between pages: ",
          { kind: "strong", text: "react-router-scroll-positions" },
          ". It is placed by the site's navigation layer (React Router) and " +
            "has exactly one job: remembering how far down each page you " +
            "scrolled, so that pressing back returns you to where you were " +
            "instead of jumping to the top. It contains nothing but pixel " +
            "values.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "The second is ",
          { kind: "strong", text: "react-router-manifest-version" },
          ", and it only appears if ",
          {
            kind: "strong",
            text: "your tab happens to be open at the moment we release a new version of the site",
          },
          ". The page is refreshed once so you don't stay stuck on the old " +
            "version; this entry records which version it refreshed for, so " +
            "the refresh does not loop. It holds nothing but a version tag and " +
            "is deleted as soon as the refresh succeeds. On most visits it " +
            "never appears at all — but because it can, we write it down here.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Both are ",
          { kind: "strong", text: "first party" },
          " — only caka.app reads them, they are never sent to the server — " +
            "they carry no identity or other personal data, and they are ",
          { kind: "strong", text: "deleted by themselves when you close the tab" },
          ". If you open DevTools you will see them; that is why we write them " +
            "here too and list them together with the other entries in ",
          { kind: "link", text: "the table in section 4", href: "#cerez-tablosu" },
          ".",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "If you are only browsing, no cookie is written to your device. " },
          "Opening the home page or a Caka profile writes no cookie. Cookies " +
            "appear only once you start signing in, or when you pick an " +
            "address during sign-up. You can see every entry that touches your " +
            "device — four cookies and the two sessionStorage entries above — " +
            "in ",
          { kind: "link", text: "the table in section 4", href: "#cerez-tablosu" },
          ".",
        ],
      },
    ],
  },

  {
    id: "kullanmadiklarimiz",
    heading: "2. The cookies we don't use",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "On most sites this section is long. On Caka it is short, because " +
            "what makes the list long is not what we use but what we don't:",
        ],
      },
      {
        kind: "list",
        style: "bullet",
        items: [
          [
            { kind: "strong", text: "No analytics or measurement cookies. " },
            "We don't write a cookie to your device to count how many people " +
              "visited which page.",
          ],
          [
            { kind: "strong", text: "No advertising, marketing or retargeting cookies. " },
            "There are no ads on Caka and no tag is placed to follow you " +
              "across other sites.",
          ],
          [
            { kind: "strong", text: "No third-party pixels. " },
            "Our pages carry no measurement pixels or embedded tracking " +
              "scripts from ad networks or social platforms.",
          ],
          [
            { kind: "strong", text: "No fingerprinting. " },
            "We also don't use any method that combines your device's " +
              "characteristics to recognise you in place of a cookie.",
          ],
          [
            { kind: "strong", text: "No cross-site tracking. " },
            "The cookies Caka writes are read only within caka.app; we cannot " +
              "see your browsing on other sites.",
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "So how do we count visits? " },
          "For visit measurement we use ",
          { kind: "strong", text: "Cloudflare Web Analytics" },
          ". It works without cookies: it writes nothing to the visitor's " +
            "device, reads nothing from it and assigns you no identifier. We " +
            "did not leave this as a claim, ",
          { kind: "strong", text: "we opened the browser and checked" },
          ": with a clean browser profile the home page and a profile page " +
            "were opened, and in the browser's developer tools no cookie, no " +
            "localStorage entry and no device identifier belonging to the " +
            "measurement was created. While the page loads your browser only " +
            "downloads the measurement script; we write that request down " +
            "separately in ",
          {
            kind: "link",
            text: "section 6",
            href: "#cihaza-yazmayan-istekler",
          },
          ". If this tool starts writing to the device tomorrow it goes into " +
            "the inventory, the table and this section change together, and " +
            "the consent position is reconsidered.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          {
            kind: "strong",
            text: "We also have our own counter — that one is cookie-free too. ",
          },
          "When you open a public Caka profile, we increment a counter in our " +
            "own database so the owner of that page can see in their dashboard " +
            "how many times the page was viewed and how many times each link " +
            "was clicked. This counting happens entirely on the server: ",
          {
            kind: "strong",
            text: "nothing is written to your device, nothing is read from it",
          },
          " and no identifier is assigned to you — which is why it has no row " +
            "in the table in section 4. Link clicks are reported by a small " +
            "piece of JavaScript in your browser, but it only sends which " +
            "block was clicked and receives nothing in return. What is stored " +
            "and what exactly the owner can see is written in the ",
          {
            kind: "link",
            text: "Privacy Policy",
            href: "/gizlilik#islenen-veriler",
          },
          ".",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "There is a cost to this. " },
          "Because we chose cookie-free, lightweight measurement, our numbers " +
            "are incomplete: ad blockers block the measurement script, so some " +
            "visits are never counted at all, and because campaign parameters " +
            "at the end of an address (the ones starting with utm_) are not " +
            "recorded, we also cannot see which campaign brought how many " +
            "visits. We accepted this knowingly; nowhere do we claim our " +
            "measurement is complete.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "In short: ",
          {
            kind: "strong",
            text:
              "Caka has no analytics cookies, no advertising or marketing " +
              "cookies, no ad or social media pixels and no fingerprinting " +
              "techniques; every cookie we use is in the strictly necessary " +
              "category.",
          },
          " This is not an empty commitment but the current state of the " +
            "inventory: the only cookie category defined in the code is ",
          { kind: "strong", text: "strictly necessary" },
          ". Analytics and marketing categories were deliberately never " +
            "defined; if such a tool is added it goes into the inventory " +
            "first, the ",
          { kind: "link", text: "table", href: "#cerez-tablosu" },
          " and this section are updated together, and the consent position " +
            "is reconsidered.",
        ],
      },
    ],
  },

  {
    id: "neden-banner-yok",
    heading: "3. Why we don't show a cookie banner",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "No cookie consent box appears when you arrive at Caka. The reason " +
            "is not that we don't care about the subject; it is that ",
          {
            kind: "strong",
            text: "we don't do anything that requires consent",
          },
          ".",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "The Turkish Personal Data Protection Authority's Guide on Cookie " +
            "Practices of July 2025 (publication no. 69) lists two cases in " +
            "which explicit consent is not required:",
        ],
      },
      {
        kind: "list",
        style: "bullet",
        items: [
          [
            { kind: "strong", text: "Criterion A — " },
            "if the sole purpose of the cookie is to carry out communication.",
          ],
          [
            { kind: "strong", text: "Criterion B — " },
            "if the cookie is strictly necessary in order to provide the " +
              "service the user has explicitly requested.",
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          "All four cookies in the table fall under Criterion B: without two " +
            "of them you cannot sign in — one carries your session, the other " +
            "protects the sign-in round trip against forgery. Without the " +
            "third, the address you pick during sign-up cannot be linked to " +
            "you when you return from the provider. The fourth holds the " +
            "language you chose, so the interface opens in the language you " +
            "asked for. The two sessionStorage entries in the table fall under " +
            "the same criterion: one keeps your scroll position and so " +
            "delivers the navigation behaviour you asked for, the other keeps " +
            "the page from being stuck on an old version. None of them carries " +
            "personal data and none of them serves a purpose you did not ask " +
            "for, so explicit consent is not required.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Consent is conditional; informing you is not. " },
          "Consent not being required does not give us the right to tell you " +
            "nothing: whatever legal basis is relied on, you must be informed " +
            "— article 5 of the Communiqué on the Procedures and Principles to " +
            "be Followed in Fulfilling the Obligation to Inform requires it. ",
          {
            kind: "strong",
            text: "This page exists precisely to meet that obligation",
          },
          ": it does not ask for your approval, it writes down what we do. For " +
            "the full information about the processing of your personal data, " +
            "see the ",
          {
            kind: "link",
            text: "Privacy Policy",
            href: "/gizlilik",
          },
          ".",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "For the same reason there is no cookie preference centre. As there " +
            "is no optional cookie to manage, such a page would find nothing " +
            "to switch on or off; showing one would be misleading. You can " +
            "still block the strictly necessary cookies from your browser — ",
          {
            kind: "link",
            text: "section 5",
            href: "#tercihleri-yonetme",
          },
          " explains what happens if you do.",
        ],
      },
    ],
  },

  {
    id: "cerez-tablosu",
    heading: "4. Everything we write to your device",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "The table below shows everything Caka writes to your device: four " +
            "cookies and two sessionStorage entries. All six are first party: " +
            "written by caka.app, read only by caka.app and shared with " +
            "nobody. Not all of them appear on every visit — the “Purpose” " +
            "column says when each row is written.",
        ],
      },
      {
        kind: "table",
        columns: ["Name", "Type", "Category", "Purpose", "Lifetime", "Party", "Provider"],
        rows: cookieRows,
        caption:
          "The table is generated from the inventory in the application's " +
          "code. When a new cookie or storage entry is added the inventory is " +
          "updated first and this table changes by itself, so no silent gap " +
          "opens between the policy and reality.",
      },
      {
        kind: "paragraph",
        text: [
          "The ",
          { kind: "strong", text: "__Secure-" },
          " prefix on the names is a browser security marker: it means the " +
            "cookie will only be sent over an HTTPS connection. The session " +
            "and sign-in security cookies are also marked ",
          { kind: "strong", text: "HttpOnly" },
          " — JavaScript on the page cannot read them.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "The lifetime of these cookies matches the retention period of the " +
            "related data; for all retention periods see the ",
          {
            kind: "link",
            text: "retention periods section of the Privacy Policy",
            href: "/gizlilik#saklama-sureleri",
          },
          ". Where cookies sit within the collection method is explained in " +
            "the ",
          {
            kind: "link",
            text: "how data is collected",
            href: "/gizlilik#toplama-yontemi",
          },
          " section.",
        ],
      },
    ],
  },

  {
    id: "tercihleri-yonetme",
    heading: "5. How to manage cookies",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Because there is no optional cookie to approve, we offer no setting " +
            "in Caka you could switch off. Cookie control is entirely in your " +
            "browser: every browser's settings have a section where you can " +
            "block cookies per site, delete existing cookies and ask for them " +
            "to be cleared automatically on exit. These settings are usually " +
            "under a “Privacy and security” heading.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "But do it knowing the consequence. " },
          "The cookies in the table are strictly necessary; if you block or " +
            "delete cookies for caka.app you ",
          {
            kind: "strong",
            text: "will not be able to sign in or complete the sign-up flow",
          },
          ". A sign-in attempt will either be rejected by the anti-forgery " +
            "protection or drop you back to the sign-in screen; the address " +
            "you picked during sign-up will not be linked to you either. " +
            "Deleting the cookie of a session that is currently open has the " +
            "same effect as signing out.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "You don't need cookies to browse a Caka profile without signing " +
            "in: public profiles keep working even with cookies fully " +
            "disabled.",
        ],
      },
    ],
  },

  {
    id: "cihaza-yazmayan-istekler",
    heading: "6. Third-party requests that write no cookie to your device",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "When you open a page, your browser makes requests not only to our " +
            "server but to a few external addresses as well. These are not " +
            "cookies, but they are not invisible either: on every request ",
          { kind: "strong", text: "your IP address and User Agent" },
          " reach the other side. That is why we write them down here too.",
        ],
      },
      {
        kind: "list",
        style: "bullet",
        items: [
          [
            { kind: "strong", text: "Fonts (Fontshare). " },
            "The site's typefaces are fetched from the Fontshare service on " +
              "every page load. In that request your IP address and User Agent " +
              "reach the service; nothing is written to your device and " +
              "nothing is read from it. Moving the fonts to our own server and " +
              "removing this request entirely is on our to-do list.",
          ],
          [
            {
              kind: "strong",
              text: "Visit measurement (Cloudflare Web Analytics). ",
            },
            "On every page load your browser downloads a small measurement " +
              "script from ",
            { kind: "strong", text: "static.cloudflareinsights.com" },
            " and reports the page that was viewed. In that request your IP " +
              "address and User Agent reach Cloudflare; ",
            {
              kind: "strong",
              text: "nothing is written to your device and nothing is read from it",
            },
            " — which is why it does not appear in the table in section 4. The " +
              "script is added automatically across the whole domain; it runs " +
              "on the home page and on public profile pages alike and cannot " +
              "be switched off per page. If you use an ad blocker this request " +
              "is most likely never made.",
          ],
          [
            {
              kind: "strong",
              text: "Link preview images on profiles. ",
            },
            "These images are served ",
            {
              kind: "strong",
              text: "through our own server",
            },
            ": Caka's server fetches the image from the remote site, not your " +
              "browser. As a result neither your IP address nor your User " +
              "Agent reaches that site, and ",
            {
              kind: "strong",
              text: "that site cannot write a cookie to your browser",
            },
            " — the response is built from scratch on our side and the headers " +
              "the remote site sends are not passed on to you. This request " +
              "used to go directly from your browser and a third-party cookie " +
              "could be written; that was closed on 18 August 2026.",
          ],
          [
            {
              kind: "strong",
              text: "The map on a location card (Mapbox). ",
            },
            "If a profile has a location card, your browser fetches that " +
              "card's dark map image directly from ",
            { kind: "strong", text: "api.mapbox.com" },
            ". In that request ",
            {
              kind: "strong",
              text: "your IP address and User Agent reach Mapbox",
            },
            ", and the address also carries the approximate coordinate of the " +
              "place the profile owner picked. Which profile you are looking " +
              "at is not sent — the request announces only the caka.app " +
              "domain, not the page address. We would rather have routed this " +
              "image through our own server too, the way we do for link " +
              "preview images, but Mapbox's terms explicitly forbid caching " +
              "the map image and serving it from our own domain. We measured " +
              "it: this request writes no cookie to your device, there is no " +
              "cookie header in the response. Pages without a location card " +
              "make no such request at all.",
          ],
          [
            {
              kind: "strong",
              text: "Embedded players (YouTube, Spotify) — only if you press play. ",
            },
            "A YouTube or Spotify card on a profile loads ",
            { kind: "strong", text: "nothing" },
            " when the page opens: the cover image you see comes from our own " +
              "server and not a single request goes to that site. If ",
            { kind: "strong", text: "you press" },
            " the play button, the player is loaded at that moment and that is " +
              "the point at which your browser connects directly to YouTube or " +
              "Spotify: your IP address and User Agent reach them and ",
            {
              kind: "strong",
              text: "they can write their own cookies to your device",
            },
            ". For YouTube we use the cookie-free embed address " +
              "(youtube-nocookie.com); this reduces tracking but does not " +
              "fully prevent cookies once the video starts playing. Because " +
              "those cookies are not ours they do not appear in the table in " +
              "section 4; YouTube's and Spotify's own policies apply to them.",
          ],
          [
            {
              kind: "strong",
              text: "Why we don't load them before you press. ",
            },
            "If we embedded the player as soon as the page opened, everyone " +
              "looking at that profile would have been introduced to YouTube " +
              "and Spotify without doing anything. We did not build it that " +
              "way: the connection is made only by a deliberate action of " +
              "yours, and the button says so above it.",
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          "The first four requests write nothing to your device; that is why " +
            "they do not appear in ",
          { kind: "link", text: "the table in section 4", href: "#cerez-tablosu" },
          ". The table lists only what ",
          { kind: "strong", text: "we" },
          " write to your device; cookies written by an embedded player are " +
            "not ours and cannot go in there. The full list of which data " +
            "reaches which supplier is in the ",
          {
            kind: "link",
            text: "transfers and suppliers section of the Privacy Policy",
            href: "/gizlilik#aktarim-ve-tedarikciler",
          },
          ".",
        ],
      },
    ],
  },

  {
    id: "degisiklikler",
    heading: "7. Changes to this policy, and contact",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "As the product changes, so does this policy: we update the text " +
            "when a new cookie is added, when a cookie's purpose or lifetime " +
            "changes, or when a new tool that touches your device comes into " +
            "play. If such a tool is added we don't just grow the table, we " +
            "also reconsider whether consent is required.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "With every update the version number at the top of the page " +
            "increases and the last-updated date is renewed. The versions of " +
            "the three legal documents are independent of each other: only the " +
            "date of the document that changed moves, the others stay as they " +
            "were.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Questions and requests. " },
          "You can write your questions about cookies and your requests " +
            "regarding your personal data to ",
          { kind: "strong", text: "hello@caka.app" },
          ". How a request is handled and your rights under article 11 of the " +
            "KVKK are written in the ",
          {
            kind: "link",
            text: "data subject rights section of the Privacy Policy",
            href: "/gizlilik#ilgili-kisi-haklari",
          },
          ".",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Alongside this text we recommend reading the ",
          {
            kind: "link",
            text: "Privacy Policy",
            href: "/gizlilik",
          },
          " and the ",
          {
            kind: "link",
            text: "Terms of Use",
            href: "/kullanim-kosullari",
          },
          " as well.",
        ],
      },
    ],
  },
];
