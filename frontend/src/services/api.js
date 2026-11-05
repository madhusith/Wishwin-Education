import axios from 'axios';

const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const defaultBaseURL = isProduction
  ? 'https://palm-ide-atlanta-reminder.trycloudflare.com/api'
  : 'http://localhost:5001/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || defaultBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('wishwin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to catch 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or unauthorized
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        localStorage.removeItem('wishwin_token');
        localStorage.removeItem('wishwin_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
