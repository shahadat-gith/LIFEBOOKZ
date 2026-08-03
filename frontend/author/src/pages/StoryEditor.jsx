import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as storyApi from "../utils/client";
import { useAuth } from "../context/AuthContext";
import { usePolling } from "../hooks/usePolling";

import Card, { CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import LoadingScreen from "../components/common/LoadingScreen";
import Editor from "../components/editor/Editor";

import StoryHeader from "../components/editor/StoryHeader";
import VerificationBanner from "../components/editor/VerificationBanner";
import CategorySelect from "../components/editor/CategorySelect";
import StoryStats from "../components/editor/StoryStats";
import StoryTitleInput from "../components/editor/StoryTitleInput";
import CoverImageUploader from "../components/editor/CoverImageUploader";
import StoryActions from "../components/editor/StoryActions";
import PublishingOverlay from "../components/editor/PublishingOverlay";
import PollingModal from "../components/story/PollingModal";

import { Icons } from "../icons";
import toast from "react-hot-toast";

const TYPE_PLACEHOLDERS = {
  autobiography: "Document your life journey, personal milestones, key memories, or core lessons learned...",
  biography: "Share their life journey, heritage, achievements, and lasting legacy...",
  legend: "Record the life, impactful accomplishments, and extraordinary legacy of this individual...",
};

// Statuses where the story is locked while the background pipeline runs
const PROCESSING_STATUSES = [
  "submitted",
  "analyzing",
  "verified",
  "enriching",
  "enriched",
];

/* ─── Extract plain text from TipTap JSON or HTML ─── */
function extractPlainText(doc) {
  if (!doc) return "";

  // String — treat as HTML, strip tags
  if (typeof doc === "string") {
    return doc
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Object — TipTap JSON node tree
  if (typeof doc === "object") {
    return extractTextFromNode(doc).trim();
  }

  return String(doc).trim();
}

function extractTextFromNode(node) {
  if (!node) return "";

  if (node.type === "text" && typeof node.text === "string") {
    return node.text;
  }

  if (Array.isArray(node.content)) {
    return node.content.map(extractTextFromNode).filter(Boolean).join(" ");
  }

  return "";
}

export default function StoryEditorPage() {
  const { storyId } = useParams();
  const { author, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const isEditMode = Boolean(storyId);
  const [storyIdState, setStoryIdState] = useState(storyId || null);

  const [title, setTitle] = useState("");
  // content stores the TipTap JSON document (from editor.getJSON())
  const [content, setContent] = useState(null);
  const [storyType, setStoryType] = useState("autobiography");
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [storyStatus, setStoryStatus] = useState("");
  const [storyLanguage, setStoryLanguage] = useState("");
  const [storyStats, setStoryStats] = useState(null);
  const [currentStep, setCurrentStep] = useState("writing");
  const coverFileRef = useRef(null);

  const formStateRef = useRef({ title, content, storyType, storyIdState });
  useEffect(() => {
    formStateRef.current = { title, content, storyType, storyIdState };
  }, [title, content, storyType, storyIdState]);

  const [loadingStory, setLoadingStory] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [verificationIssues, setVerificationIssues] = useState([]);

  // Async pipeline polling (submit → analyzing → … → published / rejected / failed)
  const {
    pollStatus,
    pollMessage,
    issues,
    storyStatus: polledStatus,
    startPolling,
    stopPolling,
  } = usePolling();

  const handlePollSuccess = useCallback(() => {
    setCurrentStep("published");
    setStoryStatus("published");
    setTimeout(() => navigate("/dashboard"), 2500);
  }, [navigate]);

  useEffect(() => {
    if (pollStatus === "success") {
      handlePollSuccess();
    } else if (pollStatus === "failed") {
      setVerificationIssues(issues || []);
      // Unlock the editor so the author can fix issues and resubmit
      if (polledStatus) setStoryStatus(polledStatus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollStatus, polledStatus]);

  // onChange receives TipTap JSON from the editor
  const handleDocumentChange = useCallback((json) => setContent(json), []);

  const makeSlug = (str) =>
    (str || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const slugPreview = title?.trim() ? makeSlug(title.trim()) : "";

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10 MB.");
      return;
    }

    if (coverPreview && coverPreview.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreview);
    }

    setCoverImage(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    return () => {
      if (coverPreview && coverPreview.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  // After image upload, auto-save the content JSON
  const handleImageUploadEnd = useCallback(
    async (jsonDocument) => {
      if (!jsonDocument) return;
      setContent(jsonDocument);

      const plainText = extractPlainText(jsonDocument);
      if (!plainText) return;

      const {
        title: currentTitle,
        storyType: currentType,
        storyIdState: currentId,
      } = formStateRef.current;

      try {
        const payload = { content: jsonDocument, storyType: currentType };
        if (currentTitle.trim()) payload.title = currentTitle.trim();

        if (currentId) {
          await storyApi.update(currentId, payload);
        } else {
          const story = await storyApi.create(payload);
          const newId = story.id || story._id;
          setStoryIdState(newId);
          navigate(`/stories/${newId}/edit`, { replace: true });
        }
      } catch {
        // Silently fail auto-save
      }
    },
    [navigate],
  );

  useEffect(() => {
    if (!storyId || !author) return;
    storyApi
      .getMyStory(storyId)
      .then((s) => {
        setTitle(s.title || "");
        setContent(s.content || null);
        setStoryType(s.storyType || "autobiography");
        setStoryStatus(s.status);
        if (s.coverImage?.url) {
          setCoverPreview(s.coverImage.url);
          setCoverImage(s.coverImage);
        }
        if (s.language) setStoryLanguage(s.language);
        if (s.stats) setStoryStats(s.stats);

        if (s.status === "rejected" || s.status === "failed") {
          setVerificationIssues(s.analysis?.issues || []);
          setCurrentStep("issues");
        } else if (s.status === "published") {
          setCurrentStep("published");
        } else if (PROCESSING_STATUSES.includes(s.status)) {
          // Resume watching an in-flight submission
          setCurrentStep("verifying");
          startPolling(storyId);
        }
      })
      .catch(() => setError("Story not found"))
      .finally(() => setLoadingStory(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId, author]);

  /**
   * Create or update the story draft (handles FormData for the cover image).
   * Returns { id, story, created }.
   */
  async function persistStory() {
    const payload = { content, storyType };
    if (title.trim()) payload.title = title.trim();

    if (coverImage instanceof File) {
      const fd = new FormData();
      fd.append("content", JSON.stringify(content));
      fd.append("title", title.trim());
      fd.append("storyType", storyType);
      fd.append("coverImage", coverImage);

      if (storyIdState) {
        const story = await storyApi.update(storyIdState, fd);
        return { id: storyIdState, story };
      }
      const story = await storyApi.create(fd);
      return { id: story.id || story._id, story, created: true };
    }

    if (storyIdState) {
      const story = await storyApi.update(storyIdState, payload);
      return { id: storyIdState, story };
    }
    const story = await storyApi.create(payload);
    return { id: story.id || story._id, story, created: true };
  }

  function applySavedStory(story, id) {
    setStoryIdState(id);
    navigate(`/stories/${id}/edit`, { replace: true });
    setStoryStatus(story.status);
    setStoryLanguage(story.language || "");
    setStoryStats(story.stats || null);
    if (story.coverImage?.url) setCoverPreview(story.coverImage.url);
  }

  async function handleSaveDraft(e) {
    e.preventDefault();
    const plainText = extractPlainText(content);
    if (!plainText) {
      setError("Story content is required");
      return;
    }
    if (!title.trim()) {
      setError("Story title is required");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const { id, story } = await persistStory();
      applySavedStory(story, id);
      setCurrentStep("writing");
      setVerificationIssues([]);
      toast.success("Draft saved successfully");
    } catch (err) {
      const msg = err?.response?.data?.error?.message || "Failed to save story";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    const plainText = extractPlainText(content);
    if (!plainText) {
      setError("Write your story before submitting for review.");
      return;
    }
    if (!title.trim()) {
      setError("Story title is required");
      return;
    }

    setError("");
    setSaving(true);
    try {
      const { id, story } = await persistStory();
      applySavedStory(story, id);

      // Submit — enqueues the async analysis pipeline on the backend
      await storyApi.publish(id);
      setStoryStatus("submitted");
      setCurrentStep("verifying");
      startPolling(id);
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message || "Failed to submit story";
      setError(msg);
      setCurrentStep("writing");
    } finally {
      setSaving(false);
    }
  }

  function handleEditAfterPoll() {
    stopPolling();
    setCurrentStep("issues");
    setVerificationIssues(issues || []);
  }

  function handleBackToDashboard() {
    stopPolling();
    navigate("/dashboard");
  }

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
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  if (loadingStory) return <LoadingScreen message="Loading story..." />;

  const isLocked =
    storyStatus === "published" || PROCESSING_STATUSES.includes(storyStatus);

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <PollingModal
        pollStatus={pollStatus}
        pollMessage={pollMessage}
        issues={issues}
        onEditStory={handleEditAfterPoll}
        onBackToDashboard={handleBackToDashboard}
      />

      {/* Avoid stacking overlays — PollingModal covers the whole flow while polling */}
      {pollStatus === "idle" && <PublishingOverlay currentStep={currentStep} />}

      <StoryHeader
        isEditMode={isEditMode}
        storyStatus={storyStatus}
        currentStep={currentStep}
      />

      <VerificationBanner
        currentStep={currentStep}
        verificationIssues={verificationIssues}
      />

      <form onSubmit={handleSaveDraft}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6 space-y-6">
              <CategorySelect
                storyType={storyType}
                setStoryType={setStoryType}
                storyLanguage={storyLanguage}
              />

              <StoryStats stats={storyStats} />

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

              <Editor
                key={storyType}
                content={content}
                onChange={handleDocumentChange}
                onImageUploadEnd={handleImageUploadEnd}
                editable={!isLocked}
                placeholder={TYPE_PLACEHOLDERS[storyType] || "Start recording the narrative here..."}
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

            <StoryActions
              saving={saving}
              currentStep={currentStep}
              storyStatus={storyStatus}
              handleSubmit={handleSubmit}
              onCancel={() => navigate(-1)}
            />
          </Card>
        </motion.div>
      </form>
    </div>
  );
}
