import { useMemo } from "react";
import DOMPurify from "dompurify";

/* ───────────────────────────────────────────────
   TipTap / ProseMirror Node & Mark Renderer
   Renders the editor JSON output without needing
   the full @tiptap/react bundle.
   ─────────────────────────────────────────────── */

/* ---------- Marks ---------- */

function renderMarks(text, marks = []) {
  let element = text;

  for (const mark of marks) {
    switch (mark.type) {
      case "bold":
        element = <strong key={mark.type}>{element}</strong>;
        break;
      case "italic":
        element = <em key={mark.type}>{element}</em>;
        break;
      case "strike":
        element = <s key={mark.type}>{element}</s>;
        break;
      case "code":
        element = <code key={mark.type}>{element}</code>;
        break;
      case "underline":
        element = <u key={mark.type}>{element}</u>;
        break;
      case "link":
        element = (
          <a
            key={mark.type}
            href={mark.attrs?.href || "#"}
            target={mark.attrs?.target || "_blank"}
            rel="noopener noreferrer"
            className="text-accent underline underline-offset-2 hover:text-accent/80 transition-colors"
          >
            {element}
          </a>
        );
        break;
      case "subscript":
        element = <sub key={mark.type}>{element}</sub>;
        break;
      case "superscript":
        element = <sup key={mark.type}>{element}</sup>;
        break;
      default:
        break;
    }
  }

  return element;
}

/* ---------- Node Renderer ---------- */

function renderNode(node, index) {
  if (!node) return null;

  switch (node.type) {
    /* ─── Root ─── */
    case "doc":
      return (
        <div key={index} className="prose prose-lg dark:prose-invert max-w-none">
          {(node.content || []).map((child, i) => renderNode(child, i))}
        </div>
      );

    /* ─── Text ─── */
    case "text":
      if (typeof node.text !== "string") return null;
      return (
        <span key={index}>
          {renderMarks(node.text, node.marks || [])}
        </span>
      );

    /* ─── Headings ─── */
    case "heading": {
      const level = node.attrs?.level || 1;
      const Tag = `h${Math.min(Math.max(level, 1), 6)}`;
      const sizeClasses = {
        1: "text-3xl sm:text-4xl font-bold mt-10 mb-4 leading-tight",
        2: "text-2xl sm:text-3xl font-semibold mt-8 mb-3 leading-snug",
        3: "text-xl sm:text-2xl font-semibold mt-6 mb-2 leading-snug",
        4: "text-lg sm:text-xl font-medium mt-5 mb-2",
        5: "text-base sm:text-lg font-medium mt-4 mb-1",
        6: "text-sm sm:text-base font-medium mt-3 mb-1 text-muted-foreground",
      };
      return (
        <Tag key={index} className={`${sizeClasses[level] || sizeClasses[1]} text-foreground font-display tracking-tight`}>
          {(node.content || []).map((child, i) => renderNode(child, i))}
        </Tag>
      );
    }

    /* ─── Paragraph ─── */
    case "paragraph":
      return (
        <p key={index} className="text-base sm:text-lg leading-relaxed text-foreground/90 mb-5 last:mb-0">
          {(node.content || []).map((child, i) => renderNode(child, i))}
        </p>
      );

    /* ─── Lists ─── */
    case "bulletList":
      return (
        <ul key={index} className="list-disc pl-6 sm:pl-8 mb-5 space-y-1.5 text-foreground/90">
          {(node.content || []).map((child, i) => renderNode(child, i))}
        </ul>
      );

    case "orderedList":
      return (
        <ol key={index} className="list-decimal pl-6 sm:pl-8 mb-5 space-y-1.5 text-foreground/90">
          {(node.content || []).map((child, i) => renderNode(child, i))}
        </ol>
      );

    case "listItem":
      return (
        <li key={index} className="text-base sm:text-lg leading-relaxed pl-1 marker:text-foreground/40">
          {(node.content || []).map((child, i) => renderNode(child, i))}
        </li>
      );

    /* ─── Blockquote ─── */
    case "blockquote":
      return (
        <blockquote
          key={index}
          className="border-l-4 border-primary/40 pl-5 sm:pl-6 py-1 my-6 text-muted-foreground italic leading-relaxed bg-muted/20 rounded-r-xl"
        >
          {(node.content || []).map((child, i) => renderNode(child, i))}
        </blockquote>
      );

    /* ─── Code Block ─── */
    case "codeBlock":
      return (
        <pre
          key={index}
          className="bg-[#1f2937] dark:bg-muted text-[#f8fafc] dark:text-foreground rounded-xl p-4 sm:p-5 my-6 overflow-x-auto text-sm leading-relaxed shadow-md"
        >
          <code className="block font-mono">
            {(node.content || []).map((child, i) => renderNode(child, i))}
          </code>
        </pre>
      );

    /* ─── Horizontal Rule ─── */
    case "horizontalRule":
      return (
        <hr key={index} className="my-8 border-border/40" />
      );

    /* ─── Hard Break ─── */
    case "hardBreak":
      return <br key={index} />;

    /* ─── Image ─── */
    case "image":
      return (
        <figure key={index} className="my-8 mx-auto text-center not-prose">
          <img
            src={node.attrs?.src || ""}
            alt={node.attrs?.alt || ""}
            title={node.attrs?.title || ""}
            className="rounded-xl max-w-full h-auto mx-auto shadow-lg"
            loading="lazy"
          />
          {node.attrs?.alt && (
            <figcaption className="mt-2 text-sm text-muted-foreground italic">
              {node.attrs.alt}
            </figcaption>
          )}
        </figure>
      );

    /* ─── Figure (custom wrapper) ─── */
    case "figure":
      return (
        <figure key={index} className="my-8 mx-auto text-center not-prose">
          {(node.content || []).map((child, i) => renderNode(child, i))}
        </figure>
      );

    /* ─── Unknown / fallback ─── */
    default:
      // Attempt to render children anyway
      if (Array.isArray(node.content)) {
        return (
          <span key={index}>
            {(node.content || []).map((child, i) => renderNode(child, i))}
          </span>
        );
      }
      return null;
  }
}

/* ---------- Main Component ---------- */

/**
 * TipTapReader — Renders a TipTap/ProseMirror JSON document or HTML string.
 *
 * Props:
 *   document  - TipTap JSON object (from editor.getJSON()) OR an HTML string
 *   className - Optional additional wrapper class name
 */
export default function TipTapReader({ document, className = "" }) {
  const rendered = useMemo(() => {
    if (!document) return null;

    // String — treat as HTML, sanitize and render
    if (typeof document === "string") {
      const sanitized = DOMPurify.sanitize(document);
      return (
        <div
          className={`prose prose-lg dark:prose-invert max-w-none text-foreground/90 leading-relaxed ${className}`}
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />
      );
    }

    // Object — TipTap/ProseMirror JSON node tree
    if (typeof document === "object") {
      return (
        <div className={`${className}`}>
          {(document.content || []).map((node, i) => renderNode(node, i))}
        </div>
      );
    }

    return null;
  }, [document, className]);

  return rendered;
}

/**
 * extractTextFromDocument — Extracts plain text from a TipTap document
 * (string HTML or ProseMirror JSON). Useful for snippet previews.
 *
 * @param {*} doc - The document (string HTML or TipTap JSON object)
 * @param {number} [maxLength] - Optional max length; text is truncated and "..." appended
 * @returns {string} Plain text content
 */
export function extractTextFromDocument(doc, maxLength) {
  if (!doc) return "";

  let text = "";

  // String HTML
  if (typeof doc === "string") {
    text = doc
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // TipTap JSON object
  else if (typeof doc === "object") {
    text = extractTextFromNode(doc).trim();
  }

  else {
    text = String(doc).trim();
  }

  if (maxLength && text.length > maxLength) {
    return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "...";
  }

  return text;
}

function extractTextFromNode(node) {
  if (!node) return "";

  if (node.type === "text" && typeof node.text === "string") {
    return node.text;
  }

  if (Array.isArray(node.content)) {
    return node.content.map(extractTextFromNode).filter(Boolean).join(" ");
  }

  return "";
}
