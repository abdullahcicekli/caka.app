import { createAuthClient } from "better-auth/react";

/** Tarayıcı tarafı auth istemcisi; baseURL mevcut origin'dir. */
export const authClient = createAuthClient();

export type SocialProvider = "google" | "apple";

export function signInWithSocial(
  provider: SocialProvider,
  callbackURL = "/onboarding/tamamla",
) {
  return authClient.signIn.social({ provider, callbackURL });
}
