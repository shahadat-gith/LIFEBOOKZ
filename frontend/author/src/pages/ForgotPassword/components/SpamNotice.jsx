import { Icons } from "../../../icons";

const SENDER = "noreply@lifebookz.com";

/**
 * Shown while waiting for the reset OTP. Mail providers routinely file these
 * away, so the note names the sender and tells the reader what to do.
 */
export default function SpamNotice() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-4 text-left">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Icons.mail className="h-4 w-4 text-primary" />
      </span>

      <div className="space-y-1 text-sm">
        <p className="font-semibold text-foreground">Don&apos;t see the email?</p>
        <p className="text-muted-foreground">
          It can take a minute. Please check your{" "}
          <span className="font-medium text-foreground">Spam</span> or{" "}
          <span className="font-medium text-foreground">Promotions</span> folder.
        </p>
        <p className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-muted-foreground">
          Mark
          <span className="rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-[11px] text-foreground">
            {SENDER}
          </span>
          as safe so future emails reach your inbox.
        </p>
      </div>
    </div>
  );
}
