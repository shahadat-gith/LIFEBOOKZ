import { Link } from "react-router-dom";
import { Icons } from "../../../icons";

/** Shown when a lifebook is missing, private or was removed. */
export default function StoryMissing({ message }) {
  return (
    <div className="mx-auto max-w-3xl py-20 px-4 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <Icons.exclamationCircle className="h-8 w-8 text-destructive" />
      </div>
      <h1 className="mb-2 text-2xl font-bold text-foreground">Story Not Found</h1>
      <p className="mb-8 text-muted-foreground">
        {message || "This story doesn't exist or has been removed."}
      </p>
      <Link
        to="/feed"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
      >
        <Icons.chevronLeft className="h-4 w-4" />
        Back to Feed
      </Link>
    </div>
  );
}
