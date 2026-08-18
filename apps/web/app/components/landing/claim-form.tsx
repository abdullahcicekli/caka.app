import { Form } from "react-router";

import { PillButton } from "./pill-button";
import type { LandingContent } from "~/content/landing";
import { useHref } from "~/lib/locale";

type ClaimContent = LandingContent["hero"]["claim"];

interface ClaimFormProps {
  claim: ClaimContent;
  /** Bulunduğu renk bloğuna göre CTA varyantı (lime blokta koyu, mor blokta lime). */
  buttonVariant?: "heroDark" | "lime";
}

/** Adres kapma formu: beyaz hap input + blok rengine uygun CTA. */
export function ClaimForm({ claim, buttonVariant = "heroDark" }: ClaimFormProps) {
  const localize = useHref();
  return (
    <Form
      method="get"
      action={localize(claim.action)}
      className="flex w-full max-w-xl flex-col gap-3 sm:flex-row"
    >
      <label className="flex min-w-0 flex-1 items-center rounded-full bg-white px-6 py-3 text-base">
        <span className="text-murekkep/60">{claim.domain}</span>
        <input
          type="text"
          name="u"
          placeholder={claim.placeholder}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent font-medium text-murekkep outline-none placeholder:font-medium placeholder:text-murekkep"
        />
      </label>
      <PillButton type="submit" variant={buttonVariant} className="shrink-0">
        {claim.cta}
      </PillButton>
    </Form>
  );
}
