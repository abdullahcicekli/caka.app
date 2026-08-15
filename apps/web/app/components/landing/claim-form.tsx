import { Form } from "react-router";

import { PillButton } from "./pill-button";
import type { LandingContent } from "~/content/landing";

type ClaimContent = LandingContent["hero"]["claim"];

/**
 * Adres kapma formu: beyaz hap input + koyu CTA.
 * Şimdilik /login'e taşır; onboarding geldiğinde `action` içerikten değişir.
 */
export function ClaimForm({ claim }: { claim: ClaimContent }) {
  return (
    <Form
      method="get"
      action={claim.action}
      className="flex w-full max-w-xl flex-col gap-3 sm:flex-row"
    >
      <label className="flex min-w-0 flex-1 items-center rounded-full bg-white px-6 py-3 text-base">
        <span className="text-murekkep/60">{claim.domain}</span>
        <input
          type="text"
          name="username"
          placeholder={claim.placeholder}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent font-medium text-murekkep outline-none placeholder:font-medium placeholder:text-murekkep"
        />
      </label>
      <PillButton type="submit" variant="heroDark" className="shrink-0">
        {claim.cta}
      </PillButton>
    </Form>
  );
}
