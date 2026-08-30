// Tiptap JSON dokümanını allowlist'le React elemanlarına çevirir. HTML
// enjekte edilmez; tüm düğüm/mark tipleri burada üretildiğinden ve link
// href'leri protokol kontrolünden geçtiğinden XSS yüzeyi yoktur.
// Bilinmeyen düğümler çocuklarıyla, bilinmeyen mark'lar yok sayılarak geçilir.
//
// İki bağlam var (U4/R6): tuval blokları (`block`, varsayılan) bugünkü dar
// listeyle ve sessiz-düşme davranışıyla AYNEN kalır; yazı gövdesi (`post`)
// başlık/kod bloğu/görsel de basar. Yazı tarafında sessiz düşme kayıt anında
// `validatePostDoc` ile zaten engellenir — buradaki genişleme o izin
// listesiyle eşzamanlıdır, genişlemenin tuvale sızmaması için `block`
// bağlamında bu düğümler yine düz metne düşer.
import { postHeadingLevel, postImageAssetId } from "@caka/shared";
import type { ReactNode } from "react";

type RichMark = { type?: string; attrs?: Record<string, unknown> };

type RichNode = {
  type?: string;
  text?: string;
  content?: RichNode[];
  marks?: RichMark[];
  attrs?: Record<string, unknown>;
};

export type RichTextVariant = "block" | "post";

function safeHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function renderMarks(node: RichNode, key: number): ReactNode {
  let element: ReactNode = node.text ?? "";
  for (const mark of node.marks ?? []) {
    if (mark.type === "bold") element = <strong>{element}</strong>;
    else if (mark.type === "italic") element = <em>{element}</em>;
    else if (mark.type === "strike") element = <s>{element}</s>;
    else if (mark.type === "underline") element = <u>{element}</u>;
    else if (mark.type === "link") {
      const href = safeHref(mark.attrs?.href);
      if (href) {
        element = (
          <a href={href} target="_blank" rel="noreferrer">
            {element}
          </a>
        );
      }
    }
  }
  return <span key={key}>{element}</span>;
}

function renderNode(node: RichNode, key: number, variant: RichTextVariant): ReactNode {
  const children = (node.content ?? []).map((child, index) => renderNode(child, index, variant));
  switch (node.type) {
    case "text":
      return renderMarks(node, key);
    case "paragraph":
      return <p key={key}>{children}</p>;
    case "bulletList":
      return <ul key={key}>{children}</ul>;
    case "orderedList":
      return <ol key={key}>{children}</ol>;
    case "listItem":
      return <li key={key}>{children}</li>;
    case "blockquote":
      return <blockquote key={key}>{children}</blockquote>;
    case "hardBreak":
      return <br key={key} />;
    // Yazıya özel düğümler: `block` bağlamında default'a düşüp bugünkü
    // sessiz düz-metin davranışını korurlar (tuvale sızma yok).
    case "heading": {
      if (variant !== "post") break;
      // h1 sayfa başlığına ayrılmış; eşleme deterministik (1-2→h2, 3+→h3).
      return postHeadingLevel(node.attrs?.level) === 2 ? (
        <h2 key={key}>{children}</h2>
      ) : (
        <h3 key={key}>{children}</h3>
      );
    }
    case "codeBlock":
      if (variant !== "post") break;
      return (
        <pre key={key}>
          <code>{children}</code>
        </pre>
      );
    case "image": {
      if (variant !== "post") break;
      // Savunma katmanı: kayıt `validatePostDoc` ile zaten reddediyor; yine
      // de yalnız birinci taraf `/i/<uuid>` deseni basılır (R9). Desen dışı
      // düğüm hiç render edilmez — üçüncü taraf istek atılmaz.
      const assetId = postImageAssetId(node.attrs?.src);
      if (!assetId) return null;
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      return <img key={key} src={`/i/${assetId}`} alt={alt} loading="lazy" />;
    }
  }
  return <span key={key}>{children}</span>;
}

export function RichTextView({ doc, variant = "block" }: { doc: unknown; variant?: RichTextVariant }) {
  const root = doc as RichNode | null | undefined;
  if (!root || typeof root !== "object" || !Array.isArray(root.content)) return null;
  return (
    <div className="rich-text">
      {root.content.map((node, index) => renderNode(node, index, variant))}
    </div>
  );
}
