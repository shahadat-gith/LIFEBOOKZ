import { Icons } from "../../icons";

export function HeroSection() {
  return (
    <section className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
      {/* Hero Left Content */}
      <div className="space-y-6 lg:col-span-7">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground sm:text-sm">
            Talk To A
          </p>
          <h1 className="font-display text-5xl font-black tracking-tight text-primary sm:text-6xl md:text-7xl lg:text-8xl dark:text-foreground">
            Coach<span className="text-accent">.</span>
          </h1>
        </div>

        <p className="max-w-lg text-base font-medium leading-relaxed text-muted-foreground sm:text-lg md:text-xl">
          Get guidance, clarity, and support for what truly matters to you in your personal and professional journey.
        </p>

        {/* Feature Badges */}
        <div className="flex flex-wrap gap-3 pt-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-xs sm:text-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-card/85 text-blue-700 ring-1 ring-blue-200/80 shadow-sm dark:bg-card/70 dark:text-blue-300 dark:ring-blue-400/30">
              <Icons.globe className="h-3.5 w-3.5" />
            </span>
            Expert Guidance
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-xs sm:text-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-card/85 text-pink-700 ring-1 ring-pink-200/80 shadow-sm dark:bg-card/70 dark:text-pink-300 dark:ring-pink-400/30">
              <Icons.heartSolid className="h-3.5 w-3.5" />
            </span>
            Confidential & Safe
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-xs sm:text-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-card/85 text-emerald-700 ring-1 ring-emerald-200/80 shadow-sm dark:bg-card/70 dark:text-emerald-300 dark:ring-emerald-400/30">
              <Icons.userCheck className="h-3.5 w-3.5" />
            </span>
            Personalized Support
          </div>
        </div>


      </div>

      {/* Hero Right Visual */}
      <div className="relative flex flex-col items-center justify-center lg:col-span-5">
       
        <div className="relative w-full max-w-md overflow-hidden p-4 sm:p-6">
          <img
            src="/consult.png"
            alt="Consultation illustration"
            className="h-auto w-full object-contain drop-shadow-sm transition-transform duration-500 hover:scale-[1.02]"
          />
        </div>
      </div>
    </section>
  );
}