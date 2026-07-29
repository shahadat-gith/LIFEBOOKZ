import Button from "../ui/Button";
import { CardFooter } from "../ui/Card";
import { Icons } from "../../icons";

export default function StoryActions({
  saving,
  currentStep,
  handlePublish,
  handleVerify,
  onCancel,
}) {
  return (
    <CardFooter className="px-6 py-4 border-t border-border flex flex-wrap gap-3 justify-between">
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          variant="outline"
          loading={saving}
          icon={<Icons.save className="h-4 w-4" />}
        >
          Save Draft
        </Button>

        {currentStep === "verified" ? (
          <Button
            type="button"
            size="lg"
            onClick={handlePublish}
            icon={<Icons.documentAdd className="h-4 w-4" />}
            className="shadow-lg shadow-success/25 bg-success hover:brightness-110"
          >
            Publish Story
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleVerify}
            icon={<Icons.shieldCheck className="h-4 w-4" />}
          >
            {currentStep === "issues" ? "Re-submit for Review" : "Submit for Review"}
          </Button>
        )}
      </div>
    </CardFooter>
  );
}