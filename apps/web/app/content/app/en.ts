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
    signOut: "Sign out",
    accountMenu: "Account menu",
  },

  nav: {
    copied: "Copied",
    copyLink: "Copy link",
    comingSoon: "Coming soon",
  },

  profile: {
    menuLabel: "Caka menu",
    blocksLabel: "Links and content",
    addImage: "Add an image",
    availableAddress: "This address is free",
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
    backHome: "Back to home",
  },
} satisfies AppContent;
