import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import * as storyApi from "../utils/client";
import { useAuth } from "../context/AuthContext";
import { usePolling } from "../hooks/usePolling";

import Card, { CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import LoadingScreen from "../components/common/LoadingScreen";

import StoryHeader from "../components/editor/StoryHeader";
import VerificationBanner from "../components/editor/VerificationBanner";
import PublishingOverlay from "../components/editor/PublishingOverlay";
import PollingModal from "../components/story/PollingModal";

import StoryDetailsStep from "../components/editor/StoryDetailsStep";
import ChapterEditorStep from "../components/editor/ChapterEditorStep";

import { Icons } from "../icons";
import toast from "react-hot-toast";

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

  if (typeof doc === "string") {
    return doc
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

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

  // ─── Wizard Step ───
  const [editorStep, setEditorStep] = useState(1); // 1 = details, 2 = chapters

  // ─── Story-level fields ───
  const [title, setTitle] = useState("");
  const [storyType, setStoryType] = useState("autobiography");
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [storyStatus, setStoryStatus] = useState("");
  const [storyLanguage, setStoryLanguage] = useState("");
  const [storyStats, setStoryStats] = useState(null);
  const [currentStep, setCurrentStep] = useState("writing");
  const coverFileRef = useRef(null);

  // ─── Chapters state ───
  const [chapters, setChapters] = useState([
    { title: "Chapter 1", content: { type: "doc", content: [] }, bannerImage: null, caption: "" },
  ]);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [chapterContent, setChapterContent] = useState({ type: "doc", content: [] });

  const formStateRef = useRef({ title, storyType, storyIdState, chapters, activeChapterIndex });
  useEffect(() => {
    formStateRef.current = { title, storyType, storyIdState, chapters, activeChapterIndex };
  }, [title, storyType, storyIdState, chapters, activeChapterIndex]);

  const [loadingStory, setLoadingStory] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [verificationIssues, setVerificationIssues] = useState([]);

  // Async pipeline polling
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
      if (polledStatus) setStoryStatus(polledStatus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollStatus, polledStatus]);

  // Editor change handler — updates the active chapter content
  const handleDocumentChange = useCallback((json) => {
    setChapterContent(json);
    setChapters((prev) => {
      const next = [...prev];
      const idx = formStateRef.current.activeChapterIndex;
      next[idx] = { ...next[idx], content: json };
      return next;
    });
  }, []);

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

  // After image upload in editor, auto-save
  const handleImageUploadEnd = useCallback(
    async (jsonDocument) => {
      if (!jsonDocument) return;

      const plainText = extractPlainText(jsonDocument);
      if (!plainText) return;

      const {
        title: currentTitle,
        storyType: currentType,
        storyIdState: currentId,
        chapters: currentChapters,
        activeChapterIndex: currentIdx,
      } = formStateRef.current;

      try {
        const updatedChapters = [...currentChapters];
        updatedChapters[currentIdx] = {
          ...updatedChapters[currentIdx],
          content: jsonDocument,
        };

        const payload = {
          chapters: updatedChapters,
          storyType: currentType,
        };
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

  // Load existing story
  useEffect(() => {
    if (!storyId || !author) return;
    storyApi
      .getMyStory(storyId)
      .then((s) => {
        setTitle(s.title || "");
        setStoryType(s.storyType || "autobiography");
        setStoryStatus(s.status);
        if (s.coverImage?.url) {
          setCoverPreview(s.coverImage.url);
          setCoverImage(s.coverImage);
        }
        if (s.language) setStoryLanguage(s.language);
        if (s.stats) setStoryStats(s.stats);

        // Load chapters
        if (s.chapters && s.chapters.length > 0) {
          const sorted = [...s.chapters].sort((a, b) => a.order - b.order);
          setChapters(sorted);
          setChapterContent(sorted[0].content || { type: "doc", content: [] });
          setActiveChapterIndex(0);
        } else if (s.content) {
          setChapters([{
            title: s.title || "Chapter 1",
            content: s.content,
            bannerImage: null,
            caption: "",
          }]);
          setChapterContent(s.content);
        }

        if (s.status === "rejected" || s.status === "failed") {
          setVerificationIssues(s.analysis?.issues || []);
          setCurrentStep("issues");
        } else if (s.status === "published") {
          setCurrentStep("published");
        } else if (PROCESSING_STATUSES.includes(s.status)) {
          setCurrentStep("verifying");
          startPolling(storyId);
        }
      })
      .catch(() => setError("Story not found"))
      .finally(() => setLoadingStory(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId, author]);

  // When switching chapters, load that chapter's content
  useEffect(() => {
    if (chapters[activeChapterIndex]) {
      setChapterContent(chapters[activeChapterIndex].content || { type: "doc", content: [] });
    }
  }, [activeChapterIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Persist ───
  async function persistStory() {
    if (coverImage instanceof File) {
      const fd = new FormData();
      fd.append("chapters", JSON.stringify(chapters));
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

    const payload = { chapters, storyType };
    if (title.trim()) payload.title = title.trim();

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
    if (story.chapters && story.chapters.length > 0) {
      const sorted = [...story.chapters].sort((a, b) => a.order - b.order);
      setChapters(sorted);
    }
  }

  async function handleSaveDraft() {
    const hasContent = chapters.some((ch) => {
      const plain = extractPlainText(ch.content);
      return plain.length > 0;
    });
    if (!hasContent) {
      setError("At least one chapter must have content");
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
    const hasContent = chapters.some((ch) => {
      const plain = extractPlainText(ch.content);
      return plain.length > 0;
    });
    if (!hasContent) {
      setError("At least one chapter must have content before submitting.");
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

  // ─── Step navigation ───
  function goToStep2() {
    if (!title.trim()) {
      setError("Story title is required to continue");
      return;
    }
    setError("");
    setEditorStep(2);
    // Auto-create story if it doesn't exist yet
    if (!storyIdState) {
      persistStory().then(({ id, story }) => {
        applySavedStory(story, id);
      }).catch(() => {});
    }
  }

  function goToStep1() {
    setEditorStep(1);
  }

  if (authLoading) return <LoadingScreen message="Loading..." />;
  if (!author) {
    navigate("/login");
    return null;
  }

  if (isEditMode && error && !loadingStory && !chapters.length) {
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

  const isLocked = PROCESSING_STATUSES.includes(storyStatus);

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <PollingModal
        pollStatus={pollStatus}
        pollMessage={pollMessage}
        issues={issues}
        onEditStory={handleEditAfterPoll}
        onBackToDashboard={handleBackToDashboard}
      />

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

      <div className="mt-6">
        <AnimatePresence mode="wait">
          {editorStep === 1 ? (
            <StoryDetailsStep
              key="details"
              title={title}
              setTitle={setTitle}
              storyType={storyType}
              setStoryType={setStoryType}
              storyLanguage={storyLanguage}
              coverPreview={coverPreview}
              coverFileRef={coverFileRef}
              handleCoverChange={handleCoverChange}
              slugPreview={slugPreview}
              storyStats={storyStats}
              isLocked={isLocked}
              onContinue={goToStep2}
              onCancel={() => navigate(-1)}
            />
          ) : (
            <ChapterEditorStep
              key="chapters"
              storyType={storyType}
              chapters={chapters}
              setChapters={setChapters}
              activeChapterIndex={activeChapterIndex}
              setActiveChapterIndex={setActiveChapterIndex}
              chapterContent={chapterContent}
              setChapterContent={setChapterContent}
              handleDocumentChange={handleDocumentChange}
              handleImageUploadEnd={handleImageUploadEnd}
              isLocked={isLocked}
              saving={saving}
              currentStep={currentStep}
              storyStatus={storyStatus}
              error={error}
              setError={setError}
              handleSaveDraft={handleSaveDraft}
              handleSubmit={handleSubmit}
              onBack={goToStep1}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
