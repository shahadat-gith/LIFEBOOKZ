import { Link } from "react-router-dom";
import { Icons } from "../../icons";

export function HeroSection() {
  return (
    <section className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
      
      {/* Hero Text Content */}
      <div className="space-y-3 lg:col-span-6">
        <div className="">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground sm:text-sm">
            Talk To A
          </p>
          <h1 className="font-display text-6xl font-black tracking-tight text-primary sm:text-7xl lg:text-8xl dark:text-foreground">
            Coach<span className="text-accent">.</span>
          </h1>
        </div>

        <p className="max-w-md text-base font-medium leading-relaxed text-muted-foreground sm:text-lg md:text-xl">
          Get guidance, clarity, and support for what truly matters to you in your personal and professional journey.
        </p>

        {/* CTA Button: Hidden on mobile (shown below image on mobile), visible on desktop */}
        <div className="hidden lg:block">
          <Link
            to="/consult/book"
            className="group inline-flex items-center gap-3 rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30"
          >
            <span>Book a Session with an Expert</span>
            <Icons.arrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Hero Visuals & Floating Feature Pills */}
      <div className="relative flex flex-col items-center justify-center lg:col-span-6">
        
        {/* Image Container (No Background or Border) */}
        <div className="relative flex w-full max-w-sm items-center justify-center sm:max-w-md">
          <img
            src="/consult.png"
            alt="Consultation Illustration"
            className="h-[30vh] w-full max-w-[340px] sm:max-w-[400px] object-contain drop-shadow-sm"
          />

          {/* Floating Pill 1: Top Left Floating */}
          <div className="absolute top-2 -left-3 sm:-left-6 flex items-center gap-2 rounded-full border border-border/80 bg-card/95 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-md backdrop-blur-md transition-transform duration-300 hover:scale-105 animate-bounce [animation-duration:5s]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <Icons.globe className="h-3.5 w-3.5" />
            </span>
            <span className="whitespace-nowrap">Expert Guidance</span>
          </div>

          {/* Floating Pill 2: Top Right Offset */}
          <div className="absolute -top-2 right-0 sm:-right-4 flex items-center gap-2 rounded-full border border-border/80 bg-card/95 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-md backdrop-blur-md transition-transform duration-300 hover:scale-105 animate-bounce [animation-duration:6s]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400">
              <Icons.heartSolid className="h-3.5 w-3.5" />
            </span>
            <span className="whitespace-nowrap">Confidential & Safe</span>
          </div>

          {/* Floating Pill 3: Mid/Bottom Left */}
          <div className="absolute bottom-10 -left-4 sm:-left-8 flex items-center gap-2 rounded-full border border-border/80 bg-card/95 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-md backdrop-blur-md transition-transform duration-300 hover:scale-105 animate-bounce [animation-duration:4.5s]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Icons.userCheck className="h-3.5 w-3.5" />
            </span>
            <span className="whitespace-nowrap">Personalized Support</span>
          </div>

          {/* Floating Pill 4: Bottom Right Floating */}
          <div className="absolute bottom-2 -right-2 sm:-right-6 flex items-center gap-2 rounded-full border border-border/80 bg-card/95 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-md backdrop-blur-md transition-transform duration-300 hover:scale-105 animate-bounce [animation-duration:5.5s]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <Icons.sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="whitespace-nowrap">Verified Coaches</span>
          </div>
        </div>

        {/* CTA Button: Only shown below image on mobile/tablet */}
        <div className="mt-8 block w-full px-4 lg:hidden">
          <Link
            to="/consult/book"
            className="group flex w-full items-center justify-center gap-3 rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30"
          >
            <span>Book a Session with an Expert</span>
            <Icons.arrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

      </div>
    </section>
  );
}