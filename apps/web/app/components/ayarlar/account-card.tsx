// Ayarlar → Hesap: salt okunur giriş bilgisi, KVKK m.11 başvuru yolu ve
// self-servis hesap silme.
//
// Gizlilik Metni bağlantısı YALNIZCA belge yayındayken çıkar (R33 kapısı):
// yayında olmayan belge prod'da 404 verir, koşulsuz bağlantı ölü olurdu.
// SiteFooter ve FaqSection aynı kuralı uygular; `publishedLegal` loader'dan gelir.
//
// Silme kutusu bilerek sürtünmeli: sonuçlar gönderimden ÖNCE listelenir,
// kullanıcı kendi adresini elle yazar ve ayrıca onay kutusunu işaretler. İşlem
// geri alınamıyor — tek yanlış tıklamayla ulaşılabilir olmamalı. Asıl karar
// yine sunucudadır (`server/account.ts`); buradaki kontroller kolaylık.
import { useId, useState } from "react";
import { Link, useFetcher } from "react-router";

import { ayarlarCatalog, providerLabel, type DeleteErrorId } from "~/content/ayarlar";
import { useCatalog } from "~/lib/locale";
import { normalizeUsername, type LegalDocumentId } from "@caka/shared";

/** Silme yalnızca başarısızlıkta gövde döndürür; başarı hâli yönlendirmedir. */
type DeleteActionData = { ok: false; error: DeleteErrorId };

export function AccountCard({
  username,
  providers,
  email,
  emailVerified,
  publishedLegal,
}: {
  username: string;
  providers: string[];
  email: string;
  emailVerified: boolean;
  publishedLegal: readonly LegalDocumentId[];
}) {
  const copy = useCatalog(ayarlarCatalog).account;
  const privacyPublished = publishedLegal.includes("gizlilik");

  return (
    <>
      <section id="hesap" className="ayarlar-card">
        <h2>{copy.title}</h2>
        <p className="ayarlar-hint">{copy.hint}</p>

        <dl className="ayarlar-kv">
          <div>
            <dt>{copy.providerLabel}</dt>
            <dd>
              {providers.length > 0
                ? providers.map(providerLabel).join(", ")
                : copy.providerUnknown}
            </dd>
          </div>
          <div>
            <dt>{copy.emailLabel}</dt>
            <dd>
              {email}
              {emailVerified && <span className="ayarlar-tag">{copy.emailVerified}</span>}
            </dd>
          </div>
        </dl>

        <h3>{copy.dataTitle}</h3>
        <p className="ayarlar-hint">
          {copy.dataBody}
          {privacyPublished && (
            <>
              {" "}
              {copy.privacyLinkPrefix}{" "}
              <Link to={copy.privacyLinkHref} className="ayarlar-link">
                {copy.privacyLinkLabel}
              </Link>
              .
            </>
          )}
        </p>
        <p>
          <a className="ayarlar-link" href={copy.dataMailHref}>
            {copy.dataMailLabel}
          </a>
        </p>
      </section>

      <DeleteAccountCard username={username} />
    </>
  );
}

function DeleteAccountCard({ username }: { username: string }) {
  const copy = useCatalog(ayarlarCatalog).account;
  const fetcher = useFetcher<DeleteActionData>();
  const [value, setValue] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const inputId = useId();
  const confirmId = useId();

  const matches = normalizeUsername(value) === username;
  const submitting = fetcher.state !== "idle";
  const ready = matches && confirmed && !submitting;
  const error = fetcher.data && !fetcher.data.ok ? fetcher.data.error : null;

  return (
    <section id="hesap-sil" className="ayarlar-card ayarlar-card-tehlike">
      <h2>{copy.deleteTitle}</h2>
      <p className="ayarlar-hint">{copy.deleteBody}</p>

      <h3>{copy.deleteConsequencesTitle}</h3>
      <ul className="ayarlar-list">
        {copy.deleteConsequences.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <fetcher.Form method="post" className="ayarlar-address-form">
        <input type="hidden" name="intent" value="hesap-sil" />
        <label className="ayarlar-field-label" htmlFor={inputId}>
          {copy.deleteFieldLabel}
        </label>
        <div className="ayarlar-field" data-invalid={(value && !matches) || undefined}>
          <span aria-hidden>caka.app/</span>
          <input
            id={inputId}
            name="confirm"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={username}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={40}
            aria-describedby={`${inputId}-hint`}
          />
        </div>
        <p className="ayarlar-hint" id={`${inputId}-hint`}>
          {copy.deleteFieldHint(username)}
        </p>

        <label className="ayarlar-confirm" htmlFor={confirmId}>
          <input
            id={confirmId}
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          <span>{copy.deleteConfirmLabel}</span>
        </label>

        <button type="submit" className="ayarlar-submit ayarlar-submit-tehlike" disabled={!ready}>
          {submitting ? copy.deleteSubmitting : copy.deleteSubmit}
        </button>
      </fetcher.Form>

      {error && (
        <p className="ayarlar-notice" data-tone="error" role="status">
          {copy.deleteErrors[error]}
        </p>
      )}
    </section>
  );
}
