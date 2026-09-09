import { motion } from "framer-motion";
import Card, { CardContent } from "../ui/Card";
import CategorySelect from "../editor/CategorySelect";
import StoryTitleInput from "../editor/StoryTitleInput";
import CoverImageUploader from "../editor/CoverImageUploader";
import StoryStats from "../editor/StoryStats";
import { Icons } from "../../icons";

export default function StoryDetailsStep({
  title,
  setTitle,
  storyType,
  setStoryType,
  storyLanguage,
  coverPreview,
  coverFileRef,
  handleCoverChange,
  slugPreview,
  storyStats,
  isLocked,
  onContinue,
  onCancel,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
            1
          </span>
          <span className="text-sm font-semibold text-foreground">Story Details</span>
        </div>
        <div className="flex-1 h-px bg-border/40" />
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground text-sm font-bold">
            2
          </span>
          <span className="text-sm text-muted-foreground">Chapters</span>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-display font-semibold text-foreground mb-1">
              Set up your story
            </h2>
            <p className="text-sm text-muted-foreground">
              Choose a category, give your story a title, and add a cover image.
            </p>
          </div>

          <StoryStats stats={storyStats} />

          <CategorySelect
            storyType={storyType}
            setStoryType={setStoryType}
            storyLanguage={storyLanguage}
          />

          <StoryTitleInput
            title={title}
            setTitle={setTitle}
            storyType={storyType}
            slugPreview={slugPreview}
            disabled={isLocked}
          />

          <CoverImageUploader
            coverPreview={coverPreview}
            coverFileRef={coverFileRef}
            handleCoverChange={handleCoverChange}
            disabled={isLocked}
          />
        </CardContent>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-border flex justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onContinue}
            disabled={!title.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Chapters
            <Icons.chevronRight className="h-4 w-4" />
          </button>
        </div>
      </Card>
    </motion.div>
  );
}
