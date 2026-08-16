// Tiptap JSON dokümanını allowlist'le React elemanlarına çevirir. HTML
// enjekte edilmez; tüm düğüm/mark tipleri burada üretildiğinden ve link
// href'leri protokol kontrolünden geçtiğinden XSS yüzeyi yoktur.
// Bilinmeyen düğümler çocuklarıyla, bilinmeyen mark'lar yok sayılarak geçilir.
import type { ReactNode } from "react";

type RichMark = { type?: string; attrs?: Record<string, unknown> };

type RichNode = {
  type?: string;
  text?: string;
  content?: RichNode[];
  marks?: RichMark[];
};

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

function renderNode(node: RichNode, key: number): ReactNode {
  const children = (node.content ?? []).map((child, index) => renderNode(child, index));
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
    default:
      return <span key={key}>{children}</span>;
  }
}

export function RichTextView({ doc }: { doc: unknown }) {
  const root = doc as RichNode | null | undefined;
  if (!root || typeof root !== "object" || !Array.isArray(root.content)) return null;
  return <div className="rich-text">{root.content.map((node, index) => renderNode(node, index))}</div>;
}
