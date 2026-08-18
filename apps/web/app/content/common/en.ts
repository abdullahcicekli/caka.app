import { USERNAME_MAX, USERNAME_MIN } from "@caka/shared";

import type { CommonContent } from "./index";

export const en = {
  saveState: {
    saving: "Saving…",
    saved: "Saved",
    error: "Couldn't save — try again",
  },
  usernameErrors: {
    too_short: `Must be at least ${USERNAME_MIN} characters`,
    too_long: `Can be at most ${USERNAME_MAX} characters`,
    invalid_chars: "Lowercase letters, numbers and hyphens only; no hyphen at the start or end",
    reserved: "This address isn't available",
  },
} satisfies CommonContent;
