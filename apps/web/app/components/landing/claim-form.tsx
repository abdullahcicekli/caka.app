import { Form } from "react-router";

import { PillButton } from "./pill-button";
import type { LandingContent } from "~/content/landing";
import { useHref } from "~/lib/locale";

type ClaimContent = LandingContent["hero"]["claim"];

interface ClaimFormProps {
  claim: ClaimContent;
  /** Bulunduğu renk bloğuna göre CTA varyantı (koyu blokta kireç hap). */
  buttonVariant?: "ink" | "lime";
}

/** Adres kapma formu: beyaz hap input + blok rengine uygun CTA. */
export function ClaimForm({ claim, buttonVariant = "ink" }: ClaimFormProps) {
  const localize = useHref();
  return (
    <Form
      method="get"
      action={localize(claim.action)}
      className="lp-claim"
    >
      <label className="lp-claim-field">
        <span className="lp-claim-domain">{claim.domain}</span>
        <input
          type="text"
          name="u"
          placeholder={claim.placeholder}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className="lp-claim-input"
        />
      </label>
      <PillButton type="submit" variant={buttonVariant} className="lp-claim-submit">
        {claim.cta}
      </PillButton>
    </Form>
  );
}
