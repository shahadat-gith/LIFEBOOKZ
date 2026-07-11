import { useState, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn, copyToClipboard } from '../../utils/helpers';
import { HiOutlineClipboardCopy, HiOutlineCheck } from 'react-icons/hi';

export function CodeBlock({ children, code, language = '', className }) {
  const [copied, setCopied] = useState(false);

  // Support both `children` (how all pages pass it) and `code` prop
  const codeString = typeof children === 'string' ? children : (code || '');

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(codeString);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [codeString]);

  return (
    <div className={cn('codeblock-root relative group my-6', className)}>
      {/* Header bar with language label and copy button */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#282c34] border-b border-[#3e4451] rounded-t-xl">
        <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <HiOutlineCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <HiOutlineClipboardCopy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Syntax highlighted code with line wrapping */}
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        showLineNumbers={false}
        wrapLines={true}
        wrapLongLines={true}
        codeTagProps={{
          style: {
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
            fontSize: '0.875rem',
            lineHeight: '1.625',
            background: 'transparent',
          },
        }}
        customStyle={{
          margin: 0,
          padding: '1.25rem',
          background: '#1e1e1e',
          fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
          fontSize: '0.875rem',
          lineHeight: '1.625',
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: '0.75rem',
          borderBottomRightRadius: '0.75rem',
          overflowX: 'hidden',
          overflowY: 'hidden',
        }}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
}

export function InlineCode({ children, className }) {
  return (
    <code
      className={cn(
        'bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded-md text-sm font-medium font-mono',
        className
      )}
    >
      {children}
    </code>
  );
}

export default CodeBlock;
