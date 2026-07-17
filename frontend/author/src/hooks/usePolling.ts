import { useEffect, useState, useCallback } from "react";
import * as storyApi from "../api/stories";

import type { VerificationIssue } from "../types";

type PollStatus = "idle" | "polling" | "success" | "failed";

interface UsePollingReturn {
  pollStatus: PollStatus;
  pollMessage: string;
  issues: VerificationIssue[];
  startPolling: (storyId: string) => void;
  stopPolling: () => void;
  resetPolling: () => void;
}

export function usePolling(onSuccess?: () => void): UsePollingReturn {
  const [storyId, setStoryId] = useState<string | null>(null);
  const [pollStatus, setPollStatus] = useState<PollStatus>("idle");
  const [pollMessage, setPollMessage] = useState("");
  const [issues, setIssues] = useState<VerificationIssue[]>([]);

  useEffect(() => {
    if (!storyId || pollStatus !== "polling") return;

    const interval = setInterval(async () => {
      try {
        const story = await storyApi.getMyStory(storyId);
        if (story.status === "published") {
          clearInterval(interval);
          setPollStatus("success");
          setPollMessage("Your story has been published successfully!");
          onSuccess?.();
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

  const startPolling = useCallback((id: string) => {
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

  return {
    pollStatus,
    pollMessage,
    issues,
    startPolling,
    stopPolling,
    resetPolling,
  };
}
