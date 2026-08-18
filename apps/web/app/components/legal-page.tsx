// KTD22: Üç hukuki sayfanın ortak kabuğu. Metin taşımaz — bölümler
// `app/content/legal/` altındaki içerik modüllerinden gelir (Değişmez #5).
//
// Yalnızca render eder: yapılandırılmış bölümleri okunur biçimde gösterir
// (sınırlı okuma genişliği, yatay kaydırılabilir tablo). R33 yayın kapısı
// sunucu tarafındadır (`server/legal.ts`) ve loader'dan çağrılır.
import { createContext, useContext, type ReactNode } from "react";
import { Link } from "react-router";

import { Navbar } from "~/components/landing/navbar";
import { SiteFooter } from "~/components/landing/site-footer";
import type { SessionUser } from "~/components/user-menu";
import { landingCatalog } from "~/content/landing";
import { legalChromeCatalog } from "~/content/legal/chrome";
import {
  legalBindingNotice,
  legalTitles,
  legalTurkishVersionLabel,
} from "~/content/legal/meta";
import { useCatalog, useLocale } from "~/lib/locale";
import {
  LEGAL_DOCUMENTS,
  formatDate,
  isSafeLegalHref,
  type LegalBlock,
  type LegalCell,
  type LegalDocumentId,
  type LegalDocumentMeta,
  type LegalInline,
  type LegalRichText,
  LEGAL_DOCUMENT_IDS,
  pathFor,
  type LegalSection,
} from "@caka/shared";

/* ------------------------------------------------------------------ *
 * Satır içi render
 * ------------------------------------------------------------------ */

const INLINE_LINK_CLASS =
  "font-medium text-mavi underline underline-offset-2 hover:opacity-70";

/**
 * `/gizlilik#bolum` → `gizlilik`; hukuki belge değilse `undefined`.
 *
 * Anahtar TÜRKÇE yoldur, çünkü katalog ve hukuki metinler bağlantıları Türkçe
 * hâliyle yazar (`localizeHref` render'da çevirir). Dil önekli bir yol burada
 * aranmaz.
 */
const LEGAL_PATH_TO_ID = new Map<string, LegalDocumentId>(
  LEGAL_DOCUMENT_IDS.map((id) => [pathFor(id, "tr"), id]),
);

/**
 * Yayındaki hukuki belgeler. Satır içi bağlantı bu listeyi okur: kapı (R33)
 * doldurulmamış belgeyi prod'da 404'lediği için metnin içinden ona link
 * vermek ziyaretçiyi ölü sayfaya gönderirdi. Context kullanılıyor çünkü
 * karar satır içi render'da veriliyor; blok katmanlarının bu veriyi
 * taşıması gereksiz gürültü olurdu.
 */
const PublishedLegalContext = createContext<readonly LegalDocumentId[]>([]);

/** Hedef hukuki bir belgeyse ve yayında değilse bağlantı kurulmaz. */
function isDeadLegalTarget(
  href: string,
  published: readonly LegalDocumentId[],
): boolean {
  const targetId = LEGAL_PATH_TO_ID.get(href.split("#")[0]);
  return targetId !== undefined && !published.includes(targetId);
}

function renderInline(
  node: LegalInline,
  key: number,
  published: readonly LegalDocumentId[],
): ReactNode {
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
  // Yayında olmayan hukuki belge de aynı şekilde düşer; cümle okunur kalır.
  if (isDeadLegalTarget(href, published)) return <span key={key}>{text}</span>;

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

function renderRichText(
  text: LegalRichText,
  published: readonly LegalDocumentId[],
): ReactNode[] {
  return text.map((node, index) => renderInline(node, index, published));
}

/** Blok bileşenleri yayın listesini context'ten alır; prop zinciri yok. */
function useRichText() {
  const published = useContext(PublishedLegalContext);
  return (text: LegalRichText) => renderRichText(text, published);
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
  const richText = useRichText();
  const chrome = useCatalog(legalChromeCatalog);
  return (
    <figure className="my-1">
      {/* Depoda hazır duyarlı tablo deseni yoktu; kapsayıcı + min genişlik +
          dar ekranda görünen kaydırma ipucu bu sayfalarda standart olsun. */}
      <div className="overflow-x-auto rounded-xl border border-sinir bg-white">
        <table className="w-full min-w-152 border-collapse text-left text-sm">
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
                    {richText(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="mt-2 text-xs text-murekkep/50">
        <span className="sm:hidden">
          {chrome.tableScrollHint}
          {caption ? " " : null}
        </span>
        {caption}
      </figcaption>
    </figure>
  );
}

function BlockView({ block }: { block: LegalBlock }) {
  const richText = useRichText();
  if (block.kind === "paragraph") {
    return <p className={PROSE_CLASS}>{richText(block.text)}</p>;
  }

  if (block.kind === "list") {
    const items = block.items.map((item, index) => (
      <li key={index} className="pl-1">
        {richText(item)}
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

/**
 * Belgeler arası şerit. Yalnız **yayındaki** belgeleri listeler: kapının
 * prod'da 404 verdiği bir belgeye buradan bağlanmak ölü bağlantı üretirdi.
 * Liste `loaderData` ile gelir (bkz. `app/content/legal/index.ts`).
 */
function LegalDocumentNav({
  currentId,
  publishedLegal,
}: {
  currentId: LegalDocumentId;
  publishedLegal: readonly LegalDocumentId[];
}) {
  const locale = useLocale();
  const chrome = useCatalog(legalChromeCatalog);
  const others = publishedLegal.filter((id) => id !== currentId);
  if (others.length === 0) return null;

  return (
    <nav aria-label={chrome.otherDocumentsLabel} className="mt-16 border-t border-sinir pt-8">
      <p className="text-xs font-medium tracking-widest text-murekkep/40 uppercase">
        {chrome.otherDocuments}
      </p>
      <ul className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
        {others.map((id) => (
          <li key={id}>
            <Link
              to={pathFor(id, locale)}
              className="text-[15px] font-medium text-murekkep hover:opacity-70"
            >
              {legalTitles(locale, id).navLabel}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export type LegalPageProps = {
  document: LegalDocumentMeta;
  /** Belgenin o dildeki başlığı ve şerit etiketi. */
  titles: { title: string; navLabel: string };
  sections: readonly LegalSection[];
  /** `legalPlaceholderGate` çıktısı; prod'da her zaman boştur. */
  warnings?: readonly string[];
  /** Yayındaki hukuki belgeler; footer ve belgeler arası şerit bunu reklam eder. */
  publishedLegal: readonly LegalDocumentId[];
  user: SessionUser | null;
};

export function LegalPage({
  document: doc,
  sections,
  warnings = [],
  publishedLegal,
  user,
  titles,
}: LegalPageProps) {
  const landing = useCatalog(landingCatalog);
  const locale = useLocale();
  const chrome = useCatalog(legalChromeCatalog);
  const bindingNotice = legalBindingNotice(locale);
  return (
    <div className="bg-zemin">
      <Navbar
        login={landing.nav.login}
        cta={landing.nav.cta}
        user={user}
      />
      <main className="mx-auto max-w-3xl px-6 pt-14 pb-24 sm:px-10 sm:pt-20">
        <h1 className="text-3xl font-semibold text-murekkep sm:text-4xl">
          {titles.title}
        </h1>
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-murekkep/60">
          <span>
            {chrome.updatedAt}: {formatDate(doc.updatedAt, locale)}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {chrome.version} {doc.version}
          </span>
        </p>

        {/* L11 — bağlayıcılık şeridi. Türkçe sayfada görünmez: o zaten
            bağlayıcı olan metnin kendisi. Diğer dillerde okuyucuya hangi
            metnin geçerli olduğunu söyler ve Türkçe sürüme bağlanır. */}
        {bindingNotice ? (
          <p className="mt-6 rounded-xl border border-sinir bg-white px-4 py-3 text-sm text-murekkep/70">
            {bindingNotice}{" "}
            <Link
              to={pathFor(doc.id, "tr")}
              className="font-medium text-mavi underline underline-offset-2 hover:opacity-70"
            >
              {legalTurkishVersionLabel(locale)}
            </Link>
          </p>
        ) : null}

        {warnings.length > 0 ? <DevWarnings warnings={warnings} /> : null}

        {/* Metnin içindeki hukuki bağlantılar da yayın listesine uyar: kapı
            yayınlanmamış belgeyi 404'lerken gövdeden ona link vermek
            ziyaretçiyi ölü sayfaya gönderirdi. */}
        <PublishedLegalContext value={publishedLegal}>
          <div className="mt-12 space-y-10">
            {sections.map((section) => (
              <SectionView key={section.id} section={section} />
            ))}
          </div>
        </PublishedLegalContext>

        <LegalDocumentNav currentId={doc.id} publishedLegal={publishedLegal} />
      </main>
      <SiteFooter footer={landing.footer} publishedLegal={publishedLegal} />
    </div>
  );
}
