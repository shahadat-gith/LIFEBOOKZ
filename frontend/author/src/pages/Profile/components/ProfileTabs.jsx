/** Icon-over-label content tabs with navy underline. */
export default function ProfileTabs({ tabs, active, onChange }) {
  return (
    <div className="flex overflow-x-auto no-scrollbar border-b border-border/60">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={`flex-shrink-0 flex flex-col items-center gap-1 px-5 sm:px-7 pb-3 pt-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-5 w-5" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
