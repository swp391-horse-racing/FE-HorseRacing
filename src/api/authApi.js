import api from "@/api/axios";
import { deriveUsername } from "@/utils/validation";

function unwrap(res) {
  const body = res.data;
  if (body && typeof body === "object" && "success" in body) {
    if (!body.success) throw new Error(body.message || "Request failed");
    return body.data;
  }
  return body;
}

export const authApi = {
  register: (payload) =>
    api
      .post("/users/register", {
        username: payload.username || deriveUsername(payload.email),
        fullName: payload.fullName || payload.name,
        email: payload.email,
        password: payload.password,
        phone: payload.phone,
      })
      .then(unwrap),

  login: (payload) => api.post("/users/login", payload).then(unwrap),

  loginGoogle: (idToken) => api.post("/auth/google", { idToken }).then(unwrap),

  loginFacebook: (accessToken) =>
    api.post("/auth/facebook", { accessToken }).then(unwrap),

  logout: () => api.post("/auth/logout").then(unwrap),

  getMe: () => api.get("/users/me").then(unwrap),

  forgotPassword: (email) =>
    api.post("/auth/forgot-password", { email }).then(unwrap),

  resetPassword: (payload) =>
    api.post("/auth/reset-password", payload).then(unwrap),
};
