import axios from "axios";

const API_BASE = process.env.REACT_APP_BACKEND_URL; // provided by environment

const api = axios.create({
  baseURL: API_BASE,
});

export const login = (email, password) => api.post(`/auth/login`, { email, password });

export const getSettings = (user_id) => api.get(`/settings`, { params: { user_id } });
export const saveSettings = (payload) => api.post(`/settings`, payload);

export const getLeads = (user_id) => api.get(`/leads`, { params: { user_id } });
export const createLead = (payload) => api.post(`/leads`, payload);
export const updateLeadStage = (lead_id, stage) => api.put(`/leads/${lead_id}/stage`, { stage });

export const getDashboardAnalytics = (user_id) => api.get(`/analytics/dashboard`, { params: { user_id } });

export const chat = (payload) => api.post(`/ai/chat`, payload);

export default api;