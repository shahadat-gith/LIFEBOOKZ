import api from "./client";

import type { Story, CreateStoryRequest, UpdateStoryRequest } from "../types";

export const create = async (payload: CreateStoryRequest) => {
  const { data } = await api.post("/stories", payload);

  return data.data as Story;
};

export const getMyStory = async (storyId: string) => {
  const { data } = await api.get(`/authors/me/stories/${storyId}`);

  return data.data as Story;
};

export const update = async (storyId: string, payload: UpdateStoryRequest) => {
  const { data } = await api.patch(`/stories/${storyId}`, payload);

  return data.data as Story;
};

export const remove = async (storyId: string) => {
  const { data } = await api.delete(`/stories/${storyId}`);

  return data.data;
};

export const verify = async (storyId: string) => {
  const { data } = await api.post(`/stories/${storyId}/verify`);

  return data.data as {
    canProceed: boolean;
    issues: Array<{ category: string; severity: string; description: string; suggestion: string }>;
    overallAssessment: string;
  };
};

export const publish = async (storyId: string) => {
  const { data } = await api.post(`/stories/${storyId}/publish`);

  return data.data as Story;
};
