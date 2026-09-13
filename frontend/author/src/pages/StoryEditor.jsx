import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import * as storyApi from "../utils/client";
import LoadingScreen from "../components/common/LoadingScreen";
import { WizardShell, PrimaryButton } from "../components/story/WizardShell";
import { Icons } from "../icons";
import toast from "react-hot-toast";

import SelectChapterStep from "../components/story/SelectChapterStep";
import ChooseStoryTypeStep from "../components/story/ChooseStoryTypeStep";
import StoryDetailsStep from "../components/story/StoryDetailsStep";
import WriteStoryStep from "../components/story/WriteStoryStep";
import AddMediaStep from "../components/story/AddMediaStep";
import VisibilityStep from "../components/story/VisibilityStep";
import PreviewStoryStep from "../components/story/PreviewStoryStep";
import PublishedStep from "../components/story/PublishedStep";

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
  const [searchParams] = useSearchParams();
  // ?story=<id> → jump straight into editing that specific story entry
  const editStoryEntryId = searchParams.get("story");
  const { author, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const isEditMode = Boolean(storyId);

  // Wizard steps 1..9 (the "how to write" guide lives on the Home page)
  const [phase, setPhase] = useState(1);

  // Lifebook-level state
  const [lifebookId, setLifebookId] = useState(storyId || null);
  const [lifebookTitle, setLifebookTitle] = useState("");
  const [lifebookVisibility, setLifebookVisibility] = useState("public");
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
        setCoverImage(s.coverImage || null);
        setSavedSlug(s.slug || "");
        const sorted = [...(s.chapters || [])].sort((a, b) => a.order - b.order);
        const mapped = sorted.map((ch) => ({
          ...ch,
          id: ch._id || ch.id,
          stories: (ch.stories || []).map((st) => ({
            ...st,
            id: st._id || st.id,
          })),
        }));
        setChapters(mapped);

        // Deep-link: ?story=<id> → load that story entry and jump into
        // its details step (editing an existing story, not writing new).
        if (editStoryEntryId) {
          for (let ci = 0; ci < mapped.length; ci++) {
            const entry = (mapped[ci].stories || []).find(
              (st) => String(st.id) === String(editStoryEntryId),
            );
            if (entry) {
              setSelectedChapterIdx(ci);
              setDraft({ ...emptyStory(), ...entry });
              setPhase(3);
              break;
            }
          }
        }
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
      fd.append("visibility", lifebookVisibility || "public");
      if (coverImage instanceof File) fd.append("coverImage", coverImage);

      saved = await storyApi.create(fd);
      setLifebookId(saved.id || saved._id);
      navigate(`/stories/${saved.id || saved._id}/edit`, { replace: true });
    }

    return saved;
  }

  async function handlePublish() {
    // Publishing requires a completed profile (enforced server-side too).
    if (!author?.isProfileCompleted) {
      toast.error("Complete your profile to publish your story");
      navigate("/profile?complete=1");
      return;
    }
    setError("");
    setPublishing(true);
    try {
      const saved = await ensureLifebookSaved({ publish: true });
      await storyApi.publish(saved.id || saved._id, {
        visibility: lifebookVisibility,
      });
      setSavedSlug(saved.slug || "");
      setDraft((d) => ({ ...d, status: "published" }));
      setPhase(9);
    } catch (err) {
      const msg = err?.response?.data?.error?.message || "Failed to publish story";
      setError(msg);
      toast.error(msg);
      setPhase(7);
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

  /* ---------- Step 8 — publishing spinner ---------- */
  if (phase === 8) {
    return (
      <WizardShell step={8} totalSteps={9} title="Publish Story" onBack={null}>
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
          onBack={() => navigate("/")}
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
        <VisibilityStep
          visibility={lifebookVisibility}
          onChange={(v) => {
            setLifebookVisibility(v);
            setDraft((d) => ({ ...d, visibility: v }));
          }}
          onContinue={() => {
            handleSaveDraft();
            setPhase(7);
          }}
          onBack={() => setPhase(5)}
        />
      );

    case 7:
      return (
        <PreviewStoryStep
          story={draft}
          chapter={activeChapter}
          chapterIndex={selectedChapterIdx}
          onPublish={() => {
            setPhase(8);
            handlePublish();
          }}
          onBack={() => setPhase(4)}
        />
      );

    case 9:
      return (
        <PublishedStep
          storyUrl={savedSlug ? `/feed/story/${savedSlug}` : ""}
          onAddAnother={() => {
            setDraft(emptyStory());
            setSelectedChapterIdx(0);
            setPhase(2);
          }}
          onGoLifebook={() => navigate("/")}
          onBack={() => navigate("/")}
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
