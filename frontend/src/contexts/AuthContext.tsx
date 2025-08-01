// frontend/src/contexts/AuthContext.tsx

import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // 1. Importar a biblioteca
import api from '../services/api';
import { toast } from 'sonner';

const AUTH_TOKEN_KEY = 'caipirao-auth-token';

// 2. Definir a interface para os dados do usuário decodificados do token
interface UserPayload {
  id: number;
  email: string;
  perfil: 'ADMIN' | 'USER'; // Assumindo que os perfis podem ser estes
  iat: number;
  exp: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserPayload | null; // 3. Adicionar o usuário ao contexto
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserPayload | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // 4. Efeito para carregar e decodificar o token ao iniciar a aplicação
  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      try {
        const decodedUser = jwtDecode<UserPayload>(token);
        // Verifica se o token não expirou
        if (decodedUser.exp * 1000 > Date.now()) {
          setUser(decodedUser);
          setIsAuthenticated(true);
        } else {
          // Se o token expirou, limpa o armazenamento
          localStorage.removeItem(AUTH_TOKEN_KEY);
        }
      } catch (error) {
        console.error("Falha ao decodificar o token:", error);
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    }
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const response = await api.post('/auth/login', { email, senha: pass });
      const { token } = response.data;
      
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      
      const decodedUser = jwtDecode<UserPayload>(token);
      setUser(decodedUser);
      setIsAuthenticated(true);
      
      toast.success('Login realizado com sucesso!');
      navigate('/');

    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Falha no login. Verifique suas credenciais.');
      throw error;
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null); // Limpa os dados do usuário
    setIsAuthenticated(false);
    navigate('/login');
    toast.info('Você foi desconectado.');
  }, [navigate]);

  // 5. Passar o 'user' no valor do provider
  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
