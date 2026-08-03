import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { CardFooter } from "../ui/Card";
import { Icons } from "../../icons";

const PROCESSING_STATUSES = [
  "submitted",
  "analyzing",
  "verified",
  "enriching",
  "enriched",
];

export default function StoryActions({
  saving,
  currentStep,
  storyStatus,
  handleSubmit,
  onCancel,
}) {
  const isPublished = storyStatus === "published";
  const isProcessing = PROCESSING_STATUSES.includes(storyStatus);
  const needsReview =
    !isPublished &&
    !isProcessing &&
    (storyStatus === "rejected" ||
      storyStatus === "failed" ||
      currentStep === "issues");

  return (
    <CardFooter className="px-6 py-4 border-t border-border flex flex-wrap gap-3 justify-between">
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        {isProcessing && (
          <Badge variant="info">
            <span className="inline-flex items-center gap-1.5">
              <Icons.sparkles className="h-3 w-3 animate-pulse" />
              In review...
            </span>
          </Badge>
        )}

        <Button
          type="submit"
          variant="outline"
          loading={saving}
          disabled={isProcessing}
          icon={<Icons.save className="h-4 w-4" />}
        >
          {isPublished ? "Published" : "Save Draft"}
        </Button>

        {!isPublished && !isProcessing && (
          <Button
            type="button"
            size="lg"
            onClick={handleSubmit}
            icon={<Icons.shieldCheck className="h-4 w-4" />}
          >
            {needsReview ? "Re-submit for Review" : "Submit for Review"}
          </Button>
        )}
      </div>
    </CardFooter>
  );
}