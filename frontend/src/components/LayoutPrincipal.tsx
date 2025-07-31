// /frontend/src/components/LayoutPrincipal.tsx

import { Link, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Verifique se o caminho para seu AuthContext está correto

// Ícones para o menu (exemplo, você pode usar os seus)
import { Home, Users, Package, DollarSign } from 'lucide-react';

export function LayoutPrincipal() {
  const { isAuthenticated } = useAuth();

  // 1. LÓGICA DE PROTEÇÃO
  // Se o hook disser que o usuário não está autenticado,
  // o componente <Navigate> o redirecionará para a página de login.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. ESTRUTURA DO LAYOUT
  // Se o usuário estiver autenticado, o código abaixo será renderizado.
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      
      {/* ===== Coluna do Menu Lateral (Sidebar) ===== */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <Package className="h-6 w-6" />
              <span>Caipirão 2.0</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <Link
                to="/"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                to="/clientes"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Users className="h-4 w-4" />
                Clientes
              </Link>
              <Link
                to="/movimentacoes" // Exemplo de outra rota
                className="flex items-center gap-3 rounded-lg bg-accent px-3 py-2 text-primary transition-all hover:text-primary"
              >
                <DollarSign className="h-4 w-4" />
                Movimentações
              </Link>
              <Link
                to="/produtos" // Exemplo de outra rota
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Package className="h-4 w-4" />
                Produtos
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* ===== Coluna do Conteúdo Principal ===== */}
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          {/* Aqui você pode adicionar um cabeçalho, menu do usuário, etc. */}
          <div className="w-full flex-1">
            {/* Pode ter um campo de busca aqui no futuro */}
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {/* 
            O <Outlet> é a parte mais importante. 
            É aqui que o React Router irá "encaixar" a página da rota atual.
            Se você estiver na URL "/clientes", o componente <Clientes /> será renderizado aqui.
          */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
