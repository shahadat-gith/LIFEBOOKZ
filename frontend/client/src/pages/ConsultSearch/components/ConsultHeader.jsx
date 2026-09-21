import { Link } from "react-router-dom";
import { Icons } from "../../../icons";

/** Back link plus the page's pitch, above the consult form. */
export default function ConsultHeader() {
  return (
    <>
      <Link
        to="/consult"
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-accent"
      >
        <Icons.arrowLeft className="h-4 w-4" />
        Back to consultation
      </Link>

      <header className="space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground sm:text-sm">
          Find Your Expert
        </p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
          Tell us what you&apos;re going through
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
          Describe your situation and pick a category. We&apos;ll search our
          expert network and show the top matches for you, ranked by rating.
        </p>
      </header>
    </>
  );
}
