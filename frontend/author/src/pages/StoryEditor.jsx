import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import * as storyApi from "../utils/client";
import LoadingScreen from "../components/common/LoadingScreen";
import { FlowOverview, PrimaryButton } from "../components/editor/wizardShared";
import { WizardShell } from "../components/editor/WizardShell";
import { Icons } from "../icons";
import toast from "react-hot-toast";

import SelectChapterStep from "../components/editor/SelectChapterStep";
import ChooseStoryTypeStep from "../components/editor/ChooseStoryTypeStep";
import StoryDetailsStep from "../components/editor/StoryDetailsStep";
import WriteStoryStep from "../components/editor/WriteStoryStep";
import AddMediaStep from "../components/editor/AddMediaStep";
import MoreDetailsStep from "../components/editor/MoreDetailsStep";
import VisibilityStep from "../components/editor/VisibilityStep";
import PreviewStoryStep from "../components/editor/PreviewStoryStep";
import PublishedStep from "../components/editor/PublishedStep";

function emptyStory() {
  return {
    title: "",
    storyType: "experience",
    content: "",
    dateLabel: "",
    location: "",
    media: [],
    visibility: "",
    status: "draft",
  };
}

function emptyChapter(idx = 0) {
  return {
    title: "",
    description: "",
    coverImage: null,
    media: [],
    visibility: "public",
    stories: [],
  };
}

export default function StoryEditorPage() {
  const { storyId } = useParams();
  const { author, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const isEditMode = Boolean(storyId);

  // "overview" → flow cover screen; then numeric wizard steps 1..10
  const [phase, setPhase] = useState(isEditMode ? 1 : "overview");

  // Lifebook-level state
  const [lifebookId, setLifebookId] = useState(storyId || null);
  const [lifebookTitle, setLifebookTitle] = useState("");
  const [lifebookVisibility, setLifebookVisibility] = useState("public");
  const [lifebookSummary, setLifebookSummary] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loaded, setLoaded] = useState(!isEditMode);

  // Wizard state
  const [selectedChapterIdx, setSelectedChapterIdx] = useState(0);
  const [draft, setDraft] = useState(emptyStory());
  const [savedSlug, setSavedSlug] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  // Load existing lifebook in edit mode
  useEffect(() => {
    if (!storyId || !author) return;
    storyApi
      .getMyStory(storyId)
      .then((s) => {
        setLifebookTitle(s.title || "");
        setLifebookVisibility(s.visibility || "public");
        setLifebookSummary(s.summary || "");
        setCoverImage(s.coverImage || null);
        setSavedSlug(s.slug || "");
        const sorted = [...(s.chapters || [])].sort((a, b) => a.order - b.order);
        setChapters(
          sorted.map((ch) => ({
            ...ch,
            id: ch._id || ch.id,
            stories: (ch.stories || []).map((st) => ({
              ...st,
              id: st._id || st.id,
            })),
          })),
        );
      })
      .catch(() => setError("Story not found"))
      .finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId, author]);

  const activeChapter = useMemo(
    () => chapters[selectedChapterIdx] || null,
    [chapters, selectedChapterIdx],
  );

  function createNewChapter() {
    const suggested = ["Childhood", "School Days", "College Life", "Career", "Marriage", "Family"];
    const ch = emptyChapter();
    ch.title = suggested[chapters.length] || `Chapter ${chapters.length + 1}`;
    setChapters((prev) => [...prev, ch]);
    setSelectedChapterIdx(chapters.length);
    setPhase(2);
  }

  /**
   * Creates the lifebook (if needed) and persists all chapters including
   * the in-progress story. Returns the saved story document.
   */
  async function ensureLifebookSaved({ publish = false } = {}) {
    const storyEntry = {
      ...draft,
      ...(draft.id ? { _id: draft.id } : {}),
      status: publish ? "published" : "draft",
    };

    const nextChapters = chapters.map((ch, idx) => {
      if (idx !== selectedChapterIdx) {
        return {
          ...(ch.id ? { _id: ch.id } : {}),
          title: ch.title,
          description: ch.description || "",
          coverImage: ch.coverImage || null,
          media: ch.media || [],
          visibility: ch.visibility || "public",
          stories: (ch.stories || []).map((st) => ({
            ...(st.id ? { _id: st.id } : {}),
            title: st.title || "",
            storyType: st.storyType || "experience",
            content: st.content || "",
            dateLabel: st.dateLabel || "",
            location: st.location || "",
            media: st.media || [],
            visibility: st.visibility || null,
            status: st.status === "published" ? "published" : "draft",
          })),
        };
      }

      // Selected chapter — replace the draft entry if it already exists
      const existingStories = (ch.stories || []).filter(
        (st) => !(draft.id && (st._id || st.id) === draft.id),
      );
      return {
        ...(ch.id ? { _id: ch.id } : {}),
        title: ch.title || `Chapter ${idx + 1}`,
        description: ch.description || "",
        coverImage: ch.coverImage || null,
        media: ch.media || [],
        visibility: ch.visibility || "public",
        stories: [...existingStories, storyEntry],
      };
    });

    let saved;
    if (lifebookId) {
      saved = await storyApi.update(lifebookId, { chapters: nextChapters });
    } else {
      const fd = new FormData();
      fd.append("chapters", JSON.stringify(nextChapters));
      fd.append(
        "title",
        lifebookTitle?.trim() || draft.title?.trim() || "My Lifebook",
      );
      fd.append("summary", lifebookSummary || "");
      fd.append("visibility", lifebookVisibility || "public");
      if (coverImage instanceof File) fd.append("coverImage", coverImage);

      saved = await storyApi.create(fd);
      setLifebookId(saved.id || saved._id);
      navigate(`/stories/${saved.id || saved._id}/edit`, { replace: true });
    }

    return saved;
  }

  async function handlePublish() {
    setError("");
    setPublishing(true);
    try {
      const saved = await ensureLifebookSaved({ publish: true });
      await storyApi.publish(saved.id || saved._id, {
        visibility: lifebookVisibility,
      });
      setSavedSlug(saved.slug || "");
      setDraft((d) => ({ ...d, status: "published" }));
      setPhase(10);
    } catch (err) {
      const msg = err?.response?.data?.error?.message || "Failed to publish story";
      setError(msg);
      toast.error(msg);
      setPhase(8);
    } finally {
      setPublishing(false);
    }
  }

  /** Save a draft without publishing (used on back-navigation safety). */
  async function handleSaveDraft() {
    try {
      await ensureLifebookSaved({ publish: false });
      toast.success("Draft saved");
    } catch {
      // Silent — draft save is best-effort
    }
  }

  if (authLoading || (isEditMode && !loaded)) {
    return <LoadingScreen message="Loading..." />;
  }
  if (!author) {
    navigate("/login");
    return null;
  }

  /* ---------- Flow overview (step 0 cover screen) ---------- */
  if (phase === "overview") {
    return (
      <FlowOverview
        onStart={() => {
          if (chapters.length === 0) {
            const ch = emptyChapter();
            ch.title = "Childhood";
            setChapters([ch]);
            setSelectedChapterIdx(0);
          }
          setPhase(1);
        }}
        onBack={() => navigate("/dashboard")}
      />
    );
  }

  /* ---------- Step 9 — publishing spinner ---------- */
  if (phase === 9) {
    return (
      <WizardShell step={9} totalSteps={10} title="Publish Story" onBack={null}>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Icons.spinner className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-5 font-display text-lg font-semibold text-foreground">
            Publishing your story…
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            This only takes a moment.
          </p>
          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        </div>
      </WizardShell>
    );
  }

  /* ---------- Wizard steps ---------- */
  switch (phase) {
    case 1:
      return (
        <SelectChapterStep
          chapters={chapters}
          onSelect={(idx) => {
            setSelectedChapterIdx(idx);
            setPhase(2);
          }}
          onCreateNew={createNewChapter}
          onBack={() => (isEditMode ? navigate("/dashboard") : setPhase("overview"))}
        />
      );

    case 2:
      return (
        <ChooseStoryTypeStep
          storyType={draft.storyType}
          onPick={(storyType) => setDraft((d) => ({ ...d, storyType }))}
          onContinue={() => setPhase(3)}
          onBack={() => setPhase(1)}
        />
      );

    case 3:
      return (
        <StoryDetailsStep
          story={draft}
          onChange={setDraft}
          onContinue={() => setPhase(4)}
          onBack={() => setPhase(2)}
        />
      );

    case 4:
      return (
        <WriteStoryStep
          story={draft}
          onChange={setDraft}
          onContinue={() => setPhase(5)}
          onBack={() => setPhase(3)}
        />
      );

    case 5:
      return (
        <AddMediaStep
          story={draft}
          onChange={setDraft}
          onContinue={() => setPhase(6)}
          onBack={() => setPhase(4)}
        />
      );

    case 6:
      return (
        <MoreDetailsStep
          story={{ summary: lifebookSummary }}
          chapter={activeChapter}
          onChangeStory={(s) => setLifebookSummary(s.summary || "")}
          onChangeChapter={(ch) =>
            setChapters((prev) =>
              prev.map((c, i) => (i === selectedChapterIdx ? { ...c, ...ch } : c)),
            )
          }
          onContinue={() => setPhase(7)}
          onBack={() => setPhase(5)}
        />
      );

    case 7:
      return (
        <VisibilityStep
          visibility={lifebookVisibility}
          onChange={(v) => {
            setLifebookVisibility(v);
            setDraft((d) => ({ ...d, visibility: v }));
          }}
          onContinue={() => {
            handleSaveDraft();
            setPhase(8);
          }}
          onBack={() => setPhase(6)}
        />
      );

    case 8:
      return (
        <PreviewStoryStep
          story={draft}
          chapter={activeChapter}
          chapterIndex={selectedChapterIdx}
          onPublish={() => {
            setPhase(9);
            handlePublish();
          }}
          onBack={() => setPhase(4)}
        />
      );

    case 10:
      return (
        <PublishedStep
          storyUrl={savedSlug ? `/feed/story/${savedSlug}` : ""}
          onAddAnother={() => {
            setDraft(emptyStory());
            setSelectedChapterIdx(0);
            setPhase(2);
          }}
          onGoLifebook={() => navigate("/dashboard")}
          onBack={() => navigate("/dashboard")}
        />
      );

    default:
      return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <PrimaryButton onClick={() => setPhase(1)}>Start over</PrimaryButton>
        </div>
      );
  }
}
