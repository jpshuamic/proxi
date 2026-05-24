import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://proxi-production.up.railway.app';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Automatically attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('proxi_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  getMe: () => api.get('/api/auth/me'),
};

export const listingsAPI = {
  getAll: (params) => api.get('/api/listings', { params }),
  getOne: (id) => api.get(`/api/listings/${id}`),
  create: (data) => api.post('/api/listings', data),
  getMine: () => api.get('/api/listings/my/listings'),
};

export const tasksAPI = {
  getAll: (params) => api.get('/api/tasks', { params }),
  getOne: (id) => api.get(`/api/tasks/${id}`),
  create: (data) => api.post('/api/tasks', data),
  apply: (id, data) => api.post(`/api/tasks/${id}/apply`, data),
  getMine: () => api.get('/api/tasks/my/tasks'),
};

export const walletAPI = {
  getWallet: () => api.get('/api/wallet'),
  addFunds: (data) => api.post('/api/wallet/fund', data),
  fundEscrow: (data) => api.post('/api/wallet/escrow', data),
  releaseEscrow: (data) => api.post('/api/wallet/escrow/release', data),
  getTransactions: () => api.get('/api/wallet/transactions'),
};

export const paystackAPI = {
  initialize: (data) => api.post('/api/paystack/initialize', data),
  verify: (reference) => api.get(`/api/paystack/verify/${reference}`),
};

export const messagesAPI = {
  getConversations: () => api.get('/api/messages'),
  getMessages: (conversationId) => api.get(`/api/messages/${conversationId}`),
  sendMessage: (data) => api.post('/api/messages/send', data),
  startConversation: (data) => api.post('/api/messages/start', data),
};

export default api;