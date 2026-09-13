import { Icons } from "../../icons";

/** Total likes received. */
export default function LikesTab({ total, empty }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-10 text-center shadow-xs">
      <Icons.heartRegular className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
      <p className="font-display font-semibold text-foreground">{total} likes received</p>
      <p className="text-sm text-muted-foreground mt-1">Readers love your stories. Keep writing!</p>
    </div>
  );
}
