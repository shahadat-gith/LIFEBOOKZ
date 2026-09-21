import { Link } from "react-router-dom";
import { Icons } from "../../../icons";

/** One destination in the quick-links column. */
function QuickLink({ to, icon: Icon, label, description }) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-xs transition-all hover:border-primary/25 hover:shadow-sm"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary transition-colors group-hover:bg-primary/12">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">
          {label}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
      <Icons.chevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground/70 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}

/** Where a member goes next from their profile. */
export default function QuickLinks() {
  return (
    <section className="space-y-3 lg:col-span-2">
      <h2 className="px-1 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
        Quick links
      </h2>

      <QuickLink
        to="/bookings"
        icon={Icons.book}
        label="My Bookings"
        description="Track and manage your consultation sessions."
      />
      <QuickLink
        to="/consult/book"
        icon={Icons.search}
        label="Find an Expert"
        description="Get matched with the right consultant."
      />
    </section>
  );
}
