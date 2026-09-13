import { Icons } from "../../icons";

/** Five quick-action tiles. */
export default function QuickActions({ actions }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 sm:gap-3 mb-10">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            className="flex flex-col items-center gap-2 rounded-2xl bg-muted/50 hover:bg-muted border border-transparent hover:border-border/60 px-2 py-4 transition-all"
          >
            <span className={`flex items-center justify-center w-11 h-11 rounded-xl ${a.tint}`}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-[11px] sm:text-xs font-semibold text-foreground text-center leading-tight">
              {a.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
