// /frontend/src/services/api.ts
import axios from 'axios';

const AUTH_TOKEN_KEY = 'caipirao-auth-token';

// CORREÇÃO: Altere a URL base para apontar para o seu backend local.
// Certifique-se de que a porta (ex: 3000 ) é a mesma em que seu backend está rodando.
const api = axios.create({
  baseURL: 'https://api-caipirao-maurizzio-procopio.onrender.com', // <-- MUDE AQUI
} );

// Interceptor para adicionar o token de autenticação (código continua o mesmo)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
