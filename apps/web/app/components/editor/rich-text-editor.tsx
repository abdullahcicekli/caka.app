// Metin bloğu tuval içinde düzenlenir: kart görünümü korunur, Tiptap
// doğrudan bloğun içine mount edilir, biçimlendirme araç çubuğu bloğun
// altında yüzer. Çıktı Tiptap JSON'u olarak bloğa yazılır; public render
// allowlist'li RichTextView ile yapılır.
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Check,
  Italic,
  Link as LinkIcon,
  List,
  NumberedListLeft,
  Quote,
} from "iconoir-react";
import { appCatalog } from "~/content/app";
import { useCatalog } from "~/lib/locale";

// Legacy düz metni Tiptap dokümanına çevirir (HTML olarak parse ETMEDEN).
function docFromPlainText(text: string) {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: text ? [{ type: "text", text }] : [],
      },
    ],
  };
}

export function InlineTextEditor({
  variant = "text",
  doc,
  fallbackText,
  onChange,
  onClose,
}: {
  /** Kart görünümü: metin bloğu ya da duyuru bloğu stilinde. */
  variant?: "text" | "status";
  doc: unknown;
  fallbackText: string;
  onChange: (doc: unknown, plain: string) => void;
  onClose: () => void;
}) {
  const app = useCatalog(appCatalog);
  const rt = app.editor.richText;
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    autofocus: "end",
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        link: { openOnClick: false, autolink: true },
      }),
      // Gerçek placeholder: boşken görünür, ilk karakterde kaybolur. Blok
      // içeriği olarak örnek metin YAZILMAZ (yoksa yazının başında kalır).
      Placeholder.configure({
        placeholder: variant === "status" ? "Duyurunu yaz…" : rt.placeholder,
      }),
    ],
    content: (doc as object) ?? docFromPlainText(fallbackText),
    onUpdate: ({ editor: instance }) => onChange(instance.getJSON(), instance.getText()),
    editorProps: {
      handleKeyDown: (_view, event) => {
        if (event.key === "Escape") {
          onClose();
          return true;
        }
        return false;
      },
    },
  });

  if (!editor) return null;

  function setLink() {
    if (!editor) return;
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const href = window.prompt(rt.linkUrl);
    if (!href) return;
    const url = /^[a-z][a-z\d+.-]*:/i.test(href) ? href : `https://${href}`;
    editor.chain().focus().setLink({ href: url }).run();
  }

  const tools = [
    { label: rt.bold, icon: Bold, active: editor.isActive("bold"), run: () => editor.chain().focus().toggleBold().run() },
    { label: rt.italic, icon: Italic, active: editor.isActive("italic"), run: () => editor.chain().focus().toggleItalic().run() },
    { label: "Liste", icon: List, active: editor.isActive("bulletList"), run: () => editor.chain().focus().toggleBulletList().run() },
    { label: rt.orderedList, icon: NumberedListLeft, active: editor.isActive("orderedList"), run: () => editor.chain().focus().toggleOrderedList().run() },
    { label: rt.quote, icon: Quote, active: editor.isActive("blockquote"), run: () => editor.chain().focus().toggleBlockquote().run() },
    { label: rt.link, icon: LinkIcon, active: editor.isActive("link"), run: setLink },
  ];

  return (
    <article className={`profile-block profile-block-${variant} rich-editor-inline`}>
      <EditorContent editor={editor} className="rich-editor-content" />
      <div
        className="inline-text-toolbar"
        role="toolbar"
        aria-label={rt.toolbarLabel}
        onClick={(event) => event.stopPropagation()}
      >
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            aria-label={tool.label}
            data-tooltip={tool.label}
            className={tool.active ? "is-active" : ""}
            onMouseDown={(event) => event.preventDefault()}
            onClick={tool.run}
          >
            <tool.icon width={15} height={15} />
          </button>
        ))}
        <span className="sep" aria-hidden />
        <button type="button" aria-label={app.editor.doneAria} data-tooltip="Bitti" onClick={onClose}>
          <Check width={15} height={15} />
        </button>
      </div>
    </article>
  );
}
