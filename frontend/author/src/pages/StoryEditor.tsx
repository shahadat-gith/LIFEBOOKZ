import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as storyApi from "../api/stories";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import Card, { CardContent, CardFooter } from "../components/ui/Card";
import StoryEditorInput from "../components/editor/StoryEditor";
import LoadingScreen from "../components/common/LoadingScreen";
import Badge from "../components/ui/Badge";
import { Icons } from "../icons";
import toast from "react-hot-toast";

type Step = "writing" | "verifying" | "issues" | "verified" | "publishing" | "published";

const STATUS_BADGE: Record<string, "success" | "danger" | "warning" | "info"> = {
  draft: "warning",
  rejected: "danger",
  verified: "success",
  submitted: "info",
  processing: "info",
};

export default function StoryEditorPage() {
  const { storyId } = useParams<{ storyId: string }>();
  const { author, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const isEditMode = Boolean(storyId);

  const [content, setContent] = useState("");
  const [storyStatus, setStoryStatus] = useState("");
  const [currentStep, setCurrentStep] = useState<Step>("writing");

  // Loading states
  const [loadingStory, setLoadingStory] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Verification state
  const [verificationIssues, setVerificationIssues] = useState<
    Array<{ category: string; severity: string; description: string; suggestion: string }>
  >([]);
  const [overallAssessment, setOverallAssessment] = useState("");

  const handleContentChange = useCallback((html: string) => setContent(html), []);
  const stripHtml = (html: string): string => html.replace(/<[^>]*>/g, "").trim();

  // Load existing story in edit mode
  useEffect(() => {
    if (!storyId || !author) return;
    storyApi
      .getMyStory(storyId)
      .then((s) => {
        setContent(s.content || "");
        setStoryStatus(s.status);
        if (s.status === "verified") setCurrentStep("verified");
      })
      .catch(() => setError("Story not found"))
      .finally(() => setLoadingStory(false));
  }, [storyId, author]);

  async function handleSaveDraft(e: FormEvent) {
    e.preventDefault();
    const plainText = stripHtml(content);
    if (!plainText) {
      setError("Story content is required");
      return;
    }
    setError("");
    setSaving(true);
    try {
      if (isEditMode && storyId) {
        const updated = await storyApi.update(storyId, { content });
        // If story was rejected, backend resets it to draft
        setStoryStatus(updated.status);
        setCurrentStep("writing");
        setVerificationIssues([]);
        toast.success("Draft saved successfully");
      } else {
        const story = await storyApi.create({ content });
        navigate(`/stories/${story.id}/edit`, { replace: true });
        toast.success("Draft saved!");
      }
    } catch (err: unknown) {
      const msg = (
        err as { response?: { data?: { error?: { message?: string } } } }
      )?.response?.data?.error?.message;
      setError(msg || "Failed to save story");
    } finally {
      setSaving(false);
    }
  }

  async function handleVerify() {
    const plainText = stripHtml(content);
    if (!plainText) {
      setError("Write your story before submitting for review.");
      return;
    }

    // Capture re-submit intent BEFORE changing step
    const isResubmit = currentStep === "issues";

    setError("");
    setCurrentStep("verifying");
    try {
      // Save first, then verify
      let id = storyId;
      if (isEditMode && id) {
        await storyApi.update(id, { content });
      } else {
        const story = await storyApi.create({ content });
        id = story.id;
        navigate(`/stories/${story.id}/edit`, { replace: true });
      }

      if (!id) throw new Error("Failed to get story ID");

      const result = await storyApi.verify(id);
      setVerificationIssues(result.issues || []);
      setOverallAssessment(result.overallAssessment || "");

      if (result.canProceed) {
        // Re-submit after fixing issues → auto-publish
        if (isResubmit) {
          setCurrentStep("publishing");
          try {
            await storyApi.publish(id);
            setCurrentStep("published");
            toast.success("Story published successfully!");
            setTimeout(() => navigate("/dashboard"), 2500);
          } catch {
            setCurrentStep("verified");
            setStoryStatus("verified");
            toast.success("Verification passed! Click Publish to finalize.");
          }
        } else {
          setCurrentStep("verified");
          setStoryStatus("verified");
          toast.success("Your story passed verification!");
        }
      } else {
        setCurrentStep("issues");
        setStoryStatus("rejected");
      }
    } catch (err: unknown) {
      const msg = (
        err as { response?: { data?: { error?: { message?: string } } } }
      )?.response?.data?.error?.message;
      setError(msg || "Verification failed");
      setCurrentStep("writing");
    }
  }

  async function handlePublish() {
    if (!storyId) {
      setError("Story ID not found.");
      return;
    }
    setError("");
    setCurrentStep("publishing");
    try {
      await storyApi.publish(storyId);
      setCurrentStep("published");
      toast.success("Story published successfully!");
      setTimeout(() => navigate("/dashboard"), 2500);
    } catch (err: unknown) {
      const msg = (
        err as { response?: { data?: { error?: { message?: string } } } }
      )?.response?.data?.error?.message;
      setError(msg || "Failed to publish story");
      setCurrentStep("verified");
    }
  }

  // ─── Auth & loading guards ───
  if (authLoading) return <LoadingScreen message="Loading..." />;
  if (!author) {
    navigate("/login");
    return null;
  }

  if (isEditMode && error && !loadingStory && !content) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <Card padding="lg" className="text-center">
          <div className="mb-4">
            <Icons.exclamationCircle className="h-12 w-12 text-destructive mx-auto" />
          </div>
          <p className="text-destructive font-medium mb-4">{error}</p>
          <Button onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (loadingStory) return <LoadingScreen message="Loading story..." />;

  // ─── Publishing overlay ───
  if (currentStep === "publishing") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-lg mx-auto py-20 px-4 text-center"
        >
          <div className="mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <Icons.sparkles className="h-10 w-10 text-primary animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Submitting Your Story</h2>
          <p className="text-muted-foreground mb-6">
            Please wait while we finalize your story...
          </p>
          <div className="flex justify-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Published overlay ───
  if (currentStep === "published") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-lg mx-auto py-20 px-4 text-center"
        >
          <div className="mb-6">
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto">
              <Icons.checkCircle className="h-10 w-10 text-success" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Story Published! 🎉</h2>
          <p className="text-muted-foreground mb-6">
            Your story has been published successfully.
          </p>
          <div className="w-12 h-1 bg-success rounded-full mx-auto animate-pulse" />
        </motion.div>
      </div>
    );
  }

  // ─── Verifying overlay ───
  if (currentStep === "verifying") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-lg mx-auto py-20 px-4 text-center"
        >
          <div className="mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <Icons.shieldCheck className="h-10 w-10 text-primary animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Verifying Your Story</h2>
          <p className="text-muted-foreground mb-6">
            Checking your story for content guidelines...
          </p>
          <div className="flex justify-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      {/* Fixed header */}
      <div className="sticky top-0 z-20 bg-background pb-6 pt-2 -mx-4 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">
              {isEditMode ? "Edit Story" : "Write a Story"}
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
              ? "Fix the issues below and resubmit for review."
              : currentStep === "verified"
                ? "Your story passed verification! Click Publish to finalize."
                : "Write your story, then submit for review before publishing."}
          </p>
        </motion.div>
      </div>

      {/* Verified Banner */}
      <AnimatePresence>
        {currentStep === "verified" && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-5 rounded-2xl bg-success/10 border border-success/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                <Icons.checkCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-success">
                  Review Passed ✓
                </h3>
                {overallAssessment && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {overallAssessment}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verification Issues Panel */}
      <AnimatePresence>
        {currentStep === "issues" && verificationIssues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 overflow-hidden"
          >
            <div className="flex items-center gap-2 p-4 bg-destructive/10 border-b border-destructive/20">
              <Icons.exclamationCircle className="h-5 w-5 text-destructive" />
              <h3 className="text-sm font-semibold text-destructive">
                Issues Found ({verificationIssues.length})
              </h3>
            </div>
            <div className="divide-y divide-destructive/10">
              {verificationIssues.map((issue, i) => (
                <div key={i} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          issue.severity === "high"
                            ? "bg-destructive"
                            : issue.severity === "medium"
                              ? "bg-warning"
                              : "bg-muted-foreground"
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-foreground capitalize">
                          {issue.category?.replace(/_/g, " ")}
                        </span>
                        <Badge
                          variant={
                            issue.severity === "high"
                              ? "danger"
                              : issue.severity === "medium"
                                ? "warning"
                                : "default"
                          }
                        >
                          {issue.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground">
                        {issue.description}
                      </p>
                      {issue.suggestion && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                          <Icons.sparkles className="h-3 w-3 flex-shrink-0 mt-0.5 text-primary" />
                          {issue.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {overallAssessment && (
              <div className="p-4 bg-destructive/5 border-t border-destructive/10">
                <p className="text-xs text-muted-foreground italic">
                  {overallAssessment}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main form */}
      <form onSubmit={handleSaveDraft}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6 space-y-5">
              <StoryEditorInput
                content={content}
                onChange={handleContentChange}
                placeholder={
                  isEditMode
                    ? "Edit your story..."
                    : "Once upon a time... Write your story here..."
                }
              />

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
                      <Icons.close className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>

            <CardFooter className="px-6 py-4 border-t border-border flex flex-wrap gap-3 justify-between">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate(-1)}
                >
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
                    Publish Now
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleVerify}
                    icon={<Icons.shieldCheck className="h-4 w-4" />}
                  >
                    {currentStep === "issues"
                      ? "Re-submit for Review"
                      : "Submit for Review"}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </form>
    </div>
  );
}
