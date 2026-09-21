import { Link } from "react-router-dom";
import { Icons } from "../../../icons";

/** "Why write" checklist + "Writing tips" cards side by side. */
export default function InfoCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 mb-8">
      <div className="rounded-3xl bg-gradient-to-br from-green-50 to-emerald-50/60 border border-green-100 p-6">
        <h3 className="font-display text-lg font-bold text-foreground">Why write your story?</h3>
        <ul className="mt-4 space-y-2.5">
          {[
            "It's worth remembering.",
            "It can help someone.",
            "It can inspire generations.",
            "It's never too late to begin.",
          ].map((point) => (
            <li key={point} className="flex items-center gap-2.5 text-sm text-foreground/90">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-success/15 flex items-center justify-center">
                <Icons.check className="h-3 w-3 text-success" />
              </span>
              {point}
            </li>
          ))}
        </ul>
        <Link
          to="/stories/new"
          className="mt-5 inline-flex rounded-xl border border-success/40 bg-card px-5 py-2 text-sm font-bold text-success hover:bg-success/5 transition-colors"
        >
          Learn More
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-50 to-pink-50/60 border border-rose-100 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-foreground">
            Writing Tips &amp; Inspiration
          </h3>
          <Link to="/stories/new" className="text-sm font-semibold text-accent hover:underline">
            Start now
          </Link>
        </div>

        <ul className="mt-4 space-y-3">
          {[
            "Start with the moment you remember most vividly.",
            "Write like you're telling it to a friend — not an audience.",
            "Small, ordinary details make memories feel real.",
            "Don't edit while writing. First remember, then refine.",
          ].map((tip) => (
            <li key={tip} className="flex items-start gap-2.5 text-sm text-foreground/90">
              <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center">
                <Icons.check className="h-3 w-3 text-accent" />
              </span>
              {tip}
            </li>
          ))}
        </ul>

        <Icons.sparkles className="absolute -bottom-3 -right-3 h-24 w-24 text-rose-200/60 rotate-12 pointer-events-none" />
      </div>
    </div>
  );
}
