let mermaidInitialized = false;

export async function initMermaid() {
  if (mermaidInitialized) return;

  try {
    const mermaid = (await import('mermaid')).default;
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      themeVariables: {
        primaryColor: '#6366f1',
        primaryTextColor: '#1e293b',
        primaryBorderColor: '#a5b4fc',
        lineColor: '#94a3b8',
        secondaryColor: '#f1f5f9',
        tertiaryColor: '#eef2ff',
        fontSize: '14px',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
        padding: 20,
      },
      sequence: {
        useMaxWidth: true,
        showSequenceNumbers: true,
      },
      gantt: {
        useMaxWidth: true,
      },
    });
    mermaidInitialized = true;
  } catch (error) {
    console.error('Failed to initialize Mermaid:', error);
  }
}
