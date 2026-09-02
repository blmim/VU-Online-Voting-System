import axios from 'axios';

const API_TIMEOUT_MS = 15000;

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: API_TIMEOUT_MS,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timed out — please check the server is running and try again.'));
    }
    return Promise.reject(error);
  },
);

export default api;
