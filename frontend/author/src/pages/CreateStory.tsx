import { useState, useCallback, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as storyApi from "../api/stories";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card, { CardContent, CardFooter } from "../components/ui/Card";
import StoryEditor from "../components/editor/StoryEditor";
import LoadingScreen from "../components/common/LoadingScreen";
import { Icons } from "../icons";
import toast from "react-hot-toast";

export default function StoryCreatePage() {
  const { author, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Polling state
  const [storyId, setStoryId] = useState<string | null>(null);
  const [pollStatus, setPollStatus] = useState<
    "idle" | "submitting" | "polling" | "success" | "failed"
  >("idle");
  const [pollMessage, setPollMessage] = useState("");
  const [issues, setIssues] = useState<
    Array<{ description: string; suggestion: string }>
  >([]);

  const handleContentChange = useCallback(
    (html: string) => setContent(html),
    [],
  );
  const stripHtml = (html: string): string =>
    html.replace(/<[^>]*>/g, "").trim();

  // Polling effect
  useEffect(() => {
    if (!storyId || pollStatus !== "polling") return;

    const interval = setInterval(async () => {
      try {
        const s = await storyApi.getMyStory(storyId);
        if (s.status === "published") {
          clearInterval(interval);
          setPollStatus("success");
          setPollMessage("Your story has been published successfully!");
          toast.success("Story published!");
          setTimeout(() => navigate(`/dashboard`), 2000);
        } else if (s.status === "rejected") {
          clearInterval(interval);
          setPollStatus("failed");
          setPollMessage("Your story was rejected during verification.");
          if (s.verification?.issues) {
            setIssues(s.verification.issues);
          }
          toast.error("Story was rejected");
        } else {
          setPollMessage(
            s.status === "draft"
              ? "Story is being processed..."
              : "Analyzing your story...",
          );
        }
      } catch {
        // continue polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [storyId, pollStatus, navigate]);

  async function handleCreateOnly(e: FormEvent) {
    e.preventDefault();
    const plainText = stripHtml(content);
    if (!title.trim() || !plainText) {
      setError("Title and content are required");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const story = await storyApi.create({
        title: title.trim(),
        content,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      toast.success("Story saved as draft!");
      navigate(`/stories/${story.id}/edit`);
    } catch (err: unknown) {
      const msg = (
        err as { response?: { data?: { error?: { message?: string } } } }
      )?.response?.data?.error?.message;
      setError(msg || "Failed to create story");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateAndSubmit(e: FormEvent) {
    e.preventDefault();
    const plainText = stripHtml(content);
    if (!title.trim() || !plainText) {
      setError("Title and content are required");
      return;
    }
    setError("");
    setPollStatus("submitting");

    try {
      const story = await storyApi.create({
        title: title.trim(),
        content,
      });
      const id = story.id;
      setStoryId(id);

      await storyApi.submit(id);
      setPollStatus("polling");
      setPollMessage("Story submitted! Analyzing your story...");
    } catch (err: unknown) {
      const msg = (
        err as { response?: { data?: { error?: { message?: string } } } }
      )?.response?.data?.error?.message;
      setError(msg || "Failed to submit story");
      setStoryId(null);
      setPollStatus("idle");
    }
  }


  const handleEnhanceWithAI = async () => {
    //todo: Implement AI enhancement logic here
    toast("Enhance with AI feature is not implemented yet.", {
      icon: "🤖",
    });
  }

  if (authLoading) return <LoadingScreen message="Loading..." />;
  if (!author) {
    navigate("/login");
    return null;
  }

  // Success state
  if (pollStatus === "success") {
    return (
      <div className="max-w-lg mx-auto py-20 px-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-6"
        >
          <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto">
            <Icons.checkCircle className="h-10 w-10 text-success" />
          </div>
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">Story Published! 🎉</h2>
        <p className="text-muted-foreground mb-6">{pollMessage}</p>
        <div className="w-12 h-1 bg-success rounded-full mx-auto animate-pulse" />
      </div>
    );
  }

  // Failed state
  if (pollStatus === "failed") {
    return (
      <div className="max-w-lg mx-auto py-20 px-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-6"
        >
          <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
            <Icons.exclamationCircle className="h-10 w-10 text-destructive" />
          </div>
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">Verification Issues Found</h2>
        <p className="text-muted-foreground mb-6">{pollMessage}</p>
        {issues.length > 0 && (
          <div className="text-left mb-6 space-y-3">
            {issues.map((issue, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-destructive/5 border border-destructive/20"
              >
                <p className="text-sm font-medium text-foreground">
                  {issue.description}
                </p>
                {issue.suggestion && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Suggestion: {issue.suggestion}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        <Button
          onClick={() => {
            setPollStatus("idle");
            setStoryId(null);
            navigate(`/stories/${storyId}/edit`);
          }}
        >
          Edit Story
        </Button>
      </div>
    );
  }

  // Polling state
  if (pollStatus === "polling") {
    return (
      <div className="max-w-lg mx-auto py-20 px-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-6"
        >
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <Icons.sparkles className="h-10 w-10 text-primary animate-pulse" />
          </div>
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">Analyzing Your Story</h2>
        <p className="text-muted-foreground mb-6">{pollMessage}</p>
        <div className="flex justify-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-6">
          This should only take a few seconds...
        </p>
      </div>
    );
  }




  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground">Write a Story</h1>
        <p className="text-muted-foreground mt-1">
          Your story will undergo AI verification before publishing.
        </p>
      </motion.div>

      <form onSubmit={handleCreateOnly}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6 space-y-5">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., The Last Sunrise"
                required
                icon={<Icons.edit className="h-4 w-4" />}
              />

              <StoryEditor
                content={content}
                onChange={handleContentChange}
                placeholder="Once upon a time... Write your story here..."
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
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>

            <CardFooter className="px-6 py-4 border-t border-border flex flex-wrap gap-3 justify-between">
              <Button
                type="button"
                onClick={handleEnhanceWithAI}
              >
                Enhance with AI
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  variant="outline"
                  loading={submitting}
                  icon={<Icons.save className="h-4 w-4" />}
                >
                  Save Draft
                </Button>
                <Button
                  type="button"
                  loading={pollStatus === "submitting"}
                  onClick={handleCreateAndSubmit}
                  icon={<Icons.documentAdd className="h-4 w-4" />}
                >
                  Submit
                </Button>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </form>
    </div>
  );
}
