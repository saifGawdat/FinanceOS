import API from "./axios";

export const getRecurring = () =>
  API.get("/recurring").then((res) => res.data);

export const createRecurring = (data) =>
  API.post("/recurring", data).then((res) => res.data);

export const updateRecurring = (id, data) =>
  API.patch(`/recurring/${id}`, data).then((res) => res.data);

export const toggleRecurring = (id) =>
  API.patch(`/recurring/${id}/toggle`).then((res) => res.data);

export const deleteRecurring = (id) =>
  API.delete(`/recurring/${id}`).then((res) => res.data);
