import axios from "axios";

const RAW_BASE = process.env.REACT_APP_BACKEND_URL || '/api';
// Ensure we always target the backend '/api' path per ingress rules
const API_BASE = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE.replace(/\/$/, '')}/api`;

const api = axios.create({
  baseURL: API_BASE,
});

export const demoLogin = () => api.get(`/auth/demo`);
export const login = (email, password) => api.post(`/auth/login`, { email, password });

export const getSettings = (user_id) => api.get(`/settings`, { params: { user_id } });
export const saveSettings = (payload) => api.post(`/settings`, payload);

export const getLeads = (user_id) => api.get(`/leads`, { params: { user_id } });
export const createLead = (payload) => api.post(`/leads`, payload);
export const updateLeadStage = (lead_id, stage) => api.put(`/leads/${lead_id}/stage`, { stage });
export const updateLead = (lead_id, payload) => api.put(`/leads/${lead_id}`, payload);
export const deleteLead = (lead_id) => api.delete(`/leads/${lead_id}`);
export const importLeads = (payload) => api.post(`/leads/import`, payload);

export const getDashboardAnalytics = (user_id) => api.get(`/analytics/dashboard`, { params: { user_id } });

export const chat = (payload) => api.post(`/ai/chat`, payload);

export default api;