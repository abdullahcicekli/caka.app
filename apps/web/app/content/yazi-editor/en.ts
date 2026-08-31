import { MAX_POSTS_PER_PROFILE, POST_BODY_MAX_BYTES } from "@caka/shared";

import type { YaziEditorContent } from "./index";

const MAX_KB = POST_BODY_MAX_BYTES / 1024;

export const en = {
  nav: "Posts",

  list: {
    title: "Posts",
    intro: `Long-form texts published under your profile at their own address. You can have up to ${MAX_POSTS_PER_PROFILE} posts; drafts count too.`,
    empty: "No posts yet. Start your first one below.",
    newPost: "New post",
    limitReason: `You've reached the ${MAX_POSTS_PER_PROFILE}-post limit. Delete one of your posts before starting a new one.`,
    statusDraft: "Draft",
    statusPublished: "Published",
  },

  editor: {
    metaTitle: "Post editor",
    backToList: "Back to posts",
    titlePlaceholder: "Title",
    bodyPlaceholder: "Start writing…",
    slugLabel: "Address",
    slugHint: "The address can be changed until the post is first published.",
    slugAutoHint: "The address is created from your title automatically. You can edit it if you want.",
    slugEdit: "Edit",
    slugDone: "Done",
    slugLockedReason:
      "A published post's address can't be changed, so shared links don't break.",
    slugStatus: {
      checking: "Checking address…",
      available: "This address is available.",
      taken: "This address is used by another of your posts.",
      too_short: "The address must be at least 3 characters.",
      too_long: "The address can be at most 80 characters.",
      invalid_chars: "The address can only contain lowercase letters, digits and hyphens.",
      reserved: "This address is reserved; pick another one.",
    },
    save: {
      pending: "The draft is saved automatically once you add a title.",
      saving: "Saving…",
      saved: "Saved",
      error: "Couldn't save — check your connection. Your changes are still in this tab.",
      conflict:
        "This post was updated in another tab. Your latest changes here weren't saved — copy your text before reloading.",
      unauthenticated:
        "You seem to be signed out. Sign in in a new tab; your changes are still in this tab.",
      tooLarge: `The post exceeds the ${MAX_KB} KB limit and isn't being saved. Shorten the content to save.`,
    },
    sizeIndicator: (kb: string): string => `${kb} / ${MAX_KB} KB`,
    publish: "Publish",
    unpublish: "Unpublish",
    remove: "Delete",
    removeDialog: {
      title: "Delete post?",
      body: "This post will be permanently deleted. This cannot be undone.",
      cancel: "Cancel",
      confirm: "Delete permanently",
    },
    viewPost: "Open post",
    actionFailed: "The action couldn't be completed; try again.",
    validationTitle: "Add a title before publishing.",
    validationSlug: "Choose an available, valid address before publishing.",
    publishedToast: {
      title: "Your post is live",
      body: "You can add a card that automatically lists your posts on your page.",
      addToPage: "Add to my page",
      dismiss: "Not now",
    },
    toolbar: {
      h2: "Heading",
      h3: "Subheading",
      codeBlock: "Code block",
      image: "Add image",
    },
    imageUploadFailed: "Image upload failed",
  },
} satisfies YaziEditorContent;
