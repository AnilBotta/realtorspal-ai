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

// AI Agent System APIs
export const getAIAgents = (user_id) => api.get(`/ai-agents`, { params: { user_id } });
export const updateAIAgent = (agent_id, config, user_id) => api.put(`/ai-agents/${agent_id}`, config, { params: { user_id } });
export const getAgentActivities = (user_id, limit = 50) => api.get(`/ai-agents/activities`, { params: { user_id, limit } });
export const createAgentActivity = (activity, user_id) => api.post(`/ai-agents/activities`, activity, { params: { user_id } });
export const getApprovalQueue = (user_id) => api.get(`/ai-agents/approvals`, { params: { user_id } });
export const createApprovalRequest = (approval, user_id) => api.post(`/ai-agents/approvals`, approval, { params: { user_id } });
export const handleApprovalDecision = (approval_id, decision, user_id) => api.put(`/ai-agents/approvals/${approval_id}`, decision, { params: { user_id } });
export const orchestrateAgents = (task_data, user_id) => api.post(`/ai-agents/orchestrate`, task_data, { params: { user_id } });

// Nurturing AI APIs
export const generateNurturingPlan = (user_id, lead_id) => api.post(`/nurturing-ai/generate-plan/${user_id}`, null, { params: { lead_id } });
export const getNurturingActivities = (user_id, date = null, status = null) => {
  const params = { user_id };
  if (date) params.date = date;
  if (status) params.status = status;
  return api.get(`/nurturing-ai/activities/${user_id}`, { params });
};
export const updateActivityStatus = (activity_id, status, user_id, notes = null) => {
  const params = { status, user_id };
  if (notes) params.notes = notes;
  return api.put(`/nurturing-ai/activities/${activity_id}`, null, { params });
};
export const analyzeReply = (user_id, lead_id, reply_text) => api.post(`/nurturing-ai/analyze-reply`, null, { params: { user_id, lead_id, reply_text } });

// Main Orchestrator AI APIs
export const getLiveActivityStream = (user_id, limit = 50) => api.get(`/orchestrator/live-activity-stream/${user_id}`, { params: { limit } });
export const getAgentRuns = (user_id, agent_code = null, limit = 100) => {
  const params = { limit };
  if (agent_code) params.agent_code = agent_code;
  return api.get(`/orchestrator/agent-runs/${user_id}`, { params });
};
export const getAgentTasks = (user_id, status = null, limit = 100) => {
  const params = { limit };
  if (status) params.status = status;
  return api.get(`/orchestrator/agent-tasks/${user_id}`, { params });
};
export const executeAgent = (agent_code, lead_id, user_id, context = null) => {
  const params = { agent_code, lead_id, user_id };
  if (context) params.context = context;
  return api.post(`/orchestrator/execute-agent`, null, { params });
};

export default api;