import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

interface P {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
}

function TB({
  onClick,
  active,
  children,
  label,
}: {
  onClick: () => void;
  active: boolean;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`p-2 rounded-lg text-sm transition-all duration-150 ${
        active
          ? "bg-primary/15 text-primary shadow-xs"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-border bg-muted/30 sticky top-0 z-10 rounded-t-xl">
      <TB
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        label="Bold"
      >
        <span className="font-bold text-sm w-4 text-center">B</span>
      </TB>
      <TB
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        label="Italic"
      >
        <span className="italic font-serif text-sm w-4 text-center">I</span>
      </TB>
      <TB
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        label="Strikethrough"
      >
        <span className="line-through text-sm w-4 text-center">S</span>
      </TB>
      <div className="w-px h-5 bg-border mx-1" />
      <TB
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
        label="H1"
      >
        <span className="text-xs font-bold">H1</span>
      </TB>
      <TB
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        label="H2"
      >
        <span className="text-xs font-bold">H2</span>
      </TB>
      <TB
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        label="H3"
      >
        <span className="text-xs font-bold">H3</span>
      </TB>
      <div className="w-px h-5 bg-border mx-1" />
      <TB
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        label="Bullet List"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
          />
        </svg>
      </TB>
      <TB
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        label="Ordered List"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5h7M9 12h7M9 19h7M3 5h.01M3 12h.01M3 19h.01"
          />
        </svg>
      </TB>
      <div className="w-px h-5 bg-border mx-1" />
      <TB
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        label="Quote"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 15.5l2.5-3.5h-2.5l1-3M11.5 15.5l2.5-3.5h-2.5l1-3"
          />
        </svg>
      </TB>
      <TB
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive("codeBlock")}
        label="Code"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      </TB>
      <div className="flex-1" />
      <TB
        onClick={() => editor.chain().focus().undo().run()}
        active={false}
        label="Undo"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4"
          />
        </svg>
      </TB>
      <TB
        onClick={() => editor.chain().focus().redo().run()}
        active={false}
        label="Redo"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 10H11a5 5 0 00-5 5v2M21 10l-4-4M21 10l-4 4"
          />
        </svg>
      </TB>
    </div>
  );
}

export default function StoryEditor({
  content,
  onChange,
  placeholder = "Write your story...",
  editable = true,
}: P) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder }),
    ],
    content: content || "",
    editable,
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-lg dark:prose-invert mx-auto max-w-3xl focus:outline-none min-h-[400px] px-6 py-4",
      },
    },
    immediatelyRender: false,
  });

  if (!editor)
    return (
      <div className="border border-input rounded-xl bg-card min-h-[400px] animate-pulse flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading editor...</p>
      </div>
    );

  return (
    <div className="border border-input rounded-xl bg-card overflow-hidden transition-all duration-200 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
      {editable && <Toolbar editor={editor} />}
      <div className="overflow-y-auto max-h-[600px]">
        <EditorContent editor={editor} />
      </div>
      <style>{`
        .tiptap p.is-editor-empty:first-child::before { color: #adb5bd; content: attr(data-placeholder); float: left; height: 0; pointer-events: none; }
        .tiptap h1 { font-size: 1.75rem; font-weight: 700; line-height: 1.3; margin-top: 1.5rem; margin-bottom: 0.5rem; }
        .tiptap h2 { font-size: 1.4rem; font-weight: 600; line-height: 1.35; margin-top: 1.25rem; margin-bottom: 0.5rem; }
        .tiptap h3 { font-size: 1.15rem; font-weight: 600; line-height: 1.4; margin-top: 1rem; margin-bottom: 0.5rem; }
        .tiptap ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .tiptap ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        .tiptap blockquote { border-left: 3px solid var(--color-primary); padding-left: 1rem; margin: 1rem 0; color: var(--color-muted-foreground); font-style: italic; }
        .tiptap code { background: var(--color-muted); border-radius: 4px; padding: 0.15rem 0.35rem; font-size: 0.875em; }
        .tiptap pre { background: #1f2937; color: #f8fafc; border-radius: 8px; padding: 1rem; margin: 1rem 0; overflow-x: auto; }
        .tiptap pre code { background: none; padding: 0; color: inherit; }
      `}</style>
    </div>
  );
}
