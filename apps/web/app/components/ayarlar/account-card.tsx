// Ayarlar → Hesap: salt okunur giriş bilgisi + KVKK m.11 başvuru yolu.
//
// Gizlilik Metni bağlantısı YALNIZCA belge yayındayken çıkar (R33 kapısı):
// yayında olmayan belge prod'da 404 verir, koşulsuz bağlantı ölü olurdu.
// SiteFooter ve FaqSection aynı kuralı uygular; `publishedLegal` loader'dan gelir.
import { Link } from "react-router";

import { ayarlarCatalog, providerLabel } from "~/content/ayarlar";
import { useCatalog } from "~/lib/locale";
import type { LegalDocumentId } from "@caka/shared";

export function AccountCard({
  providers,
  email,
  emailVerified,
  publishedLegal,
}: {
  providers: string[];
  email: string;
  emailVerified: boolean;
  publishedLegal: readonly LegalDocumentId[];
}) {
  const copy = useCatalog(ayarlarCatalog).account;
  const privacyPublished = publishedLegal.includes("gizlilik");

  return (
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
  );
}
