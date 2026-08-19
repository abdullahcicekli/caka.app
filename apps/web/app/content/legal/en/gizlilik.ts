// Privacy Policy — English version of `../tr/gizlilik.ts` (L11/LKD8).
//
// Section-by-section rendering of the Turkish text, not a rewrite. The Turkish
// version is the binding one; where the two disagree the Turkish text wins and
// this file is corrected. Turkish statutes keep their Turkish short names
// (KVKK, VERBİS) with a short gloss, because that is what the reader will need
// if they go looking for the source.
import type { LegalSection } from "@caka/shared";

export const gizlilikSectionsEn: LegalSection[] = [
  {
    id: "veri-sorumlusu",
    heading: "1. Data controller and contact",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "This text explains how your personal data is processed when you use " +
            "Caka (caka.app). Caka is not a company; it is ",
          { kind: "strong", text: "an open-source personal project" },
          ". We operate the site as caka.app, and we are the ones who decide " +
            "for what purpose and by what means the data is processed. The " +
            "capacity of data controller within the meaning of Turkish personal " +
            "data protection law no. 6698 (KVKK) arises from this, and we are " +
            "the ones the commitments in this text are addressed to.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Let us write down what is missing, too. " },
          "Article 10 of the KVKK and article 5 of the Communiqué on Informing " +
            "require the ",
          { kind: "strong", text: "identity" },
          " of the data controller to be disclosed. The Authority's Guide on " +
            "the Procedures and Principles to be Followed in Fulfilling the " +
            "Obligation to Inform (no. 60, March 2025) §3.1.1 describes this " +
            "for natural persons as ",
          { kind: "strong", text: "first name and surname" },
          ". You will not find a name below: the person who runs Caka chose not " +
            "to publish their name, because what is at hand is a personal " +
            "identity rather than a business. The meaning of that is plain — ",
          {
            kind: "strong",
            text:
              "this section does not today fully meet the identity information " +
              "article 10 asks for",
          },
          " and rather than hiding that, we are saying it. As there is no legal " +
            "entity, commercial activity or registry record either, there is no " +
            "trade name, tax number or MERSİS number; rather than inventing " +
            "details for a company that does not exist, we write the situation " +
            "as it is. When the product is commercialised and a legal entity is " +
            "established, this section will be updated with that information. " +
            "Despite this gap, responsibility is not left in the air: the box " +
            "below is real and read, and your requests are answered within " +
            "thirty days.",
        ],
      },
      {
        kind: "table",
        columns: ["Information", "Value"],
        rows: [
          [["Operator of the site"], ["caka.app"]],
          [
            ["Capacity"],
            [
              "A natural person resident in Türkiye; runs caka.app as an " +
                "open-source personal project",
            ],
          ],
          [["Contact and KVKK request address"], ["hello@caka.app"]],
          [["Website"], ["caka.app"]],
        ],
        caption:
          "The same rules list contact information as optional — “such as a " +
          "telephone number, email, web address or postal address” — and " +
          "because the list is optional, a single working channel is enough. " +
          "We do not publish a phone number or postal address, because what " +
          "that would mean here is a private home address rather than a place " +
          "of business. Data subject requests land in this box and are read.",
      },
      {
        kind: "paragraph",
        text: [
          "You can see which version of this text you are reading from the " +
            "version and last-updated date at the top of the page. What happens " +
            "when we make a change is explained in ",
          { kind: "link", text: "Changes", href: "#degisiklikler" },
          ".",
        ],
      },
    ],
  },

  {
    id: "kapsam",
    heading: "2. Scope",
    blocks: [
      { kind: "paragraph", text: ["This text covers the following surfaces:"] },
      {
        kind: "list",
        style: "bullet",
        items: [
          [
            { kind: "strong", text: "The caka.app marketing site" },
            " — all pages that can be browsed without signing in, including the " +
              "home page and these legal pages.",
          ],
          [
            { kind: "strong", text: "Account and dashboard" },
            " — sign-in, the profile editor, settings and file upload.",
          ],
          [
            { kind: "strong", text: "Public Caka profiles" },
            " — profile pages published publicly at caka.app/username; people " +
              "without an account who visit these pages are covered as well.",
          ],
          [
            { kind: "strong", text: "Support correspondence" },
            " — the requests you send us by email.",
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Once you click a link on a profile and go to another site, that " +
            "site's own privacy policy applies; this text of Caka's does not " +
            "apply there.",
        ],
      },
    ],
  },

  {
    id: "islenen-veriler",
    heading: "3. Categories of personal data processed",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "The table below shows the data Caka actually holds. The names in " +
            "brackets are the names of the tables in the database; we write " +
            "them so that a field added later cannot quietly drop off the list.",
        ],
      },
      {
        kind: "table",
        columns: ["Category", "Data it contains", "Source"],
        rows: [
          [
            ["Account data (user)"],
            [
              "Name, email address, email verification status, profile image " +
                "address, and the times the account was created and updated.",
            ],
            ["Information returned from your Google or Apple account."],
          ],
          [
            ["Identity provider data (account)"],
            [
              "Provider name (Google or Apple), your account identifier at that " +
                "provider, access and refresh tokens, the identity token, token " +
                "validity periods and the scope of permissions granted.",
            ],
            ["The identity provider at sign-in."],
          ],
          [
            ["Session data (session)"],
            [
              "Session identifier and session token, ",
              { kind: "strong", text: "IP address" },
              " and ",
              { kind: "strong", text: "User Agent" },
              " (browser and operating system information), and the times the " +
                "session was created and expires.",
            ],
            ["Automatically, when you sign in."],
          ],
          [
            ["Profile content (profile)"],
            [
              "Your username, your theme preference, your share image " +
                "preferences and your entire profile layout: the name and short " +
                "bio on the profile card, link blocks (title and address), " +
                "social account blocks (platform, username, address and the " +
                "address of that link's preview image), the rich text in text " +
                "and status blocks, and image blocks. Also your unpublished " +
                "draft layout and the answers you gave during initial setup.",
            ],
            ["Entered directly by you."],
          ],
          [
            ["Uploaded files (asset and R2 storage)"],
            [
              "The images and documents you upload (PDF only for now; a CV " +
                "you put on your page is one of them), along with their " +
                "name, type, size and upload time. If you add a document " +
                "block, the file's name and contents are visible to everyone " +
                "who sees your page; what goes into it is your choice.",
            ],
            [
              "Uploaded directly by you. In addition, the first time you sign " +
                "in with Google, your Google profile photo is copied once into " +
                "our own file storage, so that your browser does not have to " +
                "make a request to Google every time your page opens.",
            ],
          ],
          [
            ["Address change record (username_redirect)"],
            [
              "When you change your username: your old name, which profile it " +
                "belonged to, and the expiry time of the record.",
            ],
            ["Automatically, when you change your address."],
          ],
          [
            ["GitHub contribution graph cache (github_calendar)"],
            [
              "The GitHub username added to be displayed on a profile and that " +
                "account's public contribution calendar data.",
            ],
            ["From GitHub's public interface, by our server."],
          ],
          [
            ["Operational logs (Cloudflare Workers Logs)"],
            [
              "Server-side runtime records: the address requested, the response " +
                "code, the duration and error details. We do not fully control " +
                "the contents of these records; they may also contain technical " +
                "data about the request.",
            ],
            ["Automatically, on every request."],
          ],
          [
            ["Support correspondence"],
            [
              "The content of the email you write to us, your email address and " +
                "any attachments.",
            ],
            ["Sent directly by you."],
          ],
          [
            ["Cookie-free visit statistics (Cloudflare Web Analytics)"],
            [
              "Aggregate data such as page view counts, referring address, " +
                "country, browser and device type. For this measurement nothing " +
                "is written to your device and nothing is read from it.",
            ],
            ["Automatically, when a page is viewed."],
          ],
          [
            ["Page statistics counters (profile_view_daily, link_click_daily)"],
            [
              "Separate from the above, two counter tables kept in ",
              { kind: "strong", text: "our own database" },
              ". They show the owner of a public Caka profile the statistics of " +
                "their own page. What is kept: for views, the day (in Türkiye " +
                "time), a two-letter country code and the number of views from " +
                "that country on that day; for clicks, the day, the identifier " +
                "of the block clicked and the click count. Country is ",
              { kind: "strong", text: "deliberately not kept" },
              " on click rows. What is stored is not an event but a ",
              { kind: "strong", text: "counter" },
              ": the time of individual visits is not recorded, so no single " +
                "visit can be reconstructed from the records. No IP address is " +
                "stored and no derivative of one (hash, salted digest) is " +
                "produced; browser information is only read to filter out bots " +
                "and is never written. Visitors are assigned no identifier and " +
                "unique visitors are not counted.",
            ],
            [
              "Automatically, when a public profile is viewed and when a link " +
                "on that profile is clicked.",
            ],
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "A warning about the GitHub contribution graph: " },
          "The key of this cache is the GitHub username added to be displayed " +
            "on a profile, and ",
          {
            kind: "strong",
            text: "that account may not belong to the profile owner",
          },
          ". In other words, Caka may be processing the public contribution " +
            "data of a person who has no Caka account at all. Those people can " +
            "request deletion too; how to do so is written in ",
          {
            kind: "link",
            text: "Your rights as a data subject",
            href: "#ilgili-kisi-haklari",
          },
          ".",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "You write the profile content yourself, and once you publish it, it " +
            "is public. Everything you put there — a phone number, an address, " +
            "health or belief information — can be seen by anyone on the " +
            "internet. Caka does not ask for and does not collect special " +
            "categories of personal data (KVKK art. 6); if you write such " +
            "information on your profile yourself, you have made it public of " +
            "your own accord.",
        ],
      },
    ],
  },

  {
    id: "amaclar-ve-hukuki-sebepler",
    heading: "4. Purposes of processing and legal bases",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Every purpose of processing must rest on one of the legal bases in " +
            "article 5 of the KVKK. Below we have written out, for each " +
            "purpose, the sub-paragraph we rely on.",
        ],
      },
      {
        kind: "table",
        columns: ["Purpose", "Legal basis (KVKK art. 5)"],
        rows: [
          [
            [
              "Opening your account, authenticating you with Google or Apple " +
                "and maintaining your session.",
            ],
            [
              "art. 5/2-c — being directly related to the establishment or " +
                "performance of a contract.",
            ],
          ],
          [
            [
              "Publishing your public profile: showing visitors the profile " +
                "layout, links, texts and images.",
            ],
            ["art. 5/2-c — performance of a contract."],
          ],
          [
            ["Storing the files you upload and serving them on your profile page."],
            ["art. 5/2-c — performance of a contract."],
          ],
          [
            [
              "Redirecting your old address for a period when you change your " +
                "username, so that the links you shared do not break.",
            ],
            [
              "art. 5/2-f — legitimate interest: neither you nor your visitors " +
                "running into a broken link.",
            ],
          ],
          [
            [
              "Security, prevention of abuse and fraud, debugging and keeping " +
                "the service running.",
            ],
            [
              "art. 5/2-f — legitimate interest: protecting the security of the " +
                "service and its users.",
            ],
          ],
          [
            ["Answering support requests."],
            [
              "If the request concerns your account, art. 5/2-c (performance of " +
                "a contract); if not, art. 5/2-f (legitimate interest: " +
                "answering questions).",
            ],
          ],
          [
            [
              "Complying with legal obligations and responding to requests from " +
                "competent authorities.",
            ],
            [
              "art. 5/2-ç — the data controller fulfilling its legal " +
                "obligation; where a right must be established, exercised or " +
                "protected, art. 5/2-e.",
            ],
          ],
          [
            [
              "Caching the contribution graph of the GitHub account to be shown " +
                "on a profile. The cache is considered fresh for 6 hours and " +
                "then refetched; if no such user is found on GitHub, the " +
                "negative result is kept for 24 hours.",
            ],
            [
              "art. 5/2-f — legitimate interest: requesting the same data on " +
                "every visit would be an unnecessary load both on GitHub and on " +
                "the speed of the page.",
            ],
          ],
          [
            [
              "Measuring which pages are used, by way of cookie-free visit " +
                "statistics.",
            ],
            [
              "art. 5/2-f — legitimate interest: improving the product. Because " +
                "the measurement writes nothing to your device, consent is not " +
                "required; but consent not being required does not exempt the " +
                "processing from needing a legal basis, and this is that basis.",
            ],
          ],
          [
            [
              "Showing the owner of a public profile the statistics of their " +
                "own page: how many times the page was viewed each day, which " +
                "countries the visits came from and how many times each link " +
                "was clicked (profile_view_daily, link_click_daily).",
            ],
            [
              "art. 5/2-f — legitimate interest: the creator being able to see " +
                "that their page is used, and the visitor being able to browse " +
                "without being tracked. That balance is why it was written into " +
                "the design: nothing written to the device, no raw IP, no " +
                "unique visitors, no transfer to third parties, and countries " +
                "with few visits not listed individually in the country " +
                "breakdown. Consent not being required does not exempt the " +
                "processing from needing a legal basis; this is that basis.",
            ],
          ],
          [
            [
              "Remembering the interface language you chose, so the site opens " +
                "in that language on your next visit.",
            ],
            [
              "art. 5/2-f — legitimate interest: showing you the site in the " +
                "language you asked for. The cookie holds only a language code " +
                "and carries no identity.",
            ],
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          "We do not ask you for a blanket, general ",
          {
            kind: "strong",
            text: "“I consent to the processing of my personal data”",
          },
          " approval. Such an approval would not count as valid consent; all of " +
            "the processing above rests on the legal bases listed.",
        ],
      },
    ],
  },

  {
    id: "toplama-yontemi",
    heading: "5. How data is collected",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "All of the data is collected electronically, by partly automated " +
            "means. We do not collect data on paper. The collection channels:",
        ],
      },
      {
        kind: "list",
        style: "bullet",
        items: [
          [
            { kind: "strong", text: "Your direct input" },
            " — the profile editor, settings, file upload and support email.",
          ],
          [
            { kind: "strong", text: "Data returned by the identity provider" },
            " — the name, email and account identifier returned to us when you " +
              "sign in with Google or Apple.",
          ],
          [
            { kind: "strong", text: "Automatic server records" },
            " — session and runtime records created while requests are handled.",
          ],
          [
            { kind: "strong", text: "Strictly necessary cookies" },
            " — the small number of cookies written to your browser to carry " +
              "your session, secure the sign-in flow and remember the interface " +
              "language you chose.",
          ],
          [
            { kind: "strong", text: "Server-side external calls" },
            " — fetching the GitHub contribution graph to be shown on a profile " +
              "from GitHub's public interface.",
          ],
        ],
      },
    ],
  },

  {
    id: "aktarim-ve-tedarikciler",
    heading: "6. Transfers and suppliers",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "We do not sell your data and we do not share it with anyone for " +
            "advertising purposes. The parties the data reaches, and what " +
            "reaches each of them, are as follows. The first five rows are " +
            "suppliers we use to run the service; the last row is not a " +
            "supplier but the owner of the page you are visiting.",
        ],
      },
      {
        kind: "table",
        columns: ["Recipient", "Service", "Data reaching them", "Transfer abroad"],
        rows: [
          [
            ["Cloudflare, Inc."],
            [
              "The servers the application runs on (Workers), the database " +
                "(D1), file storage (R2), the content delivery network, runtime " +
                "logs (Workers Logs) and cookie-free visit measurement (Web " +
                "Analytics).",
            ],
            [
              "All data processed on Caka, plus the technical details of " +
                "requests coming to the site. Visit measurement runs ",
              {
                kind: "strong",
                text: "on all pages, including public profile pages",
              },
              ": on every page view your browser downloads Cloudflare's " +
                "measurement script, and in that request your IP address and " +
                "User Agent reach Cloudflare. Nothing is written to your device.",
            ],
            [
              "Yes — today it cannot be tied to one of the safeguards the Law " +
                "requires; see “Transfer abroad” below.",
            ],
          ],
          [
            ["Google LLC"],
            ["Sign in with Google (authentication)."],
            [
              "When you start signing in you are redirected to Google; Google " +
                "processes that request and the account information it passes " +
                "back to us under its own policy.",
            ],
            [
              "Yes — today it cannot be tied to one of the safeguards the Law " +
                "requires; see “Transfer abroad” below.",
            ],
          ],
          [
            ["Apple Inc."],
            ["Sign in with Apple (authentication)."],
            [
              "When you start signing in you are redirected to Apple; Apple " +
                "processes that request and the account information it passes " +
                "back to us under its own policy.",
            ],
            [
              "Yes — today it cannot be tied to one of the safeguards the Law " +
                "requires; see “Transfer abroad” below.",
            ],
          ],
          [
            ["Indian Type Foundry (Fontshare)"],
            ["Serving the typefaces used on the site."],
            [
              "On every page load your browser fetches a font file from this " +
                "service; in that request ",
              { kind: "strong", text: "your IP address and User Agent" },
              " reach the service. Nothing is written to your device.",
            ],
            [
              "Yes — today it cannot be tied to one of the safeguards the Law " +
                "requires; see “Transfer abroad” below.",
            ],
          ],
          [
            ["GitHub, Inc."],
            ["Fetching the contribution graph data shown on a profile."],
            [
              "Only the GitHub username to be displayed. The request goes from " +
                "our server; the visitor's browser makes no request to GitHub, " +
                "so the visitor's IP address does not reach GitHub.",
            ],
            [
              "Yes — today it cannot be tied to one of the safeguards the Law " +
                "requires; see “Transfer abroad” below.",
            ],
          ],
          [
            ["The owner of the profile you visit"],
            ["The page statistics in their own dashboard."],
            [
              "Your visit is visible to the owner of that page ",
              { kind: "strong", text: "only mixed into aggregate numbers" },
              ": how many times their page was viewed on a given day, which " +
                "countries the visits came from and how many times each link " +
                "was clicked. The owner cannot see you individually — your " +
                "identity, IP address, browser information and the time of your " +
                "visit never reach them, because none of that is stored at all. " +
                "Countries with few visits are not listed individually but " +
                "grouped into a “few visits” row; for clicks, country is not " +
                "kept at all.",
            ],
            [
              "No — the data never leaves our servers; the owner sees it in " +
                "their own dashboard.",
            ],
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "What the profile owner cannot see. " },
          "When you visit a Caka profile the owner sees it in their counters, " +
            "but they do not see you. Because nothing is written to your device " +
            "for the measurement and your raw IP address is not stored, not " +
            "even we can tell whether two visits belong to the same person; " +
            "that is why there is no “unique visitors” number in the dashboard. " +
            "This measurement runs only for public profile pages, and the page " +
            "owner's own visits are not counted as long as they are signed in.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Transfer abroad. " },
          "The servers of the recipients above are outside Türkiye. Because the " +
            "application, database, file storage and logs all run on " +
            "Cloudflare, this transfer is a technical necessity for the service " +
            "to work at all and happens on every request. We write the " +
            "situation as it is: ",
          {
            kind: "strong",
            text:
              "these transfers are not today tied to any of the safeguards " +
              "required by article 9 of the KVKK.",
          },
        ],
      },
      {
        kind: "paragraph",
        text: [
          "The reasons, one by one. The first step of article 9 is an adequacy " +
            "decision; the Board has to date published an adequacy decision for " +
            "no country. The second step is appropriate safeguards, and the " +
            "most accessible of those is the standard contract published by the " +
            "Board; but the Turkish text of that contract must be ",
          { kind: "strong", text: "signed by both parties" },
          ". In Cloudflare's data processing addendum in force (v6.4, effective " +
            "3 April 2026) there is not a single reference to Türkiye, to a " +
            "Turkish text or to the KVKK; the mechanisms offered are limited to " +
            "the EU standard contractual clauses, the United Kingdom and Swiss " +
            "addenda, the Data Privacy Framework and Global CBPR. In other " +
            "words, the counterparty does not sign this text. The undertaking " +
            "route depends on Board authorisation and cannot be completed " +
            "unilaterally; binding corporate rules are for a group of " +
            "companies, and there is no group here. Nor is there an exemption " +
            "arising from the small size of the transfer.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "“Couldn't you just get explicit consent?” " },
          "No. The exceptions in article 9/6 — including explicit consent — are " +
            "open only to ",
          { kind: "strong", text: "incidental" },
          " transfers. Article 16/1 of the Regulation on the Procedures and " +
            "Principles for the Transfer of Personal Data Abroad defines the " +
            "term: “Transfers that are not regular, that occur once or a few " +
            "times, that are not continuous and that do not fall within the " +
            "ordinary course of activity are incidental.” A hosting transfer is " +
            "the exact opposite: it is continuous and it is the ordinary course " +
            "of activity itself. Because the incidental condition covers the " +
            "whole of article 9/6, showing you a consent checkbox would not " +
            "close this gap, it would only make it look closed. The Authority " +
            "also states that these exceptions must be interpreted narrowly.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Two further details: signing in with Google runs under Google's " +
            "consumer Terms of Service, not under a corporate data processing " +
            "agreement; in that relationship Google is most likely a separate " +
            "data controller in its own right rather than our data processor. " +
            "We could not verify the legal position on the Apple side, so we " +
            "make no claim about it here.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "That is why no mechanism is named in this section. The gap is real, " +
            "and you knowing about it is better than you assuming there is no " +
            "transfer at all. Work to tie it to an appropriate safeguard " +
            "continues; when a route opens, this section is updated and the " +
            "document's version number increases. Your right to complain to the " +
            "Personal Data Protection Authority is unaffected by this text.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Link preview images on profiles. " },
          "On a profile, the preview images of the links the profile owner " +
            "added are served ",
          { kind: "strong", text: "through our own server" },
          ". Caka's server fetches the image from the remote site, not your " +
            "browser. As a result neither your IP address nor your User Agent " +
            "reaches that site, and that site cannot write a cookie to your " +
            "browser: the response is built from scratch on our side and the " +
            "headers the remote site sends are not passed on to you. The " +
            "request that goes to the remote site contains only the address of " +
            "the image the profile owner chose; it carries nothing identifying " +
            "you. For completeness: the first time an image is not yet cached " +
            "on our server, the timing of that request shows the remote site " +
            "that the profile was viewed around then — but not by whom.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Embedded players. " },
          "YouTube and Spotify cards load nothing when the page opens; the " +
            "cover image comes from our own server as described above. ",
          { kind: "strong", text: "The moment you press play" },
          " the player is loaded and your browser connects directly to YouTube " +
            "or Spotify: your IP address and User Agent reach them, they can " +
            "write their own cookies to your device and they can associate that " +
            "session with your own account there. This transfer happens " +
            "directly rather than through us, and each of them is its own data " +
            "controller; for what becomes of the transferred data, ",
          { kind: "strong", text: "their own policies" },
          " apply. As long as you don't press the button, none of these " +
            "requests are made — we built it this way deliberately, and the " +
            "button says so above it. Details: ",
          {
            kind: "link",
            text: "Cookie Policy",
            href: "/cerez-politikasi",
          },
          ".",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Apart from these, transfers are made to competent public " +
            "institutions and organisations only where a legal obligation " +
            "arises (KVKK art. 8/2-a).",
        ],
      },
    ],
  },

  {
    id: "saklama-sureleri",
    heading: "7. Retention periods",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "We delete data within the period permitted by the relevant " +
            "legislation once the purpose of processing has ceased. The periods " +
            "we know with technical certainty today are:",
        ],
      },
      {
        kind: "list",
        style: "bullet",
        items: [
          [
            { kind: "strong", text: "Old username: 30 days. " },
            "When you change your address, the old address redirects to the new " +
              "one for 30 days and is not given to anyone else during that " +
              "period; when the period ends the record becomes invalid and the " +
              "name is released.",
          ],
          [
            { kind: "strong", text: "GitHub contribution graph cache: " },
            "a successful record is considered fresh for 6 hours and then " +
              "refetched. If the user is not found on GitHub, that negative " +
              "result is kept for 24 hours. When the graph is removed from a " +
              "profile the data is not fetched again.",
          ],
          [
            { kind: "strong", text: "Session: 7 days. " },
            "The session cookie and the session record live for 7 days; they " +
              "end earlier when you sign out. The security cookies in the " +
              "sign-in flow live for 5 and 15 minutes. The language cookie " +
              "lives for 1 year and you can delete it at any time from your " +
              "browser. Details in the ",
            {
              kind: "link",
              text: "Cookie Policy",
              href: "/cerez-politikasi",
            },
            ".",
          ],
          [
            {
              kind: "strong",
              text: "Page statistics counters: kept indefinitely. ",
            },
            "These rows are counters carrying not a person but a day, a " +
              "two-letter country code and a block identifier; because they " +
              "contain no timestamp, identity or IP derivative, they cannot be " +
              "traced back to a single person. As they are genuinely anonymous " +
              "they are not subject to a destruction period. Only the last 30 " +
              "days are shown in the dashboard, but what does that is a display " +
              "filter, not a deletion: ",
            {
              kind: "strong",
              text: "older counter rows remain in the database",
            },
            ". If the profile is deleted, these rows are deleted with it.",
          ],
        ],
      },
      {
        kind: "paragraph",
        text: ["For the remaining data categories the periods we apply are:"],
      },
      {
        kind: "table",
        columns: ["Data", "Retention period"],
        rows: [
          [
            ["Account data, profile content and the files you upload"],
            [
              "Until you delete them. When you close your account or request " +
                "deletion, they are deleted within ",
              { kind: "strong", text: "3 months" },
              " at the latest.",
            ],
          ],
          [
            ["Session records (IP address and User Agent)"],
            [
              "The session itself lives for 7 days. The record stays for a " +
                "short window after the session ends and is deleted within ",
              { kind: "strong", text: "90 days at the latest" },
              ".",
            ],
          ],
          [
            ["Identity provider tokens (access and refresh tokens)"],
            [
              "Invalidated when you sign out or when your account is deleted; " +
                "they are not retained separately.",
            ],
          ],
          [
            ["Old username record (username_redirect)"],
            [
              "30 days. When the period ends the record is permanently deleted; " +
                "it is not archived.",
            ],
          ],
          [
            ["GitHub contribution graph cache (github_calendar)"],
            [
              "A successful record is fresh for 6 hours, a negative result for " +
                "24 hours; when the graph is removed from a profile the data is " +
                "not fetched again and the record is cleared on a scale of ",
              { kind: "strong", text: "days, not months" },
              ". This is the weakest link in the list: the person the data " +
                "belongs to has no relationship with Caka at all, which is why " +
                "we keep the window deliberately short.",
            ],
          ],
          [
            ["Support correspondence"],
            ["Deleted within 3 months at the latest after the request is closed."],
          ],
          [
            ["Operational logs (Cloudflare Workers Logs)"],
            [
              "At most 30 days. This period is set not by us but by ",
              { kind: "strong", text: "Cloudflare" },
              ": the records fall away by themselves when Cloudflare's " +
                "retention window expires, and we keep no separate copy.",
            ],
          ],
          [
            ["Cookie-free visit statistics (Cloudflare Web Analytics)"],
            [
              "These consist of aggregate numbers and are subject to " +
                "Cloudflare's own retention window; we hold no separate copy.",
            ],
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Why three months is three months. " },
          "Article 5/1 of the Regulation on the Deletion, Destruction or " +
            "Anonymisation of Personal Data ties the duty to prepare a written " +
            "retention and destruction policy to the obligation to register " +
            "with VERBİS. Caka is exempt from that registration obligation " +
            "(Board decision no. 2025/1572), so the written policy duty does " +
            "not arise either. But this is not a relaxation, quite the " +
            "opposite: while those who write a policy benefit from a periodic " +
            "destruction cycle of no more than six months, article 11/3 sets a " +
            "stricter rule for those who do not, and orders deletion within ",
          { kind: "strong", text: "three months" },
          " of the date the deletion obligation arises. The three-month period " +
            "above comes from that provision; it is not a number we chose.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "How long it takes us to conclude your request. " },
          "Under article 12/1-(a) of the same Regulation we conclude a deletion " +
            "request within ",
          { kind: "strong", text: "30 days" },
          " at the latest. Under article 7/3, records of the deletion operation " +
            "itself — not the deleted data, but the record of the operation — " +
            "are kept for at least three years.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Today there is no legislation requiring retention longer than these " +
            "periods: Caka has no revenue, issues no invoices and keeps no " +
            "commercial books, so the retention periods of the Tax Procedure " +
            "Law and the Turkish Commercial Code do not come into play. The day " +
            "we offer a paid plan, this section changes.",
        ],
      },
    ],
  },

  {
    id: "ilgili-kisi-haklari",
    heading: "8. Your rights as a data subject, and how to apply",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Under article 11 of the KVKK you may apply to the data controller " +
            "and request the following:",
        ],
      },
      {
        kind: "list",
        style: "bullet",
        items: [
          ["To learn whether your personal data is processed."],
          ["To request information about it if it has been processed."],
          [
            "To learn the purpose of processing and whether the data is used in " +
              "accordance with that purpose.",
          ],
          [
            "To know the third parties, in Türkiye or abroad, to whom the data " +
              "is transferred.",
          ],
          [
            "To request correction of the data if it has been processed " +
              "incompletely or inaccurately.",
          ],
          [
            "To request deletion or destruction of the data within the " +
              "framework of the conditions in article 7 of the KVKK.",
          ],
          [
            "To request that correction, deletion and destruction operations be " +
              "notified to the third parties the data was transferred to.",
          ],
          [
            "To object to a result arising against you from the data being " +
              "analysed exclusively by automated systems.",
          ],
          [
            "To claim compensation for damage if you suffer damage due to " +
              "unlawful processing.",
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Applying. " },
          "You can send your requests by writing to ",
          { kind: "strong", text: "hello@caka.app" },
          ". We conclude your application within 30 days at the latest. To " +
            "prevent access to someone else's data we may need to verify your " +
            "identity; writing from the email address registered to your " +
            "account is usually enough for that. You may also send your request " +
            "by the other means listed in the Communiqué on the Procedures and " +
            "Principles of Application to the Data Controller.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          {
            kind: "strong",
            text: "Export and account deletion are not self-service today. ",
          },
          "There is not yet a button in the dashboard to download your data or " +
            "delete your account with one click. We write this plainly because " +
            "we don't want to describe a feature that doesn't exist as if it " +
            "did. You can exercise both requests by writing to the address " +
            "above; when we delete your account, your profile, the files you " +
            "uploaded and your session records are deleted as well.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "People without a Caka account can apply too. " },
          "If, for example, you are the owner of a GitHub account whose " +
            "username appears in the contribution graph cache and you want that " +
            "data deleted, you can write to the same address even without a " +
            "Caka account.",
        ],
      },
    ],
  },

  {
    id: "cerezler",
    heading: "9. Cookies",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Caka uses only ",
          { kind: "strong", text: "strictly necessary cookies" },
          ": the cookie that carries your session, the short-lived cookies that " +
            "keep the sign-in flow secure, and the cookie that remembers the " +
            "interface language you chose. There are no advertising cookies, no " +
            "analytics cookies and no cross-site tracking; visit statistics are " +
            "measured without cookies and without writing anything to your " +
            "device, on all pages including public profile pages. That is why " +
            "we don't have to ask for your approval.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Besides cookies, two tab-specific sessionStorage entries can be " +
            "created: one remembers your scroll position as you navigate, the " +
            "other makes an open tab refresh once when a new version of the " +
            "site is released. Both are deleted when you close the tab and " +
            "carry no personal data. You can find the name, purpose, lifetime " +
            "and owner of every entry written to your device, in table form, on " +
            "the ",
          {
            kind: "link",
            text: "Cookie Policy",
            href: "/cerez-politikasi",
          },
          " page.",
        ],
      },
    ],
  },

  {
    id: "degisiklikler",
    heading: "10. Changes to this text",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "As the product changes, so does this text: we update it when a new " +
            "supplier is added, when we start processing a new data category, " +
            "or when the legal basis of a purpose changes.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "With every update the version number at the top of the page " +
            "increases and the last-updated date is renewed. The versions of " +
            "these three legal documents are independent of each other: only " +
            "the date of the document that changed moves, the others stay as " +
            "they were. When there is a substantial change we also inform users " +
            "who have an account.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Alongside this text we recommend reading the ",
          {
            kind: "link",
            text: "Terms of Use",
            href: "/kullanim-kosullari",
          },
          " and the ",
          {
            kind: "link",
            text: "Cookie Policy",
            href: "/cerez-politikasi",
          },
          " as well.",
        ],
      },
    ],
  },
];
