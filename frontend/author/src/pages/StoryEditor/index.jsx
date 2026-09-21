import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import * as storyApi from "../../utils/storyApi";
import LoadingScreen from "../../components/common/LoadingScreen";
import { findChapter, nextChapterOrder, sortChapters, suggestedTitle } from "../../utils/chapters";
import { Icons } from "../../icons";

import { WizardShell, PrimaryButton } from "./components/WizardShell";
import SelectChapterStep from "./components/SelectChapterStep";
import ChooseStoryTypeStep from "./components/ChooseStoryTypeStep";
import StoryDetailsStep from "./components/StoryDetailsStep";
import WriteStoryStep from "./components/WriteStoryStep";
import AddMediaStep from "./components/AddMediaStep";
import VisibilityStep from "./components/VisibilityStep";
import PreviewStoryStep from "./components/PreviewStoryStep";
import PublishedStep from "./components/PublishedStep";
import {
  emptyChapter,
  emptyStory,
  findExistingLifebook,
  latestDraft,
  toLocalChapters,
  toStoryEntry,
} from "./utils";

const TOTAL_STEPS = 9;

/**
 * The story writing flow.
 *
 * Nine steps take an author from picking a chapter to a published story, and
 * the wizard autosaves as a draft so a closed tab never loses work. The
 * wizard only drives the flow — the shape conversions live in `utils.js` and
 * every screen is one of its own components.
 */
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

  const [phase, setPhase] = useState(1);

  // Lifebook-level state
  const [lifebookId, setLifebookId] = useState(storyId || null);
  const [lifebookTitle, setLifebookTitle] = useState("");
  const [lifebookVisibility, setLifebookVisibility] = useState("public");
  const [bannerImage, setBannerImage] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loaded, setLoaded] = useState(!isEditMode);
  // Whether we've already tried adopting the author's existing lifebook when
  // starting /stories/new (so every story lands in ONE lifebook).
  const [adoptTried, setAdoptTried] = useState(isEditMode);

  // Wizard state — the chapter being written, identified by its slot in the
  // life story structure, plus the story being written.
  const [activeOrder, setActiveOrder] = useState(0);
  const [draft, setDraft] = useState(emptyStory());
  const [savedSlug, setSavedSlug] = useState("");
  const [error, setError] = useState("");

  /* ---------- Loading ---------- */

  // Edit mode: open the author's lifebook, and honour the deep links.
  useEffect(() => {
    if (!storyId || !author) return;

    storyApi
      .getMyStory(storyId)
      .then((saved) => {
        setLifebookTitle(saved.title || "");
        setLifebookVisibility(saved.visibility || "public");
        setBannerImage(saved.bannerImage || null);
        setSavedSlug(saved.slug || "");

        const mapped = toLocalChapters(saved.chapters);
        setChapters(mapped);
        setAdoptTried(true);

        // ?story=<id> → open that story straight at its details step.
        if (editStoryEntryId) {
          for (const chapter of mapped) {
            const entry = (chapter.stories || []).find(
              (st) => String(st.id) === String(editStoryEntryId),
            );
            if (entry) {
              setActiveOrder(chapter.order);
              setDraft({ ...emptyStory(), ...entry });
              setPhase(3);
              break;
            }
          }
        }

        // ?publish=1 → reopen the draft they are publishing, at step 7.
        if (wantsPublish && !editStoryEntryId) {
          const pending = latestDraft(mapped);
          if (pending) {
            setActiveOrder(pending.chapter.order);
            setDraft({ ...emptyStory(), ...pending.story });
            setPhase(7);
          }
        }
      })
      .catch(() => setError("Story not found"))
      .finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId, author]);

  // Fresh /stories/new: adopt the author's existing lifebook (if any) so new
  // stories append to it instead of creating duplicate lifebooks.
  useEffect(() => {
    if (isEditMode || !author || adoptTried) return;
    setAdoptTried(true);

    findExistingLifebook()
      .then((existing) => {
        if (!existing) return;

        const id = existing.id || existing._id;
        setLifebookId(id);
        setLifebookTitle(existing.title || "");
        setLifebookVisibility(existing.visibility || "public");
        setChapters(toLocalChapters(existing.chapters));
        navigate(`/stories/${id}/edit`, { replace: true });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [author, adoptTried, isEditMode]);

  /* ---------- Saving ---------- */

  /**
   * Normalizes a saved lifebook into local state and syncs ids (chapters and
   * story entries) so the next save UPDATEs instead of duplicating rows.
   */
  function syncFromSaved(saved) {
    if (!saved) return;

    const mapped = toLocalChapters(saved.chapters);
    setChapters(mapped);

    // Re-point the draft at its saved entry (by id, or by content match for
    // the very first save when no id existed yet).
    setDraft((current) => {
      if (current.id) return current;

      const chapter = findChapter(mapped, activeOrder);
      const match = (chapter?.stories || []).find(
        (st) => st.title === current.title && st.content === current.content,
      );
      return match ? { ...current, id: match.id } : current;
    });
  }

  /**
   * Creates the lifebook (if needed) and persists every chapter including the
   * in-progress story. Returns the saved lifebook.
   */
  async function ensureLifebookSaved({ publish = false } = {}) {
    const storyEntry = {
      ...toStoryEntry(draft),
      status: publish ? "published" : "draft",
    };

    const nextChapters = sortChapters(chapters).map((chapter) => {
      const isActive = Number(chapter.order) === Number(activeOrder);

      // A story belongs to exactly one chapter, so it is dropped from every
      // other chapter first — moving it between chapters therefore never
      // leaves the same story behind twice.
      const stories = (chapter.stories || [])
        .map(toStoryEntry)
        .filter((st) => !(draft.id && st._id === draft.id));

      const order = Number(chapter.order) || 0;
      return {
        ...(chapter.id ? { _id: chapter.id } : {}),
        order,
        title: chapter.title?.trim() || suggestedTitle(order),
        stories: isActive ? [...stories, storyEntry] : stories,
      };
    });

    let saved;
    if (lifebookId) {
      saved = await storyApi.update(lifebookId, { chapters: nextChapters });
    } else {
      const body = new FormData();
      body.append("chapters", JSON.stringify(nextChapters));
      body.append(
        "title",
        lifebookTitle?.trim() || draft.title?.trim() || "My Lifebook",
      );
      body.append("visibility", lifebookVisibility || "public");
      if (bannerImage instanceof File) body.append("bannerImage", bannerImage);

      saved = await storyApi.create(body);

      const id = saved.id || saved._id;
      setLifebookId(id);
      // Preserve query params (publish=1 / story=<id>) across the URL swap
      const query = searchParams.toString();
      navigate(`/stories/${id}/edit${query ? `?${query}` : ""}`, {
        replace: true,
      });
    }

    // Critical: sync server-assigned ids back into local state so the next
    // save updates rows instead of inserting duplicates.
    syncFromSaved(saved);
    return saved;
  }

  /** Save a draft without publishing (used while writing, and on leaving). */
  async function handleSaveDraft({ silent = true } = {}) {
    try {
      await ensureLifebookSaved({ publish: false });
      if (!silent) toast.success("Draft saved");
    } catch {
      // Silent — draft save is best-effort
    }
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
      navigate(
        `/profile/edit?complete=1&redirect=${encodeURIComponent(returnUrl)}`,
      );
      return;
    }

    setError("");
    try {
      const saved = await ensureLifebookSaved({ publish: true });
      await storyApi.publish(saved.id || saved._id, {
        visibility: lifebookVisibility,
      });

      setSavedSlug(saved.slug || "");
      setDraft((current) => ({ ...current, status: "published" }));
      setPhase(9);
    } catch (err) {
      const message =
        err?.response?.data?.error?.message || "Failed to publish story";
      setError(message);
      toast.error(message);
      setPhase(7);
    }
  }

  // Autosave: saves the draft a couple of seconds after typing stops, so a
  // closed tab never loses work. Skipped before the author has written
  // anything, and once published.
  const lastAutosaveRef = useRef("");

  useEffect(() => {
    if (phase < 3) return;
    if (!draft.title?.trim() && !draft.content?.trim()) return;
    if (draft.status === "published") return;

    const signature = `${draft.id || ""}|${draft.title || ""}|${draft.content || ""}`;
    if (lastAutosaveRef.current === signature) return;

    const timer = setTimeout(() => {
      lastAutosaveRef.current = signature;
      handleSaveDraft();
    }, 2000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, draft.id, draft.title, draft.content, draft.status]);

  /* ---------- Chapter selection ---------- */

  const activeChapter = useMemo(
    () => findChapter(chapters, activeOrder),
    [chapters, activeOrder],
  );

  /**
   * Chapter picked on the Select Chapter screen. A slot the lifebook has
   * already reached is simply opened; an untouched one is created.
   */
  function handleChapterPick(order) {
    if (!findChapter(chapters, order)) {
      setChapters((prev) => [...prev, emptyChapter(order)]);
    }
    setActiveOrder(order);
    setPhase(2);
  }

  /**
   * Add a chapter after the ones the lifebook already holds, under a name the
   * author chose (or the name of the slot it lands in).
   */
  function addAnotherChapter(title) {
    const nextOrder = nextChapterOrder(chapters);
    setChapters((prev) => [...prev, emptyChapter(nextOrder, title)]);
    setActiveOrder(nextOrder);
    setPhase(2);
  }

  /* ---------- Render ---------- */

  if (authLoading || (isEditMode && !loaded)) {
    return <LoadingScreen message="Loading..." />;
  }
  if (!author) {
    navigate("/login");
    return null;
  }

  /** Step 8 — the publishing spinner. */
  if (phase === 8) {
    return (
      <WizardShell step={8} totalSteps={TOTAL_STEPS} title="Publish Story" onBack={null}>
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

  switch (phase) {
    case 1:
      return (
        <SelectChapterStep
          chapters={chapters}
          onPick={handleChapterPick}
          onAddChapter={addAnotherChapter}
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
            // Supports both plain objects and functional updates (used by the
            // media step's upload progress).
            typeof updater === "function"
              ? setDraft((current) => updater(current))
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
          onChange={(visibility) => {
            setLifebookVisibility(visibility);
            setDraft((d) => ({ ...d, visibility }));
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
          chapterOrder={activeOrder}
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
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <PrimaryButton onClick={() => setPhase(1)}>Start over</PrimaryButton>
        </div>
      );
  }
}
