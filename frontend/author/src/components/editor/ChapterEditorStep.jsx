import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Card, { CardContent } from "../ui/Card";
import Button from "../ui/Button";
import Editor from "../editor/Editor";
import * as storyApi from "../../utils/client";
import { Icons } from "../../icons";
import toast from "react-hot-toast";

const TYPE_PLACEHOLDERS = {
  autobiography: "Document your life journey, personal milestones, key memories, or core lessons learned...",
  biography: "Share their life journey, heritage, achievements, and lasting legacy...",
  legend: "Record the life, impactful accomplishments, and extraordinary legacy of this individual...",
};

export default function ChapterEditorStep({
  storyType,
  chapters,
  setChapters,
  activeChapterIndex,
  setActiveChapterIndex,
  chapterContent,
  setChapterContent,
  handleDocumentChange,
  handleImageUploadEnd,
  isLocked,
  saving,
  currentStep,
  storyStatus,
  error,
  setError,
  handleSaveDraft,
  handleSubmit,
  onBack,
}) {
  const activeChapter = chapters[activeChapterIndex] || {};

  function addNewChapter() {
    const newIdx = chapters.length;
    const newChapter = {
      title: `Chapter ${newIdx + 1}`,
      content: { type: "doc", content: [] },
      bannerImage: null,
      caption: "",
    };
    setChapters((prev) => [...prev, newChapter]);
    setActiveChapterIndex(newIdx);
    toast.success(`Chapter ${newIdx + 1} added`);
  }

  function removeChapter(idx) {
    if (chapters.length <= 1) {
      toast.error("Stories must have at least one chapter");
      return;
    }
    setChapters((prev) => {
      const next = prev.filter((_, i) => i !== idx).map((ch, i) => ({ ...ch, order: i }));
      return next;
    });
    setActiveChapterIndex((prev) => Math.min(prev, chapters.length - 2));
    toast.success("Chapter removed");
  }

  function updateChapterTitle(idx, newTitle) {
    setChapters((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], title: newTitle };
      return next;
    });
  }

  function updateChapterCaption(idx, newCaption) {
    setChapters((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], caption: newCaption };
      return next;
    });
  }

  async function handleChapterBannerChange(chapterIdx, e) {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    try {
      const uploaded = await storyApi.uploadImage(file);
      setChapters((prev) => {
        const next = [...prev];
        next[chapterIdx] = { ...next[chapterIdx], bannerImage: uploaded };
        return next;
      });
      toast.success("Banner image uploaded");
    } catch {
      toast.error("Failed to upload banner image");
    }
  }

  function removeChapterBanner(chapterIdx) {
    setChapters((prev) => {
      const next = [...prev];
      next[chapterIdx] = { ...next[chapterIdx], bannerImage: null };
      return next;
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground text-sm font-bold hover:bg-muted/80 transition-colors"
          >
            1
          </button>
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Story Details
          </button>
        </div>
        <div className="flex-1 h-px bg-border/40" />
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
            2
          </span>
          <span className="text-sm font-semibold text-foreground">Chapters</span>
        </div>
      </div>

      <Card>
        {/* Chapter Tabs */}
        <div className="flex overflow-x-auto border-b border-border/40 bg-muted/30">
          {chapters.map((ch, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveChapterIndex(idx)}
              className={`flex-shrink-0 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                idx === activeChapterIndex
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <span className="truncate max-w-[120px] inline-block">
                {ch.title || `Chapter ${idx + 1}`}
              </span>
              {chapters.length > 1 && !isLocked && (
                <span
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeChapter(idx);
                  }}
                  className="ml-2 text-muted-foreground hover:text-destructive inline-flex"
                  title="Remove chapter"
                >
                  ×
                </span>
              )}
            </button>
          ))}

          {!isLocked && (
            <button
              type="button"
              onClick={addNewChapter}
              className="flex-shrink-0 px-4 py-3 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
            >
              <Icons.plus className="h-3.5 w-3.5 inline mr-1" />
              Add Chapter
            </button>
          )}
        </div>

        {/* Active Chapter Editor */}
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Chapter {activeChapterIndex + 1} of {chapters.length}
            </h3>
            {chapters.length > 1 && !isLocked && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeChapter(activeChapterIndex)}
                icon={<Icons.trash className="h-3.5 w-3.5" />}
                className="text-destructive hover:text-destructive"
              >
                Delete Chapter
              </Button>
            )}
          </div>

          {/* Chapter Title */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Chapter Title *
            </label>
            <input
              type="text"
              value={activeChapter.title || ""}
              onChange={(e) => updateChapterTitle(activeChapterIndex, e.target.value)}
              disabled={isLocked}
              placeholder={`Chapter ${activeChapterIndex + 1}`}
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {/* Chapter Banner Image */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Banner Image (Optional)
            </label>
            <div className="flex items-center gap-3">
              {activeChapter.bannerImage?.url ? (
                <div className="relative w-full max-w-sm rounded-lg overflow-hidden border border-border/40">
                  <img
                    src={activeChapter.bannerImage.url}
                    alt="Chapter banner"
                    className="w-full h-32 object-cover"
                  />
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={() => removeChapterBanner(activeChapterIndex)}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <Icons.close className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ) : !isLocked ? (
                <label className="flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-border/60 hover:border-primary/50 cursor-pointer transition-colors">
                  <Icons.camera className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload banner image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleChapterBannerChange(activeChapterIndex, e)}
                  />
                </label>
              ) : null}
            </div>
          </div>

          {/* Chapter Caption */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Caption (Optional)
            </label>
            <input
              type="text"
              value={activeChapter.caption || ""}
              onChange={(e) => updateChapterCaption(activeChapterIndex, e.target.value)}
              disabled={isLocked}
              placeholder="Optional caption for this chapter..."
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {/* Chapter Content Editor */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Chapter Content *
            </label>
            <Editor
              key={`${storyType}-${activeChapterIndex}`}
              content={chapterContent}
              onChange={handleDocumentChange}
              onImageUploadEnd={handleImageUploadEnd}
              editable={!isLocked}
              placeholder={TYPE_PLACEHOLDERS[storyType] || "Start recording the narrative here..."}
            />
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-destructive flex items-center gap-1.5 p-3 rounded-lg bg-destructive/10"
              >
                <Icons.exclamationCircle className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{error}</span>
                <button
                  type="button"
                  onClick={() => setError("")}
                  className="flex-shrink-0 p-0.5 rounded hover:bg-destructive/20 transition-colors"
                >
                  <Icons.close className="h-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-border flex flex-wrap gap-3 justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icons.chevronLeft className="h-4 w-4" />
            Back to Details
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving || currentStep === "verifying" || currentStep === "published"}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border/60 text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              <Icons.save className="h-4 w-4" />
              Save Draft
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || currentStep === "verifying" || currentStep === "published"}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Icons.shieldCheck className="h-4 w-4" />
              {storyStatus === "published" || currentStep === "issues" ? "Re-submit for Review" : "Submit for Review"}
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
