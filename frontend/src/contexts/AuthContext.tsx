// /frontend/src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // O 'api' agora já tem o interceptor
import { toast } from 'sonner';

// Use a mesma chave que definimos no serviço da api.ts
const AUTH_TOKEN_KEY = 'caipirao-auth-token';

interface AuthContextType {
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verifica o token ao inicializar a aplicação
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      setIsAuthenticated(true);
    }
    setIsInitialized(true);
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const response = await api.post('/auth/login', { email, senha: pass });
      const { token } = response.data;
      
      // Salva o token no localStorage com a chave padronizada
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      
      setIsAuthenticated(true);
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Falha no login');
      throw error;
    }
  };

  const logout = () => {
    // Remove o token do localStorage usando a chave padronizada
    localStorage.removeItem(AUTH_TOKEN_KEY);
    
    setIsAuthenticated(false);
    navigate('/login');
  };

  // O 'api.defaults.headers' não é mais necessário aqui, pois o interceptor cuida disso.
  return (
    <AuthContext.Provider value={{ isAuthenticated, isInitialized, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
