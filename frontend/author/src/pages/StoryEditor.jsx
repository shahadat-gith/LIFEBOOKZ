import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as storyApi from "../utils/client";
import { useAuth } from "../context/AuthContext";

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

import { Icons } from "../icons";
import toast from "react-hot-toast";

const TYPE_PLACEHOLDERS = {
  autobiography: "Document your life journey, personal milestones, key memories, or core lessons learned...",
  biography: "Share their life journey, heritage, achievements, and lasting legacy...",
  legend: "Record the life, impactful accomplishments, and extraordinary legacy of this individual...",
};

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
  // document now stores TipTap JSON (from editor.getJSON())
  const [document, setDocument] = useState(null);
  const [storyType, setStoryType] = useState("autobiography");
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [storyStatus, setStoryStatus] = useState("");
  const [storyLanguage, setStoryLanguage] = useState("");
  const [storyStats, setStoryStats] = useState(null);
  const [currentStep, setCurrentStep] = useState("writing");
  const coverFileRef = useRef(null);

  const formStateRef = useRef({ title, document, storyType, storyIdState });
  useEffect(() => {
    formStateRef.current = { title, document, storyType, storyIdState };
  }, [title, document, storyType, storyIdState]);

  const [loadingStory, setLoadingStory] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [verificationIssues, setVerificationIssues] = useState([]);
  const [overallAssessment, setOverallAssessment] = useState("");

  // onChange receives TipTap JSON from the editor
  const handleDocumentChange = useCallback((json) => setDocument(json), []);

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

  // After image upload, auto-save the document JSON
  const handleImageUploadEnd = useCallback(
    async (jsonDocument) => {
      if (!jsonDocument) return;
      setDocument(jsonDocument);

      const plainText = extractPlainText(jsonDocument);
      if (!plainText) return;

      const { title: currentTitle, storyType: currentType, storyIdState: currentId } =
        formStateRef.current;

      try {
        const payload = { document: jsonDocument, storyType: currentType };
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
    [navigate]
  );

  useEffect(() => {
    if (!storyId || !author) return;
    storyApi
      .getMyStory(storyId)
      .then((s) => {
        setTitle(s.title || "");
        // Pass the document as-is (could be JSON object or HTML string for backward compat)
        setDocument(s.document || null);
        setStoryType(s.storyType || "autobiography");
        setStoryStatus(s.status);
        if (s.coverImage?.url) {
          setCoverPreview(s.coverImage.url);
          setCoverImage(s.coverImage);
        }
        if (s.language) setStoryLanguage(s.language);
        if (s.stats) setStoryStats(s.stats);
        if (s.status === "verified") setCurrentStep("verified");
      })
      .catch(() => setError("Story not found"))
      .finally(() => setLoadingStory(false));
  }, [storyId, author]);

  async function handleSaveDraft(e) {
    e.preventDefault();
    const plainText = extractPlainText(document);
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
      const payload = { document, storyType };
      if (title.trim()) payload.title = title.trim();
      let savedStory;

      if (coverImage instanceof File) {
        const fd = new FormData();
        fd.append("document", JSON.stringify(document));
        fd.append("title", title.trim());
        fd.append("storyType", storyType);
        fd.append("coverImage", coverImage);

        if (storyIdState) {
          savedStory = await storyApi.update(storyIdState, fd);
        } else {
          const story = await storyApi.create(fd);
          const newId = story.id || story._id;
          setStoryIdState(newId);
          navigate(`/stories/${newId}/edit`, { replace: true });
          savedStory = story;
        }
      } else {
        if (storyIdState) {
          savedStory = await storyApi.update(storyIdState, payload);
        } else {
          const story = await storyApi.create(payload);
          const newId = story.id || story._id;
          setStoryIdState(newId);
          navigate(`/stories/${newId}/edit`, { replace: true });
          savedStory = story;
        }
      }

      // Update local state from saved story
      if (savedStory) {
        setStoryStatus(savedStory.status);
        setStoryLanguage(savedStory.language || "");
        setStoryStats(savedStory.stats || null);
        if (savedStory.coverImage?.url) setCoverPreview(savedStory.coverImage.url);
      }

      // For published stories: run AI verification after saving
      if (storyStatus === "published" && storyIdState) {
        setCurrentStep("verifying");
        try {
          const result = await storyApi.verify(storyIdState, { keepPublished: true });
          setVerificationIssues(result.issues || []);
          setOverallAssessment(result.overallAssessment || "");

          if (result.canProceed) {
            setCurrentStep("writing");
            setStoryStatus("published");
            toast.success("Changes saved and verified successfully!");
          } else {
            setCurrentStep("issues");
            setStoryStatus("rejected");
            toast.error("AI found issues with your changes.");
          }
        } catch {
          // Verification failed silently, keep published
          setCurrentStep("writing");
          toast.success("Changes saved successfully.");
        }
      } else {
        setCurrentStep("writing");
        setVerificationIssues([]);
        toast.success("Draft saved successfully");
      }
    } catch (err) {
      const msg = err?.response?.data?.error?.message || "Failed to save story";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleVerify() {
    const plainText = extractPlainText(document);
    if (!plainText) {
      setError("Write your story before submitting for review.");
      return;
    }

    const isResubmit = currentStep === "issues";

    setError("");
    setCurrentStep("verifying");
    try {
      let id = storyIdState || storyId;

      // Include cover image if present
      if (id && coverImage instanceof File) {
        const fd = new FormData();
        fd.append("document", JSON.stringify(document));
        fd.append("title", title.trim());
        fd.append("storyType", storyType);
        fd.append("coverImage", coverImage);
        await storyApi.update(id, fd);
      } else if (id) {
        const payload = { document, storyType };
        if (title.trim()) payload.title = title.trim();
        await storyApi.update(id, payload);
      } else if (coverImage instanceof File) {
        const fd = new FormData();
        fd.append("document", JSON.stringify(document));
        fd.append("title", title.trim());
        fd.append("storyType", storyType);
        fd.append("coverImage", coverImage);
        const story = await storyApi.create(fd);
        id = story.id || story._id;
        setStoryIdState(id);
        navigate(`/stories/${id}/edit`, { replace: true });
      } else {
        const payload = { document, storyType };
        if (title.trim()) payload.title = title.trim();
        const story = await storyApi.create(payload);
        id = story.id || story._id;
        setStoryIdState(id);
        navigate(`/stories/${id}/edit`, { replace: true });
      }

      if (!id) throw new Error("Failed to get story ID");

      const result = await storyApi.verify(id);
      setVerificationIssues(result.issues || []);
      setOverallAssessment(result.overallAssessment || "");

      if (result.canProceed) {
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
    } catch (err) {
      const msg = err?.response?.data?.error?.message || "Verification failed";
      setError(msg);
      setCurrentStep("writing");
    }
  }

  async function handlePublish() {
    const id = storyIdState || storyId;
    if (!id) {
      setError("Story ID not found.");
      return;
    }
    setError("");
    setCurrentStep("publishing");
    try {
      await storyApi.publish(id);
      setCurrentStep("published");
      toast.success("Story published successfully!");
      setTimeout(() => navigate("/dashboard"), 2500);
    } catch (err) {
      const msg = err?.response?.data?.error?.message || "Failed to publish story";
      setError(msg);
      setCurrentStep("verified");
    }
  }

  if (authLoading) return <LoadingScreen message="Loading..." />;
  if (!author) {
    navigate("/login");
    return null;
  }

  if (isEditMode && error && !loadingStory && !document) {
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

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <PublishingOverlay currentStep={currentStep} />

      <StoryHeader
        isEditMode={isEditMode}
        storyStatus={storyStatus}
        currentStep={currentStep}
      />

      <VerificationBanner
        currentStep={currentStep}
        overallAssessment={overallAssessment}
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
              />

              <CoverImageUploader
                coverPreview={coverPreview}
                coverFileRef={coverFileRef}
                handleCoverChange={handleCoverChange}
              />

              <Editor
                key={storyType}
                content={document}
                onChange={handleDocumentChange}
                onImageUploadEnd={handleImageUploadEnd}
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
              handlePublish={handlePublish}
              handleVerify={handleVerify}
              onCancel={() => navigate(-1)}
            />
          </Card>
        </motion.div>
      </form>
    </div>
  );
}
