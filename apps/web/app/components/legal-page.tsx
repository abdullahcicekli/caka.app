// KTD22: Üç hukuki sayfanın ortak kabuğu. Metin taşımaz — bölümler
// `app/content/legal/` altındaki içerik modüllerinden gelir (Değişmez #5).
//
// İki iş yapar:
//  1. Yapılandırılmış bölümleri okunur biçimde render eder (sınırlı okuma
//     genişliği, yatay kaydırılabilir tablo).
//  2. R33 placeholder kapısını işletir: doldurulmamış `[...]` alanı kalmışsa
//     prod'da sayfa 404 döner, dev/lokalde görünür uyarıyla render edilir.
import type { ReactNode } from "react";
import { Link, data } from "react-router";

import { Navbar } from "~/components/landing/navbar";
import { SiteFooter } from "~/components/landing/site-footer";
import type { SessionUser } from "~/components/user-menu";
import { landing } from "~/content/landing";
import {
  LEGAL_DOCUMENT_LIST,
  findBrokenLegalLinks,
  findLegalPlaceholders,
  findLegalSectionIssues,
  formatLegalDate,
  isSafeLegalHref,
  type LegalBlock,
  type LegalCell,
  type LegalDocumentMeta,
  type LegalInline,
  type LegalRichText,
  type LegalSection,
} from "@caka/shared";

/* ------------------------------------------------------------------ *
 * R33 — placeholder kapısı
 * ------------------------------------------------------------------ */

/**
 * Loader'da çağrılır. Ortam ayrımı için deponun zaten kullandığı Vite sinyali
 * kullanılır (`root.tsx` `import.meta.env.DEV`, `workers/app.ts`
 * `import.meta.env.MODE`); ayrı bir env değişkeni icat edilmedi.
 *
 * - **Prod build** (`import.meta.env.PROD`): doldurulmamış alan varsa 404.
 * - **Dev / lokal**: sayfa render edilir, dönen uyarı listesi `LegalPage`
 *   tarafından görünür bir kutuda gösterilir.
 *
 * Kırık iç bağlantı ve bozuk bölüm `id`'si prod'u karartmaz (metin yine de
 * okunur); yalnız dev uyarısı olarak yüzeye çıkar ve testte kırılır.
 */
export function legalPlaceholderGate(
  doc: LegalDocumentMeta,
  sections: readonly LegalSection[],
): string[] {
  const placeholders = findLegalPlaceholders(sections);

  if (placeholders.length > 0 && import.meta.env.PROD) {
    throw data({ kind: "legal_placeholder", document: doc.id }, { status: 404 });
  }

  return [
    ...placeholders.map((hit) => `Doldurulmamış alan: ${hit}`),
    ...findLegalSectionIssues(sections),
    ...findBrokenLegalLinks({ [doc.id]: sections }),
  ];
}

/* ------------------------------------------------------------------ *
 * Satır içi render
 * ------------------------------------------------------------------ */

const INLINE_LINK_CLASS =
  "font-medium text-mavi underline underline-offset-2 hover:opacity-70";

function renderInline(node: LegalInline, key: number): ReactNode {
  if (typeof node === "string") return node;
  if (node.kind === "strong") {
    return (
      <strong key={key} className="font-semibold text-murekkep">
        {node.text}
      </strong>
    );
  }

  const { href, text } = node;
  // Güvenli olmayan hedef sessizce düz metne düşer (rich-text.tsx ile aynı
  // duruş): bağlantı kaybolur ama metin okunur kalır.
  if (!isSafeLegalHref(href)) return <span key={key}>{text}</span>;

  // Uygulama içi yollar client-side gezinir; anchor ve dış hedefler düz <a>.
  if (href.startsWith("/")) {
    return (
      <Link key={key} to={href} className={INLINE_LINK_CLASS}>
        {text}
      </Link>
    );
  }
  if (href.startsWith("#")) {
    return (
      <a key={key} href={href} className={INLINE_LINK_CLASS}>
        {text}
      </a>
    );
  }
  const external = href.startsWith("http");
  return (
    <a
      key={key}
      href={href}
      className={INLINE_LINK_CLASS}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {text}
    </a>
  );
}

function renderRichText(text: LegalRichText): ReactNode[] {
  return text.map((node, index) => renderInline(node, index));
}

/* ------------------------------------------------------------------ *
 * Blok render
 * ------------------------------------------------------------------ */

// Okuma ölçüsü: uzun hukuki metin pazarlama yüzeylerinin tam genişliğinde
// okunmaz. Tablolar bu sınırın dışında kalır (kendi kaydırma kabı var).
const PROSE_CLASS = "max-w-prose text-[15px] leading-7 text-murekkep/80";

function TableBlock({
  caption,
  columns,
  rows,
}: {
  caption?: string;
  columns: readonly string[];
  rows: readonly (readonly LegalCell[])[];
}) {
  return (
    <figure className="my-1">
      {/* Depoda hazır duyarlı tablo deseni yoktu; kapsayıcı + min genişlik +
          dar ekranda görünen kaydırma ipucu bu sayfalarda standart olsun. */}
      <div className="overflow-x-auto rounded-xl border border-sinir bg-white">
        <table className="w-full min-w-[38rem] border-collapse text-left text-sm">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="border-b border-sinir px-4 py-3 font-medium text-murekkep"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-sinir last:border-b-0">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-4 py-3 align-top text-murekkep/80"
                  >
                    {renderRichText(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="mt-2 text-xs text-murekkep/50">
        <span className="sm:hidden">
          Tabloyu yana kaydırarak tamamını görebilirsin.
          {caption ? " " : null}
        </span>
        {caption}
      </figcaption>
    </figure>
  );
}

function BlockView({ block }: { block: LegalBlock }) {
  if (block.kind === "paragraph") {
    return <p className={PROSE_CLASS}>{renderRichText(block.text)}</p>;
  }

  if (block.kind === "list") {
    const items = block.items.map((item, index) => (
      <li key={index} className="pl-1">
        {renderRichText(item)}
      </li>
    ));
    return block.style === "numbered" ? (
      <ol className={`${PROSE_CLASS} list-decimal space-y-2 pl-5`}>{items}</ol>
    ) : (
      <ul className={`${PROSE_CLASS} list-disc space-y-2 pl-5`}>{items}</ul>
    );
  }

  return (
    <TableBlock
      caption={block.caption}
      columns={block.columns}
      rows={block.rows}
    />
  );
}

function SectionView({ section }: { section: LegalSection }) {
  return (
    <section className="scroll-mt-24" aria-labelledby={section.id}>
      <h2
        id={section.id}
        className="text-xl font-semibold text-murekkep sm:text-2xl"
      >
        {section.heading}
      </h2>
      {section.blocks.length > 0 ? (
        <div className="mt-4 space-y-4">
          {section.blocks.map((block, index) => (
            <BlockView key={index} block={block} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Sayfa
 * ------------------------------------------------------------------ */

function DevWarnings({ warnings }: { warnings: readonly string[] }) {
  return (
    <div
      role="alert"
      className="mt-8 rounded-xl border border-uyari bg-white p-4 text-sm text-murekkep"
    >
      <p className="font-semibold text-uyari">
        Bu belge yayına hazır değil ({warnings.length} sorun)
      </p>
      <p className="mt-1 text-murekkep/70">
        Prod build'de bu sayfa 404 döner. Uyarı yalnızca dev ve lokalde görünür.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-murekkep/80">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </div>
  );
}

function LegalDocumentNav({ currentId }: { currentId: string }) {
  const others = LEGAL_DOCUMENT_LIST.filter((doc) => doc.id !== currentId);
  return (
    <nav aria-label="Diğer hukuki belgeler" className="mt-16 border-t border-sinir pt-8">
      <p className="text-xs font-medium tracking-widest text-murekkep/40 uppercase">
        Diğer belgeler
      </p>
      <ul className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
        {others.map((doc) => (
          <li key={doc.id}>
            <Link
              to={doc.path}
              className="text-[15px] font-medium text-murekkep hover:opacity-70"
            >
              {doc.navLabel}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export type LegalPageProps = {
  document: LegalDocumentMeta;
  sections: readonly LegalSection[];
  /** `legalPlaceholderGate` çıktısı; prod'da her zaman boştur. */
  warnings?: readonly string[];
  user: SessionUser | null;
};

export function LegalPage({
  document: doc,
  sections,
  warnings = [],
  user,
}: LegalPageProps) {
  return (
    <div className="bg-zemin">
      <Navbar
        items={landing.nav.items}
        login={landing.nav.login}
        cta={landing.nav.cta}
        user={user}
      />
      <main className="mx-auto max-w-3xl px-6 pt-14 pb-24 sm:px-10 sm:pt-20">
        <h1 className="text-3xl font-semibold text-murekkep sm:text-4xl">
          {doc.title}
        </h1>
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-murekkep/60">
          <span>Son güncelleme: {formatLegalDate(doc.updatedAt)}</span>
          <span aria-hidden="true">·</span>
          <span>Sürüm {doc.version}</span>
        </p>

        {warnings.length > 0 ? <DevWarnings warnings={warnings} /> : null}

        <div className="mt-12 space-y-10">
          {sections.map((section) => (
            <SectionView key={section.id} section={section} />
          ))}
        </div>

        <LegalDocumentNav currentId={doc.id} />
      </main>
      <SiteFooter footer={landing.footer} />
    </div>
  );
}
