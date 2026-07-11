import { useState, useEffect, useRef } from 'react';

export function useScrollSpy(headingIds, options = {}) {
  const { offset = 100, throttleMs = 100 } = options;
  const [activeId, setActiveId] = useState(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (headingIds.length === 0) return;

    const elements = headingIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (elements.length === 0) return;

    const handleIntersection = (entries) => {
      // Get all visible entries sorted by their position
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => {
          const rectA = a.boundingClientRect;
          const rectB = b.boundingClientRect;
          return Math.abs(rectA.top) - Math.abs(rectB.top);
        });

      if (visibleEntries.length > 0) {
        setActiveId(visibleEntries[0].target.id);
      } else {
        // If nothing is visible, find the closest heading above viewport
        const above = elements
          .filter((el) => el.getBoundingClientRect().top < offset)
          .sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top);

        if (above.length > 0) {
          setActiveId(above[0].id);
        }
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin: `-${offset}px 0px -40% 0px`,
      threshold: [0, 0.25, 0.5, 0.75, 1],
    });

    elements.forEach((el) => observerRef.current.observe(el));

    // Set initial active id
    const initialActive = elements.find((el) => {
      const rect = el.getBoundingClientRect();
      return rect.top >= 0 && rect.top < window.innerHeight;
    });
    if (initialActive) {
      setActiveId(initialActive.id);
    } else {
      setActiveId(elements[0]?.id || null);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [headingIds.join(',')]);

  return activeId;
}

export default useScrollSpy;
