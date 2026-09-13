import { useRef, useState } from "react";
import { Icons } from "../../icons";
import { WizardShell } from "./WizardShell";
import { PrimaryButton } from "./wizardShared";

const TOOLBAR = [
  { key: "bold", label: "B", title: "Bold", className: "font-bold" },
  { key: "italic", label: "I", title: "Italic", className: "italic font-serif" },
  { key: "underline", label: "U", title: "Underline", className: "underline" },
  { key: "bullet", label: "•≡", title: "Bullet list", className: "" },
  { key: "numbered", label: "1≡", title: "Numbered list", className: "" },
];

export default function WriteStoryStep({
  story,
  onChange,
  onContinue,
  onBack,
}) {
  const textareaRef = useRef(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const words = (story.content || "").trim()
    ? (story.content || "").trim().split(/\s+/).length
    : 0;

  function pushUndo(prev) {
    setUndoStack((s) => [...s.slice(-49), prev]);
    setRedoStack([]);
  }

  function handleChange(e) {
    pushUndo(story.content || "");
    onChange({ ...story, content: e.target.value });
  }

  function handleUndo() {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setRedoStack((s) => [...s, story.content || ""]);
    onChange({ ...story, content: prev });
  }

  function handleRedo() {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((s) => s.slice(0, -1));
    setUndoStack((s) => [...s, story.content || ""]);
    onChange({ ...story, content: next });
  }

  function applyFormat(kind) {
    const ta = textareaRef.current;
    if (!ta) return;

    const { selectionStart: start, selectionEnd: end } = ta;
    const text = story.content || "";
    const sel = text.slice(start, end);
    let next = text;
    let cursor = end;

    if (kind === "bold") {
      next = text.slice(0, start) + `*${sel}*` + text.slice(end);
      cursor = end + 2;
    } else if (kind === "italic") {
      next = text.slice(0, start) + `_${sel}_` + text.slice(end);
      cursor = end + 2;
    } else if (kind === "underline") {
      next = text.slice(0, start) + `~${sel}~` + text.slice(end);
      cursor = end + 2;
    } else if (kind === "bullet") {
      next = text.slice(0, start) + `\n• ${sel}` + text.slice(end);
      cursor = end + 3;
    } else if (kind === "numbered") {
      next = text.slice(0, start) + `\n1. ${sel}` + text.slice(end);
      cursor = end + 4;
    }

    pushUndo(text);
    onChange({ ...story, content: next });

    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <WizardShell step={4} totalSteps={10} title="Write Your Story" onBack={onBack}>
      <p className="text-center text-sm text-muted-foreground mb-5">
        Take your time. Write from your heart.
      </p>

      <div className="rounded-2xl border border-border/70 bg-card shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-1 border-b border-border/60 px-3 py-2">
          {TOOLBAR.map((t) => (
            <button
              key={t.key}
              type="button"
              title={t.title}
              onClick={() => applyFormat(t.key)}
              className={`w-8 h-8 rounded-lg text-sm text-foreground hover:bg-muted transition-colors ${t.className}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Writing area */}
        <textarea
          ref={textareaRef}
          value={story.content || ""}
          onChange={handleChange}
          placeholder="Write your story here…"
          rows={12}
          maxLength={50000}
          className="w-full bg-transparent px-5 py-4 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none resize-y min-h-[260px]"
        />

        {/* Footer: word count + undo/redo/fullscreen-ish */}
        <div className="flex items-center justify-between border-t border-border/60 px-4 py-2.5">
          <span className="text-xs text-muted-foreground">{words} words</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              title="Undo"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30"
            >
              <Icons.refresh className="h-4 w-4 rotate-90 [transform:scaleX(-1)]" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              title="Redo"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30"
            >
              <Icons.refresh className="h-4 w-4 rotate-90" />
            </button>
            <span
              title="Focus mode"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground/40"
            >
              <Icons.chevronDown className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <PrimaryButton onClick={onContinue} disabled={words === 0}>
          Save &amp; Continue
        </PrimaryButton>
      </div>
    </WizardShell>
  );
}
