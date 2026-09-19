import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import * as storyApi from "../utils/client";
import LoadingScreen from "../components/common/LoadingScreen";
import { WizardShell, PrimaryButton } from "../components/story/WizardShell";
import { Icons } from "../icons";
import toast from "react-hot-toast";

import SelectChapterStep, {
  FIXED_CHAPTERS,
  resolvePick,
} from "../components/story/SelectChapterStep";
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
    // null = inherit the chapter's visibility. Never an empty string:
    // the API only accepts the three levels or null.
    visibility: null,
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

function normTitle(t) {
  return String(t || "").trim().toLowerCase();
}

export default function StoryEditorPage() {
  const { storyId } = useParams();
  const [searchParams] = useSearchParams();
  // ?story=<id> → jump straight into editing that specific story entry
  const editStoryEntryId = searchParams.get("story");
  // ?publish=1 → returned from completing the profile; resume publishing
  const wantsPublish = searchParams.get("publish") === "1";
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
  // Whether we've already tried adopting the author's existing lifebook
  // when starting /stories/new (so every story lands in ONE lifebook,
  // not a new lifebook per story).
  const [adoptTried, setAdoptTried] = useState(isEditMode);
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
        setAdoptTried(true);

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

        // Returning from the profile-completion flow (?publish=1): load
        // the most recently saved draft entry and resume at the publish
        // step so the author can submit right away.
        if (wantsPublish && !editStoryEntryId) {
          let best = null;
          let bestCi = -1;
          let bestTs = -1;
          mapped.forEach((ch, ci) => {
            (ch.stories || []).forEach((st) => {
              if (st.status === "published") return;
              const ts = new Date(st.updatedAt || st.createdAt || 0).getTime();
              if (ts >= bestTs) {
                bestTs = ts;
                best = st;
                bestCi = ci;
              }
            });
          });
          if (best) {
            setSelectedChapterIdx(bestCi);
            setDraft({ ...emptyStory(), ...best });
            setPhase(7);
          }
        }
      })
      .catch(() => setError("Story not found"))
      .finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId, author]);

  // Fresh /stories/new: adopt the author's existing lifebook (if any) so
  // new stories append to it instead of creating duplicate lifebooks.
  useEffect(() => {
    if (isEditMode || !author || adoptTried) return;
    setAdoptTried(true);
    storyApi
      .getMyStories()
      .then((mine) => {
        const existing = (mine || []).find((b) => (b.chapters || []).length > 0);
        if (!existing) return;
        const sorted = [...(existing.chapters || [])].sort(
          (a, b) => a.order - b.order,
        );
        setLifebookId(existing.id || existing._id);
        setLifebookTitle(existing.title || "");
        setLifebookVisibility(existing.visibility || "public");
        setChapters(
          sorted.map((ch) => ({
            ...ch,
            id: ch._id || ch.id,
            stories: (ch.stories || []).map((st) => ({ ...st, id: st._id || st.id })),
          })),
        );
        navigate(`/stories/${existing.id || existing._id}/edit`, { replace: true });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [author, adoptTried, isEditMode]);

  const activeChapter = useMemo(
    () => chapters[selectedChapterIdx] || null,
    [chapters, selectedChapterIdx],
  );

  /**
   * Creates a local chapter row. Fixed chapters carry their canonical
   * title + description; custom chapters get a generic title.
   */
  function makeChapter(title, hint) {
    const ch = emptyChapter();
    ch.title = title || `Chapter ${(chapters?.length || 0) + 1}`;
    ch.description = hint || "";
    return ch;
  }

  /**
   * Chapter picked on the Select Chapter screen. Fixed chapters that
   * don't exist yet are created on the fly; existing ones are selected.
   */
  function handleChapterPick(title) {
    const existingIdx = chapters.findIndex(
      (ch) => normTitle(ch.title) === normTitle(title),
    );
    if (existingIdx !== -1) {
      setSelectedChapterIdx(existingIdx);
      setPhase(2);
      return;
    }

    const fixed = FIXED_CHAPTERS.find(
      (f) => normTitle(f.title) === normTitle(title),
    );
    const ch = makeChapter(title, fixed?.hint);
    setChapters((prev) => [...prev, ch]);
    setSelectedChapterIdx(chapters.length); // new chapter lands at the end
    setPhase(2);
  }

  /** Brand-new custom chapter (the dashed "Create New Chapter" tile). */
  function createNewChapter() {
    const ch = makeChapter();
    setChapters((prev) => [...prev, ch]);
    setSelectedChapterIdx(chapters.length);
    setPhase(2);
  }

  /**
   * Normalizes a saved lifebook document into local wizard state and syncs
   * ids (chapters + story entries) so subsequent saves UPDATE instead of
   * duplicating rows.
   */
  function syncFromSaved(saved) {
    if (!saved) return;
    const sorted = [...(saved.chapters || [])].sort((a, b) => a.order - b.order);
    const mapped = sorted.map((ch) => ({
      ...ch,
      id: ch._id || ch.id,
      stories: (ch.stories || []).map((st) => ({ ...st, id: st._id || st.id })),
    }));
    setChapters(mapped);

    // Re-point the draft at its saved entry (by id, or by title+chapter
    // match for the very first save when no id existed yet).
    setDraft((d) => {
      if (d.id) return d;
      const ch = mapped[selectedChapterIdx];
      const match = (ch?.stories || []).find(
        (st) => st.title === d.title && st.content === d.content,
      );
      return match ? { ...d, id: match.id } : d;
    });
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
    });    let saved;
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
      // Preserve query params (publish=1 / story=<id>) across the URL swap
      const qs = searchParams.toString();
      navigate(
        `/stories/${saved.id || saved._id}/edit${qs ? `?${qs}` : ""}`,
        { replace: true },
      );
    }

    // Critical: sync server-assigned ids back into local state so the next
    // save updates rows instead of inserting duplicates.
    syncFromSaved(saved);

    return saved;
  }

  async function handlePublish() {
    // Publishing requires a completed profile (enforced server-side too).
    // Save the story as a draft FIRST so nothing is lost, then send the
    // author to complete their profile — they come straight back here.
    if (!author?.isProfileCompleted) {
      toast.error("Complete your profile to publish your story");
      try {
        await ensureLifebookSaved({ publish: false });
      } catch {
        // best-effort
      }
      const returnUrl = lifebookId
        ? `/stories/${lifebookId}/edit?publish=1`
        : `/stories/new?publish=1`;
      // Profile completion is its own page now (with avatar/cover cropping);
      // it sends the author straight back to the publish step afterwards.
      navigate(
        `/profile/edit?complete=1&redirect=${encodeURIComponent(returnUrl)}`,
      );
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

  /** Save a draft without publishing (used when leaving the wizard). */
  async function handleSaveDraft({ silent = true } = {}) {
    try {
      await ensureLifebookSaved({ publish: false });
      if (!silent) toast.success("Draft saved");
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
          onPick={handleChapterPick}
          onCreateNew={createNewChapter}
          onBack={() => {
            handleSaveDraft();
            navigate("/profile");
          }}
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
          onChange={(updater) =>
            // Supports both plain objects and functional updates (used by
            // the media step's video status polling).
            typeof updater === "function"
              ? setDraft((d) => updater(d))
              : setDraft(updater)
          }
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
            setPhase(7);
            handleSaveDraft();
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
            setPhase(1);
          }}
          onGoLifebook={() => navigate("/profile")}
          onBack={() => navigate("/profile")}
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
