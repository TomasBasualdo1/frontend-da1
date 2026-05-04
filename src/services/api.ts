import axios from 'axios';
import { getItemAsync, deleteItemAsync } from '../utils/storage';

// TODO: Cambiar a la URL del backend en producción
const BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: agrega el Bearer token a cada request
api.interceptors.request.use(
  async (config) => {
    const token = await getItemAsync('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: maneja respuestas 401 globalmente
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await deleteItemAsync('access_token');
      // El contexto de auth se encargará de redirigir al login
    }
    return Promise.reject(error);
  }
);

export default api;
