import api from "@/api/axios";

function unwrap(res) {
  const body = res.data;
  if (body && typeof body === "object" && "success" in body) {
    if (!body.success) throw new Error(body.message || "Request failed");
    return body.data;
  }
  return body;
}

export const tournamentApi = {
  list: (params) => api.get("/tournaments", { params }).then(unwrap),
  getById: (identifier) => api.get(`/tournaments/${identifier}`).then(unwrap),
  create: (payload) => api.post("/tournaments", payload).then(unwrap),
  update: (identifier, payload) =>
    api.patch(`/tournaments/${identifier}`, payload).then(unwrap),
  updateConfig: (identifier, payload) =>
    api.patch(`/tournaments/${identifier}/config`, payload).then(unwrap),
  addRace: (identifier, payload) =>
    api.post(`/tournaments/${identifier}/races`, payload).then(unwrap),
  updateRace: (identifier, raceId, payload) =>
    api
      .patch(`/tournaments/${identifier}/races/${raceId}`, payload)
      .then(unwrap),
  addRegistration: (identifier, payload) =>
    api.post(`/tournaments/${identifier}/registrations`, payload).then(unwrap),
  getRegistrations: (identifier) =>
    api.get(`/tournaments/${identifier}/registrations`).then(unwrap),
  addResults: (identifier, raceId, payload) =>
    api
      .post(`/tournaments/${identifier}/races/${raceId}/results`, payload)
      .then(unwrap),
  getResults: (identifier) =>
    api.get(`/tournaments/${identifier}/results`).then(unwrap),
};
