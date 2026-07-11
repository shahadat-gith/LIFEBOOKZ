import { useEffect, useState } from 'react';
import { initMermaid } from '../../lib/mermaid';

export function Mermaid({ chart, caption }) {
  const [svg, setSvg] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      if (!chart) return;
      setSvg(null);
      setError(null);

      try {
        await initMermaid();
        if (cancelled) return;

        const mermaid = (await import('mermaid')).default;
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const { svg: renderedSvg } = await mermaid.render(id, chart);

        if (!cancelled) {
          // Inject styles to make the SVG scale to container width
          const scaledSvg = renderedSvg.replace(
            '<svg ',
            '<svg style="max-width:100%;height:auto;width:100%;" '
          );
          setSvg(scaledSvg);
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
        if (!cancelled) {
          setError(err.message || 'Failed to render diagram');
        }
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [chart]);

  return (
    <div className="my-8">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto p-4 md:p-8 flex justify-center">
        {error ? (
          <div className="text-red-500 p-4 bg-red-50 rounded-lg text-sm w-full">
            Failed to render diagram: {error}
          </div>
        ) : svg ? (
          <div
            className="mermaid-svg-wrapper w-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <pre className="mermaid-placeholder text-slate-300 text-sm font-mono whitespace-pre-wrap w-full">
            {chart}
          </pre>
        )}
      </div>
      {caption && (
        <p className="mt-3 text-center text-sm text-slate-500">{caption}</p>
      )}
    </div>
  );
}

export default Mermaid;
