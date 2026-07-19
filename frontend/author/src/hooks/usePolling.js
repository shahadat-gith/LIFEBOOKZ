import { useEffect, useState, useCallback } from "react";
import api from "../config/api";

export function usePolling(onSuccess) {
  const [storyId, setStoryId] = useState(null);
  const [pollStatus, setPollStatus] = useState("idle");
  const [pollMessage, setPollMessage] = useState("");
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    if (!storyId || pollStatus !== "polling") return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/authors/me/stories/${storyId}`);
        const story = res.data.data;
        if (story.status === "published") {
          clearInterval(interval);
          setPollStatus("success");
          setPollMessage("Your story has been published successfully!");
          if (onSuccess) onSuccess();
        } else if (story.status === "rejected") {
          clearInterval(interval);
          setPollStatus("failed");
          setPollMessage("Your story was rejected during verification.");
          if (story.verification?.issues) {
            setIssues(story.verification.issues);
          }
        } else {
          setPollMessage(
            story.status === "draft"
              ? "Story is being processed..."
              : "Analyzing your story...",
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
    setPollMessage("Story submitted! Analyzing your story...");
    setIssues([]);
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
  }, []);

  return { pollStatus, pollMessage, issues, startPolling, stopPolling, resetPolling };
}
