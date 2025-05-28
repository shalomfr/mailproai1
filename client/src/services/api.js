import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh', {
            refreshToken: refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;
          localStorage.setItem('token', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

export const emailAPI = {
  getAccounts: () => api.get('/accounts'),
  getAccount: (id) => api.get(`/accounts/${id}`),
  createAccount: (accountData) => api.post('/accounts', accountData),
  updateAccount: (id, accountData) => api.put(`/accounts/${id}`, accountData),
  deleteAccount: (id) => api.delete(`/accounts/${id}`),
  testAccount: (id) => api.post(`/accounts/${id}/test`),
  syncAccount: (id) => api.post(`/accounts/${id}/sync`),
  getDiagnostic: (id) => api.get(`/accounts/${id}/diagnostic`),
  testQuickConnection: (email, password, provider) => 
    api.post('/accounts/test-quick', { email, password, provider }),
  
  getProviders: () => api.get('/providers'),
  getPopularProviders: () => api.get('/providers/popular'),
  getProvider: (domain) => api.get(`/providers/${domain}`),
  detectProvider: (email) => api.post('/providers/detect', { email }),
  validateSettings: (provider, settings) => 
    api.post('/providers/validate', { provider, settings }),
  getSuggestions: (query) => api.get(`/providers/suggest?q=${encodeURIComponent(query)}`),
  searchProviders: (query) => api.get(`/providers/search/${encodeURIComponent(query)}`),
  getDocumentation: (domain) => api.get(`/providers/domain/${domain}/documentation`),
};

export default api; 