import { useRef, useEffect, useState, useMemo } from 'react';
import { cn } from '../../utils/helpers';

export function TOC({ contentRef }) {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (!contentRef?.current) return;

    const elements = contentRef.current.querySelectorAll('h2, h3');
    const items = Array.from(elements).map((el, index) => {
      if (!el.id) {
        el.id = `heading-${index}-${el.textContent
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_]+/g, '-')
          .replace(/^-+|-+$/g, '')}`;
      }
      return {
        id: el.id,
        text: el.textContent,
        level: parseInt(el.tagName[1], 10),
        element: el,
      };
    });

    setHeadings(items);

    // Set up intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.boundingClientRect.top - a.boundingClientRect.top);

        if (visibleEntries.length > 0) {
          setActiveId(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: '-80px 0px -50% 0px',
        threshold: [0, 0.25, 0.5, 1],
      }
    );

    elements.forEach((el) => observerRef.current.observe(el));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [contentRef]);

  if (headings.length === 0) return null;

  const handleClick = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="sticky top-20 w-56 shrink-0 hidden xl:block">
      <div className="pl-4 border-l border-slate-200">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          On this page
        </h4>
        <ul className="space-y-1">
          {headings.map((heading) => (
            <li key={heading.id}>
              <button
                onClick={() => handleClick(heading.id)}
                className={cn(
                  'block text-xs text-left py-1 transition-colors hover:text-slate-900 w-full',
                  heading.level === 3 ? 'pl-3' : '',
                  activeId === heading.id
                    ? 'toc-link-active text-indigo-600 font-medium'
                    : 'text-slate-500'
                )}
              >
                {heading.text}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export default TOC;
