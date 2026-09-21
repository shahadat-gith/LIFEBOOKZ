/** The title block every auth screen opens with. */
export default function AuthHeading({ title, subtitle }) {
  return (
    <div className="mb-8 text-center">
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
