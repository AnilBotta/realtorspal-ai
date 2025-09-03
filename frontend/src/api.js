import axios from "axios";

const RAW_BASE = process.env.REACT_APP_BACKEND_URL || '/api';
// Ensure we always target the backend '/api' path per ingress rules
const API_BASE = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE.replace(/\/$/, '')}/api`;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000, // 10 second timeout
});

// Create a fallback API instance for local backend
const localApi = axios.create({
  baseURL: 'http://localhost:8001/api',
  timeout: 5000, // 5 second timeout
});

// Enhanced demo login with fallback
export const demoLogin = async () => {
  try {
    console.log('Trying external backend:', API_BASE);
    return await api.get('/auth/demo');
  } catch (error) {
    console.log('External backend failed, trying local backend:', error.message);
    try {
      return await localApi.get('/auth/demo');
    } catch (localError) {
      console.error('Both backends failed:', localError);
      throw error; // Throw the original external error
    }
  }
};

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