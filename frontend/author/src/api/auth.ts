import api from "./client";

import type { Author, AuthResponse, LoginRequest } from "../types";

export const register = async (payload: FormData) => {
  const { data } = await api.post("/authors/register", payload);

  return data.data as AuthResponse;
};

export const login = async (payload: LoginRequest) => {
  const { data } = await api.post("/authors/login", payload);

  return data.data as AuthResponse;
};

export const logout = async () => {
  const { data } = await api.post("/authors/logout");

  return data.data;
};

export const getMe = async () => {
  const { data } = await api.get("/authors/me");

  return data.data as Author;
};

export const updateMe = async (payload: FormData | Partial<Author>) => {
  const { data } = await api.patch("/authors/me", payload);

  return data.data as Author;
};

export const getProfile = async (authorId: string) => {
  const { data } = await api.get(`/authors/${authorId}`);

  return data.data as Author;
};

export const getMyStories = async () => {
  const { data } = await api.get("/authors/me/stories");

  return data.data;
};
