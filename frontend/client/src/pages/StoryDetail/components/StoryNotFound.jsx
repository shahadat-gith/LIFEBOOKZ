import { Link } from "react-router-dom";
import ErrorState from "../../../components/common/ErrorState";
import { Icons } from "../../../icons";

/**
 * A lifebook that is missing, private or was removed. The shared error state
 * carries the message; this adds the only useful way out.
 */
export default function StoryNotFound({ message }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <ErrorState
        title="Story Not Found"
        message={message || "This story doesn't exist or has been removed."}
      />

      <div className="flex justify-center">
        <Link
          to="/feed"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <Icons.chevronLeft className="h-4 w-4" />
          Back to Feed
        </Link>
      </div>
    </div>
  );
}
