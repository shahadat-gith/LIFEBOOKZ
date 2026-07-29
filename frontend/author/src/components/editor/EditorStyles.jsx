export default function EditorStyles() {
  return (
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
      figure { margin: 1.5rem 0; }
      figure img { border-radius: 0.75rem; max-width: 100%; height: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
      figcaption { margin-top: 0.5rem; padding: 0.25rem 0; font-size: 0.875rem; color: var(--color-muted-foreground); font-style: italic; text-align: center; min-height: 1.5em; }
    `}</style>
  );
}
