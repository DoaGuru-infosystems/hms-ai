import axios from 'axios';

/**
 * Centralized Axios Instance for HMS Super Admin (master portal)
 */
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('superAdminToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Unauthorized / Expired session
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clear invalid credentials
      localStorage.removeItem('superAdminToken');
      localStorage.removeItem('superAdminUser');
      
      alert("Session Expired: Unauthorized access. You are being redirected to login.");
      // Auto-logout: force reload so App.jsx picks up the null token and shows Login
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Super Admin API Service Functions
export const superAdminAuth = {
  login: (email, password) => api.post('/superadmin/auth/login', { email, password })
};

export const superAdminDashboard = {
  getStats: () => api.get('/superadmin/dashboard/stats'),
  getAuditLogs: () => api.get('/superadmin/dashboard/logs')
};

export const superAdminHospitals = {
  getAll: (params = {}) => {
    const { page = 1, limit = 10, search = '' } = params;
    return api.get(`/superadmin/hospitals?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
  },
  onboard: (hospitalData) => api.post('/superadmin/hospitals/onboard', hospitalData),
  retryProvisioning: (hospitalId) => api.post(`/superadmin/hospitals/retry/${hospitalId}`),
  getById: (hospitalId) => api.get(`/superadmin/hospitals/${hospitalId}`),
  updateStatus: (hospitalId, status) => api.patch(`/superadmin/hospitals/${hospitalId}/status`, { status })
};

export const superAdminCustomFields = {
  getByForm: (formName) => api.get(`/superadmin/custom-fields/${formName}`),
  create: (data) => api.post('/superadmin/custom-fields', data),
  delete: (id) => api.delete(`/superadmin/custom-fields/${id}`)
};

export default api;
