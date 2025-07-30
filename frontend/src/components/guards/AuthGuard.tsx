// frontend/src/components/guards/AuthGuard.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// A interface de props agora usa React.ReactNode, que aceita qualquer filho válido.
interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isInitialized } = useAuth();
  const location = useLocation();

  // Enquanto o contexto de autenticação está sendo inicializado,
  // podemos mostrar um loader para evitar piscar a tela de login.
  if (!isInitialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  // Se a inicialização terminou e o usuário não está autenticado,
  // redireciona para o login, guardando a página que ele tentou acessar.
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se o usuário está autenticado, renderiza os componentes filhos.
  // Usar um Fragment <> garante que múltiplos filhos sejam tratados corretamente.
  return <>{children}</>;
}
