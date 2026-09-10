import { Icons } from "../../icons";

const CATEGORY_ICONS = {
  education: Icons.academic,
  relationship: Icons.heartSolid,
  career: Icons.briefcase,
  business: Icons.sparkles,
  growth: Icons.userAdd,
  health: Icons.shieldCheck,
};

const categoryCardStyles = {
  education: {
    bgColor: "bg-blue-50/70 dark:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-800",
    accentColor: "bg-blue-500 text-white",
    iconBg: "bg-card/85 text-blue-700 ring-1 ring-blue-200/80 shadow-sm dark:bg-card/70 dark:text-blue-300 dark:ring-blue-400/30",
    desc: "Plan your learning journey, choose the right path, build your future.",
  },
  relationship: {
    bgColor: "bg-pink-50/70 dark:bg-pink-950/20 hover:border-pink-300 dark:hover:border-pink-800",
    accentColor: "bg-pink-500 text-white",
    iconBg: "bg-card/85 text-pink-700 ring-1 ring-pink-200/80 shadow-sm dark:bg-card/70 dark:text-pink-300 dark:ring-pink-400/30",
    desc: "Build healthier connections, solve conflicts, and create lasting bonds.",
  },
  career: {
    bgColor: "bg-emerald-50/70 dark:bg-emerald-950/20 hover:border-emerald-300 dark:hover:border-emerald-800",
    accentColor: "bg-emerald-500 text-white",
    iconBg: "bg-card/85 text-emerald-700 ring-1 ring-emerald-200/80 shadow-sm dark:bg-card/70 dark:text-emerald-300 dark:ring-emerald-400/30",
    desc: "Find the right career path, improve your skills, and reach your goals.",
  },
  business: {
    bgColor: "bg-amber-50/70 dark:bg-amber-950/20 hover:border-amber-300 dark:hover:border-amber-800",
    accentColor: "bg-amber-500 text-white",
    iconBg: "bg-card/85 text-amber-700 ring-1 ring-amber-200/80 shadow-sm dark:bg-card/70 dark:text-amber-300 dark:ring-amber-400/30",
    desc: "Turn your ideas into opportunities and build a successful venture.",
  },
  growth: {
    bgColor: "bg-purple-50/70 dark:bg-purple-950/20 hover:border-purple-300 dark:hover:border-purple-800",
    accentColor: "bg-purple-500 text-white",
    iconBg: "bg-card/85 text-purple-700 ring-1 ring-purple-200/80 shadow-sm dark:bg-card/70 dark:text-purple-300 dark:ring-purple-400/30",
    desc: "Discover your strengths, boost your confidence, become your best self.",
  },
  health: {
    bgColor: "bg-teal-50/70 dark:bg-teal-950/20 hover:border-teal-300 dark:hover:border-teal-800",
    accentColor: "bg-teal-500 text-white",
    iconBg: "bg-card/85 text-teal-700 ring-1 ring-teal-200/80 shadow-sm dark:bg-card/70 dark:text-teal-300 dark:ring-teal-400/30",
    desc: "Stay fit, stay focused, and live a healthier, happier life.",
  },
};

export function CategoryGrid({ categories, onSelectCategory }) {
  return (
    <section className="space-y-10 pt-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground sm:text-sm">
          Choose Your Area
        </p>
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
          Life's big questions. Expert advice.
        </h2>
        <p className="text-sm text-muted-foreground md:text-base">
          Connect with a coach who understands your journey.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id] || Icons.sparkles;
          const style = categoryCardStyles[cat.id];

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`group relative flex h-60 flex-col justify-between rounded-2xl border border-border/60 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${style?.bgColor || "bg-card"}`}
            >
              <div className="space-y-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${style?.iconBg}`}>
                  <Icon className="h-6 w-6" />
                </div>

                <div>
                  <h3 className="font-display text-xl font-bold text-foreground">
                    {cat.label}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {style?.desc}
                  </p>
                </div>
              </div>

              <div className="flex justify-start pt-2">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 ${style?.accentColor}`}>
                  <Icons.arrowRight className="h-4 w-4" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}