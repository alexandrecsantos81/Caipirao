// /frontend/src/contexts/AuthContext.tsx

import React, { createContext, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'sonner';

// Definindo a chave do token como uma constante para evitar erros de digitação.
const AUTH_TOKEN_KEY = 'caipirao-auth-token';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  // CORREÇÃO 1: Simplificação do Estado.
  // A inicialização do estado agora é feita em um único lugar.
  // A função dentro do useState só roda uma vez, na primeira renderização,
  // tornando o useEffect redundante para esta tarefa.
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    return !!token; // Retorna true se o token existir, false caso contrário.
  });

  // O estado 'isInitialized' foi removido para simplificar, pois a lógica acima já resolve a inicialização.

  const login = async (email: string, pass: string) => {
    try {
      const response = await api.post('/auth/login', { email, senha: pass });
      const { token } = response.data;
      
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      
      // O interceptor do Axios já adiciona o token nos headers das próximas requisições.
      
      setIsAuthenticated(true);
      toast.success('Login realizado com sucesso!');
      
      // Após o login, redireciona para a página principal.
      navigate('/');

    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Falha no login. Verifique suas credenciais.');
      throw error; // Lança o erro para que o formulário de login possa tratá-lo (ex: desabilitar o loading).
    }
  };

  // CORREÇÃO 2: Adicionado o redirecionamento no logout.
  // Usamos useCallback para otimização, garantindo que a função não seja recriada a cada renderização.
  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setIsAuthenticated(false);
    
    // Após o logout, redireciona o usuário para a página de login.
    navigate('/login');
    toast.info('Você foi desconectado.');
  }, [navigate]);


  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
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
