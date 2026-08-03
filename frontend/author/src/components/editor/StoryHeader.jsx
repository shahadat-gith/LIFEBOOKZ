import { motion } from "framer-motion";
import Badge from "../ui/Badge";

const STATUS_BADGE = {
  draft: "warning",
  rejected: "danger",
  failed: "danger",
  submitted: "info",
  analyzing: "info",
  verified: "success",
  enriching: "info",
  enriched: "info",
  published: "success",
};

export default function StoryHeader({ isEditMode, storyStatus, currentStep }) {
  return (
    <div className="sticky top-0 z-20 bg-background pb-6 pt-2 -mx-4 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-foreground">
            {isEditMode ? "Edit Life Story" : "Document a Life Story"}
          </h1>
          {storyStatus && (
            <Badge variant={STATUS_BADGE[storyStatus] || "info"}>
              {storyStatus === "verified"
                ? "Ready to Publish"
                : storyStatus.charAt(0).toUpperCase() + storyStatus.slice(1)}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          {currentStep === "issues"
            ? "Fix the verification issues below and resubmit your manuscript."
            : currentStep === "verified"
            ? "Your narrative passed verification — it will be published shortly."
            : "Record authentic life stories, family histories, or biographies."}
        </p>
      </motion.div>
    </div>
  );
}