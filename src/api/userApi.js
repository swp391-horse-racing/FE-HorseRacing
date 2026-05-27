import api from "@/api/axios";

function unwrap(res) {
  const body = res.data;
  if (body && typeof body === "object" && "success" in body) {
    if (!body.success) throw new Error(body.message || "Request failed");
    return body.data;
  }
  return body;
}

export const userApi = {
  getAll: (params) => api.get("/users", { params }).then(unwrap),
  getByRole: (role) => api.get("/users", { params: { role } }).then(unwrap),
  getById: (id) => api.get(`/users/${id}`).then(unwrap),
};
