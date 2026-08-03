import { useEffect, useState, useCallback } from "react";
import api from "../config/api";

export function usePolling(onSuccess) {
  const [storyId, setStoryId] = useState(null);
  const [pollStatus, setPollStatus] = useState("idle");
  const [pollMessage, setPollMessage] = useState("");
  const [issues, setIssues] = useState([]);
  const [storyStatus, setStoryStatus] = useState(null);

  useEffect(() => {
    if (!storyId || pollStatus !== "polling") return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/authors/me/stories/${storyId}/status`);
        const story = res.data.data;
        setStoryStatus(story.status);
        if (story.status === "published") {
          clearInterval(interval);
          setPollStatus("success");
          setPollMessage("Your story has been published successfully!");
          if (onSuccess) onSuccess();
        } else if (story.status === "rejected") {
          clearInterval(interval);
          setPollStatus("failed");
          setPollMessage("Your story was rejected during verification.");
          if (story.analysis?.issues) {
            setIssues(story.analysis.issues);
          }
        } else if (story.status === "failed") {
          clearInterval(interval);
          setPollStatus("failed");
          setPollMessage(
            "Your story could not be processed. You can edit and resubmit it.",
          );
          if (story.analysis?.issues) {
            setIssues(story.analysis.issues);
          }
        } else {
          setPollMessage(
            story.status === "draft"
              ? "Story is being processed..."
              : "Analysing your story — this may take up to 3–4 minutes.",
          );
        }
      } catch {
        // continue polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [storyId, pollStatus, onSuccess]);

  const startPolling = useCallback((id) => {
    setStoryId(id);
    setPollStatus("polling");
    setPollMessage("Story submitted! Analysing your story — this may take up to 3–4 minutes.");
    setIssues([]);
    setStoryStatus(null);
  }, []);

  const stopPolling = useCallback(() => {
    setPollStatus("idle");
    setStoryId(null);
  }, []);

  const resetPolling = useCallback(() => {
    setPollStatus("idle");
    setPollMessage("");
    setIssues([]);
    setStoryId(null);
    setStoryStatus(null);
  }, []);

  return {
    pollStatus,
    pollMessage,
    issues,
    storyStatus,
    startPolling,
    stopPolling,
    resetPolling,
  };
}
