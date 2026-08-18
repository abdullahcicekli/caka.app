// Terms of Use — English version of `../tr/kullanim-kosullari.ts` (L11/LKD8).
//
// Section-by-section rendering of the Turkish text, not a rewrite. The Turkish
// version is the binding one; where the two disagree the Turkish text wins and
// this file is corrected. Turkish statutes keep their numbers and short names
// (TBK = Turkish Code of Obligations, HMK = Code of Civil Procedure, law no.
// 6502 = Consumer Protection Law, law no. 5651 = Internet Law), because those
// are what a reader needs in order to find the source.
import type { LegalSection } from "@caka/shared";

export const kullanimKosullariSectionsEn: LegalSection[] = [
  {
    id: "taraflar-ve-hizmet",
    heading: "1. The parties and what the service is",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "These terms are the contract between us, who operate Caka " +
            "(caka.app), and you, who use it. Caka is not a company but an " +
            "open-source personal project; there is no legal entity behind it " +
            "today, which is why no trade name appears here. You can reach us " +
            "at ",
          { kind: "strong", text: "hello@caka.app" },
          ". In this text ",
          { kind: "strong", text: "“we”" },
          " means the person operating Caka, and ",
          { kind: "strong", text: "“you”" },
          " means the person who opens an account or visits the site.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Caka is a ",
          { kind: "strong", text: "link-in-bio hosting service" },
          ": you set up a public single-page profile at caka.app/username and " +
            "publish your own links, social accounts, short texts and images " +
            "on it. Caka hosts the page and serves it to visitors; what you " +
            "write on it and where you link to is your decision.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "By opening an account or using the site you accept these terms. If " +
            "you do not accept them you should not use the service.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "The ",
          { kind: "link", text: "Privacy Policy", href: "/gizlilik" },
          " and the ",
          { kind: "link", text: "Cookie Policy", href: "/cerez-politikasi" },
          " apply alongside this text. You can read there how your personal " +
            "data is processed; these terms give no separate undertaking about " +
            "data processing.",
        ],
      },
    ],
  },

  {
    id: "hesap-ve-guvenlik",
    heading: "2. Opening an account and account security",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "The only way to open an account on Caka is to ",
          { kind: "strong", text: "sign in with your Google or Apple account" },
          ". You do not create a separate password on Caka and we store no " +
            "passwords. The practical consequence is this: the security of " +
            "your Caka account depends on the security of the Google or Apple " +
            "account you use to sign in. Protecting that account with two-step " +
            "verification is your responsibility.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "If you lose access to the provider account you signed in with, you " +
            "lose access to your Caka account too. You can write to us in such " +
            "a case, but we open no account to anyone whose identity we cannot " +
            "verify — that is the very rule that keeps someone else from " +
            "taking over your account.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "You are responsible for everything done under your account — " +
            "including leaving your device or your provider account open to " +
            "someone else. If you notice your account being used without your " +
            "permission, first close the sessions of your provider account, " +
            "then let us know.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "You may not transfer, sell or rent your account to anyone else. If " +
            "you open a profile on behalf of a team or an organisation, you are " +
            "deemed to have accepted that you are authorised to represent it.",
        ],
      },
    ],
  },

  {
    id: "kullanici-adi",
    heading: "3. Username and address policy",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "The address of your profile is made from the username you choose: " +
            "caka.app/username. A username is between 3 and 30 characters; it " +
            "may contain only lowercase letters, digits and hyphens, and may " +
            "not start or end with a hyphen.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Reserved names. " },
          "Some names are given to nobody. These are the application's own " +
            "page addresses (for example login, settings, api), names that " +
            "imitate an authority or infrastructure role (admin, support, " +
            "security), names that imitate religious values, the language " +
            "prefixes the site uses in its addresses, and — for brand " +
            "protection — every name starting with ",
          { kind: "strong", text: "caka" },
          ". If you try to pick a reserved name the editor warns you.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "What happens when you change your address. " },
          "You can change your username. When you do, the old address " +
            "redirects to the new one ",
          { kind: "strong", text: "for 30 days" },
          " and stays locked during that period — meaning nobody else can take " +
            "that name. The redirect is temporary (302); we do not use a " +
            "permanent redirect, because browsers cache a permanent redirect " +
            "indefinitely and would keep sending visitors to the wrong place " +
            "even after the name is released. When the 30 days are up the " +
            "record becomes invalid, the old address stops working and the " +
            "name is open to everyone again.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "What this means is that the old links you shared need to be updated " +
            "within a month. After the period ends someone else can take the " +
            "same name and that old link will no longer lead to your profile.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "How often you can change it. " },
          "After one address change you cannot change your address again for ",
          { kind: "strong", text: "30 days" },
          ". This waiting period is the same length as the redirect and lock " +
            "period: because every change leaves a name locked for 30 days, " +
            "changes made back to back both take several names out of " +
            "circulation and break every link you shared. When the period is " +
            "up you can take your old address back if you wish.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Reclaiming a name in case of abuse. " },
          "If you take a username in order to imitate someone else's name, " +
            "brand or organisation, to sell it, or merely to hoard it, we may " +
            "reclaim that name and move your profile to another address. A " +
            "documented request from the owner of a trademark falls within " +
            "this too. Wherever possible we write to you first.",
        ],
      },
    ],
  },

  {
    id: "kullanici-icerigi",
    heading: "4. The content on your profile and your responsibility",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "You put everything on your profile: the name and short bio on the " +
            "profile card, link blocks, social account blocks, the text in text " +
            "and status blocks, the images you upload and the GitHub " +
            "contribution graph you display. Caka neither writes nor chooses " +
            "this content; it hosts and publishes it.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "That is why ",
          { kind: "strong", text: "you are responsible" },
          " for the lawfulness of the content. Concretely, for every item you " +
            "add to your profile you are declaring the following:",
        ],
      },
      {
        kind: "list",
        style: "bullet",
        items: [
          [
            { kind: "strong", text: "You have the right to publish it. " },
            "The copyright of the image you upload, the text you use, the logo " +
              "and the music is either yours or you have obtained the " +
              "permission needed to publish it. Uploading an image you found on " +
              "the internet does not give you the right to use it.",
          ],
          [
            { kind: "strong", text: "You respect trademark and name rights. " },
            "You do not present a brand, organisation or person you do not own " +
              "as if it were your own. Profiles that give the impression of " +
              "being a brand's official account are no problem if the brand is " +
              "yours; if it is not, that is impersonation.",
          ],
          [
            { kind: "strong", text: "You are responsible for where you link to. " },
            "Every address you put on your profile is your choice. If the " +
              "content of the page a link leads to is unlawful or harms the " +
              "visitor, responsibility for that lies with the person who put " +
              "the link there.",
          ],
          [
            {
              kind: "strong",
              text: "You do not publish someone else's personal data without permission. ",
            },
            "Putting another person's photo, phone number, address or " +
              "correspondence on your profile is unlawful without that " +
              "person's consent. If the GitHub account you display on your " +
              "profile is not yours, you are publishing that account's public " +
              "contribution data — do it knowingly.",
          ],
          [
            {
              kind: "strong",
              text: "You share your own contact details knowingly. ",
            },
            "The email, phone number or address you write on your profile is " +
              "open to everyone on the internet and can be collected by " +
              "automated tools. Do not treat it as a field hidden from us; you " +
              "have written it on a public page.",
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Your unpublished drafts. " },
          "Changes you make in the profile editor and have not yet published do " +
            "not appear on your public page. The moment you press publish, that " +
            "layout becomes public and may be indexed by search engines. Even " +
            "if you remove a piece of content later, we cannot recall the " +
            "copies held by people who saw your page at the time or by " +
            "third-party archives.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "What we do when a piece of content is reported to us is written in ",
          { kind: "link", text: "Reports and removal", href: "#bildirim-ve-kaldirma" },
          ". Let us also say plainly here that we do not review your content in " +
            "advance: there is no moderation process that reads every profile " +
            "before it goes live.",
        ],
      },
    ],
  },

  {
    id: "yasak-icerikler",
    heading: "5. Prohibited content and behaviour",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "The following are prohibited on Caka. The list covers both the " +
            "content you write on your profile and the pages you link to — " +
            "linking to a prohibited page counts the same as putting that " +
            "content on Caka.",
        ],
      },
      {
        kind: "list",
        style: "bullet",
        items: [
          [
            { kind: "strong", text: "Phishing and fraud. " },
            "Pages that imitate another service's sign-in screen, fake payment " +
              "or donation collection, fake giveaways and “you send first” " +
              "schemes.",
          ],
          [
            { kind: "strong", text: "Harmful redirection. " },
            "Links that distribute malware, trick the user into downloading " +
              "something, or send the visitor somewhere else without their " +
              "knowledge.",
          ],
          [
            { kind: "strong", text: "Impersonation. " },
            "Representing another person, brand, organisation or public " +
              "authority as though you were them.",
          ],
          [
            { kind: "strong", text: "Copyright and trademark infringement. " },
            "Publishing works you hold no rights to, or linking to unauthorised " +
              "copies of such works.",
          ],
          [
            { kind: "strong", text: "Hate speech, violence and harassment. " },
            "Content that incites hatred on the basis of race, ethnic origin, " +
              "religion, gender, sexual orientation, disability and similar " +
              "characteristics; calls to violence, threats, targeting " +
              "individuals and systematic harassment of a person.",
          ],
          [
            { kind: "strong", text: "Child abuse. " },
            "Any content relating to the sexual abuse of children and any link " +
              "leading to it. There is no warning, suspension or graduated " +
              "process for this item: access is closed directly and the " +
              "required notifications are made.",
          ],
          [
            { kind: "strong", text: "Unlawful goods and services. " },
            "The sale of drugs, weapons, forged documents, stolen accounts and " +
              "data; gambling and betting referrals not permitted by " +
              "legislation.",
          ],
          [
            { kind: "strong", text: "Adult content. " },
            "Pornographic content and links leading to it. Caka has no " +
              "mechanism to place such content behind an age gate; that is why " +
              "it is prohibited without exception.",
          ],
          [
            {
              kind: "strong",
              text: "Publishing someone else's personal data without permission. ",
            },
            "Publishing a person's contact details, address, documents or " +
              "images without their consent.",
          ],
          [
            { kind: "strong", text: "Spam and automated abuse. " },
            "Opening fake accounts in bulk, hoarding addresses, putting the " +
              "service under load with automated tools, attempting to bypass " +
              "security measures or exploiting a vulnerability in the system.",
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          "If you find a security vulnerability, write to ",
          { kind: "strong", text: "hello@caka.app" },
          " instead of exploiting it. We do not take action against anyone for " +
            "vulnerabilities reported in good faith.",
        ],
      },
    ],
  },

  {
    id: "icerik-lisansi",
    heading: "6. Rights over the content",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "The content you put on your profile ",
          { kind: "strong", text: "is yours and stays yours" },
          ". Caka claims no ownership over it.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "But hosting and publishing a page technically means copying, storing " +
            "and transmitting. So when you add your content to Caka you grant " +
            "us ",
          {
            kind: "strong",
            text:
              "a limited right of use that is non-exclusive, royalty-free, " +
              "non-transferable and confined to what is necessary to operate " +
              "the service",
          },
          ". That right covers the following:",
        ],
      },
      {
        kind: "list",
        style: "bullet",
        items: [
          ["Storing and backing up the content on our servers."],
          [
            "Showing your profile to visitors who request it and delivering it " +
              "over a content delivery network.",
          ],
          [
            "Resizing and converting the format of your images so that they " +
              "display properly on the page.",
          ],
          [
            "Producing the preview image and title shown when your profile is " +
              "shared in a messaging app or on a social network.",
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          "That right is ",
          { kind: "strong", text: "limited to these" },
          ". We do not use your content in advertising, do not sell or license " +
            "it to third parties and do not include it in another product. When " +
            "you remove a piece of content from your profile or close your " +
            "account, this right ends too; copies in technical backups are " +
            "cleared within the ordinary backup cycle.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Caka's own name, logo, interface, theme designs and source code, on " +
            "the other hand, belong to us; these terms give you no right over " +
            "them.",
        ],
      },
    ],
  },

  {
    id: "yetkilerimiz",
    heading: "7. Removal, suspension and termination",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Where there is a breach of these terms or of the law, we may take " +
            "one of the following steps:",
        ],
      },
      {
        kind: "list",
        style: "bullet",
        items: [
          [
            { kind: "strong", text: "Remove a single piece of content or a link. " },
            "If the problem is not with the whole profile, this is the narrowest " +
              "intervention.",
          ],
          [
            { kind: "strong", text: "Unpublish the profile. " },
            "The public page is closed to access; your account and content " +
              "remain.",
          ],
          [
            { kind: "strong", text: "Suspend the account. " },
            "You can sign in but not publish.",
          ],
          [
            { kind: "strong", text: "Reclaim the username. " },
            "If the name is being abused or there is a justified trademark " +
              "claim.",
          ],
          [
            { kind: "strong", text: "Terminate access entirely. " },
            "For serious or repeated breaches.",
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          "We observe proportionality: we take the narrowest measure first and ",
          { kind: "strong", text: "inform you in advance wherever possible" },
          ". We leave notification until after the action only where delay " +
            "would harm visitors — phishing, malware, child abuse content or a " +
            "request from a competent authority.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "If you think a decision is wrong you can object by writing to ",
          { kind: "strong", text: "hello@caka.app" },
          ". We review and answer your objection; we reverse a removal we find " +
            "unjustified.",
        ],
      },
    ],
  },

  {
    id: "bildirim-ve-kaldirma",
    heading: "8. Reporting a violation and the removal process",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "If you have seen unlawful content, impersonation, copyright " +
            "infringement or phishing on a Caka profile, write to ",
          { kind: "strong", text: "hello@caka.app" },
          ". So that we can assess your report quickly, we ask you to include:",
        ],
      },
      {
        kind: "list",
        style: "numbered",
        items: [
          ["The full address of the page you are complaining about (caka.app/username)."],
          [
            "Which element on the page is the problem — which link, which " +
              "image, which text.",
          ],
          [
            "What the problem is and on what legal ground you consider it " +
              "unlawful.",
          ],
          [
            "If you are reporting a copyright or trademark infringement, " +
              "information showing that you are the rights holder or acting on " +
              "their behalf.",
          ],
          ["A contact address where we can reach you."],
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "What happens next. " },
          "We review the report ",
          { kind: "strong", text: "without delay" },
          ". Where the content is clearly unlawful and the situation does not " +
            "tolerate delay, we close access to it immediately; in other cases " +
            "we first write to the profile owner and give a reasonable period " +
            "for a reply. We notify our decision both to you and to the profile " +
            "owner. The profile owner may object to the decision. We do not " +
            "commit to a specific response time; the reason is written in ",
          {
            kind: "link",
            text: "section 9",
            href: "#yer-saglayici",
          },
          ".",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Do not abuse the reporting channel. Sending a baseless infringement " +
            "report in order to get a competitor's profile taken down is itself " +
            "a breach of these terms.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "If you think ",
          { kind: "strong", text: "your own personal data" },
          " has been published without permission on a profile, you can send " +
            "that to the address above as a violation report; your rights under " +
            "the KVKK you exercise through the application route in ",
          {
            kind: "link",
            text: "Your rights as a data subject",
            href: "/gizlilik#ilgili-kisi-haklari",
          },
          ".",
        ],
      },
    ],
  },

  {
    id: "yer-saglayici",
    heading: "9. Our status as hosting provider and law no. 5651",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Because Caka hosts and publishes pages prepared by users, it is a ",
          { kind: "strong", text: "hosting provider" },
          " within the meaning of article 2/1-(m) of law no. 5651 (the Turkish " +
            "internet law). This status does not depend on a threshold of scale " +
            "or commerciality: even though the service is free and there is no " +
            "company behind it, we are a hosting provider. As regards the " +
            "site's own pages — the home page and these legal texts — we are at " +
            "the same time a content provider; we write what is there and we " +
            "are responsible for it.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "We do not review content in advance. " },
          "Article 5/1 of the law imposes no obligation on a hosting provider " +
            "to monitor the content it hosts or to investigate whether it is " +
            "unlawful. Caka likewise has no moderation process that reads every " +
            "profile before publication; the moment you press publish the " +
            "content goes live directly. Hosting a page does not mean endorsing " +
            "what is written there.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Content reported to us. " },
          "When we are notified that content we host is unlawful, we remove it " +
            "so far as technically possible and ",
          { kind: "strong", text: "without delay" },
          ". We do not commit to a response time here, and let us write why. " +
            "Article 9 of law no. 5651, which provided a 24-hour period for " +
            "removal, was ",
          { kind: "strong", text: "annulled in its entirety" },
          " by the Constitutional Court's decision of 11/10/2023, no. " +
            "E.2020/76 K.2023/172 (Official Gazette 10.01.2024, no. 32425; the " +
            "annulment took effect on 10.10.2024) and no period was put in its " +
            "place. Writing a period into this text that is not in force would " +
            "mean creating an obligation with our own hands that we cannot " +
            "keep; in a one-person project that would be a promise of use to " +
            "nobody.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Official orders: four hours. " },
          "By contrast there is one concrete period the law does impose on us. " +
            "Under articles 8/5 and 8/A/1, an access-blocking or content-removal " +
            "order issued by a ",
          { kind: "strong", text: "judge, public prosecutor or the Cybersecurity Directorate" },
          " is carried out by us ",
          { kind: "strong", text: "immediately and within four hours at the latest" },
          ". This is not an undertaking we give but a period the law sets.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Where to send your report. " },
          "Send your reports to ",
          { kind: "strong", text: "hello@caka.app" },
          ". For a report to be actionable it must include the full address of " +
            "the page complained about, which element on the page is the " +
            "problem, on what legal ground you consider it unlawful, and who " +
            "you are. Those four items and the process that follows a report " +
            "are set out in detail in ",
          {
            kind: "link",
            text: "section 8",
            href: "#bildirim-ve-kaldirma",
          },
          ". We may be unable to act on an incomplete report.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "The identifying-information obligation under the Regulation issued " +
            "pursuant to law no. 5651, which requires a name, address, phone " +
            "number and tax/national identity number to be shown on the home " +
            "page, applies to hosting providers acting for ",
          { kind: "strong", text: "commercial or economic purposes" },
          ". Because Caka is free today and earns no revenue, that obligation " +
            "does not arise; it comes into play if the service is " +
            "commercialised, and this section will be updated then.",
        ],
      },
    ],
  },

  {
    id: "dis-baglantilar",
    heading: "10. External links and third-party services",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "Caka's job is to gather the links you choose onto a single page and " +
            "publish that page. When a visitor clicks a link on your profile " +
            "they leave Caka and go to another company's site. From that moment " +
            "on, what happens there — the page's content, the product sold, the " +
            "payment taken, the information requested — is the business of that " +
            "site and of the profile owner who sent you there. ",
          { kind: "strong", text: "Caka is not a party to that relationship" },
          ": it is neither the seller, nor an intermediary, nor a payment " +
            "institution.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "We write this not as a disclaimer but as a description of what the " +
            "service is. We do not choose the targets of the links and we have " +
            "no mechanism to keep monitoring those sites; so we are not to be " +
            "taken as having approved or vouched for the content of an external " +
            "site. On the other hand, if we are told that a link is harmful we " +
            "use our ",
          {
            kind: "link",
            text: "removal powers",
            href: "#yetkilerimiz",
          },
          " — we are saying not that we bear no responsibility, but that we " +
            "have this tool in hand.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Before you go to an external site. " },
          "Look at the domain in the address bar, verify the identity of the " +
            "site if you are making a payment, and enter your sign-in details " +
            "only on a page you are sure really belongs to that service. We " +
            "also expect profile owners to keep their links current: an expired " +
            "domain can end up in someone else's hands.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Services the page talks to by itself. " },
          "There are also third-party services we use to run Caka: Google and " +
            "Apple for sign-in, a font service for typefaces, GitHub for the " +
            "contribution graph and Cloudflare for hosting. The link preview " +
            "images on profiles are fetched from the remote site by our server; " +
            "your browser makes no request to that site. Beyond these there are " +
            "connections only you initiate: if you press the play button on a " +
            "YouTube or Spotify card, the player is loaded at that moment and " +
            "your browser connects directly to that platform. Which data " +
            "reaches whom in these requests is written out one by one in ",
          {
            kind: "link",
            text: "Transfers and suppliers",
            href: "/gizlilik#aktarim-ve-tedarikciler",
          },
          ".",
        ],
      },
    ],
  },

  {
    id: "hizmet-surekliligi",
    heading: "11. Service continuity and liability",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "We try to keep Caka running without interruption, but we do not " +
            "undertake that it will be uninterrupted. The service may become " +
            "temporarily unreachable because of maintenance, a fault at an " +
            "infrastructure provider, an attack or a mistake of ours. We " +
            "announce planned maintenance in advance as far as possible.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "As the product develops, features change: new block types may be " +
            "added, an existing feature may change or be removed. If we make a " +
            "removal that directly affects content you have published, we " +
            "announce it in advance and allow a reasonable transition period.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Keeping a backup is in your interest too. " },
          "There is no button in the dashboard today to export your content in " +
            "one click. We recommend not keeping a text you worked long on only " +
            "on Caka, and keeping your own copy as well.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Liability: there is no cap here. " },
          "In this section we do not tie our liability to a monetary limit and " +
            "we do not write a sentence like “we are not liable for indirect " +
            "damages”. The reason is simple: such clauses are invalid in " +
            "consumer contracts. Annex-1 (1)(a) of the Regulation on Unfair " +
            "Terms in Consumer Contracts treats as unfair any term that " +
            "excludes or ",
          { kind: "strong", text: "limits" },
          " the liability of the drafter for death, injury and material damage " +
            "caused by their own act or omission — and a monetary ceiling falls " +
            "within that. Annex-1 (1)(b) invalidates terms that remove or " +
            "disproportionately restrict the legal remedies available to the " +
            "consumer, and article 115/1 of the Turkish Code of Obligations " +
            "(TBK) invalidates an advance exclusion of liability for intent and " +
            "gross negligence. Rather than writing an invalid term and " +
            "presenting it to you as though it were valid, we chose to write " +
            "what genuinely holds.",
        ],
      },
      { kind: "paragraph", text: ["The framework that does hold is this:"] },
      {
        kind: "list",
        style: "bullet",
        items: [
          [
            { kind: "strong", text: "Scope of the service. " },
            "Caka is a page service that hosts and publishes the content you " +
              "write. We do not undertake uninterrupted availability, a " +
              "particular speed, visibility in search engines or a particular " +
              "number of visitors. Nor do we choose or monitor the sites the " +
              "links on your profile lead to; we are not responsible for the " +
              "content there or for what happens there.",
          ],
          [
            {
              kind: "strong",
              text: "The service is free, and that matters legally. ",
            },
            "We charge nothing for Caka and derive no revenue from this use. " +
              "The last sentence of article 114/1 of the TBK reads: “If the " +
              "work does not particularly benefit the debtor, liability is " +
              "assessed more leniently.” In other words, being free is not a " +
              "limit we imposed but a measure the law itself provides, and it " +
              "is taken into account when assessing our duty of care. The day " +
              "we offer a paid plan, that measure falls away as well.",
          ],
          [
            { kind: "strong", text: "Acts of auxiliary persons. " },
            "Article 116/2 of the TBK permits liability arising from the acts " +
              "of auxiliary persons to be excluded in advance. Relying on that " +
              "provision, we ",
            { kind: "strong", text: "exclude in advance" },
            " liability arising from the own acts of the third parties we use " +
              "to run the service — the hosting provider, the identity " +
              "providers, the content delivery network. No claim can be made " +
              "against us for an outage, fault or data loss at an " +
              "infrastructure provider. Our own fault in selecting or " +
              "supervising those parties falls outside this.",
          ],
          [
            { kind: "strong", text: "Your obligations. " },
            "The lawfulness of the content on your profile is yours; the detail " +
              "is in section 4. If a third party directs a claim at us because " +
              "of content on your profile, responsibility for that claim lies " +
              "with the person who put the content there.",
          ],
          [
            { kind: "strong", text: "Acts of third parties and force majeure. " },
            "We cannot be held liable for interruptions arising from events " +
              "outside our control, such as an attack, abuse, an access block " +
              "ordered by a competent authority, or a fault in the electricity " +
              "and communications infrastructure.",
          ],
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "What is never limited. " },
          "None of the above touches the following: liability arising from our " +
            "intent or gross negligence, liability for death and bodily harm, " +
            "and the rights granted to you by the mandatory provisions of " +
            "consumer legislation. Under article 5/2 of law no. 6502, if a term " +
            "in these terms is found unfair, only that term is void and the " +
            "rest of the contract remains valid. Under article 5/3 it is " +
            "presumed that these terms were drafted unilaterally and not " +
            "separately negotiated with you; the party wishing to argue " +
            "otherwise bears the burden of proof, and that party is us.",
        ],
      },
    ],
  },

  {
    id: "ucretlendirme",
    heading: "12. Pricing",
    blocks: [
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "There is no paid plan on Caka today. " },
          "No fee is charged, no payment details are requested and there is no " +
            "payment flow in the product. That is why this section contains no " +
            "subscription, invoicing, refund or withdrawal terms: writing the " +
            "terms of a service that does not exist would make this text untrue.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "The service is entirely free; it is not possible to sell goods or " +
            "services, conclude a contract or place an order through the " +
            "platform.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "If we offer a paid plan in future, its price, scope, payment and " +
            "refund terms will be set out in a separate text and notified to " +
            "you before it takes effect. Moving to a paid plan will always be " +
            "your separate and explicit choice; the account you use today does " +
            "not become paid by itself.",
        ],
      },
    ],
  },

  {
    id: "hesap-kapatma",
    heading: "13. Closing your account",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "You can close your account whenever you want. ",
          {
            kind: "strong",
            text: "Today you cannot do it from the dashboard in one click",
          },
          " — there is no delete-account button yet. We write this as it is, " +
            "because we don't want to describe a feature that doesn't exist as " +
            "if it did.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "You send the closure request by writing from the email address " +
            "registered to your account. Where to write and how the application " +
            "works is explained in ",
          {
            kind: "link",
            text: "Your rights as a data subject, and how to apply",
            href: "/gizlilik#ilgili-kisi-haklari",
          },
          ". To protect against a closure requested on someone else's behalf we " +
            "may need to verify your identity.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "What happens when you close it. " },
          "Your public profile is unpublished and the caka.app/username address " +
            "stops working. Your account data, profile content, uploaded files " +
            "and session records are deleted. Deletion cannot be undone; there " +
            "is no guarantee that you will be able to take the same username " +
            "again later.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Records that must be retained because of a legal obligation may be " +
            "kept for the period the legislation provides even after the " +
            "account is closed. You can find which data is kept for how long in ",
          {
            kind: "link",
            text: "Retention periods",
            href: "/gizlilik#saklama-sureleri",
          },
          ".",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "We too may terminate your account in the event of a serious breach " +
            "of these terms; how that works is written in ",
          { kind: "link", text: "section 7", href: "#yetkilerimiz" },
          ".",
        ],
      },
    ],
  },

  {
    id: "uygulanacak-hukuk",
    heading: "14. Governing law and dispute resolution",
    blocks: [
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Turkish law" },
          " applies to these terms and to the use of Caka.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "We do not choose a competent court here. " },
          "That is not an omission but a deliberate choice. Under article 17 of " +
            "the Turkish Code of Civil Procedure (HMK) a jurisdiction agreement " +
            "can be made only between merchants or public legal entities; a " +
            "clause saying “the courts of such-and-such a province have " +
            "jurisdiction” placed in a contract against a consumer is invalid. " +
            "Annex-1 (1)(n) of the Regulation on Unfair Terms invalidates the " +
            "same clause a second time: terms that restrict the consumer's " +
            "right to go to court, force them into an arbitration not provided " +
            "for by law, or reverse the burden of proof are deemed unfair. Had " +
            "we written such a clause, the Ministry of Trade could have " +
            "required its removal within 30 days under article 8 of the " +
            "Regulation; if it were not removed, an administrative fine per " +
            "contract could be imposed under article 77 of law no. 6502.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "Where you apply. " },
          "The bodies competent in consumer disputes are set by law and that " +
            "competence is absolute (law no. 6502, art. 73/1). The monetary " +
            "limit for consumer arbitration committees is ",
          { kind: "strong", text: "186,000 TRY for 2026" },
          " (Official Gazette of 23.12.2025, no. 33116; in force on 1 January " +
            "2026). This amount is reset each December by a communiqué of the " +
            "Ministry of Trade, meaning ",
          {
            kind: "strong",
            text: "the figure above is for 2026 and changes every January",
          },
          "; you can verify the current amount from the Ministry's latest " +
            "communiqué. For disputes below the limit, applying to the consumer " +
            "arbitration committee is mandatory (art. 68/1); for disputes above " +
            "it, the committee cannot be used and you go directly to the " +
            "consumer court. For disputes to be heard in the consumer court, " +
            "applying to a mediator before bringing an action is a procedural " +
            "requirement (art. 73/A); disputes within the committee's remit " +
            "fall outside this.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "You can also apply where you live. " },
          "Article 73/5 of law no. 6502 says the consumer may ",
          { kind: "strong", text: "also" },
          " bring their action in the court of their own place of residence. " +
            "The word “also” matters: this is an option added to the generally " +
            "competent courts, not an obligation replacing them. The choice is " +
            "yours.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Your right to bring complaints about personal data to the Personal " +
            "Data Protection Authority is unaffected by this text.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "If a provision of these terms is held invalid, the remaining " +
            "provisions stay in force.",
        ],
      },
    ],
  },

  {
    id: "degisiklikler-ve-iletisim",
    heading: "15. Changes and contact",
    blocks: [
      {
        kind: "paragraph",
        text: [
          "As the product changes, so do these terms: we update the text when a " +
            "new feature is added, when a rule is clarified or when legislation " +
            "changes.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "With every update the version number at the top of the page " +
            "increases and the last-updated date is renewed. The versions of " +
            "the three legal documents are independent of each other: only the " +
            "date of the document that changed moves. If there is a change that " +
            "substantially affects your rights or obligations, we also inform " +
            "users who have an account. If you keep using the service after a " +
            "change you accept the new version; if you do not accept it you can " +
            "close your account.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          { kind: "strong", text: "How to reach us. " },
          "For content violation reports, objections to removals and questions " +
            "about these terms you can write to ",
          { kind: "strong", text: "hello@caka.app" },
          ". For applications concerning your personal data, the ",
          {
            kind: "link",
            text: "application route in the Privacy Policy",
            href: "/gizlilik#ilgili-kisi-haklari",
          },
          " applies.",
        ],
      },
      {
        kind: "paragraph",
        text: [
          "Alongside this text we recommend reading the ",
          { kind: "link", text: "Privacy Policy", href: "/gizlilik" },
          " and the ",
          { kind: "link", text: "Cookie Policy", href: "/cerez-politikasi" },
          " as well.",
        ],
      },
    ],
  },
];
