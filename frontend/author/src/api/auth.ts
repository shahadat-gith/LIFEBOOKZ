import api from "./client";
export const authApi = {
  login: (d: { email: string; password: string }) =>
    api.post("/authors/login", d),
  register: (d: Record<string, unknown> | FormData) =>
    api.post("/authors/register", d),
};
