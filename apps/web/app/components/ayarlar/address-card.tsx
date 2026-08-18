// Ayarlar → Adres: kullanıcı adı değişikliği (Değişmez #10).
//
// Sonuçlar gönderimden ÖNCE yazılıdır ve onay kutusu işaretlenmeden buton
// açılmaz: 30 gün sonra kırılacak bağlantılar kullanıcıya sürpriz olmamalı.
// Canlı kontrol tavsiye niteliğindedir (onboarding ile aynı `/api/username-check`);
// asıl karar sunucudaki `changeUsername`'dedir.
import { useEffect, useId, useRef, useState } from "react";
import { useFetcher } from "react-router";

import { ayarlarCatalog, type AddressErrorId, type AyarlarContent } from "~/content/ayarlar";
import { commonCatalog, type CommonContent } from "~/content/common";
import { useCatalog } from "~/lib/locale";
import { normalizeUsername, validateUsername } from "@caka/shared";

export interface AddressChangeState {
  allowed: boolean;
  /** `YYYY-MM-DD`; izin varken null. */
  availableOn: string | null;
  remainingDays: number;
  activeRedirects: { oldUsername: string; expiresOn: string }[];
}

export type AddressActionData =
  | { ok: true; previousUsername: string; username: string; expiresOn: string }
  | { ok: false; error: AddressErrorId };

type Availability =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "available"; username: string }
  | { state: "unavailable"; message: string };

/** Onboarding'deki canlı kontrolün Ayarlar sürümü: "kendi adresin" hâli eklenir. */
function useAvailability(value: string, current: string): Availability {
  const copy = useCatalog(ayarlarCatalog);
  const common = useCatalog(commonCatalog);
  const [availability, setAvailability] = useState<Availability>({ state: "idle" });
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    if (!value.trim()) {
      setAvailability({ state: "idle" });
      return;
    }
    const local = validateUsername(value);
    if (!local.ok) {
      setAvailability({
        state: "unavailable",
        message: common.usernameErrors[local.error],
      });
      return;
    }
    if (local.username === normalizeUsername(current)) {
      setAvailability({ state: "unavailable", message: copy.addressErrors.same });
      return;
    }
    setAvailability({ state: "checking" });
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/username-check?u=${encodeURIComponent(value)}`);
        const body = (await res.json()) as { available: boolean; username?: string };
        if (requestId.current !== id) return;
        setAvailability(
          body.available
            ? { state: "available", username: body.username ?? local.username }
            : { state: "unavailable", message: copy.address.unavailable },
        );
      } catch {
        // Ağ hatasında engelleme: sunucu son sözü zaten söyler.
        if (requestId.current === id) setAvailability({ state: "idle" });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [value, current, copy, common]);

  return availability;
}

/**
 * Hata kimliğini metne çevirir. Biçim hataları ortak katalogda (onboarding de
 * aynı dört mesajı gösteriyor), kalanlar ayarlar kataloğunda.
 */
function errorMessage(
  content: AyarlarContent,
  common: CommonContent,
  error: AddressErrorId,
): string {
  if (error in common.usernameErrors) {
    return common.usernameErrors[error as keyof CommonContent["usernameErrors"]];
  }
  if (error in content.addressErrors) {
    return content.addressErrors[error as keyof AyarlarContent["addressErrors"]];
  }
  return content.addressErrors.unknown;
}

export function AddressCard({
  username,
  change,
}: {
  username: string;
  change: AddressChangeState;
}) {
  const content = useCatalog(ayarlarCatalog);
  const common = useCatalog(commonCatalog);
  const copy = content.address;
  const fetcher = useFetcher<AddressActionData>();
  const [value, setValue] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const inputId = useId();
  const confirmId = useId();
  const availability = useAvailability(value, username);
  const result = fetcher.data ?? null;
  const submitting = fetcher.state !== "idle";

  // Başarılı değişiklikten sonra form sıfırlanır; aksi hâlde eski değer
  // ekranda kalıp "değişmedi mi?" izlenimi verirdi.
  useEffect(() => {
    if (result?.ok) {
      setValue("");
      setConfirmed(false);
    }
  }, [result]);

  const ready =
    change.allowed && availability.state === "available" && confirmed && !submitting;
  const invalid = availability.state === "unavailable";

  return (
    <section id="adres" className="ayarlar-card">
      <h2>{copy.title}</h2>
      <p className="ayarlar-hint">{copy.hint}</p>

      <p className="ayarlar-current">
        <span>{copy.currentLabel}</span>
        <strong>caka.app/{username}</strong>
      </p>

      {change.activeRedirects.length > 0 && (
        <>
          <h3>{copy.activeRedirectsTitle}</h3>
          <ul className="ayarlar-list">
            {change.activeRedirects.map((item) => (
              <li key={item.oldUsername}>
                {content.notices.redirect(item.oldUsername, item.expiresOn)}
              </li>
            ))}
          </ul>
        </>
      )}

      <h3>{copy.consequencesTitle}</h3>
      <ul className="ayarlar-list">
        {copy.consequences.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      {!change.allowed && change.availableOn ? (
        <p className="ayarlar-notice" data-tone="info">
          {content.notices.cooldown(change.availableOn, change.remainingDays)}
        </p>
      ) : (
        <fetcher.Form method="post" className="ayarlar-address-form">
          <input type="hidden" name="intent" value="address" />
          <label className="ayarlar-field-label" htmlFor={inputId}>
            {copy.fieldLabel}
          </label>
          <div className="ayarlar-field" data-invalid={invalid || undefined}>
            <span aria-hidden>{copy.domain}</span>
            <input
              id={inputId}
              name="username"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={copy.placeholder}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={40}
              aria-invalid={invalid || undefined}
              aria-describedby={`${inputId}-status`}
            />
          </div>
          <p className="ayarlar-hint">{copy.hintFormat}</p>

          <p className="ayarlar-status" id={`${inputId}-status`} aria-live="polite">
            {availability.state === "available" && (
              <span data-tone="ok">✓ {copy.available}</span>
            )}
            {availability.state === "unavailable" && (
              <span data-tone="error">⚠ {availability.message}</span>
            )}
            {availability.state === "checking" && (
              <span data-tone="muted">{copy.checking}</span>
            )}
          </p>

          <label className="ayarlar-confirm" htmlFor={confirmId}>
            <input
              id={confirmId}
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            <span>{copy.confirmLabel}</span>
          </label>

          <button type="submit" className="ayarlar-submit" disabled={!ready}>
            {submitting ? copy.submitting : copy.submit}
          </button>
        </fetcher.Form>
      )}

      {result && (
        <p className="ayarlar-notice" data-tone={result.ok ? "ok" : "error"} role="status">
          {result.ok
            ? content.notices.success(result.previousUsername, result.username, result.expiresOn)
            : errorMessage(content, common, result.error)}
        </p>
      )}
    </section>
  );
}
