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
  getAll: () => api.get('/superadmin/hospitals'),
  onboard: (hospitalData) => api.post('/superadmin/hospitals/onboard', hospitalData),
  retryProvisioning: (hospitalId) => api.post(`/superadmin/hospitals/retry/${hospitalId}`)
};

export const superAdminCustomFields = {
  getByForm: (formName) => api.get(`/superadmin/custom-fields/${formName}`),
  create: (data) => api.post('/superadmin/custom-fields', data),
  delete: (id) => api.delete(`/superadmin/custom-fields/${id}`)
};

export default api;
