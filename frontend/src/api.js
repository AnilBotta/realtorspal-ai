import axios from "axios";

const RAW_BASE = process.env.REACT_APP_BACKEND_URL || '/api';
// Ensure we always target the backend '/api' path per ingress rules
const API_BASE = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE.replace(/\/$/, '')}/api`;

const api = axios.create({
  baseURL: API_BASE,
});

export const login = (email, password) => api.post(`/api/auth/login`, { email, password });

export const getSettings = (user_id) => api.get(`/api/settings`, { params: { user_id } });
export const saveSettings = (payload) => api.post(`/api/settings`, payload);

export const getLeads = (user_id) => api.get(`/api/leads`, { params: { user_id } });
export const createLead = (payload) => api.post(`/api/leads`, payload);
export const updateLeadStage = (lead_id, stage) => api.put(`/api/leads/${lead_id}/stage`, { stage });

export const getDashboardAnalytics = (user_id) => api.get(`/analytics/dashboard`, { params: { user_id } });

export const chat = (payload) => api.post(`/ai/chat`, payload);

export default api;