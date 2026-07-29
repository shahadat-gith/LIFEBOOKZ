import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

import EditorToolbar from "./EditorToolbar";
import EditorStyles from "./EditorStyles";

export default function StoryEditor({
  content,
  onChange,
  placeholder = "Write your story...",
  editable = true,
  onImageUploadEnd,
}) {
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

  if (!editor) {
    return (
      <div className="border border-input rounded-xl bg-card min-h-[400px] animate-pulse flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="border border-input rounded-xl bg-card overflow-hidden transition-all duration-200 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
      {editable && <EditorToolbar editor={editor} onImageUploadEnd={onImageUploadEnd} />}
      <div className="overflow-y-auto max-h-[600px]">
        <EditorContent editor={editor} />
      </div>
      <EditorStyles />
    </div>
  );
}