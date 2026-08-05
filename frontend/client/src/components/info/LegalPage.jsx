/**
 * Renders a single content block inside a legal page section.
 * Supported block types: "p" (paragraph), "h3" (sub-heading), "list" (bullet list).
 */
function Block({ block }) {
  switch (block.type) {
    case "p":
      return (
        <p className="mt-4 text-[15px] leading-7 text-muted-foreground">
          {block.text}
        </p>
      );
    case "h3":
      return (
        <h3 className="mt-8 font-display text-base font-semibold text-foreground">
          {block.text}
        </h3>
      );
    case "list":
      return (
        <ul className="mt-4 space-y-3">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="flex gap-3 text-[15px] leading-7 text-muted-foreground"
            >
              <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    default:
      return null;
  }
}

/**
 * Shared layout for legal & policy pages (Privacy, Terms, Content Policy).
 * Expects a `sections` array shaped as:
 * [{ title: string, blocks: [{ type: "p"|"h3"|"list", ... }] }]
 */
export function LegalPage({ eyebrow, title, description, updated, sections }) {
  return (
    <div className="relative overflow-hidden bg-background">
      {/* Page header */}
      <header className="relative overflow-hidden border-b border-border/60">
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[640px] -translate-x-1/2 rounded-full bg-accent/5 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-3xl px-4 pb-12 pt-16 text-center sm:px-6 lg:px-8">
          <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            {eyebrow}
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            {description}
          </p>
          <p className="mt-5 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/80">
            <span className="h-1 w-1 rounded-full bg-accent" />
            Last updated: {updated}
            <span className="h-1 w-1 rounded-full bg-accent" />
          </p>
        </div>
      </header>

      {/* Sections */}
      <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="space-y-8">
          {sections.map((section, i) => (
            <section
              key={i}
              className="rounded-[var(--radius-xl)] border border-border/60 bg-card p-6 shadow-xs sm:p-8"
            >
              <div className="flex items-start gap-4">
                <span className="mt-1 hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 font-display text-sm font-bold text-accent sm:flex">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1">
                  <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {section.title}
                  </h2>
                  <div>
                    {section.blocks.map((block, j) => (
                      <Block key={j} block={block} />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Contact card */}
        <div className="mt-12 rounded-[var(--radius-xl)] border border-accent/30 bg-accent/5 p-6 text-center sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground">
            Questions?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            If you have any questions about this policy, reach out to us at{" "}
            <a
              href="mailto:support@lifebookz.com"
              className="font-medium text-accent hover:underline"
            >
              support@lifebookz.com
            </a>
            — we're happy to help.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LegalPage;
