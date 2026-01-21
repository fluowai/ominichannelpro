/// <reference types="vite/client" />
import axios from 'axios';

// 🚀 Resilient API URL Logic
// 1. Check if VITE_API_URL is set (usually via .env)
// 2. If not, and we are in dev mode, use '/api' to leverage Vite's proxy
// 3. If in production (like Vercel), we try to infer it or fallback to the local default
const getBaseURL = () => {
  // 1. Manually set environment variable (highest priority)
  let envUrl = import.meta.env.VITE_API_URL;
  
  if (envUrl) {
    // FIX: Auto-add https if missing (common user error)
    if (!envUrl.startsWith('http')) {
      envUrl = `https://${envUrl}`;
    }
    return envUrl;
  }
  
  // 2. Local Environment Logic
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return '/api';
  }
  
  // 3. Production Fallback
  return '/api';
};

// Sanitization and Enforcement
const cleanUrl = getBaseURL().replace(/\/$/, ''); // Remove trailing slash first
const API_URL = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;

console.log(`[API Config] Base URL set to: ${API_URL}`);
console.log(`[API Config] Current Origin: ${window.location.origin}`);

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    // Try multiple sources for the token
    let token = localStorage.getItem('accessToken');
    
    if (!token) {
      // Fallback to auth-storage (Zustand persist)
      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          token = parsed?.state?.accessToken;
        }
      } catch (e) {
        console.error('Error parsing auth storage:', e);
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log all requests for debugging
    const fullUrl = config.baseURL ? `${config.baseURL}${config.url}` : config.url;
    console.log(`[API Request] ${config.method?.toUpperCase()} ${fullUrl}`);
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        // No refresh token, redirect to login
        console.log('No refresh token found, redirecting to login');
        localStorage.clear();
        window.location.href = '/#/login';
        return Promise.reject(error);
      }

      try {
        console.log('Refreshing access token...');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { useAuthStore } = await import('../store/authStore');
        useAuthStore.getState().setTokens(data.accessToken, data.refreshToken || refreshToken);
        
        console.log('Token refreshed and store updated successfully');
        
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        processQueue(null, data.accessToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Refresh token expired, redirect to login
        localStorage.clear();
        window.location.href = '/#/login';
        return Promise.reject(refreshError);
      }
    }

    console.error('[API Error]', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
  
  me: () =>
    api.get('/auth/me'),
};

// Agents API
export const agentsAPI = {
  getAll: () => api.get('/agents'),
  getById: (id: string) => api.get(`/agents/${id}`),
  create: (data: any) => api.post('/agents', data),
  update: (id: string, data: any) => api.put(`/agents/${id}`, data),
  delete: (id: string) => api.delete(`/agents/${id}`),
};

// Conversations API
export const conversationsAPI = {
  getAll: (filters?: { platform?: string; status?: string; integrationId?: string }) => 
    api.get('/conversations', { params: filters }),
  getById: (id: string) => api.get(`/conversations/${id}`),
  sendMessage: (id: string, data: { text: string; attachments?: any }) =>
    api.post(`/conversations/${id}/messages`, data),
  assignTo: (id: string, userId: string) =>
    api.patch(`/conversations/${id}/assign`, { assignedToId: userId }),
  updateStatus: (id: string, status: string) =>
    api.patch(`/conversations/${id}/status`, { status }),
  deleteMessage: (id: string, messageId: string) =>
    api.delete(`/conversations/${id}/messages/${messageId}`),
};

// Campaigns API
export const campaignsAPI = {
  getAll: () => api.get('/campaigns'),
  create: (data: any) => api.post('/campaigns', data),
  getStats: (id: string) => api.get(`/campaigns/${id}/stats`),
  delete: (id: string) => api.delete(`/campaigns/${id}`),
};

// Integrations API
export const integrationsAPI = {
  getAll: () => api.get('/integrations'),
  create: (data: any) => {
    // WUZAPI needs specific endpoint
    if (data.type === 'WUZAPI') {
      return api.post('/integrations/wuzapi/create', data);
    }
    return api.post('/integrations', data);
  },
  test: (id: string) => api.post(`/integrations/${id}/test`),
  delete: (id: string) => api.delete(`/integrations/${id}`),
  connect: (id: string) => api.post(`/integrations/${id}/connect`),
  checkStatus: (id: string) => api.get(`/integrations/${id}/status`),
  update: (id: string, data: any) => api.patch(`/integrations/${id}`, data),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getHistory: () => api.get('/dashboard/history'),
};

// Users API
export const usersAPI = {
  updateProfile: (data: { name?: string; bio?: string; avatar?: string }) =>
    api.put('/users/profile', data),
  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/users/password', data),
  getAll: () => api.get('/users'),
};
