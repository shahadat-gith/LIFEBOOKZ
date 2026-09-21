import { Icons } from "../../../icons";

/** The "check your spam folder" hint shown while waiting for the OTP. */
export default function SpamNotice() {
  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left dark:border-amber-800/40 dark:bg-amber-950/20">
      <div className="flex items-start gap-3">
        <Icons.infoCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="space-y-1 text-sm text-amber-800 dark:text-amber-300">
          <p className="font-medium">Don&apos;t see the email?</p>
          <p>
            Check your <strong>spam</strong> or <strong>promotions</strong>{" "}
            folder. It may take a few minutes to arrive.
          </p>
          <p className="text-xs opacity-80">
            Add{" "}
            <span className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs dark:bg-amber-900/40">
              noreply@lifebookz.com
            </span>{" "}
            to your contacts.
          </p>
        </div>
      </div>
    </div>
  );
}
