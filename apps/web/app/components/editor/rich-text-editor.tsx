// Metin bloğu tuval içinde düzenlenir: kart görünümü korunur, Tiptap
// doğrudan bloğun içine mount edilir, biçimlendirme araç çubuğu bloğun
// altında yüzer. Çıktı Tiptap JSON'u olarak bloğa yazılır; public render
// allowlist'li RichTextView ile yapılır.
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, Node, useEditor } from "@tiptap/react";
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

/**
 * Zengin metin uzantılarını bağlama göre kurar (U4/R6).
 *
 * - `block` (tuval blokları): bugünkü dar küme — heading/codeBlock kapalı;
 *   davranış DEĞİŞMEDİ.
 * - `post` (yazı gövdesi): heading (yalnız 2-3; h1 sayfa başlığına ayrılmış,
 *   render eşlemesi `postHeadingLevel`) ve codeBlock açık. Görsel ekleme
 *   UI'si U7'nin işi; şema (`validatePostDoc`) ve render (`RichTextView
 *   variant="post"`) zemini hazır.
 *
 * Editörün üretebildiği her düğüm render izin listesinde olmalı (R6) —
 * burada bir tip açılıyorsa `rich-text.tsx` ve `validatePostDoc` ile
 * EŞZAMANLI açılır; tek taraflı genişletme sessiz düz-metin düşüşü üretir.
 */
/**
 * Yazı gövdesinin görsel düğümü (U7/R9). `@tiptap/extension-image` bilinçli
 * eklenmedi: ihtiyaç yalnız `src`/`alt` taşıyan atomik bir blok, paket ise
 * base64/inline gibi burada istemediğimiz yetenekler getirir. Düğüm adı ve
 * öznitelikler `validatePostDoc` izin listesi ve `RichTextView` render'ıyla
 * eşzamanlıdır (R6) — `src` her kayıtta sunucuda birinci taraf desenine
 * (`/i/<assetId>`) karşı denetlenir.
 */
const PostImage = Node.create({
  name: "image",
  group: "block",
  atom: true,
  addAttributes() {
    return { src: { default: null }, alt: { default: "" } };
  },
  parseHTML() {
    return [
      {
        tag: "img[src]",
        // Yapıştırılan HTML'deki DIŞ görseller düğüm OLMAZ: sunucu birinci
        // taraf dışını her kayıtta reddettiği için (validatePostDoc), dış
        // src'li tek bir yapıştırma tüm autosave'i kalıcı 400'e sokar ve
        // kullanıcı sebebini göremezdi. Kaynağı editörde ayıklamak, bozuk
        // dokümanı hiç üretmemek demek — düğüm sessizce düz metne düşer.
        getAttrs: (element) => {
          const src = (element as HTMLElement).getAttribute("src") ?? "";
          return /^\/i\/[0-9a-f-]+$/i.test(src) ? null : false;
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["img", HTMLAttributes];
  },
});

export function richTextExtensions(context: "block" | "post", placeholder: string) {
  return [
    ...(context === "post" ? [PostImage] : []),
    StarterKit.configure({
      heading: context === "post" ? { levels: [2, 3] } : false,
      codeBlock: context === "post" ? {} : false,
      code: false,
      horizontalRule: false,
      link: { openOnClick: false, autolink: true },
    }),
    // Gerçek placeholder: boşken görünür, ilk karakterde kaybolur. İçerik
    // olarak örnek metin YAZILMAZ (yoksa yazının başında kalır).
    Placeholder.configure({ placeholder }),
  ];
}

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
    // Tuval blokları `block` bağlamında kalır: heading/codeBlock kapalı.
    extensions: richTextExtensions(
      "block",
      variant === "status" ? rt.statusPlaceholder : rt.placeholder,
    ),
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
    { label: rt.bulletList, icon: List, active: editor.isActive("bulletList"), run: () => editor.chain().focus().toggleBulletList().run() },
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
        <button type="button" aria-label={app.editor.doneAria} data-tooltip={app.editor.doneAria} onClick={onClose}>
          <Check width={15} height={15} />
        </button>
      </div>
    </article>
  );
}
