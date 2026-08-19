import {
  type BlockIssueId,
  type BlockGridLimits,
  MAX_GALLERY_BLOCKS,
  type ProfileBlock,
} from "@caka/shared";

import type { AppContent } from "./index";

export const en = {
  titles: {
    editor: "Editor — Caka",
    dashboard: "Dashboard — Caka",
    settings: "Settings — Caka",
    login: "Log in — Caka",
    setup: "Set up your page — Caka",
    onboardingFinish: "Preparing your account — Caka",
    onboardingReady: "Your page is ready — Caka",
    notFound: "Page not found — Caka",
  },

  blockTypes: {
    profile: "Profile",
    social: "Social media",
    link: "Link",
    text: "Text",
    image: "Image",
    status: "Announcement",
    gallery: "Photo gallery",
    youtube: "YouTube",
    spotify: "Spotify",
    ayet: "Qur'an verse",
  } satisfies Record<ProfileBlock["type"], string>,

  blockIssues: {
    profile_name: "Enter your name",
    social_target: "Enter a link or a username",
    link_url: "Enter a link address",
    link_title: "Enter a title",
    text_empty: "Write some text",
    status_empty: "Write the announcement",
    image_missing: "Upload an image",
    gallery_empty: "Add a photo to the gallery",
    youtube_video_url: "Enter a YouTube video link",
    youtube_channel_url: "Enter a YouTube channel link",
    spotify_url: "Enter a Spotify link",
    ayet_verse: "Choose a verse",
  } satisfies Record<BlockIssueId, string>,

  gridLimit: (blockLabel: string, limits: BlockGridLimits) =>
    `A ${blockLabel} block can be at least ${limits.minW}×${limits.minH} and at most ${limits.maxW}×${limits.maxH}`,

  galleryCountLimit: `Your page can have at most ${MAX_GALLERY_BLOCKS} gallery blocks`,

  editor: {
    layoutUnreadable: "The page layout could not be read",
    backToDashboard: "Back to dashboard",
    toolbarLabel: "Editor tools",
    addLink: "Add a link",
    addImage: "Add an image",
    addGallery: "Add a photo gallery",
    mobilePreview: "Mobile preview",
    desktopPreview: "Desktop view",
    pickTheme: "Pick a theme",
    editProfileInfo: "Edit general profile information",
    saveFailed: "Couldn't save — check your connection.",

    draftTitle: "You have unpublished changes",
    liveTitle: "Your live page",
    draftShort: "Draft",
    liveShort: "Live",
    addressLabel: (username: string, hasDraft: boolean) =>
      `caka.app/${username} — ${hasDraft ? "has a draft" : "live"}`,
    publishing: "Publishing",
    publishingProgress: "Publishing…",
    publishFinish: "Finish and publish",
    publishShort: "Publish",
    blockedTitle: "Your page can't be published until these blocks are done. Fill them in or remove them:",

    fieldDescription: "Description",
    fieldTitle: "Title",
    fieldLink: "Link",

    imageUploading: "Uploading…",
    imageReplace: "Replace image",
    imageDrop: "Drag or choose",
    imageUploadFailed: "The image couldn't be uploaded",

    galleryEmpty: "No photos yet.",
    galleryAltPlaceholder: "Alt text (optional)",
    galleryAdd: "Add photos (JPEG or PNG)",
    galleryMultiHint: "You can select more than one photo",

    resolving: "Resolving…",
    youtubeFailed: "The YouTube link couldn't be resolved.",
    youtubeFailedHint: "The YouTube link couldn't be resolved — check your link.",
    youtubeTitlePlaceholder: "Leave empty and the card shows only the video",
    spotifyFailed: "The Spotify link couldn't be resolved.",
    spotifyFailedHint: "The Spotify link couldn't be resolved — check your link.",
    spotifyAdded: (kindLabel: string) => `Added as ${kindLabel.toLowerCase()}`,

    dragHint: "hold → drag",
    closePanel: "Close panel",
    deleteBlock: "Delete block",

    fieldName: "Name",
    fieldPlatform: "Platform",
    fieldSocialTarget: "Link or username",
    socialHint:
      "You can paste the profile link or just type the username — we understand both.",
    fieldImage: "Image",
    fieldAnnouncement: "Announcement",
    galleryTitleHint:
      "The title only shows on galleries two rows tall. On short galleries it is used for screen readers.",
    photosLegend: (count: number, max: number) => `Photos (${count}/${max})`,
    galleryMaxPhotos: (max: number, room: number) =>
      `A gallery can hold at most ${max} photos; the first ${room} of your selection were added.`,
    photoAltAria: (index: number) => `Alt text for photo ${index}`,
    photoUpAria: (index: number) => `Move photo ${index} up`,
    photoDownAria: (index: number) => `Move photo ${index} down`,
    photoRemoveAria: (index: number) => `Remove photo ${index}`,
    pickerSocial: "Social media",
    pickerContent: "Content",
    pickerNoResults: (query: string) => `No results for “${query}”.`,

    galleryFullHint: (max: number) =>
      `A gallery can hold at most ${max} photos. Remove one before adding a new photo.`,
    galleryUploadStep: (done: number, total: number) => `Uploading… (${done}/${total})`,
    galleryBlockLimit: (max: number) =>
      `Your page can have at most ${max} photo galleries. Remove one before adding another.`,
    youtubeLinkLabel: "YouTube link",
    youtubeHint:
      "We tell video and channel addresses apart — whichever you paste is what we add.",
    linkTitlePlaceholder: "e.g. Portfolio",
    optionalTitle: "Title (optional)",
    spotifyLinkLabel: "Spotify link",
    spotifyHint:
      "Tracks, albums, playlists, artists, podcasts and episodes can be added — whatever you paste is what we add.",
    ayetVariantLegend: "Card version",
    ayetVariantArabic: "Arabic only",
    ayetVariantMeal: "Translation only",
    ayetVariantBoth: "Both together",
    ayetVariantHint:
      "The version sets the card's typography and its smallest size: Arabic script needs more room, and showing both needs the most.",
    ayetSearchLabel: "Search verses",
    ayetSearchPlaceholder: "Bakara 255 or a keyword",
    ayetSearchHint:
      "Type a surah name and verse number (“Bakara 255”, “2:255”), or search for a word in the Turkish translation.",
    ayetSearching: "Searching verses…",
    ayetNoResults: (query: string) => `No verse found for “${query}”.`,
    ayetFailed: "The verse source could not be reached — check your connection.",
    ayetSelected: (surahName: string, verse: number) => `${surahName} ${verse} added`,
    ayetSourceNote: (translator: string) =>
      `The Arabic text is in Uthmani script (Hafs); the Turkish translation is by ${translator} and is credited at the foot of the card.`,
    fixIssue: "Fix",
    removeBlock: "Remove",
    editedElsewhere: "The page was edited somewhere else.",

    richText: {
      placeholder: "Write something…",
      linkUrl: "Link address",
      bold: "Bold",
      italic: "Italic",
      orderedList: "Ordered list",
      quote: "Quote",
      link: "Link",
      toolbarLabel: "Text formatting",
    },
  },

  setup: {
    stepsLabel: "Setup steps",
    nameRequired: "You need to enter your name",
    photoInvalid: "The photo couldn't be verified",
    linkInvalid: "One of the links isn't valid",
    photoUploadFailed: "The photo couldn't be uploaded",
    photoUploading: "Uploading…",
    photoReplace: "Replace photo",
    nameLabel: "Your name",
    bioLabel: "Short bio",
    bioPlaceholder: "Say a few words about yourself.",

    platformsTitle: "Which platforms are you on?",
    platformsBody:
      "Each platform you pick appears as a block on your page. You can enter the usernames later.",
    purposeTitle: "What will you use Caka for?",
    purposeBody: "Pick what fits you. We'll set your page up accordingly, no fiddling with settings.",
    discoveryKicker: "One last question before your page",
    discoveryTitle: "Where did you hear about Caka?",
    templateTitle: "Pick a template",
    templateBody: "Choose the style that fits you, add your content later.",
    templatePreviewRole: "Design · Istanbul",
    templateUse: "Start with this template",
    linksTitle: "Add your links",
    linksBody: "Enter the usernames for the platforms you picked.",
    linksChosen: "Your picks",
    usernameLabel: "Username",
    extraLinks: "Extra links",

    buildingContent: "Finding your content…",
    buildingLinks: "Placing your links on the page",
    readyKicker: "Looking good",
    readyBody:
      "Your page is off to a good start. Keep editing and you can make it even better.",
    readyTitle: "Your new page is live",
    readyCta: "Keep editing my page",

    bioTooLong: (max: number) => `The bio can be at most ${max} characters`,
    bioOverBy: (over: number) =>
      `The bio is ${over} characters too long. Shorten it to continue.`,
    stepAria: (current: number, total: number) => `Step ${current} of ${total}`,
    skipStep: "Skip this step",
    takenFromAccount: (username: string) => `taken from your ${username} account`,
    haveAccountSignIn: "Already have an account? Log in",
    claimingAddress: (username: string) => `You're claiming caka.app/${username}.`,
    termsNotice: "By signing up you accept the terms of use and the privacy policy.",
    gridSoon: "The grid editor is coming very soon — your page is already live.",

    almostDone: "Almost done",
    claimTitle: "Welcome",
    claimBody: "Which address should your page be published at?",
    claimAvailable: "✓ this address is free",
    claimTaken: "This address was just taken, try another one",
    claimUnknownError: "Something went wrong, please try again",
  },

  auth: {
    loginTitle: "Welcome back",
    loginBody: "Pick up where you left off.",
    loginCta: "log in",
    signInGoogle: "Sign in with Google",
    signInApple: "Sign in with Apple",
    noAccount: "Don't have an account?",
    claimAddress: "Claim your address",
    homeAria: "Caka home page",
    demoRole: "ceramics studio · İzmir",
    demoLinkCalendar: "Studio calendar",
    demoLinkContact: "Contact",

    signOut: "Sign out",
    accountMenu: "Account menu",
  },

  nav: {
    copied: "Copied",
    copyLink: "Copy link",
    pages: "Pages",
    analytics: "Analytics",
    settings: "Settings",
    viewProfile: "View profile",
    editProfile: "Edit profile",
    accountSettings: "Account settings",
    draftNotice:
      "You have unpublished changes — the preview below shows the live version.",
    editPage: "Edit page",
    openPage: "Open page",

    comingSoon: "Coming soon",
  },

  profile: {
    menuLabel: "Caka menu",
    blocksLabel: "Links and content",
    addImage: "Add an image",
    shareImageAlt: (name: string) => `Share image of ${name}'s Caka profile`,
    description: (name: string) => `${name}'s links, projects and work.`,
    edit: "Edit",
    unclaimed: (username: string) => `caka.app/${username} isn't taken yet.`,

    availableAddress: "This address is free",
    claimThisAddress: "Claim this address",
    availableCta: "this address is free, grab it!",
  },

  api: {
    origin: "Invalid request origin",
    layoutReadFailed: "The page data couldn't be read; refresh the page",
    layoutTooManyBlocks: (max: number) => `Your page can have at most ${max} blocks`,
    draftInvalid: "The draft data is invalid",
    blocksIncomplete: "Some blocks are incomplete",

    spotifyInvalid:
      "That doesn't look like a link. Paste the address you get from “Share → Copy link” on Spotify.",
    spotifyNotSpotify:
      "That address isn't Spotify's. Paste an open.spotify.com address or a link in the spotify:track:… form.",
    spotifyUnsupported:
      "That Spotify address isn't content you can add. Tracks, albums, playlists, artists, podcasts and episodes can be added; user profiles, search and library pages cannot.",
    spotifyNotFound: (kind: string) =>
      `That ${kind} couldn't be found on Spotify. It may have been removed, or the link may have been copied incompletely.`,
    spotifyUnavailable: "Spotify didn't respond just now. Try again in a moment.",

    youtubeInvalid: "That doesn't look like a link. Paste a video or channel address.",
    youtubeNotYoutube: "That address isn't YouTube's. Paste a youtube.com or youtu.be address.",
    youtubeUnsupported:
      "That YouTube address is not a video or a channel. Playlists, search and feed pages can't be added.",
    youtubeChannelNotFound:
      "That channel couldn't be found. Check the address or try the channel's /channel/UC… address.",
    youtubeVideoNotFound:
      "The video couldn't be found. It may have been deleted or made private, or the link may have been copied incompletely.",

    ayetUnavailable: "The verse source didn't respond just now. Try again in a moment.",
    ayetSurahUnknown: "There is no such surah. Enter a number between 1 and 114, or a surah name.",
    ayetVerseOutOfRange: (surahName: string, count: number) =>
      `Surah ${surahName} has ${count} verses; there is no verse with that number.`,
    ayetQueryTooShort: (min: number) => `Type at least ${min} letters to search.`,

    uploadOnlyJpegPng: "You can only upload JPEG or PNG",
    uploadTooLarge: "The photo can be at most 5 MB",
    uploadTypeUnverified: "The photo's type couldn't be verified",
    uploadSaveFailed: "The photo couldn't be saved",
  },

  errors: {
    genericTitle: "Something went wrong",
    genericBody: "An unexpected error occurred. Please try again.",
    notFoundTitle: "Page not found",
    notFoundBody: "The page you're looking for doesn't exist or may have moved.",
    profileErrorTitle: "This page can't be displayed",
    profileErrorBody: "Something went wrong; try again later.",
    illustrationAlt:
      "A miniature landscape made of knitted yarn and clay: round bushes with a blue stream winding between them",
    createPage: "Create your own page",
    backHome: "Back to home",
  },
} satisfies AppContent;
