/** Four-stat row (followers / following / chapters / stories). */
export default function StatsRow({ stats }) {
  return (
    <div className="rounded-2xl bg-card border border-border/60 shadow-xs px-2 py-4 grid grid-cols-4 divide-x divide-border/50">
      {stats.map((s) => (
        <div key={s.label} className="text-center px-1">
          <p className="font-display text-xl sm:text-2xl font-bold text-foreground">{s.value}</p>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
