// /frontend/src/services/api.ts
import axios from 'axios';

// Chave usada para buscar o token no localStorage. É uma boa prática usar uma constante.
const AUTH_TOKEN_KEY = 'caipirao-auth-token';

// Crie a instância do axios com a URL base da sua API
const api = axios.create({
  baseURL: 'https://api-caipirao-maurizzio-procopio.onrender.com',
} );

// =================================================================
//          INÍCIO DA CORREÇÃO: AXIOS REQUEST INTERCEPTOR
// =================================================================

// Este interceptor é executado ANTES de cada requisição ser enviada.
api.interceptors.request.use(
  (config) => {
    // 1. Busca o token de autenticação do localStorage.
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    // 2. Se o token existir, anexa-o ao cabeçalho 'Authorization'.
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 3. Retorna a configuração modificada para que a requisição prossiga.
    return config;
  },
  (error) => {
    // Em caso de erro na configuração da requisição, rejeita a promise.
    return Promise.reject(error);
  }
);

// =================================================================
//                     FIM DA CORREÇÃO
// =================================================================

export default api;
