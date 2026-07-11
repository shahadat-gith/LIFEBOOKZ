import { useState, useEffect } from 'react';

export function useTOC(contentRef) {
  const [headings, setHeadings] = useState([]);

  useEffect(() => {
    if (!contentRef?.current) return;

    const elements = contentRef.current.querySelectorAll('h2, h3, h4');
    const items = Array.from(elements).map((el, index) => {
      // Ensure each heading has an id
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
      };
    });

    setHeadings(items);
  }, [contentRef]);

  return headings;
}

export default useTOC;
